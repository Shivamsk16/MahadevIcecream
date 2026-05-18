"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = ["#DC2626", "#D97706", "#22C55E", "#3B82F6"];

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return useMemo(
    () => ({
      grid: isDark ? "#3f3f46" : "#f1f5f9",
      tick: isDark ? "#a1a1aa" : "#6b7280",
      tooltip: {
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.98)",
        border: `1px solid ${isDark ? "#3f3f46" : "#e5e7eb"}`,
        borderRadius: "12px",
        boxShadow: isDark
          ? "0 8px 24px -4px rgb(0 0 0 / 0.45)"
          : "0 4px 12px -2px rgb(0 0 0 / 0.08)",
        color: isDark ? "#f4f4f5" : "#111827",
        fontSize: "13px",
      },
      labelFill: isDark ? "#d4d4d8" : "#374151",
    }),
    [isDark]
  );
}

export function OrdersBarChart({
  data,
}: {
  data: { day: string; orders: number }[];
}) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme.grid}
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tick={{ fill: theme.tick, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: theme.tick, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={theme.tooltip} />
        <Bar dataKey="orders" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
          style={{ fill: theme.labelFill, fontSize: 11 }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={theme.tooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
}
