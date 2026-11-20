package profiles

import (
	"net/http"

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

func (s *Service) ListProfiles(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user_id": userID,
	})
}

func (s *Service) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	_ = userID
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}
