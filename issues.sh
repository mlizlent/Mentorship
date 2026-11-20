#!/usr/bin/env bash
# Creates labels, milestones and issues for the Malkia Labs mentorship app.
# Usage: ./create-issues.sh owner/repo   (needs the GitHub CLI, signed in: gh auth login)
set -euo pipefail

REPO="${1:?Usage: ./create-issues.sh owner/repo}"

echo "Creating labels..."
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
label backend  1d76db "Express API and PostgreSQL"
label frontend a2eeef "React PWA"
label design   c5a3ff "UX, UI and brand"
label safety   d93f0b "Safeguarding, privacy and moderation"
label infra    5319e7 "Tooling, CI and deployment"
label docs     0075ca "Policies and documentation"
label mvp      0e8a16 "MVP scope"
label phase-2  fbca04 "Phase 2 scope"
label phase-3  fef2c0 "Phase 3 scope"

echo "Creating milestones..."
milestone() { gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null 2>&1 || echo "  (milestone '$1' may already exist)"; }
milestone "MVP" "Request-to-session loop, admin dashboard, email notifications. Adults only."
milestone "Phase 2" "Guardian consent, messaging, SMS or WhatsApp, Swahili, resource library."
milestone "Phase 3" "Community features, recognition, AI matching, funder reports."

mk() { # title milestone labels body
  gh issue create --repo "$REPO" --title "$1" --milestone "$2" --label "$3" --body "$4"
}

# ---------------------------------------------------------------- MVP
mk "Set up repository, tooling and CI" "MVP" "infra,mvp" 'Monorepo (or two repos) for the Express API and React app.

Acceptance criteria:
- ESLint, Prettier and a shared editorconfig
- CI runs lint and tests on every pull request
- .env.example and a README with local setup steps
- Branch protection on main'

mk "Design PostgreSQL schema and migrations" "MVP" "backend,mvp" 'Tables: users, mentor_profiles, mentee_profiles, guardians, mentorships, sessions, goals, reports. See the Data model section of the design document.

Acceptance criteria:
- Migrations run from scratch and roll back cleanly
- UUID primary keys, created_at and updated_at on every table
- Soft delete for users and mentorships
- Seed script with sample mentors and mentees'

mk "Authentication: register, login, refresh, logout" "MVP" "backend,mvp" 'JWT access tokens and refresh tokens in HTTP-only cookies.

Acceptance criteria:
- POST /auth/register, /auth/login, /auth/refresh, /auth/logout
- Passwords hashed with bcrypt
- Date of birth collected at sign-up
- Rate limiting on login
- Tests for success and failure paths'

mk "Role-based access control middleware" "MVP" "backend,safety,mvp" 'Roles: mentee, mentor, guardian, admin.

Acceptance criteria:
- Middleware that checks role per route
- Users can only read and change their own records
- Session notes readable only by the mentor and mentee of that mentorship
- Admin access to personal data is logged'

mk "Mentor and mentee profile API" "MVP" "backend,mvp" 'Acceptance criteria:
- GET and PUT /me for both profile types
- Mentor fields: bio, expertise, years of experience, hours per month, languages, availability
- Mentee fields: goals, interests, level, availability
- Input validation with Zod'

mk "Mentor browsing API with filters" "MVP" "backend,mvp" 'Acceptance criteria:
- GET /mentors with filters for expertise, language and availability
- Only verified mentors with free capacity appear
- Cursor pagination
- GET /mentors/:id returns the public profile only (no contact details)'

mk "Mentorship request lifecycle API" "MVP" "backend,mvp" 'Statuses: requested, active, paused, completed, declined.

Acceptance criteria:
- POST /mentorships creates a request
- PATCH /mentorships/:id for accept, decline, pause and complete
- Mentor capacity cap (default 3) enforced on accept
- A mentee cannot have duplicate open requests to the same mentor
- Status changes trigger notifications'

mk "Matching score module and suggestions endpoint" "MVP" "backend,mvp" 'Weighted score: skills and interests 40%, availability 25%, capacity 15%, language 10%, experience fit 10%. Weights are starting values and must be configurable.

Acceptance criteria:
- GET /matches/suggestions returns the top 5 mentors with a score breakdown
- Unverified mentors and mentors without capacity are filtered out
- Unit tests cover each signal and edge cases
- Admins can override a match'

mk "Sessions and goals API" "MVP" "backend,mvp" 'Acceptance criteria:
- Create, reschedule and cancel sessions with a meeting link
- Session notes and ratings after each session
- Goals with target date and status, plus milestones
- Times stored in UTC and shown in East Africa Time'

mk "Email notifications and reminders" "MVP" "backend,mvp" 'Acceptance criteria:
- Emails for: request received or answered, session booked or changed, mentor verified
- Reminders 24 hours and 1 hour before a session
- Background job queue with retries
- Notification preferences per user'

mk "Admin API: verify mentors, reports queue, metrics" "MVP" "backend,safety,mvp" 'Acceptance criteria:
- PATCH /admin/mentors/:id/verify
- GET /admin/reports with status filter
- GET /admin/metrics: reach, matching, engagement, outcomes, safety
- CSV export with date, county and cohort filters
- Metrics are aggregated and expose no personal details'

mk "Reports and block API" "MVP" "backend,safety,mvp" 'Acceptance criteria:
- POST /reports with a reason
- Blocking a user hides both profiles from each other
- Reports appear in the admin queue
- Target response time of 24 hours is visible in the admin dashboard'

mk "Design: user flows, wireframes and lilac UI kit" "MVP" "design,mvp" 'Acceptance criteria:
- Flows for mentee, mentor and admin (see the User flows diagram)
- Mobile-first wireframes for every MVP screen
- UI kit in the lilac brand palette with accessible contrast
- Empty, loading and error states
- Handoff to the frontend lead'

mk "Frontend: app shell, routing and auth screens" "MVP" "frontend,mvp" 'Acceptance criteria:
- Vite and React with React Router
- Register, login and logout screens wired to the API
- Protected routes by role
- Shared components: buttons, inputs, cards, toasts'

mk "Frontend: onboarding and profile forms" "MVP" "frontend,mvp" 'Acceptance criteria:
- Step-by-step onboarding for mentees and mentors
- Profile edit screens with validation messages
- Code of conduct accepted before finishing sign-up
- Works on small phone screens'

mk "Frontend: mentor browse, suggestions and request flow" "MVP" "frontend,mvp" 'Acceptance criteria:
- Mentor list with filters and mentor detail page
- Top 5 suggestions with a short reason for each match
- Request form with a message to the mentor
- Request status screen for mentees; accept and decline screen for mentors'

mk "Frontend: sessions, notes and goals" "MVP" "frontend,mvp" 'Acceptance criteria:
- Schedule, reschedule and cancel sessions
- Add notes and a rating after a session
- Goals and milestones timeline for each mentorship
- Upcoming sessions on the home screen'

mk "Frontend: admin dashboard" "MVP" "frontend,mvp" 'Acceptance criteria:
- Mentor verification queue
- Reports queue with resolve action
- Impact metrics tables and charts with filters
- CSV export button'

mk "PWA setup and performance budget" "MVP" "frontend,infra,mvp" 'Acceptance criteria:
- Installable PWA with a manifest and icons
- Service worker caches the app shell and recently viewed screens
- Code splitting and compressed images
- Lighthouse performance and accessibility scores of 90 or higher on a throttled mobile profile'

mk "Write code of conduct and safeguarding policy" "MVP" "safety,docs,mvp" 'Acceptance criteria:
- Code of conduct for mentors and mentees
- Safeguarding policy covering reporting, escalation and who responds
- Mentor verification checklist for admins
- Reviewed by the full team before the pilot'

mk "Data protection review (Kenya Data Protection Act, 2019)" "MVP" "safety,docs,mvp" 'Acceptance criteria:
- List of personal data collected and why
- Privacy notice and terms of use
- Retention and deletion rules
- Confirm registration needs with the Office of the Data Protection Commissioner (check with a lawyer)'

mk "Testing: unit tests for matching and API tests" "MVP" "backend,mvp" 'Acceptance criteria:
- Unit tests for the matching module
- API tests for every endpoint, including permission failures
- Test database set up in CI
- Minimum coverage target agreed by the team'

mk "Deploy staging and production environments" "MVP" "infra,mvp" 'Acceptance criteria:
- Managed hosting for the API and PostgreSQL, static hosting for the frontend
- Automatic deploy to staging from main; manual approval for production
- Database backups and a restore test
- Error logging and uptime monitoring'

# ---------------------------------------------------------------- Phase 2
mk "Guardian consent flow" "Phase 2" "backend,frontend,safety,phase-2" 'Acceptance criteria:
- Mentees under 18 must link a guardian before any match
- Guardian receives an email to confirm consent, and can withdraw it
- Guardian can see the session schedule and receives alerts
- Audit trail of consent'

mk "Matching rules for under-18 mentees" "Phase 2" "backend,safety,phase-2" 'Acceptance criteria:
- Under-18 mentees are matched only with verified adult female mentors who accepted the code of conduct
- Rules enforced on the server, not only in the UI
- Tests for every rule'

mk "In-app messaging" "Phase 2" "backend,frontend,safety,phase-2" 'Acceptance criteria:
- Messaging between matched pairs only
- No phone numbers or emails shown
- Report message and block user
- Guardian visibility for under-18 pairs (decision needed)'

mk "SMS or WhatsApp reminders" "Phase 2" "backend,phase-2" 'Acceptance criteria:
- Provider chosen and cost estimated
- Opt-in and opt-out per user
- Session reminders and consent requests by SMS or WhatsApp
- Fallback to email'

mk "Swahili interface (i18n)" "Phase 2" "frontend,phase-2" 'Acceptance criteria:
- All strings moved into translation files
- Language switcher that remembers the choice
- Swahili translations reviewed by a native speaker
- Emails available in both languages'

mk "Resource library" "Phase 2" "backend,frontend,phase-2" 'Acceptance criteria:
- Admins add roadmaps, CV templates and interview prep guides
- Browse and search by topic
- Mentors can recommend a resource to a mentee'

# ---------------------------------------------------------------- Phase 3
mk "Group mentorship circles" "Phase 3" "backend,frontend,phase-3" 'Acceptance criteria:
- A mentor can run a circle on a topic with a member limit
- Join, leave and schedule group sessions
- Group safeguarding rules agreed first'

mk "Q&A board" "Phase 3" "backend,frontend,safety,phase-3" 'Acceptance criteria:
- Mentees post questions; verified mentors answer
- Moderation tools and reporting
- Search and topic tags'

mk "Events and workshops" "Phase 3" "backend,frontend,phase-3" 'Acceptance criteria:
- Admins create events with a date, link and capacity
- Registration and reminders
- Attendance recorded for impact reports'

mk "Badges and mentor recognition" "Phase 3" "backend,frontend,phase-3" 'Acceptance criteria:
- Badges for milestones and sessions held
- Mentor recognition board (opt-in)
- Rules to prevent gaming'

mk "AI-assisted matching" "Phase 3" "backend,phase-3" 'Acceptance criteria:
- Use embeddings of goals and bios to improve skill matching
- Tune weights from outcomes such as completed mentorships and ratings
- Score breakdown still shown to users and admins
- Evaluate against the rule-based baseline before switching'

mk "Partner and funder reports" "Phase 3" "backend,frontend,phase-3" 'Acceptance criteria:
- Exportable reports with aggregated impact metrics
- Date range and cohort filters
- No personal data in any report'

echo "Done."