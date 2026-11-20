package policies

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"

	"malkia-mentor/api/internal/auth"
	"malkia-mentor/api/internal/db"
	"malkia-mentor/api/internal/httpx"
)

var validate = validator.New()

type Service struct {
	queries *db.Queries
	router  *chi.Mux
}

func NewService(queries *db.Queries) *Service {
	s := &Service{queries: queries}
	r := chi.NewRouter()
	r.Get("/", s.ListPolicies)
	r.Get("/{id}", s.GetPolicy)
	r.Post("/accept", s.AcceptPolicy)
	s.router = r
	return s
}

func (s *Service) Routes() *chi.Mux {
	return s.router
}

type PolicyVersionResponse struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Version     string     `json:"version"`
	Content     string     `json:"content"`
	EffectiveAt time.Time  `json:"effective_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (s *Service) ListPolicies(w http.ResponseWriter, r *http.Request) {
	policies, err := s.queries.ListPolicyVersions(r.Context())
	if err != nil {
		httpx.WriteError(w, "internal", "could not list policies", nil)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": policies,
	})
}

func (s *Service) GetPolicy(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		httpx.WriteError(w, "validation_failed", "policy id required", nil)
		return
	}

	p, err := s.queries.GetPolicyVersion(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, "not_found", "policy not found", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": p,
	})
}

type acceptPolicyRequest struct {
	PolicyVersionID string `json:"policy_version_id" validate:"required,uuid"`
}

func (s *Service) AcceptPolicy(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req acceptPolicyRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	ipHash := r.Header.Get("X-Forwarded-For")
	if ipHash == "" {
		ipHash = r.RemoteAddr
	}

	_, err := s.queries.CreatePolicyAcceptance(r.Context(), userID, req.PolicyVersionID, ipHash)
	if err != nil {
		httpx.WriteError(w, "internal", "could not record policy acceptance", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"status": "accepted",
	})
}

var _ = chi.URLParam
