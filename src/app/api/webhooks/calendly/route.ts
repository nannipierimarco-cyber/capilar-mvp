import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook subscription setup:
// Create the webhook in Calendly → https://calendly.com/integrations/webhooks
// URL: https://nilolabs.vercel.app/api/webhooks/calendly
// Events: invitee.created, invitee.canceled
// Set CALENDLY_WEBHOOK_SIGNING_KEY from the signing key shown after creating the webhook.

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyCalendlySignature(rawBody: string, sigHeader: string): boolean {
  const sigKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!sigKey) {
    console.warn("[calendly-webhook] CALENDLY_WEBHOOK_SIGNING_KEY not set — skipping signature check");
    return true;
  }
  // Header format: "t=<timestamp>,v1=<hex_signature>"
  const parts: Record<string, string> = {};
  for (const seg of sigHeader.split(",")) {
    const eq = seg.indexOf("=");
    if (eq !== -1) parts[seg.slice(0, eq)] = seg.slice(eq + 1);
  }
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) {
    console.warn("[calendly-webhook] Missing t or v1 in signature header");
    return false;
  }
  const expected = createHmac("sha256", sigKey).update(`${t}.${rawBody}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyCalendlySignature(rawBody, req.headers.get("Calendly-Webhook-Signature") ?? "")) {
    console.warn("[calendly-webhook] Signature verification failed — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event as string | undefined;
  const data = payload.payload as Record<string, unknown> | undefined;

  console.log("[calendly-webhook] event:", event);

  if (!event || !data) {
    return NextResponse.json({ ok: true });
  }

  const db = getAdminDb();

  if (event === "invitee.created") {
    await handleInviteeCreated(db, data);
  } else if (event === "invitee.canceled") {
    await handleInviteeCanceled(db, data);
  } else {
    console.log("[calendly-webhook] unhandled event:", event);
  }

  return NextResponse.json({ ok: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInviteeCreated(db: SupabaseClient<any>, data: Record<string, unknown>) {
  const invitee = data.invitee as Record<string, unknown> | undefined;
  const scheduledEvent = data.scheduled_event as Record<string, unknown> | undefined;

  const inviteeEmail = invitee?.email as string | undefined;
  const inviteeUri = invitee?.uri as string | undefined;
  const eventUri = scheduledEvent?.uri as string | undefined;
  const startTime = scheduledEvent?.start_time as string | undefined;

  // TODO Phase 2 — extract intake_id or order_id from UTM params for reliable matching
  // const tracking = invitee?.tracking as Record<string, unknown> | undefined;
  // const utmContent = tracking?.utm_content as string | undefined;

  // Build a human-readable event URL from the URI
  const eventUrlSlug = eventUri ? eventUri.split("/").pop() : undefined;
  const eventUrl = eventUrlSlug
    ? `https://app.calendly.com/scheduled_events/${eventUrlSlug}`
    : undefined;

  console.log("[calendly-webhook] invitee.created:", { inviteeEmail, inviteeUri, startTime });

  if (!inviteeEmail) return;

  const { data: patient } = await db
    .from("patients")
    .select("id")
    .eq("email", inviteeEmail)
    .maybeSingle();

  if (!patient) {
    console.log("[calendly-webhook] no patient found for email:", inviteeEmail);
    return;
  }

  const { data: review } = await db
    .from("medical_reviews")
    .select("id, status")
    .eq("patient_id", patient.id)
    .in("status", ["pending_assignment", "pending_booking", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!review) {
    console.log("[calendly-webhook] no open review for patient:", patient.id);
    return;
  }

  const { error } = await db.from("medical_reviews").update({
    status: "consultation_booked",
    consultation_scheduled_at: startTime ?? null,
    calendly_event_url: eventUrl ?? null,
    calendly_event_uri: eventUri ?? null,
    calendly_invitee_uri: inviteeUri ?? null,
    calendly_invitee_email: inviteeEmail,
    updated_at: new Date().toISOString(),
  }).eq("id", review.id);

  if (error) {
    console.error("[calendly-webhook] update failed:", error);
  } else {
    console.log("[calendly-webhook] review", review.id, "→ consultation_booked");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInviteeCanceled(db: SupabaseClient<any>, data: Record<string, unknown>) {
  const invitee = data.invitee as Record<string, unknown> | undefined;
  const inviteeUri = invitee?.uri as string | undefined;
  const inviteeEmail = invitee?.email as string | undefined;

  console.log("[calendly-webhook] invitee.canceled:", { inviteeEmail, inviteeUri });

  if (inviteeUri) {
    const { data: review } = await db
      .from("medical_reviews")
      .select("id")
      .eq("calendly_invitee_uri", inviteeUri)
      .maybeSingle();

    if (review) {
      await db.from("medical_reviews").update({
        status: "pending_booking",
        consultation_scheduled_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", review.id);
      console.log("[calendly-webhook] review", review.id, "→ pending_booking (canceled)");
      return;
    }
  }

  if (inviteeEmail) {
    const { data: patient } = await db
      .from("patients")
      .select("id")
      .eq("email", inviteeEmail)
      .maybeSingle();

    if (patient) {
      const { data: review } = await db
        .from("medical_reviews")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("status", "consultation_booked")
        .maybeSingle();

      if (review) {
        await db.from("medical_reviews").update({
          status: "pending_booking",
          consultation_scheduled_at: null,
          updated_at: new Date().toISOString(),
        }).eq("id", review.id);
        console.log("[calendly-webhook] review", review.id, "→ pending_booking (canceled by email)");
      }
    }
  }
}
