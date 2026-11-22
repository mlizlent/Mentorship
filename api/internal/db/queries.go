package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

func (q *Queries) CreateUser(ctx context.Context, id, email, passwordHash, role, fullName string, dob *string, county, language string) (*User, error) {
	var newID, newEmail, newPasswordHash, newRole, newFullName, newCounty, newLanguage, newStatus string
	var newDOB interface{}
	var newCreatedAt, newUpdatedAt interface{}
	err := q.conn.QueryRow(ctx, `
		INSERT INTO users (id, email, password_hash, role, full_name, date_of_birth, county, language)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, email, password_hash, role, full_name, date_of_birth, county, language, status, created_at, updated_at
	`, id, email, passwordHash, role, fullName, dob, county, language).Scan(
		&newID, &newEmail, &newPasswordHash, &newRole, &newFullName, &newDOB, &newCounty, &newLanguage, &newStatus, &newCreatedAt, &newUpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &User{ID: id, Email: email, PasswordHash: passwordHash, Role: role, FullName: fullName}, nil
}

func (q *Queries) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	var dob interface{}
	err := q.conn.QueryRow(ctx, `
		SELECT id, email, password_hash, role, full_name, date_of_birth, county, language, status, created_at, updated_at
		FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
	`, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &dob, &u.County, &u.Language, &u.Status, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found: %w", err)
		}
		return nil, err
	}
	return &u, nil
}

func (q *Queries) GetUserByID(ctx context.Context, id string) (*User, error) {
	var u User
	var dob interface{}
	err := q.conn.QueryRow(ctx, `
		SELECT id, email, password_hash, role, full_name, date_of_birth, county, language, status, avatar_url, created_at, updated_at
		FROM users WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &dob, &u.County, &u.Language, &u.Status, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (q *Queries) UpdateUser(ctx context.Context, id, fullName, county, language string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE users SET full_name = $1, county = $2, language = $3, updated_at = NOW()
		WHERE id = $4 AND deleted_at IS NULL
	`, fullName, county, language, id)
	return err
}

func (q *Queries) UpdateUserAvatar(ctx context.Context, id, avatarURL string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE users SET avatar_url = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
	`, avatarURL, id)
	return err
}

func (q *Queries) CreateRefreshToken(ctx context.Context, userID, tokenHash string, expiresAt string) error {
	_, err := q.conn.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, tokenHash, expiresAt)
	return err
}

func (q *Queries) GetRefreshTokenByUser(ctx context.Context, userID string) (string, string, string, error) {
	var id, tokenHash, expiresAt string
	err := q.conn.QueryRow(ctx, `
		SELECT id, token_hash, expires_at FROM refresh_tokens
		WHERE user_id = $1 AND revoked_at IS NULL
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(&id, &tokenHash, &expiresAt)
	if err != nil {
		return "", "", "", err
	}
	return id, tokenHash, expiresAt, nil
}

func (q *Queries) RevokeRefreshToken(ctx context.Context, id string) error {
	_, err := q.conn.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, id)
	return err
}

func (q *Queries) RevokeAllRefreshTokens(ctx context.Context, userID string) error {
	_, err := q.conn.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	return err
}

func (q *Queries) CreateMentorProfile(ctx context.Context, userID, bio string, expertise []string, yearsExp, hoursPerMonth int, languages []string, availability string, maxMentees int) error {
	_, err := q.conn.Exec(ctx, `
		INSERT INTO mentor_profiles (user_id, bio, expertise, years_experience, hours_per_month, languages, availability, max_mentees)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, userID, bio, expertise, yearsExp, hoursPerMonth, languages, availability, maxMentees)
	return err
}

func (q *Queries) GetMentorProfile(ctx context.Context, userID string) (*MentorProfile, error) {
	var p MentorProfile
	err := q.conn.QueryRow(ctx, `
		SELECT mp.user_id, mp.bio, mp.expertise, mp.years_experience, mp.hours_per_month, mp.languages, mp.availability, mp.max_mentees, mp.verified_at, u.full_name, u.county
		FROM mentor_profiles mp JOIN users u ON u.id = mp.user_id
		WHERE mp.user_id = $1
	`, userID).Scan(
		&p.UserID, &p.Bio, &p.Expertise, &p.YearsExperience, &p.HoursPerMonth, &p.Languages, &p.Availability, &p.MaxMentees, &p.VerifiedAt, &p.FullName, &p.County,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (q *Queries) ListVerifiedMentors(ctx context.Context, limit int) ([]*MentorProfile, error) {
	rows, err := q.conn.Query(ctx, `
		SELECT mp.user_id, mp.bio, mp.expertise, mp.years_experience, mp.hours_per_month, mp.languages, mp.availability, mp.max_mentees, u.full_name, u.county
		FROM mentor_profiles mp JOIN users u ON u.id = mp.user_id
		WHERE mp.verified_at IS NOT NULL AND u.status = 'active' AND u.deleted_at IS NULL
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var mentors []*MentorProfile
	for rows.Next() {
		var p MentorProfile
		if err := rows.Scan(&p.UserID, &p.Bio, &p.Expertise, &p.YearsExperience, &p.HoursPerMonth, &p.Languages, &p.Availability, &p.MaxMentees, &p.FullName, &p.County); err != nil {
			return nil, err
		}
		mentors = append(mentors, &p)
	}
	return mentors, nil
}

func (q *Queries) CountActiveMentees(ctx context.Context, mentorID string) (int, error) {
	var count int
	err := q.conn.QueryRow(ctx, `
		SELECT COUNT(*) FROM mentorships
		WHERE mentor_id = $1 AND status = 'active' AND deleted_at IS NULL
	`, mentorID).Scan(&count)
	return count, err
}

func (q *Queries) CreateMentorship(ctx context.Context, mentorID, menteeID, message string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO mentorships (mentor_id, mentee_id, request_message)
		VALUES ($1, $2, $3)
		RETURNING id
	`, mentorID, menteeID, message).Scan(&id)
	return id, err
}

func (q *Queries) GetOpenRequest(ctx context.Context, mentorID, menteeID string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		SELECT id FROM mentorships
		WHERE mentor_id = $1 AND mentee_id = $2 AND status = 'requested' AND deleted_at IS NULL
	`, mentorID, menteeID).Scan(&id)
	return id, err
}

func (q *Queries) UpdateMentorshipStatus(ctx context.Context, id, status string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE mentorships SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL
	`, status, id)
	return err
}

func (q *Queries) GetMentorship(ctx context.Context, id string) (*Mentorship, error) {
	var m Mentorship
	err := q.conn.QueryRow(ctx, `
		SELECT id, mentor_id, mentee_id, status, request_message, start_date, end_date, created_at, updated_at
		FROM mentorships
		WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(&m.ID, &m.MentorID, &m.MenteeID, &m.Status, &m.RequestMessage, &m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (q *Queries) ListMentorshipsByUser(ctx context.Context, userID string, limit int, cursor string) ([]*Mentorship, error) {
	rows, err := q.conn.Query(ctx, `
		SELECT id, mentor_id, mentee_id, status, request_message, start_date, end_date, created_at, updated_at
		FROM mentorships
		WHERE (mentor_id = $1 OR mentee_id = $1) AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var mentorships []*Mentorship
	for rows.Next() {
		var m Mentorship
		if err := rows.Scan(&m.ID, &m.MentorID, &m.MenteeID, &m.Status, &m.RequestMessage, &m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		mentorships = append(mentorships, &m)
	}
	return mentorships, nil
}

func (q *Queries) CreateSession(ctx context.Context, mentorshipID string, scheduledAt string, durationMin int, meetingLink string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO sessions (mentorship_id, scheduled_at, duration_min, meeting_link)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, mentorshipID, scheduledAt, durationMin, meetingLink).Scan(&id)
	return id, err
}

func (q *Queries) ListSessionsByMentorship(ctx context.Context, mentorshipID string) ([]*Session, error) {
	rows, err := q.conn.Query(ctx, `
		SELECT id, mentorship_id, scheduled_at, duration_min, meeting_link, status, mentor_notes, mentee_notes, mentee_rating, mentor_rating, created_at, updated_at
		FROM sessions WHERE mentorship_id = $1 ORDER BY scheduled_at
	`, mentorshipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sessions []*Session
	for rows.Next() {
		var s Session
		if err := rows.Scan(&s.ID, &s.MentorshipID, &s.ScheduledAt, &s.DurationMin, &s.MeetingLink, &s.Status, &s.MentorNotes, &s.MenteeNotes, &s.MenteeRating, &s.MentorRating, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, &s)
	}
	return sessions, nil
}

func (q *Queries) UpdateSessionStatus(ctx context.Context, id, status string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2
	`, status, id)
	return err
}

func (q *Queries) GetSession(ctx context.Context, id string) (*Session, error) {
	var s Session
	err := q.conn.QueryRow(ctx, `
		SELECT id, mentorship_id, scheduled_at, duration_min, meeting_link, status, mentor_notes, mentee_notes, mentee_rating, mentor_rating, created_at, updated_at
		FROM sessions WHERE id = $1
	`, id).Scan(&s.ID, &s.MentorshipID, &s.ScheduledAt, &s.DurationMin, &s.MeetingLink, &s.Status, &s.MentorNotes, &s.MenteeNotes, &s.MenteeRating, &s.MentorRating, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (q *Queries) CreateGoal(ctx context.Context, mentorshipID, title string, targetDate *string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO goals (mentorship_id, title, target_date)
		VALUES ($1, $2, $3)
		RETURNING id
	`, mentorshipID, title, targetDate).Scan(&id)
	return id, err
}

func (q *Queries) ListGoalsByMentorship(ctx context.Context, mentorshipID string) ([]*Goal, error) {
	rows, err := q.conn.Query(ctx, `
		SELECT id, mentorship_id, title, target_date, status, created_at, updated_at
		FROM goals WHERE mentorship_id = $1 ORDER BY created_at
	`, mentorshipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var goals []*Goal
	for rows.Next() {
		var g Goal
		if err := rows.Scan(&g.ID, &g.MentorshipID, &g.Title, &g.TargetDate, &g.Status, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, err
		}
		goals = append(goals, &g)
	}
	return goals, nil
}

func (q *Queries) UpdateGoalStatus(ctx context.Context, id, status string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE goals SET status = $1, updated_at = NOW() WHERE id = $2
	`, status, id)
	return err
}

func (q *Queries) GetGoal(ctx context.Context, id string) (*Goal, error) {
	var g Goal
	err := q.conn.QueryRow(ctx, `
		SELECT id, mentorship_id, title, target_date, status, created_at, updated_at
		FROM goals WHERE id = $1
	`, id).Scan(&g.ID, &g.MentorshipID, &g.Title, &g.TargetDate, &g.Status, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (q *Queries) InsertNotification(ctx context.Context, userID, ntype, payload, sendAt string) error {
	_, err := q.conn.Exec(ctx, `
		INSERT INTO notifications_outbox (user_id, type, payload, send_at)
		VALUES ($1, $2, $3, $4)
	`, userID, ntype, payload, sendAt)
	return err
}

// CreateReport inserts a new report (used by tests and service)
func (q *Queries) CreateReport(ctx context.Context, reporterID, targetUserID, reason string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO reports (reporter_id, target_user_id, reason)
		VALUES ($1, $2, $3)
		RETURNING id
	`, reporterID, targetUserID, reason).Scan(&id)
	return id, err
}

// Admin queries

type AdminMentor struct {
	UserID          string     `db:"user_id"`
	FullName        string     `db:"full_name"`
	Email           string     `db:"email"`
	County          string     `db:"county"`
	Bio             string     `db:"bio"`
	Expertise       []string   `db:"expertise"`
	YearsExperience int        `db:"years_experience"`
	HoursPerMonth   int        `db:"hours_per_month"`
	Languages       []string   `db:"languages"`
	MaxMentees      int        `db:"max_mentees"`
	VerifiedAt      *time.Time `db:"verified_at"`
	VerifiedBy      *string    `db:"verified_by"`
	Status          string     `db:"status"`
	CreatedAt       time.Time  `db:"created_at"`
	ActiveMentees   int        `db:"active_mentees"`
}

func (q *Queries) ListMentorsForAdmin(ctx context.Context, status string, limit int, cursor string) ([]*AdminMentor, error) {
	where := "WHERE u.deleted_at IS NULL"
	args := []interface{}{}
	argIdx := 1

	if status == "unverified" {
		where += " AND mp.verified_at IS NULL"
	} else if status == "verified" {
		where += " AND mp.verified_at IS NOT NULL"
	}

	if cursor != "" {
		where += fmt.Sprintf(" AND u.created_at > $%d", argIdx)
		args = append(args, cursor)
		argIdx++
	}

	args = append(args, limit)
	query := fmt.Sprintf(`
		SELECT mp.user_id, u.full_name, u.email, u.county, mp.bio, mp.expertise,
		       mp.years_experience, mp.hours_per_month, mp.languages, mp.max_mentees,
		       mp.verified_at, mp.verified_by, u.status, u.created_at,
		       (SELECT COUNT(*) FROM mentorships m WHERE m.mentor_id = mp.user_id AND m.status = 'active' AND m.deleted_at IS NULL) AS active_mentees
		FROM mentor_profiles mp
		JOIN users u ON u.id = mp.user_id
		%s
		ORDER BY u.created_at DESC
		LIMIT $%d
	`, where, argIdx)

	rows, err := q.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mentors []*AdminMentor
	for rows.Next() {
		var m AdminMentor
		if err := rows.Scan(
			&m.UserID, &m.FullName, &m.Email, &m.County, &m.Bio, &m.Expertise,
			&m.YearsExperience, &m.HoursPerMonth, &m.Languages, &m.MaxMentees,
			&m.VerifiedAt, &m.VerifiedBy, &m.Status, &m.CreatedAt, &m.ActiveMentees,
		); err != nil {
			return nil, err
		}
		mentors = append(mentors, &m)
	}
	return mentors, nil
}

func (q *Queries) UpdateMentorVerification(ctx context.Context, mentorID string, verified bool, adminID string) error {
	if verified {
		_, err := q.conn.Exec(ctx, `
			UPDATE mentor_profiles SET verified_at = NOW(), verified_by = $1
			WHERE user_id = $2
		`, adminID, mentorID)
		return err
	}
	_, err := q.conn.Exec(ctx, `
		UPDATE mentor_profiles SET verified_at = NULL, verified_by = NULL
		WHERE user_id = $1
	`, mentorID)
	return err
}

type AdminReport struct {
	ID             string    `db:"id"`
	ReporterID     string    `db:"reporter_id"`
	TargetUserID   string    `db:"target_user_id"`
	Reason         string    `db:"reason"`
	Status         string    `db:"status"`
	ResolvedBy     *string   `db:"resolved_by"`
	ResolutionNote string    `db:"resolution_note"`
	CreatedAt      time.Time `db:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"`
}

func (q *Queries) ListReportsForAdmin(ctx context.Context, status string, limit int, cursor string) ([]*AdminReport, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		where += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	if cursor != "" {
		where += fmt.Sprintf(" AND created_at > $%d", argIdx)
		args = append(args, cursor)
		argIdx++
	}

	args = append(args, limit)
	query := fmt.Sprintf(`
		SELECT id, reporter_id, target_user_id, reason, status, resolved_by, resolution_note, created_at, updated_at
		FROM reports
		%s
		ORDER BY created_at DESC
		LIMIT $%d
	`, where, argIdx)

	rows, err := q.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []*AdminReport
	for rows.Next() {
		var r AdminReport
		if err := rows.Scan(
			&r.ID, &r.ReporterID, &r.TargetUserID, &r.Reason, &r.Status,
			&r.ResolvedBy, &r.ResolutionNote, &r.CreatedAt, &r.UpdatedAt,
		); err != nil {
			return nil, err
		}
		reports = append(reports, &r)
	}
	return reports, nil
}

func (q *Queries) ResolveReport(ctx context.Context, reportID string, adminID string, resolutionNote string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE reports SET status = 'resolved', resolved_by = $1, resolution_note = $2, updated_at = NOW()
		WHERE id = $3
	`, adminID, resolutionNote, reportID)
	return err
}

func (q *Queries) LogAdminAccess(ctx context.Context, adminID string, action string, targetType string, targetID string) error {
	_, err := q.conn.Exec(ctx, `
		INSERT INTO admin_access_log (admin_id, action, target_type, target_id)
		VALUES ($1, $2, $3, $4)
	`, adminID, action, targetType, targetID)
	return err
}

// Policy queries

type PolicyVersion struct {
	ID          string    `db:"id"`
	Title       string    `db:"title"`
	Version     string    `db:"version"`
	Content     string    `db:"content"`
	EffectiveAt time.Time `db:"effective_at"`
	CreatedAt   time.Time `db:"created_at"`
}

func (q *Queries) CreatePolicyVersion(ctx context.Context, title, version, content string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO policy_versions (title, version, content)
		VALUES ($1, $2, $3)
		RETURNING id
	`, title, version, content).Scan(&id)
	return id, err
}

func (q *Queries) ListPolicyVersions(ctx context.Context) ([]*PolicyVersion, error) {
	rows, err := q.conn.Query(ctx, `
		SELECT id, title, version, content, effective_at, created_at
		FROM policy_versions
		ORDER BY effective_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var policies []*PolicyVersion
	for rows.Next() {
		var p PolicyVersion
		if err := rows.Scan(&p.ID, &p.Title, &p.Version, &p.Content, &p.EffectiveAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		policies = append(policies, &p)
	}
	return policies, nil
}

func (q *Queries) GetPolicyVersion(ctx context.Context, id string) (*PolicyVersion, error) {
	var p PolicyVersion
	err := q.conn.QueryRow(ctx, `
		SELECT id, title, version, content, effective_at, created_at
		FROM policy_versions
		WHERE id = $1
	`, id).Scan(&p.ID, &p.Title, &p.Version, &p.Content, &p.EffectiveAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (q *Queries) GetLatestPolicyVersion(ctx context.Context) (*PolicyVersion, error) {
	var p PolicyVersion
	err := q.conn.QueryRow(ctx, `
		SELECT id, title, version, content, effective_at, created_at
		FROM policy_versions
		ORDER BY effective_at DESC
		LIMIT 1
	`).Scan(&p.ID, &p.Title, &p.Version, &p.Content, &p.EffectiveAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type PolicyAcceptance struct {
	ID              string    `db:"id"`
	UserID          string    `db:"user_id"`
	PolicyVersionID string    `db:"policy_version_id"`
	AcceptedAt      time.Time `db:"accepted_at"`
	IPHash          string    `db:"ip_hash"`
	CreatedAt       time.Time `db:"created_at"`
}

func (q *Queries) CreatePolicyAcceptance(ctx context.Context, userID, policyVersionID, ipHash string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO policy_acceptances (user_id, policy_version_id, ip_hash)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, policy_version_id) DO NOTHING
		RETURNING id
	`, userID, policyVersionID, ipHash).Scan(&id)
	return id, err
}

func (q *Queries) HasUserAcceptedPolicy(ctx context.Context, userID string, policyVersionID string) (bool, error) {
	var exists bool
	err := q.conn.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM policy_acceptances
			WHERE user_id = $1 AND policy_version_id = $2
		)
	`, userID, policyVersionID).Scan(&exists)
	return exists, err
}

func (q *Queries) SoftDeleteUser(ctx context.Context, id string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE users SET deleted_at = NOW(), status = 'deleted'
		WHERE id = $1
	`, id)
	return err
}

func (q *Queries) UpdateUserStatus(ctx context.Context, id, status string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE users SET status = $1 WHERE id = $2
	`, status, id)
	return err
}

// Consent event queries

type ConsentEvent struct {
	ID         string    `db:"id"`
	GuardianID string    `db:"guardian_id"`
	MenteeID   string    `db:"mentee_id"`
	Event      string    `db:"event"`
	Timestamp  time.Time `db:"timestamp"`
	IPHash     string    `db:"ip_hash"`
}

func (q *Queries) CreateConsentEvent(ctx context.Context, guardianID, menteeID, event, ipHash string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO consent_events (guardian_id, mentee_id, event, ip_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, guardianID, menteeID, event, ipHash).Scan(&id)
	return id, err
}

func (q *Queries) ListConsentEvents(ctx context.Context, menteeID string, limit int) ([]*ConsentEvent, error) {
	rows, err := q.conn.Query(ctx, `
		SELECT id, guardian_id, mentee_id, event, timestamp, ip_hash
		FROM consent_events
		WHERE mentee_id = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`, menteeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*ConsentEvent
	for rows.Next() {
		var e ConsentEvent
		if err := rows.Scan(&e.ID, &e.GuardianID, &e.MenteeID, &e.Event, &e.Timestamp, &e.IPHash); err != nil {
			return nil, err
		}
		events = append(events, &e)
	}
	return events, nil
}

// Message queries

type Conversation struct {
	ID            string     `db:"id"`
	MentorshipID  string     `db:"mentorship_id"`
	MentorID      string     `db:"mentor_id"`
	MenteeID      string     `db:"mentee_id"`
	OtherUserID   string     `db:"other_user_id"`
	OtherFullName string     `db:"other_full_name"`
	OtherRole     string     `db:"other_role"`
	LastMessage   string     `db:"last_message"`
	LastMessageAt *time.Time `db:"last_message_at"`
	UnreadCount   int        `db:"unread_count"`
	CreatedAt     time.Time  `db:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at"`
}

func (q *Queries) GetOrCreateConversation(ctx context.Context, mentorshipID, userID string) (string, error) {
	// Verify the user is a participant in the mentorship and it is not deleted.
	var role string
	err := q.conn.QueryRow(ctx, `
		SELECT CASE WHEN mentor_id = $1 THEN 'mentor' WHEN mentee_id = $1 THEN 'mentee' END
		FROM mentorships
		WHERE id = $2 AND deleted_at IS NULL
	`, userID, mentorshipID).Scan(&role)
	if err != nil {
		return "", err
	}
	if role == "" {
		return "", fmt.Errorf("user is not a participant in mentorship %s", mentorshipID)
	}

	var conversationID string
	err = q.conn.QueryRow(ctx, `
		INSERT INTO conversations (mentorship_id)
		VALUES ($1)
		ON CONFLICT (mentorship_id) DO UPDATE SET updated_at = NOW()
		RETURNING id
	`, mentorshipID).Scan(&conversationID)
	if err != nil {
		return "", err
	}
	return conversationID, nil
}

func (q *Queries) ListConversations(ctx context.Context, userID string, limit int, cursor string) ([]*Conversation, error) {
	args := []interface{}{userID}
	argIdx := 2
	where := `WHERE (m.mentor_id = $1 OR m.mentee_id = $1) AND m.deleted_at IS NULL`
	if cursor != "" {
		where += fmt.Sprintf(" AND c.updated_at < $%d", argIdx)
		args = append(args, cursor)
		argIdx++
	}
	args = append(args, limit)

	query := fmt.Sprintf(`
		SELECT c.id, c.mentorship_id, m.mentor_id, m.mentee_id,
		       CASE WHEN m.mentor_id = $1 THEN m.mentee_id ELSE m.mentor_id END AS other_user_id,
		       CASE WHEN m.mentor_id = $1 THEN u2.full_name ELSE u1.full_name END AS other_full_name,
		       CASE WHEN m.mentor_id = $1 THEN u2.role ELSE u1.role END AS other_role,
		       lm.body AS last_message,
		       lm.created_at AS last_message_at,
		       (SELECT COUNT(*) FROM messages msg
		        WHERE msg.conversation_id = c.id
		          AND msg.sender_id <> $1
		          AND msg.read_at IS NULL) AS unread_count,
		       c.created_at, c.updated_at
		FROM conversations c
		JOIN mentorships m ON m.id = c.mentorship_id
		JOIN users u1 ON u1.id = m.mentor_id AND u1.deleted_at IS NULL
		JOIN users u2 ON u2.id = m.mentee_id AND u2.deleted_at IS NULL
		LEFT JOIN LATERAL (
			SELECT body, created_at FROM messages msg
			WHERE msg.conversation_id = c.id
			ORDER BY created_at DESC LIMIT 1
		) lm ON true
		%s
		ORDER BY c.updated_at DESC
		LIMIT $%d
	`, where, argIdx)

	rows, err := q.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []*Conversation
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(
			&c.ID, &c.MentorshipID, &c.MentorID, &c.MenteeID,
			&c.OtherUserID, &c.OtherFullName, &c.OtherRole,
			&c.LastMessage, &c.LastMessageAt,
			&c.UnreadCount, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		conversations = append(conversations, &c)
	}
	return conversations, nil
}

func (q *Queries) GetConversation(ctx context.Context, conversationID, userID string) (*Conversation, error) {
	var c Conversation
	err := q.conn.QueryRow(ctx, `
		SELECT c.id, c.mentorship_id, m.mentor_id, m.mentee_id,
		       CASE WHEN m.mentor_id = $2 THEN m.mentee_id ELSE m.mentor_id END AS other_user_id,
		       CASE WHEN m.mentor_id = $2 THEN u2.full_name ELSE u1.full_name END AS other_full_name,
		       CASE WHEN m.mentor_id = $2 THEN u2.role ELSE u1.role END AS other_role,
		       c.created_at, c.updated_at
		FROM conversations c
		JOIN mentorships m ON m.id = c.mentorship_id
		JOIN users u1 ON u1.id = m.mentor_id AND u1.deleted_at IS NULL
		JOIN users u2 ON u2.id = m.mentee_id AND u2.deleted_at IS NULL
		WHERE c.id = $1 AND (m.mentor_id = $2 OR m.mentee_id = $2) AND m.deleted_at IS NULL
	`, conversationID, userID).Scan(
		&c.ID, &c.MentorshipID, &c.MentorID, &c.MenteeID,
		&c.OtherUserID, &c.OtherFullName, &c.OtherRole,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

type Message struct {
	ID             string     `db:"id"`
	ConversationID string     `db:"conversation_id"`
	SenderID       string     `db:"sender_id"`
	Body           string     `db:"body"`
	ReadAt         *time.Time `db:"read_at"`
	HiddenAt       *time.Time `db:"hidden_at"`
	CreatedAt      time.Time  `db:"created_at"`
}

func (q *Queries) ListMessages(ctx context.Context, conversationID, userID string, limit int, cursor string) ([]*Message, error) {
	// Verify access first.
	_, err := q.GetConversation(ctx, conversationID, userID)
	if err != nil {
		return nil, err
	}

	args := []interface{}{conversationID}
	argIdx := 2
	where := `WHERE conversation_id = $1 AND hidden_at IS NULL`
	if cursor != "" {
		where += fmt.Sprintf(" AND created_at < $%d", argIdx)
		args = append(args, cursor)
		argIdx++
	}
	args = append(args, limit)

	query := fmt.Sprintf(`
		SELECT id, conversation_id, sender_id, body, read_at, hidden_at, created_at
		FROM messages
		%s
		ORDER BY created_at DESC
		LIMIT $%d
	`, where, argIdx)

	rows, err := q.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(
			&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Body,
			&msg.ReadAt, &msg.HiddenAt, &msg.CreatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, &msg)
	}
	return messages, nil
}

func (q *Queries) CreateMessage(ctx context.Context, conversationID, senderID, body string) (string, error) {
	var id string
	err := q.conn.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, sender_id, body)
		VALUES ($1, $2, $3)
		RETURNING id
	`, conversationID, senderID, body).Scan(&id)
	if err != nil {
		return "", err
	}
	_, _ = q.conn.Exec(ctx, `
		UPDATE conversations SET updated_at = NOW() WHERE id = $1
	`, conversationID)
	return id, nil
}

func (q *Queries) MarkMessagesRead(ctx context.Context, conversationID, userID string) error {
	_, err := q.conn.Exec(ctx, `
		UPDATE messages SET read_at = NOW()
		WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL
	`, conversationID, userID)
	return err
}

func (q *Queries) GetMessage(ctx context.Context, messageID string) (*Message, error) {
	var msg Message
	err := q.conn.QueryRow(ctx, `
		SELECT id, conversation_id, sender_id, body, read_at, hidden_at, created_at
		FROM messages WHERE id = $1
	`, messageID).Scan(
		&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Body,
		&msg.ReadAt, &msg.HiddenAt, &msg.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (q *Queries) GetActiveMentorshipBetweenUsers(ctx context.Context, userID1, userID2 string) (string, error) {
	var mentorshipID string
	err := q.conn.QueryRow(ctx, `
		SELECT id FROM mentorships
		WHERE (mentor_id = $1 AND mentee_id = $2) OR (mentor_id = $2 AND mentee_id = $1)
		  AND deleted_at IS NULL AND status = 'active'
	`, userID1, userID2).Scan(&mentorshipID)
	if err != nil {
		return "", err
	}
	return mentorshipID, nil
}

func (q *Queries) GetGuardianIDForMentee(ctx context.Context, menteeID string) (string, error) {
	var guardianID string
	err := q.conn.QueryRow(ctx, `
		SELECT g.user_id FROM guardians g
		JOIN mentee_profiles mp ON mp.user_id = g.mentee_id
		WHERE g.mentee_id = $1 AND g.consent_withdrawn_at IS NULL
		LIMIT 1
	`, menteeID).Scan(&guardianID)
	if err != nil {
		return "", err
	}
	return guardianID, nil
}

func (q *Queries) IsGuardianOf(ctx context.Context, guardianID, menteeID string) (bool, error) {
	var exists bool
	err := q.conn.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM guardians
			WHERE user_id = $1 AND mentee_id = $2 AND consent_withdrawn_at IS NULL
		)
	`, guardianID, menteeID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (q *Queries) InsertOutboxNotification(ctx context.Context, userID, ntype, payload string) error {
	_, err := q.conn.Exec(ctx, `
		INSERT INTO notifications_outbox (user_id, type, payload)
		VALUES ($1, $2, $3)
	`, userID, ntype, payload)
	return err
}

func (q *Queries) GetUserByIDForDob(ctx context.Context, id string) (*time.Time, error) {
	var dob *time.Time
	err := q.conn.QueryRow(ctx, `
		SELECT date_of_birth FROM users WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(&dob)
	if err != nil {
		return nil, err
	}
	return dob, nil
}

var _ = fmt.Sprintf
