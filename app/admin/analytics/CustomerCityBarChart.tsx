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

type CityCount = {
  city: string;
  count: number;
};

export default function CustomerCityBarChart({ data }: { data: CityCount[] }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((entry) => entry && entry.city && entry.count > 0)
        .map((entry) => ({ city: entry.city, customers: entry.count })),
    [data]
  );

  const total = useMemo(
    () => chartData.reduce((sum, entry) => sum + entry.customers, 0),
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
        No customer city data found.
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
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Customers by City</h2>
        <div style={{ color: "#444" }}>
          Total: <strong>{total}</strong>
        </div>
      </div>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="city"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="customers" name="Customers" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

