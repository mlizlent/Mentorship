package notifications

import (
	"net/http"

	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
)

type Service struct {
	queries *db.Queries
	cfg     *config.Config
	pool    interface{}
}

func NewService(queries *db.Queries, cfg *config.Config, pool interface{}) *Service {
	return &Service{queries: queries, cfg: cfg, pool: pool}
}

func (s *Service) Send(w http.ResponseWriter, r *http.Request) {}
