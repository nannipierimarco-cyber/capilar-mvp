export interface WhatsAppIncomingMessage {
  phone: string;
  messageId: string;
  type: "text" | "image" | "audio" | "document" | "unknown";
  text?: string;
  mediaId?: string;
  timestamp: string;
}

function apiBase(): string {
  const version = process.env.WHATSAPP_API_VERSION ?? "v23.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
}

/**
 * Parses a Meta WhatsApp Cloud API webhook payload into a normalized struct.
 * Returns null if the payload contains no actionable message.
 */
export function parseIncomingWhatsAppMessage(
  payload: Record<string, unknown>
): WhatsAppIncomingMessage | null {
  try {
    const entry = (payload?.entry as unknown[])?.[0] as Record<string, unknown>;
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = change?.value as Record<string, unknown>;
    const messages = value?.messages as unknown[] | undefined;

    if (!messages?.length) return null;

    const msg = messages[0] as Record<string, unknown>;
    const phone = msg?.from as string;
    const messageId = msg?.id as string;
    const timestamp = (msg?.timestamp as string) ?? new Date().toISOString();
    const type = ((msg?.type as string) ?? "unknown") as WhatsAppIncomingMessage["type"];

    const text =
      type === "text"
        ? ((msg?.text as Record<string, unknown>)?.body as string | undefined)
        : undefined;

    const mediaPayload = msg?.[type] as Record<string, unknown> | undefined;
    const mediaId = mediaPayload?.id as string | undefined;

    return { phone, messageId, type, text, mediaId, timestamp };
  } catch (err) {
    console.error("[WhatsApp] parseIncomingWhatsAppMessage error:", err);
    return null;
  }
}

/**
 * Sends a text message via WhatsApp Cloud API.
 * No-ops with a warning if credentials are missing.
 */
export async function sendWhatsAppText(to: string, message: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("[WhatsApp] Missing WhatsApp env vars — message not sent to", maskPhone(to));
    return;
  }

  try {
    const res = await fetch(apiBase(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message, preview_url: false },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[WhatsApp] sendWhatsAppText failed:", res.status, err);
    } else {
      console.log("[WhatsApp] WhatsApp reply sent to", maskPhone(to));
    }
  } catch (err) {
    console.error("[WhatsApp] sendWhatsAppText network error:", err);
  }
}

/**
 * Marks an inbound message as read (shows double blue tick on the user's phone).
 * Silently no-ops if credentials are missing.
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) return;

  try {
    await fetch(apiBase(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch (err) {
    console.warn("[WhatsApp] markMessageAsRead error:", err);
  }
}

/** Masks all but first 4 digits of a phone number for safe logging. */
function maskPhone(phone: string): string {
  return phone.slice(0, 4) + "***" + phone.slice(-2);
}

/** Strips all non-digit characters for phone comparison (handles "+", spaces, dashes). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export interface WhatsAppSendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
  metaStatus?: number;
  metaBody?: string;
}

/**
 * Sends a text message via WhatsApp Cloud API and returns a detailed result.
 * Logs env var presence, Meta HTTP status, and response body — never the token.
 *
 * NOTE: Meta requires an approved template to initiate conversations outside
 * the 24-hour customer-service window. If this returns error code 131026 or
 * 131047, a template message is required. Contact Meta Business to create one.
 * TODO: implement sendWhatsAppTemplateMessage({ to, templateName, language, components })
 *       once a template (e.g. "cotizacion_recibida") is approved in the Meta dashboard.
 */
export async function sendWhatsAppTextResult(
  to: string,
  message: string
): Promise<WhatsAppSendResult> {
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const hasToken      = Boolean(accessToken);
  const hasPhoneId    = Boolean(phoneNumberId);

  console.log("[WhatsApp:send] init", {
    hasAccessToken:   hasToken,
    hasPhoneNumberId: hasPhoneId,
    phoneNumberIdPrefix: phoneNumberId ? phoneNumberId.slice(0, 5) + "…" : "MISSING",
    to: maskPhone(to),
  });

  if (!accessToken || !phoneNumberId) {
    const err = `Missing env vars — hasAccessToken=${hasToken}, hasPhoneNumberId=${hasPhoneId}`;
    console.warn("[WhatsApp:send] aborted —", err);
    return { ok: false, error: err };
  }

  try {
    const url = apiBase();
    console.log("[WhatsApp:send] POST", url.replace(phoneNumberId, phoneNumberId.slice(0, 5) + "…"));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message, preview_url: true },
      }),
    });

    const metaBody = await res.text();
    console.log("[WhatsApp:send] Meta response", { status: res.status, body: metaBody.slice(0, 500) });

    if (!res.ok) {
      const isTemplateRequired =
        metaBody.includes("131026") || metaBody.includes("131047") ||
        metaBody.toLowerCase().includes("template");
      if (isTemplateRequired) {
        console.warn("[WhatsApp:send] Meta requires approved template — cannot send free-form text outside 24h window");
      }
      return {
        ok:         false,
        error:      `HTTP ${res.status}: ${metaBody.slice(0, 500)}`,
        metaStatus: res.status,
        metaBody:   metaBody.slice(0, 500),
      };
    }

    let messageId: string | undefined;
    try {
      const json = JSON.parse(metaBody) as { messages?: Array<{ id: string }> };
      messageId = json.messages?.[0]?.id;
    } catch { /* non-JSON success body — ignore */ }

    console.log("[WhatsApp:send] success — to:", maskPhone(to), "messageId:", messageId);
    return { ok: true, messageId, metaStatus: res.status, metaBody: metaBody.slice(0, 200) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp:send] network error:", err);
    return { ok: false, error: msg };
  }
}
