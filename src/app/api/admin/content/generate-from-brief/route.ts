import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";
import { BRAND_DENTAL, FORMATS, PILLARS, PERSONAS } from "@/lib/content-engine/brand";
import { buildFromBriefPrompt, type CampaignBrief, type VisualDirectionConfig } from "@/lib/content-engine/prompts";

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
  funnel_stage?: string;
  topic: string;
  angle: string;
  hook: string;
  cta: string;
  content_objective?: string;
  target_persona?: string;
  visual_direction?: string;
  text_overlay?: string;
  caption: string;
  hashtags: string;
  image_prompt: string;
  thumbnail_prompt?: string;
  video_script?: string;
}

interface BriefResult {
  campaign_brief: CampaignBrief;
  posts: GeneratedPost[];
}

// Deterministic fallback — used when OPENAI_API_KEY is missing or OpenAI fails
function buildFallbackResult(
  count: number,
  primaryCta: string,
  objective: string
): BriefResult {
  const campaign_brief: CampaignBrief = {
    campaign_theme: "Salud dental premium y accesible",
    tone: "premium, claro, confiable, moderno",
    visual_style: "clean, healthcare premium, azul suave, blanco",
    target_persona: "Adulto 28-45 que quiere cuidar su sonrisa sin complicaciones",
    primary_cta: primaryCta,
    priority_topics: ["Limpieza dental", "Blanqueamiento", "Ortodoncia invisible", "Precios transparentes"],
    content_mix: { static_educational: 3, price_explainer: 2, myth_vs_fact: 1, reel_script: 1 },
    risks_or_constraints: ["No prometer resultados garantizados", "No claims médicos absolutos"],
  };

  const fallbackPosts: GeneratedPost[] = [
    {
      format: "static_educational",
      pillar: "Educación dental",
      funnel_stage: "awareness",
      target_persona: "Adulto 30-45 que evita el dentista",
      topic: "Limpieza dental profesional",
      angle: "Prevención vs tratamiento correctivo",
      hook: "¿Sabías que una limpieza al año puede ahorrarte mucho dinero?",
      cta: primaryCta,
      content_objective: objective === "leads" ? "leads" : "awareness",
      visual_direction: "Clínica dental moderna, colores azul suave y blanco, paciente sonriente",
      caption: `La limpieza dental profesional no es un lujo, es prevención.\n\nCuando acumulas sarro y placa bacteriana, el riesgo de caries y enfermedad de las encías aumenta. Una limpieza anual puede detectar problemas a tiempo.\n\n✅ 30 minutos al año\n✅ Sin dolor\n✅ Tu sonrisa agradecida\n\n${primaryCta}. 👇`,
      hashtags: "#saluddental #limpiezadental #prevencion #dentista #sonrisasana #cuidadodental #odontologia #dentalhealth #oralhealth #smilecare #chile #perfectolabs #salud #bienestar #higienebucal",
      image_prompt: "Clean healthcare premium Instagram post, modern dental clinic, soft blue and white tones, smiling patient, natural light, no text overlay, minimalist aesthetic",
      thumbnail_prompt: "Healthcare premium thumbnail, dental clinic, clean white and blue palette",
    },
    {
      format: "price_explainer",
      pillar: "Valor",
      funnel_stage: "consideration",
      target_persona: "Paciente que posterga por costo",
      topic: "Precios transparentes en odontología",
      angle: "Inversión vs gasto",
      hook: "¿Es caro el dentista? Depende de cuánto esperas.",
      cta: primaryCta,
      content_objective: "conversion",
      visual_direction: "Infográfico limpio, números claros, colores neutros premium",
      caption: `El costo de una caries pequeña es una fracción del costo de una endodoncia.\n\nCuando postergas la visita al dentista, el problema crece. Lo que hoy es una consulta puede ser mañana un tratamiento complejo.\n\nCuidar tu sonrisa es una inversión en tu salud y tu confianza.\n\n${primaryCta} sin compromiso. 👇`,
      hashtags: "#preciosdentales #saluddental #inversion #dentista #odontologia #chile #perfectolabs #sonrisa #cuidadodental #prevencion #oralhealth #dentalcare #bienestar #salud #transparencia",
      image_prompt: "Minimalist premium infographic style Instagram post, dental care value comparison, clean white background, soft blue accents, no faces, no text in image",
      thumbnail_prompt: "Clean premium infographic thumbnail, dental care value, blue and white palette",
    },
    {
      format: "myth_vs_fact",
      pillar: "Desmitificación",
      funnel_stage: "consideration",
      target_persona: "Persona con mitos sobre el dentista",
      topic: "Ortodoncia invisible es solo para adultos jóvenes",
      angle: "Edad y ortodoncia",
      hook: "MITO: La ortodoncia invisible es solo para jóvenes",
      cta: primaryCta,
      content_objective: "education",
      visual_direction: "Split card premium, izquierda mito en rojo suave, derecha realidad en azul",
      caption: `❌ MITO: La ortodoncia invisible es solo para adultos jóvenes.\n✅ REALIDAD: Puede ser una opción para adultos de cualquier edad con la evaluación correcta.\n\nLo importante no es la edad sino el estado de tu salud dental y ósea. Un profesional puede orientarte sobre si eres candidato.\n\n${primaryCta}. 👇`,
      hashtags: "#ortodoncia #invisalign #alineadores #mitos #saluddental #odontologia #chile #perfectolabs #sonrisa #dentalhealth #orthodontics #oralhealth #adultos #cuidadodental #smilecare",
      image_prompt: "Premium healthcare split card Instagram post, left side myth in soft red crossed out, right side fact in soft blue, clean white background, minimalist, no faces",
      thumbnail_prompt: "Healthcare premium split card thumbnail, myth vs fact, red and blue accents",
    },
    {
      format: "reel_script",
      pillar: "Tratamientos",
      funnel_stage: "awareness",
      target_persona: "Adulto joven 25-35 activo en redes",
      topic: "3 señales de que necesitas ortodoncia",
      angle: "Señales que la gente ignora",
      hook: "3 señales de que tu mordida necesita atención",
      cta: primaryCta,
      content_objective: "awareness",
      visual_direction: "Reel dinámico, persona mirando al espejo, clínica moderna de fondo",
      caption: `¿Tu mordida te está mandando señales? 🦷 Tres cosas que no deberías ignorar.\n\n${primaryCta}. Link en bio 👆`,
      hashtags: "#reels #ortodoncia #saluddental #mordida #dentista #chile #perfectolabs #oralhealth #dentalcare #orthodontics #reelschile #tipsdesalud #sonrisa #higienebucal #salud",
      image_prompt: "Vertical video thumbnail, young adult looking at teeth in mirror, modern dental clinic background, clean premium aesthetic, no text",
      thumbnail_prompt: "Reel thumbnail, young adult dental check, modern clinic, clean premium look",
      video_script: `[HOOK - 3s]\n[Texto en pantalla: "3 señales que no deberías ignorar"]\nVoz: "Si tienes alguna de estas señales, tu mordida puede necesitar atención."\n\n[PROBLEMA - 5s]\n[Visual: persona con dificultad para masticar]\nVoz: "Dolor al masticar, dientes que se desgastan o que se sobreponen."\n\n[SOLUCIÓN - 15s]\n[Visual: clínica dental moderna, dentista profesional]\nVoz: "La ortodoncia moderna no es solo estética. Corrige la función, mejora la salud dental y puede prevenir problemas a largo plazo. Y hay opciones casi invisibles."\n\n[CTA - 7s]\n[Visual: paciente sonriente saliendo de la clínica]\nVoz: "${primaryCta} hoy. Link en bio."`,
    },
    {
      format: "static_educational",
      pillar: "Tratamientos",
      funnel_stage: "consideration",
      target_persona: "Persona interesada en blanqueamiento",
      topic: "Blanqueamiento dental profesional",
      angle: "Seguridad vs métodos caseros",
      hook: "¿El blanqueamiento realmente daña el esmalte?",
      cta: primaryCta,
      content_objective: "education",
      visual_direction: "Close-up de sonrisa brillante, fondo blanco limpio, iluminación premium",
      caption: `La respuesta corta: depende del método.\n\nEl blanqueamiento profesional supervisado está diseñado para ser seguro con tu esmalte. Los kits sin supervisión pueden generar sensibilidad o daño si no se usan correctamente.\n\n✅ Blanqueamiento supervisado: adaptado a tu tipo de esmalte\n✅ Resultados más predecibles\n✅ Sin riesgo innecesario\n\n${primaryCta} y descubre si eres candidato. 👇`,
      hashtags: "#blanqueamiento #dentalwhitening #sonrisabrillante #saluddental #odontologia #teethwhitening #esmalte #perfectolabs #chile #smilegoals #whiteteeth #dentalcare #oralhealth #cuidadodental #salud",
      image_prompt: "Close-up of bright healthy smile, premium healthcare aesthetic, soft white background, studio lighting, clean minimalist style, no text overlay",
      thumbnail_prompt: "Bright healthy teeth close-up, premium healthcare thumbnail, white and soft tones",
    },
    {
      format: "price_explainer",
      pillar: "Valor",
      funnel_stage: "decision",
      target_persona: "Paciente listo para actuar pero indeciso",
      topic: "Orientación inicial sin compromiso",
      angle: "Primer paso sin presión",
      hook: "No tienes que decidir nada hoy.",
      cta: primaryCta,
      content_objective: "conversion",
      visual_direction: "Dentista y paciente en consulta amigable, colores cálidos y profesionales",
      caption: `Una orientación inicial es exactamente eso: conocer tu situación actual, resolver dudas y entender tus opciones. Sin compromiso, sin presión.\n\nPorque tomar decisiones sobre tu salud dental merece información real.\n\n¿Cuál es tu mayor duda sobre tu sonrisa? Déjala en comentarios. 👇\n\n${primaryCta}.`,
      hashtags: "#orientacion #saluddental #primeropaso #dentista #chile #perfectolabs #sonrisa #odontologia #oralhealth #dentalcare #consulta #bienestar #salud #sincompromiso #evaluacion",
      image_prompt: "Warm professional dental consultation, friendly dentist and patient, modern clinic, soft blue and white tones, natural light, no text, approachable premium aesthetic",
      thumbnail_prompt: "Dental consultation thumbnail, warm professional, clean clinic, soft tones",
    },
    {
      format: "myth_vs_fact",
      pillar: "Desmitificación",
      funnel_stage: "awareness",
      target_persona: "Personas que evitan el dentista",
      topic: "El dentista siempre duele",
      angle: "Odontología moderna vs percepción",
      hook: "MITO: Ir al dentista siempre duele",
      cta: primaryCta,
      content_objective: "trust",
      visual_direction: "Split card, izquierda mito antiguo, derecha tecnología moderna dental",
      caption: `❌ MITO: Ir al dentista siempre es doloroso.\n✅ REALIDAD: La odontología moderna prioriza tu comodidad.\n\nLa anestesia local, las técnicas mínimamente invasivas y los equipos actuales hacen que la mayoría de los tratamientos sean prácticamente indoloros.\n\nEl verdadero dolor suele venir de esperar demasiado.\n\n${primaryCta}. 👇`,
      hashtags: "#mitos #dentistasindolor #odontologiamoderna #cuidadodental #saluddental #chile #perfectolabs #dentalhealth #oralhealth #moderndentistry #anestesia #dentista #sonrisa #salud #bienestar",
      image_prompt: "Premium healthcare Instagram split card, left side outdated dental fear crossed out in soft red, right side modern comfortable dental care in soft blue, clean minimal design",
      thumbnail_prompt: "Myth vs fact dental thumbnail, split design, premium healthcare, red and blue accents",
    },
  ];

  const posts: GeneratedPost[] = [];
  for (let i = 0; i < count; i++) {
    posts.push(fallbackPosts[i % fallbackPosts.length]);
  }
  return { campaign_brief, posts };
}

function getScheduledAt(weekStart: string, dayOffset: number): string {
  const d = new Date(weekStart + "T13:00:00Z");
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString();
}

async function callOpenAI(params: {
  count: number;
  weekStart: string;
  userPrompt: string;
  objective: string;
  primaryCta: string;
  visualConfig?: VisualDirectionConfig;
}): Promise<BriefResult> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const prompt = buildFromBriefPrompt(
    params.count,
    params.weekStart,
    params.userPrompt,
    params.objective,
    params.primaryCta,
    BRAND_DENTAL,
    params.visualConfig
  );

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
  const parsed = JSON.parse(raw) as BriefResult;

  if (!parsed.campaign_brief || !Array.isArray(parsed.posts) || parsed.posts.length === 0) {
    throw new Error("OpenAI returned invalid structure");
  }
  return parsed;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    vertical?: string;
    user_prompt?: string;
    count?: number;
    week_start?: string;
    objective?: string;
    primary_cta?: string;
  };

  const {
    vertical = "dental",
    user_prompt,
    count,
    week_start,
    objective = "leads",
    primary_cta = "Agenda una evaluación",
    visual_style,
    visual_mood,
    image_type_preference,
    text_density,
    avoid_visuals,
    reference_notes,
    asset_provider,
  } = body as Record<string, unknown> & {
    vertical?: string; user_prompt?: string; count?: number; week_start?: string;
    objective?: string; primary_cta?: string;
    visual_style?: string; visual_mood?: string; image_type_preference?: string;
    text_density?: string; avoid_visuals?: string; reference_notes?: string; asset_provider?: string;
  };

  const visualConfig: VisualDirectionConfig | undefined =
    visual_style || visual_mood || image_type_preference || text_density || avoid_visuals
      ? { visual_style, visual_mood, image_type_preference, text_density, avoid_visuals, reference_notes, asset_provider }
      : undefined;

  if (!user_prompt?.trim()) {
    return NextResponse.json({ error: "user_prompt requerido" }, { status: 400 });
  }

  const weekStart = week_start ?? (() => {
    const d = new Date();
    const dow = d.getUTCDay();
    const delta = dow === 0 ? 1 : 8 - dow;
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().split("T")[0];
  })();

  const safeCount = Math.min(Math.max(Number(count) || 7, 1), 14);
  const supabase = getAdminClient();

  // 1. Create generation request (status=pending)
  const { data: genReq, error: genReqError } = await supabase
    .from("content_generation_requests")
    .insert({
      vertical,
      user_prompt,
      objective,
      count: safeCount,
      week_start: weekStart,
      primary_cta,
      status: "pending",
    })
    .select()
    .single();

  if (genReqError || !genReq) {
    return NextResponse.json(
      { error: `Error creando generation request: ${genReqError?.message}` },
      { status: 500 }
    );
  }

  // 2. Generate content (OpenAI or fallback)
  let result: BriefResult;
  let usedFallback = false;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      result = await callOpenAI({ count: safeCount, weekStart, userPrompt: user_prompt, objective, primaryCta: primary_cta, visualConfig });
    } catch (err) {
      console.error("[generate-from-brief] OpenAI failed, using fallback:", err);
      result = buildFallbackResult(safeCount, primary_cta, objective);
      usedFallback = true;
    }
  } else {
    console.warn("[generate-from-brief] No OPENAI_API_KEY — using fallback");
    result = buildFallbackResult(safeCount, primary_cta, objective);
    usedFallback = true;
  }

  // 3. Create content batch
  const { data: batch, error: batchError } = await supabase
    .from("content_batches")
    .insert({
      title: result.campaign_brief.campaign_theme,
      vertical,
      campaign_theme: result.campaign_brief.campaign_theme,
      brief_summary: result.campaign_brief.priority_topics?.join(", "),
      user_prompt,
      objective,
      week_start: weekStart,
      count: safeCount,
      status: "draft",
    })
    .select()
    .single();

  if (batchError || !batch) {
    await supabase
      .from("content_generation_requests")
      .update({ status: "failed", error_message: batchError?.message })
      .eq("id", genReq.id);
    return NextResponse.json({ error: `Error creando batch: ${batchError?.message}` }, { status: 500 });
  }

  // 4. Insert posts
  const rows = result.posts.slice(0, safeCount).map((p, i) => ({
    vertical,
    status: "draft",
    generation_status: "copy_ready",
    scheduled_at: getScheduledAt(weekStart, i),
    batch_id: batch.id,
    generation_request_id: genReq.id,
    creative_brief: result.campaign_brief,
    format: p.format ?? FORMATS[i % FORMATS.length],
    pillar: p.pillar ?? PILLARS[i % PILLARS.length],
    funnel_stage: p.funnel_stage ?? "awareness",
    target_persona: p.target_persona ?? PERSONAS[i % PERSONAS.length],
    topic: p.topic ?? "Salud dental",
    angle: p.angle ?? "",
    hook: p.hook ?? "",
    cta: p.cta ?? primary_cta,
    content_objective: p.content_objective ?? objective,
    visual_direction: p.visual_direction ?? "",
    text_overlay: p.text_overlay ?? "",
    caption: p.caption ?? "",
    hashtags: p.hashtags ?? "",
    image_prompt: p.image_prompt ?? "",
    thumbnail_prompt: p.thumbnail_prompt ?? "",
    video_script: p.video_script ?? "",
  }));

  const { data: posts, error: postsError } = await supabase
    .from("scheduled_posts")
    .insert(rows)
    .select();

  if (postsError) {
    await supabase
      .from("content_generation_requests")
      .update({ status: "failed", error_message: postsError.message })
      .eq("id", genReq.id);
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  // 5. Update generation request
  await supabase
    .from("content_generation_requests")
    .update({ status: "completed", batch_id: batch.id, completed_at: new Date().toISOString() })
    .eq("id", genReq.id);

  return NextResponse.json({
    batch,
    posts,
    campaign_brief: result.campaign_brief,
    fallback: usedFallback,
    count: posts?.length ?? 0,
  });
}
