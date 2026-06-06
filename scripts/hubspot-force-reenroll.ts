import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const TEST_EMAIL = process.env.TEST_EMAIL ?? "marco.nannipieri+hubspot-dental-test@gmail.com";

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");
  return token;
}

async function patchContact(token: string, contactId: string, properties: Record<string, string>): Promise<void> {
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
}

(async () => {
  const token = getToken();

  console.log("\n[force-enroll] === FORZAR RE-ENROLLMENT POR CAMBIO DE PROPIEDAD ===");
  console.log("[force-enroll] email:", TEST_EMAIL);

  // Find contact
  const searchRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: TEST_EMAIL }] }],
      properties: ["email", "appointment_status"],
      limit: 1,
    }),
  });
  const searchData = await searchRes.json() as { results?: { id: string; properties: Record<string, string> }[] };
  const contact = searchData.results?.[0];
  if (!contact) {
    console.error("[force-enroll] ❌ Contacto no encontrado:", TEST_EMAIL);
    process.exit(1);
  }

  console.log(`[force-enroll] Contact ID: ${contact.id}`);
  console.log(`[force-enroll] appointment_status actual: ${contact.properties.appointment_status}`);

  // Step 1: set status to "confirmed" (temporary — triggers a change event)
  console.log("[force-enroll] Step 1: cambiando appointment_status → confirmed...");
  await patchContact(token, contact.id, { appointment_status: "confirmed" });
  await new Promise((r) => setTimeout(r, 800));

  // Step 2: set back to "scheduled" — HubSpot detects the change and fires the workflow
  console.log("[force-enroll] Step 2: restaurando appointment_status → scheduled...");
  await patchContact(token, contact.id, {
    appointment_status: "scheduled",
    last_appointment_event: new Date().toISOString(),
  });

  console.log("[force-enroll] ✅ Cambio de propiedad realizado.");
  console.log("[force-enroll] HubSpot debería re-enrollar al contacto en segundos.");
  console.log("[force-enroll] Revisa la bandeja de entrada en:", TEST_EMAIL);
})().catch((err) => {
  console.error("[force-enroll] ❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
