import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://perfectolabs.cl";
const PHOTO = join(__dirname, "public", "hombre1.jpg");
const OUT = join(__dirname, "test-screenshots");
mkdirSync(OUT, { recursive: true });

let step = 0;
async function shot(page, label) {
  const file = join(OUT, `${String(++step).padStart(2, "0")}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${label}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  console.log("\n🚀 Iniciando test del quiz en producción...\n");

  // ── 1. Landing ──────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/quiz`);
  await page.waitForLoadState("networkidle");
  await shot(page, "intro");

  // ── 2. Intro → Route ────────────────────────────────────────────
  await page.getByRole("button", { name: "Continuar" }).first().click();
  await page.waitForTimeout(400);
  await shot(page, "route-selection");

  // ── 3. Seleccionar "Frenar la caída" ────────────────────────────
  await page.getByText("Frenar la caída").click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);
  await shot(page, "hair-pattern");

  // ── 4. Hair pattern — click primer recuadro del grid ────────────
  // The 9 clickable zones are aria-labeled buttons
  await page.getByRole("button", { name: "Entradas leves" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);
  await shot(page, "hair-loss");

  // ── 5. Hair loss ─────────────────────────────────────────────────
  await page.getByText("Menos de 6 meses").click();
  await page.getByRole("button", { name: "Gradual" }).click();
  // Severe irritation → No
  await page.getByRole("button", { name: "No" }).last().click();
  await page.waitForTimeout(300);
  await shot(page, "hair-loss-filled");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 6. History ───────────────────────────────────────────────────
  await shot(page, "history");
  // Family history → No
  await page.getByRole("button", { name: "No" }).first().click();
  // Previous treatments → Ninguno
  await page.getByText("Ninguno").click();
  await page.waitForTimeout(300);
  await shot(page, "history-filled");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 7. Transition screen ─────────────────────────────────────────
  await shot(page, "transition");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 8. Medical conditions ────────────────────────────────────────
  await shot(page, "medical-conditions");
  await page.getByText("Ninguna de las anteriores").click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.waitForTimeout(400);

  // ── 9. Current medications ───────────────────────────────────────
  await shot(page, "medications");
  await page.getByRole("button", { name: "No" }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.waitForTimeout(400);

  // ── 10. Medical (open to clinical eval) ──────────────────────────
  await shot(page, "medical-screening");
  await page.getByRole("button", { name: "Sí" }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 11. Photos ───────────────────────────────────────────────────
  await shot(page, "photos");
  // Upload frontal (required)
  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(PHOTO); // frontal
  await page.waitForTimeout(300);
  await fileInputs.nth(1).setInputFiles(PHOTO); // crown
  await page.waitForTimeout(300);
  await shot(page, "photos-uploaded");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 12. Personal data ────────────────────────────────────────────
  await shot(page, "personal");
  await page.fill('input[placeholder="Juan"]', "Test");
  await page.fill('input[placeholder="García"]', "Prueba");
  await page.fill('input[placeholder="12.345.678-9"]', "12345678-9");
  await page.fill('input[placeholder="juan@email.com"]', "test+ci@perfectolabs.cl");
  await page.fill('input[placeholder="1234 5678"]', "12345678");
  await page.fill('input[type="number"]', "32");
  await page.getByRole("button", { name: "Hombre" }).click();
  await page.waitForTimeout(300);
  // Consent checkbox
  await page.locator('input#consent').check();
  await page.waitForTimeout(300);
  await shot(page, "personal-filled");

  // ── 13. Submit ───────────────────────────────────────────────────
  await page.getByRole("button", { name: "Enviar evaluación" }).click();
  await shot(page, "submitting");

  // ── 14. Wait for /results ────────────────────────────────────────
  console.log("\n  ⏳ Esperando redirect a /results...");
  await page.waitForURL(/\/results/, { timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot(page, "results-loading");

  console.log("\n  ⏳ Esperando que el reporte AI cargue (hasta 60s)...");
  // Wait for the report to appear (loading screen disappears)
  try {
    await page.waitForSelector("text=Tu Mapa Capilar", { timeout: 65000 });
    await page.waitForLoadState("networkidle");
    // Wait for all proxy images to finish loading
    await page.waitForFunction(
      () => [...document.querySelectorAll("img")].every((img) => img.complete && img.naturalHeight > 0),
      { timeout: 20000 }
    );
    await shot(page, "results-report");
    // Scroll down to see CTA
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot(page, "results-cta");
    console.log("\n✅ Quiz completo. Reporte generado con éxito.");
  } catch {
    await shot(page, "results-timeout");
    console.log("\n⚠️  Reporte no apareció en 65s (puede ser timeout de AI).");
  }

  await browser.close();
  console.log(`\n📁 Screenshots en: ${OUT}\n`);
})();
