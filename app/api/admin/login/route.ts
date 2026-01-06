import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  signAdminSessionToken,
} from "@/lib/admin/session";

function safeEqual(a: string, b: string) {
  const aBytes = Buffer.from(a);
  const bBytes = Buffer.from(b);
  if (aBytes.length !== bBytes.length) return false;
  return timingSafeEqual(aBytes, bBytes);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!secret || !expectedPassword) {
    return NextResponse.json(
      { error: "Admin auth is not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { username, password } = body as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (username !== expectedUsername || !safeEqual(password, expectedPassword)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ttlSeconds = 60 * 60 * 12; // 12 hours
  const token = await signAdminSessionToken(secret, ttlSeconds);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds,
  });
  return response;
}

