package mentorships

import (
	"net/http"

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
	MentorID       string `json:"mentor_id" validate:"required,uuid"`
	RequestMessage string `json:"request_message" validate:"max=2000"`
}

func (s *Service) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
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

	if req.MentorID == userID {
		httpx.WriteError(w, "validation_failed", "cannot request mentorship from yourself", nil)
		return
	}

	mentor, err := s.queries.GetMentorProfile(r.Context(), req.MentorID)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentor not found", nil)
		return
	}
	if mentor.VerifiedAt == nil {
		httpx.WriteError(w, "validation_failed", "mentor is not verified yet", nil)
		return
	}

	if _, err := s.queries.GetOpenRequest(r.Context(), req.MentorID, userID); err == nil {
		httpx.WriteError(w, "conflict", "you already have an open request with this mentor", nil)
		return
	}

	id, err := s.queries.CreateMentorship(r.Context(), req.MentorID, userID, req.RequestMessage)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create mentorship request", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]string{
		"id":     id,
		"status": "requested",
	})
}

func (s *Service) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	mentorships, err := s.queries.ListMentorshipsByUser(r.Context(), userID, 20, "")
	if err != nil {
		httpx.WriteError(w, "internal", "could not list mentorships", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": mentorships,
	})
}

type updateRequest struct {
	Status string `json:"status" validate:"required,oneof=active paused completed declined"`
}

var allowedTransitions = map[string][]string{
	"requested": {"active", "declined"},
	"active":    {"paused", "completed"},
	"paused":    {"active", "completed"},
}

func (s *Service) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
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

	mentorship, err := s.queries.GetMentorship(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentorship not found", nil)
		return
	}

	if mentorship.MentorID != userID && mentorship.MenteeID != userID {
		httpx.WriteError(w, "forbidden", "you cannot update this mentorship", nil)
		return
	}

	allowed := false
	for _, next := range allowedTransitions[mentorship.Status] {
		if next == req.Status {
			allowed = true
			break
		}
	}
	if !allowed {
		httpx.WriteError(w, "validation_failed", "invalid status transition", map[string]string{
			"status": "cannot move from " + mentorship.Status + " to " + req.Status,
		})
		return
	}

	if req.Status == "active" && mentorship.Status == "requested" {
		mentor, err := s.queries.GetMentorProfile(r.Context(), mentorship.MentorID)
		if err != nil {
			httpx.WriteError(w, "internal", "could not load mentor profile", nil)
			return
		}
		active, err := s.queries.CountActiveMentees(r.Context(), mentorship.MentorID)
		if err != nil {
			httpx.WriteError(w, "internal", "could not check mentor capacity", nil)
			return
		}
		if active >= mentor.MaxMentees {
			httpx.WriteError(w, "validation_failed", "mentor has reached capacity", nil)
			return
		}
	}

	if err := s.queries.UpdateMentorshipStatus(r.Context(), id, req.Status); err != nil {
		httpx.WriteError(w, "internal", "could not update mentorship", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]string{
		"id":     id,
		"status": req.Status,
	})
}