package goals

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"malkia-mentor/api/internal/auth"
	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
	"malkia-mentor/api/internal/httpx"
)

type Service struct {
	queries *db.Queries
	cfg     *config.Config
}

func NewService(queries *db.Queries, cfg *config.Config) *Service {
	return &Service{queries: queries, cfg: cfg}
}

func (s *Service) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}
	_ = userID
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "created"})
}

func (s *Service) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}
	_ = userID
	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{"data": []interface{}{}})
}

func (s *Service) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_ = id
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}
	_ = userID
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}
