import React from "react";
import driver from "@/lib/neo4j";
import EntityTable from "@/app/components/EntityTable";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

async function getCustomers() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (c:Customer)
      RETURN c
      ORDER BY c.CustomerID ASC
    `);
    const customers = result.records.map((record: Neo4jRecord) => {
      const props = record.get("c").properties as Record<string, unknown>;
      const safe = { ...props };
      delete safe.PasswordHash;
      delete safe.EmailVerificationTokenHash;
      delete safe.EmailVerificationExpiresAt;
      return safe;
    });
    return JSON.parse(JSON.stringify(customers)) as Record<string, unknown>[];
  } finally {
    await session.close();
  }
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const initialQuery = typeof sp?.q === "string" ? sp.q : "";
  const initialField = typeof sp?.field === "string" ? sp.field : "all";
  const customers = await getCustomers();

  return (
    <div style={{ padding: "2rem" }}>
      <EntityTable
        title="Admin Customers"
        items={customers}
        idKey="CustomerID"
        linkPrefix="/admin/customers"
        initialQuery={initialQuery}
        initialField={initialField}
        columns={[
          { key: "Name", label: "Name" },
          { key: "Email", label: "Email" },
          { key: "Phone", label: "Phone" },
          { key: "City", label: "City" },
        ]}
      />
    </div>
  );
}
