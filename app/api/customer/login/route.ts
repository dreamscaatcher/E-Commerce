import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import { verifyCustomerPassword } from "@/lib/customer/password";
import {
  CUSTOMER_SESSION_COOKIE,
  signCustomerSessionToken,
} from "@/lib/customer/session";

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

function normalizeId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

export async function POST(request: Request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing SESSION_SECRET" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const emailRaw = (data.Email ?? data.email) as unknown;
  const passwordRaw = (data.Password ?? data.password) as unknown;

  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:Customer)
      WHERE toLower(c.Email) = $email
      RETURN c
      LIMIT 1
      `,
      { email }
    );

    if (result.records.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const customerNode = result.records[0].get("c");
    const props = (customerNode?.properties ?? {}) as Record<string, unknown>;
    const storedHash = props.PasswordHash;
    if (typeof storedHash !== "string" || !storedHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const ok = await verifyCustomerPassword(password, storedHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (props.EmailVerified !== true) {
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    const customerId = normalizeId(props.CustomerID);
    const token = await signCustomerSessionToken(
      secret,
      { customerId, email },
      60 * 60 * 24 * 30
    );

    const response = NextResponse.json({
      ok: true,
      customer: {
        CustomerID: props.CustomerID,
        Name: props.Name,
        Email: props.Email,
      },
    });

    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
