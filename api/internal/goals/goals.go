package goals

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
	Title      string  `json:"title" validate:"required,min=3,max=255"`
	TargetDate *string `json:"target_date" validate:"omitempty"`
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
		httpx.WriteError(w, "forbidden", "you cannot add goals to this mentorship", nil)
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

	var targetDate *string
	if req.TargetDate != nil && *req.TargetDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.TargetDate)
		if err != nil {
			httpx.WriteError(w, "validation_failed", "target_date must be an RFC3339 timestamp", nil)
			return
		}
		normalized := parsed.UTC().Format(time.RFC3339)
		targetDate = &normalized
	}

	id, err := s.queries.CreateGoal(r.Context(), mentorshipID, req.Title, targetDate)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create goal", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]string{
		"id":     id,
		"status": "open",
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
		httpx.WriteError(w, "forbidden", "you cannot view goals for this mentorship", nil)
		return
	}

	goals, err := s.queries.ListGoalsByMentorship(r.Context(), mentorshipID)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list goals", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": goals,
	})
}

type updateRequest struct {
	Status string `json:"status" validate:"required,oneof=open in_progress completed"`
}

func (s *Service) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	id := chi.URLParam(r, "id")
	goal, err := s.queries.GetGoal(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, "not_found", "goal not found", nil)
		return
	}

	mentorship, err := s.queries.GetMentorship(r.Context(), goal.MentorshipID)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentorship not found", nil)
		return
	}
	if mentorship.MentorID != userID && mentorship.MenteeID != userID {
		httpx.WriteError(w, "forbidden", "you cannot update this goal", nil)
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

	if err := s.queries.UpdateGoalStatus(r.Context(), id, req.Status); err != nil {
		httpx.WriteError(w, "internal", "could not update goal", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{
		"id":     id,
		"status": req.Status,
	})
}