"use server";

import { syncHubSpotContact, type SyncLeadInput } from "@/lib/hubspot/client";

export async function syncLead(input: SyncLeadInput): Promise<{ success: boolean }> {
  if (!input?.email) return { success: false };
  try {
    await syncHubSpotContact(input);
    return { success: true };
  } catch (e) {
    console.error("[syncLead]", e);
    return { success: false };
  }
}
