# CrownPath System Design

## Overview

CrownPath is a mentorship platform connecting mentees with verified mentors across African tech.
Built as a monorepo with a Go backend and React frontend.

## Architecture

### Monorepo
- `api/` — Go backend (net/http, go-chi, pgx)
- `web/` — React frontend (Vite, React Router, TanStack Query)
- Single CI pipeline, shared config conventions

### Backend (Go)

**Layering:**
- `cmd/server/main.go` — HTTP server, router, DB pool, migration runner
- `internal/auth/` — JWT, password hashing, auth middleware
- `internal/users/` — registration, login, /me, blocks, reports
- `internal/mentors/` — mentor listing, public profile
- `internal/mentorships/` — mentorship CRUD
- `internal/sessions/` — session CRUD
- `internal/goals/` — goal CRUD
- `internal/matching/` — pure Go scoring (no DB access)
- `internal/admin/` — admin-only routes (verify mentors, reports, metrics, CSV)
- `internal/db/` — pgx queries, migrations, connection pool
- `internal/httpx/` — JSON helpers, logger middleware

**Router (chi):**
```
GET/POST /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/me
PUT    /api/v1/me
GET    /api/v1/me/blocks
POST   /api/v1/me/blocks
DELETE /api/v1/me/blocks/{id}
POST   /api/v1/me/reports
GET    /api/v1/profiles/{role}
PUT    /api/v1/profiles/{role}
GET    /api/v1/mentors
GET    /api/v1/mentors/{id}
GET    /api/v1/matches/suggestions
POST   /api/v1/mentorships
GET    /api/v1/mentorships
PATCH  /api/v1/mentorships/{id}
POST   /api/v1/mentorships/{id}/sessions
GET    /api/v1/mentorships/{id}/sessions
POST   /api/v1/mentorships/{id}/goals
GET    /api/v1/mentorships/{id}/goals
PATCH  /api/v1/sessions/{id}
PATCH  /api/v1/goals/{id}
GET    /api/v1/admin/mentors
PATCH  /api/v1/admin/mentors/{id}/verify
GET    /api/v1/admin/reports
PATCH  /api/v1/admin/reports/{id}
GET    /api/v1/admin/metrics
GET    /api/v1/admin/metrics/export.csv
```

### Frontend (React)

- React Router with protected routes wrapped in `Layout`
- TanStack Query for server state
- React Hook Form + Zod for forms
- UI component library: Button, Input, Textarea, Select, Checkbox, Card, Badge, Modal, Toast, Spinner, EmptyState, Tabs, Avatar
- Tailwind CSS with primary color `#DA70D6` (orchid), dark purple `#1A0D29` background, IBM Plex Mono

### Pages
- `/` — LandingPage
- `/login` — LoginPage
- `/register` — RegisterPage
- `/home` — HomePage (dashboard)
- `/mentors` — MentorsPage
- `/mentors/:id` — MentorDetailPage
- `/mentorships` — MentorshipsPage
- `/profile` — ProfilePage
- `/design` — DesignPage

## Data Model

All tables use UUID primary keys via `pgcrypto.gen_random_uuid()`. Timestamps are `TIMESTAMPTZ` (UTC).

**users:** id, email, password_hash, role (mentee|mentor|admin), full_name, date_of_birth, county, language, status, created_at, updated_at, deleted_at (soft delete)

**mentor_profiles:** user_id, bio, expertise (text[]), years_experience, hours_per_month, languages (text[]), availability (jsonb), max_mentees, verified_at, verified_by

**mentee_profiles:** user_id, bio, goals, interests, availability

**guardians:** id, user_id, email, full_name, phone, created_at

**mentorships:** id, mentor_id, mentee_id, status (requested|active|paused|completed|cancelled), request_message, start_date, end_date, created_at, updated_at, deleted_at

**sessions:** id, mentorship_id, scheduled_at, duration_min, meeting_link, status, mentor_notes, mentee_notes, mentee_rating, mentor_rating, created_at, updated_at

**goals:** id, mentorship_id, title, target_date, status (pending|completed|cancelled), created_at, updated_at

**reports:** id, reporter_id, target_user_id, reason, status (open|resolved), resolved_by, resolution_note, created_at, updated_at

**user_blocks:** blocker_id, blocked_id, created_at (PK = blocker_id + blocked_id)

**refresh_tokens:** id, user_id, token_hash, expires_at, revoked_at, created_at

**admin_access_log:** id, admin_id, action, target_type, target_id, created_at

**notifications_outbox:** id, user_id, type, payload, send_at, sent_at, attempts, created_at

**policy_versions:** id, title, version, content, effective_at, created_at

**policy_acceptances:** id, user_id, policy_version_id, accepted_at, ip_hash

**consent_events:** id, guardian_id, mentee_id, event, timestamp, ip_hash

## Security

### Authentication
- JWT access token (short-lived) in HTTP-only cookie
- Refresh token in HTTP-only cookie
- Role is NOT in JWT; loaded from DB per request

### Authorization
- Admin middleware checks `users.role = 'admin'`
- Block list prevents blocked users from interacting
- Self-block and self-report are rejected
- Admin access log records every admin read of personal data

### Data Protection
- Soft deletes on users and mentorships
- Reports resolved with resolution_note
- /me/export and DELETE /me planned (issue 21)

## Matching

Pure Go scoring module with configurable weights:
- Skills: 40%
- Availability: 25%
- Capacity: 15%
- Language: 10%
- Experience fit: 10%

## Notifications

Outbox pattern: business code inserts into `notifications_outbox`; background worker sends with retries and exponential backoff (planned, not yet implemented).

## Configuration

All configuration via environment variables (see `.env.example`).
