.PHONY: db-up db-down migrate seed run-api run-web test lint dev

DB_URL ?= postgres://malkia:malkia@localhost:5432/malkia?sslmode=disable

db-up:
	docker compose up -d db

db-down:
	docker compose down

migrate:
	@which migrate > /dev/null 2>&1 || { echo "golang-migrate not installed. Run: go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest"; exit 1; }
	migrate -path api/internal/db/migrations -database "$(DB_URL)" up

seed:
	@go run ./api/scripts/seed.go

run-api:
	@cd api && go run ./cmd/server

run-web:
	@cd web && npm run dev

test:
	@cd api && go test ./...
	@cd web && npm test

lint:
	@cd api && golangci-lint run ./...
	@cd web && npm run lint

dev: db-up migrate seed
	@make run-api & make run-web
