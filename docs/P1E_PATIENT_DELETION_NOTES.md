# P1-E — Borrado de paciente con cascade (H12 / P1.5)

> Ejecutado el 2026-05-13. Cubre P1.5 (H12) del plan `SECURITY_STABILIZATION_PLAN.md`.

---

## Problema resuelto

La Ley 19.628 (Chile), artículo 12, otorga al titular el derecho a solicitar la
eliminación de sus datos personales. Sin un mecanismo de borrado completo, el admin
no puede cumplir solicitudes de "derecho al olvido" sin intervención manual en Supabase.

---

## Archivos creados / modificados

| Archivo | Cambio |
|---|---|
| `src/app/api/admin/patients/[id]/route.ts` | Nuevo endpoint DELETE con cascade |
| `src/app/admin/patients/[id]/DeletePatientButton.tsx` | Nuevo client component con confirm dialog |
| `src/app/admin/patients/[id]/page.tsx` | Import + uso de DeletePatientButton en el header |
| `docs/P1E_PATIENT_DELETION_NOTES.md` | Este archivo |

---

## Endpoint DELETE /api/admin/patients/[id]

**Auth**: `verifyAdminToken` — igual que el resto de rutas admin. Sin token válido → 401.

**Secuencia de borrado** (orden por FK dependency):

1. Fetch `photos.url` WHERE `patient_id = X` → guardar paths para Storage
2. DELETE `ai_doctor_reports` WHERE `patient_id = X`
3. DELETE `medical_reviews`   WHERE `patient_id = X`
4. DELETE `orders`            WHERE `patient_id = X`
5. DELETE `photos`            WHERE `patient_id = X`
6. DELETE `intakes`           WHERE `patient_id = X`
7. DELETE `patients`          WHERE `id = X`
8. Storage `patient-photos`.remove([paths]) — **best-effort**: si falla, se loguea pero el endpoint devuelve 200 porque la DB ya está limpia.

**Extracción de path de Storage**:
- Fotos nuevas (P1-A): ya son paths relativos → usados directamente
- Fotos legacy: URL completa → se extrae todo lo que viene después de `/patient-photos/`

---

## UI — DeletePatientButton

- Botón rojo "Eliminar paciente" con ícono `Trash2` (lucide-react)
- `window.confirm` antes de disparar la request — sin confirmación no hay borrado
- Durante el fetch: botón deshabilitado + texto "Eliminando..."
- Si ok → `router.push("/admin")`
- Si error → mensaje inline en rojo bajo el botón

---

## Cómo probar

```bash
# 1. Ir a /admin → abrir detalle de un paciente de prueba
# 2. Verificar que aparece botón rojo "Eliminar paciente" en el header
# 3. Hacer click → debe aparecer el confirm dialog con nombre del paciente
# 4. Cancelar → nada debe ocurrir
# 5. Confirmar → debe redirigir a /admin
# 6. En Supabase Dashboard verificar que las filas de patients, intakes,
#    photos, orders, medical_reviews y ai_doctor_reports fueron eliminadas
# 7. En Storage → patient-photos verificar que los archivos del paciente
#    fueron eliminados
```

---

## Notas de seguridad

- El endpoint no tiene rate limiting propio — está protegido por el cookie admin
  que ya tiene el token HMAC (P1-C).
- El borrado es irreversible. No hay soft-delete ni papelera.
- El borrado de Storage es best-effort para evitar que un fallo de S3 bloquee
  el cumplimiento del derecho al olvido en BD.
