import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFromRequest } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

// Konfigurasi via env (jangan simpan secret di source). Set di Vercel:
//   TRADU_API_URL  -> contoh: https://<tunnel>.trycloudflare.com/v1
//   TRADU_API_KEY  -> API key (mis. sk-...)
//   TRADU_MODEL    -> default "hermes"
const API_URL = process.env.TRADU_API_URL;
const API_KEY = process.env.TRADU_API_KEY;
const MODEL = process.env.TRADU_MODEL ?? "hermes";

export async function POST(req: Request) {
  if (isSupabaseConfigured) {
    const sb = supabaseFromRequest(req);
    if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }

  try {
    const { messages, financialContext } = await req.json();

    if (!API_URL || !API_KEY) {
      return NextResponse.json(
        { error: "TRADU belum dikonfigurasi (TRADU_API_URL / TRADU_API_KEY kosong)" },
        { status: 503 },
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Format financial details into a concise string for system prompt injection
    const balanceStr = financialContext ? `
Kondisi Keuangan Riel Pengguna Saat Ini:
- Total Saldo Seluruh Dompet: Rp${financialContext.totalBalance.toLocaleString("id-ID")}
- Pemasukan Bulan Ini: Rp${financialContext.income.toLocaleString("id-ID")}
- Pengeluaran Bulan Ini: Rp${financialContext.expense.toLocaleString("id-ID")}
- Selisih (Net): Rp${financialContext.net.toLocaleString("id-ID")}

Top Kategori Pengeluaran Bulan Ini:
${financialContext.topCategories?.map((c: any) => `- ${c.name}: Rp${c.total.toLocaleString("id-ID")} (${Math.round(c.share * 100)}%)`).join("\n") || "- (Belum ada data pengeluaran)"}

Transaksi Terakhir:
${financialContext.recentTransactions?.map((tx: any) => `- ${tx.date}: ${tx.description} (${tx.type === "expense" ? "Keluar" : "Masuk"}) Rp${tx.amount.toLocaleString("id-ID")}`).join("\n") || "- (Belum ada transaksi)"}
` : "";

    const systemPrompt = `Kamu adalah Tradu (Trakingduit), asisten dan teman finansial pribadi berbasis AI untuk Gen Z.
Ciri khas bahasamu:
- Menggunakan bahasa santai/gaul/informal Indonesia kekinian (lo, gue, boncos, anjir, gokil, foya-foya, rebahan, dll).
- Blak-blakan, sarkas, tapi tetap ramah dan peduli.
- Suka me-roast pengeluaran mereka secara jenaka jika mereka boros (pengeluaran > pemasukan, belanja tak berfaedah), namun tetap memberikan tips finansial yang taktis, logis, dan konkret.
- Jawab singkat padat, langsung ke intinya, hindari bertele-tele atau ceramah formal. Maksimal 3-4 kalimat per respons.

${balanceStr}

Dalam percakapan ini, tanggapi pertanyaan pengguna sesuai dengan kepribadian Tradu dan memanfaatkan data keuangan di atas jika relevan.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const apiRes = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      return NextResponse.json(
        { error: `API Error (${apiRes.status}): ${errorText}` },
        { status: 502 }
      );
    }

    const data = await apiRes.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
