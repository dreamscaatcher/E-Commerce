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

type ProductSales = {
  productId: string;
  name: string;
  unitsSold: number;
};

export default function TopSellingProductsBarChart({
  data,
  limit = 10,
}: {
  data: ProductSales[];
  limit?: number;
}) {
  const chartData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const trimmed = list
      .filter((entry) => entry && entry.productId && entry.unitsSold > 0)
      .slice(0, Math.max(1, limit));

    return trimmed.map((entry) => ({
      label: `${entry.name} (#${entry.productId})`,
      unitsSold: entry.unitsSold,
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
        No sales data found (no orders/items yet).
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
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
          Top Selling Products
        </h2>
        <div style={{ color: "#444", marginTop: "0.25rem" }}>
          Sorted by units sold (descending).
        </div>
      </div>

      <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 24, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={260}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="unitsSold"
              name="Units sold"
              fill="#16a34a"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
