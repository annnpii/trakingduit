"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Eye,
  EyeOff,
  ListOrdered,
  PiggyBank,
  ScanLine,
  Target,
  TrendingDown,
  Wallet as WalletIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { allWalletBalances } from "@/lib/repo";
import {
  averageDailySpend,
  byCategory,
  dailySeries,
  inMonth,
  projectedMonthExpense,
  savingsRate,
  totals,
} from "@/lib/analytics";
import type { Transaction } from "@/lib/types";
import { cn, formatIDR, monthRange, pct, toDateKey, toMonthKey } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, Progress, SegmentedControl } from "@/components/ui";
import { DailyFlowChart } from "@/components/charts";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { DynIcon } from "@/components/ui/icon";

type DashTab = "ringkasan" | "dompet" | "budget";

const QUICK: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { href: "/scan", icon: ScanLine, label: "Scan Struk" },
  { href: "/transactions", icon: ListOrdered, label: "Transaksi" },
  { href: "/budgets", icon: TrendingDown, label: "Budget" },
  { href: "/goals", icon: Target, label: "Target" },
];

export default function DashboardPage() {
  const [month, setMonth] = React.useState(toMonthKey());
  const [hideBalance, setHideBalance] = React.useState(false);
  const [tab, setTab] = React.useState<DashTab>("ringkasan");
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
  const goals = useLiveQuery(
    () => db().goals.filter((g) => !g.deleted && !g.archived).toArray(),
    [],
    [],
  );
  const bills = useLiveQuery(
    () => db().bills.filter((b) => !b.deleted && !b.archived).sortBy("due_date"),
    [],
    [],
  );

  const t = totals(monthTx);
  const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);
  const daily = React.useMemo(() => dailySeries(monthTx, month), [monthTx, month]);
  const catSlices = React.useMemo(
    () => byCategory(monthTx, categories, "expense").slice(0, 4),
    [monthTx, categories],
  );
  const recent = React.useMemo(
    () =>
      [...monthTx]
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
        .slice(0, 6),
    [monthTx],
  );
  const avgDaily = averageDailySpend(monthTx, month);
  const projected = projectedMonthExpense(monthTx, month);
  const rate = savingsRate(t);
  const today = toDateKey();
  const upcomingBills = bills.filter((b) => b.due_date >= today || !b.last_paid_at).slice(0, 3);

  const mask = (n: number) => (hideBalance ? "••••••" : formatIDR(n));
  const savePct = t.income > 0 ? Math.min(100, Math.max(0, (t.net / t.income) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top summary - no hero card, sits on page bg */}
      <section className="pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-muted">
              <WalletIcon className="size-3.5" /> Total duit lo
              <button
                onClick={toggleHideBalance}
                aria-label={hideBalance ? "Liat duit" : "Sembunyiin duit"}
                className="text-muted transition hover:text-fg"
              >
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </p>
            <p className="num mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {mask(totalBalance)}
            </p>
          </div>
          <MonthSwitcher value={month} onChange={setMonth} className="shrink-0" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1 text-income">
            <ArrowDownLeft className="size-3.5" /> {mask(t.income)}
          </span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span className="flex items-center gap-1 text-expense">
            <ArrowUpRight className="size-3.5" /> {mask(t.expense)}
          </span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span className="text-muted">{t.count} transaksi bulan ini</span>
        </div>
      </section>

      {/* Bento tiles - asymmetric */}
      <section className="grid grid-cols-2 gap-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-(--shadow-card)">
          <div
            className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full opacity-15 blur-3xl"
            style={{ background: t.net >= 0 ? "var(--brand)" : "var(--expense)" }}
          />
          <div className="relative">
            <p className="text-xs text-muted">Sisa duit bulan ini</p>
            <p
              className={cn(
                "num mt-1 text-3xl font-semibold tracking-tight",
                t.net >= 0 ? "text-fg" : "text-expense",
              )}
            >
              {mask(t.net)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Nabung {Math.round(rate * 100)}% dari pemasukan</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn("h-full rounded-full", t.net >= 0 ? "bg-brand" : "bg-expense")}
                style={{ width: `${savePct}%` }}
              />
            </div>
          </div>
        </div>

        <Tile label="Rata-rata per hari" value={mask(avgDaily)} hint="Keluar per hari" />
        <Tile label="Prediksi akhir bulan" value={mask(projected)} tone="expense" hint="Kalo terus kayak gini" />

        <div className="col-span-2 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Paling boros di mana</p>
          {catSlices[0] ? (
            <>
              <p className="mt-1 flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: catSlices[0].color }} />
                <span className="min-w-0 truncate text-sm font-medium">{catSlices[0].name}</span>
                <span className="num ml-auto shrink-0 text-sm font-semibold">
                  {formatIDR(catSlices[0].total)}
                </span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(catSlices[0].share * 100)}%`, background: catSlices[0].color }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">Belum ada nih</p>
          )}
        </div>
      </section>

      {/* Quick actions - scroll-snap pills */}
      <section className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x">
        {QUICK.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-medium text-fg transition hover:border-brand/40 active:scale-[0.97]"
          >
            <a.icon className="size-4 text-brand" />
            {a.label}
          </Link>
        ))}
      </section>

      {/* Tabs */}
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: "ringkasan", label: "Ringkasan" },
          { value: "dompet", label: "Dompet" },
          { value: "budget", label: "Budget" },
        ]}
        className="w-full"
      />

      {tab === "ringkasan" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Masuk-keluar harian" subtitle="Duit masuk vs keluar" />
            <div className="px-2 pt-2 pb-3">
              {t.count ? (
                <DailyFlowChart data={daily} />
              ) : (
                <EmptyState
                  icon={PiggyBank}
                  title="Belum ada transaksi bulan ini"
                  description="Catat transaksi pertama buat liat grafiknya."
                />
              )}
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Keluar kemana aja"
              action={
                <Link href="/analytics" className="text-xs text-brand hover:underline">
                  Detail
                </Link>
              }
            />
            <div className="space-y-3 p-4">
              {catSlices.length ? (
                catSlices.map((c) => (
                  <div key={c.category_id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span className="num text-muted">{formatIDR(c.total)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round(c.share * 100)}%`, background: c.color }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-muted">Belum keluar duit nih.</p>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "dompet" ? (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Dompet</h3>
              <Link href="/wallets" className="text-xs text-brand hover:underline">
                Atur
              </Link>
            </div>
            {wallets.length ? (
              <ul className="space-y-1">
                {wallets.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5"
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl"
                      style={{ background: `${w.color}1f`, color: w.color }}
                    >
                      <DynIcon name={w.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{w.name}</span>
                    <span className="num text-sm font-semibold">{mask(balances[w.id] ?? 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={WalletIcon}
                title="Belum ada dompet"
                description="Buat dompet pertama lo di halaman Dompet."
              />
            )}
          </div>

          {goals.length ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Target nabung</h3>
              <ul className="space-y-2">
                {goals.slice(0, 2).map((g) => (
                  <li key={g.id} className="rounded-2xl border border-border bg-surface px-3 py-2.5">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <Target className="size-3.5 text-brand" /> {g.name}
                      </span>
                      <span className="num text-muted">{pct(g.saved_amount, g.target_amount)}%</span>
                    </div>
                    <Progress value={pct(g.saved_amount, g.target_amount)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "budget" ? (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Budget bulan ini</h3>
              <Link href="/budgets" className="text-xs text-brand hover:underline">
                Atur
              </Link>
            </div>
            {budgets.length ? (
              <ul className="space-y-2">
                {budgets.slice(0, 5).map((b) => {
                  const cat = categories.find((c) => c.id === b.category_id);
                  const spent = inMonth(monthTx, month)
                    .filter((tx) => tx.type === "expense" && tx.category_id === b.category_id)
                    .reduce((a, x) => a + x.amount, 0);
                  const ratio = pct(spent, b.amount);
                  return (
                    <li key={b.id} className="rounded-2xl border border-border bg-surface px-3 py-2.5">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>{cat?.name ?? "Kategori"}</span>
                        <span className="num text-muted">
                          {formatIDR(spent)} / {formatIDR(b.amount)}
                        </span>
                      </div>
                      <Progress
                        value={ratio}
                        tone={ratio >= 100 ? "expense" : ratio >= 80 ? "warn" : "brand"}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={TrendingDown}
                title="Belum set budget"
                description="Bikin budget biar pengeluaran ke-track."
              />
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tagihan yang deket</h3>
              <Link href="/bills" className="text-xs text-brand hover:underline">
                Semua
              </Link>
            </div>
            {upcomingBills.length ? (
              <ul className="space-y-1">
                {upcomingBills.map((b) => {
                  const late = b.due_date < today;
                  return (
                    <li
                      key={b.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5"
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          late ? "bg-expense/10 text-expense" : "bg-warn/10 text-warn",
                        )}
                      >
                        <CalendarClock className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{b.name}</span>
                        <span className="block text-[11px] text-muted">
                          {late ? "Udah telat" : `Deadline ${b.due_date}`}
                        </span>
                      </span>
                      <span className="num text-sm">{formatIDR(b.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={CalendarClock} title="Ga ada tagihan" description="Tenang, semua beres." />
            )}
          </div>
        </div>
      ) : null}

      {/* Recent */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Transaksi terbaru"
          action={
            <Link
              href="/transactions"
              className="flex items-center gap-0.5 text-xs text-brand hover:underline"
            >
              Semua <ChevronRight className="size-3" />
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

function Tile({
  label,
  value,
  hint,
  tone = "fg",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "fg" | "income" | "expense" | "brand";
  className?: string;
}) {
  const tones = {
    fg: "text-fg",
    income: "text-income",
    expense: "text-expense",
    brand: "text-brand",
  } as const;
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-4", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("num mt-1 text-xl font-semibold tracking-tight sm:text-2xl", tones[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
