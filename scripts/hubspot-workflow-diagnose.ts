import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE = "https://api.hubapi.com";

function tok(): string {
  const t = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!t) throw new Error("HUBSPOT_ACCESS_TOKEN not set");
  return t;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${tok()}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

interface TriggerItem { id: string; type: string }
type TriggerSet = TriggerItem[];
interface Action { type: string; emailCampaignId?: number; emailCampaignGroupId?: number; emailContentId?: number; [k: string]: unknown }
interface Workflow {
  id: number; name: string; enabled: boolean;
  allowContactToTriggerMultipleTimes?: boolean;
  onlyEnrollManually?: boolean;
  enrollmentCriteria?: unknown;
  reEnrollmentTriggerSets?: TriggerSet[];
  actions?: Action[];
  [k: string]: unknown;
}

function summarizeTriggers(sets: TriggerSet[] | undefined): string {
  if (!sets || sets.length === 0) return "(none)";
  return sets.map((set, i) => {
    const parts: string[] = [];
    for (let j = 0; j < set.length - 1; j += 2) {
      const name = set[j]?.id ?? "?";
      const val = set[j + 1]?.id ?? "?";
      parts.push(`${name}=${val}`);
    }
    if (set.length % 2 !== 0) parts.push(set[set.length - 1]?.id ?? "?");
    return `  Set ${i + 1}: ${parts.join(" AND ")}`;
  }).join("\n");
}

function checkTriggerPresent(sets: TriggerSet[] | undefined, propId: string): boolean {
  return (sets ?? []).some(set => set.some(t => t.id === propId));
}

async function main() {
  const WF_IDS = [113545497, 114275938];
  const wfs: Workflow[] = [];

  for (const id of WF_IDS) {
    try {
      const wf = await get<Workflow>(`/automation/v3/workflows/${id}`);
      wfs.push(wf);
    } catch (e) {
      console.log(`[diagnose] ❌ Could not fetch workflow ${id}:`, (e as Error).message);
    }
  }

  console.log("\n[diagnose] ═══════════════════════════════════════════");
  console.log("[diagnose]  WORKFLOW DIAGNOSIS");
  console.log("[diagnose] ═══════════════════════════════════════════\n");

  for (const wf of wfs) {
    const triggers = wf.reEnrollmentTriggerSets;
    const hasStatus   = checkTriggerPresent(triggers, "appointment_status");
    const hasVertical = checkTriggerPresent(triggers, "appointment_vertical");
    const hasDatetime = checkTriggerPresent(triggers, "appointment_datetime");
    const hasService  = checkTriggerPresent(triggers, "appointment_service");
    const hasLastSync = checkTriggerPresent(triggers, "last_appointment_synced_at");
    const hasLastEvt  = checkTriggerPresent(triggers, "last_appointment_event");

    const emailActions = (wf.actions ?? []).filter(a => a.type === "EMAIL");
    const isDental = hasStatus && hasVertical;

    console.log(`─── Workflow [${wf.id}] ─────────────────────────────`);
    console.log(`  name     : ${wf.name}`);
    console.log(`  enabled  : ${wf.enabled}`);
    console.log(`  re-enroll: ${wf.allowContactToTriggerMultipleTimes ?? false}`);
    console.log(`  manualOnly: ${wf.onlyEnrollManually ?? false}`);
    console.log(`  enrollmentCriteria: ${wf.enrollmentCriteria ? JSON.stringify(wf.enrollmentCriteria).slice(0, 120) : "(none)"}`);
    console.log(`\n  Re-enrollment trigger sets:\n${summarizeTriggers(triggers)}`);
    console.log(`\n  Trigger flags:`);
    console.log(`    appointment_status      : ${hasStatus   ? "✅" : "❌"}`);
    console.log(`    appointment_vertical    : ${hasVertical ? "✅" : "❌"}`);
    console.log(`    appointment_datetime    : ${hasDatetime ? "⚠️  present (may be undefined)" : "✅ absent"}`);
    console.log(`    appointment_service     : ${hasService  ? "⚠️  present (skip for test)" : "✅ absent"}`);
    console.log(`    last_appointment_synced_at: ${hasLastSync ? "✅" : "❌ absent"}`);
    console.log(`    last_appointment_event  : ${hasLastEvt  ? "✅" : "❌ absent"}`);
    console.log(`\n  Email actions (${emailActions.length}):`);
    for (const a of emailActions) {
      console.log(`    campaignId=${a.emailCampaignId} groupId=${a.emailCampaignGroupId} contentId=${a.emailContentId}`);
    }
    console.log(`  → isDentalWorkflow: ${isDental ? "✅ YES" : "❌ no"}`);
    console.log();
  }

  // Identify the dental one
  const dental = wfs.find(wf =>
    checkTriggerPresent(wf.reEnrollmentTriggerSets, "appointment_status") &&
    checkTriggerPresent(wf.reEnrollmentTriggerSets, "appointment_vertical")
  );

  if (!dental) {
    console.log("[diagnose] ❌ No dental workflow found with both appointment_status + appointment_vertical triggers.");
    return;
  }

  console.log(`[diagnose] ✅ Dental workflow identified: [${dental.id}]`);

  // Check if the trigger sets have problematic conditions
  const triggers = dental.reEnrollmentTriggerSets ?? [];
  const hasDatetime = checkTriggerPresent(triggers, "appointment_datetime");
  const hasService  = checkTriggerPresent(triggers, "appointment_service");

  if (hasDatetime || hasService) {
    console.log("\n[diagnose] ⚠️  Workflow has potentially problematic trigger conditions:");
    if (hasDatetime) console.log("  - appointment_datetime: can be undefined if CALENDLY_TOKEN not set");
    if (hasService)  console.log("  - appointment_service: optional field, not always present");
    console.log("  Full trigger sets:", JSON.stringify(triggers, null, 2));
  }

  // Attempt PUT to clean up triggers
  const idealTriggers: TriggerSet[] = [
    [
      { id: "appointment_status", type: "CONTACT_PROPERTY_NAME" },
      { id: "scheduled", type: "CONTACT_PROPERTY_VALUE" },
    ],
    [
      { id: "appointment_vertical", type: "CONTACT_PROPERTY_NAME" },
      { id: "dental", type: "CONTACT_PROPERTY_VALUE" },
    ],
    [
      { id: "last_appointment_synced_at", type: "CONTACT_PROPERTY_NAME" },
    ],
  ];

  const needsUpdate =
    hasDatetime || hasService ||
    !checkTriggerPresent(triggers, "last_appointment_synced_at");

  if (needsUpdate) {
    console.log("\n[diagnose] Attempting PUT to update workflow triggers...");
    const updated = { ...dental, reEnrollmentTriggerSets: idealTriggers };
    const putRes = await fetch(`${BASE}/automation/v3/workflows/${dental.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const putText = await putRes.text();
    if (putRes.ok) {
      console.log("[diagnose] ✅ Workflow updated via PUT successfully.");
    } else {
      console.log(`[diagnose] ❌ PUT failed HTTP ${putRes.status}: ${putText.slice(0, 200)}`);
      console.log("[diagnose] API does not allow workflow edits via this token.");
      console.log("[diagnose] → Manual step required (1 action in HubSpot UI — see below).");
    }
  } else {
    console.log("\n[diagnose] ✅ Triggers already clean — no update needed.");
  }
}

main().catch(err => {
  console.error("[diagnose] Fatal:", (err as Error).message);
  process.exit(1);
});
