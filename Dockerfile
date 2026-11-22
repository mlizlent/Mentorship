# Multi-stage Dockerfile for CrownPath (API + Web)
# Usage: docker build -t crownpath . && docker run -p 8080:8080 -p 80:80 crownpath

# =============================================================================
# STAGE 1: Build Go API
# =============================================================================
FROM golang:1.26-alpine AS api-builder

WORKDIR /app/api

# Install build dependencies
RUN apk add --no-cache git make

# Copy go mod and sum files
COPY api/go.mod api/go.sum ./

# Download dependencies
RUN go mod download

# Copy API source code
COPY api/ ./

# Build the API binary
RUN CGO_ENABLED=0 go build -o bin/server ./cmd/server

# =============================================================================
# STAGE 2: Build React Web App
# =============================================================================
FROM node:22-alpine AS web-builder

WORKDIR /app/web

# Copy package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci

# Copy web source code
COPY web/ ./

# Build the web app (uses VITE_API_URL from build arg)
ARG VITE_API_URL=http://localhost:8080/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# =============================================================================
# STAGE 3: Production - Nginx for Web + API
# =============================================================================
FROM nginx:alpine AS production

# Install runtime dependencies for Go binary
RUN apk add --no-cache ca-certificates

# Copy API binary
COPY --from=api-builder /app/api/bin/server /usr/local/bin/server

# Copy migrations for runtime
COPY --from=api-builder /app/api/internal/db/migrations /migrations

# Copy built web assets
COPY --from=web-builder /app/web/dist /usr/share/nginx/html

# Copy nginx config for SPA routing + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/readyz || exit 1

# Start both services
ENTRYPOINT ["/docker-entrypoint.sh"]