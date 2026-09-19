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
