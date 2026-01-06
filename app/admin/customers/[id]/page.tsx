import React from "react";
import driver from "@/lib/neo4j";
import EntityDetails from "@/app/components/EntityDetails";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

async function getCustomer(id: string) {
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

    const customer =
      result.records.length > 0
        ? (result.records[0] as Neo4jRecord).get("c").properties
        : null;

    const safeCustomer =
      customer && typeof customer === "object"
        ? { ...(customer as Record<string, unknown>) }
        : null;
    if (safeCustomer) {
      delete safeCustomer.PasswordHash;
      delete safeCustomer.EmailVerificationTokenHash;
      delete safeCustomer.EmailVerificationExpiresAt;
    }

    return JSON.parse(JSON.stringify(safeCustomer)) as
      | Record<string, unknown>
      | null;
  } finally {
    await session.close();
  }
}

export default async function AdminCustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);

  return (
    <EntityDetails
      title="Customer Details"
      entity={customer}
      backHref="/admin/customers"
      backLabel="Customers"
    />
  );
}
