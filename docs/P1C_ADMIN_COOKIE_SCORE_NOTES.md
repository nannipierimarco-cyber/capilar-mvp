# P1-C — Cookie admin HMAC + Deprecar /score-capilar

> Ejecutado el 2026-05-13. Cubre H8 (cookie admin) y P1.6 (redirect score-capilar)
> del plan `SECURITY_STABILIZATION_PLAN.md`.

---

## ÍTEM 1 — H8: Cookie admin ya no contiene el secreto raw

### Problema resuelto

Antes: `cookieStore.set("admin_token", process.env.ADMIN_SECRET, ...)`
El valor de la cookie era idéntico al secreto. Si el cookie era interceptado,
el atacante obtenía `ADMIN_SECRET` completo y podía forjar cualquier sesión futura.

### Solución implementada

**Nuevo helper** `src/lib/admin/auth.ts`:
- `generateAdminToken()`: genera `<timestamp>|<nonce>|<hmac>` donde:
  - `timestamp` = `Date.now()` en ms
  - `nonce` = 16 bytes aleatorios (`crypto.randomBytes(16).toString("hex")`)
  - `hmac` = `HMAC-SHA256(ADMIN_SECRET, "<timestamp>:<nonce>").digest("hex")`
- `verifyAdminToken(token)`: reconstruye el HMAC y compara con `timingSafeEqual`

**Archivos actualizados** (8 en total):

| Archivo | Cambio |
|---|---|
| `src/app/api/admin/auth/route.ts` | Ahora llama `generateAdminToken()` en lugar de poner el secreto |
| `src/app/admin/page.tsx` | Guard reemplazado por `verifyAdminToken(token ?? "")` |
| `src/app/admin/doctors/page.tsx` | Ídem |
| `src/app/admin/patients/[id]/page.tsx` | Ídem |
| `src/app/admin/skin/page.tsx` | Ídem |
| `src/app/api/admin/assign-doctor/route.ts` | Ídem |
| `src/app/api/admin/doctors/create/route.ts` | Ídem |
| `src/app/api/ai/doctor-report/route.ts` | `isAdmin` ahora usa `verifyAdminToken` |

### Propiedades de seguridad

- La cookie contiene un token sin información del secreto
- El token no puede forjarse sin conocer `ADMIN_SECRET`
- `timingSafeEqual` previene timing attacks en la comparación
- Rotar `ADMIN_SECRET` invalida todos los tokens existentes automáticamente
- El password check en el login (`password !== secret`) sigue siendo directo y es correcto
  (compara input del usuario con secreto server-side, nunca expuesto al cliente)

### Efecto en sesiones existentes

Las cookies admin con el formato antiguo (= ADMIN_SECRET raw) fallarán la
verificación del nuevo helper (no tienen formato `timestamp|nonce|hmac`).
El admin simplemente deberá loguearse de nuevo — comportamiento correcto.

---

## ÍTEM 2 — P1.6: /score-capilar redirige a /mapa-capilar

### Problema resuelto

`/score-capilar` era un funnel capilar legacy con:
- Tabla `score_capilar_leads` que puede no existir en producción (TODO en código)
- `getPublicUrl` sin mitigar (P1-A pendiente en ese flujo)
- Dos funnels paralelos generando confusión operativa

### Solución implementada

`src/app/score-capilar/page.tsx` ahora exporta solo:
```typescript
import { redirect } from "next/navigation";
export default function ScoreCapilarPage() {
  redirect("/mapa-capilar");
}
```

**Componentes conservados** (no eliminados, por si se reutilizan):
- `src/app/score-capilar/ScoreCapilarFunnel.tsx`
- `src/app/score-capilar/components/`

**Audit de referencias previo al cambio:**
- Los únicos archivos que mencionan "score-capilar" son internos al directorio
  (paths de storage: `score-capilar/${ts}_frontal`, logs de error)
- Ninguna página externa enlaza a `/score-capilar`
- No hay rewrites ni redirects en `next.config.ts` ni `middleware.ts`

### Nota sobre la tabla score_capilar_leads

No crear esta tabla en Supabase. Si algún día se decide recuperar el funnel,
hacerlo desde `/mapa-capilar` en lugar de mantener dos rutas paralelas.

---

## Cómo probar

### H8 — Cookie admin HMAC

```bash
# 1. Ir a /admin/login e iniciar sesión normalmente
# 2. Abrir DevTools → Application → Cookies → admin_token
#    El valor debe ser algo como:
#    1747123456789|a1b2c3d4e5f6...|9f8e7d6c5b4a...
#    (NO el valor de ADMIN_SECRET)

# 3. Navegar a /admin → debe cargar normalmente

# 4. Manipular el token manualmente (cambiar un char) y recargar /admin
#    → debe redirigir a /admin/login

# 5. Borrar la cookie y acceder a /admin
#    → debe redirigir a /admin/login
```

### P1.6 — Redirect score-capilar

```bash
# Abrir en el navegador:
# http://localhost:3000/score-capilar
# Debe redirigir automáticamente a /mapa-capilar (HTTP 307 o navegación client-side)
```
