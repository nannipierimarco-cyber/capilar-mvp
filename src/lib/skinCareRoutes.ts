/** Rutas donde no debe mostrarse el CTA global de Mapa Capilar AI (flujos solo piel / skin care). */
const SKIN_CARE_PATH_PREFIXES = ["/dermatologia-mujer", "/evaluacion-piel", "/skin-copilot-test"] as const;

export function isSkinCarePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return SKIN_CARE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
