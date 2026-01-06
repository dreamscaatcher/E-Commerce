import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import driver from "@/lib/neo4j";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer/session";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

type CustomerSummary = {
  customerId: string;
  email: string;
  name?: string;
  shippingAddress?: string;
};

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function getCustomerFromSession(): Promise<CustomerSummary | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyCustomerSessionToken(secret, token);
  if (!payload) return null;

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:Customer)
      WHERE toString(c.CustomerID) = $customerId
      RETURN c
      LIMIT 1
      `,
      { customerId: payload.customerId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const customerProps = result.records[0].get("c")?.properties as
      | Record<string, unknown>
      | undefined;

    return {
      customerId: payload.customerId,
      email: payload.email,
      name: pickString(customerProps?.Name),
      shippingAddress: pickString(customerProps?.ShippingAddress),
    };
  } finally {
    await session.close();
  }
}

export default async function CheckoutPage() {
  const customer = await getCustomerFromSession();
  if (!customer) {
    redirect("/login?next=/checkout");
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "920px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Checkout</h1>
      <CheckoutClient
        customerEmail={customer.email}
        initialShippingAddress={customer.shippingAddress ?? ""}
      />
    </div>
  );
}

