"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChartPie,
  ChevronRight,
  ListOrdered,
  ScanLine,
  Sparkles,
  Target,
  TrendingDown,
  Wallet as WalletIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { allWalletBalances } from "@/lib/repo";
import { inMonth, totals } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";
import { cn, formatIDR, monthRange, pct, toMonthKey } from "@/lib/utils";
import {
  BalanceCard,
  Button,
  Card,
  CardHeader,
  DonutProgress,
  EmptyState,
  MenuTile,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";

type MenuTone = "brand" | "income" | "expense" | "warn" | "accent";

const QUICK: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: MenuTone;
}[] = [
  { href: "/scan", icon: ScanLine, label: "Scan Struk", tone: "brand" },
  { href: "/transactions", icon: ListOrdered, label: "Transaksi", tone: "income" },
  { href: "/budgets", icon: TrendingDown, label: "Budget", tone: "expense" },
  { href: "/goals", icon: Target, label: "Target", tone: "warn" },
  { href: "/bills", icon: CalendarClock, label: "Tagihan", tone: "accent" },
  { href: "/analytics", icon: ChartPie, label: "Analitik", tone: "brand" },
  { href: "/wallets", icon: WalletIcon, label: "Dompet", tone: "income" },
  { href: "/insight", icon: Sparkles, label: "AI Insight", tone: "accent" },
];

export default function DashboardPage() {
  const { profile } = useSession();
  const [month, setMonth] = React.useState(toMonthKey());
  const [hideBalance, setHideBalance] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);

  React.useEffect(() => {
    const val = localStorage.getItem("td.hideBalance") === "1";
    setHideBalance(val);
  }, []);

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem("td.hideBalance", next ? "1" : "0");
  };

  const wallets = useLiveQuery(
    () => db().wallets.filter((w) => !w.deleted && !w.archived).sortBy("order"),
    [],
    [],
  );
  const categories = useLiveQuery(() => db().categories.filter((c) => !c.deleted).toArray(), [], []);
  const balances = useLiveQuery(
    async () => {
      await db().transactions.count(); // keep the query reactive to transaction writes
      return allWalletBalances();
    },
    [],
    {} as Record<string, number>,
  );
  const monthTx = useLiveQuery(() => {
    const { from, to } = monthRange(month);
    return db()
      .transactions.where("date")
      .between(from, to, true, true)
      .filter((t) => !t.deleted)
      .toArray();
  }, [month], []);
  const budgets = useLiveQuery(
    () => db().budgets.filter((b) => !b.deleted && b.start_date.startsWith(month)).toArray(),
    [month],
    [],
  );

  const t = totals(monthTx);
  const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);
  const recent = React.useMemo(
    () =>
      [...monthTx]
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
        .slice(0, 6),
    [monthTx],
  );

  const budgetTotal = budgets.reduce((a, b) => a + b.amount, 0);
  const budgetSpent = inMonth(monthTx, month)
    .filter((tx) => tx.type === "expense" && budgets.some((b) => b.category_id === tx.category_id))
    .reduce((a, x) => a + x.amount, 0);
  const budgetPct = budgetTotal > 0 ? pct(budgetSpent, budgetTotal) : 0;
  const budgetLeft = budgetTotal - budgetSpent;

  const mask = (n: number) => (hideBalance ? "••••••" : formatIDR(n));
  const name = profile?.name?.trim() || "Kawan";
  const firstName = name.split(/\s+/)[0];

  return (
    <div className="space-y-6">
      {/* Greeting + month switcher */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight">Hai, {firstName} 👋</p>
          <p className="text-xs text-muted">Gimana duit lo hari ini?</p>
        </div>
        <MonthSwitcher value={month} onChange={setMonth} className="shrink-0" />
      </div>

      {/* Balance hero */}
      <BalanceCard
        label="Total saldo lo"
        value={mask(totalBalance)}
        hidden={hideBalance}
        onToggleHide={toggleHideBalance}
        sub={
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="size-3.5" /> {mask(t.income)}
            </span>
            <span className="size-1 rounded-full bg-white/40" aria-hidden />
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-3.5" /> {mask(t.expense)}
            </span>
            <span className="size-1 rounded-full bg-white/40" aria-hidden />
            <span className="flex items-center gap-1">
              <WalletIcon className="size-3.5" /> {wallets.length} dompet
            </span>
          </div>
        }
      />

      {/* Quick menu */}
      <section className="grid grid-cols-4 gap-3">
        {QUICK.map((a) => (
          <Link key={a.href} href={a.href} className="block">
            <MenuTile icon={a.icon} label={a.label} tone={a.tone} className="h-full" />
          </Link>
        ))}
      </section>

      {/* Budget ring */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">Budget bulan ini</h3>
          <Link href="/budgets" className="text-xs font-medium text-brand hover:underline">
            Atur
          </Link>
        </div>
        {budgets.length ? (
          <div className="mt-4 flex items-center gap-5">
            <DonutProgress
              value={budgetPct}
              centerLabel={`${Math.round(budgetPct)}%`}
              centerSub="terpakai"
              tone={budgetPct >= 100 ? "expense" : budgetPct >= 80 ? "warn" : "brand"}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <StatRow label="Total" value={mask(budgetTotal)} />
              <StatRow label="Terpakai" value={mask(budgetSpent)} tone="expense" />
              <StatRow
                label="Sisa"
                value={mask(Math.max(0, budgetLeft))}
                tone={budgetLeft >= 0 ? "income" : "expense"}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={TrendingDown}
            title="Belum set budget"
            description="Bikin budget biar pengeluaran ke-track."
            action={
              <Link href="/budgets">
                <Button size="sm">Bikin budget</Button>
              </Link>
            }
          />
        )}
      </Card>

      {/* Recent transactions */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Transaksi terakhir"
          action={
            <Link
              href="/transactions"
              className="flex items-center gap-0.5 text-xs font-medium text-brand hover:underline"
            >
              Lihat Semua <ChevronRight className="size-3" />
            </Link>
          }
        />
        <div className="mt-2">
          {recent.length ? (
            <TransactionList
              transactions={recent}
              categories={categories}
              wallets={wallets}
              onSelect={setEditing}
            />
          ) : (
            <EmptyState
              icon={ListOrdered}
              title="Belum ada transaksi"
              description="Tap tombol + buat catat transaksi pertama."
              action={
                <Link href="/scan">
                  <Button variant="secondary" size="sm">
                    <ScanLine className="size-4" /> Scan struk
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      </Card>

      <TransactionSheet
        open={Boolean(editing)}
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function StatRow({
  label,
  value,
  tone = "fg",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "fg" | "income" | "expense";
}) {
  const tones = { fg: "text-fg", income: "text-income", expense: "text-expense" } as const;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted">{label}</span>
      <span className={cn("num text-sm font-semibold", tones[tone])}>{value}</span>
    </div>
  );
}
