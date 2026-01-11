"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type CategoryCount = {
  category: string;
  count: number;
};

type CityCount = {
  city: string;
  count: number;
};

type TopProduct = {
  productId: string;
  name: string;
  unitsSold: number;
};

type TopTransaction = {
  orderId: string;
  total: number;
};

type LargestOrderItem = {
  productId: string;
  name: string;
  lineTotal: number;
};

type MonthlySales = {
  month: string;
  total: number;
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

function EmptyThumbnail({ label }: { label: string }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "grid",
        placeItems: "center",
        color: "#666",
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}

export function CategoryPieChartThumbnail({ data }: { data: CategoryCount[] }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((entry) => entry && entry.category && entry.count > 0)
        .slice(0, 6)
        .map((entry) => ({ name: entry.category, value: entry.count })),
    [data]
  );

  if (chartData.length === 0) return <EmptyThumbnail label="No categories" />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="45%"
            outerRadius="80%"
            paddingAngle={1}
            stroke="none"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CustomerCityBarChartThumbnail({ data }: { data: CityCount[] }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((entry) => entry && entry.city && entry.count > 0)
        .slice(0, 6)
        .map((entry) => ({ city: entry.city, customers: entry.count })),
    [data]
  );

  if (chartData.length === 0) return <EmptyThumbnail label="No customers" />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
          <XAxis dataKey="city" hide />
          <YAxis hide />
          <Bar dataKey="customers" fill="#2563eb" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopSellingProductsBarChartThumbnail({
  data,
}: {
  data: TopProduct[];
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((entry) => entry && entry.productId && entry.unitsSold > 0)
        .slice(0, 5)
        .map((entry) => ({ label: entry.name, unitsSold: entry.unitsSold })),
    [data]
  );

  if (chartData.length === 0) return <EmptyThumbnail label="No orders yet" />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 6, left: 6, bottom: 10 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" hide />
          <Bar dataKey="unitsSold" fill="#16a34a" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopTransactionsBarChartThumbnail({
  data,
}: {
  data: TopTransaction[];
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((entry) => entry && entry.orderId && entry.total > 0)
        .slice(0, 5)
        .map((entry) => ({ label: `#${entry.orderId}`, total: entry.total })),
    [data]
  );

  if (chartData.length === 0) return <EmptyThumbnail label="No transactions" />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 6, left: 6, bottom: 10 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" hide />
          <Bar dataKey="total" fill="#f97316" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LargestOrderBreakdownThumbnail({
  items,
}: {
  items: LargestOrderItem[];
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(items) ? items : [])
        .filter((entry) => entry && entry.productId && entry.lineTotal > 0)
        .slice(0, 5)
        .map((entry) => ({
          label: entry.name || `#${entry.productId}`,
          total: entry.lineTotal,
        })),
    [items]
  );

  if (chartData.length === 0) return <EmptyThumbnail label="No largest order" />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 6, left: 6, bottom: 10 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" hide />
          <Bar dataKey="total" fill="#0ea5e9" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlySalesBarChartThumbnail({
  data,
}: {
  data: MonthlySales[];
}) {
  const chartData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const trimmed = list
      .filter((entry) => entry && entry.month && entry.total > 0)
      .slice(0, 6);

    return trimmed.reduce<{ label: string; start: number; value: number }[]>(
      (acc, entry) => {
        const prev = acc.length > 0 ? acc[acc.length - 1]! : null;
        const start = prev ? prev.start + prev.value : 0;
        const value = entry.total;
        return acc.concat({ label: entry.month, start, value });
      },
      []
    );
  }, [data]);

  if (chartData.length === 0) return <EmptyThumbnail label="No sales" />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 6, left: 6, bottom: 10 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" hide />
          <Bar dataKey="start" stackId="waterfall" fill="transparent" />
          <Bar dataKey="value" stackId="waterfall" fill="#a855f7" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SupplyPlanningThumbnail() {
  const chartData = useMemo(
    () => [
      { x: 1, demand: 30, capacity: 44 },
      { x: 2, demand: 38, capacity: 44 },
      { x: 3, demand: 46, capacity: 44 },
      { x: 4, demand: 42, capacity: 44 },
      { x: 5, demand: 54, capacity: 44 },
      { x: 6, demand: 49, capacity: 44 },
    ],
    []
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
          <XAxis dataKey="x" hide />
          <YAxis hide />
          <Line type="monotone" dataKey="demand" stroke="#16a34a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="capacity" stroke="#111" strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
