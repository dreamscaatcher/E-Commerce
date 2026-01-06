import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME!,
    process.env.NEO4J_PASSWORD!
  )
);

export async function GET() {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Product)
      RETURN p
      ORDER BY p.ProductID ASC
    `);

    const products = result.records.map((record) => record.get("p").properties);

    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
