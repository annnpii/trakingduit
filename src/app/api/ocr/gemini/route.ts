import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isSupabaseConfigured, supabaseFromRequest } from "@/lib/supabase";
import { ocrRequestSchema, createErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";

interface GeminiOcrResponse {
  merchant?: string;
  date?: string;
  total?: number;
  tax?: number;
  items?: Array<{
    name: string;
    qty?: number;
    price: number;
  }>;
  raw_text: string;
}

/**
 * POST /api/ocr/gemini — Gemini Flash vision-based OCR with structured extraction.
 * Returns 501 when GEMINI_API_KEY is unset so the client falls back to other engines.
 * 
 * Uses Gemini 2.0 Flash (free tier: 1500 req/day) with structured prompting to
 * extract receipt fields directly, skipping keyword-based parsing.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured) {
    const sb = supabaseFromRequest(request);
    if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum diset", fallback: "vision" },
      { status: 501 },
    );
  }

  let image: string | undefined;
  try {
    const body = await request.json();
    const validated = ocrRequestSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        createErrorResponse(`Invalid request: ${validated.error.issues[0]?.message}`),
        { status: 400 }
      );
    }
    
    image = validated.data.image;
  } catch {
    return NextResponse.json(createErrorResponse("Body JSON tidak valid"), { status: 400 });
  }
  if (!image) return NextResponse.json(createErrorResponse("Field 'image' wajib diisi"), { status: 400 });

  const base64 = image.includes(",") ? image.split(",")[1] : image;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Kamu adalah OCR expert untuk struk belanja Indonesia. Baca gambar struk ini dan extract informasi berikut dalam format JSON:

{
  "merchant": "nama toko/merchant (string, atau null jika tidak ada)",
  "date": "tanggal transaksi format YYYY-MM-DD (string, atau null jika tidak ada)",
  "total": "total pembayaran (number dalam rupiah, atau null jika tidak ada)",
  "tax": "pajak/PPN jika ada (number dalam rupiah, atau null jika tidak ada)",
  "items": [
    {
      "name": "nama item",
      "qty": "jumlah item (number, atau undefined jika tidak ada)",
      "price": "harga item (number dalam rupiah)"
    }
  ],
  "raw_text": "seluruh teks yang terbaca dari struk (string)"
}

PENTING:
- Merchant biasanya di baris paling atas
- Cari keyword: "total", "grand total", "total bayar", "jumlah"
- Cari keyword pajak: "ppn", "pb1", "tax", "pajak"
- Format tanggal bisa DD/MM/YYYY, DD-MM-YYYY, atau "13 Mei 2024"
- Angka bisa pakai separator titik (1.000) atau koma (1,000)
- Konversi semua angka ke number (buang separator)
- Items: cari baris dengan format "nama_item harga" atau "qty x nama_item harga"
- Jika tidak yakin, set null (bukan string kosong)
- raw_text harus isi SEMUA teks yang kamu baca dari gambar

Respond HANYA dengan JSON, tanpa markdown code fence atau text lain.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    let parsed: GeminiOcrResponse;
    try {
      // Remove markdown code fences if present
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return NextResponse.json(
        createErrorResponse("Gemini response bukan JSON valid"),
        { status: 502 },
      );
    }

    if (!parsed.raw_text?.trim()) {
      return NextResponse.json(
        createErrorResponse("Gemini tidak bisa baca teks dari gambar"),
        { status: 502 },
      );
    }

    return NextResponse.json({
      text: parsed.raw_text,
      structured: {
        merchant: parsed.merchant,
        date: parsed.date,
        total: parsed.total,
        tax: parsed.tax,
        items: parsed.items || [],
      },
      engine: "gemini",
    });
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(err instanceof Error ? err.message : "Gemini request gagal"),
      { status: 502 },
    );
  }
}
