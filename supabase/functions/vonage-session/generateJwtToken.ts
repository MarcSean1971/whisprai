
/**
 * Helper to generate Vonage (OpenTok) JWT token using HS256.
 */
export async function generateJwtToken(apiKey: string, apiSecret: string) {
  const tokenData = {
    iss: apiKey,
    ist: "project",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 180, // 3 minutes expiration
    jti: crypto.randomUUID(),
  };

  const encoder = new TextEncoder();
  const header = encoder.encode(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  );
  const payload = encoder.encode(JSON.stringify(tokenData));

  const base64Header = btoa(String.fromCharCode(...new Uint8Array(header)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const base64Payload = btoa(String.fromCharCode(...new Uint8Array(payload)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const toSign = encoder.encode(`${base64Header}.${base64Payload}`);

  const key = encoder.encode(apiSecret);
  const signatureBuffer = await crypto.subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    toSign
  );
  const signatureArray = new Uint8Array(signatureBuffer);
  const signature = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${base64Header}.${base64Payload}.${signature}`;
}
