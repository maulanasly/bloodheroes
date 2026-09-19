# AGENTS.md

Guidance for autonomous and human contributors working in this repository.

## Mindset — operate as a principal engineer

- Optimize for **correctness, security, and maintainability** over speed. A quick
  hack that costs future velocity is a regression, not a win.
- Make **small, reversible, reviewable** changes. Prefer several focused commits
  over one sprawling diff.
- **Every behavior change ships with tests, lint, and type checks.** If you cannot
  test it, explain why in the PR and add a follow-up.
- Treat the **public API as a contract**. No breaking change to routes, payloads,
  or error shapes without a version bump and a migration note.
- **Security first.** Secrets live in the environment only (never in code, logs, or
  fixtures). Validate input at the boundary, enforce ownership/least privilege, and
  never trust client-supplied identifiers.
- **Measure before optimizing.** Use the DB's indexes; never add an unbounded
  query, scan, or H3 grid disk. Respect the configured radius/`k` caps.
- **Leave the system more legible than you found it.** Update docs and the context
  graph when architecture changes.

## Project overview

Blood donation API: **FastAPI** (Python 3.12) served by **Granian** (Rust ASGI),
**PostgreSQL 16 + PostGIS** via raw **asyncpg**, **H3** (`h3-py` v4) for geospatial
candidate lookup, JWT access/refresh, Argon2id hashing, `yoyo` SQL migrations.

Layering (keep dependencies pointing inward):

```
app/api (routers, deps) → app/services (business logic) → app/repositories (raw SQL) → app/db
app/core (config, security, geo, exceptions)  app/schemas (Pydantic v2)
```

- `migrations/` — yoyo `.sql` files; each needs a paired `.rollback.sql`.
- `tests/` — pytest; integration tests require a PostGIS database.
- `scripts/` — operational tooling (e.g. Mongo→Postgres backfill).

Run `make help` for the full command list; key targets are in the reference below.

## Context memory — graphify

This repo keeps a persistent knowledge graph as shared memory under
`graphify-out/`:

- `graphify-out/graph.json` — machine-readable graph (committed).
- `graphify-out/GRAPH_REPORT.md` — human-readable audit report (committed).
- `graphify-out/.graphify_*`, `graph.html`, `cost.json` — local/transient (gitignored).

Rules:

1. **Before exploring the codebase**, if `graphify-out/graph.json` exists, treat
   codebase questions as graph queries first instead of reading many files:
   - `graphify query "<question>"` — broad context (BFS); add `--dfs` to trace a path.
   - `graphify path "A" "B"` — shortest path between two concepts.
   - `graphify explain "X"` — plain-language explanation of a node and neighbors.
2. **After changing code or architecture**, refresh the graph (see workflow step 4)
   and commit the updated `graph.json` / `GRAPH_REPORT.md`. Never leave it stale.
3. **Honesty:** never invent nodes/edges; if the graph and the code disagree, trust
   the code and fix the graph.
4. graphify reads no API key for code-only corpora — AST extraction is deterministic.

## Required workflow for every change

### 1. Create a new branch

Start from an up-to-date `master` and use a descriptive prefix:

```bash
git switch master && git pull
git switch -c feat/<short-slug>    # or fix/<slug>, chore/<slug>, docs/<slug>
```

### 2. Read the context memory

Query the graph (see above) and skim `GRAPH_REPORT.md` and the modules you expect to
touch. State the blast radius — which layers, endpoints, tables, and migrations are
affected — before writing code.

### 3. Add tests and linter

- New behavior **requires** new tests (unit + integration where it hits the DB or geo
  logic). Bug fixes require a regression test.
- Run, and keep green:
  ```bash
  make lint        # ruff
  make format      # ruff format
  make typecheck   # mypy
  make test        # ephemeral PostGIS + migrations + pytest
  ```
- Any schema change must include a reversible migration (`migrations/NNNN_*.sql` +
  `.rollback.sql`) with seed-safe `ON CONFLICT` where relevant.

### 4. Update the graph

```bash
graphify update .        # code-only: AST refresh, no LLM needed
# or, for a first full build / docs+images:  /graphify .
git add graphify-out/graph.json graphify-out/GRAPH_REPORT.md
```

### 5. Create a PR

```bash
git push -u origin HEAD
gh pr create --base master --fill   # or write the body from the template
```

Fill the PR template: summary, context/blast radius, test evidence, risk & rollback.
Keep the PR scoped; call out anything intentionally out of scope.

### 6. CI must be in place and green

`.github/workflows/ci.yml` runs on every PR to `master`: install → wait for the
PostGIS service → migrate → ruff → mypy → pytest. A PR is mergeable only when all
required checks pass. Do not merge with red or skipped required checks.

## Pull request checklist

- [ ] Branch named `feat/` | `fix/` | `chore/` | `docs/` and based on current `master`.
- [ ] Context-graph query done; blast radius stated.
- [ ] Tests added/updated; `make test` passes locally.
- [ ] `make lint` and `make typecheck` pass.
- [ ] Migrations additive and reversible (`.rollback.sql` present).
- [ ] No secrets, tokens, or real credentials committed.
- [ ] Public API changes documented; breaking changes versioned.
- [ ] `graphify-out/graph.json` + `GRAPH_REPORT.md` refreshed if architecture moved.
- [ ] CI green.

## Guardrails and conventions

- **No secrets in the repo.** Config is env-driven (`BH_*`); production refuses to
  start without `BH_JWT_SECRET`.
- **Errors** flow through `app.core.exceptions.AppError` so responses keep the
  `{code, reason, extra_info}` shape.
- **Auth:** app-token (`X-APP-TOKEN`) plus JWT bearer; ownership is enforced in the
  service layer — a user may only mutate their own resources.
- **Geo:** candidate lookup uses app-side `h3.grid_disk` on the indexed `h3_cell`,
  then exact-filter with PostGIS `ST_DWithin`. Never bypass the radius/`k` caps.
- **DB:** raw SQL lives in `app/repositories/`; asyncpg parameters only, never string
  interpolation of user input.
- **Packaging:** dependencies in `pyproject.toml`; the server is Granian
  (`--interface asgi`). Update the `Dockerfile`, `docker-compose.yml`, and README
  together when the runtime changes.

## Command reference

| Command | Purpose |
|---|---|
| `make install-dev` | Create `.venv` and install project + dev deps |
| `make run` / `make serve` | Granian dev (reload) / production server |
| `make lint` / `make format` / `make typecheck` | ruff / ruff format / mypy |
| `make test` | Ephemeral PostGIS + migrations + pytest |
| `make migrate` / `make migrate-rollback` | Apply / roll back SQL migrations |
| `make db-up` / `make db-down` | Dev database |
| `make docker-up` / `make docker-down` / `make logs` | Compose stack |
