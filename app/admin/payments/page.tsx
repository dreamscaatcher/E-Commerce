import React from "react";
import driver from "@/lib/neo4j";
import EntityTable from "@/app/components/EntityTable";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

async function getPayments() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Payment)
      RETURN p
      ORDER BY p.PaymentID ASC
    `);
    const payments = result.records.map(
      (record: Neo4jRecord) => record.get("p").properties
    );
    return JSON.parse(JSON.stringify(payments)) as Record<string, unknown>[];
  } finally {
    await session.close();
  }
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const initialQuery = typeof sp?.q === "string" ? sp.q : "";
  const initialField = typeof sp?.field === "string" ? sp.field : "all";
  const payments = await getPayments();

  return (
    <div style={{ padding: "2rem" }}>
      <EntityTable
        title="Admin Payments"
        items={payments}
        idKey="PaymentID"
        linkPrefix="/admin/payments"
        initialQuery={initialQuery}
        initialField={initialField}
        columns={[
          { key: "PaymentDate", label: "Payment Date" },
          { key: "Method", label: "Method" },
          { key: "Amount", label: "Amount" },
          { key: "OrderID", label: "Order ID" },
        ]}
      />
    </div>
  );
}

