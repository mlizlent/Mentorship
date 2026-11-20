-- +migrate Up
CREATE TABLE mentor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT NOT NULL DEFAULT '',
    expertise TEXT[] NOT NULL DEFAULT '{}',
    years_experience INTEGER NOT NULL DEFAULT 0,
    hours_per_month INTEGER NOT NULL DEFAULT 0,
    languages TEXT[] NOT NULL DEFAULT '{}',
    availability JSONB NOT NULL DEFAULT '{}',
    max_mentees INTEGER NOT NULL DEFAULT 3,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentor_profiles_expertise ON mentor_profiles USING GIN (expertise);
CREATE INDEX idx_mentor_profiles_verified ON mentor_profiles (verified_at);

-- +migrate Down
DROP INDEX IF EXISTS idx_mentor_profiles_verified;
DROP INDEX IF EXISTS idx_mentor_profiles_expertise;
DROP TABLE IF EXISTS mentor_profiles;
