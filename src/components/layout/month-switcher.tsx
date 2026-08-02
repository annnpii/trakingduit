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
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface px-1 py-0.5",
        className,
      )}
    >
      <button
        onClick={() => onChange(addMonths(value, -1))}
        aria-label="Bulan sebelumnya"
        className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-fg"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span className="min-w-28 px-1 text-center text-xs font-medium">{monthLabel(value)}</span>
      <button
        onClick={() => onChange(addMonths(value, 1))}
        disabled={isCurrent}
        aria-label="Bulan berikutnya"
        className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-30"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
