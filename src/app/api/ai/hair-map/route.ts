import { NextRequest, NextResponse } from "next/server";
import {
  HAIR_MAP_SYSTEM_PROMPT,
  generateFallbackHairAnalysis,
  type HairAnalysisResult,
} from "@/lib/hairMapAnalysis";

const AI_MODEL = "gpt-4o";

type ImageContentPart = { type: "image_url"; image_url: { url: string; detail: "high" } };
type TextContentPart = { type: "text"; text: string };
type ContentPart = TextContentPart | ImageContentPart;

interface RequestBody {
  photoFrontalUrl?: string | null;
  photoTopUrl?: string | null;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { photoFrontalUrl, photoTopUrl } = body;
  const fallback = generateFallbackHairAnalysis();

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[ai/hair-map] OPENAI_API_KEY not configured — returning fallback");
    return NextResponse.json({ analysis: fallback, isFallback: true });
  }

  if (!photoFrontalUrl && !photoTopUrl) {
    console.warn("[ai/hair-map] No photo URLs provided — returning fallback");
    return NextResponse.json({ analysis: fallback, isFallback: true });
  }

  try {
    const userContent: ContentPart[] = [
      {
        type: "text",
        text: "Analiza las siguientes fotos de pelo y cuero cabelludo y devuelve el JSON estructurado según el esquema indicado.",
      },
    ];

    if (photoFrontalUrl) {
      userContent.push({ type: "text", text: "FOTO 1 — Vista frontal o lateral:" });
      userContent.push({ type: "image_url", image_url: { url: photoFrontalUrl, detail: "high" } });
    }

    if (photoTopUrl) {
      userContent.push({ type: "text", text: "FOTO 2 — Vista superior / coronilla:" });
      userContent.push({ type: "image_url", image_url: { url: photoTopUrl, detail: "high" } });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: HAIR_MAP_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          max_tokens: 1000,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[ai/hair-map] OpenAI error:", aiResponse.status, errText);
      return NextResponse.json({ analysis: fallback, isFallback: true });
    }

    const aiData = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[ai/hair-map] Empty AI response");
      return NextResponse.json({ analysis: fallback, isFallback: true });
    }

    let analysis: HairAnalysisResult;
    try {
      analysis = JSON.parse(rawContent) as HairAnalysisResult;
    } catch {
      console.error("[ai/hair-map] Failed to parse AI JSON:", rawContent.slice(0, 200));
      return NextResponse.json({ analysis: fallback, isFallback: true });
    }

    return NextResponse.json({ analysis, isFallback: false });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[ai/hair-map]", isAbort ? "Request timed out" : "Unexpected error:", err);
    return NextResponse.json({ analysis: fallback, isFallback: true });
  }
}
