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
	r.Route("/consent", func(r chi.Router) {
		r.Get("/mentee/{id}", s.ListConsentEvents)
		r.Post("/approve", s.ApproveConsent)
		r.Post("/revoke", s.RevokeConsent)
	})
	s.router = r
	return s
}

func (s *Service) Routes() *chi.Mux {
	return s.router
}

type PolicyVersionResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Version     string    `json:"version"`
	Content     string    `json:"content"`
	EffectiveAt time.Time `json:"effective_at"`
	CreatedAt   time.Time `json:"created_at"`
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

type consentEventResponse struct {
	ID         string    `json:"id"`
	GuardianID string    `json:"guardian_id"`
	MenteeID   string    `json:"mentee_id"`
	Event      string    `json:"event"`
	Timestamp  time.Time `json:"timestamp"`
	IPHash     string    `json:"ip_hash"`
}

func (s *Service) ListConsentEvents(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	menteeID := chi.URLParam(r, "id")
	if menteeID == "" {
		httpx.WriteError(w, "validation_failed", "mentee id required", nil)
		return
	}

	events, err := s.queries.ListConsentEvents(r.Context(), menteeID, 50)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list consent events", nil)
		return
	}

	var result []consentEventResponse
	for _, e := range events {
		result = append(result, consentEventResponse{
			ID:         e.ID,
			GuardianID: e.GuardianID,
			MenteeID:   e.MenteeID,
			Event:      e.Event,
			Timestamp:  e.Timestamp,
			IPHash:     e.IPHash,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": result,
	})
}

type approveConsentRequest struct {
	MenteeID string `json:"mentee_id" validate:"required,uuid"`
}

func (s *Service) ApproveConsent(w http.ResponseWriter, r *http.Request) {
	guardianID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req approveConsentRequest
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

	_, err := s.queries.CreateConsentEvent(r.Context(), guardianID, req.MenteeID, "guardian_consent_approved", ipHash)
	if err != nil {
		httpx.WriteError(w, "internal", "could not record consent approval", nil)
		return
	}

	if err := s.queries.UpdateUserStatus(r.Context(), req.MenteeID, "active"); err != nil {
		httpx.WriteError(w, "internal", "could not activate mentee", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "approved",
	})
}

type revokeConsentRequest struct {
	MenteeID string `json:"mentee_id" validate:"required,uuid"`
}

func (s *Service) RevokeConsent(w http.ResponseWriter, r *http.Request) {
	guardianID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req revokeConsentRequest
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

	_, err := s.queries.CreateConsentEvent(r.Context(), guardianID, req.MenteeID, "guardian_consent_revoked", ipHash)
	if err != nil {
		httpx.WriteError(w, "internal", "could not record consent revocation", nil)
		return
	}

	if err := s.queries.UpdateUserStatus(r.Context(), req.MenteeID, "suspended"); err != nil {
		httpx.WriteError(w, "internal", "could not suspend mentee", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "revoked",
	})
}

var _ = chi.URLParam
