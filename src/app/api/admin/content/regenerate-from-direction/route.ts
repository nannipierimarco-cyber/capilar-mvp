import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";
import { BRAND_DENTAL } from "@/lib/content-engine/brand";
import { buildRegenerateFromDirectionPrompt } from "@/lib/content-engine/prompts";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const FALLBACK_DIRECTION_COPY = {
  caption:
    "En Perfecto Labs, cuidar tu sonrisa es más fácil de lo que crees.\n\nNuestro equipo está aquí para orientarte, sin presión y con precios transparentes.\n\n¿Tienes dudas? Agenda una evaluación hoy. 👇",
  hashtags:
    "#saluddental #odontologia #perfectolabs #chile #sonrisa #dentalhealth #oralhealth #cuidadodental #dentista #sonrisasana #premium #bienestar #salud #smilecare #higienebucal",
  image_prompt:
    "Premium healthcare dental clinic interior, soft blue and white tones, modern equipment, natural light, clean minimalist aesthetic, no text overlay, no people",
  hook: "Cuidar tu sonrisa nunca fue tan fácil.",
  visual_direction: "Clínica dental moderna, colores azul suave y blanco, ambiente premium y confiable",
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    post_id?: string;
    direction?: string;
  };

  const { post_id, direction } = body;

  if (!post_id) {
    return NextResponse.json({ error: "post_id requerido" }, { status: 400 });
  }
  if (!direction?.trim()) {
    return NextResponse.json({ error: "direction requerido" }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: post, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("id, format, topic, angle, caption, visual_direction, status")
    .eq("id", post_id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  }

  if (post.status === "posted") {
    return NextResponse.json({ error: "No se puede editar un post publicado" }, { status: 400 });
  }

  let updated: typeof FALLBACK_DIRECTION_COPY;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = buildRegenerateFromDirectionPrompt(direction, post, BRAND_DENTAL);

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
              content: `Eres un estratega de contenido para ${BRAND_DENTAL.name}. Responde solo con JSON válido.`,
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) throw new Error(`OpenAI ${res.status}`);

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content ?? "{}";
      updated = JSON.parse(raw) as typeof FALLBACK_DIRECTION_COPY;

      if (!updated.caption) throw new Error("Invalid response structure");
    } catch (err) {
      console.error("[regenerate-from-direction] OpenAI failed, using fallback:", err);
      updated = FALLBACK_DIRECTION_COPY;
    }
  } else {
    updated = FALLBACK_DIRECTION_COPY;
  }

  const { error: updateError } = await supabase
    .from("scheduled_posts")
    .update({
      caption: updated.caption,
      hashtags: updated.hashtags,
      image_prompt: updated.image_prompt,
      hook: updated.hook,
      visual_direction: updated.visual_direction,
      generation_status: "copy_ready",
    })
    .eq("id", post_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated });
}
