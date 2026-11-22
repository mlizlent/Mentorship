package messages

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestHideContactDetails(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "no contact details",
			input: "Hello, when is our next session?",
			want:  "Hello, when is our next session?",
		},
		{
			name:  "phone number",
			input: "Call me at 0712345678",
			want:  "Call me at [contact details removed]",
		},
		{
			name:  "email address",
			input: "Email me at jane@example.com",
			want:  "Email me at [contact details removed]",
		},
		{
			name:  "https URL",
			input: "Meet at https://meet.jit.si/room",
			want:  "Meet at [contact details removed]",
		},
		{
			name:  "www URL",
			input: "Visit www.example.org",
			want:  "Visit [contact details removed]",
		},
		{
			name:  "multiple contact details",
			input: "Call 0712345678 or email a@b.co",
			want:  "Call [contact details removed] or email [contact details removed]",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, hideContactDetails(tt.input))
		})
	}
}

func TestIsUnder18Dob(t *testing.T) {
	now := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC)
	tests := []struct {
		name string
		dob  *time.Time
		want bool
	}{
		{"17 years old", timePtr(time.Date(2009, 3, 1, 0, 0, 0, 0, time.UTC)), true},
		{"18 years old (birthday passed)", timePtr(time.Date(2008, 1, 10, 0, 0, 0, 0, time.UTC)), false},
		{"18 years old (birthday not yet)", timePtr(time.Date(2008, 2, 1, 0, 0, 0, 0, time.UTC)), true},
		{"10 years old", timePtr(time.Date(2016, 6, 1, 0, 0, 0, 0, time.UTC)), true},
		{"nil dob", nil, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.dob == nil {
				assert.False(t, isUnder18Dob(nil, now))
				return
			}
			assert.Equal(t, tt.want, isUnder18Dob(tt.dob, now))
		})
	}
}

func timePtr(t time.Time) *time.Time {
	return &t
}
