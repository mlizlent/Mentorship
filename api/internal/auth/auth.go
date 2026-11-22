package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
	"malkia-mentor/api/internal/httpx"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrTokenExpired       = errors.New("token expired")
	ErrTokenRevoked       = errors.New("token revoked")
)

type Service struct {
	queries *db.Queries
	cfg     *config.Config
}

func NewService(queries *db.Queries, cfg *config.Config) *Service {
	return &Service{queries: queries, cfg: cfg}
}

func (s *Service) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), s.cfg.BcryptCost)
	return string(bytes), err
}

func (s *Service) CheckPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func (s *Service) MakeAccessToken(userID string, role string) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.AccessTokenTTL)),
		IssuedAt:  jwt.NewNumericDate(now),
		Issuer:    "malkia-mentor",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *Service) MakeRefreshToken() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	rawStr := base64.URLEncoding.EncodeToString(raw)
	hash, err := bcrypt.GenerateFromPassword([]byte(rawStr), s.cfg.BcryptCost)
	if err != nil {
		return "", "", err
	}
	return rawStr, string(hash), nil
}

func (s *Service) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := r.Header.Get("Authorization")
		if tokenStr == "" {
			cookie, err := r.Cookie("access_token")
			if err != nil {
				httpx.WriteError(w, "unauthorized", "authentication required", nil)
				return
			}
			tokenStr = cookie.Value
		} else if len(tokenStr) > 7 && tokenStr[:7] == "Bearer " {
			tokenStr = tokenStr[7:]
		}

		claims, err := s.validateToken(tokenStr)
		if err != nil {
			if errors.Is(err, ErrTokenExpired) {
				httpx.WriteError(w, "unauthorized", "token expired", nil)
			} else {
				httpx.WriteError(w, "unauthorized", "invalid token", nil)
			}
			return
		}

		ctx := withUserID(r.Context(), claims.Subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func (s *Service) validateToken(tokenStr string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(token *jwt.Token) (any, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, err
	}
	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, ErrInvalidCredentials
}

// SubjectFromToken verifies the access token signature and returns its subject
// even when the token has expired. It is used by the refresh flow to identify
// the user whose refresh token cookie should be validated.
func (s *Service) SubjectFromToken(tokenStr string) (string, error) {
	if tokenStr == "" {
		return "", ErrInvalidCredentials
	}

	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(
		tokenStr,
		claims,
		func(token *jwt.Token) (any, error) {
			return []byte(s.cfg.JWTSecret), nil
		},
		jwt.WithoutClaimsValidation(),
	)
	if err != nil {
		return "", err
	}
	if claims.Subject == "" {
		return "", ErrInvalidCredentials
	}
	return claims.Subject, nil
}
