"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Transaction = {
  orderId: string;
  total: number;
  currency?: string;
  status?: string;
  customerEmail?: string;
  orderDate?: string;
};

function formatMoney(amount: number, currency?: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency && currency.trim() ? currency.trim() : "EUR",
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2)} ${currency || ""}`.trim();
  }
}

export default function TopTransactionsBarChart({
  data,
  limit = 10,
}: {
  data: Transaction[];
  limit?: number;
}) {
  const chartData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const trimmed = list
      .filter((entry) => entry && entry.orderId && entry.total > 0)
      .slice(0, Math.max(1, limit));

    return trimmed.map((entry) => ({
      label: `Order #${entry.orderId}`,
      total: entry.total,
      currency: entry.currency ?? "EUR",
      status: entry.status ?? "",
      customerEmail: entry.customerEmail ?? "",
      orderDate: entry.orderDate ?? "",
    }));
  }, [data, limit]);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid #eee",
          background: "#fafafa",
          color: "#444",
        }}
      >
        No transaction data found (no orders yet).
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: "12px",
        background: "#fff",
        color: "#111",
        padding: "1rem",
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Top Transactions</h2>
        <div style={{ color: "#444", marginTop: "0.25rem" }}>
          Sorted by order total (descending).
        </div>
      </div>

      <div style={{ width: "100%", height: 440 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 24, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="label"
              width={200}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, _name, item) => {
                const amount =
                  typeof value === "number" ? value : Number(value);
                const currency = (item?.payload as { currency?: string })
                  ?.currency;
                return [formatMoney(amount, currency), "Total"];
              }}
              labelFormatter={(label, payload) => {
                const entry = payload?.[0]?.payload as
                  | { customerEmail?: string; status?: string; orderDate?: string }
                  | undefined;
                const extras = [
                  entry?.customerEmail ? entry.customerEmail : null,
                  entry?.status ? entry.status : null,
                  entry?.orderDate ? entry.orderDate : null,
                ]
                  .filter(Boolean)
                  .join(" • ");
                return extras ? `${label} — ${extras}` : label;
              }}
            />
            <Legend />
            <Bar
              dataKey="total"
              name="Order total"
              fill="#f97316"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
