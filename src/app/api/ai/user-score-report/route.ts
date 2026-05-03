import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  USER_SCORE_REPORT_SYSTEM_PROMPT,
  buildUserScorePrompt,
  generateFallbackReport,
  type UserScoreReport,
} from "@/lib/userScoreReport";
import type { ScoreCapilarAnswers } from "@/lib/scoreCapilar";

const AI_MODEL = "gpt-4o";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ImageContentPart = { type: "image_url"; image_url: { url: string; detail: "auto" } };
type TextContentPart = { type: "text"; text: string };
type ContentPart = TextContentPart | ImageContentPart;

interface RequestBody {
  answers: ScoreCapilarAnswers;
  score: number;
  prioridad: string;
  edadCapilar: number;
  ruta: string;
  photosUploaded: number;
  photoFrontalUrl?: string | null;
  photoTopUrl?: string | null;
  leadId?: string | null;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { answers, score, prioridad, edadCapilar, ruta, photosUploaded, photoFrontalUrl, photoTopUrl, leadId } = body;

  if (!answers || score === undefined || !prioridad || !ruta) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const fallbackReport = generateFallbackReport({ answers, score, prioridad, edadCapilar, ruta });

  // If OpenAI not configured, return deterministic fallback
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[ai/user-score-report] OPENAI_API_KEY not configured — returning fallback");
    return NextResponse.json({ report: fallbackReport, isFallback: true });
  }

  try {
    const userText = buildUserScorePrompt({ answers, score, prioridad, edadCapilar, ruta, photosUploaded });

    const userContent: ContentPart[] = [{ type: "text", text: userText }];

    // Attach photos if available (vision input)
    const photoLabels: string[] = [];
    if (photoFrontalUrl) {
      photoLabels.push("Foto frontal");
      userContent.push({ type: "image_url", image_url: { url: photoFrontalUrl, detail: "auto" } });
    }
    if (photoTopUrl) {
      photoLabels.push("Foto de coronilla");
      userContent.push({ type: "image_url", image_url: { url: photoTopUrl, detail: "auto" } });
    }
    if (photoLabels.length > 0) {
      userContent.push({
        type: "text",
        text: `Se adjuntan ${photoLabels.length} foto(s) del usuario: ${photoLabels.join(", ")}. Úsalas solo como referencia visual general. No hagas afirmaciones clínicas sobre ellas.`,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

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
            { role: "system", content: USER_SCORE_REPORT_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[ai/user-score-report] OpenAI error:", aiResponse.status, errText);
      return NextResponse.json({ report: fallbackReport, isFallback: true });
    }

    const aiData = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[ai/user-score-report] Empty AI response");
      return NextResponse.json({ report: fallbackReport, isFallback: true });
    }

    let report: UserScoreReport;
    try {
      report = JSON.parse(rawContent) as UserScoreReport;
    } catch {
      console.error("[ai/user-score-report] Failed to parse AI JSON:", rawContent.slice(0, 200));
      return NextResponse.json({ report: fallbackReport, isFallback: true });
    }

    // Non-blocking: save to user_score_reports if persistence is configured
    // TODO: Run migration before going live:
    //   CREATE TABLE user_score_reports (
    //     id uuid primary key default gen_random_uuid(),
    //     lead_id uuid references score_capilar_leads(id) on delete set null,
    //     score integer, prioridad text, ruta text, edad_capilar integer,
    //     friendly_summary text, score_explanation text, main_concern_area text,
    //     preliminary_route_explanation text,
    //     common_mistakes jsonb, next_steps jsonb,
    //     cta_title text, cta_body text, cta_button text, disclaimer text,
    //     is_fallback boolean default false, model_name text,
    //     created_at timestamptz default now()
    //   );
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getAdminClient();
        await supabase.from("user_score_reports").insert({
          lead_id: leadId ?? null,
          score,
          prioridad,
          ruta,
          edad_capilar: edadCapilar,
          friendly_summary: report.friendly_summary,
          score_explanation: report.score_explanation,
          main_concern_area: report.main_concern_area,
          preliminary_route_explanation: report.preliminary_route_explanation,
          common_mistakes: report.common_mistakes,
          next_steps: report.next_steps,
          cta_title: report.cta_title,
          cta_body: report.cta_body,
          cta_button: report.cta_button,
          disclaimer: report.disclaimer,
          is_fallback: false,
          model_name: AI_MODEL,
        });
      } catch {
        // Never block response on DB failure
      }
    }

    return NextResponse.json({ report, isFallback: false });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[ai/user-score-report]", isAbort ? "Request timed out" : "Unexpected error:", err);
    return NextResponse.json({ report: fallbackReport, isFallback: true });
  }
}
