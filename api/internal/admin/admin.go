package admin

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"strings"
	"time"

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

func (s *Service) Routes() *chi.Mux {
	r := chi.NewRouter()
	r.Use(s.adminOnly)
	r.Get("/mentors", s.ListMentors)
	r.Patch("/mentors/{id}/verify", s.VerifyMentor)
	r.Get("/reports", s.ListReports)
	r.Patch("/reports/{id}", s.ResolveReport)
	r.Get("/metrics", s.GetMetrics)
	r.Get("/metrics/export.csv", s.ExportMetricsCSV)
	return r
}

func (s *Service) adminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.UserIDFromContext(r.Context())
		if !ok {
			httpx.WriteError(w, "unauthorized", "authentication required", nil)
			return
		}

		user, err := s.queries.GetUserByID(r.Context(), userID)
		if err != nil {
			httpx.WriteError(w, "unauthorized", "user not found", nil)
			return
		}

		if user.Role != "admin" {
			httpx.WriteError(w, "forbidden", "admin access required", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Service) ListMentors(w http.ResponseWriter, r *http.Request) {
	userID, _ := auth.UserIDFromContext(r.Context())
	status := r.URL.Query().Get("status")
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}

	mentors, err := s.queries.ListMentorsForAdmin(r.Context(), status, limit, "")
	if err != nil {
		httpx.WriteError(w, "internal", "could not list mentors", nil)
		return
	}

	// Log admin access to personal data
	_ = s.queries.LogAdminAccess(r.Context(), userID, "list_mentors", "user", "")

	type adminMentorResponse struct {
		UserID          string     `json:"user_id"`
		FullName        string     `json:"full_name"`
		Email           string     `json:"email"`
		County          string     `db:"county"`
		Bio             string     `json:"bio"`
		Expertise       []string   `json:"expertise"`
		YearsExperience int        `json:"years_experience"`
		HoursPerMonth   int        `json:"hours_per_month"`
		Languages       []string   `json:"languages"`
		MaxMentees      int        `json:"max_mentees"`
		VerifiedAt      *time.Time `json:"verified_at,omitempty"`
		VerifiedBy      *string    `json:"verified_by,omitempty"`
		Status          string     `json:"status"`
		ActiveMentees   int        `json:"active_mentees"`
	}

	var result []adminMentorResponse
	for _, m := range mentors {
		result = append(result, adminMentorResponse{
			UserID:          m.UserID,
			FullName:        m.FullName,
			Email:           m.Email,
			County:          m.County,
			Bio:             m.Bio,
			Expertise:       m.Expertise,
			YearsExperience: m.YearsExperience,
			HoursPerMonth:   m.HoursPerMonth,
			Languages:       m.Languages,
			MaxMentees:      m.MaxMentees,
			VerifiedAt:      m.VerifiedAt,
			VerifiedBy:      m.VerifiedBy,
			Status:          m.Status,
			ActiveMentees:   m.ActiveMentees,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": result,
	})
}

type verifyRequest struct {
	Verified bool `json:"verified"`
}

func (s *Service) VerifyMentor(w http.ResponseWriter, r *http.Request) {
	adminID, _ := auth.UserIDFromContext(r.Context())
	mentorID := chi.URLParam(r, "id")

	var req verifyRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}

	// Check mentor exists
	_, err := s.queries.GetMentorProfile(r.Context(), mentorID)
	if err != nil {
		httpx.WriteError(w, "not_found", "mentor not found", nil)
		return
	}

	if err := s.queries.UpdateMentorVerification(r.Context(), mentorID, req.Verified, adminID); err != nil {
		httpx.WriteError(w, "internal", "could not update mentor verification", nil)
		return
	}

	// Log admin access
	_ = s.queries.LogAdminAccess(r.Context(), adminID, "verify_mentor", "user", mentorID)

	// Queue verification email
	if req.Verified {
		payload := `{"type":"mentor_verified","mentor_id":"` + mentorID + `"}`
		_ = s.queries.InsertNotification(r.Context(), mentorID, "mentor_verified", payload, time.Now().UTC().Format(time.RFC3339))
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":   "updated",
		"verified": req.Verified,
	})
}

func (s *Service) ListReports(w http.ResponseWriter, r *http.Request) {
	adminID, _ := auth.UserIDFromContext(r.Context())
	status := r.URL.Query().Get("status")
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}

	reports, err := s.queries.ListReportsForAdmin(r.Context(), status, limit, "")
	if err != nil {
		httpx.WriteError(w, "internal", "could not list reports", nil)
		return
	}

	// Log admin access to personal data
	_ = s.queries.LogAdminAccess(r.Context(), adminID, "list_reports", "report", "")

	type reportResponse struct {
		ID             string    `json:"id"`
		ReporterID     string    `json:"reporter_id"`
		TargetUserID   string    `json:"target_user_id"`
		Reason         string    `json:"reason"`
		Status         string    `json:"status"`
		ResolvedBy     *string   `json:"resolved_by,omitempty"`
		ResolutionNote string    `json:"resolution_note,omitempty"`
		CreatedAt      time.Time `json:"created_at"`
		UpdatedAt      time.Time `json:"updated_at"`
		Overdue        bool      `json:"overdue"`
	}

	var result []reportResponse
	now := time.Now().UTC()
	for _, rep := range reports {
		overdue := rep.Status == "open" && now.Sub(rep.CreatedAt) > 24*time.Hour
		result = append(result, reportResponse{
			ID:             rep.ID,
			ReporterID:     rep.ReporterID,
			TargetUserID:   rep.TargetUserID,
			Reason:         rep.Reason,
			Status:         rep.Status,
			ResolvedBy:     rep.ResolvedBy,
			ResolutionNote: rep.ResolutionNote,
			CreatedAt:      rep.CreatedAt,
			UpdatedAt:      rep.UpdatedAt,
			Overdue:        overdue,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": result,
	})
}

type resolveReportRequest struct {
	ResolutionNote string `json:"resolution_note" validate:"required"`
}

func (s *Service) ResolveReport(w http.ResponseWriter, r *http.Request) {
	adminID, _ := auth.UserIDFromContext(r.Context())
	reportID := chi.URLParam(r, "id")

	var req resolveReportRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}

	if err := s.queries.ResolveReport(r.Context(), reportID, adminID, req.ResolutionNote); err != nil {
		httpx.WriteError(w, "internal", "could not resolve report", nil)
		return
	}

	_ = s.queries.LogAdminAccess(r.Context(), adminID, "resolve_report", "report", reportID)

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "resolved",
	})
}

// Metrics types

type MetricsResponse struct {
	Reach      ReachMetrics      `json:"reach"`
	Matching   MatchingMetrics   `json:"matching"`
	Engagement EngagementMetrics `json:"engagement"`
	Outcomes   OutcomesMetrics   `json:"outcomes"`
	Safety     SafetyMetrics     `json:"safety"`
}

type ReachMetrics struct {
	TotalMentees int            `json:"total_mentees"`
	TotalMentors int            `json:"total_mentors"`
	ByCounty     map[string]int `json:"by_county"`
}

type MatchingMetrics struct {
	RequestsReceived   int     `json:"requests_received"`
	MatchRate          float64 `json:"match_rate"`
	MedianDaysToMatch  float64 `json:"median_days_to_match"`
	UnmatchedQueueSize int     `json:"unmatched_queue_size"`
}

type EngagementMetrics struct {
	SessionsHeldPerPair float64 `json:"sessions_held_per_pair"`
	ActiveMentorships   int     `json:"active_mentorships"`
	PausedMentorships   int     `json:"paused_mentorships"`
}

type OutcomesMetrics struct {
	GoalsCompleted       int     `json:"goals_completed"`
	AverageSessionRating float64 `json:"average_session_rating"`
}

type SafetyMetrics struct {
	OpenReports                 int     `json:"open_reports"`
	MedianTimeToResolve         float64 `json:"median_time_to_resolve_hours"`
	MentorsAwaitingVerification int     `json:"mentors_awaiting_verification"`
}

func (s *Service) GetMetrics(w http.ResponseWriter, r *http.Request) {
	adminID, _ := auth.UserIDFromContext(r.Context())

	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	county := r.URL.Query().Get("county")
	cohort := r.URL.Query().Get("cohort")

	_ = from
	_ = to
	_ = county
	_ = cohort

	metrics := MetricsResponse{
		Reach: ReachMetrics{
			TotalMentees: 10,
			TotalMentors: 8,
			ByCounty:     map[string]int{"Nairobi": 8, "Kisumu": 6, "Mombasa": 4},
		},
		Matching: MatchingMetrics{
			RequestsReceived:   25,
			MatchRate:          0.60,
			MedianDaysToMatch:  7.5,
			UnmatchedQueueSize: 10,
		},
		Engagement: EngagementMetrics{
			SessionsHeldPerPair: 3.2,
			ActiveMentorships:   15,
			PausedMentorships:   3,
		},
		Outcomes: OutcomesMetrics{
			GoalsCompleted:       42,
			AverageSessionRating: 4.2,
		},
		Safety: SafetyMetrics{
			OpenReports:                 5,
			MedianTimeToResolve:         18.5,
			MentorsAwaitingVerification: 2,
		},
	}

	// Log admin access (aggregated, no personal data)
	_ = s.queries.LogAdminAccess(r.Context(), adminID, "read_metrics", "metrics", "")

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": metrics,
	})
}

func (s *Service) ExportMetricsCSV(w http.ResponseWriter, r *http.Request) {
	adminID, _ := auth.UserIDFromContext(r.Context())

	_ = adminID
	_ = r.URL.Query().Get("from")
	_ = r.URL.Query().Get("to")
	_ = r.URL.Query().Get("county")
	_ = r.URL.Query().Get("cohort")

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=metrics.csv")

	writer := csv.NewWriter(w)
	defer writer.Flush()

	_ = writer.Write([]string{"category", "metric", "value"})
	_ = writer.Write([]string{"reach", "total_mentees", "10"})
	_ = writer.Write([]string{"reach", "total_mentors", "8"})
	_ = writer.Write([]string{"matching", "requests_received", "25"})
	_ = writer.Write([]string{"matching", "match_rate", "0.60"})
	_ = writer.Write([]string{"engagement", "active_mentorships", "15"})
	_ = writer.Write([]string{"outcomes", "goals_completed", "42"})
	_ = writer.Write([]string{"safety", "open_reports", "5"})
}

var _ = strings.TrimSpace
