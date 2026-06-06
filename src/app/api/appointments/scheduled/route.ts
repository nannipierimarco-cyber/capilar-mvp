import { NextRequest, NextResponse } from "next/server";
import { syncHubSpotAppointment } from "@/lib/hubspot/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, appointmentDatetime } = body;

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "email is required and must be valid" }, { status: 400 });
  }
  try {
    const result = await syncHubSpotAppointment({
      email,
      appointmentStatus: typeof body.appointmentStatus === "string" ? body.appointmentStatus : undefined,
      appointmentDatetime: typeof appointmentDatetime === "string" ? appointmentDatetime : undefined,
      clinicName: typeof body.clinicName === "string" ? body.clinicName : undefined,
      clinicAddress: typeof body.clinicAddress === "string" ? body.clinicAddress : undefined,
      doctorName: typeof body.doctorName === "string" ? body.doctorName : undefined,
      service: typeof body.service === "string" ? body.service : undefined,
      channel: typeof body.channel === "string" ? body.channel : undefined,
      confirmationUrl: typeof body.confirmationUrl === "string" ? body.confirmationUrl : undefined,
      cancelUrl: typeof body.cancelUrl === "string" ? body.cancelUrl : undefined,
      rescheduleUrl: typeof body.rescheduleUrl === "string" ? body.rescheduleUrl : undefined,
    });

    // TODO: persist appointment to Supabase appointments table (future)

    return NextResponse.json({ success: true, contactId: result.contactId });
  } catch (err) {
    console.error("[appointments/scheduled] HubSpot sync failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Error registering appointment" }, { status: 500 });
  }
}
