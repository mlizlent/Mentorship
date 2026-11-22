package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"malkia-mentor/api/internal/admin"
	"malkia-mentor/api/internal/auth"
	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
	"malkia-mentor/api/internal/httpx"
	"malkia-mentor/api/internal/users"
	"malkia-mentor/api/internal/mentors"
	"malkia-mentor/api/internal/mentorships"
	"malkia-mentor/api/internal/matching"
	"malkia-mentor/api/internal/messages"
	"malkia-mentor/api/internal/sessions"
	"malkia-mentor/api/internal/goals"
	"malkia-mentor/api/internal/policies"
	"malkia-mentor/api/internal/profiles"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.Level(cfg.LogLevel),
	}))
	slog.SetDefault(logger)

	pool, err := db.Open(cfg.DatabaseURL, cfg.MaxOpenConns)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := db.Migrate(cfg.DatabaseURL); err != nil {
		slog.Error("failed to run migrations (may already be applied)", "error", err)
	}

	queries := db.New(pool)

	authService := auth.NewService(queries, cfg)
	usersService := users.NewService(queries, authService, cfg)
	profilesService := profiles.NewService(queries, cfg)
	mentorsService := mentors.NewService(queries, cfg)
	mentorshipsService := mentorships.NewService(queries, cfg)
	matchingService := matching.NewService(cfg)
	messagesService := messages.NewService(queries, cfg)
	sessionsService := sessions.NewService(queries, cfg)
	goalsService := goals.NewService(queries, cfg)
	adminService := admin.NewService(queries, cfg)
	policiesService := policies.NewService(queries)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(httpx.Logger)
	r.Use(httpx.CORS)
	r.Use(middleware.Recoverer)
	r.Use(httpx.JSONContentType)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", usersService.Register)
			r.Post("/login", usersService.Login)
			r.Post("/refresh", usersService.Refresh)
			r.Post("/logout", usersService.Logout)
		})

		r.Route("/me", func(r chi.Router) {
			r.Get("/", authService.AuthMiddleware(usersService.GetMe))
			r.Put("/", authService.AuthMiddleware(usersService.UpdateMe))
		})

		r.Route("/profiles", func(r chi.Router) {
			r.Route("/{role}", func(r chi.Router) {
				r.Get("/", authService.AuthMiddleware(profilesService.ListProfiles))
				r.Put("/", authService.AuthMiddleware(profilesService.UpdateProfile))
			})
		})

		r.Route("/mentors", func(r chi.Router) {
			r.Get("/", mentorsService.List)
			r.Get("/{id}", mentorsService.Get)
		})

		r.Route("/matches", func(r chi.Router) {
			r.Get("/suggestions", authService.AuthMiddleware(matchingService.Suggestions))
		})

		r.Route("/mentorships", func(r chi.Router) {
			r.Post("/", authService.AuthMiddleware(mentorshipsService.Create))
			r.Get("/", authService.AuthMiddleware(mentorshipsService.List))
			r.Route("/{id}", func(r chi.Router) {
				r.Patch("/", authService.AuthMiddleware(mentorshipsService.Update))
				r.Route("/sessions", func(r chi.Router) {
					r.Post("/", authService.AuthMiddleware(sessionsService.Create))
					r.Get("/", authService.AuthMiddleware(sessionsService.List))
				})
				r.Route("/goals", func(r chi.Router) {
					r.Post("/", authService.AuthMiddleware(goalsService.Create))
					r.Get("/", authService.AuthMiddleware(goalsService.List))
				})
			})
		})

		r.Route("/sessions", func(r chi.Router) {
			r.Route("/{id}", func(r chi.Router) {
				r.Patch("/", authService.AuthMiddleware(sessionsService.Update))
			})
		})

		r.Route("/goals", func(r chi.Router) {
			r.Route("/{id}", func(r chi.Router) {
				r.Patch("/", authService.AuthMiddleware(goalsService.Update))
			})
		})

		r.Route("/messages", func(r chi.Router) {
			r.Handle("/*", authService.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
				messagesService.Routes().ServeHTTP(w, r)
			}))
		})

		r.Route("/admin", func(r chi.Router) {
			r.Mount("/", adminService.Routes())
		})

		r.Route("/policies", func(r chi.Router) {
			r.Mount("/", policiesService.Routes())
		})

		r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ok"))
		})

		r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
			if err := queries.Ping(r.Context()); err != nil {
				http.Error(w, "database not ready", http.StatusServiceUnavailable)
				return
			}
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ok"))
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		slog.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
	}

	slog.Info("server stopped")
}
