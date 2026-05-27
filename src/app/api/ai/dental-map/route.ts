import { NextRequest, NextResponse } from "next/server";
import { generateFallbackDentalReport } from "@/lib/dental/types";
import { DENTAL_MAP_SYSTEM_PROMPT, buildDentalUserPrompt } from "@/lib/dental/prompts";
import type { DentalMapReport } from "@/lib/dental/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function isValidReport(obj: unknown): obj is DentalMapReport {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.promptVersion === "string" &&
    typeof r.summary === "object" && r.summary !== null &&
    Array.isArray(r.visualFindings) &&
    Array.isArray(r.zoneAnalysis) &&
    typeof r.visualDashboard === "object" &&
    typeof r.nextStep === "object" &&
    typeof r.disclaimer === "string"
  );
}

export async function POST(req: NextRequest) {
  const fallback = generateFallbackDentalReport();
  try {
    const formData = await req.formData();
    const photoFrontal = formData.get("photoFrontal") as File | null;
    const photoAbierta = formData.get("photoAbierta") as File | null;
    const answersRaw = formData.get("answers") as string | null;
    const answers: Record<string, string> = answersRaw ? JSON.parse(answersRaw) : {};

    async function toBase64(file: File): Promise<string> {
      const buffer = await file.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    }

    const imageContent: Array<{ type: "image_url"; image_url: { url: string; detail: "high" | "low" } }> = [];
    if (photoFrontal) {
      const b64 = await toBase64(photoFrontal);
      imageContent.push({ type: "image_url", image_url: { url: `data:${photoFrontal.type};base64,${b64}`, detail: "high" } });
    }
    if (photoAbierta) {
      const b64 = await toBase64(photoAbierta);
      imageContent.push({ type: "image_url", image_url: { url: `data:${photoAbierta.type};base64,${b64}`, detail: "high" } });
    }
    if (imageContent.length === 0) return NextResponse.json({ analysis: fallback, isFallback: true });

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: DENTAL_MAP_SYSTEM_PROMPT },
          { role: "user", content: [...imageContent, { type: "text", text: buildDentalUserPrompt(answers) }] },
        ],
      }),
      signal: AbortSignal.timeout(50_000),
    });

    if (!aiResponse.ok) {
      console.error("[ai/dental-map] OpenAI error:", aiResponse.status);
      return NextResponse.json({ analysis: fallback, isFallback: true });
    }
    const aiData = (await aiResponse.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = aiData.choices?.[0]?.message?.content;
    if (!rawContent) return NextResponse.json({ analysis: fallback, isFallback: true });

    let parsed: unknown;
    try { parsed = JSON.parse(rawContent); }
    catch { return NextResponse.json({ analysis: fallback, isFallback: true }); }

    if (!isValidReport(parsed)) {
      console.error("[ai/dental-map] Response did not match expected schema — using fallback");
      return NextResponse.json({ analysis: fallback, isFallback: true });
    }

    return NextResponse.json({ analysis: parsed, isFallback: false });
  } catch (err) {
    console.error("[ai/dental-map]", err);
    return NextResponse.json({ analysis: fallback, isFallback: true });
  }
}
