import { NextRequest, NextResponse } from "next/server";
import {
  generateFallbackReport,
  type MapaCapilarAnswers,
  type MapaCapilarReport,
} from "@/lib/mapaCapilar";

const SYSTEM_PROMPT = `Eres un analizador visual capilar orientativo. Generas reportes visuales estructurados en JSON.

REGLAS ABSOLUTAS — nunca violes estas reglas:
- NO diagnostiques enfermedades ni condiciones médicas.
- NO recomiendes medicamentos (minoxidil, finasteride, dutasteride, ninguno).
- NO recomiendes productos, shampoos, ingredientes ni tratamientos específicos.
- NO uses frases como "tienes alopecia", "debes usar", "necesitas tratamiento", "te recomiendo".
- USA siempre lenguaje prudente: "visual", "aparente", "orientativo", "según la imagen", "posible".
- Solo devuelves JSON válido sin texto adicional fuera del JSON.`;

function buildUserPrompt(a: MapaCapilarAnswers): string {
  return `El usuario reporta:
- Preocupación principal: ${a.concern}
- Tiempo con cambios capilares: ${a.duration}
- Tratamientos previos: ${a.previousTreatment}
- Historial familiar capilar: ${a.familyHistory}
- Objetivo actual: ${a.goal}

Basándote en la imagen adjunta y estas respuestas, genera un análisis visual orientativo.
Responde SOLO con JSON en este formato exacto (sin texto adicional):

{
  "hairType": "Liso|Ondulado|Rizado|Muy rizado",
  "visualDensity": "Baja|Media|Alta",
  "hairlineRecession": "Sin cambios visibles|Recesión leve aparente|Recesión moderada aparente|Recesión avanzada aparente",
  "scalpVisibility": "Baja|Media|Alta",
  "observationZones": ["Entradas","Zona frontal","Zona media","Coronilla"],
  "crownCoverage": "Buena cobertura visual|Cobertura media|Cobertura reducida aparente",
  "densityMap": {
    "frontal": "Alta|Media|Baja",
    "entradas": "Alta|Media|Baja",
    "superior": "Alta|Media|Baja",
    "coronilla": "Alta|Media|Baja",
    "laterales": "Alta|Media|Baja"
  },
  "nextStep": "Seguir monitoreando|Evaluar caída con revisión médica|Evaluar recuperación capilar / trasplante",
  "summary": "Una frase corta orientativa sobre lo observado visualmente, sin diagnóstico ni recomendaciones."
}`;
}

interface RequestBody extends MapaCapilarAnswers {
  photoBase64?: string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { concern, duration, previousTreatment, familyHistory, goal, photoBase64 } = body;

  if (!concern || !goal) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const fallback = generateFallbackReport(concern, goal);

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[mapa-capilar/generate] OPENAI_API_KEY not configured — returning fallback");
    return NextResponse.json({ report: fallback, isFallback: true });
  }

  try {
    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "auto" } };

    const userContent: ContentPart[] = [
      {
        type: "text",
        text: buildUserPrompt({ concern, duration, previousTreatment, familyHistory, goal }),
      },
    ];

    if (photoBase64?.startsWith("data:image")) {
      userContent.push({
        type: "image_url",
        image_url: { url: photoBase64, detail: "auto" },
      });
      userContent.push({
        type: "text",
        text: "Se adjunta foto del cabello del usuario. Úsala solo como referencia visual general. No hagas afirmaciones clínicas.",
      });
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
          max_tokens: 600,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[mapa-capilar/generate] OpenAI error:", res.status, errText.slice(0, 200));
      return NextResponse.json({ report: fallback, isFallback: true });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return NextResponse.json({ report: fallback, isFallback: true });

    let report: MapaCapilarReport;
    try {
      report = JSON.parse(raw) as MapaCapilarReport;
    } catch {
      console.error("[mapa-capilar/generate] Failed to parse JSON:", raw.slice(0, 200));
      return NextResponse.json({ report: fallback, isFallback: true });
    }

    return NextResponse.json({ report, isFallback: false });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[mapa-capilar/generate]", isAbort ? "Request timed out" : err);
    return NextResponse.json({ report: fallback, isFallback: true });
  }
}
