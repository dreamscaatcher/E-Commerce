import React from "react";
import Link from "next/link";
import TopTransactionsBarChart from "../TopTransactionsBarChart";
import { getTopTransactions } from "../data";

export const dynamic = "force-dynamic";

export default async function TopTransactionsPage() {
  const transactions = await getTopTransactions(15);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/analytics" className="navButton">
          ← Back to Analytics
        </Link>
      </div>
      <TopTransactionsBarChart data={transactions} limit={10} />
    </div>
  );
}

