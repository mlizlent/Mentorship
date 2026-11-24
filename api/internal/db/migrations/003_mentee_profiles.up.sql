CREATE TABLE mentee_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    goals TEXT NOT NULL DEFAULT '',
    interests TEXT[] NOT NULL DEFAULT '{}',
    level VARCHAR(50) NOT NULL DEFAULT 'beginner',
    availability JSONB NOT NULL DEFAULT '{}',
    guardian_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
