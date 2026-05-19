"use client";

import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
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

/** Premium two-tone palette for the Orders by Status donut. */
const STATUS_PALETTE: Record<
  string,
  { solid: string; gradientFrom: string; gradientTo: string }
> = {
  Pending: {
    solid: "#EF4444",
    gradientFrom: "#F87171",
    gradientTo: "#DC2626",
  },
  Confirmed: {
    solid: "#FBBF24",
    gradientFrom: "#FCD34D",
    gradientTo: "#F59E0B",
  },
  Delivered: {
    solid: "#F59E0B",
    gradientFrom: "#F59E0B",
    gradientTo: "#D97706",
  },
};

const FALLBACK_PALETTE = {
  solid: "#A1A1AA",
  gradientFrom: "#D4D4D8",
  gradientTo: "#71717A",
};

function paletteFor(name: string) {
  return STATUS_PALETTE[name] ?? FALLBACK_PALETTE;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

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
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];

  if (safeData.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={safeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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

type PieDatum = { name: string; value: number };

function PieTooltip({
  active,
  payload,
  total,
  isDark,
}: {
  active?: boolean;
  payload?: Array<{ payload: PieDatum }>;
  total: number;
  isDark: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const palette = paletteFor(item.name);
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

  return (
    <div
      style={{
        background: isDark ? "rgba(24, 24, 27, 0.96)" : "rgba(255, 255, 255, 0.98)",
        border: `1px solid ${isDark ? "#3f3f46" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: isDark
          ? "0 10px 30px -8px rgba(0,0,0,0.55)"
          : "0 10px 24px -8px rgba(15,23,42,0.18)",
        minWidth: 140,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 500,
          color: isDark ? "#d4d4d8" : "#6b7280",
          letterSpacing: 0.2,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: palette.solid,
          }}
        />
        {item.name}
      </div>
      <div
        style={{
          marginTop: 4,
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          color: isDark ? "#f4f4f5" : "#111827",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {item.value}
        </span>
        <span style={{ fontSize: 12, color: isDark ? "#a1a1aa" : "#6b7280" }}>
          orders · {pct}%
        </span>
      </div>
    </div>
  );
}

export function StatusPieChart({ data }: { data: PieDatum[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const safeData = Array.isArray(data) ? data.filter((d) => d.value > 0) : [];
  const total = safeData.reduce((s, d) => s + d.value, 0);

  if (safeData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <defs>
          {safeData.map((d) => {
            const palette = paletteFor(d.name);
            return (
              <linearGradient
                key={`grad-${d.name}`}
                id={`donut-grad-${slugify(d.name)}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={palette.gradientFrom} />
                <stop offset="100%" stopColor={palette.gradientTo} />
              </linearGradient>
            );
          })}
          <filter id="donut-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <Pie
          data={safeData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
          cornerRadius={6}
          stroke={isDark ? "#18181b" : "#ffffff"}
          strokeWidth={2}
          isAnimationActive
          animationDuration={650}
          animationEasing="ease-out"
          style={{ filter: "url(#donut-soft-shadow)" }}
          labelLine={false}
          label={(props: {
            cx?: number;
            cy?: number;
            midAngle?: number;
            outerRadius?: number;
            percent?: number;
            name?: string;
          }) => {
            const cx = props.cx ?? 0;
            const cy = props.cy ?? 0;
            const midAngle = props.midAngle ?? 0;
            const outerRadius = props.outerRadius ?? 0;
            const name = props.name ?? "";
            const RAD = Math.PI / 180;
            const r = outerRadius + 16;
            const x = cx + r * Math.cos(-midAngle * RAD);
            const y = cy + r * Math.sin(-midAngle * RAD);
            const palette = paletteFor(name);
            const pct = Math.round(((props.percent as number) ?? 0) * 100);
            if (pct < 5) return <g />;
            return (
              <text
                x={x}
                y={y}
                fill={palette.solid}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}
              >
                {pct}%
              </text>
            );
          }}
        >
          {safeData.map((d, i) => {
            const palette = paletteFor(d.name);
            const isActive = activeIndex === i;
            const isDimmed = activeIndex !== undefined && !isActive;
            return (
              <Cell
                key={d.name}
                fill={`url(#donut-grad-${slugify(d.name)})`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(undefined)}
                style={{
                  cursor: "pointer",
                  opacity: isDimmed ? 0.45 : 1,
                  filter: isActive
                    ? `drop-shadow(0 6px 14px ${palette.solid}55)`
                    : "none",
                  transition:
                    "opacity 220ms ease-out, filter 220ms ease-out",
                  transformOrigin: "center",
                }}
              />
            );
          })}
        </Pie>

        {/* Center total */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 22,
            fontWeight: 600,
            fill: isDark ? "#f4f4f5" : "#111827",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {total}
        </text>
        <text
          x="50%"
          y="50%"
          dy={18}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            fill: isDark ? "#71717a" : "#9ca3af",
          }}
        >
          Orders
        </text>

        <Tooltip
          cursor={false}
          content={<PieTooltip total={total} isDark={isDark} />}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
