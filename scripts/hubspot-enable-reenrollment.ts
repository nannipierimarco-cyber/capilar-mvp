import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const HUBSPOT_API_BASE = "https://api.hubapi.com";

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set in .env.local");
  return token;
}

interface WorkflowAction {
  type: string;
  [key: string]: unknown;
}

interface Workflow {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  insertedAt: number;
  updatedAt: number;
  allowContactToTriggerMultipleTimes?: boolean;
  onlyEnrollManually?: boolean;
  enrollmentCriteria?: unknown;
  reEnrollmentTriggerSets?: unknown[];
  actions?: WorkflowAction[];
  [key: string]: unknown;
}

interface WorkflowsResponse {
  workflows: Workflow[];
}

(async () => {
  const token = getToken();

  console.log("\n[reenrollment] === BUSCAR WORKFLOW DENTAL EN HUBSPOT ===\n");

  const res = await fetch(`${HUBSPOT_API_BASE}/automation/v3/workflows`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("[reenrollment] ❌ No se pudo listar workflows:", JSON.stringify(err, null, 2));
    if (res.status === 403) {
      console.error("[reenrollment] → Token sin scope 'automation'. El token de HubSpot necesita permisos de Automation/Workflows.");
    }
    process.exit(1);
  }

  const data = await res.json() as WorkflowsResponse;
  const workflows = data.workflows ?? [];

  console.log(`[reenrollment] Total workflows encontrados: ${workflows.length}\n`);

  // Mostrar todos para diagnóstico
  for (const wf of workflows) {
    const reEnroll = wf.allowContactToTriggerMultipleTimes ?? false;
    const manualOnly = wf.onlyEnrollManually ?? false;
    const flag = wf.name.toLowerCase().includes("dental") ? "  ← DENTAL" : "";
    console.log(`  ID ${String(wf.id).padEnd(12)} | ${wf.enabled ? "ON " : "OFF"} | re-enroll=${reEnroll} | manualOnly=${manualOnly} | ${wf.name}${flag}`);
  }

  // Buscar workflow dental
  const dental = workflows.find(
    (wf) =>
      wf.name.toLowerCase().includes("dental") ||
      wf.name.toLowerCase().includes("cita dental") ||
      wf.name.toLowerCase().includes("appointment dental")
  );

  if (!dental) {
    console.log("\n[reenrollment] ❌ No se encontró workflow con 'dental' en el nombre.");
    console.log("[reenrollment] Workflows disponibles:");
    for (const wf of workflows) {
      console.log(`   - [${wf.id}] ${wf.name}`);
    }
    console.log("\n[reenrollment] → Indicar el ID manualmente con: ID_WORKFLOW=<id> npx tsx scripts/hubspot-enable-reenrollment.ts");
    process.exit(1);
  }

  console.log(`\n[reenrollment] ✅ Workflow dental encontrado: [${dental.id}] "${dental.name}"`);
  console.log(`[reenrollment] Estado actual:`);
  console.log(`   enabled                          = ${dental.enabled}`);
  console.log(`   allowContactToTriggerMultipleTimes = ${dental.allowContactToTriggerMultipleTimes ?? false}`);
  console.log(`   onlyEnrollManually               = ${dental.onlyEnrollManually ?? false}`);

  if (dental.allowContactToTriggerMultipleTimes === true) {
    console.log("\n[reenrollment] Re-enrollment ya está activado. No se necesita cambio.");
    process.exit(0);
  }

  // Activar re-enrollment
  console.log("\n[reenrollment] Activando re-enrollment...");

  const updated = {
    ...dental,
    allowContactToTriggerMultipleTimes: true,
  };

  const putRes = await fetch(`${HUBSPOT_API_BASE}/automation/v3/workflows/${dental.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    console.error("[reenrollment] ❌ No se pudo actualizar workflow:", JSON.stringify(err, null, 2));
    if (putRes.status === 403) {
      console.error("[reenrollment] → Token sin permisos de escritura en workflows.");
    }
    process.exit(1);
  }

  const result = await putRes.json() as Workflow;
  console.log(`[reenrollment] ✅ Re-enrollment activado.`);
  console.log(`   allowContactToTriggerMultipleTimes = ${result.allowContactToTriggerMultipleTimes}`);
  console.log(`\n[reenrollment] Listo. Correr el test de sync para re-enrollar el contacto.`);
})().catch((err) => {
  console.error("[reenrollment] ❌ Error inesperado:", err instanceof Error ? err.message : err);
  process.exit(1);
});
