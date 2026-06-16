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

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort: draft → approved → posted
  const order = { draft: 0, approved: 1, posted: 2 };
  const sorted = (data ?? []).sort(
    (a, b) =>
      (order[a.status as keyof typeof order] ?? 3) -
      (order[b.status as keyof typeof order] ?? 3)
  );

  return NextResponse.json({ posts: sorted });
}
