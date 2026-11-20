package users

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"malkia-mentor/api/internal/auth"
	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
	"malkia-mentor/api/internal/httpx"
)

var validate = validator.New()

type Service struct {
	queries   *db.Queries
	authSvc   *auth.Service
	cfg       *config.Config
	chiRouter *chi.Mux
}

func NewService(queries *db.Queries, authSvc *auth.Service, cfg *config.Config) *Service {
	s := &Service{queries: queries, authSvc: authSvc, cfg: cfg}
	r := chi.NewRouter()
	r.Post("/register", s.Register)
	r.Post("/login", s.Login)
	r.Post("/refresh", s.Refresh)
	r.Post("/logout", s.Logout)
		r.Get("/me", s.GetMe)
		r.Put("/me", s.UpdateMe)
		r.Route("/me/blocks", func(r chi.Router) {
			r.Get("/", s.ListBlocks)
			r.Post("/", s.CreateBlock)
			r.Delete("/{id}", s.RemoveBlock)
		})
		r.Post("/me/reports", s.CreateReport)
		r.Get("/me/export", s.ExportMe)
		r.Delete("/me", s.DeleteMe)
		s.chiRouter = r
	return s
}

func (s *Service) Routes() *chi.Mux {
	return s.chiRouter
}

type registerRequest struct {
	Email                 string `json:"email" validate:"required,email"`
	Password              string `json:"password" validate:"required,min=10"`
	FullName              string `json:"full_name" validate:"required"`
	DateOfBirth           string `json:"date_of_birth" validate:"required"`
	Role                  string `json:"role" validate:"required,oneof=mentee mentor"`
	County                string `json:"county" validate:"required"`
	Language              string `json:"language" validate:"required,oneof=en sw"`
	CodeOfConductAccepted bool   `json:"code_of_conduct_accepted" validate:"eq=true"`
	GuardianID            string `json:"guardian_id,omitempty" validate:"omitempty,uuid"`
}

func (s *Service) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		httpx.WriteError(w, "validation_failed", "invalid date of birth", nil)
		return
	}

	if time.Since(dob) < 18*365*24*time.Hour {
		if req.GuardianID == "" {
			httpx.WriteError(w, "validation_failed", "guardian consent required for under-18 registration", nil)
			return
		}
		// Verify guardian exists
		if _, err := s.queries.GetUserByID(r.Context(), req.GuardianID); err != nil {
			httpx.WriteError(w, "not_found", "guardian not found", nil)
			return
		}
	}

	if _, err := s.queries.GetUserByEmail(r.Context(), req.Email); err == nil {
		httpx.WriteError(w, "conflict", "email already registered", nil)
		return
	}

	hash, err := s.authSvc.HashPassword(req.Password)
	if err != nil {
		httpx.WriteError(w, "internal", "could not hash password", nil)
		return
	}

	userID := uuid.New()
	if _, err := s.queries.CreateUser(r.Context(), userID.String(), req.Email, hash, req.Role, req.FullName, &req.DateOfBirth, req.County, req.Language); err != nil {
		httpx.WriteError(w, "internal", "could not create user", nil)
		return
	}

	// Record code of conduct / policy acceptance
	latestPolicy, err := s.queries.GetLatestPolicyVersion(r.Context())
	if err == nil && latestPolicy != nil {
		ipHash := r.Header.Get("X-Forwarded-For")
		if ipHash == "" {
			ipHash = r.RemoteAddr
		}
		_, _ = s.queries.CreatePolicyAcceptance(r.Context(), userID.String(), latestPolicy.ID, ipHash)
	}

	// Guardian consent for under-18
	if time.Since(dob) < 18*365*24*time.Hour {
		if err := s.queries.UpdateUserStatus(r.Context(), userID.String(), "pending"); err != nil {
			httpx.WriteError(w, "internal", "could not set pending status", nil)
			return
		}
		ipHash := r.Header.Get("X-Forwarded-For")
		if ipHash == "" {
			ipHash = r.RemoteAddr
		}
		_, _ = s.queries.CreateConsentEvent(r.Context(), req.GuardianID, userID.String(), "guardian_consent_requested", ipHash)
	}

	accessToken, err := s.authSvc.MakeAccessToken(userID.String(), req.Role)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create token", nil)
		return
	}

	refreshRaw, refreshHash, err := s.authSvc.MakeRefreshToken()
	if err != nil {
		httpx.WriteError(w, "internal", "could not create refresh token", nil)
		return
	}
	expiresAt := time.Now().Add(s.cfg.RefreshTokenTTL).Format(time.RFC3339)
	if err := s.queries.CreateRefreshToken(r.Context(), userID.String(), refreshHash, expiresAt); err != nil {
		httpx.WriteError(w, "internal", "could not store refresh token", nil)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(s.cfg.AccessTokenTTL.Seconds()),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshRaw,
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/auth/refresh",
		MaxAge:   int(s.cfg.RefreshTokenTTL.Seconds()),
	})

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"user": map[string]interface{}{
			"id":        userID.String(),
			"email":     req.Email,
			"role":      req.Role,
			"full_name": req.FullName,
		},
	})
}

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (s *Service) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	user, err := s.queries.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		httpx.WriteError(w, "unauthorized", "invalid email or password", nil)
		return
	}

	if err := s.authSvc.CheckPassword(req.Password, user.PasswordHash); err != nil {
		httpx.WriteError(w, "unauthorized", "invalid email or password", nil)
		return
	}

	accessToken, err := s.authSvc.MakeAccessToken(user.ID, user.Role)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create token", nil)
		return
	}

	refreshRaw, refreshHash, err := s.authSvc.MakeRefreshToken()
	if err != nil {
		httpx.WriteError(w, "internal", "could not create refresh token", nil)
		return
	}
	expiresAt := time.Now().Add(s.cfg.RefreshTokenTTL).Format(time.RFC3339)
	if err := s.queries.CreateRefreshToken(r.Context(), user.ID, refreshHash, expiresAt); err != nil {
		httpx.WriteError(w, "internal", "could not store refresh token", nil)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(s.cfg.AccessTokenTTL.Seconds()),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshRaw,
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/auth/refresh",
		MaxAge:   int(s.cfg.RefreshTokenTTL.Seconds()),
	})

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"full_name": user.FullName,
		},
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (s *Service) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		httpx.WriteError(w, "unauthorized", "refresh token required", nil)
		return
	}

	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "user not found", nil)
		return
	}

	id, tokenHash, expiresAtStr, err := s.queries.GetRefreshTokenByUser(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, "unauthorized", "invalid or revoked refresh token", nil)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(tokenHash), []byte(cookie.Value)); err != nil {
		httpx.WriteError(w, "unauthorized", "invalid or revoked refresh token", nil)
		return
	}

	expiresAt, err := time.Parse(time.RFC3339, expiresAtStr)
	if err != nil || time.Now().After(expiresAt) {
		httpx.WriteError(w, "unauthorized", "refresh token expired", nil)
		return
	}

	user, err := s.queries.GetUserByID(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, "unauthorized", "user not found", nil)
		return
	}

	if err := s.queries.RevokeRefreshToken(r.Context(), id); err != nil {
		httpx.WriteError(w, "internal", "could not revoke old refresh token", nil)
		return
	}

	accessToken, err := s.authSvc.MakeAccessToken(user.ID, user.Role)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create token", nil)
		return
	}

	refreshRaw, refreshHash, err := s.authSvc.MakeRefreshToken()
	if err != nil {
		httpx.WriteError(w, "internal", "could not create refresh token", nil)
		return
	}
	newExpiresAt := time.Now().Add(s.cfg.RefreshTokenTTL).Format(time.RFC3339)
	if err := s.queries.CreateRefreshToken(r.Context(), user.ID, refreshHash, newExpiresAt); err != nil {
		httpx.WriteError(w, "internal", "could not store refresh token", nil)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(s.cfg.AccessTokenTTL.Seconds()),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshRaw,
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/auth/refresh",
		MaxAge:   int(s.cfg.RefreshTokenTTL.Seconds()),
	})

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"full_name": user.FullName,
		},
	})
}

func (s *Service) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err == nil {
		userID, ok := auth.UserIDFromContext(r.Context())
		if ok {
			id, tokenHash, _, err := s.queries.GetRefreshTokenByUser(r.Context(), userID)
			if err == nil {
				if bcrypt.CompareHashAndPassword([]byte(tokenHash), []byte(cookie.Value)) == nil {
					_ = s.queries.RevokeRefreshToken(r.Context(), id)
				}
			}
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HttpOnly: true,
		Secure:   s.cfg.Environment == "production",
		SameSite: http.SameSiteLaxMode,
		Path:     "/auth/refresh",
		MaxAge:   -1,
	})

	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "logged out"})
}

func (s *Service) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	user, err := s.queries.GetUserByID(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, "not_found", "user not found", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"full_name": user.FullName,
			"county":    user.County,
			"language":  user.Language,
			"status":    user.Status,
		},
	})
}

type updateMeRequest struct {
	FullName string `json:"full_name" validate:"required"`
	County   string `json:"county" validate:"required"`
	Language string `json:"language" validate:"required,oneof=en sw"`
}

func (s *Service) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req updateMeRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	if err := s.queries.UpdateUser(r.Context(), userID, req.FullName, req.County, req.Language); err != nil {
		httpx.WriteError(w, "internal", "could not update user", nil)
		return
	}

	user, err := s.queries.GetUserByID(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, "not_found", "user not found", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"full_name": user.FullName,
			"county":    user.County,
			"language":  user.Language,
			"status":    user.Status,
		},
	})
}

type blockRequest struct {
	BlockedID string `json:"blocked_id" validate:"required,uuid"`
}

func (s *Service) ListBlocks(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	blocks, err := s.queries.ListBlocks(r.Context(), userID, 50)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list blocks", nil)
		return
	}

	type blockResponse struct {
		BlockedID string    `json:"blocked_id"`
		CreatedAt time.Time `json:"created_at"`
	}
	var result []blockResponse
	for _, b := range blocks {
		result = append(result, blockResponse{
			BlockedID: b.BlockedID,
			CreatedAt: b.CreatedAt,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": result,
	})
}

func (s *Service) CreateBlock(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req blockRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	if req.BlockedID == userID {
		httpx.WriteError(w, "validation_failed", "cannot block yourself", nil)
		return
	}

	if _, err := s.queries.GetUserByID(r.Context(), req.BlockedID); err != nil {
		httpx.WriteError(w, "not_found", "user not found", nil)
		return
	}

	if err := s.queries.CreateBlock(r.Context(), userID, req.BlockedID); err != nil {
		httpx.WriteError(w, "internal", "could not block user", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"status":  "blocked",
		"blocked": req.BlockedID,
	})
}

func (s *Service) RemoveBlock(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	blockedID := chi.URLParam(r, "id")
	if blockedID == "" {
		httpx.WriteError(w, "validation_failed", "blocked user id required", nil)
		return
	}

	if err := s.queries.RemoveBlock(r.Context(), userID, blockedID); err != nil {
		httpx.WriteError(w, "internal", "could not unblock user", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "unblocked",
	})
}

type createReportRequest struct {
	TargetUserID string `json:"target_user_id" validate:"required,uuid"`
	Reason       string `json:"reason" validate:"required,min=5,max=1000"`
}

func (s *Service) CreateReport(w http.ResponseWriter, r *http.Request) {
	reporterID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req createReportRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if err := validate.Struct(&req); err != nil {
		httpx.WriteError(w, "validation_failed", "validation failed", httpx.ValidationErrors(err))
		return
	}

	if req.TargetUserID == reporterID {
		httpx.WriteError(w, "validation_failed", "cannot report yourself", nil)
		return
	}

	if _, err := s.queries.GetUserByID(r.Context(), req.TargetUserID); err != nil {
		httpx.WriteError(w, "not_found", "user not found", nil)
		return
	}

	id, err := s.queries.CreateReport(r.Context(), reporterID, req.TargetUserID, req.Reason)
	if err != nil {
		httpx.WriteError(w, "internal", "could not create report", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"id":     id,
		"status": "open",
	})
}

type exportData struct {
	User             interface{}   `json:"user"`
	Mentorships      interface{}   `json:"mentorships"`
	Reports          interface{}   `json:"reports"`
	Blocks           interface{}   `json:"blocks"`
	PolicyAcceptance interface{}   `json:"policy_acceptances"`
}

func (s *Service) ExportMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	user, err := s.queries.GetUserByID(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, "not_found", "user not found", nil)
		return
	}

	mentorships, err := s.queries.ListMentorshipsByUser(r.Context(), userID, 100, "")
	if err != nil {
		mentorships = nil
	}

	blocks, err := s.queries.ListBlocks(r.Context(), userID, 100)
	if err != nil {
		blocks = nil
	}

	export := exportData{
		User: map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"full_name": user.FullName,
			"county":    user.County,
			"language":  user.Language,
			"status":    user.Status,
		},
		Mentorships: mentorships,
		Reports:     nil,
		Blocks:      blocks,
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": export,
	})
}

func (s *Service) DeleteMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	_, err := s.queries.GetUserByID(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, "not_found", "user not found", nil)
		return
	}

	if err := s.queries.SoftDeleteUser(r.Context(), userID); err != nil {
		httpx.WriteError(w, "internal", "could not delete account", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "deleted",
	})
}
