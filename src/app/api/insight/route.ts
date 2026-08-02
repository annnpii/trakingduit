import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isSupabaseConfigured, supabaseFromRequest } from "@/lib/supabase";
import { insightRequestSchema, createErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

const SYSTEM = `Kamu penasihat keuangan pribadi untuk pengguna Indonesia.
Kamu menerima ringkasan keuangan bulanan dalam JSON (mata uang Rupiah).
Tugasmu: beri analisis singkat, konkret, dan actionable dalam bahasa Indonesia.

Aturan:
- Sebut angka dari data, jangan mengarang angka yang tidak ada.
- Fokus ke pola yang bisa diubah pengguna bulan depan.
- Nada praktis dan tidak menghakimi. Hindari jargon finansial berat.
- Setiap rekomendasi harus punya langkah konkret, bukan nasihat umum.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Ringkasan kondisi keuangan bulan ini, maksimal 3 kalimat.",
    },
    highlights: {
      type: "array",
      description: "3-5 temuan penting dari data.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Judul temuan, maksimal 8 kata." },
          detail: { type: "string", description: "Penjelasan 1-2 kalimat dengan angka." },
          tone: { type: "string", enum: ["positive", "warning", "danger", "neutral"] },
        },
        required: ["title", "detail", "tone"],
        additionalProperties: false,
      },
    },
    actions: {
      type: "array",
      description: "2-4 langkah konkret untuk bulan depan.",
      items: {
        type: "object",
        properties: {
          action: { type: "string", description: "Langkah yang bisa langsung dikerjakan." },
          impact: { type: "string", description: "Perkiraan dampak, sertakan angka bila bisa." },
        },
        required: ["action", "impact"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "highlights", "actions"],
  additionalProperties: false,
} as const;

/**
 * POST /api/insight — LLM summary on top of the local rule-based engine.
 * Returns 501 when ANTHROPIC_API_KEY is unset so the client keeps using the
 * offline insights instead of showing an error.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured) {
    const sb = supabaseFromRequest(request);
    if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY belum diset", fallback: "rules" },
      { status: 501 },
    );
  }

  let payload: unknown;
  try {
    const body = await request.json();
    const validated = insightRequestSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        createErrorResponse(`Invalid request: ${validated.error.issues[0]?.message}`),
        { status: 400 }
      );
    }
    
    payload = validated.data.payload;
  } catch {
    return NextResponse.json(createErrorResponse("Body JSON tidak valid"), { status: 400 });
  }
  if (!payload) return NextResponse.json(createErrorResponse("Field 'payload' wajib"), { status: 400 });

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Ringkasan keuangan bulan ini:\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Permintaan ditolak model" }, { status: 422 });
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ insight: JSON.parse(text), model: response.model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memanggil model";
    return NextResponse.json(createErrorResponse(message), { status: 502 });
  }
}
