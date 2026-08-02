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
import { Button, Card, CardHeader, EmptyState, Progress } from "@/components/ui";
import { StatTile } from "@/components/ui/stat-tile";
import { DailyFlowChart } from "@/components/charts";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { DynIcon } from "@/components/ui/icon";

export default function DashboardPage() {
  const [month, setMonth] = React.useState(toMonthKey());
  const [hideBalance, setHideBalance] = React.useState(false);

  React.useEffect(() => {
    const val = localStorage.getItem("td.hideBalance") === "1";
    setHideBalance(val);
  }, []);

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem("td.hideBalance", next ? "1" : "0");
  };
  const [editing, setEditing] = React.useState<Transaction | null>(null);

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
  const upcomingBills = bills
    .filter((b) => b.due_date >= today || !b.last_paid_at)
    .slice(0, 3);

  const mask = (n: number) => (hideBalance ? "••••••" : formatIDR(n));

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <Card className="relative overflow-hidden p-5 shadow-(--shadow-card)">
        <div
          className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--brand)" }}
        />
        <div className="relative flex items-start justify-between">
          <div>
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
            <p className="num mt-1 text-3xl font-semibold tracking-tight">{mask(totalBalance)}</p>
            <p className="mt-1 text-xs text-muted">
              {wallets.length} dompet aktif · {t.count} transaksi bulan ini
            </p>
          </div>
          <MonthSwitcher value={month} onChange={setMonth} className="hidden sm:inline-flex" />
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <ArrowDownLeft className="size-3.5 text-income" /> Duit masuk
            </p>
            <p className="num mt-0.5 text-sm font-semibold text-income">{mask(t.income)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <ArrowUpRight className="size-3.5 text-expense" /> Duit keluar
            </p>
            <p className="num mt-0.5 text-sm font-semibold text-expense">{mask(t.expense)}</p>
          </div>
        </div>

        <MonthSwitcher value={month} onChange={setMonth} className="mt-3 flex w-full sm:hidden" />
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        <QuickAction href="/scan" icon={ScanLine} label="Scan Struk" />
        <QuickAction href="/transactions" icon={ListOrdered} label="Transaksi" />
        <QuickAction href="/budgets" icon={TrendingDown} label="Budget" />
        <QuickAction href="/goals" icon={Target} label="Target" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Sisa duit bulan ini"
          value={t.net}
          tone={t.net >= 0 ? "income" : "expense"}
          hint={`Nabung ${Math.round(rate * 100)}%`}
        />
        <StatTile label="Rata-rata per hari" value={avgDaily} hint="Keluar per hari" />
        <StatTile
          label="Prediksi akhir bulan"
          value={projected}
          tone="expense"
          hint="Kalo terus kayak gini"
        />
        <StatTile
          label="Paling boros di mana"
          value={catSlices[0] ? formatIDR(catSlices[0].total) : "-"}
          hint={catSlices[0]?.name ?? "Belum ada nih"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Wallets */}
        <Card>
          <CardHeader
            title="Dompet"
            action={
              <Link href="/wallets" className="text-xs text-brand hover:underline">
                Atur
              </Link>
            }
          />
          <ul className="space-y-1 p-3">
            {wallets.slice(0, 4).map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-surface-2"
              >
                <span
                  className="grid size-9 place-items-center rounded-xl"
                  style={{ background: `${w.color}1f`, color: w.color }}
                >
                  <DynIcon name={w.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{w.name}</span>
                </span>
                <span className="num text-sm font-medium">{mask(balances[w.id] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Budgets */}
        <Card>
          <CardHeader
            title="Budget bulan ini"
            action={
              <Link href="/budgets" className="text-xs text-brand hover:underline">
                Atur
              </Link>
            }
          />
          <div className="space-y-3 p-4">
            {budgets.length ? (
              budgets.slice(0, 3).map((b) => {
                const cat = categories.find((c) => c.id === b.category_id);
                const spent = inMonth(monthTx, month)
                  .filter((tx) => tx.type === "expense" && tx.category_id === b.category_id)
                  .reduce((a, x) => a + x.amount, 0);
                const ratio = pct(spent, b.amount);
                return (
                  <div key={b.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{cat?.name ?? "Kategori"}</span>
                      <span className="num text-muted">
                        {formatIDR(spent)} / {formatIDR(b.amount)}
                      </span>
                    </div>
                    <Progress value={ratio} tone={ratio >= 100 ? "expense" : ratio >= 80 ? "warn" : "brand"} />
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-xs text-muted">Belum set budget nih.</p>
            )}
          </div>
        </Card>

        {/* Bills + goals */}
        <Card>
          <CardHeader
            title="Tagihan yang deket"
            action={
              <Link href="/bills" className="text-xs text-brand hover:underline">
                Semua
              </Link>
            }
          />
          <ul className="space-y-1 p-3">
            {upcomingBills.length ? (
              upcomingBills.map((b) => {
                const late = b.due_date < today;
                return (
                  <li key={b.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-xl",
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
              })
            ) : (
              <li className="py-6 text-center text-xs text-muted">Ga ada tagihan.</li>
            )}
            {goals.slice(0, 1).map((g) => (
              <li key={g.id} className="mt-2 rounded-xl border border-border px-3 py-2">
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
        </Card>
      </div>

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

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface px-2 py-3 text-[11px] text-muted transition hover:border-brand/40 hover:text-fg active:scale-[0.97]"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      {label}
    </Link>
  );
}
