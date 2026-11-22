package admin

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"malkia-mentor/api/internal/auth"
	"malkia-mentor/api/internal/config"
	"malkia-mentor/api/internal/db"
)

func setupTestService(t *testing.T) (*Service, *db.Queries) {
	t.Helper()

	databaseURL := "postgres://malkia:malkia@localhost:5432/malkia_test?sslmode=disable"
	if v, ok := os.LookupEnv("TEST_DATABASE_URL"); ok && v != "" {
		databaseURL = v
	}

	conn, err := db.Open(databaseURL, 5)
	if err != nil {
		t.Skipf("skipping admin test: cannot connect to test database: %v", err)
	}
	t.Cleanup(func() { conn.Close(context.Background()) })

	queries := db.New(conn)
	cfg := &config.Config{
		Environment: "test",
		JWTSecret:   "test-secret",
	}

	return &Service{queries: queries, cfg: cfg}, queries
}

func createTestUser(t *testing.T, queries *db.Queries, role string) string {
	t.Helper()
	userID := uuid.New()
	_, err := queries.CreateUser(context.Background(), userID.String(), "test"+role+"@example.com", "hash", role, "Test "+role, nil, "Nairobi", "en")
	require.NoError(t, err)
	return userID.String()
}

func createTestMentor(t *testing.T, queries *db.Queries, userID string, verified bool) {
	t.Helper()
	err := queries.CreateMentorProfile(context.Background(), userID, "bio", []string{"go"}, 5, 20, []string{"en"}, "{}", 3)
	require.NoError(t, err)
	if verified {
		err = queries.UpdateMentorVerification(context.Background(), userID, true, "00000000-0000-0000-0000-000000000000")
		require.NoError(t, err)
	}
}

func authCtx(userID string) context.Context {
	return auth.WithUserID(context.Background(), userID)
}

func TestAdminOnlyMiddlewareRejectsNonAdmin(t *testing.T) {
	service, _ := setupTestService(t)
	if service == nil {
		return
	}

	menteeID := createTestUser(t, service.queries, "mentee")

	req := httptest.NewRequest(http.MethodGet, "/admin/mentors", nil)
	req = req.WithContext(authCtx(menteeID))
	w := httptest.NewRecorder()

	service.adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})).ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestAdminOnlyMiddlewareAllowsAdmin(t *testing.T) {
	service, _ := setupTestService(t)
	if service == nil {
		return
	}

	adminID := createTestUser(t, service.queries, "admin")

	req := httptest.NewRequest(http.MethodGet, "/admin/mentors", nil)
	req = req.WithContext(authCtx(adminID))
	w := httptest.NewRecorder()

	service.adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})).ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestListMentorsForAdmin(t *testing.T) {
	service, queries := setupTestService(t)
	if service == nil {
		return
	}

	adminID := createTestUser(t, queries, "admin")
	mentorID := createTestUser(t, queries, "mentor")
	createTestMentor(t, queries, mentorID, false)

	req := httptest.NewRequest(http.MethodGet, "/admin/mentors?status=unverified", nil)
	req = req.WithContext(authCtx(adminID))
	w := httptest.NewRecorder()

	service.ListMentors(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), mentorID)
}

func TestVerifyMentor(t *testing.T) {
	service, queries := setupTestService(t)
	if service == nil {
		return
	}

	adminID := createTestUser(t, queries, "admin")
	mentorID := createTestUser(t, queries, "mentor")
	createTestMentor(t, queries, mentorID, false)

	req := httptest.NewRequest(http.MethodPatch, "/admin/mentors/"+mentorID+"/verify", strings.NewReader(`{"verified":true}`))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(authCtx(adminID))
	w := httptest.NewRecorder()

	service.VerifyMentor(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	profile, err := queries.GetMentorProfile(authCtx(adminID), mentorID)
	require.NoError(t, err)
	assert.NotNil(t, profile.VerifiedAt)
}

func TestListReportsForAdmin(t *testing.T) {
	service, queries := setupTestService(t)
	if service == nil {
		return
	}

	adminID := createTestUser(t, queries, "admin")
	reporterID := createTestUser(t, queries, "mentee")
	targetID := createTestUser(t, queries, "mentor")

	_, err := queries.CreateReport(context.Background(), reporterID, targetID, "harassment")
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/admin/reports?status=open", nil)
	req = req.WithContext(authCtx(adminID))
	w := httptest.NewRecorder()

	service.ListReports(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), targetID)
}

func TestResolveReport(t *testing.T) {
	service, queries := setupTestService(t)
	if service == nil {
		return
	}

	adminID := createTestUser(t, queries, "admin")
	reporterID := createTestUser(t, queries, "mentee")
	targetID := createTestUser(t, queries, "mentor")

	reportID, err := queries.CreateReport(context.Background(), reporterID, targetID, "harassment")
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPatch, "/admin/reports/"+reportID, strings.NewReader(`{"resolution_note":"warning issued"}`))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(authCtx(adminID))
	w := httptest.NewRecorder()

	service.ResolveReport(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
