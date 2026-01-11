import React from "react";
import driver from "@/lib/neo4j";
import EntityTable from "@/app/components/EntityTable";
import AdminProductsToolbar from "./AdminProductsToolbar";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

async function getProducts() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product)
      RETURN p
      ORDER BY p.ProductID ASC
    `);
    const products = result.records.map(
      (record: Neo4jRecord) => record.get("p").properties
    );
    return JSON.parse(JSON.stringify(products)) as Record<string, unknown>[];
  } finally {
    await session.close();
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const initialQuery = typeof sp?.q === "string" ? sp.q : "";
  const initialField = typeof sp?.field === "string" ? sp.field : "all";
  const products = await getProducts();
  return (
    <div style={{ padding: "2rem" }}>
      <AdminProductsToolbar />
      <EntityTable
        title="Backend Dashboard · Products"
        items={products}
        idKey="ProductID"
        linkPrefix="/admin/products"
        initialQuery={initialQuery}
        initialField={initialField}
        columns={[
          { key: "ImageUrl", label: "Image", format: "image" },
          { key: "Name", label: "Name" },
          { key: "Description", label: "Description" },
          { key: "Category", label: "Category" },
          { key: "Price", label: "Price" },
        ]}
      />
    </div>
  );
}
