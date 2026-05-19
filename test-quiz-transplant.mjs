import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://perfectolabs.cl";
const PHOTO = join(__dirname, "public", "hombre1.jpg");
const OUT = join(__dirname, "test-screenshots-transplant");
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

  console.log("\n🚀 Iniciando test del quiz (ruta TRASPLANTE) en producción...\n");

  // ── 1. Landing ──────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/quiz`);
  await page.waitForLoadState("networkidle");
  await shot(page, "intro");

  // ── 2. Intro → Route ────────────────────────────────────────────
  await page.getByRole("button", { name: "Continuar" }).first().click();
  await page.waitForTimeout(400);
  await shot(page, "route-selection");

  // ── 3. Seleccionar "Evaluar trasplante" ─────────────────────────
  await page.getByText("Evaluar trasplante").click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);
  await shot(page, "hair-pattern");

  // ── 4. Hair pattern — calvicie avanzada ─────────────────────────
  await page.getByRole("button", { name: "Calvicie avanzada" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);
  await shot(page, "hair-loss");

  // ── 5. Hair loss ─────────────────────────────────────────────────
  await page.getByText("+1 año").click();
  await page.getByRole("button", { name: "Gradual" }).click();
  await page.getByRole("button", { name: "No" }).last().click(); // severe irritation → No
  await page.waitForTimeout(300);
  await shot(page, "hair-loss-filled");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 6. History ───────────────────────────────────────────────────
  await shot(page, "history");
  await page.getByRole("button", { name: "Sí" }).first().click(); // family history → Sí
  await page.getByText("Minoxidil").click();
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

  // ── 10. Transplant step ───────────────────────────────────────────
  // Navigate p label → xpath parent div → button (exact) to isolate each YesNoField
  await shot(page, "transplant-step");
  // previousTransplant → No
  await page.locator("p", { hasText: "¿Ya te hiciste un trasplante capilar antes?" })
    .locator("xpath=..").getByRole("button", { name: "No", exact: true }).click();
  await page.waitForTimeout(200);
  // timing → Lo antes posible
  await page.locator("button").filter({ hasText: /^Lo antes posible$/ }).click();
  await page.waitForTimeout(200);
  // budget → starts with "$1.5M" (only "$1.5M – $3M" matches, not "Menos de $1.5M")
  await page.getByRole("button").filter({ hasText: /^\$1\.5M/ }).click();
  await page.waitForTimeout(200);
  // financingInterest → Sí
  await page.locator("p", { hasText: "¿Tienes interés en financiamiento?" })
    .locator("xpath=..").getByRole("button", { name: "Sí", exact: true }).click();
  await page.waitForTimeout(200);
  // prpInterest → No (scroll into view first)
  const prpNoBtn = page.locator("p", { hasText: "¿Has usado tratamiento médico para estabilizar la caída?" })
    .locator("xpath=..").getByRole("button", { name: "No", exact: true });
  await prpNoBtn.scrollIntoViewIfNeeded();
  await prpNoBtn.click();
  await page.waitForTimeout(300);
  await shot(page, "transplant-filled");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);

  // ── 11. Photos ───────────────────────────────────────────────────
  await shot(page, "photos");
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
  await page.fill('input[placeholder="Juan"]', "Carlos");
  await page.fill('input[placeholder="García"]', "Trasplante");
  await page.fill('input[placeholder="12.345.678-9"]', "98765432-1");
  await page.fill('input[placeholder="juan@email.com"]', "test+transplante@perfectolabs.cl");
  await page.fill('input[placeholder="1234 5678"]', "87654321");
  await page.fill('input[type="number"]', "45");
  await page.getByRole("button", { name: "Hombre" }).click();
  await page.waitForTimeout(300);
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

  console.log("\n  ⏳ Esperando que el reporte AI cargue (hasta 65s)...");
  try {
    await page.waitForSelector("text=Tu Mapa Capilar", { timeout: 65000 });
    await page.waitForTimeout(1000);
    await shot(page, "results-report");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot(page, "results-cta");
    console.log("\n✅ Quiz trasplante completo. Reporte generado con éxito.");
  } catch {
    await shot(page, "results-timeout");
    console.log("\n⚠️  Reporte no apareció en 65s (puede ser timeout de AI).");
  }

  await browser.close();
  console.log(`\n📁 Screenshots en: ${OUT}\n`);
})();
