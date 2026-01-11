import type { NextRequest } from "next/server";

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Basic ";
  if (!header.startsWith(prefix)) return false;

  const encoded = header.slice(prefix.length).trim();
  const decoded = decodeBase64(encoded);
  if (!decoded) return false;

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) return false;

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return (
    username === expectedUsername &&
    constantTimeEqual(password, expectedPassword)
  );
}

function decodeBase64(value: string): string | null {
  if (!value) return null;
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(value, "base64").toString("utf8");
    }
    if (typeof atob !== "undefined") {
      return atob(value);
    }
    return null;
  } catch {
    return null;
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
