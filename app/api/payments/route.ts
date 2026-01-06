import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import { isAdminRequest } from "@/lib/admin/auth";
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

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Payment)
      RETURN p
      ORDER BY p.PaymentID ASC
    `);

    const payments = result.records.map((record) => record.get("p").properties);

    return NextResponse.json({ payments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

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
  const orderId = normalizeId(data.orderId ?? data.OrderID ?? data.order_id);
  const methodRaw = (data.method ?? data.Method) as unknown;
  const method =
    typeof methodRaw === "string" && methodRaw.trim()
      ? methodRaw.trim()
      : "DEV_CARD";

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId is required" },
      { status: 400 }
    );
  }

  if (method.length > 64) {
    return NextResponse.json(
      { error: "Payment method is too long" },
      { status: 400 }
    );
  }

  const session = driver.session();
  try {
    const orderResult = await session.run(
      `
      MATCH (o:Order)
      WHERE toString(o.OrderID) = $orderId
      RETURN o
      LIMIT 1
      `,
      { orderId }
    );

    if (orderResult.records.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderProps = orderResult.records[0].get("o")?.properties as
      | Record<string, unknown>
      | undefined;
    const orderCustomerId = normalizeId(orderProps?.CustomerID);
    if (!orderCustomerId || orderCustomerId !== payload.customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = typeof orderProps?.Status === "string" ? orderProps.Status : "";
    if (status.toUpperCase() === "PAID") {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 409 }
      );
    }

    const createResult = await session.run(
      `
      MATCH (o:Order)
      WHERE toString(o.OrderID) = $orderId
        AND toString(o.CustomerID) = $customerId
      OPTIONAL MATCH (p:Payment)
      WITH o, coalesce(max(toInteger(p.PaymentID)), 0) AS maxId
      CREATE (payment:Payment {
        PaymentID: maxId + 1,
        OrderID: o.OrderID,
        CustomerID: o.CustomerID,
        PaymentDate: datetime(),
        Method: $method,
        Amount: o.Total,
        Currency: coalesce(o.Currency, "EUR"),
        Status: "PAID"
      })
      CREATE (o)-[:PAID_WITH]->(payment)
      SET o.Status = "PAID",
          o.PaymentID = payment.PaymentID,
          o.PaidAt = datetime()
      RETURN payment.PaymentID AS PaymentID
      `,
      {
        orderId,
        customerId: payload.customerId,
        method,
      }
    );

    if (createResult.records.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentIdRaw = createResult.records[0]?.get("PaymentID") ?? null;
    const paymentId = normalizeId(paymentIdRaw);
    if (!paymentId) {
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { ok: true, paymentId },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
