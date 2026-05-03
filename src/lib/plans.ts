export const SHIPPING_AMOUNT = 3990;

export const MEMBERSHIP_PLANS = {
  "6m": { months: 6, monthlyPrice: 19990, subtotal: 119940, label: "Membresía 6 meses" },
  "3m": { months: 3, monthlyPrice: 24990, subtotal: 74970, label: "Membresía 3 meses" },
  "1m": { months: 1, monthlyPrice: 29990, subtotal: 29990, label: "Membresía 1 mes" },
} as const;

export type MembershipKey = keyof typeof MEMBERSHIP_PLANS;

export function getMembershipPlan(key: string | null | undefined) {
  if (!key || !(key in MEMBERSHIP_PLANS)) return null;
  return MEMBERSHIP_PLANS[key as MembershipKey];
}

export function getOrderTotal(membershipKey: string | null | undefined): number | null {
  const plan = getMembershipPlan(membershipKey);
  if (!plan) return null;
  return plan.subtotal + SHIPPING_AMOUNT;
}

export function formatCLP(amount: number): string {
  return `$${amount.toLocaleString("es-CL")}`;
}
