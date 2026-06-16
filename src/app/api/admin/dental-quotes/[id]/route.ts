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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = [
    "status",
    "patient_name",
    "preferred_commune",
    "original_clinic_name",
    "original_quote_amount",
    "main_treatment_type",
    "assigned_clinic_id",
    "assigned_doctor_name",
    "partner_quote_amount",
    "partner_quote_details",
    "partner_quote_notes",
    "appointment_url",
    "clinic_whatsapp_phone",
    "whatsapp_manual_message",
    "whatsapp_manual_sent_at",
    "whatsapp_manual_sent_by",
    "whatsapp_manual_status",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] === "" ? null : body[key];
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("dental_quote_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quote: data });
}
