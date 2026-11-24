CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_given_at TIMESTAMPTZ,
    consent_withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, mentee_id)
);

CREATE INDEX idx_guardians_mentee ON guardians (mentee_id);
