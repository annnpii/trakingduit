import type { Category, ID, Transaction } from "./types";
import { monthRange, sum, toDateKey } from "./utils";

export interface Totals {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export function totals(txs: Transaction[]): Totals {
  const income = sum(txs.filter((t) => t.type === "income").map((t) => t.amount));
  const expense = sum(txs.filter((t) => t.type === "expense").map((t) => t.amount));
  return { income, expense, net: income - expense, count: txs.length };
}

export function inMonth(txs: Transaction[], monthKey: string): Transaction[] {
  return txs.filter((t) => t.date.startsWith(monthKey));
}

export interface CategorySlice {
  category_id: ID | "uncategorized";
  name: string;
  color: string;
  total: number;
  share: number;
  count: number;
}

export function byCategory(
  txs: Transaction[],
  categories: Category[],
  type: "expense" | "income" = "expense",
): CategorySlice[] {
  const filtered = txs.filter((t) => t.type === type);
  const grand = sum(filtered.map((t) => t.amount));
  const buckets = new Map<string, { total: number; count: number }>();
  for (const t of filtered) {
    const key = t.category_id ?? "uncategorized";
    const b = buckets.get(key) ?? { total: 0, count: 0 };
    b.total += t.amount;
    b.count += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .map(([id, b]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        category_id: id as ID,
        name: cat?.name ?? "Tanpa kategori",
        color: cat?.color ?? "#94a3b8",
        total: b.total,
        count: b.count,
        share: grand ? b.total / grand : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export interface DailyPoint {
  date: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

/** One point per day across the month, zero-filled so the chart has no gaps. */
export function dailySeries(txs: Transaction[], monthKey: string): DailyPoint[] {
  const { to } = monthRange(monthKey);
  const days = Number(to.slice(-2));
  const points: DailyPoint[] = [];
  for (let day = 1; day <= days; day++) {
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    const dayTx = txs.filter((t) => t.date === date);
    const t = totals(dayTx);
    points.push({ date, label: String(day), income: t.income, expense: t.expense, net: t.net });
  }
  return points;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

const MONTH_LABEL = new Intl.DateTimeFormat("id-ID", { month: "short" });

export function monthlySeries(txs: Transaction[], months: string[]): MonthlyPoint[] {
  return months.map((m) => {
    const t = totals(inMonth(txs, m));
    const [y, mm] = m.split("-").map(Number);
    return {
      month: m,
      label: MONTH_LABEL.format(new Date(y, mm - 1, 1)),
      income: t.income,
      expense: t.expense,
      net: t.net,
    };
  });
}

/** Last `count` month keys ending at `endMonth`, oldest first. */
export function recentMonths(endMonth: string, count: number): string[] {
  const [y, m] = endMonth.split("-").map(Number);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function averageDailySpend(txs: Transaction[], monthKey: string): number {
  const expenses = txs.filter((t) => t.type === "expense" && t.date.startsWith(monthKey));
  if (!expenses.length) return 0;
  const today = toDateKey();
  const isCurrent = today.startsWith(monthKey);
  const elapsed = isCurrent ? Number(today.slice(-2)) : Number(monthRange(monthKey).to.slice(-2));
  return sum(expenses.map((t) => t.amount)) / Math.max(1, elapsed);
}

/** Projected month-end expense using the current burn rate. */
export function projectedMonthExpense(txs: Transaction[], monthKey: string): number {
  const daysInMonth = Number(monthRange(monthKey).to.slice(-2));
  return averageDailySpend(txs, monthKey) * daysInMonth;
}

export function topMerchants(txs: Transaction[], limit = 5) {
  const buckets = new Map<string, { total: number; count: number }>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    const name = (t.merchant || t.note || "").trim();
    if (!name) continue;
    const b = buckets.get(name) ?? { total: 0, count: 0 };
    b.total += t.amount;
    b.count += 1;
    buckets.set(name, b);
  }
  return [...buckets.entries()]
    .map(([name, b]) => ({ name, ...b }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export interface WeekdayPoint {
  day: string;
  expense: number;
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function byWeekday(txs: Transaction[]): WeekdayPoint[] {
  const buckets = new Array(7).fill(0);
  for (const t of txs) {
    if (t.type !== "expense") continue;
    buckets[new Date(t.date).getDay()] += t.amount;
  }
  return WEEKDAYS.map((day, i) => ({ day, expense: buckets[i] }));
}

export function savingsRate(t: Totals): number {
  if (!t.income) return 0;
  return t.net / t.income;
}
