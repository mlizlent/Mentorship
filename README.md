# Malkia Mentor

Mentorship app for Malkia Labs — a women-led tech startup from Zone01 Kisumu, Kenya. The app lets mentees find and request mentors, lets mentors accept or decline, and tracks sessions, goals and progress. Admins verify mentors and watch impact.

## Tech stack

- **Backend:** Go 1.26, PostgreSQL, chi router, pgx, golang-migrate, bcrypt, JWT, validator, slog
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Vitest
- **CI:** GitHub Actions

## Repository layout

```
/api/                    # Go backend
  cmd/server/            # main.go
  internal/
    config/              # configuration from env
    auth/                # JWT, refresh tokens, auth middleware
    users/               # register, login, refresh, logout, /me
    profiles/            # mentor and mentee profiles
    mentors/             # mentor browsing
    mentorships/         # request lifecycle
    matching/            # pure matching logic
    sessions/            # sessions API
    goals/               # goals API
    notifications/       # outbox pattern
    httpx/               # middleware, error helpers
    db/                  # queries, migrations, seed
  scripts/seed.go        # seed script
/web/                    # React + Vite + Tailwind frontend
.github/workflows/ci.yml # CI pipeline
docker-compose.yml       # PostgreSQL + Mailhog
Makefile                 # dev targets
DECISIONS.md             # architecture decisions
README.md                # this file
```

## Local setup

### Prerequisites

- Go 1.26+
- Node 22+ and npm
- Docker and Docker Compose

### Backend

```bash
# Start PostgreSQL
make db-up

# Run migrations
make migrate

# Seed the database (creates admin, mentors, mentees)
make seed

# Run the API server
make run-api
```

The API runs on `http://localhost:8080`.

### Frontend

```bash
make run-web
```

The frontend runs on `http://localhost:5173` with a proxy to the API.

### Full dev stack

```bash
make dev
```

## Seeded accounts

After `make seed`, the following accounts are available (development only):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@malkia.local | admin123 |
| Mentor 1-8 | mentor1@malkia.local ... mentor8@malkia.local | mentor123 |
| Mentee 1-10 | mentee1@malkia.local ... mentee10@malkia.local | mentee123 |

## Environment variables

### Backend (`api/.env`)

```
PORT=8080
ENVIRONMENT=development
DATABASE_URL=postgres://malkia:malkia@localhost:5432/malkia?sslmode=disable
JWT_SECRET=change-me-in-production
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=168h
BCRYPT_COST=12
MENTOR_CAPACITY=3
WEIGHT_SKILLS=40
WEIGHT_AVAILABILITY=25
WEIGHT_CAPACITY=15
WEIGHT_LANGUAGE=10
WEIGHT_EXPERIENCE_FIT=10
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@malkia.local
FRONTEND_URL=http://localhost:5173
```

### Frontend (`web/.env`)

```
VITE_API_URL=http://localhost:8080/api/v1
```

## Make targets

| Target | Description |
|--------|-------------|
| `make db-up` | Start PostgreSQL and Mailhog with Docker Compose |
| `make db-down` | Stop Docker Compose services |
| `make migrate` | Run database migrations |
| `make seed` | Seed the database with test data |
| `make run-api` | Run the Go API server |
| `make run-web` | Run the Vite dev server |
| `make test` | Run backend and frontend tests |
| `make lint` | Run golangci-lint and ESLint |
| `make dev` | Start db, migrate, seed, then run API and web |

## Testing

```bash
# Backend tests (requires PostgreSQL)
make test

# Or directly
cd api && go test ./...

# Frontend tests
cd web && npm test

# Lint
make lint
```

## CI

GitHub Actions runs on every push and pull request:
- Backend: golangci-lint, go test with PostgreSQL service container
- Frontend: npm install, ESLint, TypeScript type-check, Vitest

## Design system

Primary color: purple (`#7C3AED` / `primary-600`). Defined once in `web/tailwind.config.ts` and used throughout the frontend and email templates.

## Decisions

See `DECISIONS.md` for architecture and implementation decisions.

## Out of scope

Admin dashboard, reports and blocking, guardian consent and under-18 accounts, in-app messaging, SMS or WhatsApp, Swahili translation, group circles, Q&A board, events and badges.
