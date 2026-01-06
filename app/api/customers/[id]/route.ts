import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import { isAdminRequest } from "@/lib/admin/auth";

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME!,
    process.env.NEO4J_PASSWORD!
  )
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (c:Customer)
      WHERE toString(c.CustomerID) = $id
      RETURN c
      `,
      { id }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = result.records[0].get("c").properties;

    const safeCustomer = { ...(customer as Record<string, unknown>) };
    delete safeCustomer.PasswordHash;
    delete safeCustomer.EmailVerificationTokenHash;
    delete safeCustomer.EmailVerificationExpiresAt;
    return NextResponse.json({ customer: safeCustomer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
