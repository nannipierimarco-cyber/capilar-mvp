CREATE TABLE IF NOT EXISTS dental_patients (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  telefono      TEXT NOT NULL,
  email         TEXT NOT NULL,
  answers       JSONB,
  analysis      JSONB,
  overall_score INT,
  urgency_level TEXT CHECK (urgency_level IN ('alta', 'media', 'baja')),
  status        TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'converted')),
  doctor_id     UUID,
  doctor_notes  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dental_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access dental" ON dental_patients USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_dental_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dental_patients_updated_at
  BEFORE UPDATE ON dental_patients
  FOR EACH ROW EXECUTE FUNCTION update_dental_updated_at();

CREATE INDEX IF NOT EXISTS dental_patients_status_idx ON dental_patients (status);
CREATE INDEX IF NOT EXISTS dental_patients_urgency_idx ON dental_patients (urgency_level);
CREATE INDEX IF NOT EXISTS dental_patients_created_idx ON dental_patients (created_at DESC);
