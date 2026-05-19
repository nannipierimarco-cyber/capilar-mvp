import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  HAIR_MAP_SYSTEM_PROMPT,
  HAIR_MAP_USER_PROMPT,
  generateFallbackHairAnalysis,
} from "@/lib/hairMapAnalysis";
import type { HairMapReport } from "@/lib/types";

const AI_MODEL = "gpt-4o";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function extractStoragePath(url: string): string | null {
  const marker = "/patient-photos/";
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}

async function toSignedUrl(
  supabase: ReturnType<typeof getAdminClient>,
  rawUrl: string | null
): Promise<string | null> {
  if (!rawUrl) return null;
  const path = extractStoragePath(rawUrl);
  if (!path) return rawUrl;
  const { data } = await supabase.storage
    .from("patient-photos")
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  return data?.signedUrl ?? rawUrl;
}

// Returns a server-side proxy URL so the browser never hits Supabase directly.
// Avoids signed-URL CORS/accessibility issues in headless and restricted environments.
function toProxyUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  const path = extractStoragePath(rawUrl);
  if (!path) return null;
  return `/api/images?path=${encodeURIComponent(path)}`;
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

export interface IntakeSnapshot {
  journey_type: string | null;
  hair_loss_duration: string | null;
  family_history: boolean | null;
  previous_treatments: string[] | null;
  medical_conditions: string[] | null;
  current_medications: boolean | null;
  loss_severity: string | null;
  severe_irritation: boolean | null;
  heart_disease: boolean | null;
  liver_disease: boolean | null;
  kidney_disease: boolean | null;
}

interface RouteResponse {
  report: HairMapReport;
  isFallback: boolean;
  frontalUrl: string | null;
  crownUrl: string | null;
  patientName: string;
  intake: IntakeSnapshot | null;
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
    const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl: null, crownUrl: null, patientName: "", intake: null };
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

  const intakeSnapshot: IntakeSnapshot = {
    journey_type: (intake.journey_type as string | null) ?? null,
    hair_loss_duration: (intake.hair_loss_duration as string | null) ?? null,
    family_history: (intake.family_history as boolean | null) ?? null,
    previous_treatments: (intake.previous_treatments as string[] | null) ?? null,
    medical_conditions: (intake.medical_conditions as string[] | null) ?? null,
    current_medications: (intake.current_medications as boolean | null) ?? null,
    loss_severity: (intake.loss_severity as string | null) ?? null,
    severe_irritation: (intake.severe_irritation as boolean | null) ?? null,
    heart_disease: (intake.heart_disease as boolean | null) ?? null,
    liver_disease: (intake.liver_disease as boolean | null) ?? null,
    kidney_disease: (intake.kidney_disease as boolean | null) ?? null,
  };

  const { data: photos } = await supabase
    .from("photos")
    .select("type, url")
    .eq("intake_id", intake_id);

  const photoMap = new Map(
    (photos ?? []).map((p: { type: string; url: string }) => [p.type, p.url])
  );

  // Signed URLs for GPT-4o vision (needs direct image access)
  const [frontalSignedUrl, crownSignedUrl, templesSignedUrl, sideSignedUrl] = await Promise.all([
    toSignedUrl(supabase, photoMap.get("frontal") ?? null),
    toSignedUrl(supabase, photoMap.get("crown") ?? null),
    toSignedUrl(supabase, photoMap.get("temples") ?? null),
    toSignedUrl(supabase, photoMap.get("side") ?? null),
  ]);

  // Proxy URLs for the browser (avoids signed-URL accessibility issues)
  const frontalUrl = toProxyUrl(photoMap.get("frontal") ?? null);
  const crownUrl = toProxyUrl(photoMap.get("crown") ?? null);

  const intakeContext = buildIntakeContext(intake as Record<string, unknown>, patientName);

  const userContent: ContentPart[] = [
    {
      type: "text",
      text: `DATOS DEL PACIENTE (respuestas del cuestionario):\n${intakeContext}\n\nAnaliza las fotos adjuntas teniendo en cuenta estos antecedentes y genera el reporte. ${HAIR_MAP_USER_PROMPT}`,
    },
  ];

  const photoOrder = [
    { url: frontalSignedUrl, label: "FOTO 1 — Vista frontal:" },
    { url: crownSignedUrl,   label: "FOTO 2 — Vista superior / coronilla:" },
    { url: templesSignedUrl, label: "FOTO 3 — Entradas:" },
    { url: sideSignedUrl,    label: "FOTO 4 — Vista lateral:" },
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
      const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName, intake: intakeSnapshot };
      return NextResponse.json(res);
    }

    const aiData = (await aiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[ai/patient-report] Empty AI response");
      const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName, intake: intakeSnapshot };
      return NextResponse.json(res);
    }

    let report: HairMapReport;
    try {
      report = JSON.parse(rawContent) as HairMapReport;
    } catch {
      console.error("[ai/patient-report] Failed to parse AI JSON:", rawContent.slice(0, 200));
      const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName, intake: intakeSnapshot };
      return NextResponse.json(res);
    }

    const res: RouteResponse = { report, isFallback: false, frontalUrl, crownUrl, patientName, intake: intakeSnapshot };
    return NextResponse.json(res);
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[ai/patient-report]", isAbort ? "timed out" : "unexpected error:", err);
    const res: RouteResponse = { report: fallback, isFallback: true, frontalUrl, crownUrl, patientName, intake: intakeSnapshot };
    return NextResponse.json(res);
  }
}
