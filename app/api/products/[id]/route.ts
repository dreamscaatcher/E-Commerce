
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
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Product)
      WHERE toString(p.ProductID) = $id
      RETURN p
      `,
      { id }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = result.records[0].get("p").properties;

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
