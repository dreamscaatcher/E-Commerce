"use client";

import React, { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type CategoryCount = {
  category: string;
  count: number;
};

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#a855f7",
  "#0ea5e9",
  "#ef4444",
  "#f59e0b",
  "#14b8a6",
  "#64748b",
  "#db2777",
];

function formatPercent(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${Math.round(value * 100)}%`;
}

export default function CategoryPieChart({ data }: { data: CategoryCount[] }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((entry) => entry && entry.category && entry.count > 0)
        .map((entry) => ({ name: entry.category, value: entry.count })),
    [data]
  );

  const total = useMemo(
    () => chartData.reduce((sum, entry) => sum + entry.value, 0),
    [chartData]
  );

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
        No category data found.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: "12px",
        background: "#fff",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
          Products by Category
        </h2>
        <div style={{ color: "#444" }}>
          Total: <strong>{total}</strong>
        </div>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={2}
              labelLine={false}
              label={({ percent }) => formatPercent(percent)}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const count = typeof value === "number" ? value : Number(value);
                const pct = total > 0 && Number.isFinite(count) ? count / total : 0;
                const label = item?.payload?.name ?? "Category";
                return [`${count} (${formatPercent(pct)})`, label];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
