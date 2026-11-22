package matching

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"malkia-mentor/api/internal/config"
)

func TestSkillScore(t *testing.T) {
	tests := []struct {
		name      string
		interests []string
		expertise []string
		expected  float64
	}{
		{"all match", []string{"react", "go"}, []string{"react", "go", "python"}, 100},
		{"partial match", []string{"react", "go", "rust"}, []string{"react", "go"}, 66.66666666666666},
		{"no match", []string{"rust"}, []string{"react", "go"}, 0},
		{"empty interests", []string{}, []string{"react", "go"}, 0},
		{"case insensitive", []string{"React"}, []string{"react"}, 100},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := skillScore(tt.interests, tt.expertise)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestAvailabilityScore(t *testing.T) {
	tests := []struct {
		name     string
		mentee   map[string]bool
		mentor   map[string]bool
		expected float64
	}{
		{"full overlap", map[string]bool{"mon": true, "wed": true}, map[string]bool{"mon": true, "wed": true, "fri": true}, 100},
		{"partial overlap", map[string]bool{"mon": true, "wed": true, "fri": true}, map[string]bool{"mon": true}, 33.33333333333333},
		{"no overlap", map[string]bool{"mon": true}, map[string]bool{"tue": true}, 0},
		{"empty mentee", map[string]bool{}, map[string]bool{"mon": true}, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := availabilityScore(tt.mentee, tt.mentor)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestCapacityScore(t *testing.T) {
	tests := []struct {
		name     string
		active   int
		max      int
		expected float64
	}{
		{"full capacity", 3, 3, 0},
		{"half capacity", 1, 4, 75},
		{"no mentees", 0, 3, 100},
		{"zero max", 0, 0, 0},
		{"over capacity", 5, 3, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := capacityScore(tt.active, tt.max)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestLanguageScore(t *testing.T) {
	tests := []struct {
		name        string
		menteeLangs []string
		mentorLangs []string
		expected    float64
	}{
		{"shared language", []string{"en", "sw"}, []string{"en"}, 100},
		{"no shared", []string{"en"}, []string{"sw"}, 0},
		{"empty mentee", []string{}, []string{"en"}, 50},
		{"case insensitive", []string{"EN"}, []string{"en"}, 100},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := languageScore(tt.menteeLangs, tt.mentorLangs)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestExperienceFitScore(t *testing.T) {
	tests := []struct {
		name     string
		level    string
		yearsExp int
		expected float64
	}{
		{"beginner with enough exp", "beginner", 5, 100},
		{"beginner with minimal exp", "beginner", 0, 75},
		{"intermediate with enough exp", "intermediate", 6, 100},
		{"intermediate with minimal exp", "intermediate", 3, 75},
		{"advanced with enough exp", "advanced", 8, 100},
		{"advanced below exp", "advanced", 3, 25},
		{"unknown level with exp", "unknown", 5, 100},
		{"unknown level minimal", "unknown", 0, 75},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := experienceFitScore(tt.level, tt.yearsExp)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestScoreTotal(t *testing.T) {
	s := &Service{cfg: &config.Config{MatchingWeights: config.MatchingWeights{
		Skills:        40,
		Availability:  25,
		Capacity:      15,
		Language:      10,
		ExperienceFit: 10,
	}}}
	mentee := MenteeInput{
		ID:           "mentee-1",
		Interests:    []string{"react", "go"},
		Level:        "beginner",
		Languages:    []string{"en"},
		Availability: map[string]bool{"mon": true, "wed": true},
	}
	mentor := MentorInput{
		ID:              "mentor-1",
		FullName:        "Test Mentor",
		Expertise:       []string{"react", "go", "python"},
		YearsExperience: 5,
		Languages:       []string{"en", "sw"},
		MaxMentees:      3,
		ActiveMentees:   1,
		Availability:    map[string]bool{"mon": true, "wed": true, "fri": true},
	}

	breakdown, reason := s.Score(mentee, mentor)

	assert.GreaterOrEqual(t, breakdown.Total, 0.0)
	assert.LessOrEqual(t, breakdown.Total, 100.0)
	assert.GreaterOrEqual(t, breakdown.Skills, 0.0)
	assert.GreaterOrEqual(t, breakdown.Availability, 0.0)
	assert.GreaterOrEqual(t, breakdown.Capacity, 0.0)
	assert.GreaterOrEqual(t, breakdown.Language, 0.0)
	assert.GreaterOrEqual(t, breakdown.ExperienceFit, 0.0)
	assert.Contains(t, reason, mentor.FullName)
	assert.NotEmpty(t, reason)
}
