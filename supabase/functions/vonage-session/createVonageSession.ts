
/**
 * Helper to create a Vonage (OpenTok) session and generate a JWT for subsequent authenticated API calls.
 */
export async function createVonageSession(jwt: string) {
  const sessionResponse = await fetch(
    "https://api.opentok.com/session/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-OPENTOK-AUTH": jwt,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        "p2p.preference": "enabled",
      }).toString(),
    }
  );

  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    throw new Error(
      `Failed to create session: ${sessionResponse.status} - ${errorText}`
    );
  }

  const sessionData = await sessionResponse.json();

  if (
    !sessionData.sessions ||
    !sessionData.sessions[0] ||
    !sessionData.sessions[0].session_id
  ) {
    throw new Error("No session ID in response");
  }
  return sessionData.sessions[0].session_id;
}
