import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "./session";

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifyAdminSessionToken(secret, token);
  return payload?.sub === "admin";
}

