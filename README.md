# Bloodheroes API

Blood donation REST API rebuilt on **FastAPI + PostgreSQL (PostGIS) + H3**.

The previous Flask/PyMongo implementation has been retired; see git history for reference.

## Stack

- **FastAPI** (Python 3.12) served by **Granian** (Rust ASGI server)
- **PostgreSQL 16 + PostGIS** with raw **asyncpg** queries (no ORM)
- **H3** (`h3-py` v4) for geospatial candidate lookup, app-side
- **JWT** access + refresh tokens, **Argon2id** password hashing
- **yoyo-migrations** (plain SQL) for schema migrations
- Docker Compose for local/prod packaging

## Layout

```
app/
  main.py                 # FastAPI app factory + lifespan
  core/                   # config, exceptions, security, geo (H3)
  db/postgres.py          # asyncpg pool + connection dependency
  repositories/           # raw SQL data access
  services/               # business logic
  schemas/                # Pydantic request/response models
  api/
    deps.py               # app-token + bearer auth dependencies
    routers/              # auth, users, donations
migrations/               # yoyo SQL migrations (+ .rollback.sql)
tests/                    # pytest (unit + PostGIS integration)
```

## Configuration

Settings are read from environment variables prefixed `BH_` (or a local `.env`).
Copy `.env.example` to `.env` and adjust. Secrets are never committed; in
`production` the app refuses to start with the default `BH_JWT_SECRET`.

## Running locally

The quickest path uses the `Makefile`:

```bash
make install-dev     # create .venv and install project + dev deps
make db-up           # start PostgreSQL/PostGIS via docker compose
make migrate         # apply SQL migrations
make run             # granian dev server with autoreload on :8000
```

Or run everything with Docker:

```bash
docker compose up --build
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

Migrations run automatically on container start. Common `make` targets:

| Target | Description |
|---|---|
| `make run` / `make serve` | Granian dev (reload) / production server |
| `make test` | Ephemeral PostGIS DB + migrations + pytest |
| `make migrate` / `make migrate-rollback` | yoyo apply / rollback |
| `make lint` / `make format` / `make typecheck` | ruff / ruff format / mypy |
| `make db-up` / `make db-down` | dev database |
| `make docker-up` / `make docker-down` / `make logs` | compose stack |
| `make help` | list every target |

The server is **Granian** (`--interface asgi`); tune it with env vars such as
`GRANIAN_WORKERS`, `GRANIAN_LOG_LEVEL` and `GRANIAN_LOG_ACCESS_ENABLED`.

## Tests

```bash
make test           # self-contained: spins up PostGIS, migrates, runs pytest, tears down
# or, against a database you already run:
BH_DATABASE_URL=postgresql://bloodheroes:bloodheroes@localhost:55432/bloodheroes make test-local
```

Manual equivalent:

```bash
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
docker run -d --name bh-test-pg \
  -e POSTGRES_USER=bloodheroes -e POSTGRES_PASSWORD=bloodheroes \
  -e POSTGRES_DB=bloodheroes -p 55432:5432 postgis/postgis:16-3.4
yoyo apply --batch --database postgresql://bloodheroes:bloodheroes@localhost:55432/bloodheroes migrations
.venv/bin/pytest -q
.venv/bin/ruff check app tests migrations scripts
.venv/bin/mypy app scripts
```

## API (v1)

| Method | Path | Description |
|---|---|---|
| POST | `/v1/auth/login` | Email/password → access + refresh tokens |
| POST | `/v1/auth/refresh` | Rotate refresh token |
| POST | `/v1/auth/logout` | Revoke all refresh tokens |
| POST | `/v1/users` | Register (app token only) |
| GET | `/v1/users` | Search donors (H3 radius + filters) |
| GET/PUT/DELETE | `/v1/users/me` | Current user profile |
| GET | `/v1/users/{user_id}` | Public profile |
| POST/GET | `/v1/donations/requests` | Create / list requests |
| GET | `/v1/donations/requests/{id}` | Request detail |
| POST/GET | `/v1/donations/requests/{id}/offers` | Offer / list offers |
| PATCH | `/v1/donations/offers/{id}` | Accept (1), decline (2), accomplish (3) |
| GET | `/v1/donations/history` | Donations made by the current donor |

Authenticated routes require both `X-APP-TOKEN` and an `Authorization: Bearer <access_token>` header.

## Geospatial design

Each user/request stores `latitude`, `longitude`, an H3 `h3_cell` (indexed) and a
PostGIS `geography(Point, 4326)`. Radius search:

1. Compute the origin cell with `h3.latlng_to_cell(lat, lng, res)`.
2. Expand to a disk via `h3.grid_disk(origin, k)`, where
   `k = ceil(distance / avg_hex_edge_length(res)) + 1` (capped).
3. Filter candidates with `h3_cell = ANY(cells)`.
4. Exact-filter with PostGIS `ST_DWithin`.

Defaults live in config: `BH_H3_RESOLUTION=8`, `BH_DEFAULT_SEARCH_RADIUS_M=1000`,
`BH_MAX_SEARCH_RADIUS_M=50000`, `BH_MAX_GRID_DISK_K=50`.

## Migrating from MongoDB

`scripts/migrate_from_mongo.py` backfills existing Mongo data into Postgres and
re-hashes legacy passwords to Argon2id on next login. See the script header.

## Web apps (dashboard + client)

Next.js (TypeScript) monorepo under `web/`:

```
web/
  apps/dashboard/      # operations: map-first H3 search, requests, donors
  apps/client/         # donors/requesters: nearby discovery, requests, offers, history
  packages/api-client/ # typed API client (app token + JWT refresh)
  packages/ui/         # shared components, auth, map, backend proxy
  packages/geo/        # H3/octagon geometry helpers (unit-tested)
  e2e/                 # Playwright specs for both apps
```

Key design points:

- **H3 stays hexagonal** for indexing and search. The dashboard draws an
  **octagon overlay** (presentation only) derived from the authoritative backend
  cell geometry; an audit toggle shows the true H3 hexagon outlines.
- Browsers never see `X-APP-TOKEN`: both apps proxy API calls through
  same-origin `/api/backend/*` routes that inject the token server-side
  (`BH_APP_TOKEN`). JWT access/refresh continues to rotate per user.
- `GET /v1/geo/cell` and `GET /v1/geo/disk` return the authoritative cell ID,
  resolution, center, and boundary polygons so the UI never drifts from the backend.
- The default app token (`dev-app-token-change-me`, seeded by
  `migrations/0003_seed_app_token.sql`) must be rotated in production via
  `BH_APP_TOKEN`.

```bash
make web-install       # npm install the web workspace
make web-dev-dashboard # dashboard on :3001 (BH_API_BASE_URL/BH_APP_TOKEN env)
make web-dev-client    # client on :3002
make web-typecheck     # tsc across workspaces
make web-test          # vitest unit tests
make web-build         # next build both apps
make web-e2e           # ephemeral API+DB+apps, then Playwright
```

Or run the full stack with Docker: `docker compose up --build`
(API :8000, dashboard :3001, client :3002).
