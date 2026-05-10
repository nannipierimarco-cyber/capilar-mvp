import { NextRequest, NextResponse } from "next/server";
import { syncHubSpotContact, type SyncLeadInput } from "@/lib/hubspot/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SyncLeadInput;

    if (!body?.email) {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
    }

    const { contactId } = await syncHubSpotContact(body);
    return NextResponse.json({ success: true, contactId });
  } catch (err) {
    console.error("[hubspot_sync_failed]", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
