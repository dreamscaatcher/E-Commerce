import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer/session";

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
      MATCH (o:Order)
      RETURN o
      ORDER BY o.OrderID ASC
    `);

    const orders = result.records.map((record) => record.get("o").properties);

    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

type OrderItemInput = {
  id: string;
  quantity: number;
};

function normalizeId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizeQuantity(value: unknown): number {
  if (value == null) return 0;
  let num: number;
  if (typeof value === "number") num = value;
  else if (typeof value === "string") num = Number(value);
  else if (typeof value === "object") {
    const maybe = value as { low?: number };
    num = typeof maybe.low === "number" ? maybe.low : Number.NaN;
  } else num = Number.NaN;

  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return maybe.low;
  }
  return Number.NaN;
}

export async function POST(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing SESSION_SECRET" },
      { status: 500 }
    );
  }

  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyCustomerSessionToken(secret, token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const itemsRaw = (data.items ?? data.Items) as unknown;
  const shippingRaw = (data.shippingAddress ??
    data.ShippingAddress ??
    data.address ??
    data.Address) as unknown;
  const shippingAddress =
    typeof shippingRaw === "string" ? shippingRaw.trim() : "";

  if (!Array.isArray(itemsRaw)) {
    return NextResponse.json(
      { error: "items must be an array" },
      { status: 400 }
    );
  }

  const aggregated = new Map<string, number>();
  for (const raw of itemsRaw) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = normalizeId(
      item.id ?? item.productId ?? item.ProductID ?? item.ProductId
    );
    const quantity = normalizeQuantity(
      item.quantity ?? item.qty ?? item.Quantity
    );
    if (!id || quantity <= 0) continue;
    aggregated.set(id, (aggregated.get(id) ?? 0) + quantity);
  }

  const items: OrderItemInput[] = Array.from(aggregated.entries()).map(
    ([id, quantity]) => ({ id, quantity })
  );

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Cart is empty" },
      { status: 400 }
    );
  }

  const session = driver.session();
  try {
    const customerResult = await session.run(
      `
      MATCH (c:Customer)
      WHERE toString(c.CustomerID) = $customerId
      RETURN c
      LIMIT 1
      `,
      { customerId: payload.customerId }
    );

    if (customerResult.records.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerProps = customerResult.records[0].get("c")?.properties as
      | Record<string, unknown>
      | undefined;

    const storedShipping =
      typeof customerProps?.ShippingAddress === "string"
        ? customerProps.ShippingAddress.trim()
        : "";

    const finalShipping = shippingAddress || storedShipping;
    if (!finalShipping) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const productIds = items.map((item) => item.id);
    const productsResult = await session.run(
      `
      MATCH (p:Product)
      WHERE toString(p.ProductID) IN $ids
      RETURN p
      `,
      { ids: productIds }
    );

    const productsById = new Map<string, Record<string, unknown>>();
    productsResult.records.forEach((record) => {
      const props = record.get("p")?.properties as Record<string, unknown>;
      const id = normalizeId(props?.ProductID);
      if (id) productsById.set(id, props);
    });

    const missing = productIds.filter((id) => !productsById.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Product not found: ${missing[0]}` },
        { status: 404 }
      );
    }

    const snapshotItems = items.map((item) => {
      const product = productsById.get(item.id) ?? {};
      const name =
        typeof product.Name === "string" && product.Name.trim()
          ? product.Name.trim()
          : `Product ${item.id}`;
      const priceValue = toNumber(product.Price);
      const price = Number.isFinite(priceValue) ? priceValue : 0;
      const category =
        typeof product.Category === "string" && product.Category.trim()
          ? product.Category.trim()
          : undefined;
      const imageUrl =
        typeof product.ImageUrl === "string" && product.ImageUrl.trim()
          ? product.ImageUrl.trim()
          : undefined;

      return {
        productId: item.id,
        name,
        price,
        quantity: item.quantity,
        category,
        imageUrl,
      };
    });

    const total = snapshotItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const itemCount = snapshotItems.reduce((sum, item) => sum + item.quantity, 0);
    const itemsJson = JSON.stringify(snapshotItems);

    const createResult = await session.run(
      `
      MATCH (c:Customer)
      WHERE toString(c.CustomerID) = $customerId
      OPTIONAL MATCH (o:Order)
      WITH c, coalesce(max(toInteger(o.OrderID)), 0) AS maxId
      CREATE (order:Order {
        OrderID: maxId + 1,
        CustomerID: c.CustomerID,
        CustomerEmail: c.Email,
        OrderDate: datetime(),
        Status: "CREATED",
        Total: $total,
        ItemCount: $itemCount,
        Currency: "EUR",
        ShippingAddress: $shippingAddress,
        ItemsJson: $itemsJson,
        CreatedAt: datetime()
      })
      CREATE (c)-[:PLACED]->(order)
      RETURN order.OrderID AS OrderID
      `,
      {
        customerId: payload.customerId,
        total,
        itemCount,
        shippingAddress: finalShipping,
        itemsJson,
      }
    );

    if (createResult.records.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderIdRaw = createResult.records[0]?.get("OrderID") ?? null;
    const orderId = normalizeId(orderIdRaw);
    if (!orderId) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        orderId,
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
