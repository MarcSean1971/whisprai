
/**
 * Helper to create a Vonage (OpenTok) session and generate a JWT for subsequent authenticated API calls.
 */
export async function createVonageSession(jwt: string, applicationId: string) {
  console.log("[Vonage] Creating session with application ID:", applicationId);
  
  // Validate JWT format before sending
  if (!jwt || typeof jwt !== 'string' || jwt.split('.').length !== 3) {
    console.error("[Vonage] Invalid JWT format:", jwt);
    throw new Error("Invalid JWT token format");
  }
  
  try {
    const sessionResponse = await fetch(
      "https://api.opentok.com/session/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-TB-AUTH-TOKEN": jwt, // Changed from X-OPENTOK-AUTH to X-TB-AUTH-TOKEN
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          "p2p.preference": "enabled",
          "application_id": applicationId
        }).toString(),
      }
    );

    // Log the full response status for debugging
    console.log("[Vonage] Session creation status:", sessionResponse.status);
    console.log("[Vonage] Response headers:", Object.fromEntries([...sessionResponse.headers.entries()]));

    if (!sessionResponse.ok) {
      // Get the full error text for better debugging
      const errorText = await sessionResponse.text();
      console.error("[Vonage] Session creation error response:", errorText);
      throw new Error(
        `Failed to create session: ${sessionResponse.status} - ${errorText}`
      );
    }

    try {
      const sessionData = await sessionResponse.json();
      console.log("[Vonage] Session data received:", JSON.stringify(sessionData).substring(0, 200) + "...");

      if (
        !sessionData.sessions ||
        !sessionData.sessions[0] ||
        !sessionData.sessions[0].session_id
      ) {
        console.error("[Vonage] Invalid session data structure:", sessionData);
        throw new Error("No session ID in response");
      }
      return sessionData.sessions[0].session_id;
    } catch (parseError) {
      console.error("[Vonage] Error parsing session response:", parseError);
      throw new Error("Failed to parse session response");
    }
  } catch (error) {
    console.error("[Vonage] Session creation failed:", error);
    throw error;
  }
}
