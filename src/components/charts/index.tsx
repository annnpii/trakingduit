"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategorySlice, DailyPoint, MonthlyPoint, WeekdayPoint } from "@/lib/analytics";
import { formatCompactIDR, formatIDR } from "@/lib/utils";

const axis = {
  stroke: "var(--fg-muted)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined ? <p className="mb-1 font-medium">{label}</p> : null}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="num text-fg">{formatIDR(Number(p.value) || 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function DailyFlowChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--income)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--income)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--expense)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" {...axis} interval={4} />
        <YAxis {...axis} tickFormatter={(v) => formatCompactIDR(Number(v))} width={64} />
        <Tooltip content={<TooltipBox />} />
        <Area
          type="monotone"
          dataKey="income"
          name="Masuk"
          stroke="var(--income)"
          strokeWidth={2}
          fill="url(#gIncome)"
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Keluar"
          stroke="var(--expense)"
          strokeWidth={2}
          fill="url(#gExpense)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const top = data.slice(0, 7);
  const rest = data.slice(7);
  const slices = rest.length
    ? [
        ...top,
        {
          category_id: "other",
          name: "Lainnya",
          color: "#94a3b8",
          total: rest.reduce((a, b) => a + b.total, 0),
          share: rest.reduce((a, b) => a + b.share, 0),
          count: rest.reduce((a, b) => a + b.count, 0),
        } as CategorySlice,
      ]
    : top;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={slices}
          dataKey="total"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
        >
          {slices.map((s) => (
            <Cell key={s.category_id} fill={s.color} />
          ))}
        </Pie>
        <Tooltip content={<TooltipBox />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyCompareChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => formatCompactIDR(Number(v))} width={64} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="income" name="Masuk" fill="var(--income)" radius={[6, 6, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expense" name="Keluar" fill="var(--expense)" radius={[6, 6, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NetTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => formatCompactIDR(Number(v))} width={64} />
        <Tooltip content={<TooltipBox />} />
        <Line
          type="monotone"
          dataKey="net"
          name="Sisa"
          stroke="var(--brand)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--brand)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeekdayChart({ data }: { data: WeekdayPoint[] }) {
  const max = Math.max(...data.map((d) => d.expense), 1);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <XAxis dataKey="day" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => formatCompactIDR(Number(v))} width={64} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="expense" name="Keluar" radius={[6, 6, 0, 0]} maxBarSize={34}>
          {data.map((d) => (
            <Cell key={d.day} fill={d.expense === max ? "var(--expense)" : "var(--brand)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Tiny inline sparkline for stat tiles. */
export function Sparkline({ data, color = "var(--brand)" }: { data: number[]; color?: string }) {
  const points = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.12} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
