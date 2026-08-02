"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChartPie, Download, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import {
  averageDailySpend,
  byCategory,
  byWeekday,
  dailySeries,
  monthlySeries,
  recentMonths,
  savingsRate,
  topMerchants,
  totals,
} from "@/lib/analytics";
import { downloadFile, formatIDR, monthRange, pct, toMonthKey } from "@/lib/utils";
import { toCSV } from "@/lib/export";
import { Button, Card, CardHeader, EmptyState, SegmentedControl } from "@/components/ui";
import { StatTile } from "@/components/ui/stat-tile";
import dynamic from "next/dynamic";
import { MonthSwitcher, monthLabel } from "@/components/layout/month-switcher";

// Recharts is heavy (~100KB+). Load only when /analytics is opened.
const CategoryDonut = dynamic(() =>
  import("@/components/charts").then((m) => m.CategoryDonut),
);
const DailyFlowChart = dynamic(() =>
  import("@/components/charts").then((m) => m.DailyFlowChart),
);
const MonthlyCompareChart = dynamic(() =>
  import("@/components/charts").then((m) => m.MonthlyCompareChart),
);
const NetTrendChart = dynamic(() =>
  import("@/components/charts").then((m) => m.NetTrendChart),
);
const WeekdayChart = dynamic(() =>
  import("@/components/charts").then((m) => m.WeekdayChart),
);

export default function AnalyticsPage() {
  const [month, setMonth] = React.useState(toMonthKey());
  const [scope, setScope] = React.useState<"expense" | "income">("expense");

  const categories = useLiveQuery(() => db().categories.filter((c) => !c.deleted).toArray(), [], []);
  const wallets = useLiveQuery(() => db().wallets.filter((w) => !w.deleted).toArray(), [], []);
  const allTx = useLiveQuery(() => db().transactions.filter((t) => !t.deleted).toArray(), [], []);

  const months = React.useMemo(() => recentMonths(month, 6), [month]);
  const monthTx = React.useMemo(() => allTx.filter((t) => t.date.startsWith(month)), [allTx, month]);
  const halfYearTx = React.useMemo(
    () => allTx.filter((t) => months.some((m) => t.date.startsWith(m))),
    [allTx, months],
  );

  const t = totals(monthTx);
  const prevMonth = months[months.length - 2];
  const prevTotals = totals(allTx.filter((tx) => tx.date.startsWith(prevMonth ?? "")));
  const expenseDelta = prevTotals.expense
    ? Math.round(((t.expense - prevTotals.expense) / prevTotals.expense) * 100)
    : 0;

  const slices = React.useMemo(
    () => byCategory(monthTx, categories, scope),
    [monthTx, categories, scope],
  );
  const daily = React.useMemo(() => dailySeries(monthTx, month), [monthTx, month]);
  const monthly = React.useMemo(() => monthlySeries(halfYearTx, months), [halfYearTx, months]);
  const weekday = React.useMemo(() => byWeekday(monthTx), [monthTx]);
  const merchants = React.useMemo(() => topMerchants(monthTx), [monthTx]);
  const rate = savingsRate(t);

  const finHealth = React.useMemo(() => {
    const income = t.income;
    const expense = t.expense;
    if (income === 0) {
      if (expense > 0) {
        return {
          score: 0,
          status: "Buruk",
          tone: "expense" as const,
          description: "Waduh, boncos total! Belum ada pemasukan tapi pengeluaran jalan terus. Yuk rem dulu belanjanya!",
        };
      }
      return {
        score: 50,
        status: "Cukup",
        tone: "brand" as const,
        description: "Keuangan lo pasif nih, kaga ada pemasukan maupun pengeluaran. Coba catat transaksi biar lebih akurat.",
      };
    }

    const ratio = expense / income;
    let score = Math.round((1 - ratio) * 100);
    if (score < 0) score = 0;

    let status = "Buruk";
    let tone: "neutral" | "income" | "expense" | "brand" = "expense";
    let description = "Waduh, kondisi kritis! Pengeluaran lo udah ugal-ugalan atau sisa duit lo minus. Waktunya ngerem checkout keranjang!";

    if (score >= 80) {
      status = "Sangat Baik";
      tone = "income";
      description = "Gokil! Gaya hidup lo hemat banget bulan ini. Sisa duit aman buat nabung atau investasi. Pertahanin terus!";
    } else if (score >= 60) {
      status = "Baik";
      tone = "income";
      description = "Keuangan lo aman terkendali. Sisa tabungan masih ok, tapi tetep kontrol jajan boba biar kaga boncos akhir bulan.";
    } else if (score >= 40) {
      status = "Cukup";
      tone = "brand";
      description = "Dompet lo mulai sesak nih. Pengeluaran udah makan separuh pemasukan lo. Kurangin impulsive buying ya!";
    }

    return { score, status, tone, description };
  }, [t.income, t.expense]);

  function exportCsv() {
    const { from, to } = monthRange(month);
    const rows = allTx.filter((tx) => tx.date >= from && tx.date <= to);
    downloadFile(`trackingduit-analitik-${month}.csv`, toCSV(rows, wallets, categories), "text/csv");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Analitik</h1>
            <p className="text-xs text-muted">Grafik pemasukan dan pengeluaran</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={exportCsv} 
            aria-label="Ekspor CSV"
            className="sm:hidden size-9"
          >
            <Download className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <MonthSwitcher value={month} onChange={setMonth} className="flex-1 sm:w-36" />
          <SegmentedControl
            value={scope}
            onChange={setScope}
            options={[
              { value: "expense", label: "Keluar" },
              { value: "income", label: "Masuk" },
            ]}
            className="flex-1 sm:flex-none"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={exportCsv} 
            aria-label="Ekspor CSV"
            className="hidden sm:inline-flex size-9 shrink-0"
          >
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Duit masuk" value={t.income} tone="income" className="border-0 shadow-(--shadow-card)" />
        <StatTile
          label="Duit keluar"
          value={t.expense}
          tone="expense"
          className="border-0 shadow-(--shadow-card)"
          hint={
            prevMonth && prevTotals.expense ? (
              <span className="inline-flex items-center gap-1">
                {expenseDelta > 0 ? (
                  <TrendingUp className="size-3 text-expense" />
                ) : (
                  <TrendingDown className="size-3 text-income" />
                )}
                {Math.abs(expenseDelta)}% vs {monthLabel(prevMonth).split(" ")[0]}
              </span>
            ) : undefined
          }
        />
        <StatTile
          label="Sisa"
          value={t.net}
          tone={t.net >= 0 ? "income" : "expense"}
          className="border-0 shadow-(--shadow-card)"
        />
        <StatTile
          label="Skor Keuangan"
          value={`${finHealth.score}/100`}
          tone={finHealth.tone}
          className="border-0 shadow-(--shadow-card)"
          hint={finHealth.status}
        />
      </div>

      <Card className="p-4 border-brand/20 bg-brand/5 rounded-2xl">
        <h4 className="text-sm font-semibold text-brand flex items-center gap-1.5">
          <Sparkles className="size-4 shrink-0" /> Analisis Kesehatan Finansial
        </h4>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Kesehatan keuangan lo dapet skor <span className="font-semibold text-fg">{finHealth.score}/100</span> ({finHealth.status}). {finHealth.description}
        </p>
      </Card>

      {t.count ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Masuk-keluar harian" subtitle={monthLabel(month)} />
              <div className="px-2 pt-2 pb-3">
                <DailyFlowChart data={daily} />
              </div>
            </Card>
            <Card>
              <CardHeader
                title={`${scope === "expense" ? "Keluar kemana aja" : "Masuk dari mana aja"}`}
                subtitle={`${slices.length} kategori`}
              />
              <div className="px-2 pt-2 pb-3">
                <CategoryDonut data={slices} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Perbandingan 6 bulan" subtitle="Masuk vs keluar" />
              <div className="px-2 pt-2 pb-3">
                <MonthlyCompareChart data={monthly} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Tren sisa bulanan" subtitle="Masuk - keluar" />
              <div className="px-2 pt-2 pb-3">
                <NetTrendChart data={monthly} />
              </div>
            </Card>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Keluar per hari" subtitle="Pola mingguan" />
              <div className="px-2 pt-2 pb-3">
                <WeekdayChart data={weekday} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Tempat belanja favorit" subtitle="Total belanja terbanyak" />
              <ul className="divide-y divide-border">
                {merchants.length ? (
                  merchants.map((m, i) => (
                    <li key={m.name} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="num w-5 text-xs text-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{m.name}</span>
                        <span className="text-[11px] text-muted">{m.count}× transaksi</span>
                      </span>
                      <span className="num text-sm font-medium">{formatIDR(m.total)}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-6 text-center text-xs text-muted">
                    Isi nama tempat belanja buat liat rankingnya.
                  </li>
                )}
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title="Detail per kategori" subtitle={monthLabel(month)} />
            <ul className="divide-y divide-border">
              {slices.map((c) => (
                <li key={c.category_id} className="flex items-center gap-3 px-4 py-3">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{c.name}</span>
                    <span className="text-[11px] text-muted">{c.count} transaksi</span>
                  </span>
                  <span className="text-right">
                    <span className="num block text-sm font-medium">{formatIDR(c.total)}</span>
                    <span className="text-[11px] text-muted">{pct(c.total, t[scope])}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={ChartPie}
            title="Belum ada data buat dianalisis"
            description="Catat beberapa transaksi dulu, nanti grafiknya muncul otomatis."
          />
        </Card>
      )}
    </div>
  );
}
