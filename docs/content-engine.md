# Content Engine — Perfecto Labs

Sistema de generación y publicación automática de contenido para Instagram.

## Flujo general

```
[Panel /admin/content]
        │
        ▼
✨ Generar 7 posts  ──►  POST /api/admin/content/generate-week
        │                   │ GPT-4o genera copy + hashtags + image_prompt
        │                   │ Fallback determinístico si no hay OPENAI_API_KEY
        │                   ▼
        │              scheduled_posts (status=draft, generation_status=copy_ready)
        │
✨ Generar imagen ──►  POST /api/admin/content/generate-image
        │                   │ DALL-E 3 genera imagen desde image_prompt
        │                   │ Sube a Supabase Storage bucket post-images
        │                   ▼
        │              scheduled_posts (generation_status=asset_ready, image_url=...)
        │
✓ Aprobar prog. ──►  PUT /api/admin/posts/:id  (status=approved, scheduled_at=fecha futura)
⚡ Publicar ahora ──►  PUT /api/admin/posts/:id  (status=approved, scheduled_at=now())
        │
        ▼
[Make.com — escenario cada 15 min]
        │  Filtra: status=approved, image_url no vacío, scheduled_at <= now
        │  Publica en Instagram for Business
        │  PATCH status=posted
        ▼
[Instagram publicado]
```

**Regla clave:** Next.js nunca publica directamente en Instagram. Solo Make lo hace.

---

## Campos nuevos en scheduled_posts

Aplicar con `supabase/migrations/20260607_add_content_engine_fields.sql`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `format` | text | Formato del post: `static_educational`, `price_explainer`, `myth_vs_fact`, `reel_script` |
| `pillar` | text | Pilar de contenido (Educación dental, Valor, etc.) |
| `funnel_stage` | text | `awareness`, `consideration`, `decision` |
| `target_persona` | text | Descripción del público objetivo |
| `hook` | text | Primera línea gancho |
| `cta` | text | Call to action final |
| `text_overlay` | text | Texto para superponer en imagen (futuro) |
| `video_script` | text | Script para reels |
| `video_prompt` | text | Prompt para generación de video |
| `video_url` | text | URL del video generado |
| `thumbnail_url` | text | Thumbnail del video |
| `generation_status` | text | `idea` → `copy_ready` → `asset_ready` → `ready_for_review` |
| `quality_score` | numeric | Score de calidad (futuro) |
| `approval_notes` | text | Notas internas del revisor |
| `posted_at` | timestamptz | Timestamp de publicación real |
| `instagram_post_id` | text | ID del post en Instagram |
| `performance_*` | integer | Métricas: views, likes, comments, saves, shares, reach |
| `lead_count` | integer | Leads generados desde este post |

---

## Cómo generar posts semanales

### Desde el panel

1. Ir a `/admin/content`
2. Click en **✨ Generar 7 posts**
3. Se generan 7 posts para la semana próxima (lunes siguiente) con `status=draft`
4. Si `OPENAI_API_KEY` está configurada, GPT-4o genera copy real
5. Si no, usa contenido de ejemplo (fallback determinístico)

### Vía API directa

```bash
POST /api/admin/content/generate-week
Content-Type: application/json
Cookie: admin_token=...

{
  "vertical": "dental",
  "count": 7,
  "week_start": "2026-06-09"
}
```

**Respuesta:**
```json
{
  "posts": [...],
  "fallback": false,
  "week_start": "2026-06-09",
  "count": 7
}
```

---

## Cómo generar imagen

### Desde el panel

1. Abrir un post que tenga `image_prompt` (generado automáticamente)
2. Click en **✨ Generar imagen** (botón en la sección de imagen o en los controles)
3. DALL-E 3 genera la imagen y se sube a Supabase Storage
4. El post se actualiza con `image_url` y `generation_status=asset_ready`

### Vía API

```bash
POST /api/admin/content/generate-image
Content-Type: application/json
Cookie: admin_token=...

{ "post_id": "uuid-del-post" }
```

**Requiere:** `OPENAI_API_KEY` configurada. Si no existe, devuelve 503.

---

## Cómo aprobar programación

1. Asegurarse de que el post tiene `image_url` y `caption`
2. Verificar la `Fecha programada` (debe ser fecha futura)
3. Click **✓ Aprobar programación**
4. El post cambia a `status=approved` con la fecha establecida
5. Make lo publica automáticamente cuando `scheduled_at <= now`

---

## Publicar ahora

1. Click **⚡ Publicar ahora** en cualquier post con imagen y caption
2. El sistema setea `scheduled_at=now()` y `status=approved`
3. Make lo detecta en el próximo ciclo (≤ 15 minutos) y publica

---

## Cómo Make publica

Make.com tiene dos escenarios:

**Escenario 1 — Inmediato (Watch Events)**
- Trigger: cambio en Supabase
- Condición: `status=approved`, `image_url` no vacío, `scheduled_at <= now`
- Acción: publica en Instagram for Business

**Escenario 2 — Programado (cada 15 min)**
- GET Supabase buscando: `status=approved`, `scheduled_at <= now`, `image_url` no vacío
- Iterator → Instagram for Business publica
- PATCH `status=posted`

**No tocar Make.** Toda la lógica de publicación vive ahí.

---

## Cómo agregar nuevos formatos

1. Agregar el tipo a `PostFormat` en `src/lib/content-engine/brand.ts`
2. Agregar instrucciones en `formatInstructions` en `src/lib/content-engine/prompts.ts`
3. Agregar label en `FORMAT_LABELS` en `ContentPanel.tsx`
4. Agregar al array `FORMATS` en `brand.ts`

---

## Variables de entorno necesarias

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `OPENAI_API_KEY` | Opcional (pero necesaria para IA real) | Habilita GPT-4o para copy y DALL-E 3 para imágenes. Sin ella, el sistema usa fallback determinístico para copy y devuelve 503 en generate-image. |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role key para operaciones admin (insertar posts, subir imágenes) |
| `ADMIN_SECRET` | Sí | Secret para validar cookies admin |

---

## Pasos de prueba end-to-end

### Sin OPENAI_API_KEY (modo desarrollo)

1. Ir a `/admin/content`
2. Click **✨ Generar 7 posts**
3. Verificar que aparecen 7 posts con `status=draft`, `generation_status=copy_ready`
4. Cada post tiene topic, pillar, format, hook, cta, caption, hashtags, image_prompt
5. Click **✍️ Regenerar copy** en un post → actualiza caption/hashtags con fallback
6. Click **✨ Generar imagen** → responde 503 (esperado sin API key)
7. Subir imagen manualmente con **+ Subir imagen**
8. Click **✓ Aprobar programación** → `status=approved`
9. Verificar que Make publica el post cuando llega la fecha

### Con OPENAI_API_KEY

1. Mismo flujo pero los pasos 2 y 5 usan GPT-4o real
2. Paso 6 genera imagen real con DALL-E 3 y la sube a Storage
3. Verificar `image_url` en Supabase apunta al bucket `post-images`

### Verificar posted no puede republicarse

1. Buscar un post con `status=posted`
2. Confirmar que los botones "Aprobar programación" y "Publicar ahora" no aparecen
3. Solo aparece el botón "Eliminar"

---

## Arquitectura de archivos

```
src/
  lib/
    content-engine/
      brand.ts         ← Config de marca + tipos
      prompts.ts       ← Prompts maestros (4 formatos)
  app/
    api/
      admin/
        content/
          generate-week/route.ts    ← POST genera 7 posts
          generate-image/route.ts   ← POST genera imagen DALL-E
          regenerate-copy/route.ts  ← POST regenera copy
        posts/
          route.ts        ← GET lista posts
          [id]/route.ts   ← PUT actualiza, DELETE elimina
    admin/
      content/
        page.tsx          ← Server component (auth guard)
        ContentPanel.tsx  ← Client component principal
supabase/
  migrations/
    20260607_add_content_engine_fields.sql
docs/
  content-engine.md  ← Este archivo
```
