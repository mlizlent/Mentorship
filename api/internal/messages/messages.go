package messages

import (
	"context"
	"encoding/json"
	"net/http"
	"regexp"
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

func (s *Service) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", s.ListConversations)
	r.Post("/", s.CreateConversation)
	r.Route("/{conversationID}", func(r chi.Router) {
		r.Get("/messages", s.ListMessages)
		r.Post("/messages", s.CreateMessage)
		r.Route("/messages/{messageID}", func(r chi.Router) {
			r.Post("/report", s.ReportMessage)
		})
	})
	return r
}

func (s *Service) ListConversations(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.MessagingEnabled {
		httpx.WriteError(w, "forbidden", "messaging is disabled", nil)
		return
	}
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	limit := 20
	cursor := r.URL.Query().Get("cursor")
	targetUserID := userID

	// Guardian read-only view: ?mentee_id=X lists the mentee's conversations.
	if menteeID := r.URL.Query().Get("mentee_id"); menteeID != "" {
		if !s.cfg.GuardianCanViewMessages {
			httpx.WriteError(w, "forbidden", "guardian message viewing is disabled", nil)
			return
		}
		isGuardian, err := s.queries.IsGuardianOf(r.Context(), userID, menteeID)
		if err != nil || !isGuardian {
			httpx.WriteError(w, "forbidden", "not a guardian of this mentee", nil)
			return
		}
		targetUserID = menteeID
	}

	conversations, err := s.queries.ListConversations(r.Context(), targetUserID, limit, cursor)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list conversations", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": conversations,
		"meta": map[string]interface{}{
			"limit": limit,
		},
	})
}

func (s *Service) CreateConversation(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.MessagingEnabled {
		httpx.WriteError(w, "forbidden", "messaging is disabled", nil)
		return
	}
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	var req struct {
		MentorshipID string `json:"mentorship_id"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if req.MentorshipID == "" {
		httpx.WriteError(w, "validation_failed", "mentorship_id is required", nil)
		return
	}

	conversationID, err := s.queries.GetOrCreateConversation(r.Context(), req.MentorshipID, userID)
	if err != nil {
		httpx.WriteError(w, "forbidden", "not a participant in an active mentorship", nil)
		return
	}

	conversation, err := s.queries.GetConversation(r.Context(), conversationID, userID)
	if err != nil {
		httpx.WriteError(w, "internal", "could not load conversation", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"data": conversation,
	})
}

func (s *Service) ListMessages(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.MessagingEnabled {
		httpx.WriteError(w, "forbidden", "messaging is disabled", nil)
		return
	}
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	conversationID := chi.URLParam(r, "conversationID")

	limit := 50
	cursor := r.URL.Query().Get("cursor")

	_, err := s.queries.GetConversation(r.Context(), conversationID, userID)
	if err != nil {
		// Guardian may view a mentee's conversation.
		if menteeID := r.URL.Query().Get("mentee_id"); menteeID != "" {
			isGuardian, gErr := s.queries.IsGuardianOf(r.Context(), userID, menteeID)
			if gErr != nil || !isGuardian {
				httpx.WriteError(w, "forbidden", "conversation not found or access denied", nil)
				return
			}
			conversation, err := s.queries.GetConversation(r.Context(), conversationID, menteeID)
			if err != nil {
				httpx.WriteError(w, "forbidden", "conversation not found or access denied", nil)
				return
			}
			if conversation.MentorID != menteeID && conversation.MenteeID != menteeID {
				httpx.WriteError(w, "forbidden", "conversation not found or access denied", nil)
				return
			}
		} else {
			httpx.WriteError(w, "forbidden", "conversation not found or access denied", nil)
			return
		}
	}

	messages, err := s.queries.ListMessages(r.Context(), conversationID, userID, limit, cursor)
	if err != nil {
		httpx.WriteError(w, "internal", "could not list messages", nil)
		return
	}

	// Read receipts: mark the other participant's messages as read.
	if err := s.queries.MarkMessagesRead(r.Context(), conversationID, userID); err != nil {
		httpx.WriteError(w, "internal", "could not mark messages read", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"data": messages,
		"meta": map[string]interface{}{
			"limit": limit,
		},
	})
}

func (s *Service) CreateMessage(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.MessagingEnabled {
		httpx.WriteError(w, "forbidden", "messaging is disabled", nil)
		return
	}
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	conversationID := chi.URLParam(r, "conversationID")

	var req struct {
		Body string `json:"body"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if strings.TrimSpace(req.Body) == "" {
		httpx.WriteError(w, "validation_failed", "body is required", nil)
		return
	}
	if len(req.Body) > 4000 {
		httpx.WriteError(w, "validation_failed", "body must be at most 4000 characters", nil)
		return
	}

	conversation, err := s.queries.GetConversation(r.Context(), conversationID, userID)
	if err != nil {
		httpx.WriteError(w, "forbidden", "conversation not found or access denied", nil)
		return
	}

	if conversation.MentorID == "" || conversation.MenteeID == "" {
		httpx.WriteError(w, "forbidden", "messaging is closed for this mentorship", nil)
		return
	}

	originalBody := req.Body
	body := hideContactDetails(req.Body)
	contactRemoved := body != originalBody

	messageID, err := s.queries.CreateMessage(r.Context(), conversationID, userID, body)
	if err != nil {
		httpx.WriteError(w, "internal", "could not send message", nil)
		return
	}

	// Determine the recipient (the other participant).
	recipientID := conversation.MenteeID
	if userID == conversation.MenteeID {
		recipientID = conversation.MentorID
	}

	// Email notification via outbox for the recipient.
	payload, _ := json.Marshal(map[string]interface{}{
		"conversation_id": conversationID,
		"message_id":      messageID,
		"sender_id":       userID,
		"body":            body,
	})
	// Non-fatal: notification failure must not block message delivery.
	_ = s.queries.InsertOutboxNotification(r.Context(), recipientID, "new_message", string(payload))

	// Under-18 contact-detail admin flag.
	if contactRemoved {
		if under18, err := s.isUnder18(r.Context(), conversation.MenteeID); err == nil && under18 {
			flagPayload, _ := json.Marshal(map[string]interface{}{
				"conversation_id": conversationID,
				"message_id":      messageID,
				"sender_id":       userID,
				"reason":          "contact_details_removed_under_18",
			})
			_ = s.queries.InsertOutboxNotification(r.Context(), conversation.MentorID, "message_flagged", string(flagPayload))
			_ = s.queries.InsertOutboxNotification(r.Context(), conversation.MenteeID, "message_flagged", string(flagPayload))
		}
	}

	message, err := s.queries.GetMessage(r.Context(), messageID)
	if err != nil {
		httpx.WriteError(w, "internal", "could not load message", nil)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"data": message,
	})
}

func (s *Service) ReportMessage(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.MessagingEnabled {
		httpx.WriteError(w, "forbidden", "messaging is disabled", nil)
		return
	}
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, "unauthorized", "authentication required", nil)
		return
	}

	conversationID := chi.URLParam(r, "conversationID")
	messageID := chi.URLParam(r, "messageID")

	var req struct {
		Reason string `json:"reason"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, "validation_failed", "invalid request body", nil)
		return
	}
	if strings.TrimSpace(req.Reason) == "" {
		httpx.WriteError(w, "validation_failed", "reason is required", nil)
		return
	}

	_, err := s.queries.GetConversation(r.Context(), conversationID, userID)
	if err != nil {
		httpx.WriteError(w, "forbidden", "conversation not found or access denied", nil)
		return
	}

	msg, err := s.queries.GetMessage(r.Context(), messageID)
	if err != nil {
		httpx.WriteError(w, "not_found", "message not found", nil)
		return
	}
	if msg.ConversationID != conversationID {
		httpx.WriteError(w, "not_found", "message not found in this conversation", nil)
		return
	}

	// Flag the reported message for admin review via outbox.
	flagPayload, _ := json.Marshal(map[string]interface{}{
		"conversation_id": conversationID,
		"message_id":      messageID,
		"reporter_id":     userID,
		"reason":          req.Reason,
		"body":            msg.Body,
	})
	_ = s.queries.InsertOutboxNotification(r.Context(), userID, "message_reported", string(flagPayload))

	httpx.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"status": "reported",
	})
}

func (s *Service) isUnder18(ctx context.Context, userID string) (bool, error) {
	dob, err := s.queries.GetUserByIDForDob(ctx, userID)
	if err != nil {
		return false, err
	}
	if dob == nil {
		return false, nil
	}
	return isUnder18Dob(dob, time.Now()), nil
}

func isUnder18Dob(dob *time.Time, now time.Time) bool {
	if dob == nil {
		return false
	}
	age := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		age--
	}
	return age < 18
}

var contactLinkRe = regexp.MustCompile(`(?i)\b(https?://|www\.)\S+|\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[\w.%+\-]+@[\w.\-]+\.[a-z]{2,}\b`)

func hideContactDetails(body string) string {
	return contactLinkRe.ReplaceAllStringFunc(body, func(match string) string {
		return "[contact details removed]"
	})
}
