# WhatsApp Real Test Setup — Skin Copilot

Step-by-step guide to connect a real WhatsApp number to the Skin Copilot backend for private testing.

---

## A. Meta Developers — Configure the app

### 1. Create or open your Meta App

1. Go to https://developers.facebook.com/apps
2. Click **Create App** (or open an existing one).
3. Choose **Business** as the app type.
4. Fill in App Name (e.g. "Nilo Skin Copilot") and contact email.

### 2. Add WhatsApp to the app

1. In the app dashboard, click **Add Product**.
2. Find **WhatsApp** and click **Set Up**.
3. You'll land on the **WhatsApp → API Setup** page.

### 3. Get your credentials

On the **API Setup** page:

| Item | Where to find it |
|------|-----------------|
| **Phone Number ID** | Listed under "From" phone number. Copy the ID (not the number itself). |
| **Access Token** | Click **Generate Access Token** → copy the temporary token. For production use a **System User token** that doesn't expire (via Business Manager → System Users). |
| **WhatsApp Business Account ID** | Shown on the same page (not needed for env but good to note). |

### 4. Add your personal number as a test recipient

1. On API Setup, under **To**, click **Manage phone number list**.
2. Add your personal WhatsApp number.
3. You'll receive a verification code on WhatsApp — enter it.

### 5. Define a Verify Token

Choose any secret string (e.g. `nilo_skin_copilot_2025`). You'll use this in both Meta and your Vercel env vars.

### 6. Configure the Callback URL

1. In the left sidebar go to **WhatsApp → Configuration**.
2. Under **Webhook**, click **Edit**.
3. Set:
   - **Callback URL**: `https://nilolabs.vercel.app/api/whatsapp/webhook`
   - **Verify Token**: your chosen verify token (must match `WHATSAPP_VERIFY_TOKEN` in Vercel)
4. Click **Verify and Save**. Meta will call the GET endpoint — it will return the challenge if the token matches.

### 7. Subscribe to the messages webhook field

1. After saving, click **Manage** next to Webhook fields.
2. Subscribe to **messages**.
3. Click **Done**.

---

## B. Vercel — Add environment variables

Go to https://vercel.com → your project → **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Token from Meta API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID from Meta API Setup |
| `WHATSAPP_VERIFY_TOKEN` | Your chosen verify token |
| `WHATSAPP_API_VERSION` | `v23.0` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `SKIN_COPILOT_ALLOWED_TEST_PHONES` | Your number, e.g. `+56912345678` |

After adding all variables, **redeploy** from the Vercel dashboard (Deployments → Redeploy) or run `/deploy prod`.

---

## C. Test the integration

### 1. Verify the webhook

Run this in your terminal (replace values):

```bash
curl "https://nilolabs.vercel.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Expected response: `test123`

### 2. Send a test message

From your personal WhatsApp (the number you added as a test recipient in Meta), write to the Nilo WhatsApp number. Try:

- "Hola, ¿qué es el ácido hialurónico?"
- "Tengo la piel seca, ¿qué hidratante me recomiendas?"

### 3. Check Vercel logs

Go to https://vercel.com → your project → **Logs** (or run `vercel logs <url>`). You should see:

```
[Webhook] WhatsApp webhook verified           ← on GET
[Webhook] Inbound WhatsApp message received from +569***
[Webhook] Skin Copilot reply generated (risk: green)
[WhatsApp] WhatsApp reply sent to +569***
```

### 4. Verify Supabase persistence

In Supabase Dashboard → Table Editor, check:
- `skin_copilot_users` — your phone number should appear
- `whatsapp_messages` — inbound + outbound messages
- `ai_interactions` — the AI call log

---

## D. Phone allowlist (test mode)

While `SKIN_COPILOT_ALLOWED_TEST_PHONES` is set, only numbers in that list will receive bot replies. Anyone else who messages the number will be silently ignored (no reply, no data saved).

To open to all users: remove the env var or leave it empty, then redeploy.

---

## E. Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| Webhook verification fails (403) | `WHATSAPP_VERIFY_TOKEN` mismatch between Meta and Vercel |
| No reply received | Check Vercel logs for `Missing WhatsApp env vars` or `Phone not in allowed test phones` |
| Reply arrives but looks wrong | Check `ai_interactions` table for the generated text |
| Supabase errors in logs | Run `supabase/schema_skin_copilot.sql` in Supabase SQL editor |
| Messages saved but not sent | `WHATSAPP_ACCESS_TOKEN` may be expired (temporary tokens last 24h — use a System User token for durability) |
