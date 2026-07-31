import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFromRequest } from "@/lib/supabase";

export const runtime = "nodejs";

interface VisionResponse {
  responses?: {
    fullTextAnnotation?: { text?: string };
    error?: { message?: string };
  }[];
}

/**
 * POST /api/ocr — Google Cloud Vision text detection.
 * Returns 501 when GOOGLE_VISION_API_KEY is unset so the client falls back to
 * in-browser Tesseract instead of failing the scan.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured) {
    const sb = supabaseFromRequest(request);
    if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_VISION_API_KEY belum diset", fallback: "tesseract" },
      { status: 501 },
    );
  }

  let image: string | undefined;
  try {
    ({ image } = (await request.json()) as { image?: string });
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  if (!image) return NextResponse.json({ error: "Field 'image' wajib diisi" }, { status: 400 });

  const base64 = image.includes(",") ? image.split(",")[1] : image;

  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["id", "en"] },
          },
        ],
      }),
    });

    const json = (await res.json()) as VisionResponse;
    const first = json.responses?.[0];
    if (!res.ok || first?.error) {
      return NextResponse.json(
        { error: first?.error?.message ?? "Vision API error" },
        { status: 502 },
      );
    }
    return NextResponse.json({ text: first?.fullTextAnnotation?.text ?? "", engine: "google-vision" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Vision request gagal" },
      { status: 502 },
    );
  }
}
