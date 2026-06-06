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

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    full_name,
    email,
    temporary_password,
    specialty,
    vertical,
    license_number,
    calendly_url,
    availability_notes,
    is_active,
  } = body;

  if (!full_name?.trim() || !email?.trim() || !temporary_password?.trim()) {
    return NextResponse.json(
      { error: "Nombre completo, email y contraseña temporal son obligatorios." },
      { status: 400 }
    );
  }

  const validVerticals = ["dental", "hair", "skin"];
  if (!vertical || !validVerticals.includes(vertical)) {
    return NextResponse.json(
      { error: "Vertical es obligatorio (dental, hair o skin)." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  // Check for existing doctor_profiles with this email
  const { data: existing } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un doctor con este email." },
      { status: 409 }
    );
  }

  // Create Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: temporary_password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message?.toLowerCase() ?? "";
    if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "Ya existe un usuario Auth con este email." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: `Error al crear usuario Auth: ${authError.message}` },
      { status: 500 }
    );
  }

  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "No se pudo obtener el ID del usuario creado." },
      { status: 500 }
    );
  }

  // Insert doctor_profiles row
  const { error: profileError } = await supabase.from("doctor_profiles").insert({
    user_id: userId,
    full_name: full_name.trim(),
    email: email.trim(),
    specialty: specialty?.trim() || null,
    vertical: vertical as "dental" | "hair" | "skin",
    license_number: license_number?.trim() || null,
    calendly_url: calendly_url?.trim() || null,
    availability_notes: availability_notes?.trim() || null,
    is_active: is_active === true,
  });

  if (profileError) {
    // Auth user was created but profile insert failed — report clearly
    return NextResponse.json(
      {
        error: `Usuario Auth creado (${userId}) pero falló la creación del perfil: ${profileError.message}. Revisar manualmente.`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
