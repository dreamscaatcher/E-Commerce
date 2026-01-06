import React from "react";
import Link from "next/link";
import CustomerCityBarChart from "../CustomerCityBarChart";
import { getCustomerCityCounts } from "../data";

export const dynamic = "force-dynamic";

export default async function CustomersByCityPage() {
  const cityCounts = await getCustomerCityCounts();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/analytics" className="navButton">
          ← Back to Analytics
        </Link>
      </div>
      <CustomerCityBarChart data={cityCounts} />
    </div>
  );
}

