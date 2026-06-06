import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const GROUP_NAME = "perfecto_labs_citas";
const GROUP_LABEL = "Perfecto Labs - Citas";

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set in .env.local");
  return token;
}

interface PropertyOption {
  label: string;
  value: string;
  displayOrder: number;
  hidden: boolean;
}

interface PropertyDefinition {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  groupName: string;
  options?: PropertyOption[];
}

const PROPERTIES: PropertyDefinition[] = [
  {
    name: "appointment_status",
    label: "Estado de cita",
    type: "enumeration",
    fieldType: "select",
    groupName: GROUP_NAME,
    options: ["scheduled", "confirmed", "rescheduled", "cancelled", "completed", "no_show"].map(
      (v, i) => ({ label: v, value: v, displayOrder: i, hidden: false })
    ),
  },
  {
    name: "appointment_datetime",
    label: "Fecha y hora de cita",
    type: "datetime",
    fieldType: "date",
    groupName: GROUP_NAME,
  },
  // Vertical that originated the appointment — used to branch workflows per specialty
  {
    name: "appointment_vertical",
    label: "Vertical de cita",
    type: "enumeration",
    fieldType: "select",
    groupName: GROUP_NAME,
    options: ["dental", "hair", "skin"].map(
      (v, i) => ({ label: v, value: v, displayOrder: i, hidden: false })
    ),
  },
  {
    name: "appointment_clinic_name",
    label: "Clínica de cita",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    name: "appointment_clinic_address",
    label: "Dirección de cita",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    name: "appointment_doctor_name",
    label: "Doctor / especialista",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    name: "appointment_service",
    label: "Servicio de cita",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    // Values must match all channels used in code: website_dental/hair/skin from
    // appointmentVerticals.ts, and "calendly" from the Calendly webhook.
    name: "appointment_channel",
    label: "Canal de agendamiento",
    type: "enumeration",
    fieldType: "select",
    groupName: GROUP_NAME,
    options: [
      "website_dental",
      "website_hair",
      "website_skin",
      "calendly",
      "whatsapp",
      "hubspot_meetings",
      "clinic_manual",
      "admin",
      "other",
    ].map((v, i) => ({ label: v, value: v, displayOrder: i, hidden: false })),
  },
  {
    name: "appointment_confirmation_url",
    label: "URL de confirmación",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    name: "appointment_cancel_url",
    label: "URL de cancelación",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    name: "appointment_reschedule_url",
    label: "URL de reagendamiento",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
  {
    name: "last_appointment_synced_at",
    label: "Última sincronización de cita",
    type: "datetime",
    fieldType: "date",
    groupName: GROUP_NAME,
  },
  // Used in P1 to force re-enrollment when the same contact reschedules.
  // Set to a new value (e.g. ISO timestamp) each time an appointment event fires.
  {
    name: "last_appointment_event",
    label: "Último evento de cita",
    type: "string",
    fieldType: "text",
    groupName: GROUP_NAME,
  },
];

async function ensureGroup(token: string): Promise<void> {
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/properties/contacts/groups/${GROUP_NAME}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    console.log(`[group] exists: ${GROUP_NAME}`);
    return;
  }

  if (res.status !== 404) {
    const body = await res.json();
    throw new Error(`[group] unexpected error checking group: ${JSON.stringify(body)}`);
  }

  const createRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/properties/contacts/groups`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: GROUP_NAME, label: GROUP_LABEL }),
  });

  if (!createRes.ok) {
    const body = await createRes.json();
    throw new Error(`[group] failed to create group: ${JSON.stringify(body)}`);
  }

  console.log(`[group] created: ${GROUP_NAME}`);
}

async function ensureProperty(token: string, prop: PropertyDefinition): Promise<void> {
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/properties/contacts/${prop.name}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    console.log(`[property] exists: ${prop.name}`);
    return;
  }

  if (res.status !== 404) {
    const body = await res.json();
    throw new Error(`[property] unexpected error checking ${prop.name}: ${JSON.stringify(body)}`);
  }

  const createRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/properties/contacts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(prop),
  });

  if (!createRes.ok) {
    const body = await createRes.json();
    throw new Error(`[property] failed to create ${prop.name}: ${JSON.stringify(body)}`);
  }

  console.log(`[property] created: ${prop.name}`);
}

async function main(): Promise<void> {
  const token = getToken();
  console.log("[hubspot] starting appointment properties setup...");

  await ensureGroup(token);

  for (const prop of PROPERTIES) {
    await ensureProperty(token, prop);
  }

  console.log("[hubspot] setup complete.");
}

main().catch((err) => {
  console.error("[hubspot] setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
