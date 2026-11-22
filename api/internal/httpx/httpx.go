package httpx

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func WriteError(w http.ResponseWriter, code, message string, fields map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	switch code {
	case "not_found":
		w.WriteHeader(http.StatusNotFound)
	case "unauthorized":
		w.WriteHeader(http.StatusUnauthorized)
	case "forbidden":
		w.WriteHeader(http.StatusForbidden)
	case "conflict":
		w.WriteHeader(http.StatusConflict)
	case "validation_failed":
		w.WriteHeader(http.StatusUnprocessableEntity)
	default:
		w.WriteHeader(http.StatusInternalServerError)
	}
	_ = json.NewEncoder(w).Encode(ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Fields:  fields,
		},
	})
}

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func DecodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func ValidationErrors(err error) map[string]string {
	fields := make(map[string]string)
	if err == nil {
		return fields
	}
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		return fields
	}
	for _, e := range validationErrors {
		fields[e.Field()] = validationMessage(e)
	}
	return fields
}

func validationMessage(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email"
	case "min":
		return "must be at least " + e.Param() + " characters"
	case "max":
		return "must be at most " + e.Param() + " characters"
	case "oneof":
		return "must be one of: " + e.Param()
	case "eq":
		return "must be true"
	case "gte":
		return "must be greater than or equal to " + e.Param()
	case "lte":
		return "must be less than or equal to " + e.Param()
	case "len":
		return "must be exactly " + e.Param() + " characters"
	default:
		return "is invalid"
	}
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Info("request", "method", r.Method, "path", r.URL.Path, "remote", strings.Split(r.RemoteAddr, ":")[0])
		next.ServeHTTP(w, r)
	})
}

func JSONContentType(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
