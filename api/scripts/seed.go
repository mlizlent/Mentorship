package main

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"malkia-mentor/api/internal/db"
)

func main() {
	ctx := context.Background()
	conn, err := db.Open("postgres://malkia:malkia@localhost:5432/malkia?sslmode=disable", 10)
	if err != nil {
		slog.Error("failed to connect", "error", err)
		return
	}
	defer conn.Close(ctx)

	queries := db.New(conn)

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), 12)
	adminID := uuid.New()
	if _, err := queries.CreateUser(ctx, adminID.String(), "admin@malkia.local", string(hash), "admin", "Admin User", nil, "Nairobi", "en"); err != nil {
		slog.Error("failed to create admin", "error", err)
		return
	}

	mentorExpertise := [][]string{
		{"web development", "javascript", "react"},
		{"mobile development", "flutter", "dart"},
		{"data science", "python", "machine learning"},
		{"devops", "docker", "kubernetes"},
		{"ui/ux design", "figma", "product design"},
		{"backend engineering", "go", "postgresql"},
		{"cybersecurity", "network security", "ethical hacking"},
		{"product management", "agile", "scrum"},
	}
	mentorCounties := []string{"Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Nyeri", "Meru", "Nakuru"}

	for i := 0; i < 8; i++ {
		id := uuid.New()
		email := fmt.Sprintf("mentor%d@malkia.local", i+1)
		hash, _ := bcrypt.GenerateFromPassword([]byte("mentor123"), 12)
		if _, err := queries.CreateUser(ctx, id.String(), email, string(hash), "mentor", fmt.Sprintf("Mentor %d", i+1), nil, mentorCounties[i], "en"); err != nil {
			slog.Error("failed to create mentor", "error", err)
			continue
		}
		if err := queries.CreateMentorProfile(ctx, id.String(), "Experienced mentor in tech", mentorExpertise[i], rand.Intn(10)+2, 20, []string{"en", "sw"}, "{}", 3); err != nil {
			slog.Error("failed to create mentor profile", "error", err)
		}
	}

	for i := 0; i < 10; i++ {
		id := uuid.New()
		email := fmt.Sprintf("mentee%d@malkia.local", i+1)
		hash, _ := bcrypt.GenerateFromPassword([]byte("mentee123"), 12)
		if _, err := queries.CreateUser(ctx, id.String(), email, string(hash), "mentee", fmt.Sprintf("Mentee %d", i+1), nil, "Nairobi", "en"); err != nil {
			slog.Error("failed to create mentee", "error", err)
			continue
		}
	}

	slog.Info("seed complete")
	slog.Info("Admin login: admin@malkia.local / admin123")
	slog.Info("Mentor login: mentor1@malkia.local through mentor8@malkia.local / mentor123")
	slog.Info("Mentee login: mentee1@malkia.local through mentee10@malkia.local / mentee123")
}

var _ = time.Now
