import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AI_MODEL = "gpt-4o";

const SYSTEM_PROMPT = `Eres un asistente clínico interno de apoyo para una plataforma digital capilar regulada en Chile.
Tu tarea es preparar una nota de revisión preliminar estructurada para ayudar a un médico con licencia a entender rápidamente el caso capilar de un paciente.

Responde siempre en español neutro/latinoamericano, claro y profesional. No uses inglés en ningún campo.

RESTRICCIONES IMPORTANTES:
- NO estás diagnosticando alopecia ni ninguna condición.
- NO estás prescribiendo medicamentos ni recomendando dosis.
- NO estás aprobando ni rechazando ningún tratamiento.
- Estás preparando una nota de revisión clínica preliminar interna para un médico con licencia.
- El médico toma todas las decisiones clínicas finales.
- Usa lenguaje como "posible", "sugiere revisar", "conviene confirmar", "observación preliminar", "a validar por médico".

PARA LA SECCIÓN DE OBSERVACIÓN FOTOGRÁFICA:
- Observa y describe lo que ves en las imágenes de manera cautelosa.
- NO diagnostiques.
- Usa frases como: "se observa posible menor densidad en...", "la foto sugiere revisar...", "conviene que el médico confirme..."
- NO uses: "tiene alopecia androgenética", "alopecia avanzada", "candidato a trasplante", "aprobado", "requiere dutasteride/minoxidil", "necesita X tratamiento"
- Si no hay fotos, indica que no se recibieron y recomienda solicitarlas.

Devuelve SOLO JSON válido que coincida exactamente con este esquema, sin ningún otro texto:
{
  "summary_for_doctor": "párrafo resumen del caso: objetivo del paciente, tiempo de caída, zonas afectadas, tratamientos previos, fotos disponibles, antecedentes relevantes",
  "preliminary_route": "Revisión médica para tratamiento capilar" | "Evaluación de recuperación/trasplante" | "Ruta combinada: tratamiento + evaluación clínica" | "Requiere revisión médica detallada antes de avanzar",
  "risk_level": "Bajo" | "Medio" | "Alto",
  "red_flags": ["señal de alerta en español"],
  "doctor_questions": ["pregunta sugerida para el médico en español"],
  "possible_considerations": ["consideración clínica cautelosa en español"],
  "operational_next_step": "Revisión médica estándar" | "Solicitar más información" | "Revisión médica prioritaria" | "Pre-screening para clínica partner" | "No avanzar a tratamiento hasta revisión médica",
  "patient_facing_copy_suggestion": "borrador breve para comunicar al paciente, sin diagnóstico ni garantías",
  "internal_note": "Este informe fue generado por AI como apoyo preliminar. No constituye diagnóstico, prescripción ni aprobación de tratamiento. Debe ser revisado y validado por un médico habilitado.",
  "photo_observation": {
    "received_photos": ["nombre de cada foto recibida"],
    "photo_quality": "buena" | "media" | "baja" | "insuficiente",
    "visible_areas_to_review": ["observación cautelosa de zona visible"],
    "consistency_with_answers": "comparación entre lo observado en fotos y lo declarado por el paciente",
    "recommended_additional_photos": ["foto o mejora sugerida si calidad es baja o faltan vistas"],
    "photo_observation_summary": "resumen visual preliminar cauteloso"
  }
}

Para possible_considerations usa frases como:
"Evaluar si corresponde minoxidil tópico", "Evaluar si corresponde minoxidil oral magistral", "Evaluar si corresponde inhibidor 5-alfa reductasa", "Evaluar necesidad de estabilización antes de trasplante", "Evaluar derivación a clínica capilar", "Evaluar si requiere atención presencial", "No avanzar sin revisión médica"

Si no hay señales de alerta, en red_flags devuelve exactamente: ["No se detectan señales de alerta relevantes según las respuestas declaradas."]

El internal_note debe ser siempre exactamente: "Este informe fue generado por AI como apoyo preliminar. No constituye diagnóstico, prescripción ni aprobación de tratamiento. Debe ser revisado y validado por un médico habilitado."`;

function boolLabel(val: unknown): string {
  if (val === true) return "sí";
  if (val === false) return "no";
  return "no reportado";
}

function buildUserPrompt(intake: Record<string, unknown>): string {
  const lines = [
    "DATOS DE EVALUACIÓN DEL PACIENTE PARA REVISIÓN PRELIMINAR:",
    `Tipo de ruta: ${intake.journey_type ?? "—"}`,
    `Duración de la caída: ${intake.hair_loss_duration ?? "—"}`,
    `Patrón visual de referencia (cuadrícula): ${intake.hair_pattern ?? intake.main_area ?? "—"}`,
    `Patrón de inicio: ${intake.sudden_or_gradual ?? "—"}`,
    `Caída en parches: ${boolLabel(intake.loss_in_patches)}`,
    `Irritación severa del cuero cabelludo: ${boolLabel(intake.severe_irritation)}`,
    `Antecedentes familiares de caída: ${boolLabel(intake.family_history)}`,
    `Objetivo del paciente: ${intake.goal ?? "—"}`,
    `Tratamientos previos: ${Array.isArray(intake.previous_treatments) && intake.previous_treatments.length ? (intake.previous_treatments as string[]).join(", ") : "ninguno reportado"}`,
    "",
    "ANTECEDENTES MÉDICOS:",
    `Condiciones médicas declaradas: ${Array.isArray(intake.medical_conditions) && (intake.medical_conditions as string[]).length ? (intake.medical_conditions as string[]).join(", ") : "ninguna reportada"}`,
    "",
    "SCREENING MÉDICO:",
    `Uso previo de minoxidil: ${boolLabel(intake.used_minoxidil)}`,
    `Uso previo de finasteride: ${boolLabel(intake.used_finasteride)}`,
    `Uso previo de dutasteride: ${boolLabel(intake.used_dutasteride)}`,
    `Efectos secundarios de tratamientos previos: ${boolLabel(intake.had_side_effects)}`,
    `Toma medicamentos actualmente: ${boolLabel(intake.current_medications)}${intake.current_medications_note ? ` — ${intake.current_medications_note as string}` : ""}`,
    `Alergias a medicamentos: ${boolLabel(intake.drug_allergies)}${intake.drug_allergies_note ? ` — ${intake.drug_allergies_note as string}` : ""}`,
    `Enfermedad cardíaca: ${boolLabel(intake.heart_disease)}`,
    `Enfermedad hepática: ${boolLabel(intake.liver_disease)}`,
    `Enfermedad renal: ${boolLabel(intake.kidney_disease)}`,
    `Antecedentes prostáticos: ${boolLabel(intake.prostate_history)}`,
    `Planea tener hijos pronto: ${boolLabel(intake.planning_children)}`,
    `Embarazada o lactando: ${boolLabel(intake.is_pregnant_or_lactating)}`,
  ];

  if (intake.journey_type === "transplant" || intake.journey_type === "both") {
    lines.push(
      "",
      "EVALUACIÓN DE TRASPLANTE:",
      `Trasplante previo: ${boolLabel(intake.previous_transplant)}`,
      `Severidad de la caída: ${intake.loss_severity ?? "—"}`,
      `Timing preferido para trasplante: ${intake.transplant_timing ?? "—"}`,
      `Rango de presupuesto: ${intake.budget_range ?? "—"}`,
      `Interés en financiamiento: ${boolLabel(intake.financing_interest)}`,
      `Prioridad de trasplante: ${intake.transplant_priority ?? "—"}`,
      `Interés en procedimientos complementarios: ${boolLabel(intake.prp_interest)}`,
    );
  }

  lines.push("", "Prepara la nota de revisión preliminar para el médico. Responde solo con JSON válido en español.");
  return lines.join("\n");
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "auto" } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { intake_id?: string; force?: boolean };
    const { intake_id, force } = body;

    if (!intake_id) {
      return NextResponse.json({ error: "intake_id required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[ai/doctor-report] OPENAI_API_KEY not configured");
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[ai/doctor-report] SUPABASE_SERVICE_ROLE_KEY not configured");
      return NextResponse.json({ error: "Service not configured" }, { status: 503 });
    }

    const supabase = getAdminClient();

    // Check for existing report
    const { data: existing } = await supabase
      .from("ai_doctor_reports")
      .select("id")
      .eq("intake_id", intake_id)
      .limit(1)
      .maybeSingle();

    if (existing && !force) {
      return NextResponse.json({ ok: true, skipped: true, reason: "report_already_exists" });
    }

    // Delete existing report when regenerating
    if (existing && force) {
      await supabase.from("ai_doctor_reports").delete().eq("id", existing.id);
    }

    // Fetch intake
    const { data: intake, error: intakeError } = await supabase
      .from("intakes")
      .select("*")
      .eq("id", intake_id)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    // Fetch patient photos — required first (frontal, crown), then optional (temples, side)
    const { data: photos } = await supabase
      .from("photos")
      .select("type, url")
      .eq("intake_id", intake_id);

    const photoMap = new Map((photos ?? []).map((p: { type: string; url: string }) => [p.type, p.url]));

    // Build user message content with text + images
    const userContent: ContentPart[] = [
      { type: "text", text: buildUserPrompt(intake as Record<string, unknown>) },
    ];

    const PHOTO_ORDER: Array<{ type: string; label: string }> = [
      { type: "frontal", label: "Foto frontal" },
      { type: "crown", label: "Foto de coronilla" },
      { type: "temples", label: "Foto de entradas" },
      { type: "side", label: "Foto lateral" },
    ];

    const receivedPhotoLabels: string[] = [];
    for (const { type, label } of PHOTO_ORDER) {
      const url = photoMap.get(type);
      if (url) {
        receivedPhotoLabels.push(label);
        userContent.push({
          type: "image_url",
          image_url: { url, detail: "auto" },
        });
      }
    }

    if (receivedPhotoLabels.length > 0) {
      userContent.push({
        type: "text",
        text: `Se adjuntan ${receivedPhotoLabels.length} foto(s): ${receivedPhotoLabels.join(", ")}. Analízalas con lenguaje cauteloso para la sección photo_observation.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: "No se recibieron fotos del paciente. Completa la sección photo_observation indicando que no hay fotos disponibles y sugiriendo cuáles solicitar.",
      });
    }

    // Call OpenAI with vision
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[ai/doctor-report] OpenAI error:", aiResponse.status, errText);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const aiData = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[ai/doctor-report] Empty AI response");
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    let report: Record<string, unknown>;
    try {
      report = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      console.error("[ai/doctor-report] Failed to parse AI JSON:", rawContent);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    // Save report
    const { error: insertError } = await supabase.from("ai_doctor_reports").insert({
      intake_id,
      patient_id: (intake as { patient_id?: string }).patient_id ?? null,
      summary_for_doctor: report.summary_for_doctor ?? null,
      preliminary_route: report.preliminary_route ?? null,
      risk_level: report.risk_level ?? null,
      red_flags: report.red_flags ?? [],
      doctor_questions: report.doctor_questions ?? [],
      possible_considerations: report.possible_considerations ?? [],
      operational_next_step: report.operational_next_step ?? null,
      patient_facing_copy_suggestion: report.patient_facing_copy_suggestion ?? null,
      internal_note: report.internal_note ?? null,
      photo_observation: report.photo_observation ?? null,
      model_name: AI_MODEL,
    });

    if (insertError) {
      console.error("[ai/doctor-report] Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ai/doctor-report] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
