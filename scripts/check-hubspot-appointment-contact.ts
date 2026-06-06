import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const HUBSPOT_API_BASE = "https://api.hubapi.com";

const email = process.env.TEST_EMAIL;
if (!email) {
  console.error("[check] TEST_EMAIL env var is required");
  process.exit(1);
}

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set in .env.local");
  return token;
}

const PROPS_TO_CHECK = [
  "email",
  "firstname",
  "appointment_status",
  "appointment_vertical",
  "appointment_channel",
  "appointment_service",
  "appointment_doctor_name",
  "appointment_datetime",
  "last_appointment_synced_at",
  "last_appointment_event",
];

(async () => {
  const token = getToken();

  console.log("\n[check] === VERIFICACIÓN CONTACTO HUBSPOT ===");
  console.log("[check] email:", email);

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      properties: PROPS_TO_CHECK,
      limit: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("[check] ❌ Error buscando contacto:", JSON.stringify(err));
    process.exit(1);
  }

  const data = await res.json() as { results?: { id: string; properties: Record<string, string | null> }[] };

  if (!data.results || data.results.length === 0) {
    console.log("\n[check] ❌ CONTACTO NO EXISTE en HubSpot para:", email);
    console.log("[check] → El sync no llegó a crear el contacto, o el email no coincide.");
    process.exit(0);
  }

  const contact = data.results[0];
  const props = contact.properties;

  console.log("\n[check] ✅ Contacto encontrado — ID:", contact.id);
  console.log("[check] Propiedades:\n");

  const EXPECTED: Record<string, string> = {
    appointment_status: "scheduled",
    appointment_vertical: "dental",
    appointment_channel: "calendly",
    appointment_service: "dental",
  };

  const missing: string[] = [];
  const wrong: string[] = [];

  for (const key of PROPS_TO_CHECK) {
    const val = props[key];
    const display = val ?? "(null/vacío)";

    if (key in EXPECTED) {
      if (!val) {
        missing.push(key);
        console.log(`  ❌ ${key.padEnd(32)} = ${display}  ← FALTA`);
      } else if (val !== EXPECTED[key]) {
        wrong.push(`${key}: esperado="${EXPECTED[key]}" recibido="${val}"`);
        console.log(`  ⚠️  ${key.padEnd(32)} = ${display}  ← INCORRECTO (esperado: ${EXPECTED[key]})`);
      } else {
        console.log(`  ✅ ${key.padEnd(32)} = ${display}`);
      }
    } else {
      console.log(`  ${val ? "✅" : "○ "} ${key.padEnd(32)} = ${display}`);
    }
  }

  console.log("\n[check] === DIAGNÓSTICO ===");

  if (missing.length === 0 && wrong.length === 0) {
    console.log("[check] ✅ TODAS las propiedades de cita están correctas.");
    console.log("[check] → Si no llegó email, el problema está en el WORKFLOW de HubSpot.");
    console.log("[check] → Revisar: Automation → Workflows → workflow dental → enrollment criteria.");
  } else {
    if (missing.includes("appointment_status") || missing.includes("appointment_vertical")) {
      console.log("[check] ❌ Propiedades clave ausentes — posibles causas:");
      console.log("   1. Las propiedades no fueron creadas en HubSpot (correr: npm run hubspot:setup-appointments)");
      console.log("   2. HUBSPOT_ACCESS_TOKEN sin scope de escritura en propiedades custom");
      console.log("   3. Error silencioso en syncHubSpotAppointment (revisar logs del servidor)");
    }
    if (missing.length > 0) {
      console.log("[check] Propiedades faltantes:", missing.join(", "));
    }
    if (wrong.length > 0) {
      console.log("[check] Propiedades incorrectas:", wrong.join(" | "));
    }
  }
})().catch((err) => {
  console.error("[check] ❌ Error inesperado:", err instanceof Error ? err.message : err);
  process.exit(1);
});
