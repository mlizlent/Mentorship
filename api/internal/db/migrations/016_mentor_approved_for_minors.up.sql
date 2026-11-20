ALTER TABLE mentor_profiles
    ADD COLUMN IF NOT EXISTS approved_for_minors BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_approved_for_minors ON mentor_profiles (approved_for_minors);
