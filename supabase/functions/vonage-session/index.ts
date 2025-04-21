
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

    // Generate JWT for OpenTok API
    const jwt = await generateJwtToken(apiKey, apiSecret);

    // Session creation
    const sessionId = await createVonageSession(jwt);

    // Token generation
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(
        `Failed to generate token: ${tokenResponse.status} - ${errorText}`
      );
    }
    const tokenResult = await tokenResponse.json();
    if (!tokenResult.token) {
      throw new Error("No token in response");
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
