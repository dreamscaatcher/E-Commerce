import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

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
  void request;

  const { id } = await context.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Payment)
      WHERE toString(p.PaymentID) = $id
      RETURN p
      `,
      { id }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = result.records[0].get("p").properties;

    return NextResponse.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
