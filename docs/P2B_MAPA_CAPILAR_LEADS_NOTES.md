# P2-B — Leads de Mapa Capilar en el Admin

> Implementado el 2026-05-13.

## Problema resuelto

Los leads que completaban el flujo de Mapa Capilar (email + WhatsApp) se guardaban
en `hair_map_leads` pero no aparecían en el admin de forma accionable: sin detalle,
sin reporte AI vinculado, sin posibilidad de dar seguimiento.

## Estructura implementada

### SQL — ejecutar en Supabase antes de deploy

```sql
-- 1. Origen del lead en patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'quiz';
-- valores: 'quiz' | 'mapa_capilar'

-- 2. Vincular análisis AI al paciente
ALTER TABLE hair_map_analyses ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
```

### Flujo resultante

```
Usuario completa mapa-capilar → /mapa-capilar/analizando
  → /api/mapa-capilar/analyze crea hair_map_analyses (sin cambios)
  → ID del análisis guardado en sessionStorage como mapa_capilar_analysis_id

Usuario llena email + WhatsApp en /mapa-capilar/reporte
  → reporte page incluye analysisId en el POST a save-lead

/api/mapa-capilar/save-lead:
  1. Upsert en patients (source='mapa_capilar', status='lead', email, phone)
  2. UPDATE hair_map_analyses SET patient_id = patient.id WHERE id = analysisId
  3. Sigue escribiendo en hair_map_leads (backward compat)
```

### Admin

- Tab "Mapa Capilar AI" ahora lee de `patients WHERE source='mapa_capilar'`
  joined con `hair_map_analyses` para mostrar el objetivo del análisis.
- Cada fila tiene "Ver →" que abre `/admin/mapa-capilar/[patient_id]`.
- Página de detalle muestra contacto + reporte AI completo.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/app/api/mapa-capilar/save-lead/route.ts` | Upsert en patients + vincula hair_map_analyses |
| `src/app/mapa-capilar/reporte/page.tsx` | Envía analysisId en el POST |
| `src/app/admin/page.tsx` | Tab mapa-capilar lee de patients |
| `src/app/admin/mapa-capilar/[id]/page.tsx` | Nueva página de detalle del lead |
| `src/lib/types.ts` | Patient.source: string \| null |
