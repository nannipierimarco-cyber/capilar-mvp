-- RUT u otro documento de identidad del paciente
alter table public.patients add column if not exists national_id text;
