SHELL := /bin/bash
.DEFAULT_GOAL := help

PYTHON      ?= .venv/bin/python
PIP         ?= .venv/bin/pip
GRANIAN     ?= .venv/bin/granian
YOYO        ?= .venv/bin/yoyo
RUFF        ?= .venv/bin/ruff
MYPY        ?= .venv/bin/mypy
PYTEST      ?= .venv/bin/pytest

APP         ?= app.main:app
HOST        ?= 0.0.0.0
PORT        ?= 8000
WORKERS     ?= 1

DATABASE_URL      ?= postgresql://bloodheroes:bloodheroes@localhost:5432/bloodheroes
TEST_DB_CONTAINER ?= bloodheroes-test-pg
TEST_DATABASE_URL ?= postgresql://bloodheroes:bloodheroes@localhost:55432/bloodheroes
POSTGIS_IMAGE     ?= postgis/postgis:16-3.4

.PHONY: help venv install install-dev run serve lint format typecheck \
        test test-local test-db-up test-db-down migrate migrate-rollback seed-dev \
        db-up db-down docker-build docker-up docker-down logs clean \
        web-install web-typecheck web-test web-build web-dev-dashboard web-dev-client web-e2e

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

venv: ## Create the virtualenv
	python3 -m venv .venv

install: venv ## Install runtime dependencies
	$(PIP) install -e .

install-dev: venv ## Install project + dev dependencies
	$(PIP) install -e ".[dev]"

run: ## Run the dev server with autoreload (granian)
	$(GRANIAN) --interface asgi --host $(HOST) --port $(PORT) --reload $(APP)

serve: ## Run the production server (granian)
	$(GRANIAN) --interface asgi --host $(HOST) --port $(PORT) --workers $(WORKERS) $(APP)

lint: ## Lint with ruff
	$(RUFF) check app tests migrations scripts

format: ## Format with ruff
	$(RUFF) format app tests scripts

typecheck: ## Type-check with mypy
	$(MYPY) app scripts

migrate: ## Apply SQL migrations to the configured database
	$(YOYO) apply --batch --database "$(DATABASE_URL)" migrations

migrate-rollback: ## Roll back the latest migration
	$(YOYO) rollback --batch --database "$(DATABASE_URL)" migrations

seed-dev: ## Seed a dev operator account (SEED_OPERATOR_EMAIL/PASSWORD)
	$(PYTHON) scripts/seed_dev_operator.py

db-up: ## Start the development database (docker compose)
	docker compose up -d db

db-down: ## Stop the development database
	docker compose stop db

test-db-up: ## Start an ephemeral PostGIS test database on port 55432
	@docker rm -f $(TEST_DB_CONTAINER) >/dev/null 2>&1 || true
	docker run -d --name $(TEST_DB_CONTAINER) \
		-e POSTGRES_USER=bloodheroes -e POSTGRES_PASSWORD=bloodheroes \
		-e POSTGRES_DB=bloodheroes -p 55432:5432 $(POSTGIS_IMAGE) >/dev/null
	@echo "waiting for $(TEST_DB_CONTAINER) to finish initialisation..."
	@until docker logs $(TEST_DB_CONTAINER) 2>&1 | grep -q "ready for start up"; do sleep 1; done
	@until docker exec $(TEST_DB_CONTAINER) pg_isready -U bloodheroes >/dev/null 2>&1; do sleep 1; done

test-db-down: ## Remove the ephemeral test database
	@docker rm -f $(TEST_DB_CONTAINER) >/dev/null 2>&1 || true

test: test-db-up ## Run the suite against an ephemeral PostGIS database
	@trap 'docker rm -f $(TEST_DB_CONTAINER) >/dev/null 2>&1 || true' EXIT; \
	$(YOYO) apply --batch --database "$(TEST_DATABASE_URL)" migrations && \
	BH_DATABASE_URL=$(TEST_DATABASE_URL) $(PYTEST) -q

test-local: ## Run tests against an existing database (BH_DATABASE_URL)
	$(PYTEST) -q

docker-build: ## Build the Docker image
	docker compose build

docker-up: ## Start the full stack (db + api)
	docker compose up -d --build

docker-down: ## Stop the full stack
	docker compose down

logs: ## Tail API logs
	docker compose logs -f api

clean: ## Remove caches and build artifacts
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	rm -rf .pytest_cache .ruff_cache .mypy_cache build dist *.egg-info

NPM               ?= npm
WEB_DIR           ?= web
WEB_API_PORT      ?= 8012
WEB_DASH_PORT     ?= 3001
WEB_CLIENT_PORT   ?= 3002
WEB_APP_TOKEN     ?= dev-app-token-change-me

web-install: ## Install web workspace dependencies
	cd $(WEB_DIR) && $(NPM) install --no-audit --no-fund

web-typecheck: ## Type-check all web workspaces
	cd $(WEB_DIR) && $(NPM) run typecheck --workspaces --if-present

web-test: ## Run web unit tests (geo, api-client)
	cd $(WEB_DIR) && $(NPM) run test --workspaces --if-present

web-build: ## Production-build dashboard and client
	cd $(WEB_DIR) && $(NPM) run build --workspace @bloodheroes/dashboard
	cd $(WEB_DIR) && $(NPM) run build --workspace @bloodheroes/client

web-dev-dashboard: ## Run the dashboard dev server
	cd $(WEB_DIR) && $(NPM) run dev --workspace @bloodheroes/dashboard

web-dev-client: ## Run the client dev server
	cd $(WEB_DIR) && $(NPM) run dev --workspace @bloodheroes/client

web-e2e: test-db-up ## Run Playwright E2E against an ephemeral stack
	@set -e; trap 'kill $$API_PID $$DASH_PID $$CLIENT_PID 2>/dev/null; docker rm -f $(TEST_DB_CONTAINER) >/dev/null 2>&1 || true' EXIT; \
	ROOT="$$PWD"; \
	$(YOYO) apply --batch --database "$(TEST_DATABASE_URL)" migrations; \
	BH_DATABASE_URL=$(TEST_DATABASE_URL) BH_ENVIRONMENT=testing \
		BH_JWT_SECRET=0123456789abcdef0123456789abcdef \
		$(GRANIAN) --interface asgi --host 127.0.0.1 --port $(WEB_API_PORT) $(APP) & \
	API_PID=$$!; \
	for _ in $$(seq 1 60); do \
		curl -fsS http://127.0.0.1:$(WEB_API_PORT)/health >/dev/null 2>&1 && break; \
		sleep 1; \
	done; \
	cd $$ROOT/$(WEB_DIR); BH_API_BASE_URL=http://127.0.0.1:$(WEB_API_PORT) BH_APP_TOKEN=$(WEB_APP_TOKEN) \
		./node_modules/.bin/next dev --port $(WEB_DASH_PORT) apps/dashboard & \
	DASH_PID=$$!; \
	cd $$ROOT/$(WEB_DIR); BH_API_BASE_URL=http://127.0.0.1:$(WEB_API_PORT) BH_APP_TOKEN=$(WEB_APP_TOKEN) \
		./node_modules/.bin/next dev --port $(WEB_CLIENT_PORT) apps/client & \
	CLIENT_PID=$$!; \
	for _ in $$(seq 1 120); do \
		curl -fsS http://127.0.0.1:$(WEB_DASH_PORT)/login >/dev/null 2>&1 && \
		curl -fsS http://127.0.0.1:$(WEB_CLIENT_PORT)/login >/dev/null 2>&1 && break; \
		sleep 1; \
	done; \
	cd $$ROOT/$(WEB_DIR); E2E_API_URL=http://127.0.0.1:$(WEB_API_PORT) \
		E2E_DASH_URL=http://127.0.0.1:$(WEB_DASH_PORT) \
		E2E_CLIENT_URL=http://127.0.0.1:$(WEB_CLIENT_PORT) \
		E2E_APP_TOKEN=$(WEB_APP_TOKEN) npx playwright test
