import React from "react";
import Link from "next/link";
import TopSellingProductsBarChart from "../TopSellingProductsBarChart";
import { getTopSellingProducts } from "../data";

export const dynamic = "force-dynamic";

export default async function TopSellingProductsPage() {
  const topProducts = await getTopSellingProducts(15);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/analytics" className="navButton">
          ← Back to Analytics
        </Link>
      </div>
      <TopSellingProductsBarChart data={topProducts} limit={10} />
    </div>
  );
}

