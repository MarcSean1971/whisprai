
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
    console.log("[Vonage Session] Authenticated user:", user.id);

    // Parse body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("[Vonage Session] Invalid request body:", error);
      throw new Error("Invalid request body format");
    }
    
    const { conversationId, recipientId, callId } = requestBody;
    if (!conversationId || !recipientId) {
      console.error("[Vonage Session] Missing required parameters:", requestBody);
      throw new Error("Missing required parameters: conversationId and recipientId are required");
    }

    // Vonage credentials
    const apiKey = Deno.env.get("VONAGE_API_KEY");
    const apiSecret = Deno.env.get("VONAGE_API_SECRET");
    const applicationId = Deno.env.get("VONAGE_APPLICATION_ID");
    
    if (!apiKey || !apiSecret) {
      console.error("[Vonage Session] Missing Vonage credentials");
      throw new Error("Vonage API credentials (API key or secret) not configured");
    }
    if (!applicationId) {
      console.error("[Vonage Session] Missing Vonage Application ID");
      throw new Error("Vonage Application ID not configured");
    }

    console.log("[Vonage Session] Generating JWT token");
    
    // Generate JWT
    const { jwt } = await generateJwtToken(apiKey, apiSecret);
    if (!jwt || typeof jwt !== "string" || jwt.split(".").length !== 3) {
      console.error("[Vonage Session] Invalid JWT token:", jwt);
      throw new Error("Failed to generate valid JWT token");
    }

    // Create session
    console.log("[Vonage Session] Creating Vonage session");
    const sessionId = await createSession(jwt, applicationId);
    console.log("[Vonage Session] Session created:", sessionId);

    // Generate token for the session
    console.log("[Vonage Session] Generating token for session");
    const token = await createToken({
      apiKey,
      jwt,
      sessionId,
      userId: user.id,
    });
    console.log("[Vonage Session] Token generated successfully");

    // Store session in DB
    const sessionKey = `call:${conversationId}:${[user.id, recipientId].sort().join("-")}`;
    console.log("[Vonage Session] Storing session in DB:", sessionKey);
    await storeSession(supabaseClient, sessionKey, sessionId, user.id, conversationId);

    // Optionally update active_calls if callId given
    if (callId) {
      console.log("[Vonage Session] Updating active call with session ID:", callId);
      await updateActiveCallWithSessionId(supabaseClient, callId, sessionId);
    }

    console.log("[Vonage Session] Successfully completed - returning session data");
    
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
    console.error("[Vonage Session] Error:", error instanceof Error ? error.message : error);
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
