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
        test test-local test-db-up test-db-down migrate migrate-rollback \
        db-up db-down docker-build docker-up docker-down logs clean

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
