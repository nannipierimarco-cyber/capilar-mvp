import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";
import { BRAND_DENTAL, type PostFormat } from "@/lib/content-engine/brand";
import { buildSinglePostPrompt } from "@/lib/content-engine/prompts";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface RegeneratedCopy {
  caption: string;
  hashtags: string;
  image_prompt: string;
  hook: string;
  cta: string;
}

const FALLBACK_COPY: RegeneratedCopy = {
  caption:
    "[Dev — configura OPENAI_API_KEY] Caption regenerado de ejemplo para desarrollo. Aquí iría el copy generado por IA adaptado al topic y formato del post.",
  hashtags:
    "#saluddental #perfectolabs #dental #sonrisa #chile #odontologia #dentalcare #oralhealth #salud #bienestar #dentista #cuidadodental #smilecare #preventivecare #healthcare",
  image_prompt:
    "Clean premium healthcare Instagram post, modern dental clinic setting, soft blue and white tones, natural light, minimalist aesthetic, no text overlay",
  hook: "¿Sabías que el 70% de los chilenos no va al dentista con regularidad?",
  cta: "Agenda una evaluación",
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { post_id?: string };
  const { post_id } = body;
  if (!post_id) {
    return NextResponse.json({ error: "post_id requerido" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: post, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("id, topic, angle, pillar, format")
    .eq("id", post_id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  }

  let newCopy: RegeneratedCopy = FALLBACK_COPY;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = buildSinglePostPrompt(
        (post.format ?? "static_educational") as PostFormat,
        post.topic ?? "Salud dental",
        post.angle ?? "",
        post.pillar ?? "Educación dental",
        BRAND_DENTAL
      );

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.75,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Eres un estratega de contenido para ${BRAND_DENTAL.name}. Responde siempre con JSON válido.`,
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = data.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as Partial<RegeneratedCopy>;
        newCopy = {
          caption: parsed.caption ?? FALLBACK_COPY.caption,
          hashtags: parsed.hashtags ?? FALLBACK_COPY.hashtags,
          image_prompt: parsed.image_prompt ?? FALLBACK_COPY.image_prompt,
          hook: parsed.hook ?? FALLBACK_COPY.hook,
          cta: parsed.cta ?? FALLBACK_COPY.cta,
        };
      } else {
        console.error("[regenerate-copy] OpenAI error:", res.status);
      }
    } catch (err) {
      console.error("[regenerate-copy] Error:", err);
    }
  } else {
    console.warn("[regenerate-copy] OPENAI_API_KEY not set — using fallback copy");
  }

  const { data: updated, error: updateError } = await supabase
    .from("scheduled_posts")
    .update({
      caption: newCopy.caption,
      hashtags: newCopy.hashtags,
      image_prompt: newCopy.image_prompt,
      hook: newCopy.hook,
      cta: newCopy.cta,
      generation_status: "copy_ready",
    })
    .eq("id", post_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ post: updated });
}
