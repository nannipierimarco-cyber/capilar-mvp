import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  HAIR_MAP_SYSTEM_PROMPT,
  HAIR_MAP_USER_PROMPT,
  generateFallbackHairAnalysis,
} from "@/lib/hairMapAnalysis";
import type { HairMapReport } from "@/lib/types";

const AI_MODEL = "gpt-4o";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function boolLabel(val: unknown): string {
  if (val === true) return "sí";
  if (val === false) return "no";
  return "no reportado";
}

function buildIntakeContext(intake: Record<string, unknown>, patientName: string): string {
  const lines = [
    `Paciente: ${patientName}`,
    `Tipo de ruta: ${intake.journey_type ?? "—"}`,
    `Duración de la caída: ${intake.hair_loss_duration ?? "—"}`,
    `Patrón declarado: ${intake.hair_pattern ?? intake.main_area ?? "—"}`,
    `Patrón de inicio: ${intake.sudden_or_gradual ?? "—"}`,
    `Antecedentes familiares de caída: ${boolLabel(intake.family_history)}`,
    `Objetivo: ${intake.goal ?? "—"}`,
    `Tratamientos previos: ${
      Array.isArray(intake.previous_treatments) && (intake.previous_treatments as string[]).length
        ? (intake.previous_treatments as string[]).join(", ")
        : "ninguno"
    }`,
    `Irritación severa: ${boolLabel(intake.severe_irritation)}`,
  ];
  return lines.join("\n");
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "high" } };

interface RouteResponse {
  report: HairMapReport;
  isFallback: boolean;
  frontalUrl: string | null;
  crownUrl: string | null;
  patientName: string;
}

export async function POST(req: NextRequest) {
  let body: { intake_id?: string };
  try {
    body = (await req.json()) as { intake_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { intake_id } = body;
  if (!intake_id) {
    return NextResponse.json({ error: "intake_id required" }, { status: 400 });
  }

  const fallback = generateFallbackHairAnalysis();

  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[ai/patient-report] Missing env vars — returning fallback");
    const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl: null, crownUrl: null, patientName: "" };
    return NextResponse.json(res);
  }

  const supabase = getAdminClient();

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("*, patients(first_name, last_name)")
    .eq("id", intake_id)
    .single();

  if (intakeError || !intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  const patient = intake.patients as { first_name: string; last_name: string } | null;
  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "";

  const { data: photos } = await supabase
    .from("photos")
    .select("type, url")
    .eq("intake_id", intake_id);

  const photoMap = new Map(
    (photos ?? []).map((p: { type: string; url: string }) => [p.type, p.url])
  );
  const frontalUrl = photoMap.get("frontal") ?? null;
  const crownUrl = photoMap.get("crown") ?? null;
  const templesUrl = photoMap.get("temples") ?? null;
  const sideUrl = photoMap.get("side") ?? null;

  const intakeContext = buildIntakeContext(intake as Record<string, unknown>, patientName);

  const userContent: ContentPart[] = [
    {
      type: "text",
      text: `DATOS DEL PACIENTE (respuestas del cuestionario):\n${intakeContext}\n\nAnaliza las fotos adjuntas teniendo en cuenta estos antecedentes y genera el reporte. ${HAIR_MAP_USER_PROMPT}`,
    },
  ];

  const photoOrder = [
    { url: frontalUrl, label: "FOTO 1 — Vista frontal:" },
    { url: crownUrl, label: "FOTO 2 — Vista superior / coronilla:" },
    { url: templesUrl, label: "FOTO 3 — Entradas:" },
    { url: sideUrl, label: "FOTO 4 — Vista lateral:" },
  ];

  for (const { url, label } of photoOrder) {
    if (url) {
      userContent.push({ type: "text", text: label });
      userContent.push({ type: "image_url", image_url: { url, detail: "high" } });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
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
          max_tokens: 2500,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[ai/patient-report] OpenAI error:", aiResponse.status, errText);
      const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName };
      return NextResponse.json(res);
    }

    const aiData = (await aiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[ai/patient-report] Empty AI response");
      const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName };
      return NextResponse.json(res);
    }

    let report: HairMapReport;
    try {
      report = JSON.parse(rawContent) as HairMapReport;
    } catch {
      console.error("[ai/patient-report] Failed to parse AI JSON:", rawContent.slice(0, 200));
      const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName };
      return NextResponse.json(res);
    }

    const res: RouteResponse = { report, isFallback: false, frontalUrl, crownUrl, patientName };
    return NextResponse.json(res);
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[ai/patient-report]", isAbort ? "timed out" : "unexpected error:", err);
    const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName };
    return NextResponse.json(res);
  }
}
