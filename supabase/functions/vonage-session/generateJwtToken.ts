
/**
 * Helper to generate Vonage (OpenTok) JWT token using HS256 (for REST API).
 */
export async function generateJwtToken(apiKey: string, apiSecret: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    iat: now,
    exp: now + 300, // expires in 5 minutes
    scope: "session.create", // Required for REST session.create.
    // sub and jti are optional for this usage
  };
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  // For debugging/logging!
  console.log("[Vonage] [JWT] header", header);
  console.log("[Vonage] [JWT] payload", payload);

  // Encode header and payload as base64url
  function base64url(input: string) {
    return btoa(input)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const encoder = new TextEncoder();
  const toSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const key = encoder.encode(apiSecret);

  // sign with WebCrypto API
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    cryptoKey,
    toSign
  );
  const signature = base64url(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
  // Log the entire JWT for inspection (can use jwt.io to verify/debug)
  console.log("[Vonage] [JWT] Generated JWT", jwt);

  // Return both JWT and decoded payload for debugging upstream
  return { jwt, payload };
}
