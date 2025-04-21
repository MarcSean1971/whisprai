
/**
 * Vonage session and token helpers for Edge Functions.
 */

export async function createSession(jwt: string, applicationId: string) {
  if (!jwt || typeof jwt !== "string" || jwt.split(".").length !== 3) {
    throw new Error("Vonage: invalid JWT token format (session)");
  }
  
  console.log("[Vonage] Creating session for application ID:", applicationId);
  
  try {
    const sessionResponse = await fetch(
      "https://api.opentok.com/session/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-TB-AUTH-TOKEN": jwt,
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          "p2p.preference": "enabled",
          "application_id": applicationId
        }).toString(),
      }
    );

    // Log full response for debugging
    console.log("[Vonage] Session creation status:", sessionResponse.status);
    console.log("[Vonage] Response headers:", Object.fromEntries([...sessionResponse.headers.entries()]));

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("[Vonage] Session creation error:", errorText);
      throw new Error(`Vonage API error: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log("[Vonage] Session data received:", JSON.stringify(sessionData).substring(0, 300));

    if (!sessionData.sessions?.[0]?.session_id) {
      console.error("[Vonage] No valid session ID in response:", sessionData);
      throw new Error("Vonage: no session ID in API response");
    }
    
    console.log("[Vonage] Successfully created session:", sessionData.sessions[0].session_id);
    return sessionData.sessions[0].session_id;
  } catch (error) {
    console.error("[Vonage] Session creation error:", error);
    throw error; // Propagate the error with full details
  }
}

export async function createToken({ apiKey, jwt, sessionId, userId }: {
  apiKey: string;
  jwt: string;
  sessionId: string;
  userId: string;
}) {
  if (!jwt || typeof jwt !== "string" || jwt.split(".").length !== 3) {
    console.error("[Vonage] Invalid JWT token format:", jwt);
    throw new Error("Vonage: invalid JWT token format (token)");
  }
  
  console.log("[Vonage] Creating token for session:", sessionId);
  
  try {
    const tokenResponse = await fetch(
      `https://api.opentok.com/v2/project/${apiKey}/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-TB-AUTH-TOKEN": jwt,
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          session_id: sessionId,
          role: "publisher",
          data: JSON.stringify({ userId }),
          expire_time: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour expiry
        }).toString(),
      }
    );
    
    console.log("[Vonage] Token creation status:", tokenResponse.status);
    
    const tokenText = await tokenResponse.text();
    if (!tokenResponse.ok) {
      console.error("[Vonage] Token creation error:", tokenText);
      throw new Error(`Vonage token API error: ${tokenResponse.status} - ${tokenText}`);
    }
    
    let tokenResult;
    try {
      tokenResult = JSON.parse(tokenText);
    } catch (e) {
      console.error("[Vonage] Failed to parse token response:", tokenText);
      throw new Error("[Vonage] Invalid token response format");
    }
    
    if (!tokenResult.token) {
      console.error("[Vonage] No token in response:", tokenResult);
      throw new Error("[Vonage] No token in token API response");
    }
    
    console.log("[Vonage] Successfully created token of length:", tokenResult.token.length);
    return tokenResult.token;
  } catch (error) {
    console.error("[Vonage] Token creation error:", error);
    throw error; // Propagate the full error
  }
}
