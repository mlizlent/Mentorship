-- +migrate Up
CREATE TABLE mentorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    request_message TEXT NOT NULL DEFAULT '',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentorships_mentor ON mentorships (mentor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mentorships_mentee ON mentorships (mentee_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_mentorships_unique_open_request ON mentorships (mentor_id, mentee_id) WHERE status = 'requested' AND deleted_at IS NULL;

-- +migrate Down
DROP INDEX IF EXISTS idx_mentorships_unique_open_request;
DROP INDEX IF EXISTS idx_mentorships_mentee;
DROP INDEX IF EXISTS idx_mentorships_mentor;
DROP TABLE IF EXISTS mentorships;
