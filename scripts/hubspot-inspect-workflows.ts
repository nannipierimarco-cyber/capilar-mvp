import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const HUBSPOT_API_BASE = "https://api.hubapi.com";

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");
  return token;
}

const TARGET_IDS = [113545497, 114275938];

(async () => {
  const token = getToken();
  console.log("\n[inspect] === INSPECCIONANDO WORKFLOWS SIN NOMBRE ===\n");

  for (const id of TARGET_IDS) {
    const res = await fetch(`${HUBSPOT_API_BASE}/automation/v3/workflows/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`[inspect] ❌ Error fetching workflow ${id}:`, await res.text());
      continue;
    }
    const wf = await res.json() as Record<string, unknown>;
    console.log(`\n--- Workflow ID ${id} ---`);
    console.log(`  name   : ${wf.name}`);
    console.log(`  enabled: ${wf.enabled}`);
    console.log(`  allowContactToTriggerMultipleTimes: ${wf.allowContactToTriggerMultipleTimes}`);
    // Print enrollment criteria compactly
    const criteria = wf.enrollmentCriteria;
    console.log(`  enrollmentCriteria: ${JSON.stringify(criteria, null, 2)}`);
    // Print re-enrollment trigger sets
    const reEnroll = wf.reEnrollmentTriggerSets;
    console.log(`  reEnrollmentTriggerSets: ${JSON.stringify(reEnroll, null, 2)}`);
    // Print first action type to identify purpose
    const actions = wf.actions as unknown[] | undefined;
    if (actions?.length) {
      console.log(`  actions[0]: ${JSON.stringify(actions[0], null, 2)}`);
    }
  }
})().catch((err) => {
  console.error("[inspect] ❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
