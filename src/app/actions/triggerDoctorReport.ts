"use server";

import { createClient } from "@supabase/supabase-js";
import { generateDoctorReport } from "@/lib/ai/generateDoctorReport";

const FRESHNESS_MS = 15 * 60 * 1000; // 15 minutes

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function triggerDoctorReport(intakeId: string): Promise<void> {
  try {
    const supabase = getAdminClient();

    const { data: intake } = await supabase
      .from("intakes")
      .select("created_at")
      .eq("id", intakeId)
      .single();

    if (!intake) return;

    // Only allow triggering for recently created intakes to prevent abuse
    const ageMs = Date.now() - new Date(intake.created_at as string).getTime();
    if (ageMs > FRESHNESS_MS) return;

    await generateDoctorReport(intakeId, false);
  } catch {
    // Fire-and-forget: swallow errors silently
  }
}
