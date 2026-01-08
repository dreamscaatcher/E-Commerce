"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlySales = {
  month: string;
  total: number;
  payments: number;
};

function formatMoney(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2)} EUR`;
  }
}

export default function MonthlySalesBarChart({
  data,
  limit = 12,
}: {
  data: MonthlySales[];
  limit?: number;
}) {
  const { chartData, highestMonth } = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const trimmed = list
      .filter((entry) => entry && entry.month && entry.total > 0)
      .slice(0, Math.max(1, limit));

    const top = trimmed[0];

    const waterfall = trimmed.reduce<
      {
        label: string;
        start: number;
        value: number;
        total: number;
        payments: number;
        cumulative: number;
        isTotal: boolean;
      }[]
    >((acc, entry) => {
      const start = acc.length > 0 ? acc[acc.length - 1]!.cumulative : 0;
      const value = entry.total;
      const cumulative = start + value;
      return acc.concat({
        label: entry.month,
        start,
        value,
        total: entry.total,
        payments: entry.payments,
        cumulative,
        isTotal: false,
      });
    }, []);

    const running = waterfall.length > 0 ? waterfall[waterfall.length - 1]!.cumulative : 0;
    const paymentsTotal = trimmed.reduce((sum, entry) => sum + entry.payments, 0);
    const fullData =
      waterfall.length > 0
        ? waterfall.concat({
            label: "Total",
            start: 0,
            value: running,
            total: running,
            payments: paymentsTotal,
            cumulative: running,
            isTotal: true,
          })
        : waterfall;

    return {
      chartData: fullData,
      highestMonth: top
        ? { month: top.month, total: top.total, payments: top.payments }
        : null,
    };
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
        No monthly sales found (no payments yet).
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
          Sales by Month (Waterfall)
        </h2>
        <div style={{ color: "#444", marginTop: "0.25rem" }}>
          Waterfall chart of cumulative sales (months sorted by total sales desc).
        </div>
        {highestMonth ? (
          <div style={{ color: "#666", marginTop: "0.25rem" }}>
            Highest sales month:{" "}
            <strong>
              {highestMonth.month} ({formatMoney(highestMonth.total)})
            </strong>
          </div>
        ) : null}
      </div>

      <div style={{ width: "100%", height: 440 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 18, left: 0, bottom: 34 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
            />
            <YAxis tickFormatter={(value) => formatMoney(Number(value))} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const entry = payload[0]?.payload as
                  | {
                      total?: number;
                      cumulative?: number;
                      payments?: number;
                      isTotal?: boolean;
                    }
                  | undefined;

                const total =
                  typeof entry?.total === "number" ? entry.total : null;
                const cumulative =
                  typeof entry?.cumulative === "number" ? entry.cumulative : null;
                const payments =
                  typeof entry?.payments === "number" ? entry.payments : null;

                return (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: 10,
                      padding: "0.6rem 0.75rem",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                      color: "#111",
                      maxWidth: 260,
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: "0.35rem" }}>
                      {label}
                    </div>
                    {total != null ? (
                      <div style={{ fontSize: 13, marginBottom: "0.2rem" }}>
                        {entry?.isTotal ? "Total" : "Month"}:{" "}
                        <strong>{formatMoney(total)}</strong>
                      </div>
                    ) : null}
                    {cumulative != null ? (
                      <div style={{ fontSize: 13, marginBottom: "0.2rem" }}>
                        Cumulative:{" "}
                        <strong>{formatMoney(cumulative)}</strong>
                      </div>
                    ) : null}
                    {payments != null ? (
                      <div style={{ fontSize: 13, color: "#444" }}>
                        {payments} payments
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
            <Bar dataKey="start" stackId="waterfall" fill="transparent" />
            <Bar
              dataKey="value"
              name="Monthly sales"
              stackId="waterfall"
              radius={[6, 6, 0, 0]}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.isTotal ? "#111" : "#a855f7"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
