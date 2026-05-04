export interface WhatsAppIncomingMessage {
  phone: string;
  messageId: string;
  type: "text" | "image" | "audio" | "document" | "unknown";
  text?: string;
  mediaId?: string;
  timestamp: string;
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
 * Logs a warning and no-ops if credentials are missing (safe for development).
 */
export async function sendWhatsAppText(to: string, message: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn(
      "[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — message not sent to",
      to
    );
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
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
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[WhatsApp] sendWhatsAppText failed:", res.status, err);
    }
  } catch (err) {
    console.error("[WhatsApp] sendWhatsAppText network error:", err);
  }
}

// TODO (Phase 2): implement downloadWhatsAppMedia
// export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
//   1. GET https://graph.facebook.com/v19.0/${mediaId} → { url: string }
//   2. GET that URL with Authorization: Bearer WHATSAPP_ACCESS_TOKEN
//   3. Return the binary buffer for storage in Supabase Storage
// }
