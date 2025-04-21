import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { generateJwtToken } from "./generateJwtToken.ts";
import { createVonageSession } from "./createVonageSession.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
        auth: {
          persistSession: false, // Fixed: disable session persistence in Edge Functions
        }
      }
    );
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Parse body
    const { conversationId, recipientId } = await req.json();
    if (!conversationId || !recipientId) {
      throw new Error("Missing required parameters");
    }

    // Vonage credentials
    const apiKey = Deno.env.get("VONAGE_API_KEY");
    const apiSecret = Deno.env.get("VONAGE_API_SECRET");
    if (!apiKey || !apiSecret) {
      throw new Error("Vonage API credentials not configured");
    }

    // Generate JWT for OpenTok API (returns {jwt, payload})
    const { jwt, payload } = await generateJwtToken(apiKey, apiSecret);

    // Log JWT and its decoded payload prior to sending to Vonage
    console.log("[Vonage] Outgoing JWT", jwt);
    console.log("[Vonage] JWT payload (decoded, should match expectations)", payload);

    // --- Optionally, decode and validate JWT structure ---
    // Deno doesn't have a built-in jwt.decode, so we decode manually for logs:
    function tryDecodePart(part: string) {
      try { return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))); }
      catch { return null; }
    }
    const [hPart, pPart, sPart] = jwt.split(".");
    const decodedHeader = tryDecodePart(hPart);
    const decodedPayload = tryDecodePart(pPart);

    console.log("[Vonage] Decoded JWT header (pre-check)", decodedHeader);
    console.log("[Vonage] Decoded JWT payload (pre-check)", decodedPayload);
    // (not verifying signature here; upstream already generated it)

    // Session creation (adds logging)
    let sessionId: string;
    try {
      sessionId = await createVonageSession(jwt);
      console.log("[Vonage] Created sessionId", sessionId);
    } catch (err) {
      console.error("[Vonage] Error when creating session", err?.message || err);
      throw err;
    }

    // Token generation (adds logging)
    let tokenResult;
    try {
      const tokenResponse = await fetch(
        `https://api.opentok.com/v2/project/${apiKey}/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-OPENTOK-AUTH": jwt,
            Accept: "application/json",
          },
          body: new URLSearchParams({
            session_id: sessionId,
            role: "publisher",
            data: JSON.stringify({ userId: user.id }),
            expire_time: (
              Math.floor(Date.now() / 1000) + 3600
            ).toString(), // 1 hour
          }).toString(),
        }
      );

      // Log details of Vonage response for debugging
      console.log("[Vonage] Token response status", tokenResponse.status);
      const tokenRespText = await tokenResponse.text();

      try {
        tokenResult = JSON.parse(tokenRespText);
      } catch (e) {
        console.error("[Vonage] Failed to parse token API response", tokenRespText);
        throw new Error("Failed to parse token API response: " + tokenRespText);
      }

      if (!tokenResponse.ok) {
        console.error("[Vonage] Error response from token API", tokenResult);
        throw new Error(
          `Failed to generate token: ${tokenResponse.status} - ${tokenRespText}`
        );
      }
      if (!tokenResult.token) {
        console.error("[Vonage] No token in response", tokenResult);
        throw new Error("No token in response");
      }
      console.log("[Vonage] Successfully obtained token");
    } catch (err) {
      console.error("[Vonage] Error when generating token", err?.message || err);
      throw err;
    }

    // Store session info in database
    const sessionKey = `call:${conversationId}:${[user.id, recipientId]
      .sort()
      .join("-")}`;

    const { error: insertError } = await supabaseClient
      .from("call_sessions")
      .insert({
        session_key: sessionKey,
        session_id: sessionId,
        created_by: user.id,
        conversation_id: conversationId,
      });

    if (insertError) {
      throw new Error(`Failed to store session: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        sessionId,
        token: tokenResult.token,
        apiKey,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Add detailed error logs
    console.error("[EdgeFunction] Error Response", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
