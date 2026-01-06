import { NextRequest, NextResponse } from "next/server";
import driver from "@/lib/neo4j";
import { isAdminRequest } from "@/lib/admin/auth";

function getFirstDefinedProperty(
  obj: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }
  }
  return undefined;
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

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
  const updates: Record<string, unknown> = {};

  const name = pickString(maybe.Name ?? maybe.name);
  if (typeof name === "string") updates.Name = name;

  const category = pickString(maybe.Category ?? maybe.category);
  if (typeof category === "string") updates.Category = category;

  const imageUrlValue = getFirstDefinedProperty(maybe, [
    "ImageUrl",
    "imageUrl",
    "imageURL",
  ]);
  if (imageUrlValue === null) updates.ImageUrl = null;
  const imageUrl = pickString(imageUrlValue);
  if (typeof imageUrl === "string") {
    updates.ImageUrl = imageUrl.trim() === "" ? null : imageUrl;
  }

  const descriptionValue = getFirstDefinedProperty(maybe, [
    "Description",
    "description",
  ]);
  if (descriptionValue === null) updates.Description = null;
  const description = pickString(descriptionValue);
  if (typeof description === "string") {
    updates.Description = description.trim() === "" ? null : description;
  }

  const price = pickNumber(maybe.Price ?? maybe.price);
  if (typeof price === "number") updates.Price = price;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (p:Product)
      WHERE toString(p.ProductID) = $id
      SET p += $updates
      RETURN p
      `,
      { id, updates }
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Product)
      WHERE toString(p.ProductID) = $id
      WITH p
      DETACH DELETE p
      RETURN 1 AS deleted
      `,
      { id }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
