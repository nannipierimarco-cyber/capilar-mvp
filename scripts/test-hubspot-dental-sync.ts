import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { syncHubSpotAppointment } from "../src/lib/hubspot/client";

const email = process.env.TEST_EMAIL;
if (!email) {
  console.error("[test] TEST_EMAIL env var is required");
  process.exit(1);
}

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);
const appointmentDatetime = tomorrow.toISOString();

const input = {
  email,
  appointmentStatus: "scheduled",
  vertical: "dental",
  service: "dental",
  channel: "calendly",
  doctorName: "Pato Dental Test",
  appointmentDatetime,
  cancelUrl: "https://calendly.com/nannipierimarco/new-meeting-1",
  rescheduleUrl: "https://calendly.com/nannipierimarco/new-meeting-1",
};

console.log("\n[test] === TEST DIRECTO backend → HubSpot ===");
console.log("[test] email:", email);
console.log("[test] payload:", JSON.stringify(input, null, 2));
console.log("[test] running syncHubSpotAppointment...\n");

(async () => {
  try {
    const result = await syncHubSpotAppointment(input);
    console.log("\n[test] ✅ ÉXITO — contacto sincronizado");
    console.log("[test] contactId:", result.contactId);
    console.log("[test] Propiedades enviadas a HubSpot:");
    console.log("  appointment_status     =", input.appointmentStatus);
    console.log("  appointment_vertical   =", input.vertical);
    console.log("  appointment_channel    =", input.channel);
    console.log("  appointment_service    =", input.service);
    console.log("  appointment_doctor_name=", input.doctorName);
    console.log("  appointment_datetime   =", input.appointmentDatetime);
    console.log("  cancel_url             =", input.cancelUrl);
    console.log("  last_appointment_synced_at = (timestamp enviado)");
    console.log("\n[test] Ejecuta check-hubspot-appointment-contact.ts para verificar.");
  } catch (err) {
    console.error("\n[test] ❌ ERROR en syncHubSpotAppointment:");
    console.error(err instanceof Error ? err.message : JSON.stringify(err));
    process.exit(1);
  }
})();
