import React from "react";
import driver from "@/lib/neo4j";
import EntityTable from "@/app/components/EntityTable";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

async function getOrders() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (o:Order)
      RETURN o
      ORDER BY o.OrderID ASC
    `);
    const orders = result.records.map(
      (record: Neo4jRecord) => record.get("o").properties
    );
    return JSON.parse(JSON.stringify(orders)) as Record<string, unknown>[];
  } finally {
    await session.close();
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const initialQuery = typeof sp?.q === "string" ? sp.q : "";
  const initialField = typeof sp?.field === "string" ? sp.field : "all";
  const orders = await getOrders();

  return (
    <div style={{ padding: "2rem" }}>
      <EntityTable
        title="Backend Dashboard · Orders"
        items={orders}
        idKey="OrderID"
        linkPrefix="/admin/orders"
        initialQuery={initialQuery}
        initialField={initialField}
        columns={[
          { key: "OrderDate", label: "Order Date" },
          { key: "Status", label: "Status" },
          { key: "Total", label: "Total" },
          { key: "CustomerID", label: "Customer ID" },
        ]}
      />
    </div>
  );
}
