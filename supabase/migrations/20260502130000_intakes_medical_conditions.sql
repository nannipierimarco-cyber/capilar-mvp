-- medical_conditions array for intakes (multi-select from quiz step)
alter table public.intakes add column if not exists medical_conditions text[];
