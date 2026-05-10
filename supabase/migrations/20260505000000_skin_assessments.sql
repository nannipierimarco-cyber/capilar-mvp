-- ─────────────────────────────────────────────────────────────
-- Skin Assessments — tabla + RLS + bucket storage policies
-- Vertical separada de hair care. No usar tabla intakes/patients.
-- ─────────────────────────────────────────────────────────────

-- ── Tabla ─────────────────────────────────────────────────────

create table if not exists public.skin_assessments (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz default now(),

  -- Tipo de evaluación (siempre 'skin')
  assessment_type             text not null default 'skin',

  -- Datos personales
  full_name                   text not null,
  email                       text not null,
  phone                       text not null,
  age                         integer,
  weight_kg                   numeric,
  height_cm                   numeric,
  sex_at_birth                text,
  country                     text,
  city                        text,

  -- Step 1 — Motivo principal
  main_concern                text,
  skin_category               text,   -- acne | hyperpigmentation | acne_marks_scars | oily_pores |
                                      -- dry_irritated | rosacea_redness | texture_aging |
                                      -- mole_lesion_review | wound_non_healing | other

  -- Step 2 — Ubicación
  affected_areas              jsonb,  -- string[]

  -- Step 3 — Evolución
  duration                    text,
  progression                 text,

  -- Step 4 — Tipo de lesión
  lesion_description          jsonb,  -- string[]

  -- Step 5 — Síntomas
  concern_score               integer check (concern_score between 1 and 10),
  symptoms                    jsonb,  -- string[]

  -- Step 7 — Rutina actual
  current_routine             jsonb,  -- string[]
  active_ingredients_frequency text,
  irritation_from_routine     text,

  -- Step 8 — Tratamientos anteriores
  previous_treatments         jsonb,  -- string[]
  previous_treatment_response text,

  -- Step 9 — Antecedentes
  pregnancy_status            text,
  medical_conditions          jsonb,  -- string[]
  current_medications         text,
  allergies                   text,

  -- Step 10 — Red flags
  red_flags                   jsonb,  -- string[]

  -- Step 11 — Objetivo
  main_goal                   text,
  preference                  text,

  -- Step 12 — Notas libres
  additional_notes            text,

  -- Fotos (URLs en Supabase Storage, bucket: skin-assessment-photos)
  photo_urls                  jsonb default '[]'::jsonb,   -- string[]
  product_photo_urls          jsonb default '[]'::jsonb,   -- string[]

  -- Lógica de negocio generada en el servidor
  priority                    text default 'normal'
                                check (priority in ('urgent_review', 'high', 'normal')),
  status                      text default 'new'
                                check (status in ('new', 'reviewed', 'archived')),
  doctor_summary              text,
  raw_answers                 jsonb
);

-- Índices útiles para el dashboard admin
create index if not exists skin_assessments_created_at_idx
  on public.skin_assessments (created_at desc);

create index if not exists skin_assessments_priority_idx
  on public.skin_assessments (priority);

create index if not exists skin_assessments_status_idx
  on public.skin_assessments (status);

-- ── Row Level Security ────────────────────────────────────────

alter table public.skin_assessments enable row level security;

-- Cualquier visitante puede insertar su propia evaluación
create policy "skin_assessments_insert_anon"
  on public.skin_assessments
  for insert
  to anon, authenticated
  with check (true);

-- Solo el service role puede leer y modificar (panel admin usa service role)
create policy "skin_assessments_select_service"
  on public.skin_assessments
  for select
  to service_role
  using (true);

create policy "skin_assessments_update_service"
  on public.skin_assessments
  for update
  to service_role
  using (true)
  with check (true);

-- ── Storage: bucket skin-assessment-photos ────────────────────
--
-- El bucket debe crearse manualmente en el Dashboard de Supabase
-- o con el CLI:
--
--   supabase storage create skin-assessment-photos --public
--
-- Las políticas de Storage se configuran en storage.objects:

-- Permitir subir fotos desde el cliente (anon key)
create policy "skin_photos_upload_anon"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'skin-assessment-photos');

-- Permitir leer las fotos públicamente (para mostrarlas en el admin)
create policy "skin_photos_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'skin-assessment-photos');

-- Solo service role puede eliminar fotos
create policy "skin_photos_delete_service"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'skin-assessment-photos');
