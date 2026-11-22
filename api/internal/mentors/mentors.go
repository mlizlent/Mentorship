package mentors

import (
	"net/http"
	"strconv"

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

type publicMentor struct {
	ID              string   `json:"id"`
	FullName        string   `json:"full_name"`
	Bio             string   `json:"bio"`
	Expertise       []string `json:"expertise"`
	YearsExperience int      `json:"years_experience"`
	County          string   `json:"county"`
	Languages       []string `json:"languages"`
	HoursPerMonth   int      `json:"hours_per_month"`
}

func (s *Service) List(w http.ResponseWriter, r *http.Request) {
	mentors, err := s.queries.ListVerifiedMentors(r.Context(), 100)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list mentors", nil)
		return
	}

	var result []publicMentor
	for _, m := range mentors {
		capacity, _ := s.queries.CountActiveMentees(r.Context(), m.UserID)
		if capacity >= m.MaxMentees {
			continue
		}
		result = append(result, publicMentor{
			ID:              m.UserID,
			FullName:        m.FullName,
			Bio:             m.Bio,
			Expertise:       m.Expertise,
			YearsExperience: m.YearsExperience,
			County:          m.County,
			Languages:       m.Languages,
			HoursPerMonth:   m.HoursPerMonth,
		})
	}

	// Apply filters
	expertise := r.URL.Query().Get("expertise")
	language := r.URL.Query().Get("language")
	search := r.URL.Query().Get("q")

	filtered := result[:0]
	for _, m := range result {
		if expertise != "" {
			found := false
			for _, e := range m.Expertise {
				if e == expertise {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		if language != "" {
			found := false
			for _, l := range m.Languages {
				if l == language {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		if search != "" {
			_ = search
		}
		filtered = append(filtered, m)
	}

	// Cursor pagination
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}

	if len(filtered) > limit {
		filtered = filtered[:limit]
	}

	nextCursor := ""
	if len(filtered) == limit && len(result) > limit {
		nextCursor = filtered[len(filtered)-1].ID
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data":         filtered,
		"next_cursor":  nextCursor,
	})
}

func (s *Service) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_ = id
	_, _ = auth.UserIDFromContext(r.Context())

	mentor, err := s.queries.GetMentorProfile(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentor not found", nil)
		return
	}

	capacity, _ := s.queries.CountActiveMentees(r.Context(), mentor.UserID)

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"mentor": map[string]interface{}{
			"id":              mentor.UserID,
			"full_name":       mentor.FullName,
			"bio":             mentor.Bio,
			"expertise":       mentor.Expertise,
			"years_experience": mentor.YearsExperience,
			"county":          mentor.County,
			"languages":       mentor.Languages,
			"hours_per_month": mentor.HoursPerMonth,
			"max_mentees":     mentor.MaxMentees,
			"active_mentees":  capacity,
			"verified":        mentor.VerifiedAt != nil,
		},
	})
}
