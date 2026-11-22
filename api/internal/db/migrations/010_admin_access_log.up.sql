-- +migrate Up
CREATE TABLE admin_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_access_log_admin ON admin_access_log (admin_id);
CREATE INDEX idx_admin_access_log_created ON admin_access_log (created_at);

-- +migrate Down
DROP INDEX IF EXISTS idx_admin_access_log_created;
DROP INDEX IF EXISTS idx_admin_access_log_admin;
DROP TABLE IF EXISTS admin_access_log;
