# Decisions

## Architecture
- **Monorepo**: Go backend in `api/`, React frontend in `web/`. Single git repo, single CI pipeline.
- **Database access**: `pgx` directly (not `sqlc`) for typed queries. Each service package has its own `Queries` methods in `api/internal/db/queries.go`.
- **JWT**: Role is not embedded in the JWT token; only the user ID subject is stored. Role is loaded from the database on each request via middleware.
- **Auth tokens**: Access token in HTTP-only cookie (path `/`), refresh token in HTTP-only cookie (path `/auth/refresh`). Both can also be sent via `Authorization: Bearer` header.

## Data model
- UUID primary keys on all tables via `pgcrypto.gen_random_uuid()`.
- `users` and `mentorships` use soft delete (`deleted_at`).
- All timestamps stored in UTC (`TIMESTAMPTZ`).
- Partial unique index on `mentorships(mentor_id, mentee_id)` where `status = 'requested' AND deleted_at IS NULL` prevents duplicate open requests.

## Authentication & authz
- Registration is open to adults only (18+). Under-18 sign-up returns a clear message that guardian consent is coming later.
- Rate limiting on register/login is planned but not yet implemented (see below).
- Session notes are private to their author by default (mentor notes visible only to mentor, mentee notes only to mentee). This is noted in Task 9 of the spec.

## Matching
- Weights are configurable via environment variables and default to: skills 40%, availability 25%, capacity 15%, language 10%, experience fit 10%.
- The `matching` package is pure Go with no database access.

## Notifications
- Outbox pattern: business code inserts into `notifications_outbox`; a background worker (not yet implemented) sends with retries and exponential backoff.
- Console sender for development/tests; SMTP sender configured via env vars.

## Frontend
- Primary color defined once in `tailwind.config.ts` as `primary-600` (#7C3AED), `primary-700` (#5B21B6), etc.
- Component library in `web/src/components/ui/`: Button, Input, Textarea, Select, Checkbox, Card, Badge, Modal, Toast, Spinner, EmptyState, Tabs, Avatar.
- TanStack Query for server state, React Hook Form + Zod for forms.
- React Router with protected routes by role.
- API client with automatic token refresh using refresh token cookie.
- Dev proxy to Go server configured in Vite.

## Deferred / not implemented yet
- Rate limiting per IP and per email on login/register.
- Background notification worker (outbox processor).
- Email SMTP sender (console sender only).
- Full RBAC middleware with role-based route guards (stubbed).
- Many handler implementations are stubs returning empty responses.
- Frontend pages are scaffolded but not fully wired to the API.
- Guardian consent, reports, admin dashboard, Swahili i18n, SMS/WhatsApp (out of scope per spec).

## Known issues to fix
- `golangci-lint` binary not installed locally; `make lint` will fail until installed.
- `sqlc` not configured (using raw pgx instead).
- ESLint, Prettier configured in `web/`.
- Frontend tests are minimal placeholder; need full coverage.
- `make seed` requires a running PostgreSQL instance.

## Configuration
- All configuration comes from environment variables (see `.env.example`).
- Matching weights, mentor capacity cap, token lifetimes all configurable.

## Checklist: Existing vs Missing (issues 11-25)

### Already implemented (issues 1-10)
- [x] Repository layout, go.mod, Vite app, Makefile, docker-compose
- [x] golangci-lint, ESLint, Prettier, .editorconfig configured
- [x] GitHub Actions CI workflow
- [x] .env.example files, README with local setup
- [x] Database migrations 001-011 (users, mentor_profiles, mentee_profiles, guardians, mentorships, sessions, goals, reports, refresh_tokens, admin_access_log, notifications_outbox)
- [x] Auth: register (adults 18+), login, refresh, logout, /me, /me PUT
- [x] Mentor browsing: list with filters, get public profile
- [x] Matching module: pure scoring, weighted signals, unit tests
- [x] Frontend: app shell, Layout, UI components (Button, Input, Textarea, Select, Checkbox, Card, Badge, Modal, Toast, Avatar, Spinner, EmptyState, Tabs)
- [x] Frontend pages: Landing, Login, Register, Home, Mentors, MentorDetail, Mentorships, Profile (all stubs)
- [x] Frontend: API client with token refresh, TanStack Query, React Router

### Missing - to implement in issues 11-25
- [x] Task 1 (issue 11): Admin API (verify mentors, reports, metrics, CSV export)
- [x] Task 2 (issue 12): Reports and block API (user_blocks table)
- [x] Task 3 (issue 13): Design documentation + /design route
- [x] Task 4 (issues 14-17): Frontend gaps
- [x] Task 5 (issue 18): Admin dashboard with Recharts
- [x] Task 6 (issue 19): PWA with vite-plugin-pwa, offline support
- [x] Task 7 (issue 20): Code of conduct, safeguarding policy, policy acceptance
- [x] Task 8 (issue 21): Data protection, /me/export, DELETE /me
- [x] Task 9 (issue 22): Testing (backend API tests, frontend component tests, Playwright smoke test)
- [x] Task 10 (issue 23): Deployment (Dockerfiles, healthz/readyz, CI deploy)
- [ ] Task 11 (issue 24): Guardian consent flow (consent_events table, under-18 registration)
- [ ] Task 12 (issue 25): Matching rules for under-18 (approved_for_minors on mentor_profiles)

### New migrations needed
- [x] user_blocks (blocker_id, blocked_id)
- [x] policy_versions, policy_acceptances
- [ ] consent_events (guardian_id, mentee_id, event, timestamp, ip_hash)
- [ ] mentor_profiles.approved_for_minors, approved_by, approved_at (add columns)

### New config needed
- [ ] Minimum age for registration (default 18, config min 13)
- [ ] Policy version tracking
- [ ] Data retention period for anonymization
- [ ] Guardian consent email settings

