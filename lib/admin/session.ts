type SessionPayload = {
  sub: "admin";
  exp: number;
};

export const ADMIN_SESSION_COOKIE = "neo4j_dashboard_admin_session";

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let base64: string;
  if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(bytes).toString("base64");
  } else {
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    base64 = btoa(binary);
  }

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToBytes(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    const buffer = Buffer.from(base64, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeToString(input: string): string {
  const bytes = base64UrlDecodeToBytes(input);
  return new TextDecoder().decode(bytes);
}

async function importKey(secret: string) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(
  secret: string,
  data: string
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await importKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return new Uint8Array(signature);
}

async function hmacVerify(
  secret: string,
  data: string,
  signature: Uint8Array<ArrayBuffer>
): Promise<boolean> {
  const key = await importKey(secret);
  const encoder = new TextEncoder();
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
}

export async function signAdminSessionToken(
  secret: string,
  ttlSeconds: number
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: "admin", exp: nowSeconds + ttlSeconds };
  const payloadB64 = base64UrlEncodeBytes(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signature = await hmacSign(secret, payloadB64);
  const signatureB64 = base64UrlEncodeBytes(signature);
  return `${payloadB64}.${signatureB64}`;
}

export async function verifyAdminSessionToken(
  secret: string,
  token: string
): Promise<SessionPayload | null> {
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  const signatureBytes = base64UrlDecodeToBytes(signatureB64);
  const valid = await hmacVerify(secret, payloadB64, signatureBytes);
  if (!valid) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as Partial<SessionPayload>;
  if (maybe.sub !== "admin") return null;
  if (typeof maybe.exp !== "number") return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (maybe.exp <= nowSeconds) return null;

  return { sub: "admin", exp: maybe.exp };
}
