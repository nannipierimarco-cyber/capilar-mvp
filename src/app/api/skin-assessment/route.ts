import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CONCERN_TO_CATEGORY: Record<string, string> = {
  "Acné / granos / espinillas": "acne",
  "Manchas oscuras": "hyperpigmentation",
  "Marcas de acné": "acne_marks_scars",
  "Piel grasa / poros visibles": "oily_pores",
  "Piel seca / irritada": "dry_irritated",
  "Rosácea / rojez / ardor": "rosacea_redness",
  "Arrugas / textura / envejecimiento": "texture_aging",
  "Lunares o manchas que cambiaron": "mole_lesion_review",
  "Heridas, costras o lesiones que no sanan": "wound_non_healing",
  "Otro": "other",
};

const URGENT_FLAGS = new Set([
  "Fiebre",
  "Dolor fuerte",
  "Hinchazón rápida",
  "Pus abundante",
  "Lesión cerca del ojo",
  "Herida que no sana",
  "Sangrado espontáneo",
  "Mancha/lunar que cambió rápido",
  "Lunar con varios colores",
  "Lunar irregular/asimétrico",
  "Picazón o dolor persistente en una lesión",
]);

function computePriority(body: Record<string, unknown>): "urgent_review" | "high" | "normal" {
  const flags = (body.red_flags as string[] | null) ?? [];
  if (flags.some((f) => URGENT_FLAGS.has(f))) return "urgent_review";

  const lesions = (body.lesion_description as string[] | null) ?? [];
  const score = typeof body.concern_score === "number" ? body.concern_score : 0;
  if (
    lesions.includes("Bultos profundos o dolorosos") ||
    lesions.includes("Herida / costra") ||
    body.progression === "Sí, rápido" ||
    score >= 8
  ) {
    return "high";
  }
  return "normal";
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v : [];
}

function generateDoctorSummary(d: Record<string, unknown>): string {
  return [
    "Pre-evaluación dermatológica",
    "",
    `Motivo principal: ${d.main_concern ?? "—"}`,
    `Categoría: ${d.skin_category ?? "—"}`,
    `Zona afectada: ${arr(d.affected_areas).join(", ") || "—"}`,
    `Duración: ${d.duration ?? "—"}`,
    `Evolución: ${d.progression ?? "—"}`,
    `Síntomas: ${arr(d.symptoms).join(", ") || "—"}`,
    `Severidad autopercibida: ${d.concern_score ?? "—"}/10`,
    `Descripción de lesiones: ${arr(d.lesion_description).join(", ") || "—"}`,
    `Rutina actual: ${arr(d.current_routine).join(", ") || "—"}`,
    `Frecuencia de activos/exfoliantes: ${d.active_ingredients_frequency ?? "—"}`,
    `Irritación por rutina: ${d.irritation_from_routine ?? "—"}`,
    `Tratamientos previos: ${arr(d.previous_treatments).join(", ") || "—"}`,
    `Respuesta a tratamientos: ${d.previous_treatment_response ?? "—"}`,
    `Edad: ${d.age ?? "—"}`,
    `Peso: ${d.weight_kg ? `${d.weight_kg} kg` : "—"}`,
    `Altura: ${d.height_cm ? `${d.height_cm} cm` : "—"}`,
    `Sexo asignado al nacer: ${d.sex_at_birth ?? "—"}`,
    `Antecedentes relevantes: ${arr(d.medical_conditions).join(", ") || "—"}`,
    `Medicamentos actuales: ${d.current_medications ?? "—"}`,
    `Alergias: ${d.allergies ?? "—"}`,
    `Embarazo/lactancia: ${d.pregnancy_status ?? "—"}`,
    `Red flags: ${arr(d.red_flags).join(", ") || "—"}`,
    `Objetivo del paciente: ${d.main_goal ?? "—"}`,
    `Preferencia del paciente: ${d.preference ?? "—"}`,
    `Notas adicionales del paciente: ${d.additional_notes || "—"}`,
    `Fotos adjuntas: ${arr(d.photo_urls).length} foto(s)`,
    `Prioridad sugerida: ${d.priority ?? "—"}`,
    "",
    "Nota: Este resumen no constituye diagnóstico. La decisión clínica corresponde exclusivamente al dermatólogo.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (!body.full_name || typeof body.full_name !== "string" || !body.full_name.trim()) {
      return NextResponse.json({ error: "full_name es requerido" }, { status: 400 });
    }
    if (
      !body.email ||
      typeof body.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    ) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!body.phone || typeof body.phone !== "string" || !body.phone.trim()) {
      return NextResponse.json({ error: "WhatsApp es requerido" }, { status: 400 });
    }
    if (!body.main_concern || typeof body.main_concern !== "string") {
      return NextResponse.json({ error: "main_concern es requerido" }, { status: 400 });
    }

    const skin_category = CONCERN_TO_CATEGORY[body.main_concern as string] ?? "other";
    const priority = computePriority(body);
    const enriched = { ...body, skin_category, priority };
    const doctor_summary = generateDoctorSummary(enriched);

    const supabase = await createClient();

    const ageRaw = body.age;
    const weightRaw = body.weight_kg;
    const heightRaw = body.height_cm;

    const { data, error } = await supabase
      .from("skin_assessments")
      .insert({
        assessment_type: "skin",
        full_name: (body.full_name as string).trim(),
        email: (body.email as string).trim().toLowerCase(),
        phone: (body.phone as string).trim(),
        age: ageRaw ? parseInt(String(ageRaw), 10) || null : null,
        weight_kg: weightRaw ? parseFloat(String(weightRaw)) || null : null,
        height_cm: heightRaw ? parseFloat(String(heightRaw)) || null : null,
        sex_at_birth: (body.sex_at_birth as string) || null,
        main_concern: body.main_concern,
        skin_category,
        affected_areas: arr(body.affected_areas),
        duration: (body.duration as string) || null,
        progression: (body.progression as string) || null,
        lesion_description: arr(body.lesion_description),
        concern_score:
          typeof body.concern_score === "number" ? body.concern_score : null,
        symptoms: arr(body.symptoms),
        current_routine: arr(body.current_routine),
        active_ingredients_frequency: (body.active_ingredients_frequency as string) || null,
        irritation_from_routine: (body.irritation_from_routine as string) || null,
        previous_treatments: arr(body.previous_treatments),
        previous_treatment_response: (body.previous_treatment_response as string) || null,
        pregnancy_status: (body.pregnancy_status as string) || null,
        medical_conditions: arr(body.medical_conditions),
        current_medications: (body.current_medications as string) || null,
        allergies: (body.allergies as string) || null,
        red_flags: arr(body.red_flags),
        main_goal: (body.main_goal as string) || null,
        preference: (body.preference as string) || null,
        additional_notes: (body.additional_notes as string) || null,
        photo_urls: arr(body.photo_urls),
        product_photo_urls: arr(body.product_photo_urls),
        priority,
        status: "new",
        doctor_summary,
        raw_answers: body,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[skin-assessment] DB error:", error);
      return NextResponse.json({ error: "Error guardando evaluación" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("[skin-assessment] Unexpected error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
