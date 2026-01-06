import React from "react";
import driver from "@/lib/neo4j";
import EntityDetails from "@/app/components/EntityDetails";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

async function getPayment(id: string) {
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

    const payment =
      result.records.length > 0
        ? (result.records[0] as Neo4jRecord).get("p").properties
        : null;

    return JSON.parse(JSON.stringify(payment)) as Record<string, unknown> | null;
  } finally {
    await session.close();
  }
}

export default async function AdminPaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await getPayment(id);

  return (
    <EntityDetails
      title="Payment Details"
      entity={payment}
      backHref="/admin/payments"
      backLabel="Payments"
    />
  );
}

