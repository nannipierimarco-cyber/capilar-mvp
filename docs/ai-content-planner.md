# AI Content Planner — Perfecto Labs

Capa de generación de contenido sobre el Content Engine existente. Permite crear posts de Instagram desde un brief maestro escrito por el usuario, conectando todos los textos, hashtags, image_prompts y video_scripts a una misma fuente creativa.

## Qué es

El AI Content Planner es un módulo dentro de `/admin/content` que interpreta un brief libre de texto y genera una campaña coherente de posts para Instagram. A diferencia del botón "Generar 7 posts" (que genera sin contexto previo), el Planner entiende el objetivo, el tono y el foco de la semana, y produce contenido temáticamente conectado.

## Cómo escribir un brief

El brief es texto libre. Puedes ser tan específico o general como quieras.

**Ejemplo mínimo:**
```
Quiero 5 posts sobre blanqueamiento dental. CTA: agenda una evaluación.
```

**Ejemplo completo:**
```
Quiero 7 contenidos para Perfecto Labs Dental esta semana. Foco en estética dental, precios transparentes y ortodoncia invisible. Tono premium, confiable y moderno. Quiero 3 posts de conversión, 2 educativos, 1 mito/hecho y 1 reel. CTA principal: agenda una evaluación.
```

**Qué puedes especificar en el brief:**
- Foco temático (blanqueamiento, implantes, ortodoncia, limpieza, etc.)
- Mix de formatos (educativos, mito/hecho, precio, reels)
- Objetivo de campaña (leads, awareness, confianza, conversión)
- Tono especial (más cercano, más premium, más urgente)
- CTA específico
- Persona objetivo
- Restricciones especiales

## Cómo se conectan brief, caption e imagen

```
[Brief maestro del usuario]
         │
         ▼
POST /api/admin/content/generate-from-brief
         │
         ├─► GPT-4o interpreta el brief
         │         └─► campaign_brief (tema, tono, estilo, CTA, topics)
         │
         ├─► GPT-4o genera cada post con:
         │         ├─► caption (texto completo con emojis)
         │         ├─► hashtags (15-20)
         │         ├─► image_prompt (para DALL-E 3)
         │         ├─► thumbnail_prompt (para miniatura)
         │         ├─► hook (primera línea gancho)
         │         ├─► cta (call to action)
         │         ├─► visual_direction (descripción visual)
         │         └─► video_script (solo si format=reel_script)
         │
         ├─► Crea content_batch (agrupa todos los posts)
         ├─► Crea content_generation_request (registro del proceso)
         └─► Inserta posts en scheduled_posts con:
                   ├─► batch_id (referencia al batch)
                   ├─► creative_brief (el campaign_brief completo)
                   ├─► content_objective
                   └─► visual_direction
```

**Todos los posts del mismo brief comparten:**
- `campaign_theme` (visible en cada card como "🎯 Tema de campaña")
- `creative_brief` (el JSON completo del brief interpretado)
- `batch_id` (permite agrupar posts de la misma campaña)

## Cómo se crean los batches

Cada vez que haces click en "Generar contenido desde brief", el sistema crea:

1. **content_generation_request** — registro de la solicitud (status: pending → completed)
2. **content_batch** — agrupa los posts generados (con `campaign_theme` y `brief_summary`)
3. **N posts en scheduled_posts** — conectados al batch via `batch_id`

Los batches están en la tabla `content_batches`. Por ahora no tienen UI de gestión independiente — los posts se ven en el panel normal.

## Formulario del AI Content Planner

Campos disponibles en el panel:

| Campo | Descripción | Default |
|-------|-------------|---------|
| Brief | Texto libre describiendo la campaña | — |
| Cantidad | Número de posts a generar (1-14) | 7 |
| Vertical | `dental` o `capilar` | dental |
| Inicio semana | Fecha del primer post | Próximo lunes |
| Objetivo | `awareness`, `education`, `leads`, `conversion`, `trust` | leads |
| CTA principal | Call to action que se repite en todos los posts | Agenda una evaluación |

## Cómo aprobar programación

El flujo de aprobación no cambia con el Planner:

1. El Planner genera posts con `status=draft`
2. Genera imagen con **✨ Generar imagen** (DALL-E 3) o sube manual
3. Edita caption/hashtags si necesitas
4. Click **✓ Aprobar programación** → `status=approved`, Make publica automáticamente

## Cómo publicar ahora

1. Asegura que el post tiene imagen y caption
2. Click **⚡ Publicar ahora**
3. El sistema setea `scheduled_at=now()` y `status=approved`
4. Make lo detecta en máximo 15 minutos y publica en Instagram

## Regenerar desde dirección

Cada card tiene el botón **🧭 Regenerar desde dirección…** que permite dar una instrucción específica para actualizar el copy:

1. Click en "Regenerar desde dirección…"
2. Escribe la instrucción: `"hazlo más premium y enfocado en precio"`
3. Click "Aplicar dirección"
4. El sistema actualiza: caption, hashtags, image_prompt, hook, visual_direction
5. El `scheduled_at` y `status` no cambian

**Endpoint:** `POST /api/admin/content/regenerate-from-direction`
```json
{ "post_id": "uuid", "direction": "hazlo más premium" }
```

## Cómo Make publica

Make.com NO cambia. El AI Planner solo crea posts con `status=draft`. Make solo actúa cuando:

- `status = approved`
- `image_url` no está vacío
- `scheduled_at <= now()`

**No tocar Make.** Toda la lógica de publicación vive ahí.

## Cómo probar

### Modo desarrollo (sin OPENAI_API_KEY)

1. Ir a `/admin/content`
2. Expandir "AI Content Planner"
3. Escribir cualquier brief de texto
4. Click "Generar contenido desde brief"
5. Verificar que aparecen posts con `status=draft` y badge "🎯 Tema de campaña"
6. El sistema usa fallback determinístico (7 posts dentales predefinidos)

### Modo producción (con OPENAI_API_KEY)

Mismo flujo, pero GPT-4o interpreta el brief real y genera contenido temático coherente.

### Verificar en Supabase

```sql
-- Ver batches creados
SELECT id, title, campaign_theme, objective, count, created_at
FROM content_batches
ORDER BY created_at DESC;

-- Ver posts de un batch específico
SELECT id, topic, format, content_objective, status, scheduled_at
FROM scheduled_posts
WHERE batch_id = 'uuid-del-batch';

-- Ver requests de generación
SELECT id, status, user_prompt, count, completed_at
FROM content_generation_requests
ORDER BY created_at DESC;
```

### API directa

```bash
POST /api/admin/content/generate-from-brief
Content-Type: application/json
Cookie: admin_token=...

{
  "vertical": "dental",
  "user_prompt": "Quiero 3 posts sobre limpieza dental. Tono empático.",
  "count": 3,
  "week_start": "2026-06-09",
  "objective": "leads",
  "primary_cta": "Agenda una evaluación"
}
```

**Respuesta:**
```json
{
  "batch": { "id": "...", "campaign_theme": "..." },
  "posts": [...],
  "campaign_brief": { "campaign_theme": "...", "priority_topics": [...], ... },
  "fallback": false,
  "count": 3
}
```

## Campos nuevos en scheduled_posts

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `batch_id` | uuid | Referencia al content_batch del que viene |
| `generation_request_id` | uuid | Referencia al request de generación |
| `creative_brief` | jsonb | El campaign_brief completo (tema, tono, estilo, CTA, topics) |
| `visual_direction` | text | Descripción visual específica del post |
| `thumbnail_prompt` | text | Prompt para miniatura del video |
| `content_objective` | text | Objetivo específico del post (awareness/leads/etc.) |

## Nuevas tablas

### content_batches
Agrupa posts de un mismo brief. Un batch = una campaña semanal.

### content_generation_requests
Registra cada solicitud de generación. Permite auditar qué briefs se procesaron, cuándo y con qué resultado.

## Arquitectura de archivos

```
src/
  app/
    api/
      admin/
        content/
          generate-from-brief/route.ts     ← POST (nuevo)
          regenerate-from-direction/route.ts ← POST (nuevo)
    admin/
      content/
        ContentPanel.tsx   ← Actualizado con AiContentPlanner + card updates
  lib/
    content-engine/
      prompts.ts   ← Actualizado con buildFromBriefPrompt + buildRegenerateFromDirectionPrompt
supabase/
  migrations/
    20260607_add_content_planner_tables.sql  ← content_batches, content_generation_requests, 6 nuevas cols
docs/
  content-engine.md      ← Documentación del Content Engine base
  ai-content-planner.md  ← Este archivo
```

## Cómo extender formatos

Para agregar un nuevo formato (ej. `carousel`):

1. Añadir `"carousel"` al tipo `PostFormat` en `src/lib/content-engine/brand.ts`
2. Añadir instrucciones en `formatInstructions` en `src/lib/content-engine/prompts.ts`
3. Añadir label en `FORMAT_LABELS` en `ContentPanel.tsx`
4. Añadir al array `FORMATS` en `brand.ts`
5. El AI Planner lo usará automáticamente si el brief lo menciona

## Qué queda para fase 2

- **Gestión de batches:** UI para ver, renombrar y eliminar batches completos
- **Batch actions:** Aprobar todos los posts de un batch de una vez
- **Performance por batch:** Ver métricas agregadas de una campaña
- **Brief history:** Ver y reutilizar briefs anteriores
- **Batch status:** Draft / Scheduled / Partially published / Published
- **Templates de brief:** Briefs predefinidos por tipo de campaña
- **Video generation:** Integración con Runway/Sora para `reel_script` posts
- **A/B testing:** Generar 2 versiones del mismo post desde el mismo brief
