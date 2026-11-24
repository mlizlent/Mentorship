CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INTEGER NOT NULL DEFAULT 30,
    meeting_link TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    mentor_notes TEXT NOT NULL DEFAULT '',
    mentee_notes TEXT NOT NULL DEFAULT '',
    mentee_rating INTEGER CHECK (mentee_rating >= 1 AND mentee_rating <= 5),
    mentor_rating INTEGER CHECK (mentor_rating >= 1 AND mentor_rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_mentorship ON sessions (mentorship_id);
CREATE INDEX idx_sessions_scheduled_at ON sessions (scheduled_at);
CREATE INDEX idx_sessions_status ON sessions (status);
