"use client";

import React, { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DemandSeriesPoint = {
  period: string;
  orders: number;
  items: number;
  revenue: number;
};

type Granularity = "daily" | "weekly";

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function formatInteger(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
      safe
    );
  } catch {
    return String(Math.round(safe));
  }
}

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

function formatPercent(ratio: number) {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(safe);
  } catch {
    return `${Math.round(safe * 100)}%`;
  }
}

function defaultCapacityFromSeries(series: DemandSeriesPoint[]) {
  const values = (Array.isArray(series) ? series : [])
    .map((entry) => (entry && typeof entry.items === "number" ? entry.items : 0))
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return 100;

  const p80 = values[Math.floor(values.length * 0.8)] ?? values[values.length - 1]!;
  return Math.max(1, Math.ceil(p80 * 1.15));
}

function periodLabel(period: string, granularity: Granularity) {
  if (!period) return "";
  if (granularity === "weekly") return period.slice(5);
  return period.slice(5);
}

export default function SupplyPlanning({
  daily,
  weekly,
}: {
  daily: DemandSeriesPoint[];
  weekly: DemandSeriesPoint[];
}) {
  const dailySeries = useMemo(
    () =>
      (Array.isArray(daily) ? daily : []).filter(
        (entry) => entry && entry.period && entry.items > 0
      ),
    [daily]
  );
  const weeklySeries = useMemo(
    () =>
      (Array.isArray(weekly) ? weekly : []).filter(
        (entry) => entry && entry.period && entry.items > 0
      ),
    [weekly]
  );

  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [multiplier, setMultiplier] = useState(1);
  const [targetUtilization, setTargetUtilization] = useState(0.8);
  const [capacityDaily, setCapacityDaily] = useState(() =>
    defaultCapacityFromSeries(dailySeries)
  );
  const [capacityWeekly, setCapacityWeekly] = useState(() =>
    defaultCapacityFromSeries(weeklySeries)
  );

  const { chartData, summary } = useMemo(() => {
    const series = granularity === "weekly" ? weeklySeries : dailySeries;
    const capacity = granularity === "weekly" ? capacityWeekly : capacityDaily;

    const safeMultiplier = clamp(multiplier, 0.1, 10);
    const safeTarget = clamp(targetUtilization, 0.01, 1);

    const rows = series.map((entry) => {
      const baseline = Number.isFinite(entry.items) ? entry.items : 0;
      const adjusted = baseline * safeMultiplier;
      const util = capacity > 0 ? adjusted / capacity : 0;
      const recommended = safeTarget > 0 ? adjusted / safeTarget : 0;

      return {
        period: entry.period,
        label: periodLabel(entry.period, granularity),
        orders: entry.orders,
        revenue: entry.revenue,
        baselineDemand: baseline,
        adjustedDemand: adjusted,
        capacity,
        utilization: util,
        utilizationPct: util * 100,
        recommendedCapacity: recommended,
      };
    });

    const peakAdjusted = rows.reduce(
      (max, row) => (row.adjustedDemand > max ? row.adjustedDemand : max),
      0
    );
    const avgAdjusted =
      rows.length > 0
        ? rows.reduce((sum, row) => sum + row.adjustedDemand, 0) / rows.length
        : 0;
    const peakUtil = rows.reduce(
      (max, row) => (row.utilization > max ? row.utilization : max),
      0
    );
    const avgUtil =
      rows.length > 0
        ? rows.reduce((sum, row) => sum + row.utilization, 0) / rows.length
        : 0;

    return {
      chartData: rows,
      summary: {
        capacity,
        peakAdjusted,
        avgAdjusted,
        peakUtil,
        avgUtil,
        recommendedForPeak: safeTarget > 0 ? peakAdjusted / safeTarget : 0,
        safeTarget,
      },
    };
  }, [
    granularity,
    dailySeries,
    weeklySeries,
    multiplier,
    targetUtilization,
    capacityDaily,
    capacityWeekly,
  ]);

  const activeCapacity = granularity === "weekly" ? capacityWeekly : capacityDaily;
  const setActiveCapacity = granularity === "weekly" ? setCapacityWeekly : setCapacityDaily;

  const capacityMax = useMemo(() => {
    if (chartData.length === 0) return 500;
    const peakBaseline = chartData.reduce(
      (max, row) => (row.baselineDemand > max ? row.baselineDemand : max),
      0
    );
    const peakAdjusted = chartData.reduce(
      (max, row) => (row.adjustedDemand > max ? row.adjustedDemand : max),
      0
    );
    return Math.max(10, Math.ceil(Math.max(peakBaseline, peakAdjusted) * 2));
  }, [chartData]);

  if (dailySeries.length === 0 && weeklySeries.length === 0) {
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
        No demand series found yet (create some orders first).
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Supply Planning</h2>
          <div style={{ color: "#444", marginTop: "0.25rem" }}>
            Demand (items) by {granularity} with what-if capacity & utilization.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="navButton"
            onClick={() => setGranularity("daily")}
            style={{
              background: granularity === "daily" ? "#111" : undefined,
              color: granularity === "daily" ? "#fff" : undefined,
              borderColor: granularity === "daily" ? "#111" : undefined,
            }}
          >
            Daily
          </button>
          <button
            type="button"
            className="navButton"
            onClick={() => setGranularity("weekly")}
            style={{
              background: granularity === "weekly" ? "#111" : undefined,
              color: granularity === "weekly" ? "#fff" : undefined,
              borderColor: granularity === "weekly" ? "#111" : undefined,
            }}
          >
            Weekly
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          borderRadius: 12,
          border: "1px solid #eee",
          background: "#f8fafc",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Capacity per {granularity === "weekly" ? "week" : "day"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900 }}>
              {formatInteger(activeCapacity)}
            </span>
            <span style={{ color: "#444" }}>items</span>
          </div>
          <input
            type="range"
            min={0}
            max={capacityMax}
            step={1}
            value={activeCapacity}
            onChange={(e) => setActiveCapacity(Math.max(0, Math.floor(Number(e.target.value))))}
            style={{ width: "100%", marginTop: 8 }}
          />
          <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
            Peak recommended (target {formatPercent(summary.safeTarget)}):{" "}
            <strong>{formatInteger(summary.recommendedForPeak)}</strong>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Demand multiplier</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900 }}>
              {multiplier.toFixed(2)}×
            </span>
            <span style={{ color: "#444" }}>baseline</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.05}
            value={multiplier}
            onChange={(e) => setMultiplier(Number(e.target.value))}
            style={{ width: "100%", marginTop: 8 }}
          />
          <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
            Avg adjusted demand: <strong>{formatInteger(summary.avgAdjusted)}</strong>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Target utilization</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900 }}>
              {formatPercent(targetUtilization)}
            </span>
            <span style={{ color: "#444" }}>goal</span>
          </div>
          <input
            type="range"
            min={0.6}
            max={0.95}
            step={0.01}
            value={targetUtilization}
            onChange={(e) => setTargetUtilization(Number(e.target.value))}
            style={{ width: "100%", marginTop: 8 }}
          />
          <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
            Avg utilization: <strong>{formatPercent(summary.avgUtil)}</strong>{" "}
            (peak {formatPercent(summary.peakUtil)})
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Demand vs Capacity</div>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                minTickGap={22}
                angle={-18}
                textAnchor="end"
                height={50}
              />
              <YAxis tickFormatter={(v) => formatInteger(Number(v))} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const row = payload[0]?.payload as
                    | {
                        baselineDemand?: number;
                        adjustedDemand?: number;
                        capacity?: number;
                        utilization?: number;
                        orders?: number;
                        revenue?: number;
                      }
                    | undefined;

                  const baseline = Number(row?.baselineDemand ?? 0);
                  const adjusted = Number(row?.adjustedDemand ?? 0);
                  const capacity = Number(row?.capacity ?? 0);
                  const utilization = Number(row?.utilization ?? 0);
                  const orders = Number(row?.orders ?? 0);
                  const revenue = Number(row?.revenue ?? 0);

                  return (
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        padding: "0.6rem 0.75rem",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                        color: "#111",
                        maxWidth: 280,
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: "0.35rem" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 13, marginBottom: "0.2rem" }}>
                        Baseline demand: <strong>{formatInteger(baseline)}</strong>
                      </div>
                      <div style={{ fontSize: 13, marginBottom: "0.2rem" }}>
                        Adjusted demand: <strong>{formatInteger(adjusted)}</strong>
                      </div>
                      <div style={{ fontSize: 13, marginBottom: "0.2rem" }}>
                        Capacity: <strong>{formatInteger(capacity)}</strong>
                      </div>
                      <div style={{ fontSize: 13, marginBottom: "0.2rem" }}>
                        Utilization: <strong>{formatPercent(utilization)}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#444" }}>
                        Orders: {formatInteger(orders)} • Revenue:{" "}
                        {formatMoney(revenue)}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="baselineDemand"
                name="Baseline demand (items)"
                fill="#93c5fd"
                stroke="#2563eb"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="adjustedDemand"
                name="Adjusted demand"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="capacity"
                name="Capacity"
                stroke="#111"
                strokeDasharray="6 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Utilization</div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                minTickGap={22}
                angle={-18}
                textAnchor="end"
                height={50}
              />
              <YAxis
                domain={[0, (max: number) => Math.max(110, Math.ceil(max * 1.2))]}
                tickFormatter={(v) => `${Math.round(Number(v))}%`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Utilization") {
                    return [`${Math.round(Number(value))}%`, name];
                  }
                  return [value, name];
                }}
              />
              <ReferenceLine
                y={targetUtilization * 100}
                stroke="#f97316"
                strokeDasharray="4 4"
                label={{
                  value: `Target ${Math.round(targetUtilization * 100)}%`,
                  position: "insideTopRight",
                  fill: "#f97316",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={100}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: "100%",
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="utilizationPct"
                name="Utilization"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

