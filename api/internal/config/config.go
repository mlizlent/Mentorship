package config

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/subosito/gotenv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	MaxOpenConns    int
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
	JWTSecret       string
	BcryptCost      int
	LogLevel        slog.Level
	Environment     string
	MentorCapacity  int
	MatchingWeights MatchingWeights
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	FrontendURL  string
	// Feature flags
	MessagingEnabled        bool
	GuardianCanViewMessages bool
}

type MatchingWeights struct {
	Skills         int
	Availability   int
	Capacity       int
	Language       int
	ExperienceFit  int
}

func Load() (*Config, error) {
	_ = gotenv.Load()

	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://malkia:malkia@localhost:5432/malkia?sslmode=disable"),
		MaxOpenConns:    getEnvInt("MAX_OPEN_CONNS", 25),
		AccessTokenTTL:  getEnvDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL: getEnvDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		JWTSecret:       getEnv("JWT_SECRET", "dev-secret-change-me"),
		BcryptCost:      getEnvInt("BCRYPT_COST", 12),
		LogLevel:        slog.LevelInfo,
		Environment:     getEnv("ENVIRONMENT", "development"),
		MentorCapacity:  getEnvInt("MENTOR_CAPACITY", 3),
		MatchingWeights: MatchingWeights{
			Skills:         getEnvInt("WEIGHT_SKILLS", 40),
			Availability:   getEnvInt("WEIGHT_AVAILABILITY", 25),
			Capacity:       getEnvInt("WEIGHT_CAPACITY", 15),
			Language:       getEnvInt("WEIGHT_LANGUAGE", 10),
			ExperienceFit:  getEnvInt("WEIGHT_EXPERIENCE_FIT", 10),
		},
		SMTPHost:     getEnv("SMTP_HOST", "localhost"),
		SMTPPort:     getEnvInt("SMTP_PORT", 1025),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "noreply@malkia.local"),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:5173"),
		// Feature flags: default on in development, off in production.
		MessagingEnabled:        getEnvBool("MESSAGING_ENABLED", getEnv("ENVIRONMENT", "development") != "production"),
		GuardianCanViewMessages: getEnvBool("GUARDIAN_CAN_VIEW_MESSAGES", true),
	}

	return cfg, nil
}

func getEnv(key, def string) string {
	if v, ok := osLookup(key); ok && v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v, ok := osLookup(key); ok && v != "" {
		var n int
		_, err := fmt.Sscanf(v, "%d", &n)
		if err == nil {
			return n
		}
	}
	return def
}

func getEnvDuration(key string, def time.Duration) time.Duration {
	if v, ok := osLookup(key); ok && v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}

func osLookup(key string) (string, bool) {
	v, ok := os.LookupEnv(key)
	return v, ok
}

func getEnvBool(key string, def bool) bool {
	if v, ok := osLookup(key); ok && v != "" {
		switch v {
		case "1", "true", "TRUE", "True", "yes", "YES", "Yes", "on", "ON":
			return true
		case "0", "false", "FALSE", "False", "no", "NO", "No", "off", "OFF":
			return false
		}
	}
	return def
}
