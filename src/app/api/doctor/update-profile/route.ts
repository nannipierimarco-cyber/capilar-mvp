import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getAdminClient();

  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctorProfile) {
    return NextResponse.json({ error: "Perfil médico no encontrado" }, { status: 403 });
  }

  const body = await req.json() as {
    calendly_url?: string;
    availability_notes?: string;
  };

  const update: Record<string, unknown> = {};
  if (typeof body.calendly_url === "string") {
    update.calendly_url = body.calendly_url.trim() || null;
  }
  if (typeof body.availability_notes === "string") {
    update.availability_notes = body.availability_notes.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
  }

  const { error } = await supabase
    .from("doctor_profiles")
    .update(update)
    .eq("id", (doctorProfile as { id: string }).id);

  if (error) {
    console.error("[doctor/update-profile] error:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
