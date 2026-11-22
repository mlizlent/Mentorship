package sessions

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"

	"malkia-mentor/api/internal/auth"
	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
	"malkia-mentor/api/internal/httpx"
)

var validate = validator.New()

type Service struct {
	queries *db.Queries
	cfg     *config.Config
}

func NewService(queries *db.Queries, cfg *config.Config) *Service {
	return &Service{queries: queries, cfg: cfg}
}

type createRequest struct {
	ScheduledAt string `json:"scheduled_at" validate:"required"`
	DurationMin int    `json:"duration_min" validate:"omitempty,gte=5,lte=480"`
	MeetingLink string `json:"meeting_link" validate:"max=2000"`
}

func (s *Service) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	mentorshipID := chi.URLParam(r, "id")
	mentorship, err := s.queries.GetMentorship(r.Context(), mentorshipID)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentorship not found", nil)
		return
	}
	if mentorship.MentorID != userID && mentorship.MenteeID != userID {
		httpx.WriteError(w, "forbidden", "you cannot schedule sessions for this mentorship", nil)
		return
	}

	var req createRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		httpx.WriteError(w, "validation_failed", "scheduled_at must be an RFC3339 timestamp", nil)
		return
	}

	duration := req.DurationMin
	if duration == 0 {
		duration = 30
	}

	id, err := s.queries.CreateSession(
		r.Context(),
		mentorshipID,
		scheduledAt.UTC().Format(time.RFC3339),
		duration,
		req.MeetingLink,
	)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create session", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]string{
		"id":     id,
		"status": "scheduled",
	})
}

func (s *Service) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	mentorshipID := chi.URLParam(r, "id")
	mentorship, err := s.queries.GetMentorship(r.Context(), mentorshipID)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentorship not found", nil)
		return
	}
	if mentorship.MentorID != userID && mentorship.MenteeID != userID {
		httpx.WriteError(w, "forbidden", "you cannot view sessions for this mentorship", nil)
		return
	}

	sessions, err := s.queries.ListSessionsByMentorship(r.Context(), mentorshipID)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list sessions", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": sessions,
	})
}

type updateRequest struct {
	Status string `json:"status" validate:"required,oneof=scheduled confirmed completed cancelled"`
}

func (s *Service) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	id := chi.URLParam(r, "id")
	session, err := s.queries.GetSession(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, "not_found", "session not found", nil)
		return
	}

	mentorship, err := s.queries.GetMentorship(r.Context(), session.MentorshipID)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentorship not found", nil)
		return
	}
	if mentorship.MentorID != userID && mentorship.MenteeID != userID {
		httpx.WriteError(w, "forbidden", "you cannot update this session", nil)
		return
	}

	var req updateRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	if err := s.queries.UpdateSessionStatus(r.Context(), id, req.Status); err != nil {
		httpx.WriteError(w, "internal", "could not update session", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{
		"id":     id,
		"status": req.Status,
	})
}