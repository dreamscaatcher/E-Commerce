import React from "react";
import Link from "next/link";
import MonthlySalesBarChart from "../MonthlySalesBarChart";
import { getMonthlySales } from "../data";

export const dynamic = "force-dynamic";

export default async function SalesByMonthPage() {
  const monthlySales = await getMonthlySales(24);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/analytics" className="navButton">
          ← Back to Analytics
        </Link>
      </div>
      <MonthlySalesBarChart data={monthlySales} limit={12} />
    </div>
  );
}

