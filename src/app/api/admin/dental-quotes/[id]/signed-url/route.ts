import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const SIGNED_URL_SECONDS = 300; // 5 minutes — temporary, generated on demand

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getAdminClient();

  const { data: quote, error: fetchError } = await supabase
    .from("dental_quote_requests")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !quote?.storage_path) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("dental-quotes")
    .createSignedUrl(quote.storage_path, SIGNED_URL_SECONDS);

  if (error || !data) {
    console.error("[dental-quotes:signed-url] createSignedUrl error:", error);
    return NextResponse.json({ error: "No se pudo generar el link" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
