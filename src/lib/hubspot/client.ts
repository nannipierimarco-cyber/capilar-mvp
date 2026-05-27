const HUBSPOT_API_BASE = "https://api.hubapi.com";

export interface SyncLeadInput {
  email: string;
  nombre?: string;
  whatsapp?: string;
  score?: number;
  scoreLabel?: string;
  capillaryAge?: number;
  preliminaryRoute?: string;
  mainConcernArea?: string;
  leadStage?: string;
  transplantInterest?: string;
  userReportGenerated?: boolean;
  medicalCtaClicked?: boolean;
}

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");
  return token;
}

async function findContactByEmail(token: string, email: string): Promise<string | null> {
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      properties: ["email"],
      limit: 1,
    }),
  });
  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(`[hubspot] findContactByEmail failed: ${JSON.stringify(errBody)}`);
  }
  const data = await res.json() as { results?: { id: string }[] };
  return data.results?.[0]?.id ?? null;
}

async function patchContact(
  token: string,
  contactId: string,
  properties: Record<string, string>
): Promise<void> {
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

async function createContact(
  token: string,
  properties: Record<string, string>
): Promise<string> {
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  const data = await res.json() as { id: string };
  return data.id;
}

export interface SyncAppointmentInput {
  email: string;
  appointmentStatus?: string;
  appointmentDatetime?: string;
  clinicName?: string;
  clinicAddress?: string;
  doctorName?: string;
  service?: string;
  channel?: string;
  confirmationUrl?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
}

// Custom properties required in HubSpot portal (CRM → Properties → Contact properties → Create property):
//
//  Internal name              | Label                      | Field type
//  ---------------------------|----------------------------|------------
//  score_capilar              | Score Capilar              | Number
//  score_label                | Score Label                | Single-line text
//  edad_capilar_aparente      | Edad Capilar Aparente      | Number
//  ruta_preliminar            | Ruta Preliminar            | Single-line text
//  zona_principal             | Zona Principal             | Single-line text
//  lead_stage                 | Lead Stage                 | Single-line text
//  interes_trasplante         | Interés Trasplante         | Single-line text
//  mapa_capilar_generado      | Mapa Capilar Generado      | Single checkbox (boolean)
//  evaluacion_medica_clicked  | Evaluación Médica Clicked  | Single checkbox (boolean)
//
// Future optional fields (not sent — requires paid HubSpot plan to create):
//  fuente                     | Fuente                     | Single-line text
//  vertical                   | Vertical                   | Single-line text

export async function syncHubSpotContact(input: SyncLeadInput): Promise<{ contactId: string }> {
  const token = getToken();

  const existingId = await findContactByEmail(token, input.email);

  // Step 1 — standard fields (always attempt, fail hard if these break)
  const standardProps: Record<string, string> = { email: input.email };
  if (input.nombre) standardProps.firstname = input.nombre;
  if (input.whatsapp) standardProps.phone = input.whatsapp;

  let contactId: string;
  if (existingId) {
    await patchContact(token, existingId, standardProps);
    contactId = existingId;
  } else {
    contactId = await createContact(token, standardProps);
  }
  console.log(`[hubspot] contact upserted: ${contactId}`);

  // Step 2 — custom fields (fail gracefully; log exact error for debugging)
  const customProps: Record<string, string> = {};
  if (input.score !== undefined) customProps.score_capilar = String(input.score);
  if (input.scoreLabel) customProps.score_label = input.scoreLabel;
  if (input.capillaryAge !== undefined) customProps.edad_capilar_aparente = String(input.capillaryAge);
  if (input.preliminaryRoute) customProps.ruta_preliminar = input.preliminaryRoute;
  if (input.mainConcernArea) customProps.zona_principal = input.mainConcernArea;
  if (input.leadStage) customProps.lead_stage = input.leadStage;
  if (input.transplantInterest) customProps.interes_trasplante = input.transplantInterest;
  if (input.userReportGenerated !== undefined) customProps.mapa_capilar_generado = String(input.userReportGenerated);
  if (input.medicalCtaClicked !== undefined) customProps.evaluacion_medica_clicked = String(input.medicalCtaClicked);
  // fuente and vertical not sent — requires paid HubSpot plan to create custom properties

  try {
    if (Object.keys(customProps).length === 0) {
      return { contactId };
    }
    await patchContact(token, contactId, customProps);
    console.log(`[hubspot] custom properties synced for contact: ${contactId}`);
  } catch (err) {
    console.error("[hubspot] custom properties failed (standard fields already saved). Create the missing properties in HubSpot portal. Error:", err);
  }

  return { contactId };
}

export async function syncHubSpotAppointment(input: SyncAppointmentInput): Promise<{ contactId: string }> {
  if (!input.email) throw new Error("[hubspot] syncHubSpotAppointment: email is required");
  const token = getToken();

  const existingId = await findContactByEmail(token, input.email);
  let contactId: string;
  if (existingId) {
    await patchContact(token, existingId, { email: input.email });
    contactId = existingId;
  } else {
    contactId = await createContact(token, { email: input.email });
  }
  console.log(`[hubspot] contact upserted for appointment: ${contactId}`);

  const appointmentProps: Record<string, string> = {};
  if (input.appointmentStatus) appointmentProps.appointment_status = input.appointmentStatus;
  if (input.appointmentDatetime) appointmentProps.appointment_datetime = input.appointmentDatetime;
  if (input.clinicName) appointmentProps.appointment_clinic_name = input.clinicName;
  if (input.clinicAddress) appointmentProps.appointment_clinic_address = input.clinicAddress;
  if (input.doctorName) appointmentProps.appointment_doctor_name = input.doctorName;
  if (input.service) appointmentProps.appointment_service = input.service;
  if (input.channel) appointmentProps.appointment_channel = input.channel;
  if (input.confirmationUrl) appointmentProps.appointment_confirmation_url = input.confirmationUrl;
  if (input.cancelUrl) appointmentProps.appointment_cancel_url = input.cancelUrl;
  if (input.rescheduleUrl) appointmentProps.appointment_reschedule_url = input.rescheduleUrl;
  appointmentProps.last_appointment_synced_at = new Date().toISOString();

  if (Object.keys(appointmentProps).length <= 1) {
    return { contactId };
  }

  await patchContact(token, contactId, appointmentProps);
  console.log(`[hubspot] appointment synced for contact: ${contactId}`);

  return { contactId };
}
