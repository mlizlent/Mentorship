package matching

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strings"

	"malkia-mentor/api/internal/config"
)

type SignalBreakdown struct {
	Skills         float64 `json:"skills"`
	Availability   float64 `json:"availability"`
	Capacity       float64 `json:"capacity"`
	Language       float64 `json:"language"`
	ExperienceFit  float64 `json:"experience_fit"`
	Total          float64 `json:"total"`
}

type Suggestion struct {
	MentorID   string             `json:"mentor_id"`
	FullName   string             `json:"full_name"`
	Score      float64            `json:"score"`
	Breakdown  SignalBreakdown    `json:"breakdown"`
	Reason     string             `json:"reason"`
}

type MentorInput struct {
	ID               string
	FullName         string
	Expertise        []string
	YearsExperience  int
	Languages        []string
	MaxMentees       int
	ActiveMentees    int
	Availability     map[string]bool // day -> available
	ApprovedForMinors bool
}

type MenteeInput struct {
	ID              string
	Interests       []string
	Level           string // beginner, intermediate, advanced
	Languages       []string
	Availability    map[string]bool // day -> available
	IsMinor         bool
}

type Service struct {
	cfg *config.Config
}

func NewService(cfg *config.Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) Score(mentee MenteeInput, mentor MentorInput) (SignalBreakdown, string) {
	w := s.cfg.MatchingWeights
	totalWeight := float64(w.Skills + w.Availability + w.Capacity + w.Language + w.ExperienceFit)

	skills := skillScore(mentee.Interests, mentor.Expertise)
	availability := availabilityScore(mentee.Availability, mentor.Availability)
	capacity := capacityScore(mentor.ActiveMentees, mentor.MaxMentees)
	language := languageScore(mentee.Languages, mentor.Languages)
	experienceFit := experienceFitScore(mentee.Level, mentor.YearsExperience)

	total := (skills*float64(w.Skills) + availability*float64(w.Availability) +
		capacity*float64(w.Capacity) + language*float64(w.Language) +
		experienceFit*float64(w.ExperienceFit)) / totalWeight

	reason := reasonString(skills, availability, capacity, language, experienceFit, mentor.FullName)

	return SignalBreakdown{
		Skills:         skills,
		Availability:   availability,
		Capacity:       capacity,
		Language:       language,
		ExperienceFit:  experienceFit,
		Total:          math.Round(total*100) / 100,
	}, reason
}

// IsEligible returns false when a minor mentee is paired with a mentor who
// is not approved for working with minors. Adult mentees can match with any mentor.
func (s *Service) IsEligible(mentee MenteeInput, mentor MentorInput) bool {
	if mentee.IsMinor && !mentor.ApprovedForMinors {
		return false
	}
	return true
}

func skillScore(interests, expertise []string) float64 {
	if len(interests) == 0 {
		return 0
	}
	expertiseSet := make(map[string]bool)
	for _, e := range expertise {
		expertiseSet[strings.ToLower(e)] = true
	}
	matched := 0
	for _, i := range interests {
		if expertiseSet[strings.ToLower(i)] {
			matched++
		}
	}
	return float64(matched) / float64(len(interests)) * 100
}

func availabilityScore(menteeAvail, mentorAvail map[string]bool) float64 {
	if len(menteeAvail) == 0 {
		return 0
	}
	overlap := 0
	for day := range menteeAvail {
		if mentorAvail[day] {
			overlap++
		}
	}
	return float64(overlap) / float64(len(menteeAvail)) * 100
}

func capacityScore(active, max int) float64 {
	if max == 0 {
		return 0
	}
	free := max - active
	if free < 0 {
		free = 0
	}
	return float64(free) / float64(max) * 100
}

func languageScore(menteeLangs, mentorLangs []string) float64 {
	if len(menteeLangs) == 0 {
		return 50
	}
	mentorSet := make(map[string]bool)
	for _, l := range mentorLangs {
		mentorSet[strings.ToLower(l)] = true
	}
	for _, l := range menteeLangs {
		if mentorSet[strings.ToLower(l)] {
			return 100
		}
	}
	return 0
}

func experienceFitScore(menteeLevel string, yearsExp int) float64 {
	levelMin := map[string]int{
		"beginner":      0,
		"intermediate":  3,
		"advanced":      6,
	}[menteeLevel]

	if yearsExp >= levelMin+2 {
		return 100
	}
	if yearsExp >= levelMin {
		return 75
	}
	if yearsExp >= levelMin-2 {
		return 50
	}
	return 25
}

func reasonString(skills, availability, capacity, language, experienceFit float64, name string) string {
	parts := []string{}
	if skills >= 75 {
		parts = append(parts, "strong skill alignment")
	} else if skills >= 40 {
		parts = append(parts, "good skill overlap")
	}
	if availability >= 75 {
		parts = append(parts, "great availability match")
	}
	if capacity >= 75 {
		parts = append(parts, "plenty of capacity")
	}
	if language == 100 {
		parts = append(parts, "shared language")
	}
	if experienceFit >= 75 {
		parts = append(parts, "right experience level")
	}

	if len(parts) == 0 {
		return fmt.Sprintf("%s is a potential match.", name)
	}
	return fmt.Sprintf("%s is a good match because of %s.", name, strings.Join(parts, ", "))
}

func (s *Service) Suggestions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"data": []Suggestion{},
	})
}
