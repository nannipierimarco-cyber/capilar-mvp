import crypto from "crypto";

const FLOW_API_KEY = process.env.FLOW_API_KEY!;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY!;
const FLOW_BASE_URL = process.env.FLOW_BASE_URL ?? "https://www.flow.cl/api";

function sign(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  const msg = keys.map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", FLOW_SECRET_KEY).update(msg).digest("hex");
}

export interface FlowCreateResult {
  url: string;
  token: string;
  flowOrder: number;
}

export interface FlowPaymentStatus {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1=pending, 2=paid, 3=rejected, 4=cancelled
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentData?: {
    date: string;
    media: string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferDate: string;
  };
}

export async function createFlowPayment(params: {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlReturn: string;
  urlConfirmation: string;
}): Promise<FlowCreateResult> {
  const p: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: "CLP",
    amount: String(params.amount),
    email: params.email,
    paymentMethod: "9",
    urlReturn: params.urlReturn,
    urlConfirmation: params.urlConfirmation,
  };
  p.s = sign(p);

  const res = await fetch(`${FLOW_BASE_URL}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(p).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow payment/create error ${res.status}: ${text}`);
  }

  return res.json() as Promise<FlowCreateResult>;
}

export async function getFlowPaymentStatus(token: string): Promise<FlowPaymentStatus> {
  const p: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  };
  p.s = sign(p);

  const res = await fetch(
    `${FLOW_BASE_URL}/payment/getStatus?${new URLSearchParams(p).toString()}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow payment/getStatus error ${res.status}: ${text}`);
  }

  return res.json() as Promise<FlowPaymentStatus>;
}

export function flowStatusToOrderStatus(flowStatus: number): string {
  if (flowStatus === 2) return "paid_pending_medical_review";
  if (flowStatus === 3 || flowStatus === 4) return "payment_failed";
  return "payment_started";
}
