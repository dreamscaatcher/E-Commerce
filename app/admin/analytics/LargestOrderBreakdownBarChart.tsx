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

type LargestOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type LargestOrderBreakdown = {
  orderId: string;
  total: number;
  currency: string;
  status?: string;
  customerEmail?: string;
  orderDate?: string;
  items: LargestOrderItem[];
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

export default function LargestOrderBreakdownBarChart({
  data,
  limit = 12,
}: {
  data: LargestOrderBreakdown | null;
  limit?: number;
}) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data.items)) return [];
    return data.items
      .filter((entry) => entry && entry.productId && entry.lineTotal > 0)
      .slice(0, Math.max(1, limit))
      .map((entry) => ({
        label: `${entry.name} (#${entry.productId})`,
        lineTotal: entry.lineTotal,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
      }));
  }, [data, limit]);

  if (!data || chartData.length === 0) {
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
        No order data found.
      </div>
    );
  }

  const metaParts = [
    data.status ? `Status: ${data.status}` : null,
    data.customerEmail ? `Customer: ${data.customerEmail}` : null,
    data.orderDate ? `Date: ${data.orderDate}` : null,
  ].filter(Boolean);

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
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
          Largest Order Breakdown
        </h2>
        <div style={{ color: "#444", marginTop: "0.25rem" }}>
          Order <strong>#{data.orderId}</strong> • Total{" "}
          <strong>{formatMoney(data.total, data.currency)}</strong>
        </div>
        {metaParts.length > 0 ? (
          <div style={{ color: "#666", marginTop: "0.25rem" }}>
            {metaParts.join(" • ")}
          </div>
        ) : null}
      </div>

      <div style={{ width: "100%", height: 460 }}>
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
              width={280}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, _name, item) => {
                const amount =
                  typeof value === "number" ? value : Number(value);
                return [formatMoney(amount, data.currency), "Line total"];
              }}
              labelFormatter={(label, payload) => {
                const entry = payload?.[0]?.payload as
                  | { quantity?: number; unitPrice?: number }
                  | undefined;
                const qty =
                  typeof entry?.quantity === "number" ? entry.quantity : null;
                const unit =
                  typeof entry?.unitPrice === "number" ? entry.unitPrice : null;
                const extra =
                  qty && unit
                    ? `qty ${qty} • unit ${formatMoney(unit, data.currency)}`
                    : qty
                      ? `qty ${qty}`
                      : "";
                return extra ? `${label} — ${extra}` : label;
              }}
            />
            <Legend />
            <Bar
              dataKey="lineTotal"
              name="Line total"
              fill="#0ea5e9"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
