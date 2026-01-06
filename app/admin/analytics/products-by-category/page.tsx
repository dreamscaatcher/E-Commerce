import React from "react";
import Link from "next/link";
import CategoryPieChart from "../CategoryPieChart";
import { getCategoryCounts } from "../data";

export const dynamic = "force-dynamic";

export default async function ProductsByCategoryPage() {
  const categoryCounts = await getCategoryCounts();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/analytics" className="navButton">
          ← Back to Analytics
        </Link>
      </div>
      <CategoryPieChart data={categoryCounts} />
    </div>
  );
}

