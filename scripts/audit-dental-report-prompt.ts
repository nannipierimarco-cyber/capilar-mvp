import { DENTAL_ANALYSIS_PROMPT_VERSION, DENTAL_ANALYSIS_SYSTEM_PROMPT, buildDentalAnalysisPrompt } from "../src/lib/dental/dentalAnalysisPrompt";

console.log("=== Dental Report Prompt Audit ===\n");

console.log(`Prompt version: ${DENTAL_ANALYSIS_PROMPT_VERSION}\n`);

console.log("System prompt file: src/lib/dental/dentalAnalysisPrompt.ts");
console.log("User prompt builder: buildDentalAnalysisPrompt(patientContext)\n");

console.log("--- System prompt (first 200 chars) ---");
console.log(DENTAL_ANALYSIS_SYSTEM_PROMPT.slice(0, 200) + "...\n");

console.log("--- User prompt sample (empty context) ---");
console.log(buildDentalAnalysisPrompt("no context").slice(0, 300) + "...\n");

const FORBIDDEN_TERMS = [
  "blanqueamiento", "ortodoncia", "carillas", "implantes", "cirugía",
  "plan de tratamiento", "tratamiento recomendado", "presupuesto",
  "visita urgente", "diagnóstico definitivo",
];

const fullPrompt = DENTAL_ANALYSIS_SYSTEM_PROMPT + buildDentalAnalysisPrompt("test");
const found = FORBIDDEN_TERMS.filter((term) =>
  fullPrompt.toLowerCase().includes(term.toLowerCase())
);

if (found.length > 0) {
  console.log("⚠️  FORBIDDEN TERMS FOUND IN PROMPT:");
  found.forEach((t) => console.log(`  - "${t}"`));
} else {
  console.log("✅ No forbidden clinical terms found in prompt.");
}

console.log("\n=== Audit complete ===");
