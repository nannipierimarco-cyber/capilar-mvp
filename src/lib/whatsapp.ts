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

/**
 * Sends a text message via WhatsApp Cloud API and returns a result object.
 * Use this when you need to know whether the message actually succeeded.
 */
export async function sendWhatsAppTextResult(
  to: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    const msg = "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID";
    console.warn("[WhatsApp]", msg);
    return { ok: false, error: msg };
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
        text: { body: message, preview_url: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[WhatsApp] sendWhatsAppTextResult failed:", res.status, errText);
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 300)}` };
    }

    console.log("[WhatsApp] message sent to", maskPhone(to));
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] sendWhatsAppTextResult network error:", err);
    return { ok: false, error: msg };
  }
}
