import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// Token format: "<timestamp>|<nonce>|<hmac>"
// hmac = HMAC-SHA256(ADMIN_SECRET, "<timestamp>:<nonce>")
// Cookie stores this token — never the raw secret.

export function generateAdminToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET not configured");
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString("hex");
  const hmac = createHmac("sha256", secret)
    .update(`${timestamp}:${nonce}`)
    .digest("hex");
  return `${timestamp}|${nonce}|${hmac}`;
}

export function verifyAdminToken(token: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !token) return false;
  const parts = token.split("|");
  if (parts.length !== 3) return false;
  const [timestamp, nonce, receivedHmac] = parts;
  if (!timestamp || !nonce || !receivedHmac) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}:${nonce}`)
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(receivedHmac, "hex")
    );
  } catch {
    return false;
  }
}
