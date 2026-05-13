# SECURITY_STABILIZATION_PLAN — Perfecto / capilar-mvp

> Generado el 2026-05-12. Basado en revisión real del código fuente y `docs/FLOW_MAP.md`.
> No implementa cambios — es un plan de acción priorizado.

---

## 1. Resumen ejecutivo

La plataforma tiene **10 hallazgos críticos o de alta severidad** que deben resolverse antes de cualquier apertura pública real. Los más urgentes son: código de debug que filtra datos personales a un servidor localhost, 3 endpoints que consumen OpenAI sin autenticación (gasto ilimitado de créditos por cualquier actor externo), fotos médicas de pacientes accesibles por URL pública sin autenticación, IDOR en el endpoint de análisis capilar, y ausencia de verificación HMAC en el webhook de pago Flow (simulación de pago posible).

Los hallazgos de compliance (Ley 19.628) son estructuralmente importantes: el quiz no registra consentimiento explícito para datos médicos y no existe ningún mecanismo de borrado.

La surface de ataque operativa más urgente es **el código de debug activo** (`quiz/page.tsx:1271`) — está corriendo en producción hoy y enviando datos de validación de formulario (incluyendo longitud de RUT, email, teléfono) a `http://127.0.0.1:7425/ingest/...`.

---

## 2. Confirmación técnica de cada hallazgo

### H1 — Debug code enviando PII a localhost

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/quiz/page.tsx:1268–1297` |
| **Ruta afectada** | Paso `PersonalStep` del quiz (`/quiz`) |
| **Evidencia** | `fetch("http://127.0.0.1:7425/ingest/a7c193fe-...", { method: "POST", body: JSON.stringify({ ... data: { isValid, h1_nationalOk, ... }, data.nationalId, ... }) })` dentro de `useEffect` |
| **Riesgo** | En producción esta llamada falla silenciosamente, pero el código está activo: si alguna vez se levanta un servidor local con ese puerto, recibe longitud de RUT, email y teléfono en texto claro. Además es indicio de que hay herramienta de debug (agent log) conectada al repo. |
| **Severidad** | 🔴 CRÍTICO |
| **Recomendación** | Eliminar el bloque completo `#region agent log` / `#endregion agent log` en `quiz/page.tsx`. |

---

### H2 — `/api/mapa-capilar/analyze` sin autenticación

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/mapa-capilar/analyze/route.ts:119` |
| **Ruta afectada** | `POST /api/mapa-capilar/analyze` |
| **Evidencia** | La función `POST(req: NextRequest)` inicia directamente sin ningún guard de autenticación. Acepta `photoFrontal` y `photoCrown` como data URLs, llama `uploadPhoto()` al bucket `patient-photos` y luego a OpenAI GPT-4o (`gpt-4o`) sin verificar quién hace la llamada. |
| **Riesgo** | Cualquier actor puede enviar fotos arbitrarias y disparar llamadas a OpenAI (costo ilimitado). Además sube archivos al bucket de Supabase sin validar tipo real (solo verifica `startsWith("data:image")`). |
| **Severidad** | 🔴 CRÍTICO |
| **Recomendación** | Agregar rate-limit por IP (ej. 3 análisis por hora) y/o un token de sesión firmado generado en el cliente antes de llamar a esta ruta. |

---

### H3 — `/api/ai/doctor-report` sin autenticación

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/ai/doctor-report/route.ts:120` |
| **Ruta afectada** | `POST /api/ai/doctor-report` |
| **Evidencia** | La función `POST` no verifica cookie de admin ni token de ningún tipo antes de aceptar `{ intake_id, force }`, consultar `intakes` y `photos` en Supabase, y disparar `gpt-4o` con datos médicos del paciente. |
| **Riesgo** | Cualquiera con un UUID de intake (que puede adivinar o enumerar) puede: (1) consumir créditos OpenAI, (2) acceder al contenido médico del intake a través del prompt enviado a OpenAI, (3) forzar regeneración de reportes con `force: true`. |
| **Severidad** | 🔴 CRÍTICO |
| **Recomendación** | Proteger con verificación de `admin_token` cookie o mover la llamada a una acción interna que solo invoque el admin portal o el sistema de webhooks. |

---

### H4 — `/api/hubspot/sync-lead` sin autenticación

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/hubspot/sync-lead/route.ts:4` |
| **Ruta afectada** | `POST /api/hubspot/sync-lead` |
| **Evidencia** | La función `POST` hace `const body = await req.json() as SyncLeadInput` y llama directamente a `syncHubSpotContact(body)` sin ningún guard. Solo valida que `body.email` exista. |
| **Riesgo** | Cualquier actor puede crear o sobrescribir contactos en el CRM de HubSpot con datos arbitrarios. Puede corromper el pipeline de ventas, crear contactos spam o usar el endpoint para exfiltrar el comportamiento del upsert. |
| **Severidad** | 🔴 CRÍTICO |
| **Recomendación** | Eliminar este endpoint público. Mover la sincronización HubSpot a llamadas server-side únicamente (desde Server Actions o desde el propio flujo del quiz submit), o proteger con un `INTERNAL_API_SECRET` header verificado server-side. |

---

### H5 — IDOR en `/api/mapa-capilar/get-analysis`

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/mapa-capilar/get-analysis/route.ts:5` |
| **Ruta afectada** | `GET /api/mapa-capilar/get-analysis?id=<uuid>` |
| **Evidencia** | La función `GET` toma el parámetro `id` de la URL y consulta `hair_map_analyses` directamente por ese ID sin ningún check de propiedad ni autenticación. Retorna `photo_frontal_url`, `photo_crown_url`, `analysis_json` y `status`. |
| **Riesgo** | Insecure Direct Object Reference (IDOR): cualquier UUID válido (descubierto por fuerza bruta, logs, o compartir un link) expone el análisis capilar con las fotos de otro usuario. |
| **Severidad** | 🔴 CRÍTICO |
| **Recomendación** | Dos opciones: (a) generar un token firmado (HMAC) cuando se crea el análisis y validarlo en el GET, o (b) solo retornar datos al cliente que originó la sesión (usar `sessionStorage` del ID + validar que coincida con un token generado server-side al crear el registro). |

---

### H6 — Webhook Flow (`/api/payments/flow/confirm`) sin HMAC

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/payments/flow/confirm/route.ts:13` |
| **Ruta afectada** | `POST /api/payments/flow/confirm` |
| **Evidencia** | El handler lee el `token` del body form-encoded o JSON. Busca la orden en Supabase con `provider_token = token`. Luego llama a la API de Flow para verificar el estado. No verifica ninguna firma del payload de Flow antes de procesar. |
| **Riesgo parcialmente mitigado** | La llamada a `getFlowPaymentStatus(token)` valida el estado real con la API de Flow, lo que reduce el riesgo de marcar una orden pagada con un token inventado. Sin embargo, un atacante que conozca un `token` válido (ej. de un pago previo cancelado) podría reintentar el callback y actualizar el estado de esa orden. Además, sin HMAC no hay certeza de que el payload proviene de Flow. |
| **Severidad** | 🟠 ALTO |
| **Recomendación** | Verificar la firma HMAC del webhook de Flow usando `FLOW_SECRET_KEY` antes de procesar cualquier payload. Flow firma con HMAC-SHA256 concatenando todos los parámetros. |

---

### H7 — Fotos de pacientes accesibles con URL pública (`getPublicUrl`)

| Campo | Detalle |
|---|---|
| **Archivos** | `src/app/api/mapa-capilar/analyze/route.ts:107`, `src/app/quiz/page.tsx:259`, `src/app/score-capilar/ScoreCapilarFunnel.tsx:87,97`, `src/app/evaluacion-piel/SkinAssessmentFunnel.tsx:748` |
| **Ruta afectada** | Bucket `patient-photos` en Supabase Storage |
| **Evidencia** | `supabase.storage.from("patient-photos").getPublicUrl(path).data.publicUrl` — 5 ocurrencias confirmadas. Esto implica que el bucket está configurado como público o las URLs públicas se comparten en los registros de la DB. |
| **Riesgo** | Fotos médicas de cuero cabelludo (frontales, coronilla, entradas) de pacientes son accesibles a cualquier persona con la URL, sin autenticación. Las URLs están almacenadas en `photos.url`, `hair_map_analyses.photo_frontal_url`, `hair_map_leads.photo_url`. |
| **Severidad** | 🟠 ALTO |
| **Recomendación** | (1) Hacer el bucket `patient-photos` privado en el dashboard de Supabase Storage. (2) Reemplazar `getPublicUrl` por `createSignedUrl(path, 3600)` en todos los lugares. (3) Las URLs firmadas deben generarse on-demand y nunca almacenarse en la DB. |

---

### H8 — Cookie admin contiene el secreto raw

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/admin/auth/route.ts:13` |
| **Ruta afectada** | `POST /api/admin/auth` y toda verificación admin posterior |
| **Evidencia** | `cookieStore.set("admin_token", secret, ...)` — el valor del cookie es exactamente `ADMIN_SECRET`. Las rutas que verifican hacen `token !== process.env.ADMIN_SECRET`, es decir, una comparación directa de strings. |
| **Riesgo** | (1) Si el cookie es interceptado (aunque sea `httpOnly`), el atacante tiene el secreto completo. (2) La comparación directa de strings es vulnerable a timing attacks (aunque el riesgo práctico es bajo en Next.js dado el overhead de la plataforma). (3) El secreto está efectivamente "en el wire" del browser en cada request admin. |
| **Severidad** | 🟠 ALTO |
| **Recomendación** | En el login, generar un token firmado con `crypto.createHmac('sha256', ADMIN_SECRET).update(timestamp + nonce).digest('hex')`, guardar ese token en la cookie (no el secreto), y validar el HMAC en cada request admin. O usar `iron-session` / `next-auth` para sesiones admin. |

---

### H9 — Webhook Calendly sin verificación de firma

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/webhooks/calendly/route.ts:4` |
| **Ruta afectada** | `POST /api/webhooks/calendly` |
| **Evidencia** | Comentario explícito en el código: `// TODO Phase 2 — Signature verification`. El handler procesa el payload directamente sin verificar el header `Calendly-Webhook-Signature`. |
| **Riesgo** | Cualquiera puede enviar un POST falso a este endpoint y marcar una consulta como agendada o cancelada en Supabase, alterando el estado de `medical_reviews` de cualquier paciente. |
| **Severidad** | 🟠 ALTO |
| **Recomendación** | Implementar verificación HMAC-SHA256 del header `Calendly-Webhook-Signature` con `CALENDLY_WEBHOOK_SIGNING_KEY` antes de procesar. Referencia: https://developer.calendly.com/api-docs/ZG9jOjM2MzI3MDM4-webhook-signatures |

---

### H10 — WhatsApp webhook POST sin HMAC Meta

| Campo | Detalle |
|---|---|
| **Archivo** | `src/app/api/whatsapp/webhook/route.ts:56` |
| **Ruta afectada** | `POST /api/whatsapp/webhook` |
| **Evidencia** | El handler POST parsea directamente el JSON sin verificar el header `X-Hub-Signature-256` de Meta. La única guardia operativa es el allowlist de teléfonos (`SKIN_COPILOT_ALLOWED_TEST_PHONES`), que protege solo el envío de respuestas, no el procesamiento del payload. |
| **Riesgo** | Un actor puede enviar mensajes falsos al webhook haciéndose pasar por Meta, gatillar el pipeline del Skin Copilot AI y consumir créditos de OpenAI y WhatsApp. |
| **Severidad** | 🟡 MEDIO (mitigado parcialmente por allowlist) |
| **Recomendación** | Verificar `X-Hub-Signature-256` con HMAC-SHA256 usando `WHATSAPP_APP_SECRET` antes de procesar el payload. Requiere leer el body como raw string antes del `JSON.parse`. |

---

### H11 — Ausencia de consentimiento explícito en el quiz

| Campo | Detalle |
|---|---|
| **Archivos** | `src/app/quiz/page.tsx` (ninguna referencia a `consented`), `src/app/checkout/page.tsx:49` (sí tiene checkbox, pero es post-pago) |
| **Ruta afectada** | `/quiz` — paso de datos personales + datos médicos |
| **Evidencia** | No existe ningún estado `consented` ni checkbox de consentimiento en `quiz/page.tsx`. El consentimiento de `checkout/page.tsx` aplica solo a la transacción de pago, no a la recolección de datos médicos. Los datos médicos (minoxidil, finasteride, condiciones, embarazo, etc.) se recopilan en el quiz antes de que el usuario llegue al checkout. |
| **Riesgo** | Incumplimiento de Ley 19.628 Art. 12 (tratamiento de datos sensibles requiere consentimiento explícito previo). |
| **Severidad** | 🔴 CRÍTICO (compliance) |
| **Recomendación** | Agregar checkbox de consentimiento en el paso `PersonalStep` del quiz (antes de enviar datos a Supabase), con texto que mencione: propósito del tratamiento, que incluye datos médicos, quién los trata, y link a política de privacidad. Agregar campo `consented_at` en tabla `patients`. |

---

### H12 — Sin mecanismo de borrado (derecho de olvido)

| Campo | Detalle |
|---|---|
| **Archivos** | No existe ningún endpoint ni UI de borrado de datos de paciente |
| **Ruta afectada** | N/A — ausencia de funcionalidad |
| **Evidencia** | Búsqueda en codebase no encontró ningún endpoint `DELETE /api/*/patient` ni `delete.*patient_id` en API routes. |
| **Riesgo** | Incumplimiento de Ley 19.628 Art. 12: el titular tiene derecho a solicitar supresión de sus datos personales. |
| **Severidad** | 🔴 CRÍTICO (compliance) |
| **Recomendación** | Implementar endpoint `DELETE /api/admin/patients/[id]` que elimine en cascada: `patients`, `intakes`, `photos` (+ archivos en storage), `ai_doctor_reports`, `orders` (anonimizar, no borrar), `hair_map_leads`, `hair_map_analyses`. |

---

### H13 — Endpoints temporales expuestos en producción

| Campo | Detalle |
|---|---|
| **Archivos** | `src/app/api/whatsapp/send-test/route.ts`, `src/app/api/whatsapp/debug-waba/route.ts` |
| **Rutas afectadas** | `POST /api/whatsapp/send-test`, `GET /api/whatsapp/debug-waba` |
| **Evidencia** | Ambas rutas están marcadas como temporales en el FLOW_MAP. `debug-waba` expone información interna de la cuenta WABA sin autenticación. `send-test` puede enviar mensajes WhatsApp reales si `SKIN_COPILOT_ALLOWED_TEST_PHONES` es vacío (guard omitido). |
| **Severidad** | 🔴 CRÍTICO |
| **Recomendación** | Eliminar ambos archivos antes del primer deploy público. |

---

### H14 — Dos funnels capilares paralelos activos (`/score-capilar` legacy)

| Campo | Detalle |
|---|---|
| **Archivos** | `src/app/score-capilar/ScoreCapilarFunnel.tsx:62` |
| **Rutas afectadas** | `/score-capilar` y su tabla `score_capilar_leads` |
| **Evidencia** | El código tiene un `// TODO: Run the SQL migration to create score_capilar_leads before going live.` — la tabla puede no existir en producción. El funnel intenta subir fotos al bucket público y guardar datos, pero puede fallar silenciosamente. Además usa el anon key de Supabase directamente en el cliente para operaciones de storage. |
| **Riesgo** | Confusión operativa (dos funnels compitiendo), datos perdidos en la tabla inexistente, y superficie de ataque extra sin mantenimiento activo. |
| **Severidad** | 🟠 ALTO |
| **Recomendación** | Decidir si se depreca `/score-capilar` o se migra al flujo de `/mapa-capilar`. Si se depreca: (1) redirigir `/score-capilar` a `/mapa-capilar`, (2) no crear la tabla `score_capilar_leads`. |

---

### H15 — Falta de tracking de conversión

| Campo | Detalle |
|---|---|
| **Evidencia** | No hay ningún import de PostHog, GA4, Segment, ni pixel de Meta en el codebase. El único "tracking" es `console.log`. |
| **Riesgo** | Sin datos de funnel, no se puede medir CAC, tasa de conversión por ruta, ni tomar decisiones de producto. |
| **Severidad** | 🟡 MEDIO (operativo) |
| **Recomendación** | Integrar PostHog (self-hosted o cloud) con eventos en los pasos clave: `quiz_started`, `route_selected`, `photos_uploaded`, `personal_data_submitted`, `checkout_reached`, `payment_started`, `payment_confirmed`. |

---

### H16 — Flujo post-pago manual

| Campo | Detalle |
|---|---|
| **Evidencia** | Según FLOW_MAP: asignación de médico, envío de receta, coordinación con farmacia, despacho y follow-up son 100% manuales. No hay notificación al admin ni al médico cuando llega un pago. |
| **Riesgo** | SLA roto: paciente paga y no recibe respuesta automática. Ops overhead alto desde el primer paciente pagado. |
| **Severidad** | 🟡 MEDIO (operativo) |
| **Recomendación** | Implementar: (1) notificación por email al admin cuando `orders.status` cambia a `paid_pending_medical_review`, (2) actualizar automáticamente `intakes.status` al mismo evento. |

---

## 3. Plan P0 — Eliminar vulnerabilidades críticas

> Objetivo: hacer el sistema seguro para el primer usuario real. Sin estas correcciones, no abrir al público.

### P0.1 — Eliminar debug code localhost

**Archivos a tocar:** `src/app/quiz/page.tsx`

**Cambio:** Eliminar el bloque completo entre `// #region agent log` y `// #endregion agent log` (aproximadamente líneas 1268–1300).

```diff
- // #region agent log
- useEffect(() => {
-   const nationalLen = normalizeNationalIdForDb(data.nationalId).length;
-   fetch("http://127.0.0.1:7425/ingest/a7c193fe-1872-4f8e-9286-96a420b16cab", {
-     ...
-   });
- }, [...]);
- // #endregion agent log
```

**Riesgo de romper algo:** Ninguno — es código de debug que nunca debió llegar a producción.

**Cómo testear:** `grep -r "127.0.0.1" src/` debe retornar sin resultados.

**Comando de verificación:**
```bash
grep -r "127\.0\.0\.1\|7425" src/
```

**Variables de entorno nuevas:** Ninguna.

---

### P0.2 — Eliminar endpoints temporales de WhatsApp

**Archivos a tocar:**
- Eliminar `src/app/api/whatsapp/send-test/route.ts`
- Eliminar `src/app/api/whatsapp/debug-waba/route.ts`

**Riesgo de romper algo:** Bajo. Verificar que ninguna página o componente importa o referencia estas rutas.

**Cómo testear:**
```bash
grep -r "send-test\|debug-waba" src/
# Debe retornar vacío
```

**Comando de verificación:**
```bash
curl -s -o /dev/null -w "%{http_code}" https://tu-dominio.vercel.app/api/whatsapp/send-test
# Debe retornar 404
```

**Variables de entorno nuevas:** Ninguna.

---

### P0.3 — Proteger `/api/mapa-capilar/analyze` contra abuso

**Archivo a tocar:** `src/app/api/mapa-capilar/analyze/route.ts`

**Cambio:** Agregar rate-limiting por IP usando un header de verificación simple. Dos estrategias:

**Opción A (recomendada para MVP):** Verificar un header `X-Analyze-Token` generado en el cliente con un secreto compartido de corta duración (signed timestamp), o usar Vercel Edge middleware para rate-limit.

**Opción B (más simple):** Agregar límite de body size (rechazar payloads > 10MB) y verificar que las fotos sean data URLs válidas antes de llamar a OpenAI.

```typescript
// Al inicio del POST handler:
const contentLength = parseInt(req.headers.get("content-length") ?? "0");
if (contentLength > 10 * 1024 * 1024) {
  return NextResponse.json({ error: "Payload too large" }, { status: 413 });
}
```

**Riesgo de romper algo:** Bajo si se elige opción B. Verificar con el flujo de mapa capilar completo.

**Cómo testear:** Enviar un POST con body > 10MB debe retornar 413. El flujo normal sigue funcionando.

**Variables de entorno nuevas:** Ninguna para opción B. Opción A requeriría `ANALYZE_TOKEN_SECRET`.

---

### P0.4 — Proteger `/api/ai/doctor-report` con autenticación admin

**Archivo a tocar:** `src/app/api/ai/doctor-report/route.ts`

**Cambio:** Agregar verificación de cookie admin al inicio del handler POST:

```typescript
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // ... resto del handler
}
```

**Riesgo de romper algo:** El quiz llama a este endpoint con fire-and-forget desde `quiz/page.tsx:276`. Si el quiz corre en el contexto del paciente (no admin), esta llamada fallará. Revisar si el fire-and-forget debe moverse a una Server Action o a una llamada desde el webhook de Flow al confirmarse el pago.

**Cómo testear:** Llamar al endpoint sin cookie debe retornar 401. El admin portal debe seguir pudiendo regenerar reportes.

**Comando de verificación:**
```bash
curl -X POST https://tu-dominio.vercel.app/api/ai/doctor-report \
  -H "Content-Type: application/json" \
  -d '{"intake_id": "test"}' \
  # Debe retornar 401
```

**Variables de entorno nuevas:** Ninguna (usa `ADMIN_SECRET` existente).

---

### P0.5 — Proteger `/api/hubspot/sync-lead`

**Archivo a tocar:** `src/app/api/hubspot/sync-lead/route.ts`

**Cambio preferido:** Eliminar el endpoint público y mover la llamada a `syncHubSpotContact` dentro del flujo del quiz submit (Server Action) o desde el webhook de Flow al confirmar el pago.

**Si se mantiene el endpoint:** Agregar verificación de header interno:

```typescript
const internalSecret = req.headers.get("x-internal-secret");
if (internalSecret !== process.env.INTERNAL_API_SECRET) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

**Riesgo de romper algo:** Verificar qué llama a `/api/hubspot/sync-lead`. Buscar con:
```bash
grep -r "hubspot/sync-lead" src/
```

**Variables de entorno nuevas:** `INTERNAL_API_SECRET` (si se elige la opción del header).

---

### P0.6 — Corregir IDOR en `/api/mapa-capilar/get-analysis`

**Archivo a tocar:** `src/app/api/mapa-capilar/get-analysis/route.ts`

**Cambio:** Al crear el análisis en `/api/mapa-capilar/analyze`, generar un token de acceso firmado con HMAC:

```typescript
import { createHmac } from "crypto";

function generateAccessToken(id: string): string {
  return createHmac("sha256", process.env.ANALYSIS_ACCESS_SECRET!)
    .update(id)
    .digest("hex");
}
```

Retornar `{ id, accessToken, report, isFallback }` en el analyze. En el GET, verificar que el `accessToken` del query param coincida con el HMAC del `id`.

**Riesgo de romper algo:** El reporte `/mapa-capilar/reporte/[id]` usa este endpoint. Habrá que actualizar la página del reporte para pasar el `accessToken` (guardado en `sessionStorage`).

**Variables de entorno nuevas:** `ANALYSIS_ACCESS_SECRET`.

---

## 4. Plan P1 — Seguridad alta prioridad

> Objetivo: completar antes de escalar a más usuarios o conectar facturación real.

### P1.1 — Hacer el bucket `patient-photos` privado + signed URLs

**Archivos a tocar:**
- Supabase Dashboard: cambiar bucket `patient-photos` a privado
- `src/app/api/mapa-capilar/analyze/route.ts:107`
- `src/app/quiz/page.tsx:259`
- `src/app/score-capilar/ScoreCapilarFunnel.tsx:87,97`
- `src/app/evaluacion-piel/SkinAssessmentFunnel.tsx:748`
- Cualquier API route que lea URLs de fotos para pasarlas a OpenAI

**Cambio patrón:**
```typescript
// Antes:
const { data: { publicUrl } } = supabase.storage.from("patient-photos").getPublicUrl(path);

// Después:
const { data: signedUrlData } = await supabase.storage
  .from("patient-photos")
  .createSignedUrl(path, 3600); // 1 hora de validez
const url = signedUrlData?.signedUrl ?? null;
```

**Riesgo de romper algo:** Alto — todas las URLs almacenadas en la DB quedarán inaccesibles. Implica:
1. No almacenar URLs en la DB, generarlas on-demand
2. O migrar a signed URLs en todos los puntos de lectura

**Cómo testear:** Intentar acceder a una URL antigua directamente — debe retornar 403.

**Variables de entorno nuevas:** Ninguna.

---

### P1.2 — Implementar HMAC en webhook Calendly

**Archivo a tocar:** `src/app/api/webhooks/calendly/route.ts`

**Cambio:**
```typescript
import { createHmac, timingSafeEqual } from "crypto";

function verifyCalendlySignature(rawBody: string, signature: string): boolean {
  const expected = createHmac("sha256", process.env.CALENDLY_WEBHOOK_SIGNING_KEY!)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("calendly-webhook-signature") ?? "";
  if (!verifyCalendlySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const payload = JSON.parse(rawBody);
  // ... resto del handler
}
```

**Variables de entorno nuevas:** `CALENDLY_WEBHOOK_SIGNING_KEY`.

---

### P1.3 — Implementar HMAC en webhook WhatsApp (Meta)

**Archivo a tocar:** `src/app/api/whatsapp/webhook/route.ts`

**Cambio:**
```typescript
import { createHmac, timingSafeEqual } from "crypto";

function verifyMetaSignature(rawBody: string, signature: string): boolean {
  if (!process.env.WHATSAPP_APP_SECRET) return false;
  const expected = "sha256=" + createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
    .update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ ok: true }); // Retornar 200 para no alarmar a Meta
  }
  const payload = JSON.parse(rawBody);
  // ... resto del handler
}
```

**Variables de entorno nuevas:** `WHATSAPP_APP_SECRET` (el app secret de Meta, distinto del verify token).

---

### P1.4 — Consentimiento explícito en quiz (Ley 19.628)

**Archivos a tocar:**
- `src/app/quiz/page.tsx` — agregar estado `consented` y checkbox en `PersonalStep`
- Schema de Supabase: `ALTER TABLE patients ADD COLUMN consented_at TIMESTAMPTZ;`

**Cambio en quiz:**
```tsx
// En PersonalStep:
const [consented, setConsented] = useState(false);

// Antes del botón "Continuar":
<div className="flex items-start gap-2 mt-4">
  <input type="checkbox" checked={consented} onChange={e => setConsented(e.target.checked)} />
  <label className="text-sm text-muted-foreground">
    Acepto el tratamiento de mis datos personales y médicos de acuerdo a la{" "}
    <a href="/politica-privacidad" target="_blank">Política de Privacidad</a>.
    Entiendo que esta evaluación no es un diagnóstico médico.
  </label>
</div>
```

**Cambio al guardar paciente:**
```typescript
const patientPayload = {
  ...basePatientInsert,
  rut: nid || null,
  consented_at: consented ? new Date().toISOString() : null,
};
```

**Riesgo de romper algo:** Bajo. El botón de continuar debe quedar disabled hasta que `consented === true`.

**Variables de entorno nuevas:** Ninguna.

---

### P1.5 — Mecanismo de borrado de datos (derecho de olvido)

**Archivos a tocar:** Crear `src/app/api/admin/patients/[id]/route.ts` con método DELETE.

**Lógica de borrado:**
1. Verificar cookie admin
2. Obtener paciente y sus intakes
3. Listar y eliminar archivos del storage (`patient-photos/...`)
4. Eliminar en cascada: `photos`, `ai_doctor_reports`, `hair_map_leads`, `hair_map_analyses`, `intakes`
5. Anonimizar `orders` (preservar monto y estado para contabilidad, borrar `patient_id` vinculación)
6. Eliminar `patients` row

**Riesgo de romper algo:** Confirmar que no hay foreign keys sin `ON DELETE CASCADE` en el schema de Supabase que bloqueen el borrado.

**Variables de entorno nuevas:** Ninguna.

---

### P1.6 — Deprecar `/score-capilar` (funnel legacy)

**Archivos a tocar:**
- `src/app/score-capilar/page.tsx` — redirigir a `/mapa-capilar`
- No crear tabla `score_capilar_leads` en Supabase

**Cambio:**
```typescript
// src/app/score-capilar/page.tsx
import { redirect } from "next/navigation";
export default function ScoreCapilarPage() {
  redirect("/mapa-capilar");
}
```

**Riesgo de romper algo:** Verificar que no hay links externos (Meta Ads, WhatsApp, emails) apuntando a `/score-capilar`.

---

## 5. Plan P2 — Mejoras operativas

> Objetivo: escalar operaciones y habilitar medición.

### P2.1 — Tracking de conversión

**Opción recomendada:** PostHog (fácil de instalar, self-hosteable, gratis hasta 1M eventos/mes).

**Archivos a tocar:**
- `src/app/layout.tsx` — inicializar PostHog
- `src/app/quiz/page.tsx` — eventos: `quiz_started`, `route_selected`, `photos_uploaded`, `quiz_completed`
- `src/app/mapa-capilar/page.tsx` — evento: `mapa_capilar_started`
- `src/app/checkout/page.tsx` — evento: `checkout_reached`, `payment_started`
- `src/app/api/payments/flow/confirm/route.ts` — evento server-side: `payment_confirmed`

**Variables de entorno nuevas:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.

---

### P2.2 — Automatización post-pago

**Archivos a tocar:** `src/app/api/payments/flow/confirm/route.ts`

**Cambio:** Cuando `newStatus === "paid_pending_medical_review"`:
1. Actualizar `intakes.status` a `paid` (hoy no se actualiza automáticamente)
2. Enviar email al admin (vía Resend o similar) con datos del nuevo paciente pagado
3. Crear registro en `medical_reviews` con `status: "pending_assignment"` si no existe

**Variables de entorno nuevas:** `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`.

---

### P2.3 — Deprecar rutas API legacy

**Archivos a tocar (solo eliminar si no tienen callers activos):**
- `src/app/api/mapa-capilar/generate/route.ts` (legacy, reemplazado por `/analyze`)
- `src/app/api/ai/hair-map/route.ts` (legacy, sin callers conocidos)

**Verificar primero:**
```bash
grep -r "mapa-capilar/generate\|ai/hair-map" src/
# Si retorna vacío, seguro eliminar
```

---

## 6. Orden sugerido de implementación (commits pequeños)

```
commit 1: P0.1 — Eliminar debug fetch localhost (quiz/page.tsx)
commit 2: P0.2 — Eliminar endpoints temporales WhatsApp (send-test, debug-waba)
commit 3: P0.5 — Proteger /api/hubspot/sync-lead (mover a server-side o agregar header)
commit 4: P0.4 — Proteger /api/ai/doctor-report con admin auth
          ↳ Subcommit: mover fire-and-forget del quiz a Server Action o webhook Flow
commit 5: P0.6 — Corregir IDOR en /api/mapa-capilar/get-analysis (signed access token)
commit 6: P0.3 — Proteger /api/mapa-capilar/analyze (body size limit + tipo MIME)
commit 7: P1.4 — Consentimiento explícito en PersonalStep del quiz
          ↳ Incluye: migración SQL para consented_at en patients
commit 8: P1.6 — Deprecar /score-capilar (redirect a /mapa-capilar)
commit 9: H8   — Refactorizar cookie admin (HMAC token en lugar de raw secret)
commit 10: P1.2 — HMAC webhook Calendly
commit 11: P1.3 — HMAC webhook WhatsApp (Meta)
commit 12: H6  — HMAC webhook Flow confirm
commit 13: P1.1 — Bucket patient-photos privado + signed URLs
           ↳ Este commit es el de mayor riesgo; requiere prueba completa del flujo de fotos
commit 14: P1.5 — Endpoint de borrado de paciente (derecho de olvido)
commit 15: P2.1 — Integrar PostHog (tracking de conversión)
commit 16: P2.2 — Automatización post-pago (notificación admin + actualizar intakes.status)
commit 17: P2.3 — Eliminar rutas API legacy (generate, hair-map)
```

---

## 7. Variables de entorno nuevas requeridas

| Variable | Propósito | Plan |
|---|---|---|
| `ANALYSIS_ACCESS_SECRET` | Firmar tokens de acceso a análisis capilares | P0.6 |
| `INTERNAL_API_SECRET` | Proteger endpoints internos server-to-server | P0.5 |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Verificar firma webhook Calendly | P1.2 |
| `WHATSAPP_APP_SECRET` | Verificar firma HMAC de Meta | P1.3 |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog tracking | P2.1 |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (puede ser `https://app.posthog.com`) | P2.1 |
| `RESEND_API_KEY` | Email transaccional (notificación admin post-pago) | P2.2 |
| `ADMIN_NOTIFICATION_EMAIL` | Email del admin para alertas | P2.2 |

> **Regla**: ninguna de estas variables debe tener prefijo `NEXT_PUBLIC_` excepto las de PostHog (que son intencionalmente públicas por diseño del SDK).

---

## 8. Tabla resumen de severidades

| # | Hallazgo | Severidad | Plan |
|---|---|---|---|
| H1 | Debug code localhost fetch en quiz | 🔴 CRÍTICO | P0.1 |
| H2 | /api/mapa-capilar/analyze sin auth | 🔴 CRÍTICO | P0.3 |
| H3 | /api/ai/doctor-report sin auth | 🔴 CRÍTICO | P0.4 |
| H4 | /api/hubspot/sync-lead sin auth | 🔴 CRÍTICO | P0.5 |
| H5 | IDOR en /api/mapa-capilar/get-analysis | 🔴 CRÍTICO | P0.6 |
| H11 | Sin consentimiento explícito en quiz | 🔴 CRÍTICO (compliance) | P1.4 |
| H12 | Sin mecanismo de borrado | 🔴 CRÍTICO (compliance) | P1.5 |
| H13 | Endpoints temporales WA expuestos | 🔴 CRÍTICO | P0.2 |
| H6 | Flow webhook sin HMAC | 🟠 ALTO | commit 12 |
| H7 | Fotos pacientes accesibles públicamente | 🟠 ALTO | P1.1 |
| H8 | Cookie admin con secreto raw | 🟠 ALTO | commit 9 |
| H9 | Calendly webhook sin HMAC | 🟠 ALTO | P1.2 |
| H14 | Dos funnels paralelos (/score-capilar legacy) | 🟠 ALTO | P1.6 |
| H10 | WhatsApp webhook POST sin HMAC | 🟡 MEDIO | P1.3 |
| H15 | Sin tracking de conversión | 🟡 MEDIO (operativo) | P2.1 |
| H16 | Flujo post-pago manual | 🟡 MEDIO (operativo) | P2.2 |

---

## 9. Reglas de compliance que aplican a todo el codebase

1. **Nunca** exponer `SUPABASE_SERVICE_ROLE_KEY` en componentes de cliente (verificar con `grep -r "SERVICE_ROLE" .next/` post-build).
2. **Nunca** usar `NEXT_PUBLIC_` en variables que no sean intencionalmente públicas.
3. **Nunca** hacer `console.log` con email, teléfono, RUT o datos clínicos del paciente.
4. **Siempre** que la IA genere texto sobre el estado capilar del paciente: usar lenguaje orientativo, nunca diagnóstico ni prescripción. Incluir disclaimer. (Ver nilo-guardrails Rule 3.)
5. **No romper** ninguna ruta existente sin auditar todas sus referencias primero. (Ver nilo-guardrails Rule 1.)
6. **Ejecutar** `npm run build` antes de marcar cualquier conjunto de cambios como completo. (Ver nilo-guardrails Rule 4.)
