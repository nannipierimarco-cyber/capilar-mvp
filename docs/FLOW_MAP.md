# FLOW_MAP — Perfecto / capilar-mvp · Estado AS-IS

> Generado el 2026-05-12. Representa el estado real del código. No incluye ideas futuras.
> Actualizar este documento cada vez que se modifique una ruta, API, integración o estado de lead.

---

## Resumen ejecutivo

**Perfecto** es una plataforma digital de salud estética con dos verticales:

- **Hair Care** — quiz médico capilar → pago Flow → revisión médica → receta → farmacia → despacho
- **Skin Care** — evaluación de piel + Skin Copilot vía WhatsApp (AI) asistido por dermatóloga

Hoy existen **dos funnels capilares paralelos activos**:

1. **Mapa Capilar AI** (`/mapa-capilar`) — 1 pregunta + 2 fotos → análisis GPT-4o → reporte visual → lead con email/teléfono. Funnel ligero, sin pago, foco en generación de leads.
2. **Quiz médico completo** (`/quiz`) — ~10 pasos → fotos → datos personales → Supabase → pago Flow → revisión médica.

La plataforma tiene un **portal de médico** (`/doctor`) con Calendly, un **admin interno** (`/admin`), y un **Skin Copilot** operativo vía WhatsApp (webhook Meta activo).

---

## Mapa general del producto

```
Landing (/)
├── Hair Care (/salud-capilar)
│   ├── Mapa Capilar AI (/mapa-capilar) ──► Analizando ──► Reporte (/mapa-capilar/reporte/[id])
│   │                                                         └── CTA → /quiz
│   └── Quiz completo (/quiz) ──► Membership (/membership) ──► Checkout ──► Flow Payment ──► Return
│                                                                                               └── Success
└── Skin Care (/dermatologia-mujer)
    └── Evaluación de piel (/evaluacion-piel) ──► Gracias (/evaluacion-piel/gracias)
                                                   └── Skin Copilot (WhatsApp)

Portales internos
├── /admin (cookie ADMIN_SECRET)
│   ├── /admin/login
│   ├── /admin/patients/[id]
│   ├── /admin/doctors
│   └── /admin/skin
└── /doctor (Supabase Auth)
    ├── /doctor/login
    └── /doctor/patients/[id]
```

---

## Diagrama Mermaid — Flujo de usuario principal

```mermaid
flowchart TD
    A([Usuario llega]) --> B[Landing /]
    B --> C{¿Qué verticale?}
    C -->|Hair Care| D[/salud-capilar]
    C -->|Skin Care| E[/dermatologia-mujer]

    D --> F{¿Qué flujo?}
    F -->|Mapa Capilar AI| G[/mapa-capilar\n1 pregunta]
    F -->|Quiz completo| Q[/quiz\n~10 pasos]

    G --> G1[Selecciona ruta\nFrenar caída / Trasplante]
    G1 --> G2[Sube 2 fotos\nFrontal + Coronilla]
    G2 --> G3[/mapa-capilar/analizando\n30s countdown]
    G3 -->|POST /api/mapa-capilar/analyze| G4[GPT-4o analiza\nfotos + respuestas]
    G4 --> G5[/mapa-capilar/reporte/id\nGate: email + WhatsApp]
    G5 --> G6[Ver reporte visual\nDescargar PNG]
    G6 -->|CTA| Q

    Q --> Q1[Intro]
    Q1 --> Q2[Ruta: Frenar caída ó\nEvaluar trasplante]
    Q2 --> Q3[Patrón capilar visual]
    Q3 --> Q4[Duración + tipo + irritación]
    Q4 --> Q5[Interstitial trust]
    Q5 --> Q6[Historial + tratamientos previos]
    Q6 --> Q7[Interstitial: Ya casi]
    Q7 --> Q8[Condiciones médicas]
    Q8 --> Q9[Medicamentos actuales]
    Q9 --> Q10{Ruta}
    Q10 -->|Tratamiento| Q11[Paso médico: ¿abierto a trasplante?]
    Q10 -->|Trasplante| Q12[Paso trasplante: timing + presupuesto]
    Q11 --> Q13[Fotos: 4 slots\nFrontal + Coronilla obligatorias]
    Q12 --> Q13
    Q13 --> Q14[Datos personales: RUT + email + teléfono]
    Q14 -->|POST Supabase| Q15[Crea patient + intake + fotos]
    Q15 -->|fire-and-forget| AI[POST /api/ai/doctor-report\nGPT-4o prepara nota para médico]
    Q15 --> M[/membership\nSelección plan: 1/3/6 meses]
    M --> CH[/checkout\nResumen + consentimiento]
    CH -->|POST /api/payments/flow/create| FL[Flow: crea orden]
    FL --> FLP[Redirige a Flow.cl\npagar con tarjeta/transferencia]
    FLP -->|POST /api/payments/flow/confirm| FLOK[Actualiza orden en Supabase]
    FLP --> RET[/checkout/return\nVerifica estado]
    RET --> SUC[/success\nConfirmación]

    E --> SKIN[/evaluacion-piel\nFunnel 14 pasos]
    SKIN --> SKINOK[/evaluacion-piel/gracias]
    SKINOK --> WA[Skin Copilot via WhatsApp]
```

---

## Tabla de páginas / rutas

| Ruta | Objetivo | Qué ve el usuario | CTA principal | Destino del CTA | Datos recopilados | Paso del funnel |
|---|---|---|---|---|---|---|
| `/` | Landing hub | Hero + Hair Care + Skin Care cards | "Comenzar →" | `/quiz` | Ninguno | ToF |
| `/salud-capilar` | Hub Hair Care | Hero + cómo funciona + FAQ + aviso médico | "Comenzar evaluación" | `/quiz` | Ninguno | ToF |
| `/mapa-capilar` | Mapa Capilar AI — captura ruta + fotos | Hero explicativo → 1 pregunta → upload 2 fotos | "Generar mi mapa" | `/mapa-capilar/analizando` | Ruta (treatment/transplant) + 2 fotos (sessionStorage) | MoF |
| `/mapa-capilar/analizando` | Loading AI | Countdown 30s + checklist animado | Auto-redirect | `/mapa-capilar/reporte/[id]` | Ninguno | MoF |
| `/mapa-capilar/reporte/[id]` | Gate de contacto + reporte visual | Formulario email+WA → infografía luxe | "Ver mi reporte" / "Evaluar Tratamiento online" | Muestra reporte / `/quiz` | email, teléfono (→ Supabase `hair_map_leads`) | MoF/BoF |
| `/mapa-capilar/reporte` | Fallback sin ID | Reporte genérico | "Evaluar Tratamiento online" | `/quiz` | Ninguno | MoF |
| `/mapa-capilar/reporte/demo` | Demo internal | Demo del reporte | — | — | Ninguno | Internal |
| `/quiz` | Quiz médico completo | Multi-step ~10 pasos según ruta | "Enviar evaluación" | `/membership` | PII completo + datos clínicos + fotos | BoF |
| `/membership` | Selección plan | Cards 1/3/6 meses | "Continuar" | `/checkout` | Selección plan | BoF |
| `/checkout` | Resumen + pago | Plan, precio, FAQ, consentimiento | "Pagar con Flow" | Flow.cl | consent checkbox | Conversión |
| `/checkout/return` | Retorno de Flow | Verifica estado pago | — | `/success` o error | Ninguno (lee `provider_token`) | Post-pago |
| `/success` | Confirmación | Mensaje de éxito | — | — | Ninguno | Post-pago |
| `/agendar-consulta` | Booking médico | Calendly embed | Calendly | Calendly | Ninguno (manejado por Calendly) | Post-pago |
| `/dermatologia-mujer` | Hub Skin Care | Landing skin + Skin Copilot promo | "Empezar evaluación de piel" | `/evaluacion-piel` | Ninguno | ToF |
| `/evaluacion-piel` | Skin funnel 14 pasos | Hero → preguntas piel → fotos → contacto | "Enviar" | `/evaluacion-piel/gracias` | PII + historial piel + fotos (→ Supabase `skin_assessments`) | BoF |
| `/evaluacion-piel/gracias` | Confirmación skin | Mensaje gracias + próximos pasos | WhatsApp | WhatsApp link | Ninguno | Post-eval |
| `/score-capilar` | Score capilar (legacy) | Funnel corto: quiz → contacto → fotos → reporte | — | In-page results | Respuestas quiz + email + WA + fotos | MoF (legacy) |
| `/skin-copilot-test` | Test interno Skin Copilot | Chat de prueba | — | — | Ninguno | Internal |
| `/admin` | Dashboard interno | Tabla pacientes + tabla mapa-capilar leads | "Ver →" | `/admin/patients/[id]` | Ninguno | Internal |
| `/admin/login` | Login admin | Formulario password | "Ingresar" | `/admin` | password | Internal |
| `/admin/patients/[id]` | Detalle paciente | Info completa + AI report + asignar médico + estado | Cambiar estado | Supabase updates | Estado, notas admin | Internal |
| `/admin/doctors` | Gestión médicos | Tabla médicos + formulario crear | "Crear médico" | POST /api/admin/doctors/create | Datos médico | Internal |
| `/admin/skin` | Evaluaciones de piel | Tabla skin assessments | — | — | Ninguno | Internal |
| `/doctor` | Portal médico | Lista de reviews asignados + stats | "Ver caso" | `/doctor/patients/[id]` | Ninguno | Internal |
| `/doctor/login` | Login médico | Formulario Supabase Auth | "Iniciar sesión" | `/doctor` | email + password | Internal |
| `/doctor/patients/[id]` | Caso del paciente | Datos + fotos + AI report + formulario revisión | "Guardar revisión" | POST /api/doctor/review | Decisión médica + notas | Internal |

---

## Tabla de CTAs

| Página | Botón / Link | Destino | Tipo |
|---|---|---|---|
| `/` | "Comenzar →" (nav) | `/quiz` | Interno |
| `/` | "Mapa Capilar AI" (nav) | `/mapa-capilar` | Interno |
| `/` | Card "Hair Care" | `#hair-care` (anchor) | Anchor |
| `/` | Card "Skin Care" | `#skin-care` (anchor) | Anchor |
| `/` | "Conocer Hair Care" | `/salud-capilar` | Interno |
| `/` | "Conocer Skin Care" | `/dermatologia-mujer` | Interno |
| `/salud-capilar` | "Mapa Capilar AI" (nav) | `/mapa-capilar` | Interno |
| `/salud-capilar` | "Comenzar evaluación" (hero) | `/quiz` | Interno |
| `/salud-capilar` | "Iniciar evaluación" (MonthlyTreatment) | `/quiz` | Interno |
| `/salud-capilar` | "Comenzar evaluación" (SafetyNote) | `/quiz` | Interno |
| `/mapa-capilar` | "Crear mi mapa capilar" | `step=0` (in-page) | In-page |
| `/mapa-capilar` | "Generar mi mapa" | `/mapa-capilar/analizando` | Interno |
| `/mapa-capilar/reporte/[id]` | "Ver mi reporte" | In-page (muestra reporte) | In-page |
| `/mapa-capilar/reporte/[id]` | "Descargar imagen" | PNG download | Download |
| `/mapa-capilar/reporte/[id]` | "Evaluar Tratamiento online" | `/quiz` | Interno |
| `/dermatologia-mujer` | "Empezar evaluación de piel" | `/evaluacion-piel` | Interno |
| `/evaluacion-piel/gracias` | WhatsApp link | `wa.me/...` | Externo |
| `/membership` | "Continuar" | `/checkout?plan=...&membership=...` | Interno |
| `/checkout` | "Pagar con Flow" | Flow.cl (redirect) | Externo |
| `/admin/patients/[id]` | "Ver en doctor portal" | `/doctor/patients/[id]` | Interno |
| Varios | Logo "Perfecto" | `/` | Interno |

---

## Tabla de API routes

| Archivo | Endpoint | Método | Qué hace | Inputs | Outputs | Tablas | Servicios ext. | Env vars | Auth | Riesgos |
|---|---|---|---|---|---|---|---|---|---|---|
| `api/admin/auth/route.ts` | `/api/admin/auth` | POST | Login admin: compara password contra ADMIN_SECRET, setea cookie `admin_token` | `{password}` | `{ok: true}` | — | — | `ADMIN_SECRET` | ❌ ninguna antes del login | Cookie con valor = secret (no hash) |
| `api/admin/assign-doctor/route.ts` | `/api/admin/assign-doctor` | POST | Asigna médico a review | `{intake_id, doctor_id}` | `{ok}` | `medical_reviews` | — | `SUPABASE_*` | ❌ no verifica cookie | Sin auth check |
| `api/admin/doctors/create/route.ts` | `/api/admin/doctors/create` | POST | Crea doctor + usuario Supabase Auth | `{email, full_name, ...}` | `{ok, doctor_id}` | `doctor_profiles` | Supabase Auth | `SUPABASE_*` | ❌ no verifica cookie | Sin auth check |
| `api/ai/doctor-report/route.ts` | `/api/ai/doctor-report` | POST | Genera nota médica preliminar con GPT-4o (con fotos) | `{intake_id, force?}` | `{ok}` | `ai_doctor_reports`, `intakes`, `photos` | OpenAI | `OPENAI_API_KEY`, `SUPABASE_*` | ❌ ninguna | Cualquiera puede triggear con UUID conocido; consume créditos OpenAI |
| `api/ai/hair-map/route.ts` | `/api/ai/hair-map` | POST | Genera hair map (versión antigua) | Respuestas + fotos | `{report}` | — | OpenAI | `OPENAI_API_KEY` | ❌ ninguna | Ruta legacy paralela a /analyze |
| `api/ai/user-score-report/route.ts` | `/api/ai/user-score-report` | POST | Genera reporte score capilar | Respuestas + contacto | `{report}` | — | OpenAI | `OPENAI_API_KEY` | ❌ ninguna | Expuesto |
| `api/mapa-capilar/analyze/route.ts` | `/api/mapa-capilar/analyze` | POST | Analiza fotos capilares con GPT-4o-vision → guarda en `hair_map_analyses` | `{answers, photoFrontal?, photoCrown?}` | `{id, report, isFallback}` | `hair_map_analyses`, storage `patient-photos/mapa-capilar/*` | OpenAI | `OPENAI_API_KEY`, `SUPABASE_*` | ❌ ninguna | Cualquiera puede subir fotos y consumir OpenAI; fotos en bucket público |
| `api/mapa-capilar/generate/route.ts` | `/api/mapa-capilar/generate` | POST | Genera reporte mapa (versión anterior) | `{concern, duration, ...} + fotos` | `{report, isFallback}` | — | OpenAI | `OPENAI_API_KEY` | ❌ ninguna | Ruta legacy; duplica /analyze |
| `api/mapa-capilar/get-analysis/route.ts` | `/api/mapa-capilar/get-analysis` | GET | Lee análisis de `hair_map_analyses` por ID | `?id=uuid` | `{frontalUrl, crownUrl, report, status}` | `hair_map_analyses` | — | `SUPABASE_*` | ❌ ninguna | IDOR: cualquier ID retorna análisis ajeno |
| `api/mapa-capilar/save-lead/route.ts` | `/api/mapa-capilar/save-lead` | POST | Guarda lead en `hair_map_leads` | `{email, phone, concern, ...}` | `{ok}` | `hair_map_leads` | — | `SUPABASE_*` | ❌ ninguna | Sin validación de email ni rate-limit |
| `api/doctor/review/route.ts` | `/api/doctor/review` | POST | Médico guarda su revisión | `{review_id, decision, notes, ...}` | `{ok}` | `medical_reviews`, `intakes` | — | `SUPABASE_*` | ✅ Supabase Auth | — |
| `api/doctor/update-profile/route.ts` | `/api/doctor/update-profile` | POST | Actualiza perfil de médico | Datos perfil + Calendly | `{ok}` | `doctor_profiles` | — | `SUPABASE_*` | ✅ Supabase Auth | — |
| `api/hubspot/sync-lead/route.ts` | `/api/hubspot/sync-lead` | POST | Upsert contacto en HubSpot CRM | `SyncLeadInput {email, ...}` | `{success, contactId}` | — | HubSpot API | `HUBSPOT_ACCESS_TOKEN` | ❌ ninguna | Cualquiera puede crear/sobrescribir contactos en HubSpot |
| `api/payments/flow/create/route.ts` | `/api/payments/flow/create` | POST | Crea orden en Supabase + pago en Flow | `{plan, membership, intake_id?}` | `{url, order_id}` | `orders`, `intakes`, `patients` | Flow API | `SUPABASE_*`, Flow vars | ❌ ninguna | intake_id viene de localStorage; sin verificar que pertenece al usuario |
| `api/payments/flow/confirm/route.ts` | `/api/payments/flow/confirm` | POST | Webhook de Flow: actualiza estado de orden | `token` (form-encoded) | `{ok}` | `orders` | Flow API | `SUPABASE_*`, Flow vars | ❌ ninguna (webhook) | Sin HMAC verification del webhook de Flow |
| `api/skin-assessment/route.ts` | `/api/skin-assessment` | POST | Guarda evaluación de piel | SkinFormData completo | `{id}` | `skin_assessments` | — | `SUPABASE_*` | ❌ ninguna | Sin rate-limit |
| `api/skin-copilot/profile/route.ts` | `/api/skin-copilot/profile` | GET | Lee perfil skin copilot | `?phone=` | `{profile}` | `skin_profiles` | — | `SUPABASE_*` | ❌ ninguna | IDOR por teléfono |
| `api/skin-copilot/test-chat/route.ts` | `/api/skin-copilot/test-chat` | POST | Test del skin copilot AI | `{message, phone?}` | `{reply}` | — | OpenAI | `OPENAI_API_KEY` | ❌ ninguna | Endpoint de test expuesto |
| `api/whatsapp/webhook/route.ts` | `/api/whatsapp/webhook` | GET | Verificación webhook Meta | Query params hub.* | challenge | — | — | `WHATSAPP_VERIFY_TOKEN` | Meta token | — |
| `api/whatsapp/webhook/route.ts` | `/api/whatsapp/webhook` | POST | Recibe mensajes WhatsApp → Skin Copilot AI → responde | Payload Meta | `{ok}` | `skin_copilot_users`, `whatsapp_messages`, `ai_interactions`, `doctor_escalations`, `skin_profiles` | WhatsApp Cloud API, OpenAI | `WHATSAPP_*`, `OPENAI_API_KEY`, `SUPABASE_*` | Meta verify token (GET) | Sin HMAC en POST; allowlist de teléfonos como guardia |
| `api/whatsapp/send-test/route.ts` | `/api/whatsapp/send-test` | POST | Envía mensaje WA de prueba | `{to, message}` | status | — | WhatsApp Cloud API | `WHATSAPP_*` | Allowlist phones | **TEMPORAL — eliminar antes de abrir a usuarios reales** |
| `api/whatsapp/debug-waba/route.ts` | `/api/whatsapp/debug-waba` | GET | Debug info WABA | — | debug info | — | WhatsApp Cloud API | `WHATSAPP_*` | ❌ ninguna | **TEMPORAL — eliminar** |
| `api/webhooks/calendly/route.ts` | `/api/webhooks/calendly` | POST | Actualiza `medical_reviews` cuando se agenda/cancela consulta | Payload Calendly | `{ok}` | `medical_reviews`, `patients` | — | `SUPABASE_*` | ❌ ninguna (sin HMAC) | Sin verificación de firma Calendly (TODO Phase 2) |

---

## Tabla de Supabase — tablas y datos

| Tabla | Datos personales | Datos capilares/clínicos | Fotos | Estados | Service role | Anon key | RLS conocida | Riesgo |
|---|---|---|---|---|---|---|---|---|
| `patients` | nombre, apellido, rut, email, teléfono, edad, sexo, ciudad | — | — | — | ✅ (quiz submit usa anon key del cliente) | ✅ | Desconocida (asumir débil) | RUT en plaintext; escritura directa desde cliente con anon key |
| `intakes` | patient_id | Todo el screening médico (minoxidil, enfermedades, embarazo, etc.) | — | `PatientStatus` (13 valores) | ✅ | ✅ (cliente inserta) | Desconocida | Datos médicos sensibles; cliente inserta sin RLS verificada |
| `photos` | patient_id, intake_id | tipo foto | URLs públicas en `patient-photos` bucket | — | ✅ | ✅ | Desconocida | Fotos con `getPublicUrl` = acceso sin auth |
| `orders` | patient_id | plan, monto, proveedor | — | `OrderStatus` (7 valores) | ✅ | — | — | Monto siempre server-side (correcto) |
| `ai_doctor_reports` | patient_id, intake_id | Resumen médico AI, ruta preliminar, red flags, sugerencias | — | — | ✅ | — | — | Datos sensibles; acceso solo service role (OK) |
| `hair_map_analyses` | — | respuestas básicas, fotos, analysis_json | URLs en `patient-photos/mapa-capilar/*` | `processing` / `done` | ✅ | — | — | IDOR: GET /api/mapa-capilar/get-analysis sin auth |
| `hair_map_leads` | nombre, email, teléfono, edad | preocupación, duración, objetivo, final_interest, report_json | photo_url | — (sin estado) | ✅ | — | — | **Sin estados formales de lead** |
| `medical_reviews` | patient_id, doctor_id, emails Calendly | decisión médica, notas, Calendly URLs | — | `MedicalReviewStatus` (9 valores) | ✅ | — | — | — |
| `doctor_profiles` | user_id, email, nombre, licencia, Calendly URLs | specialty | — | `is_active` | ✅ | — | — | Calendly URL expuesta en perfil |
| `skin_assessments` | nombre, email, teléfono, edad, peso, talla, sexo, país, ciudad | historial piel completo, síntomas, medicamentos, alergias | photo_urls (array) | `status` | ✅ | — | — | Datos médicos muy detallados |
| `skin_copilot_users` | phone_number | — | — | — | ✅ | — | — | Teléfonos de usuarios WhatsApp |
| `skin_profiles` | user_id | skin_type, allergies, current_products, doctor_notes | — | — | ✅ | — | — | IDOR vía /api/skin-copilot/profile |
| `whatsapp_messages` | user_id | message_text completo | — | direction, risk_level, action | ✅ | — | — | Contenido de mensajes persiste sin TTL |
| `ai_interactions` | user_id | pregunta + respuesta AI completa, contexto de perfil | — | risk_level, action | ✅ | — | — | PII puede estar en conversaciones |
| `doctor_escalations` | user_id | reason, message_snapshot | — | `status: pending/...` | ✅ | — | — | — |
| `score_capilar_leads` | nombre, whatsapp, email | score, ruta, prioridad, respuestas quiz | photo_frontal_url, photo_top_url | — | ✅ | — | — | **Tabla puede no existir aún** (ver TODO en ScoreCapilarFunnel.tsx:69) |

**Storage bucket:** `patient-photos` (aparentemente público — usa `getPublicUrl` sin signed URLs)

---

## Tabla de integraciones

| Integración | Dónde implementada | Qué hace | Estado | Datos recibe/envía | Env vars |
|---|---|---|---|---|---|
| **OpenAI GPT-4o** | `api/ai/doctor-report`, `api/mapa-capilar/analyze`, `api/mapa-capilar/generate`, `api/ai/hair-map`, `api/ai/user-score-report`, `lib/skinCopilot/ai.ts` | Análisis visual fotos capilares, nota médica preliminar, Skin Copilot chat | ✅ Activo | Fotos (data URL o URL pública), respuestas quiz, contexto de perfil | `OPENAI_API_KEY` |
| **HubSpot CRM** | `lib/hubspot/client.ts` + `api/hubspot/sync-lead` | Upsert contacto con propiedades custom (score capilar, ruta, interés trasplante) | ⚠️ Parcial (custom properties pueden no existir en plan gratuito) | email, nombre, teléfono, score capilar, ruta preliminar | `HUBSPOT_ACCESS_TOKEN` |
| **WhatsApp Cloud API (Meta)** | `lib/whatsapp.ts`, `api/whatsapp/webhook`, `api/whatsapp/send-test` | Skin Copilot: recibe mensajes, genera respuesta AI, responde vía WA | ✅ Activo (con allowlist de teléfonos) | Mensajes de texto inbound/outbound; NO fotos actualmente | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_API_VERSION` |
| **Supabase** | `lib/supabase/client.ts` + `lib/supabase/server.ts` | Base de datos principal, autenticación médicos, storage de fotos | ✅ Activo | Todos los datos del sistema | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Flow (pagos)** | `lib/payments/flow.ts`, `api/payments/flow/create`, `api/payments/flow/confirm` | Pagos en CLP con tarjeta/transferencia (gateway chileno) | ✅ Implementado (status: ¿sandbox o prod?) | Monto, email, orden, token | `FLOW_API_KEY`, `FLOW_SECRET_KEY` (inferidos) |
| **Calendly** | `api/webhooks/calendly`, `DoctorCalendlyCard.tsx` | Sincroniza agendamiento de consulta médica → actualiza `medical_reviews` | ⚠️ Parcial (sin HMAC, sin UTM params para matching robusto) | Invitee email, scheduled_at, event URI | — (webhook URL configurada en Calendly dashboard) |
| **Vercel** | Deploy + env vars | Hosting, edge functions | ✅ Activo | — | Configuradas en panel Vercel |
| **html-to-image** | `mapa-capilar/reporte/[id]/page.tsx` | Descarga infografía como PNG desde DOM | ✅ Activo | Renderizado DOM | — |

**Integraciones pendientes / no implementadas:**
- Email transaccional (Resend) — mencionado en CLAUDE.md, no hay código
- Pagos recurrentes / suscripción automática — no implementado
- WhatsApp API para flujo capilar (distinto del Skin Copilot) — manual actualmente
- Farmacia partner — coordinación manual

---

## Tabla de automatizaciones actuales

| Automatización | Tipo | Dónde | Estado | Descripción |
|---|---|---|---|---|
| AI doctor report post-quiz | Fire-and-forget fetch | `quiz/page.tsx:276` | ✅ Activo | Tras guardar intake, dispara `POST /api/ai/doctor-report` en background sin esperar respuesta |
| Skin Copilot respuesta WA | Webhook event-driven | `api/whatsapp/webhook` | ✅ Activo | Cada mensaje entrante → clasificación de riesgo → GPT-4o → respuesta WA automática |
| Escalación roja Skin Copilot | Trigger en webhook | `api/whatsapp/webhook` | ✅ Activo | Si riesgo es "red" → inserta en `doctor_escalations` (pero no notifica activamente al médico) |
| Calendly → medical_review | Webhook event-driven | `api/webhooks/calendly` | ⚠️ Parcial | Actualiza estado a `consultation_booked` pero sin HMAC; matching por email (frágil si email difiere) |
| Flow → order status | Webhook event-driven | `api/payments/flow/confirm` | ✅ Activo | Flow notifica pago → actualiza `orders.status` |

**Procesos que hoy son manuales:**
- Asignación de médico a cada intake (admin hace clic en "Asignar médico")
- Envío de receta al paciente
- Coordinación con farmacia
- Despacho y tracking
- Follow-up WhatsApp capilar (no automatizado, distinto del Skin Copilot)
- Notificación al médico cuando hay nueva revisión pendiente
- Notificación al admin cuando llega un pago

---

## Tabla de estados del lead

### Flujo principal (quiz → pago → médico)

| Estado | Valor en DB | Cuándo se asigna | Dónde |
|---|---|---|---|
| Lead | `lead` | — | Default implícito |
| Quiz completo | `completed_quiz` | Quiz submit exitoso | `quiz/page.tsx:intakePayload.status` |
| Pagado | `paid` | — | No se ve asignado automáticamente (¿manual?) |
| Consulta agendada | `consultation_scheduled` | — | No se ve asignado automáticamente |
| Revisado médicamente | `medically_reviewed` | — | Doctor portal |
| Receta enviada | `prescription_sent` | — | Manual/admin |
| En farmacia | `pharmacy_ordered` | — | Manual/admin |
| Despachado | `shipped` | — | Manual/admin |
| Suscripción activa | `active_subscription` | — | Manual/admin |
| Derivado a clínica | `referred_to_clinic` | — | Manual/admin |
| PRP cerrado | `prp_closed` | — | Manual/admin |
| Trasplante cerrado | `transplant_closed` | — | Manual/admin |
| No apto | `not_eligible` | — | Doctor portal |

**Nota:** La mayoría de estados después de `completed_quiz` y `paid_pending_medical_review` (en `orders`) son asignados manualmente desde el admin. No hay automatización que lleve de "pagado" a "consulta agendada".

### Flujo Mapa Capilar AI

Los `hair_map_leads` **no tienen estados**. Solo existe `hair_map_analyses.status` (`processing` / `done`).

### Flujo médico (`medical_reviews`)

| Estado | Significado |
|---|---|
| `pending_assignment` | Sin médico asignado aún |
| `pending_booking` | Médico asignado, esperando que paciente agende |
| `consultation_booked` | Consulta agendada en Calendly |
| `pending_review` | Consulta realizada, médico debe completar review |
| `needs_more_info` | Médico solicita más información |
| `approved_to_advance` | Corresponde avanzar con tratamiento |
| `not_eligible_online` | No corresponde por este flujo |
| `referred_to_clinic` | Derivar a clínica |
| `completed` | Consulta completa |

### Flujo Order/Pago

| Estado | Significado |
|---|---|
| `payment_pending` | Orden creada, sin iniciar pago |
| `payment_started` | Token Flow generado, usuario en redirect |
| `paid_pending_medical_review` | Pago confirmado por Flow, esperando médico |
| `payment_failed` | Pago falló |
| `refund_pending` | Reembolso solicitado |
| `refunded` | Reembolsado |
| `cancelled` | Cancelado |

---

## Lista de gaps y riesgos

### Seguridad / Auth

| # | Tipo | Descripción | Archivo |
|---|---|---|---|
| S1 | 🔴 CRÍTICO | `POST /api/ai/doctor-report` sin auth — cualquiera con un UUID de intake puede triggear AI y consumir créditos OpenAI | `api/ai/doctor-report/route.ts` |
| S2 | 🔴 CRÍTICO | `POST /api/mapa-capilar/analyze` sin auth — cualquiera puede subir fotos y consumir OpenAI | `api/mapa-capilar/analyze/route.ts` |
| S3 | 🔴 CRÍTICO | `POST /api/hubspot/sync-lead` sin auth — cualquiera puede crear/sobrescribir contactos en HubSpot | `api/hubspot/sync-lead/route.ts` |
| S4 | 🔴 CRÍTICO | `GET /api/mapa-capilar/get-analysis?id=` sin auth — IDOR, cualquier UUID expone análisis ajeno | `api/mapa-capilar/get-analysis/route.ts` |
| S5 | 🟠 ALTO | Cookie de admin contiene el valor raw del secret, no un token firmado/hasheado | `api/admin/auth/route.ts` |
| S6 | 🟠 ALTO | `/api/admin/assign-doctor` y `/api/admin/doctors/create` no verifican cookie de admin | `api/admin/*` |
| S7 | 🟠 ALTO | Bucket `patient-photos` usa `getPublicUrl` — fotos de pacientes sin restricción de acceso | `quiz/page.tsx`, `api/mapa-capilar/analyze/route.ts` |
| S8 | 🟠 ALTO | `POST /api/payments/flow/confirm` sin HMAC verification — cualquiera puede simular confirmación de pago | `api/payments/flow/confirm/route.ts` |
| S9 | 🟠 ALTO | `POST /api/webhooks/calendly` sin firma HMAC — marcado como TODO Phase 2 | `api/webhooks/calendly/route.ts` |
| S10 | 🟡 MEDIO | `POST /api/whatsapp/webhook` sin HMAC en POST (Meta debería firmar) | `api/whatsapp/webhook/route.ts` |
| S11 | 🟡 MEDIO | `intake_id` para pago viene de `localStorage` en cliente — sin verificar ownership | `checkout/page.tsx:51`, `api/payments/flow/create/route.ts` |
| S12 | 🟡 MEDIO | RUT almacenado en plaintext en `patients.rut` | `lib/types.ts:25`, `quiz/page.tsx` |

### Endpoints temporales que deben eliminarse

| # | Endpoint | Riesgo | Archivo |
|---|---|---|---|
| T1 | `GET /api/whatsapp/debug-waba` | Debug info pública de WABA | `api/whatsapp/debug-waba/route.ts` |
| T2 | `POST /api/whatsapp/send-test` | Puede enviar mensajes WA desde producción | `api/whatsapp/send-test/route.ts` |

### Debug code que debe eliminarse antes de producción

| # | Descripción | Archivo:Línea |
|---|---|---|
| D1 | `fetch("http://127.0.0.1:7425/ingest/...")` en PersonalStep — envía datos de validación a servidor local (agent log) | `quiz/page.tsx:1271` |

### Rutas huérfanas / inconsistencias

| # | Tipo | Descripción |
|---|---|---|
| R1 | Ruta inexistente | `/results` mencionada en CLAUDE.md (sección 13) pero no existe en `src/app/` |
| R2 | Ruta inexistente | `/plans` mencionada en CLAUDE.md pero en el código el pricing está en `/membership` |
| R3 | Duplicación | Dos endpoints de generación AI: `/api/mapa-capilar/analyze` (nuevo, con DB) y `/api/mapa-capilar/generate` (legacy, sin DB) |
| R4 | Duplicación | `/api/ai/hair-map` es otra ruta legacy para el mismo propósito |
| R5 | Tabla posiblemente inexistente | `score_capilar_leads` referenciada en comentario con TODO de migración SQL | `score-capilar/ScoreCapilarFunnel.tsx:67` |
| R6 | Score capilar legacy | `/score-capilar` es un funnel antiguo paralelo al nuevo `/mapa-capilar` |
| R7 | Página demo | `/mapa-capilar/reporte/demo` existe en código pero sin link público visible |

### Flujos incompletos / gaps operativos

| # | Gap | Impacto |
|---|---|---|
| G1 | No hay notificación al médico cuando llega un nuevo caso pagado | El médico no sabe que tiene un caso nuevo sin revisar el portal |
| G2 | No hay notificación al admin cuando llega un pago | Operación manual |
| G3 | La transición `paid_pending_medical_review` → `paid` en `intakes.status` no está automatizada | Inconsistencia entre `orders.status` y `intakes.status` |
| G4 | Matching Calendly → paciente solo por email | Frágil si el usuario usa email distinto al del quiz |
| G5 | `doctor_escalations` (riesgo rojo) no notifica activamente al médico | Escalación se guarda pero nadie la ve sin revisar la DB |
| G6 | `/evaluacion-piel/gracias` solo tiene link WhatsApp estático | Paciente de piel no entra a ningún CRM ni tracking automático |
| G7 | No hay tracking de eventos de conversión (Posthog, GA4, Segment) | No hay datos de funnel; `console.log` es el único tracking actual |
| G8 | Sin rate-limiting en ninguna API route | Abuso posible en todas las rutas |
| G9 | Sin body size limit explícito en rutas que reciben fotos en base64 | Fotos grandes en base64 pueden saturar la función |

### Compliance médico / Ley 19.628

| # | Riesgo | Descripción |
|---|---|---|
| C1 | RUT en plaintext | Dato personal identificador almacenado sin cifrado |
| C2 | Consentimiento implícito | El botón "Enviar evaluación" no tiene checkbox de consentimiento explícito para tratamiento de datos médicos |
| C3 | PII en logs | `currentMedicationsNote`, `drugAllergiesNote` pueden aparecer en logs de Supabase |
| C4 | Mensajes WhatsApp sin TTL | Conversaciones médicas se almacenan indefinidamente sin política de retención |
| C5 | Sin mecanismo de borrado | No existe ruta/UI para ejercer derecho de olvido (Art. 12, Ley 19.628) |

---

## Recomendaciones priorizadas

| Prioridad | Acción | Impacto |
|---|---|---|
| 🔴 P1 | Agregar autenticación a `/api/ai/doctor-report`, `/api/mapa-capilar/analyze`, `/api/hubspot/sync-lead` | Elimina exposición de créditos OpenAI y datos HubSpot |
| 🔴 P1 | Verificar HMAC en webhook de Flow | Evita simulación de pagos |
| 🔴 P1 | Eliminar `fetch("http://127.0.0.1:7425/...")` de `quiz/page.tsx:1271` | Evita envío de datos a localhost en producción |
| 🔴 P1 | Eliminar `/api/whatsapp/send-test` y `/api/whatsapp/debug-waba` | Endpoints temporales que no deben llegar a usuarios reales |
| 🟠 P2 | Convertir bucket `patient-photos` a privado + signed URLs para acceso | Fotos de pacientes no deberían ser públicas |
| 🟠 P2 | Agregar verificación de cookie admin en rutas `/api/admin/*` | Completa el guard del portal admin |
| 🟠 P2 | Implementar HMAC en webhook Calendly | Evita falsificación de bookings |
| 🟡 P3 | Agregar tracking de conversión real (Posthog o GA4) | Habilita métricas del funnel |
| 🟡 P3 | Automatizar transición de estados al recibir pago confirmado | Reduce trabajo manual del admin |
| 🟡 P3 | Deprecar rutas legacy: `/api/mapa-capilar/generate`, `/api/ai/hair-map` | Reduce deuda técnica y superficie de ataque |

---

## Checklist — actualizar cuando cambie el flujo

Cada vez que se modifique cualquiera de estos elementos, actualizar las secciones correspondientes de este documento:

- [ ] Se agrega/renombra/elimina una página en `src/app/` → actualizar **Tabla de páginas** y **Diagrama Mermaid**
- [ ] Se agrega/modifica un API route → actualizar **Tabla de API routes**
- [ ] Se agrega/modifica una tabla en Supabase → actualizar **Tabla de Supabase**
- [ ] Se agrega/elimina una integración → actualizar **Tabla de integraciones**
- [ ] Se agrega/modifica un estado de lead → actualizar **Tabla de estados del lead**
- [ ] Se resuelve un gap o riesgo → marcarlo como resuelto en **Lista de gaps y riesgos**
- [ ] Se agrega un CTA o link de navegación → actualizar **Tabla de CTAs**

---

## Top 10 hallazgos más importantes

1. **Tres API routes sin auth consumen créditos OpenAI ilimitadamente** (`/api/ai/doctor-report`, `/api/mapa-capilar/analyze`, `/api/ai/user-score-report`) — cualquier actor puede triggearlas con UUIDs adivinados o datos arbitrarios.

2. **`fetch("http://127.0.0.1:7425/...")` en `quiz/page.tsx:1271`** — código de debug que envía datos de validación del formulario personal (RUT, email, teléfono) a un servidor local; debe eliminarse antes de cualquier usuario real.

3. **Fotos de pacientes son públicas** — el bucket `patient-photos` usa `getPublicUrl`, lo que significa que las fotos médicas de pacientes (frontales capilares, coronilla) son accesibles por URL directa sin autenticación.

4. **Dos funnels capilares paralelos activos** — `/mapa-capilar` (nuevo, con DB, mejor UX) y `/score-capilar` (legacy) hacen cosas similares. El legacy tiene una tabla de Supabase (`score_capilar_leads`) que puede no existir aún.

5. **Sin tracking de conversión** — no hay Posthog, GA4 ni Segment. Solo `console.log`. Imposible medir el funnel, CAC o tasa de conversión por ruta sin instrumentar.

6. **Estado operativo del flujo post-pago es manual** — tras recibir pago de Flow, el admin debe manualmente asignar médico, actualizar estados, coordinar farmacia y despacho. No hay automatización ni notificación.

7. **`/api/hubspot/sync-lead` sin auth** — cualquiera puede crear o sobrescribir contactos en el CRM de HubSpot con datos arbitrarios, corrompiendo el pipeline de ventas.

8. **IDOR en `/api/mapa-capilar/get-analysis`** — cualquier UUID válido de análisis retorna las fotos y el reporte de ese usuario sin autenticación.

9. **Consentimiento de datos incompleto** — la página de quiz no tiene checkbox explícito de consentimiento para tratamiento de datos médicos ni mecanismo de borrado (Ley 19.628).

10. **Webhook de Flow sin HMAC** — un actor externo podría enviar un POST a `/api/payments/flow/confirm` con un token conocido y marcar una orden como pagada sin haber pagado realmente.
