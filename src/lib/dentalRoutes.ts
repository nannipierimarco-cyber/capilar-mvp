/** Rutas 100% dental — sin CTAs, branding ni copy del vertical capilar. */
const DENTAL_PATH_PREFIXES = ["/dental-care", "/dental"] as const;

export function isDentalPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return DENTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
