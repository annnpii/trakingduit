"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, cn, toMonthKey } from "@/lib/utils";

const LABEL = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

export function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return LABEL.format(new Date(y, m - 1, 1));
}

export function MonthSwitcher({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (monthKey: string) => void;
  className?: string;
}) {
  const isCurrent = value === toMonthKey();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1",
        className,
      )}
    >
      <button
        onClick={() => onChange(addMonths(value, -1))}
        aria-label="Bulan sebelumnya"
        className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-30 text-center text-xs font-medium">{monthLabel(value)}</span>
      <button
        onClick={() => onChange(addMonths(value, 1))}
        disabled={isCurrent}
        aria-label="Bulan berikutnya"
        className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
