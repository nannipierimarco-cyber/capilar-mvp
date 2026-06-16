import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";
import { BRAND_DENTAL, FORMATS, PILLARS, PERSONAS } from "@/lib/content-engine/brand";
import { buildWeekGenerationPrompt } from "@/lib/content-engine/prompts";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface GeneratedPost {
  format: string;
  pillar: string;
  funnel_stage: string;
  target_persona: string;
  topic: string;
  angle: string;
  hook: string;
  cta: string;
  caption: string;
  hashtags: string;
  image_prompt: string;
}

const FALLBACK_POSTS: GeneratedPost[] = [
  {
    format: "static_educational",
    pillar: "Educación dental",
    funnel_stage: "awareness",
    target_persona: "Adulto 30-45 que evita el dentista por miedo o costo",
    topic: "Limpieza dental profesional",
    angle: "Prevención vs tratamiento correctivo",
    hook: "¿Sabías que una limpieza al año puede ahorrarte mucho dinero?",
    cta: "Agenda una evaluación",
    caption:
      "La limpieza dental profesional no es un lujo, es prevención.\n\nCuando acumulas sarro y placa bacteriana, el riesgo de caries y enfermedad de las encías aumenta. Una limpieza anual puede detectar problemas a tiempo y ahorrarte tratamientos mucho más complejos.\n\n✅ 30 minutos al año\n✅ Sin dolor\n✅ Tu sonrisa agradecida\n\nAgenda una evaluación inicial hoy. 👇",
    hashtags:
      "#saluddental #limpiezadental #prevencion #dentista #sonrisasana #cuidadodental #odontologia #higienebucal #dentalhealth #dentalcare #oralhealth #smilecare #preventivecare #salud #perfectolabs",
    image_prompt:
      "Clean healthcare premium Instagram post design, soft blue and white color palette, smiling patient in a modern dental clinic, bright natural lighting, no text overlay, minimalist aesthetic",
  },
  {
    format: "myth_vs_fact",
    pillar: "Desmitificación",
    funnel_stage: "consideration",
    target_persona: "Persona con mitos sobre el dentista",
    topic: "El dentista duele",
    angle: "Odontología moderna vs percepción antigua",
    hook: "MITO: Ir al dentista siempre duele",
    cta: "Descubre tus opciones",
    caption:
      "❌ MITO: Ir al dentista siempre es doloroso.\n✅ REALIDAD: La odontología moderna prioriza tu comodidad.\n\nLa anestesia local, las técnicas mínimamente invasivas y los equipos de última generación hacen que la mayoría de los tratamientos sean prácticamente indoloros.\n\nEl verdadero dolor suele venir de esperar demasiado. Una caries pequeña hoy puede ser una extracción mañana.\n\nDescubre tus opciones. Sin compromiso. 👇",
    hashtags:
      "#mitos #dentistasindolor #odontologiamoderna #cuidadodental #sonrisa #saluddental #anestesia #dentista #dentalhealth #oralhealth #moderndentistry #perfectolabs #chile #salud #prevencion",
    image_prompt:
      "Premium healthcare Instagram split card design, left side showing myth crossed out in red, right side showing fact in soft blue, clean minimalist layout, white background, no faces",
  },
  {
    format: "price_explainer",
    pillar: "Valor",
    funnel_stage: "consideration",
    target_persona: "Paciente que posterga por percepción de costo",
    topic: "Por qué el cuidado dental vale la pena",
    angle: "Inversión vs gasto",
    hook: "¿Es caro el dentista? Depende de cuánto esperas.",
    cta: "Recibe una orientación inicial",
    caption:
      "Muchos postergamos la visita al dentista por el costo. Pero aquí va una realidad: cuanto más esperas, más cuesta.\n\nUna caries detectada a tiempo se trata en una sesión. Ignorada, puede requerir endodoncia, corona o extracción.\n\nCuidar tu sonrisa no es un gasto. Es una inversión que protege tu salud, tu confianza y tu bolsillo a largo plazo.\n\nRecibe una orientación inicial sin compromiso. 👇",
    hashtags:
      "#inversion #saluddental #dentista #odontologia #cuidadooral #prevencion #sonrisasana #salud #perfectolabs #chile #bienestar #selfcare #smilecare #oralhealth #dental",
    image_prompt:
      "Clean premium healthcare Instagram post, soft neutral tones, woman smiling confidently in modern dental office, warm natural light, no text in image, sophisticated minimalist aesthetic",
  },
  {
    format: "reel_script",
    pillar: "Educación dental",
    funnel_stage: "awareness",
    target_persona: "Adulto joven 25-35 activo en redes",
    topic: "3 señales de que necesitas ir al dentista",
    angle: "Síntomas que la gente ignora",
    hook: "3 señales de que tu boca te está pidiendo ayuda",
    cta: "Evalúa tu sonrisa",
    caption:
      "¿Tu boca te está mandando señales? 🦷 Aprende a reconocerlas antes de que sea tarde.\n\nEvalúa tu sonrisa hoy. Link en bio 👆",
    hashtags:
      "#reels #saluddental #dentista #consejosdental #sonrisa #odontologia #tipsdesalud #dentalhealth #oralcare #perfectolabs #chile #reelschile #educacion #salud #bienestar",
    image_prompt:
      "Vertical video thumbnail, young latin woman looking at her teeth in mirror, bathroom setting, soft morning light, clean premium aesthetic, no text",
  },
  {
    format: "static_educational",
    pillar: "Tratamientos",
    funnel_stage: "consideration",
    target_persona: "Persona interesada en mejorar su sonrisa",
    topic: "Blanqueamiento dental",
    angle: "Seguridad y efectividad",
    hook: "¿El blanqueamiento daña el esmalte?",
    cta: "Descubre tus opciones",
    caption:
      "Una de las preguntas más frecuentes: ¿el blanqueamiento dental daña mis dientes?\n\nLa respuesta depende del método:\n\n✅ Blanqueamiento profesional supervisado: seguro, efectivo y adaptado a tu tipo de esmalte.\n⚠️ Kits sin supervisión: pueden causar sensibilidad o daño si no se usan bien.\n\nAntes de blanquear, evalúa tu salud dental. Un diente sano responde mejor al tratamiento.\n\nDescubre tus opciones con una evaluación inicial. 👇",
    hashtags:
      "#blanqueamiento #dentalwhitening #sonrisabrillante #saluddental #odontologia #teethwhitening #esmalte #perfectolabs #chile #sonrisa #dentista #cuidadodental #oralhealth #smilegoals #whiteteeth",
    image_prompt:
      "Clean white Instagram post, close-up of bright healthy teeth, premium healthcare aesthetic, soft white and blue tones, studio lighting, no text overlay",
  },
  {
    format: "myth_vs_fact",
    pillar: "Desmitificación",
    funnel_stage: "awareness",
    target_persona: "Personas con miedo al dentista",
    topic: "Ortodoncia es solo estética",
    angle: "Función vs apariencia",
    hook: "MITO: La ortodoncia es solo para verse bien",
    cta: "Agenda una evaluación",
    caption:
      "❌ MITO: Los brackets y alineadores son solo estéticos.\n✅ REALIDAD: La ortodoncia corrige la función masticatoria, el habla y previene desgaste dental.\n\nUna mordida mal alineada puede generar:\n- Desgaste prematuro del esmalte\n- Dolor en la mandíbula\n- Dificultad para masticar correctamente\n\nCuidar tu alineación es cuidar tu salud. Agenda una evaluación para conocer tus opciones. 👇",
    hashtags:
      "#ortodoncia #brackets #alineadores #saluddental #mitos #odontologia #mordida #funciondental #dentista #chile #perfectolabs #oralhealth #orthodontics #dentalcare #salud",
    image_prompt:
      "Split design Instagram post, premium healthcare style, left misaligned teeth illustration in muted red, right aligned healthy smile in soft blue, clean white background, minimalist",
  },
  {
    format: "price_explainer",
    pillar: "Valor",
    funnel_stage: "decision",
    target_persona: "Paciente listo para tomar acción pero indeciso",
    topic: "Evaluación inicial",
    angle: "Primer paso sin compromiso",
    hook: "El paso más difícil es el primero. Nosotros lo hacemos fácil.",
    cta: "Recibe una orientación inicial",
    caption:
      "No tienes que decidir nada hoy.\n\nUna orientación inicial es exactamente eso: conocer tu situación actual, resolver dudas y entender tus opciones sin ningún compromiso.\n\nPorque tomar decisiones sobre tu salud dental merece información real, no presión.\n\n¿Cuál es tu mayor duda sobre tu sonrisa? Déjalo en comentarios. 👇",
    hashtags:
      "#evaluacion #saluddental #primeropaso #dentista #orientaciondental #perfectolabs #chile #sonrisa #odontologia #oralhealth #dentalcare #consulta #bienestar #salud #dental",
    image_prompt:
      "Warm premium healthcare Instagram image, friendly dentist smiling at patient in consultation, modern clinic environment, soft blue and white tones, natural light, professional yet approachable",
  },
];

async function generateWithOpenAI(count: number, weekStart: string): Promise<GeneratedPost[]> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const prompt = buildWeekGenerationPrompt(count, weekStart, BRAND_DENTAL);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Eres un estratega de contenido para ${BRAND_DENTAL.name}. Responde siempre con JSON válido. No incluyas markdown fuera del JSON.`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { posts?: GeneratedPost[] };
  if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) {
    throw new Error("OpenAI returned empty posts array");
  }
  return parsed.posts;
}

function getFallbackPosts(count: number, startIndex = 0): GeneratedPost[] {
  const posts: GeneratedPost[] = [];
  for (let i = 0; i < count; i++) {
    posts.push(FALLBACK_POSTS[(startIndex + i) % FALLBACK_POSTS.length]);
  }
  return posts;
}

function getScheduledAt(weekStart: string, dayOffset: number): string {
  const d = new Date(weekStart + "T13:00:00Z"); // 10:00 AM Chile (UTC-3)
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString();
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    vertical?: string;
    count?: number;
    week_start?: string;
  };

  const { vertical = "dental", count, week_start } = body;

  const weekStart = week_start ?? (() => {
    const d = new Date();
    const dow = d.getUTCDay();
    const delta = dow === 0 ? 1 : 8 - dow;
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().split("T")[0];
  })();

  const safeCount = Math.min(Math.max(Number(count) || 7, 1), 14);

  let generatedPosts: GeneratedPost[];
  let usedFallback = false;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      generatedPosts = await generateWithOpenAI(safeCount, weekStart);
    } catch (err) {
      console.error("[generate-week] OpenAI failed, using fallback:", err);
      generatedPosts = getFallbackPosts(safeCount);
      usedFallback = true;
    }
  } else {
    console.warn("[generate-week] OPENAI_API_KEY not set — using deterministic fallback");
    generatedPosts = getFallbackPosts(safeCount);
    usedFallback = true;
  }

  const supabase = getAdminClient();
  const rows = generatedPosts.slice(0, safeCount).map((p, i) => ({
    vertical,
    status: "draft",
    generation_status: "copy_ready",
    scheduled_at: getScheduledAt(weekStart, i),
    format: p.format ?? FORMATS[i % FORMATS.length],
    pillar: p.pillar ?? PILLARS[i % PILLARS.length],
    funnel_stage: p.funnel_stage ?? "awareness",
    target_persona: p.target_persona ?? PERSONAS[i % PERSONAS.length],
    topic: p.topic ?? "Salud dental",
    angle: p.angle ?? "",
    hook: p.hook ?? "",
    cta: p.cta ?? BRAND_DENTAL.ctas[i % BRAND_DENTAL.ctas.length],
    caption: p.caption ?? "",
    hashtags: p.hashtags ?? "",
    image_prompt: p.image_prompt ?? "",
  }));

  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    posts: data,
    fallback: usedFallback,
    week_start: weekStart,
    count: data?.length ?? 0,
  });
}
