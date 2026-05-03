import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** RUT desde `patients.rut`. El segundo parámetro (admin_notes) se mantiene como respaldo legacy. */
export function displayNationalId(
  patientRut: string | null | undefined,
  adminNotes: string | null | undefined
): string {
  if (patientRut?.trim()) return patientRut.trim();
  const n = adminNotes?.trim();
  if (n?.startsWith("RUT/ID:")) {
    const rest = n.slice("RUT/ID:".length).trim();
    if (rest) return rest;
  }
  return "—";
}
