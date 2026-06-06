-- Marketplace Capilar MVP — Supabase Schema

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  rut text,
  email text not null,
  phone text not null,
  age integer,
  sex text check (sex in ('male', 'female')),
  city text,
  created_at timestamptz default now()
);

create table public.intakes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  journey_type text check (journey_type in ('treatment', 'transplant', 'both')),
  hair_loss_duration text,
  main_area text,
  sudden_or_gradual text,
  loss_in_patches boolean,
  severe_irritation boolean,
  family_history boolean,
  previous_treatments text[],
  goal text,
  medical_conditions text[],
  -- medical screening
  used_minoxidil boolean,
  used_finasteride boolean,
  used_dutasteride boolean,
  had_side_effects boolean,
  current_medications boolean,
  current_medications_note text,
  drug_allergies boolean,
  drug_allergies_note text,
  heart_disease boolean,
  liver_disease boolean,
  kidney_disease boolean,
  prostate_history boolean,
  planning_children boolean,
  is_pregnant_or_lactating boolean,
  -- transplant
  previous_transplant boolean,
  loss_severity text check (loss_severity in ('mild', 'moderate', 'advanced')),
  transplant_timing text,
  budget_range text,
  financing_interest boolean,
  transplant_priority text,
  prp_interest boolean,
  -- status
  status text default 'lead' check (status in (
    'lead', 'completed_quiz', 'paid', 'consultation_scheduled',
    'medically_reviewed', 'prescription_sent', 'pharmacy_ordered',
    'shipped', 'active_subscription', 'referred_to_clinic',
    'prp_closed', 'transplant_closed', 'not_eligible'
  )),
  admin_notes text,
  created_at timestamptz default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  intake_id uuid references public.intakes(id) on delete cascade,
  type text check (type in ('frontal', 'temples', 'crown', 'side')),
  url text not null,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  plan_type text,
  amount integer,
  payment_status text default 'pending',
  payment_provider text,
  subscription_status text default 'pending',
  created_at timestamptz default now()
);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid,
  scheduled_at timestamptz,
  status text default 'pending',
  medical_decision text,
  notes text,
  created_at timestamptz default now()
);

create table public.pharmacy_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  pharmacy_partner text,
  prescription_status text default 'pending',
  dispatch_status text default 'pending',
  tracking_number text,
  created_at timestamptz default now()
);

create table public.clinic_referrals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  clinic_partner text,
  procedure_type text check (procedure_type in ('PRP', 'transplant')),
  status text default 'pending',
  expected_fee integer,
  closed_fee integer,
  created_at timestamptz default now()
);

-- Storage bucket for patient photos
insert into storage.buckets (id, name, public) values ('patient-photos', 'patient-photos', true);

-- RLS Policies (allow anon insert for quiz, restrict reads)
alter table public.patients enable row level security;
alter table public.intakes enable row level security;
alter table public.photos enable row level security;
alter table public.orders enable row level security;
alter table public.consultations enable row level security;
alter table public.pharmacy_orders enable row level security;
alter table public.clinic_referrals enable row level security;

-- Allow anonymous inserts (quiz submission)
create policy "allow anon insert patients" on public.patients for insert with check (true);
create policy "allow anon insert intakes" on public.intakes for insert with check (true);
create policy "allow anon insert photos" on public.photos for insert with check (true);

-- Allow reads by service role (admin)
create policy "allow service read patients" on public.patients for select using (true);
create policy "allow service read intakes" on public.intakes for select using (true);
create policy "allow service read photos" on public.photos for select using (true);
create policy "allow service update intakes" on public.intakes for update using (true);

-- Storage policy
create policy "allow anon upload photos" on storage.objects for insert with check (bucket_id = 'patient-photos');
create policy "allow public read photos" on storage.objects for select using (bucket_id = 'patient-photos');

-- AI Doctor Reports
create table public.ai_doctor_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  intake_id uuid not null references public.intakes(id) on delete cascade,
  summary_for_doctor text,
  preliminary_route text,
  risk_level text,
  red_flags jsonb,
  doctor_questions jsonb,
  possible_considerations jsonb,
  operational_next_step text,
  patient_facing_copy_suggestion text,
  internal_note text,
  model_name text,
  photo_observation jsonb,
  created_at timestamptz default now()
);

-- Migration for existing databases:
-- alter table public.ai_doctor_reports add column if not exists photo_observation jsonb;

alter table public.ai_doctor_reports enable row level security;
create policy "allow service read ai_doctor_reports" on public.ai_doctor_reports for select using (true);
create policy "allow service insert ai_doctor_reports" on public.ai_doctor_reports for insert with check (true);

-- ============================================================
-- Doctor Portal
-- ============================================================

-- Doctor Profiles (linked to Supabase Auth users)
create table public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  specialty text,
  license_number text,
  calendly_url text,
  availability_notes text,
  max_consultations_per_day integer,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Medical Reviews (one active review per intake)
create table public.medical_reviews (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  intake_id uuid references public.intakes(id) on delete cascade,
  doctor_id uuid references public.doctor_profiles(id),
  status text default 'pending_assignment' check (status in (
    'pending_assignment', 'pending_booking', 'consultation_booked',
    'pending_review', 'needs_more_info', 'approved_to_advance',
    'not_eligible_online', 'referred_to_clinic', 'completed'
  )),
  medical_decision text,
  doctor_notes text,
  consultation_scheduled_at timestamptz,
  calendly_event_url text,
  -- TODO Phase 2: populated by Calendly webhook (invitee.created)
  -- webhook fires → match by intake_id/email → update consultation_scheduled_at + calendly_event_url → status = consultation_booked
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint medical_reviews_intake_id_key unique (intake_id)
);

-- RLS for doctor_profiles
alter table public.doctor_profiles enable row level security;
-- Authenticated doctors can read their own profile
create policy "doctors can read own profile" on public.doctor_profiles
  for select using (auth.uid() = user_id);
-- Service role bypasses RLS — no explicit policy needed for admin operations

-- RLS for medical_reviews
alter table public.medical_reviews enable row level security;
-- Authenticated doctors can read reviews assigned to them
create policy "doctors can read assigned reviews" on public.medical_reviews
  for select using (
    doctor_id in (select id from public.doctor_profiles where user_id = auth.uid())
  );
-- Authenticated doctors can update their own assigned reviews
create policy "doctors can update assigned reviews" on public.medical_reviews
  for update using (
    doctor_id in (select id from public.doctor_profiles where user_id = auth.uid())
  );

-- ============================================================
-- Migration SQL (run on existing databases):
-- create table public.doctor_profiles ( ... );  -- see above
-- create table public.medical_reviews ( ... );   -- see above
-- (full statements above — run the entire Doctor Portal block)
-- ============================================================

-- ============================================================
-- Flow Payment Migration (Sprint 4)
-- Run on existing databases that already have the orders table.
-- ============================================================
alter table public.orders
  add column if not exists intake_id uuid references public.intakes(id) on delete set null,
  add column if not exists plan text,
  add column if not exists currency text default 'CLP',
  add column if not exists status text default 'payment_pending',
  add column if not exists provider_order_id text,
  add column if not exists provider_token text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_status text,
  add column if not exists paid_at timestamptz,
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Add index for webhook lookups by provider_token
create index if not exists orders_provider_token_idx on public.orders (provider_token);
-- Add index for looking up order by intake
create index if not exists orders_intake_id_idx on public.orders (intake_id);

-- Membership columns (Sprint 5 — membership plan selection)
alter table public.orders
  add column if not exists membership_months integer,
  add column if not exists membership_monthly_price integer,
  add column if not exists shipping_amount integer default 3990;

-- ============================================================
-- Calendly Integration Migration (Sprint — post-payment scheduling)
-- Run these on existing databases:
-- ============================================================

-- doctor_profiles: Calendly metadata per doctor
alter table public.doctor_profiles
  add column if not exists calendly_event_type_uri text,
  add column if not exists calendly_user_uri text,
  add column if not exists calendly_is_active boolean default true;

-- medical_reviews: Calendly webhook fields (populated by Phase 2 webhook)
alter table public.medical_reviews
  add column if not exists calendly_event_uri text,
  add column if not exists calendly_invitee_uri text,
  add column if not exists calendly_invitee_email text;

-- ============================================================
-- Vertical per doctor (P0 — HubSpot appointment automation)
-- Run on existing databases:
-- ============================================================
alter table public.doctor_profiles
  add column if not exists vertical text check (vertical in ('dental', 'hair', 'skin'));
