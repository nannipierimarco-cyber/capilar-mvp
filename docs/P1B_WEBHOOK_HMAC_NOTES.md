# P1-B — Verificación HMAC en Webhooks

> Ejecutado el 2026-05-13. Cubre H9 (Calendly), H10 (WhatsApp/Meta) y H6 (Flow confirm)
> del plan `SECURITY_STABILIZATION_PLAN.md`.

---

## Resumen

Los tres webhooks procesaban payloads de terceros sin verificar la firma del emisor.
Ahora todos verifican HMAC-SHA256 antes de ejecutar cualquier lógica de negocio.

---

## Cambios implementados

### `src/app/api/webhooks/calendly/route.ts` (H9 / P1.2)

**Mecánica de firma Calendly:**
- Header: `Calendly-Webhook-Signature: t=<timestamp>,v1=<hex_signature>`
- Contenido firmado: `<timestamp>.<rawBody>` (el timestamp como prefijo al body)
- Algoritmo: HMAC-SHA256 con `CALENDLY_WEBHOOK_SIGNING_KEY`
- Comparación: `timingSafeEqual` para prevenir timing attacks

**Comportamiento:**
- Si `CALENDLY_WEBHOOK_SIGNING_KEY` no está configurado: permite el paso con `console.warn` (degraded mode)
- Si la firma es inválida o el header está ausente: devuelve **401**
- Body se lee como texto crudo (`req.text()`) antes de verificar, luego se parsea como JSON

---

### `src/app/api/whatsapp/webhook/route.ts` (H10 / P1.3)

**Mecánica de firma Meta:**
- Header: `X-Hub-Signature-256: sha256=<hex_signature>`
- Contenido firmado: raw body (bytes exactos)
- Algoritmo: HMAC-SHA256 con `WHATSAPP_APP_SECRET`
- Comparación: `timingSafeEqual`

**Comportamiento:**
- Si `WHATSAPP_APP_SECRET` no está configurado: permite el paso con `console.warn` (degraded mode)
- Si la firma es inválida o el header falta: devuelve **200 sin procesar** (Meta requiere 200 siempre; un 4xx causaría reintentos indefinidos)
- Body se lee como texto crudo (`req.text()`) antes de verificar, luego se parsea como JSON

> **Importante**: `WHATSAPP_APP_SECRET` es el **App Secret** de la app de Meta, distinto del
> `WHATSAPP_VERIFY_TOKEN` que se usa en el GET de verificación inicial del webhook.

---

### `src/app/api/payments/flow/confirm/route.ts` (H6 / commit 12)

**Mecánica de firma Flow:**
- Mismo algoritmo que `lib/payments/flow.ts → sign()`: ordenar claves alfabéticamente,
  concatenar `key+value` para cada par (excepto "s"), HMAC-SHA256 con `FLOW_SECRET_KEY`
- El parámetro "s" del body form-encoded es la firma recibida

**Comportamiento:**
- Solo aplica cuando el body es `application/x-www-form-urlencoded` (caso real de producción)
- Ruta JSON (sandbox): sin verificación de firma (no hay "s" en el sandbox)
- Si `FLOW_SECRET_KEY` no está configurado: permite el paso con `console.warn` (degraded mode)
- Si la firma es inválida o falta "s": devuelve **400** (Flow puede reintentar, lo cual es
  deseable si hubo un error de configuración legítimo)
- Si la firma es válida: `console.log` de confirmación

---

## Variables de entorno requeridas

| Variable | Webhook | Descripción | Dónde obtenerla |
|---|---|---|---|
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Calendly | Signing key del webhook | Calendly → Integrations → Webhooks → ver webhook creado |
| `WHATSAPP_APP_SECRET` | WhatsApp/Meta | App Secret (≠ verify token) | Meta for Developers → App → Settings → Basic → App Secret |
| `FLOW_SECRET_KEY` | Flow | Ya debe existir | Flow dashboard → API Key y Secret |

### Agregar en Vercel

```bash
# Con Vercel CLI:
vercel env add CALENDLY_WEBHOOK_SIGNING_KEY
vercel env add WHATSAPP_APP_SECRET
# FLOW_SECRET_KEY ya debe existir
```

### Agregar en `.env.local` para desarrollo:

```env
CALENDLY_WEBHOOK_SIGNING_KEY=whsec_...
WHATSAPP_APP_SECRET=...
```

---

## Cómo configurar cada webhook en el proveedor

### Calendly

1. Ir a [Calendly Integrations → Webhooks](https://calendly.com/integrations/webhooks)
2. Crear webhook con URL: `https://nilolabs.vercel.app/api/webhooks/calendly`
3. Seleccionar eventos: `invitee.created`, `invitee.canceled`
4. Copiar el **Signing Key** que muestra Calendly
5. Agregar como `CALENDLY_WEBHOOK_SIGNING_KEY` en Vercel

### WhatsApp / Meta

1. Ir a Meta for Developers → tu app → WhatsApp → Configuration
2. En el campo **App Secret**: Settings → Basic → copiar App Secret
3. Agregar como `WHATSAPP_APP_SECRET` en Vercel
4. El **Verify Token** (`WHATSAPP_VERIFY_TOKEN`) es distinto — ya configurado

### Flow

`FLOW_SECRET_KEY` ya debe estar configurado. Verificar que el **urlConfirmation**
que se pasa al crear el pago apunte a `https://nilolabs.vercel.app/api/payments/flow/confirm`.

---

## Cómo probar manualmente

### Calendly

```bash
# Sin firma → 401
curl -X POST https://localhost:3000/api/webhooks/calendly \
  -H "Content-Type: application/json" \
  -d '{"event":"invitee.created","payload":{}}' 
# Esperado: 401 {"error":"Invalid signature"}
# (Si CALENDLY_WEBHOOK_SIGNING_KEY no está en .env.local → 200, warning en logs)

# Con firma inválida → 401
curl -X POST https://localhost:3000/api/webhooks/calendly \
  -H "Content-Type: application/json" \
  -H "Calendly-Webhook-Signature: t=1234567890,v1=invalidsignature" \
  -d '{"event":"invitee.created","payload":{}}'
# Esperado: 401

# Para probar con firma válida: usar las herramientas de test de Calendly en el dashboard
```

### WhatsApp / Meta

```bash
# Sin firma → 200 (sin procesar)
curl -X POST https://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[]}'
# Esperado: 200 {"ok":true} (pero sin procesamiento del payload)
# Logs: "X-Hub-Signature-256 missing or malformed"

# Con firma inválida → 200 (sin procesar)
curl -X POST https://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalidsignature" \
  -d '{"entry":[]}'
# Esperado: 200 {"ok":true} sin procesar

# Para probar con firma válida: usar el Test Webhook de Meta for Developers
```

### Flow confirm

```bash
# Sin firma "s" (form-encoded, con FLOW_SECRET_KEY configurado) → 400
curl -X POST https://localhost:3000/api/payments/flow/confirm \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=abc123"
# Esperado: 400 {"error":"Missing signature"}

# Con firma inválida → 400
curl -X POST https://localhost:3000/api/payments/flow/confirm \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=abc123&s=invalidsignature"
# Esperado: 400 {"error":"Invalid signature"}

# JSON (sandbox, sin FLOW_SECRET_KEY o sin "s") → pasa sin verificar
curl -X POST https://localhost:3000/api/payments/flow/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123"}'
# Esperado: busca orden en DB, continúa flujo normal
```

---

## Notas de seguridad

- Todas las comparaciones de firma usan `timingSafeEqual` (no `===`) para prevenir timing attacks
- El body se lee como texto crudo **una sola vez** antes de verificar — garantiza que el HMAC
  se calcula sobre exactamente los mismos bytes que recibió el servidor
- WhatsApp: siempre devuelve 200 aunque la firma falle, para no gatillar reintentos de Meta
- Flow: devuelve 400 en firma inválida porque es preferible que Flow reintente ante un
  error de configuración, antes que procesar un pago falsificado
- Degraded mode (variable no configurada): en producción, todas las variables deben estar
  configuradas; el degraded mode es solo para evitar romper ambientes sin las keys
