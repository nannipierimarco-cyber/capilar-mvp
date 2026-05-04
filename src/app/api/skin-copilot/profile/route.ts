import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * GET /api/skin-copilot/profile?phone=+56912345678
 * Returns the skin profile for the given phone number.
 */
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "'phone' query param is required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: user } = await supabase
    .from("skin_copilot_users")
    .select("id")
    .eq("phone_number", phone)
    .single();

  if (!user) {
    return NextResponse.json({ profile: null });
  }

  const { data: profile } = await supabase
    .from("skin_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ profile: profile ?? null });
}

/**
 * PATCH /api/skin-copilot/profile
 * Upserts fields on a user's skin profile.
 *
 * Body: { phone: string; updates: Partial<SkinProfile> }
 */
export async function PATCH(req: NextRequest) {
  let body: { phone?: string; updates?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, updates } = body;
  if (!phone || !updates || typeof updates !== "object") {
    return NextResponse.json(
      { error: "'phone' and 'updates' object are required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: user } = await supabase
    .from("skin_copilot_users")
    .select("id")
    .eq("phone_number", phone)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: profile, error } = await supabase
    .from("skin_profiles")
    .upsert(
      { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
