-- +migrate Up
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_mentorship ON goals (mentorship_id);
CREATE INDEX idx_goals_status ON goals (status);

-- +migrate Down
DROP INDEX IF EXISTS idx_goals_status;
DROP INDEX IF EXISTS idx_goals_mentorship;
DROP TABLE IF EXISTS goals;
