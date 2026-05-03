import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// TODO Phase 2 — Signature verification
// Calendly signs webhook payloads with CALENDLY_WEBHOOK_SIGNING_KEY.
// When ready, verify the "Calendly-Webhook-Signature" header before processing.
// Reference: https://developer.calendly.com/api-docs/ZG9jOjM2MzI3MDM4-webhook-signatures

// TODO Phase 2 — Webhook subscription setup
// Create the webhook subscription in Calendly pointing to:
//   https://nilolabs.vercel.app/api/webhooks/calendly
// Subscribe to events: invitee.created, invitee.canceled
// Use UTM params in calendly_url links (utm_content=<intake_id>) to improve patient matching.
// Calendly dashboard: https://calendly.com/integrations/webhooks

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
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
