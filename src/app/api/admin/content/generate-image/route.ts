import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";
import { BRAND_DENTAL } from "@/lib/content-engine/brand";
import { buildFinalImagePrompt } from "@/lib/content-engine/prompts";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const IMAGE_SIZE  = process.env.OPENAI_IMAGE_SIZE  ?? "1024x1024";

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
    .select("id, image_prompt, visual_direction, text_overlay, creative_brief, topic, angle, hook, cta, status")
    .eq("id", post_id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  }

  if (!post.image_prompt) {
    return NextResponse.json(
      { error: "El post no tiene image_prompt. Genera el copy primero." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no configurada. Agrega la variable para generar imágenes." },
      { status: 503 }
    );
  }

  // Build robust final prompt
  const finalPrompt = buildFinalImagePrompt({
    image_prompt:      post.image_prompt,
    visual_direction:  post.visual_direction,
    text_overlay:      post.text_overlay,
    creative_brief:    post.creative_brief as Record<string, unknown> | null,
    topic:             post.topic,
    hook:              post.hook,
    cta:               post.cta,
    brand:             BRAND_DENTAL,
  });

  console.log(`[generate-image] post_id=${post_id}`);
  console.log(`[generate-image] model=${IMAGE_MODEL} size=${IMAGE_SIZE}`);
  console.log(`[generate-image] prompt length=${finalPrompt.length}`);

  // Build request body — gpt-image-1 does not support quality/response_format params
  const requestBody: Record<string, unknown> = {
    model:  IMAGE_MODEL,
    prompt: finalPrompt,
    n:      1,
    size:   IMAGE_SIZE,
  };
  if (IMAGE_MODEL === "dall-e-3") {
    requestBody.quality         = "standard";
    requestBody.response_format = "b64_json";
  }

  const genRes = await fetch("https://api.openai.com/v1/images/generations", {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body:    JSON.stringify(requestBody),
  });

  if (!genRes.ok) {
    let errMsg = `HTTP ${genRes.status}`;
    let errCode: string | undefined;
    try {
      const errJson = (await genRes.json()) as { error?: { message?: string; code?: string } };
      errMsg  = errJson.error?.message ?? errMsg;
      errCode = errJson.error?.code;
    } catch {
      errMsg = await genRes.text().catch(() => errMsg);
    }
    console.error(`[generate-image] OpenAI error: ${genRes.status} code=${errCode} msg=${errMsg}`);
    return NextResponse.json(
      { error: errMsg, code: errCode, status: genRes.status },
      { status: 502 }
    );
  }

  const genData = (await genRes.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const imgData = genData.data?.[0];
  if (!imgData) {
    return NextResponse.json({ error: "OpenAI no devolvió datos de imagen" }, { status: 500 });
  }

  // Handle both b64_json (gpt-image-1 default) and url (dall-e-3 without response_format override)
  let imgBuffer: Buffer;
  if (imgData.b64_json) {
    imgBuffer = Buffer.from(imgData.b64_json, "base64");
  } else if (imgData.url) {
    const imgRes = await fetch(imgData.url);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "No se pudo descargar la imagen generada" }, { status: 500 });
    }
    imgBuffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    return NextResponse.json({ error: "Formato de respuesta de imagen no reconocido" }, { status: 500 });
  }

  // Upload to Supabase Storage
  const fileName = `post-${post_id}-ai-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(fileName, imgBuffer, { contentType: "image/png", upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error subiendo imagen a Storage: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
  const publicUrl = urlData.publicUrl;
  console.log(`[generate-image] uploaded image_url=${publicUrl}`);

  const { data: updated, error: updateError } = await supabase
    .from("scheduled_posts")
    .update({ image_url: publicUrl, generation_status: "asset_ready" })
    .eq("id", post_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ post: updated, image_url: publicUrl });
}
