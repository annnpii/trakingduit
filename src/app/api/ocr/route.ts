import { NextResponse } from "next/server";
import { ocrRequestSchema, createErrorResponse } from "@/lib/validation";

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
  // No auth required: this route only OCRs the uploaded image and touches no
  // user data, so local-only users (no cloud account) must reach it too.

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_VISION_API_KEY belum diset", fallback: "tesseract" },
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
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey, // Use header instead of query param
      },
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
        createErrorResponse(first?.error?.message ?? "Vision API error"),
        { status: 502 },
      );
    }
    return NextResponse.json({ text: first?.fullTextAnnotation?.text ?? "", engine: "google-vision" });
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(err instanceof Error ? err.message : "Vision request gagal"),
      { status: 502 },
    );
  }
}
