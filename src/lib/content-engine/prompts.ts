import type { BrandConfig, PostFormat } from "./brand";

export interface CampaignBrief {
  campaign_theme: string;
  tone: string;
  visual_style: string;
  target_persona: string;
  primary_cta: string;
  priority_topics: string[];
  content_mix: Record<string, number>;
  risks_or_constraints: string[];
}

export interface VisualDirectionConfig {
  visual_style?: string;
  visual_mood?: string;
  image_type_preference?: string;
  text_density?: string;
  avoid_visuals?: string;
  reference_notes?: string;
  asset_provider?: string;
}

const formatInstructions: Record<PostFormat, string> = {
  static_educational:
    "Post educativo estático para Instagram. Caption 150-200 palabras, 3 puntos clave, emojis moderados, termina con el CTA. Image_prompt en inglés, healthcare premium, sin texto en la imagen.",
  price_explainer:
    "Post explicador de valor/precio. Caption 100-150 palabras, desmitifica el costo sin mencionar precios exactos, tono empático. Image_prompt en inglés, infográfico limpio, colores suaves.",
  myth_vs_fact:
    "Post Mito vs Realidad. Estructura: ❌ MITO: afirmación falsa → ✅ REALIDAD: respuesta basada en evidencia. 120-180 palabras. Image_prompt en inglés, tarjeta comparativa, clean design.",
  reel_script:
    "Script para Reel de Instagram 30-45 segundos. Estructura: Hook(3s) → Problema(5s) → Solución/dato(15s) → CTA(7s). Notas de visuales entre corchetes. Caption corto 80 palabras. Video_prompt en inglés.",
};

export function buildWeekGenerationPrompt(
  count: number,
  weekStart: string,
  brand: BrandConfig
): string {
  const restrictions = brand.restrictions.map((r) => `- ${r}`).join("\n");
  return `Genera ${count} posts de Instagram para ${brand.name} para la semana que empieza el ${weekStart}.

Formatos disponibles (distribuye variedad): static_educational, price_explainer, myth_vs_fact, reel_script.
Pilares sugeridos: Educación dental, Desmitificación, Valor, Tratamientos, Prevención.

Tono: ${brand.tone.join(", ")}
Estilo visual: ${brand.visualStyle.join(", ")}

Restricciones absolutas:
${restrictions}

CTAs permitidos: ${brand.ctas.join(" | ")}

Para cada post devuelve exactamente estos campos:
- format
- pillar
- funnel_stage (awareness | consideration | decision)
- target_persona (descripción breve)
- topic
- angle (ángulo o pregunta que responde)
- hook (primera línea gancho, máximo 15 palabras)
- cta
- caption (texto completo con emojis moderados)
- hashtags (string con 15-20 hashtags separados por espacio)
- image_prompt (en inglés para generación de imagen, healthcare premium, sin texto en imagen)

Responde con JSON válido en este formato exacto:
{"posts":[{...},{...}]}`;
}

export function buildSinglePostPrompt(
  format: PostFormat,
  topic: string,
  angle: string,
  pillar: string,
  brand: BrandConfig
): string {
  const restrictions = brand.restrictions.map((r) => `- ${r}`).join("\n");
  return `Regenera el copy de un post de Instagram para ${brand.name}.

Formato: ${format}
Instrucciones de formato: ${formatInstructions[format]}

Topic: ${topic}
Ángulo: ${angle}
Pilar: ${pillar}
Tono: ${brand.tone.join(", ")}

Restricciones:
${restrictions}

CTAs permitidos: ${brand.ctas.join(" | ")}

Responde con JSON válido en este formato exacto:
{"caption":"...","hashtags":"...","image_prompt":"...","hook":"...","cta":"..."}`;
}

export function buildFromBriefPrompt(
  count: number,
  weekStart: string,
  userPrompt: string,
  objective: string,
  primaryCta: string,
  brand: BrandConfig,
  visualConfig?: VisualDirectionConfig
): string {
  const restrictions = brand.restrictions.map((r) => `- ${r}`).join("\n");

  const visualSection = visualConfig ? `
DIRECCIÓN VISUAL DE LA CAMPAÑA:
- Estilo visual: ${visualConfig.visual_style ?? brand.visualStyle.join(", ")}
- Mood: ${visualConfig.visual_mood ?? "premium"}
- Tipo de imagen preferido: ${visualConfig.image_type_preference ?? "static-post"}
- Densidad de texto en imagen: ${visualConfig.text_density ?? "headline-only"}
- Evitar en visuals: ${visualConfig.avoid_visuals ?? ""}
- Notas de referencia: ${visualConfig.reference_notes ?? ""}
` : `
DIRECCIÓN VISUAL DE LA CAMPAÑA:
- Estilo visual: ${brand.visualStyle.join(", ")}
- Mood: premium
- Tipo de imagen preferido: static-post
`;

  return `Eres un estratega de contenido para ${brand.name}.

BRIEF DEL USUARIO:
"${userPrompt}"

PARÁMETROS:
- Vertical: ${brand.vertical}
- Objetivo principal: ${objective}
- CTA principal: "${primaryCta}"
- Semana inicio: ${weekStart}
- Cantidad de posts: ${count}
- Tono de marca: ${brand.tone.join(", ")}
${visualSection}
RESTRICCIONES ABSOLUTAS:
${restrictions}

TAREA:
1. Interpreta el brief y crea un plan de campaña estructurado.
2. Genera ${count} posts de Instagram temáticamente conectados a ese plan.

Para cada post incluye:
- format: static_educational | price_explainer | myth_vs_fact | reel_script
- pillar
- topic
- angle
- hook (máx 15 palabras)
- cta
- content_objective: awareness | education | leads | conversion | trust
- target_persona
- visual_direction (descripción visual específica del post, coherente con la dirección visual de campaña)
- text_overlay (texto corto para superponer en imagen, puede ser vacío string)
- caption (con emojis moderados)
- hashtags (15-20 separados por espacio)
- image_prompt (en inglés para generación de imagen, coherente con visual_direction, sin texto en imagen)
- thumbnail_prompt (en inglés para miniatura)
- video_script (solo si format=reel_script, vacío string si no aplica)

Para reels: video_script con estructura Hook(3s)→Problema(5s)→Solución(15s)→CTA(7s).

IMPORTANTE: todos los posts deben estar conectados al campaign_theme y usar el mismo cta="${primaryCta}".
Todos los image_prompt deben reflejar la dirección visual indicada.

Responde SOLO con JSON válido en este formato exacto:
{
  "campaign_brief": {
    "campaign_theme": "...",
    "tone": "...",
    "visual_style": "...",
    "target_persona": "...",
    "primary_cta": "...",
    "priority_topics": ["..."],
    "content_mix": {"static_educational": 0, "price_explainer": 0, "myth_vs_fact": 0, "reel_script": 0},
    "risks_or_constraints": ["..."]
  },
  "posts": [{...}]
}`;
}

export function buildRegenerateFromDirectionPrompt(
  direction: string,
  post: { format: string; topic: string; angle: string; caption: string; visual_direction?: string | null },
  brand: BrandConfig
): string {
  const restrictions = brand.restrictions.map((r) => `- ${r}`).join("\n");
  return `Eres un estratega de contenido para ${brand.name}.

POST ACTUAL:
- Formato: ${post.format}
- Topic: ${post.topic}
- Ángulo: ${post.angle}
- Caption actual: "${post.caption.slice(0, 300)}${post.caption.length > 300 ? "…" : ""}"
- Dirección visual actual: "${post.visual_direction ?? "no especificada"}"

NUEVA DIRECCIÓN DEL USUARIO:
"${direction}"

Tono: ${brand.tone.join(", ")}
Restricciones:
${restrictions}

Actualiza el copy manteniendo el topic y formato. Aplica la nueva dirección con precisión.

Responde SOLO con JSON válido:
{"caption":"...","hashtags":"...","image_prompt":"...","hook":"...","visual_direction":"..."}`;
}

export function buildFinalImagePrompt(params: {
  image_prompt: string;
  visual_direction?: string | null;
  text_overlay?: string | null;
  creative_brief?: Record<string, unknown> | null;
  topic?: string | null;
  hook?: string | null;
  cta?: string | null;
  brand: BrandConfig;
}): string {
  const { image_prompt, visual_direction, text_overlay, creative_brief, topic, hook, brand } = params;

  const parts: string[] = [];

  // Base image prompt
  parts.push(image_prompt);

  // Visual direction overrides or enriches
  if (visual_direction?.trim()) {
    parts.push(`Visual direction: ${visual_direction.trim()}`);
  }

  // Brand style guardrails
  parts.push(`Brand style: ${brand.visualStyle.join(", ")}. Healthcare premium aesthetic. No generic stock photo look.`);

  // Context from brief
  if (creative_brief) {
    const briefStyle = (creative_brief as Record<string, string>).visual_style;
    if (briefStyle) parts.push(`Campaign visual style: ${briefStyle}`);
  }

  // Topic context
  if (topic) parts.push(`Topic context: ${topic}`);

  // Hook context
  if (hook) parts.push(`Post hook: "${hook}"`);

  // Text overlay instruction
  if (text_overlay?.trim()) {
    parts.push(`Include this text overlay on the image: "${text_overlay.trim()}"`);
  } else {
    parts.push("No text overlay. Clean image only.");
  }

  // Hard restrictions
  parts.push(
    "Do not show invasive dental procedures, blood, fake before/after comparisons, or cheap stock-photo aesthetics.",
    "Square format (1:1). No watermarks. No logos."
  );

  return parts.join(" — ");
}
