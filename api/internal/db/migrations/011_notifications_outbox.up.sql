-- +migrate Up
CREATE TABLE notifications_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    send_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_outbox_send_at ON notifications_outbox (send_at) WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_outbox_user ON notifications_outbox (user_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_notifications_outbox_user;
DROP INDEX IF EXISTS idx_notifications_outbox_send_at;
DROP TABLE IF EXISTS notifications_outbox;
