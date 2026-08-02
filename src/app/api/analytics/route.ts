import { NextResponse } from "next/server";
import {
  byCategory,
  byWeekday,
  dailySeries,
  monthlySeries,
  recentMonths,
  savingsRate,
  topMerchants,
  totals,
} from "@/lib/analytics";
import { supabaseFromRequest } from "@/lib/supabase";
import type { Category, Transaction } from "@/lib/types";
import { monthRange, toMonthKey } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * GET /analytics?month=YYYY-MM — aggregate report for one month plus a 6-month
 * trend. Reuses the same pure functions the client charts use, so the numbers
 * match the dashboard exactly.
 */
export async function GET(request: Request) {
  const sb = supabaseFromRequest(request);
  if (!sb) {
    return NextResponse.json(
      { error: "Butuh header Authorization: Bearer <access_token>" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? toMonthKey();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parameter month harus YYYY-MM" }, { status: 400 });
  }

  const months = recentMonths(month, 6);
  const rangeStart = `${months[0]}-01`;
  const rangeEnd = monthRange(month).to;

  const [txRes, catRes] = await Promise.all([
    sb.from("transactions").select("*").eq("deleted", 0).gte("date", rangeStart).lte("date", rangeEnd).limit(5000), // Add pagination limit
    sb.from("categories").select("*").eq("deleted", 0),
  ]);

  if (txRes.error) return NextResponse.json({ error: txRes.error.message }, { status: 400 });
  if (catRes.error) return NextResponse.json({ error: catRes.error.message }, { status: 400 });

  const all = (txRes.data ?? []) as Transaction[];
  const categories = (catRes.data ?? []) as Category[];
  const monthTx = all.filter((t) => t.date.startsWith(month));
  const t = totals(monthTx);

  return NextResponse.json({
    month,
    currency: "IDR",
    totals: t,
    savings_rate: Number(savingsRate(t).toFixed(3)),
    by_category: {
      expense: byCategory(monthTx, categories, "expense"),
      income: byCategory(monthTx, categories, "income"),
    },
    daily: dailySeries(monthTx, month),
    monthly: monthlySeries(all, months),
    weekday: byWeekday(monthTx),
    top_merchants: topMerchants(monthTx, 5),
  });
}
