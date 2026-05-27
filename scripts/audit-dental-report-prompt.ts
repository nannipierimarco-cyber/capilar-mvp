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

// Prefixes that indicate a term appears in a negation rule, not as a recommendation.
const NEGATION_PREFIXES = ["no mencionar", "no recomendar", "no emitas", "no elabores", "no hagas", "sin ", "no "];

function isNegated(prompt: string, term: string): boolean {
  const lower = prompt.toLowerCase();
  const termLower = term.toLowerCase();
  let idx = lower.indexOf(termLower);
  while (idx !== -1) {
    // Grab up to 40 chars before the term to check for negation context
    const before = lower.slice(Math.max(0, idx - 80), idx);
    const isInNegation = NEGATION_PREFIXES.some((prefix) => before.includes(prefix));
    if (!isInNegation) return false; // found affirmative usage
    idx = lower.indexOf(termLower, idx + 1);
  }
  return true; // all occurrences are negated
}

const fullPrompt = DENTAL_ANALYSIS_SYSTEM_PROMPT + buildDentalAnalysisPrompt("test");
const found = FORBIDDEN_TERMS.filter((term) => {
  const lower = fullPrompt.toLowerCase();
  if (!lower.includes(term.toLowerCase())) return false;
  return !isNegated(fullPrompt, term);
});

if (found.length > 0) {
  console.log("⚠️  FORBIDDEN TERMS FOUND IN AFFIRMATIVE CONTEXT:");
  found.forEach((t) => console.log(`  - "${t}"`));
} else {
  console.log("✅ No forbidden clinical terms found in affirmative context.");
}

console.log("\n=== Audit complete ===");
