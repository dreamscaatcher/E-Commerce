import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("verify", "missing");
    return NextResponse.redirect(url);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (c:Customer)
      WHERE c.EmailVerificationTokenHash = $tokenHash
        AND c.EmailVerificationExpiresAt > datetime()
        AND coalesce(c.EmailVerified, false) = false
      SET c.EmailVerified = true,
          c.EmailVerifiedAt = datetime()
      REMOVE c.EmailVerificationTokenHash
      REMOVE c.EmailVerificationExpiresAt
      RETURN c.Email AS email
      LIMIT 1
      `,
      { tokenHash }
    );

    if (result.records.length === 0) {
      const url = new URL("/login", request.url);
      url.searchParams.set("verify", "invalid");
      return NextResponse.redirect(url);
    }

    const email = String(result.records[0].get("email") ?? "");
    const url = new URL("/login", request.url);
    url.searchParams.set("verified", "1");
    if (email) url.searchParams.set("email", email);
    return NextResponse.redirect(url);
  } catch (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set("verify", "error");
    return NextResponse.redirect(url);
  } finally {
    await session.close();
  }
}
