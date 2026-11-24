CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'mentee',
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    county VARCHAR(100),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_status ON users (status);
