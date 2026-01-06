import React from "react";
import Link from "next/link";
import LargestOrderBreakdownBarChart from "../LargestOrderBreakdownBarChart";
import { getLargestOrderBreakdown } from "../data";

export const dynamic = "force-dynamic";

export default async function LargestOrderBreakdownPage() {
  const breakdown = await getLargestOrderBreakdown();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/analytics" className="navButton">
          ← Back to Analytics
        </Link>
      </div>
      <LargestOrderBreakdownBarChart data={breakdown} limit={12} />
    </div>
  );
}

