
/**
 * Vonage session and token helpers for Edge Functions.
 */

export async function createSession(jwt: string, applicationId: string) {
  if (!jwt || typeof jwt !== "string" || jwt.split(".").length !== 3) {
    throw new Error("Vonage: invalid JWT token format (session)");
  }
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

  if (!sessionResponse.ok) {
    const text = await sessionResponse.text();
    let message = "Unknown error";
    try {
      const json = JSON.parse(text);
      message = json?.message || message;
    } catch {}
    throw new Error(`[Vonage] Session API error: ${message} (${sessionResponse.status})`);
  }
  const sessionData = await sessionResponse.json();
  if (!sessionData.sessions?.[0]?.session_id) {
    throw new Error("Vonage: no session ID in API response");
  }
  return sessionData.sessions[0].session_id;
}

export async function createToken({ apiKey, jwt, sessionId, userId }: {
  apiKey: string;
  jwt: string;
  sessionId: string;
  userId: string;
}) {
  if (!jwt || typeof jwt !== "string" || jwt.split(".").length !== 3) {
    throw new Error("Vonage: invalid JWT token format (token)");
  }
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
        expire_time: (Math.floor(Date.now() / 1000) + 3600).toString(),
      }).toString(),
    }
  );
  const tokenText = await tokenResponse.text();
  if (!tokenResponse.ok) {
    let message = "Unknown error";
    try {
      const json = JSON.parse(tokenText);
      message = json?.message || message;
    } catch {}
    throw new Error(`[Vonage] Token API error: ${message} (${tokenResponse.status})`);
  }
  const tokenResult = JSON.parse(tokenText);
  if (!tokenResult.token) {
    throw new Error("[Vonage] No token in token API response");
  }
  return tokenResult.token;
}
