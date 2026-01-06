import { NextRequest, NextResponse } from "next/server";
import driver from "@/lib/neo4j";
import { isAdminRequest } from "@/lib/admin/auth";
import type { Record as Neo4jRecord } from "neo4j-driver";

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product)
      RETURN p
      ORDER BY p.ProductID ASC
    `);

    const products = result.records.map(
      (record: Neo4jRecord) => record.get("p").properties
    );
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const maybe = body as Record<string, unknown>;
  const name = toOptionalString(maybe.Name) ?? toOptionalString(maybe.name);
  const category =
    toOptionalString(maybe.Category) ?? toOptionalString(maybe.category);
  const imageUrl =
    toOptionalString(maybe.ImageUrl) ??
    toOptionalString(maybe.imageUrl) ??
    toOptionalString(maybe.imageURL);
  const description =
    toOptionalString(maybe.Description) ?? toOptionalString(maybe.description);
  const price = toOptionalNumber(maybe.Price ?? maybe.price);
  const providedId = toOptionalNumber(maybe.ProductID ?? maybe.productId);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const session = driver.session();
  try {
    let productId = providedId;

    if (productId == null) {
      const idResult = await session.run(`
        OPTIONAL MATCH (p:Product)
        RETURN coalesce(max(p.ProductID), 0) + 1 AS nextId
      `);
      productId = idResult.records[0]?.get("nextId")?.low ?? undefined;
    } else {
      const existing = await session.run(
        `
        MATCH (p:Product)
        WHERE toString(p.ProductID) = toString($id)
        RETURN p
        LIMIT 1
        `,
        { id: productId }
      );
      if (existing.records.length > 0) {
        return NextResponse.json(
          { error: "ProductID already exists" },
          { status: 409 }
        );
      }
    }

    if (productId == null) {
      return NextResponse.json(
        { error: "Could not determine ProductID" },
        { status: 500 }
      );
    }

    const create = await session.run(
      `
      CREATE (p:Product {
        ProductID: $productId,
        Name: $name,
        Category: $category,
        Price: $price
      })
      SET p.ImageUrl = $imageUrl
      SET p.Description = $description
      RETURN p
      `,
      {
        productId,
        name,
        category: category ?? "",
        price: price ?? 0,
        imageUrl: imageUrl ?? null,
        description: description ?? null,
      }
    );

    const product = create.records[0]?.get("p").properties;
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
