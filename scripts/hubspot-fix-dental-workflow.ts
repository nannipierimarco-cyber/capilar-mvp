import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const DENTAL_WORKFLOW_ID = 114275938;
const TEST_EMAIL = process.env.TEST_EMAIL ?? "marco.nannipieri+hubspot-dental-test@gmail.com";

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");
  return token;
}

(async () => {
  const token = getToken();
  console.log("\n[fix] === ACTUALIZAR WORKFLOW DENTAL + ENROLL CONTACTO ===\n");

  // Step 1: fetch current workflow definition
  const getRes = await fetch(`${HUBSPOT_API_BASE}/automation/v3/workflows/${DENTAL_WORKFLOW_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!getRes.ok) {
    console.error("[fix] ❌ No se pudo leer workflow:", await getRes.text());
    process.exit(1);
  }
  const wf = await getRes.json() as Record<string, unknown>;
  console.log(`[fix] Workflow: [${DENTAL_WORKFLOW_ID}] "${wf.name}"`);

  const currentTriggers = (wf.reEnrollmentTriggerSets as unknown[][]) ?? [];
  const hasLastEvent = currentTriggers.some((set) =>
    set.some((t) => (t as Record<string, string>).id === "last_appointment_event")
  );
  console.log(`[fix] Trigger last_appointment_event en workflow: ${hasLastEvent ? "✅ presente" : "❌ ausente (agregar manualmente en HubSpot UI)"}`);
  console.log("[fix] Nota: API v3 HubSpot es read-only para workflows. El trigger debe agregarse en UI.");
  console.log("[fix] Ruta: Automation → Workflows → [114275938] → Settings → Re-enrollment → agregar 'last_appointment_event'");

  // Step 2: manually enroll test contact to trigger the email now
  console.log(`\n[fix] Enrollando contacto de test manualmente: ${TEST_EMAIL}`);
  // Resolve contact ID from email first
  const searchRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: TEST_EMAIL }] }],
      properties: ["email"],
      limit: 1,
    }),
  });
  const searchData = await searchRes.json() as { results?: { id: string }[] };
  const contactId = searchData.results?.[0]?.id;
  if (!contactId) {
    console.error("[fix] ❌ Contacto no encontrado en HubSpot:", TEST_EMAIL);
    process.exit(1);
  }
  console.log(`[fix] Contact ID: ${contactId}`);

  // v1 enrollment endpoint accepts email directly
  const enrollRes = await fetch(
    `${HUBSPOT_API_BASE}/automation/v1/workflows/${DENTAL_WORKFLOW_ID}/enrollments/contacts/${encodeURIComponent(TEST_EMAIL)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }
  );

  if (enrollRes.status === 204 || enrollRes.ok) {
    console.log("[fix] ✅ Contacto enrollado. HubSpot debería disparar el email en segundos.");
    console.log("[fix] Revisar bandeja de entrada en:", TEST_EMAIL);
  } else {
    const err = await enrollRes.text();
    console.error(`[fix] ❌ Enroll falló (HTTP ${enrollRes.status}):`, err);
    console.log("[fix] → Puede que el contacto no exista o ya esté en el workflow actualmente.");
  }
})().catch((err) => {
  console.error("[fix] ❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
