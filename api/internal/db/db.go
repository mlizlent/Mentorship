package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Queries struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) *Queries {
	return &Queries{conn: conn}
}

func (q *Queries) Ping(ctx context.Context) error {
	return q.conn.Ping(ctx)
}

func Open(databaseURL string, maxOpenConns int) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	if maxOpenConns > 0 {
		cfg.MaxConns = int32(maxOpenConns)
	}
	return pgxpool.NewWithConfig(context.Background(), cfg)
}

func Migrate(databaseURL string) error {
	candidates := []string{
		"/migrations",
		"migrations",
		"internal/db/migrations",
		"api/internal/db/migrations",
	}

	var paths []string
	for _, candidate := range candidates {
		absolutePath, err := filepath.Abs(candidate)
		if err != nil {
			continue
		}
		info, err := os.Stat(absolutePath)
		if err == nil && info.IsDir() {
			paths = append(paths, "file://"+filepath.ToSlash(absolutePath))
		}
	}

	if len(paths) == 0 {
		return fmt.Errorf("migration directory not found")
	}

	var lastErr error
	for _, path := range paths {
		log.Printf("Trying migration path: %s", path)
		m, err := migrate.New(path, databaseURL)
		if err != nil {
			lastErr = fmt.Errorf("create migrate instance (%s): %w", path, err)
			log.Printf("Migration path failed: %v", lastErr)
			continue
		}

		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			lastErr = fmt.Errorf("run migrations (%s): %w", path, err)
			log.Printf("Migration run failed: %v", lastErr)
			continue
		}
		log.Printf("Migrations applied successfully from: %s", path)
		return nil
	}
	return lastErr
}

func Seed(databaseURL string) error {
	// Seed is handled by a separate script
	return nil
}

// Common types

type User struct {
	ID           string     `db:"id"`
	Email        string     `db:"email"`
	PasswordHash string     `db:"password_hash"`
	Role         string     `db:"role"`
	FullName     string     `db:"full_name"`
	DateOfBirth  *time.Time `db:"date_of_birth"`
	County       string     `db:"county"`
	Language     string     `db:"language"`
	Status       string     `db:"status"`
	AvatarURL    string     `db:"avatar_url"`
	DeletedAt    *time.Time `db:"deleted_at"`
	CreatedAt    time.Time  `db:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"`
}

type MentorProfile struct {
	UserID          string     `db:"user_id"`
	Bio             string     `db:"bio"`
	Expertise       []string   `db:"expertise"`
	YearsExperience int        `db:"years_experience"`
	HoursPerMonth   int        `db:"hours_per_month"`
	Languages       []string   `db:"languages"`
	Availability    string     `db:"availability"`
	MaxMentees      int        `db:"max_mentees"`
	VerifiedAt      *time.Time `db:"verified_at"`
	VerifiedBy      *string    `db:"verified_by"`
	FullName        string     `db:"full_name"`
	County          string     `db:"county"`
	Verified        bool       `db:"verified"`
}

type MenteeProfile struct {
	UserID       string   `db:"user_id"`
	Goals        string   `db:"goals"`
	Interests    []string `db:"interests"`
	Level        string   `db:"level"`
	Availability string   `db:"availability"`
	GuardianID   *string  `db:"guardian_id"`
}

type Mentorship struct {
	ID             string     `db:"id"`
	MentorID       string     `db:"mentor_id"`
	MenteeID       string     `db:"mentee_id"`
	Status         string     `db:"status"`
	RequestMessage string     `db:"request_message"`
	StartDate      *time.Time `db:"start_date"`
	EndDate        *time.Time `db:"end_date"`
	DeletedAt      *time.Time `db:"deleted_at"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
}

type Session struct {
	ID           string    `db:"id"`
	MentorshipID string    `db:"mentorship_id"`
	ScheduledAt  time.Time `db:"scheduled_at"`
	DurationMin  int       `db:"duration_min"`
	MeetingLink  string    `db:"meeting_link"`
	Status       string    `db:"status"`
	MentorNotes  string    `db:"mentor_notes"`
	MenteeNotes  string    `db:"mentee_notes"`
	MenteeRating *int      `db:"mentee_rating"`
	MentorRating *int      `db:"mentor_rating"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

type Goal struct {
	ID           string     `db:"id"`
	MentorshipID string     `db:"mentorship_id"`
	Title        string     `db:"title"`
	TargetDate   *time.Time `db:"target_date"`
	Status       string     `db:"status"`
	CreatedAt    time.Time  `db:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"`
}
