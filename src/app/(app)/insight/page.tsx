"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CircleCheck,
  Lightbulb,
  Sparkles,
  TriangleAlert,
  Wand2,
  CircleAlert,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildInsightPayload, buildInsights, type Insight, type InsightTone } from "@/lib/insight";
import { cn, toMonthKey } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, EmptyState, useToast } from "@/components/ui";
import { MonthSwitcher, monthLabel } from "@/components/layout/month-switcher";

interface AiInsight {
  summary: string;
  highlights: { title: string; detail: string; tone: InsightTone }[];
  actions: { action: string; impact: string }[];
}

const TONE_ICON = {
  positive: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  neutral: Lightbulb,
} as const;

const TONE_CLASS = {
  positive: "bg-income/10 text-income border-income/20",
  warning: "bg-warn/10 text-warn border-warn/20",
  danger: "bg-expense/10 text-expense border-expense/20",
  neutral: "bg-brand/10 text-brand border-brand/20",
} as const;

export default function InsightPage() {
  const toast = useToast();
  const [month, setMonth] = React.useState(toMonthKey());
  const [ai, setAi] = React.useState<AiInsight | null>(null);
  const [aiModel, setAiModel] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const transactions = useLiveQuery(
    () => db().transactions.filter((t) => !t.deleted).toArray(),
    [],
    [],
  );
  const categories = useLiveQuery(() => db().categories.filter((c) => !c.deleted).toArray(), [], []);
  const budgets = useLiveQuery(() => db().budgets.filter((b) => !b.deleted).toArray(), [], []);
  const goals = useLiveQuery(() => db().goals.filter((g) => !g.deleted).toArray(), [], []);

  const input = React.useMemo(
    () => ({ month, transactions, categories, budgets, goals }),
    [month, transactions, categories, budgets, goals],
  );
  const local: Insight[] = React.useMemo(() => buildInsights(input), [input]);
  const hasData = transactions.some((t) => t.date.startsWith(month));

  React.useEffect(() => {
    setAi(null);
    setAiModel("");
  }, [month]);

  async function askAi() {
    setLoading(true);
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: buildInsightPayload(input) }),
      });
      if (res.status === 501) {
        toast("AI belum aktif - set ANTHROPIC_API_KEY di .env.local", "info");
        return;
      }
      const json = (await res.json()) as { insight?: AiInsight; model?: string; error?: string };
      if (!res.ok || !json.insight) throw new Error(json.error ?? "Gagal ambil insight");
      setAi(json.insight);
      setAiModel(json.model ?? "");
      toast("Insight AI siap", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal ambil insight", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MonthSwitcher value={month} onChange={setMonth} />
        <Button onClick={askAi} loading={loading} disabled={!hasData}>
          <Wand2 className="size-4" /> Analisis dengan AI
        </Button>
      </div>

      {ai ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">Ringkasan AI</h2>
                {aiModel ? <Badge tone="brand">{aiModel}</Badge> : null}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{ai.summary}</p>
            </div>
          </div>

          {ai.highlights.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ai.highlights.map((h, i) => {
                const Icon = TONE_ICON[h.tone] ?? Lightbulb;
                return (
                  <div key={i} className={cn("rounded-xl border p-3", TONE_CLASS[h.tone] ?? TONE_CLASS.neutral)}>
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="size-3.5" /> {h.title}
                    </p>
                    <p className="mt-1 text-xs opacity-90">{h.detail}</p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {ai.actions.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted">Plan bulan depan</p>
              <ol className="space-y-2">
                {ai.actions.map((a, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-border bg-surface-2 p-3">
                    <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-semibold text-brand-fg">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm">{a.action}</span>
                      <span className="mt-0.5 block text-xs text-muted">{a.impact}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Insight otomatis"
          subtitle="Insight ini dihitung otomatis dari data lo di device ini"
        />
        {hasData ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {local.map((item) => {
              const Icon = TONE_ICON[item.tone];
              return (
                <div key={item.id} className={cn("rounded-xl border p-3.5", TONE_CLASS[item.tone])}>
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-90">{item.body}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Belum ada data bulan ini"
            description="Catat transaksi dulu, insight muncul otomatis tanpa perlu tombol."
          />
        )}
      </Card>

      <p className="px-1 text-[11px] text-muted">
        Insight otomatis dihitung lokal dari data di perangkat. Analisis AI mengirim ringkasan
        agregat (total, kategori, tren) ke API - bukan detail transaksi mentah - dan hanya jalan
        kalau lo tekan tombolnya.
      </p>
    </div>
  );
}
