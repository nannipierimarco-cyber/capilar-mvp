# P1-A — Fotos privadas / Signed URLs

> Ejecutado el 2026-05-13. Implementación del ítem P1-A del plan `SECURITY_STABILIZATION_PLAN.md`.

---

## Resumen

Las fotos de pacientes en el flujo `mapa-capilar` estaban expuestas con URLs públicas permanentes.  
La corrección reemplaza `getPublicUrl` por URLs firmadas temporales (`createSignedUrl`) en el único lugar donde las URLs eran realmente usadas para mostrar fotos al usuario: el reporte capilar con ID.

---

## Cambios implementados

### `src/app/api/mapa-capilar/analyze/route.ts`

- **Antes**: `uploadPhoto()` subía la foto y devolvía `getPublicUrl(path).data.publicUrl` (URL pública permanente).
- **Después**: `uploadPhoto()` devuelve directamente el **path** de almacenamiento (e.g. `mapa-capilar/{id}_{ts}_frontal`). No se genera ninguna URL pública.
- El path se almacena en los campos `photo_frontal_url` y `photo_crown_url` de `hair_map_analyses`.
- El campo conserva el nombre `_url` por retrocompatibilidad con el schema; semánticamente ahora contiene un path.

### `src/app/api/mapa-capilar/get-analysis/route.ts`

- Se añadió `resolvePhotoUrl(supabase, stored)` — helper que distingue entre:
  - **Registros legacy** (valor comienza con `https://` o `http://`): devuelve la URL tal cual (sin romper fotos existentes).
  - **Registros nuevos** (valor es un path): llama `createSignedUrl(path, 3600)` y devuelve la URL firmada temporal (1 hora de validez).
- `frontalUrl` y `crownUrl` en la respuesta JSON ahora son siempre signed URLs (o `undefined`).
- Expiry de 3600 s (1 hora): suficiente para cargar el reporte en pantalla y descargar el infográfico como PNG.

---

## Alcance del fix

| Flujo | `getPublicUrl` eliminado | Método nuevo | Estado |
|---|---|---|---|
| mapa-capilar analyze → get-analysis | ✅ Sí | path → signed URL (server-side) | Implementado |
| score-capilar (`ScoreCapilarFunnel.tsx`) | ❌ No | — | Pendiente (ver abajo) |
| quiz (`quiz/page.tsx`) | ❌ No | — | Pendiente (ver abajo) |
| evaluacion-piel (`SkinAssessmentFunnel.tsx`) | ❌ No | — | Pendiente (ver abajo) |

---

## Pendientes

### P1-A.2 — score-capilar

**Archivo**: `src/app/score-capilar/ScoreCapilarFunnel.tsx` (líneas 88, 98)  
**Bucket**: `patient-photos`  
**Flujo**: Cliente sube foto → obtiene public URL → almacena en `score_capilar_leads.photo_frontal_url` / `photo_top_url` → pasa a `/api/ai/user-score-report` y `/api/ai/hair-map` como `image_url` para OpenAI Vision.

**Por qué no implementado**: OpenAI necesita URLs accesibles en el momento de la llamada. Requiere:
1. Hacer el bucket `patient-photos` privado en Supabase.
2. Cambiar el cliente del componente para pasar el **path** al route server-side.
3. En `/api/ai/user-score-report` y `/api/ai/hair-map`, generar signed URL con admin client antes de pasarla a OpenAI.

**Riesgo actual**: las fotos de score-capilar son accesibles públicamente por URL permanente.

---

### P1-A.3 — quiz

**Archivo**: `src/app/quiz/page.tsx` (línea 260)  
**Bucket**: `patient-photos`  
**Flujo**: Cliente sube foto → obtiene public URL → almacena en `photos.url` → usada por admin (`admin/patients/[id]/page.tsx:226`), doctor (`doctor/patients/[id]/page.tsx:311`) y `generateDoctorReport.ts` (OpenAI).

**Por qué no implementado**: La URL está almacenada en `photos.url` y es consumida por al menos 3 consumidores (admin, doctor, AI). Cambiarla a path requiere que admin y doctor generen signed URLs server-side al cargar la página del paciente. Riesgo de regresión alto.

**Estrategia recomendada**:
1. Hacer el bucket `patient-photos` privado.
2. Cambiar `photos.url` para almacenar el path.
3. En `admin/patients/[id]/page.tsx` y `doctor/patients/[id]/page.tsx`: agregar server action o API route que genere signed URLs al cargar fotos.
4. En `generateDoctorReport.ts`: generar signed URL con admin client antes de pasarla a OpenAI.

---

### P1-A.4 — evaluacion-piel

**Archivo**: `src/app/evaluacion-piel/SkinAssessmentFunnel.tsx` (línea 748)  
**Bucket**: `skin-assessment-photos` (distinto al de fotos capilares)  
**Flujo**: Cliente sube foto → obtiene public URL → almacena en `skin_assessments.photo_urls` → ruta `/api/skin-assessment` solo registra el conteo, no pasa URL a OpenAI directamente.

**Por qué no implementado**: Bucket diferente. El riesgo de exposición existe pero el impacto inmediato es menor (las URLs no se muestran en pantalla al usuario ni se pasan a OpenAI actualmente).

**Estrategia recomendada**:
1. Hacer el bucket `skin-assessment-photos` privado.
2. Cambiar almacenamiento a path en `photo_urls`.
3. Si en el futuro se necesita mostrar fotos, generar signed URLs server-side.

---

## Configuración manual requerida en Supabase

Para que los cambios sean completamente efectivos, el bucket `patient-photos` debe pasar de público a privado:

### Pasos en Supabase Dashboard

1. Ir a **Storage** → **Buckets** → seleccionar `patient-photos`.
2. Hacer click en **Edit bucket**.
3. Desactivar **Public bucket**.
4. Guardar.

Repetir con `skin-assessment-photos` cuando se implemente P1-A.4.

### SQL equivalente (alternativo)

```sql
UPDATE storage.buckets
SET public = false
WHERE id = 'patient-photos';

-- Cuando se implemente P1-A.4:
UPDATE storage.buckets
SET public = false
WHERE id = 'skin-assessment-photos';
```

### Políticas RLS requeridas tras hacer el bucket privado

Para que el admin client (SERVICE_ROLE_KEY) pueda seguir operando, no se necesitan políticas adicionales — el service role bypasses RLS.

Para el anon client (browser), si se necesita que el cliente pueda subir fotos a un bucket privado, agregar:

```sql
-- Permitir upload autenticado (ajustar según auth strategy)
CREATE POLICY "allow_upload_patient_photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'patient-photos');
```

> **Nota**: El flujo de mapa-capilar ya usa el admin client server-side para uploads, por lo que no necesita política anon para ese bucket.

---

## Riesgo de fotos legacy

Los registros existentes en `hair_map_analyses` con `photo_frontal_url` / `photo_crown_url` que contengan URLs públicas completas (ej. `https://xxx.supabase.co/storage/v1/object/public/...`) seguirán funcionando: el helper `resolvePhotoUrl` detecta que el valor comienza con `https://` y lo devuelve sin intentar `createSignedUrl`.

**Una vez que el bucket sea privado**, esas URLs dejarán de ser accesibles. Estrategia de migración:

```sql
-- Extraer el path de la URL pública legacy y actualizar el campo
UPDATE hair_map_analyses
SET
  photo_frontal_url = regexp_replace(
    photo_frontal_url,
    '^https?://[^/]+/storage/v1/object/public/patient-photos/',
    ''
  ),
  photo_crown_url = regexp_replace(
    photo_crown_url,
    '^https?://[^/]+/storage/v1/object/public/patient-photos/',
    ''
  )
WHERE
  photo_frontal_url LIKE 'https://%'
  OR photo_crown_url LIKE 'https://%';
```

Ejecutar esta migración **antes** de hacer el bucket privado para que los registros legacy sigan siendo resolvibles como signed URLs.

---

## Cómo probar manualmente

1. Ir a `/mapa-capilar`, completar el quiz y subir 2 fotos.
2. Esperar que `analizando` termine y rediriga a `/mapa-capilar/reporte/{id}`.
3. Completar el formulario de contacto y ver el reporte.
4. Abrir DevTools → Network → buscar la request a `/api/mapa-capilar/get-analysis?id=...`.
5. Verificar que `frontalUrl` y `crownUrl` en la respuesta sean URLs de formato:
   `https://{project}.supabase.co/storage/v1/object/sign/patient-photos/...?token=...&expiresIn=3600`
6. Verificar que las fotos se muestran correctamente en el infográfico.
7. Verificar que el botón "Descargar imagen" genera el PNG con las fotos.
8. Verificar en Supabase Storage que el objeto está almacenado en `mapa-capilar/{id}_{ts}_frontal` y no hay URL pública activa.
