import { NextRequest, NextResponse } from "next/server";
import { syncHubSpotAppointment } from "@/lib/hubspot/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CALENDLY_API_ORIGIN = "https://api.calendly.com/";

interface CalendlyEventResource {
  start_time?: string;
}

interface CalendlyInviteeResource {
  cancel_url?: string;
  reschedule_url?: string;
}

async function fetchCalendly<T>(uri: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(uri, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn(`[calendly-embed] GET ${uri} → HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { resource: T };
    return json.resource ?? null;
  } catch (err) {
    console.warn("[calendly-embed] fetch error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, eventUri, inviteeUri, vertical, doctorId, doctorName, reportId } = body;

  // Validate required fields
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "email is required and must be valid" }, { status: 400 });
  }
  if (
    !eventUri ||
    typeof eventUri !== "string" ||
    !eventUri.startsWith(CALENDLY_API_ORIGIN)
  ) {
    return NextResponse.json(
      { error: "eventUri must be a Calendly API URI (https://api.calendly.com/...)" },
      { status: 400 }
    );
  }
  if (
    !inviteeUri ||
    typeof inviteeUri !== "string" ||
    !inviteeUri.startsWith(CALENDLY_API_ORIGIN)
  ) {
    return NextResponse.json(
      { error: "inviteeUri must be a Calendly API URI (https://api.calendly.com/...)" },
      { status: 400 }
    );
  }

  const calendlyToken = process.env.CALENDLY_TOKEN;
  let startTime: string | undefined;
  let cancelUrl: string | undefined;
  let rescheduleUrl: string | undefined;

  if (calendlyToken) {
    // Fetch event start_time and invitee cancel/reschedule URLs in parallel
    const [eventResource, inviteeResource] = await Promise.all([
      fetchCalendly<CalendlyEventResource>(eventUri, calendlyToken),
      fetchCalendly<CalendlyInviteeResource>(inviteeUri, calendlyToken),
    ]);
    startTime = eventResource?.start_time;
    cancelUrl = inviteeResource?.cancel_url;
    rescheduleUrl = inviteeResource?.reschedule_url;
    console.log("[calendly-embed] Calendly API resolved:", { startTime, cancelUrl });
  } else {
    console.warn(
      "[calendly-embed] CALENDLY_TOKEN not set — appointment_datetime, cancel_url and reschedule_url will be omitted from HubSpot sync"
    );
  }

  void (async () => {
    try {
      await syncHubSpotAppointment({
        email,
        appointmentStatus: "scheduled",
        appointmentDatetime: startTime,
        vertical: typeof vertical === "string" ? vertical : undefined,
        service: typeof vertical === "string" ? vertical : undefined,
        doctorName: typeof doctorName === "string" ? doctorName : undefined,
        channel: "calendly",
        cancelUrl,
        rescheduleUrl,
      });
      console.log("[calendly-embed] HubSpot synced:", {
        email,
        vertical,
        doctorName,
        startTime,
        doctorId,
        reportId: reportId ?? null,
      });
    } catch (err) {
      console.error("[calendly-embed] HubSpot sync error (non-blocking):", err);
    }
  })();

  return NextResponse.json({ ok: true });
}
