import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateFallbackAnalysisReport,
  type HairMapAnalysisReport,
  type MapaCapilarAnswers,
} from "@/lib/mapaCapilar";

const SYSTEM_PROMPT = `Eres un asistente experto en análisis visual capilar y cuero cabelludo para una experiencia digital de orientación capilar.

Analiza las imágenes del usuario:
1. Foto frontal/lateral: evalúa línea capilar, entradas, densidad frontal, textura y estado general.
2. Foto superior/coronilla: evalúa cobertura de coronilla, visibilidad del cuero cabelludo y densidad general.

Utiliza obligatoriamente las respuestas iniciales del usuario como contexto adicional del análisis.

REGLAS ABSOLUTAS:
- No hagas diagnóstico médico.
- No uses "alopecia" como diagnóstico afirmativo.
- No indiques tratamientos farmacológicos como receta.
- No prometas resultados.
- No incluyas rutinas, ingredientes, shampoos, productos, tratamientos ni paso a paso.
- Usa lenguaje preventivo, educativo y orientativo.
- Incluye siempre un disclaimer médico.
- Devuelve SOLO JSON válido. Nada de texto fuera del JSON.`;

function buildUserPrompt(answers: Partial<MapaCapilarAnswers>, hasPhotos: boolean): string {
  return `Respuestas del usuario:
- Preocupación principal: ${answers.concern ?? "No especificado"}
- Tiempo con cambios: ${answers.duration ?? "No especificado"}
- Tratamientos previos: ${answers.previousTreatment ?? "No especificado"}
- Historial familiar: ${answers.familyHistory ?? "No especificado"}
- Objetivo: ${answers.goal ?? "No especificado"}

${hasPhotos ? "Se adjuntan las fotos para análisis visual." : "No hay fotos disponibles; basa el análisis solo en las respuestas."}

Devuelve SOLO este JSON (sin texto adicional):

{
  "summary": {
    "title": "Mapa Capilar IA",
    "mainFinding": "hallazgo principal orientativo en 1 oración",
    "overallScore": 75,
    "confidence": "Baja|Media|Alta",
    "priority": "descripción corta de prioridad"
  },
  "userContext": {
    "age": "según respuestas o No especificado",
    "gender": "según respuestas o No especificado",
    "mainConcern": "${answers.concern ?? "No especificado"}",
    "hairLossDuration": "${answers.duration ?? "No especificado"}",
    "familyHistory": "${answers.familyHistory ?? "No especificado"}",
    "scalpSymptoms": [],
    "washFrequency": "No especificado",
    "previousTreatments": "${answers.previousTreatment ?? "No especificado"}"
  },
  "visualAnalysis": {
    "hairType": "Liso|Ondulado|Rizado|Afro / muy rizado|No concluyente",
    "density": "Baja|Media|Alta|No concluyente",
    "hairline": "Estable|Recesión leve|Recesión moderada|Recesión avanzada|No concluyente",
    "scalpVisibility": "Baja|Moderada|Alta",
    "crownCoverage": "Buena|Reducida|Baja",
    "hairTexture": "Fina|Media|Gruesa",
    "hairThickness": "Fino|Medio|Grueso",
    "overallCondition": "descripción breve (máx. 6 palabras)"
  },
  "zones": {
    "frontalLine": { "status": "texto breve", "score": 75, "label": "etiqueta breve" },
    "frontalDensity": { "status": "texto breve", "score": 75, "label": "etiqueta breve" },
    "temples": { "status": "texto breve", "score": 75, "label": "etiqueta breve" },
    "crown": { "status": "texto breve", "score": 75, "label": "etiqueta breve" },
    "scalpHealth": { "status": "texto breve", "score": 75, "label": "etiqueta breve" }
  },
  "riskAreas": [
    { "area": "Entradas|Zona frontal|Zona media|Coronilla", "level": "Bajo|Medio|Alto", "reason": "razón breve" }
  ],
  "visualTags": ["tag1", "tag2"],
  "photoCallouts": {
    "frontPhoto": [{ "label": "observación", "area": "zona", "level": "Bajo|Medio|Alto" }],
    "crownPhoto": [{ "label": "observación", "area": "zona", "level": "Bajo|Medio|Alto" }]
  },
  "disclaimer": "Este análisis es visual y orientativo. No constituye diagnóstico médico ni reemplaza una evaluación profesional."
}`;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function uploadPhoto(
  dataUrl: string,
  path: string
): Promise<string | null> {
  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    const buffer = Buffer.from(base64, "base64");
    const supabase = getAdminClient();
    const { error } = await supabase.storage
      .from("patient-photos")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
    if (error) return null;
    return supabase.storage.from("patient-photos").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

interface RequestBody {
  answers: Partial<MapaCapilarAnswers>;
  photoFrontal?: string; // data URL
  photoCrown?: string;   // data URL
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { answers, photoFrontal, photoCrown } = body;
  const hasPhotos = !!(photoFrontal || photoCrown);
  const fallback = generateFallbackAnalysisReport(answers);
  const hasDB = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Create DB record
  let recordId: string | null = null;
  if (hasDB) {
    try {
      const supabase = getAdminClient();
      const { data } = await supabase
        .from("hair_map_analyses")
        .insert({
          concern: answers.concern ?? null,
          duration: answers.duration ?? null,
          previous_treatment: answers.previousTreatment ?? null,
          family_history: answers.familyHistory ?? null,
          goal: answers.goal ?? null,
          status: "processing",
        })
        .select("id")
        .single();
      recordId = data?.id ?? null;
    } catch {
      // DB not ready — proceed without persistence
    }
  }

  // Upload photos and run AI in parallel
  let frontalUrl: string | null = null;
  let crownUrl: string | null = null;
  let report: HairMapAnalysisReport = fallback;

  if (hasDB && recordId) {
    const ts = Date.now();

    const [fUrl, cUrl] = await Promise.all([
      photoFrontal
        ? uploadPhoto(photoFrontal, `mapa-capilar/${recordId}_${ts}_frontal`)
        : Promise.resolve(null),
      photoCrown
        ? uploadPhoto(photoCrown, `mapa-capilar/${recordId}_${ts}_crown`)
        : Promise.resolve(null),
    ]);
    frontalUrl = fUrl;
    crownUrl = cUrl;
  }

  // Call OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      type ContentPart =
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string; detail: "auto" } };

      const userContent: ContentPart[] = [
        { type: "text", text: buildUserPrompt(answers, hasPhotos) },
      ];

      if (photoFrontal?.startsWith("data:image")) {
        userContent.push({ type: "text", text: "FOTO 1 — Frontal/lateral:" });
        userContent.push({ type: "image_url", image_url: { url: photoFrontal, detail: "auto" } });
      }
      if (photoCrown?.startsWith("data:image")) {
        userContent.push({ type: "text", text: "FOTO 2 — Superior/coronilla:" });
        userContent.push({ type: "image_url", image_url: { url: photoCrown, detail: "auto" } });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000);

      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userContent },
            ],
            max_tokens: 1200,
            temperature: 0.2,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = data.choices?.[0]?.message?.content;
        if (raw) {
          try {
            report = JSON.parse(raw) as HairMapAnalysisReport;
          } catch {
            console.error("[mapa-capilar/analyze] Failed to parse AI JSON");
          }
        }
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.error("[mapa-capilar/analyze]", isAbort ? "Timeout" : err);
    }
  } else {
    console.warn("[mapa-capilar/analyze] OPENAI_API_KEY not set — using fallback");
  }

  // Update DB record
  if (hasDB && recordId) {
    try {
      const supabase = getAdminClient();
      await supabase
        .from("hair_map_analyses")
        .update({
          photo_frontal_url: frontalUrl,
          photo_crown_url: crownUrl,
          analysis_json: report,
          status: "done",
        })
        .eq("id", recordId);
    } catch {
      // Ignore DB update failure
    }
  }

  return NextResponse.json({ id: recordId, report, isFallback: !process.env.OPENAI_API_KEY });
}
