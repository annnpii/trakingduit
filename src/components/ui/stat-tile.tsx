"use client";

import * as React from "react";
import { cn, formatIDR } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: number | string;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "income" | "expense" | "brand";
  className?: string;
}) {
  const toneClass = {
    neutral: "text-fg",
    income: "text-income",
    expense: "text-expense",
    brand: "text-brand",
  }[tone];

  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-4", className)}>
      <div className="flex items-center gap-2 text-xs text-muted">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </div>
      <p className={cn("num mt-1.5 text-lg font-semibold tracking-tight sm:text-xl", toneClass)}>
        {typeof value === "number" ? formatIDR(value) : value}
      </p>
      {hint ? <div className="mt-1 text-[11px] text-muted">{hint}</div> : null}
    </div>
  );
}
