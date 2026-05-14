import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateDoctorReport } from "@/lib/ai/generateDoctorReport";
import { verifyAdminToken } from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  // Dual auth: admin cookie (admin portal) OR X-Internal-Secret header (Server Action)
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  const internalSecret = req.headers.get("x-internal-secret");

  const isAdmin = verifyAdminToken(adminToken ?? "");
  const isInternal =
    process.env.INTERNAL_API_SECRET &&
    internalSecret === process.env.INTERNAL_API_SECRET;

  if (!isAdmin && !isInternal) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { intake_id?: string; force?: boolean };
    const { intake_id, force } = body;

    if (!intake_id) {
      return NextResponse.json({ error: "intake_id required" }, { status: 400 });
    }

    const result = await generateDoctorReport(intake_id, force ?? false);

    if (!result.ok && !result.skipped) {
      const status =
        result.error === "Intake not found"
          ? 404
          : result.error?.includes("not configured")
          ? 503
          : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      skipped: result.skipped ?? false,
      reason: result.reason,
    });
  } catch (err) {
    console.error("[ai/doctor-report] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
