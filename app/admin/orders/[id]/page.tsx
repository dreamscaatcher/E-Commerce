import React from "react";
import driver from "@/lib/neo4j";
import EntityDetails from "@/app/components/EntityDetails";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

async function getOrder(id: string) {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (o:Order)
      WHERE toString(o.OrderID) = $id
      RETURN o
      `,
      { id }
    );

    const order =
      result.records.length > 0
        ? (result.records[0] as Neo4jRecord).get("o").properties
        : null;

    return JSON.parse(JSON.stringify(order)) as Record<string, unknown> | null;
  } finally {
    await session.close();
  }
}

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <EntityDetails
      title="Order Details"
      entity={order}
      backHref="/admin/orders"
      backLabel="Orders"
    />
  );
}

