package auth

import "context"

type ctxKey int

const (
	userIDKey ctxKey = iota
)

func withUserID(ctx context.Context, value string) context.Context {
	return context.WithValue(ctx, userIDKey, value)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(userIDKey).(string)
	return v, ok
}
