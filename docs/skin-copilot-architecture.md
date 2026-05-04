# Skin Copilot — Architecture & Compliance

## Overview

Skin Copilot is a WhatsApp AI assistant for dermatology questions. It uses a risk-triage model: low-risk questions (GREEN) get an AI-generated educational reply; medium-risk (YELLOW) get a cautious reply with a dermatologist recommendation; high-risk (RED — symptoms, diagnoses, prescriptions) never reach the AI and always redirect to a real doctor.

---

## Request Flow

```
WhatsApp user
      │
      ▼
POST /api/whatsapp/webhook          ← Meta Cloud API webhook
      │
      ├─ parseIncomingWhatsAppMessage()   (lib/whatsapp.ts)
      │
      ├─ Find/create user in skin_copilot_users
      │
      ├─ Load skin profile + last 5 messages (parallel)
      │
      ├─ classifySkinMessage()            (lib/skinCopilot/classifier.ts)
      │   ├─ RED   → hardcoded safe redirect (no AI call)
      │   ├─ YELLOW → AI with strict guardrails
      │   └─ GREEN  → AI with educational guidelines
      │
      ├─ generateSkinCopilotReply()       (lib/skinCopilot/ai.ts)
      │
      ├─ Persist: whatsapp_messages + ai_interactions
      │
      ├─ Escalate if RED → doctor_escalations
      │
      └─ sendWhatsAppText()               (lib/whatsapp.ts)
```

Test console (`/skin-copilot-test`) runs the same pipeline via `POST /api/skin-copilot/test-chat` without a real WhatsApp connection.

---

## Risk Classification

| Level  | Trigger                                              | Action                                 |
|--------|------------------------------------------------------|----------------------------------------|
| GREEN  | General skincare questions, ingredients, routines    | AI educational reply                   |
| YELLOW | Actives (retinoids, acids), mild reactions, products for sensitive skin | AI reply with dermatologist note |
| RED    | Diagnoses, prescriptions, urgency symptoms, medical conditions | Hardcoded safe redirect — no AI |

RED keywords include (non-exhaustive): diagnosis words, prescription drug names, urgency signals like "me arde mucho", "cara hinchada", "alergia severa".

See `src/lib/skinCopilot/classifier.ts` for the full keyword and regex lists.

---

## AI Safety Architecture

```
RED message → NEVER sent to OpenAI
              → Returns: "Por tu seguridad, consulta con un dermatólogo..."

No OPENAI_API_KEY → Returns mock responses (dev mode)

OpenAI error → Falls back to SAFE_REDIRECT (same as RED)
```

The system prompt (`src/lib/skinCopilot/prompt.ts`) enforces:
- No diagnoses
- No prescription recommendations
- No treatment protocols
- Explicit dermatologist referral for anything clinical
- Responses capped at ~3 short paragraphs

---

## Database Tables

| Table                  | Purpose                                          |
|------------------------|--------------------------------------------------|
| `skin_copilot_users`   | WhatsApp users (phone number only)               |
| `skin_profiles`        | Skin type, concerns, allergies, doctor notes     |
| `skin_photos`          | Photo storage paths (Phase 2)                    |
| `whatsapp_messages`    | Full inbound/outbound message log                |
| `ai_interactions`      | Every AI call: question, context, answer, risk   |
| `consents`             | Consent audit trail                              |
| `doctor_escalations`   | RED/YELLOW cases queued for human review         |

All tables have RLS enabled. Only the service role key (server-side) can read or write.

---

## API Endpoints

| Method | Path                              | Description                                  |
|--------|-----------------------------------|----------------------------------------------|
| GET    | `/api/whatsapp/webhook`           | Meta webhook verification handshake          |
| POST   | `/api/whatsapp/webhook`           | Receive and process WhatsApp messages        |
| POST   | `/api/skin-copilot/test-chat`     | Simulate conversation (no real WhatsApp)     |
| GET    | `/api/skin-copilot/profile`       | Fetch skin profile by phone                  |
| PATCH  | `/api/skin-copilot/profile`       | Upsert skin profile fields                   |

---

## Environment Variables

| Variable                       | Required | Description                               |
|--------------------------------|----------|-------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Yes      | Supabase project URL                      |
| `SUPABASE_SERVICE_ROLE_KEY`    | Yes      | Service role key (server-side only)       |
| `OPENAI_API_KEY`               | Yes      | OpenAI API key (gpt-4o-mini)              |
| `WHATSAPP_ACCESS_TOKEN`        | Prod     | Meta Cloud API permanent token            |
| `WHATSAPP_PHONE_NUMBER_ID`     | Prod     | Meta phone number ID for sending          |
| `WHATSAPP_VERIFY_TOKEN`        | Prod     | Secret for webhook verification handshake |

Missing `SUPABASE_*` → stateless mode (no persistence).  
Missing `OPENAI_API_KEY` → mock responses.  
Missing `WHATSAPP_*` → messages logged but not sent.

---

## Compliance Notes

- **No medical advice**: The assistant explicitly cannot diagnose, prescribe, or recommend treatments. Every response for clinical topics ends with a referral to a dermatologist.
- **Data minimization**: Only phone number is required to use the service. Profile data is optional and user-provided.
- **Audit trail**: Every AI interaction is logged with the full context used to generate it (`ai_interactions`).
- **Escalation queue**: RED-level messages always create a `doctor_escalations` record for human review.
- **RLS**: All Skin Copilot tables have row-level security enabled. No client-side access.
- **No data to OpenAI for RED**: The most sensitive messages (urgency symptoms, diagnoses) never reach the AI model.

---

## Deployment Checklist

Before enabling in production:

- [ ] Run `supabase/schema_skin_copilot.sql` in Supabase SQL editor
- [ ] Set all `WHATSAPP_*` env vars in Vercel project settings
- [ ] Register webhook URL in Meta App Dashboard: `https://nilolabs.vercel.app/api/whatsapp/webhook`
- [ ] Set `WHATSAPP_VERIFY_TOKEN` to the same value in both Meta and Vercel
- [ ] Test with `/skin-copilot-test` before enabling live traffic
- [ ] Review `doctor_escalations` table daily during launch period
