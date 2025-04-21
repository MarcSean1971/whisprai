
// Split and refactor of monolithic Vonage session handler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateJwtToken } from "./generateJwtToken.ts";
import { corsHeaders } from "./headers.ts";
import { authenticateUser } from "./auth.ts";
import { storeSession, updateActiveCallWithSessionId } from "./db.ts";
import { createSession, createToken } from "./vonage.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const { user, supabaseClient } = await authenticateUser(req);

    // Parse body
    const { conversationId, recipientId, callId } = await req.json();
    if (!conversationId || !recipientId) {
      throw new Error("Missing required parameters");
    }

    // Vonage credentials
    const apiKey = Deno.env.get("VONAGE_API_KEY");
    const apiSecret = Deno.env.get("VONAGE_API_SECRET");
    const applicationId = Deno.env.get("VONAGE_APPLICATION_ID");
    if (!apiKey || !apiSecret) {
      throw new Error("Vonage API credentials (API key or secret) not configured");
    }
    if (!applicationId) {
      throw new Error("Vonage Application ID not configured");
    }

    // Generate JWT
    const { jwt } = await generateJwtToken(apiKey, apiSecret);
    if (!jwt || typeof jwt !== "string" || jwt.split(".").length !== 3) {
      throw new Error("Failed to generate valid JWT token");
    }

    // Create session
    const sessionId = await createSession(jwt, applicationId);

    // Generate token for the session
    const token = await createToken({
      apiKey,
      jwt,
      sessionId,
      userId: user.id,
    });

    // Store session in DB
    const sessionKey = `call:${conversationId}:${[user.id, recipientId].sort().join("-")}`;
    await storeSession(supabaseClient, sessionKey, sessionId, user.id, conversationId);

    // Optionally update active_calls if callId given
    if (callId) {
      await updateActiveCallWithSessionId(supabaseClient, callId, sessionId);
    }

    return new Response(
      JSON.stringify({
        sessionId,
        token,
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
