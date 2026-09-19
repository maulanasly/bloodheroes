# Graph Report - bloodheroes  (2026-09-19)

## Corpus Check
- 98 files · ~20,788 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 6, .example 1, .ini 1)

## Summary
- 798 nodes · 1731 edges · 44 communities (26 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16a25928`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- exceptions.py
- routers/donations.py
- routers/users.py
- api-client/src/index.ts
- services/donations.py
- migrate_from_mongo.py
- main.py
- register
- client/package.json
- AGENTS.md
- Bloodheroes API
- pull_request_template.md
- bloodheroes
- 0001_initial.sql
- dashboard/package.json
- ui/package.json
- TokenPair
- web/package.json
- api-client/package.json
- geo/package.json
- compilerOptions
- geo/src/index.ts
- compilerOptions
- compilerOptions
- compilerOptions
- api-client/tsconfig.json
- geo/tsconfig.json
- client/next-env.d.ts
- dashboard/next-env.d.ts
- { GET, POST, PUT, PATCH, DELETE, OPTIONS }
- { GET, POST, PUT, PATCH, DELETE, OPTIONS }

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 30 edges
2. `register()` - 24 edges
3. `AppError` - 22 edges
4. `APIModel` - 21 edges
5. `auth_headers()` - 19 edges
6. `TokenPair` - 16 edges
7. `compilerOptions` - 16 edges
8. `decode_token()` - 15 edges
9. `ApiClient` - 15 edges
10. `Card()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Guardrails and conventions` --references--> `AppError`  [INFERRED]
  AGENTS.md → app/core/exceptions.py
- `test_invalid_token_rejected()` --uses--> `UnAuthorized`  [INFERRED]
  tests/test_security.py → app/core/exceptions.py
- `test_token_type_enforced()` --uses--> `UnAuthorized`  [INFERRED]
  tests/test_security.py → app/core/exceptions.py
- `test_expired_token_rejected()` --uses--> `SessionExpired`  [INFERRED]
  tests/test_security.py → app/core/exceptions.py
- `test_cell_is_deterministic_and_int()` --calls--> `cell_for()`  [EXTRACTED]
  tests/test_geo.py → app/core/geo.py

## Import Cycles
- None detected.

## Communities (44 total, 18 thin omitted)

### Community 0 - "exceptions.py"
Cohesion: 0.06
Nodes (66): get_current_user_id(), Connection, require_app_token(), login(), logout(), Connection, post, Response (+58 more)

### Community 1 - "routers/donations.py"
Cohesion: 0.10
Nodes (33): _cells_for(), create_offer(), create_request(), get_request(), history(), list_offers(), list_requests(), alias (+25 more)

### Community 2 - "routers/users.py"
Cohesion: 0.08
Nodes (50): delete_me(), get_me(), get_user(), list_users(), alias, Connection, ge, get (+42 more)

### Community 3 - "api-client/src/index.ts"
Cohesion: 0.05
Nodes (98): maplibre-gl, ref_next, ref_react, proxy, HistoryPage(), metadata, LoginPage(), ProfilePage() (+90 more)

### Community 4 - "services/donations.py"
Cohesion: 0.19
Nodes (28): AccessDenied, DonationNotFound, InvalidInput, RequisiteAlreadySatisfied, app_repositories, count_accomplished_for_donor(), create_offer(), create_request() (+20 more)

### Community 5 - "migrate_from_mongo.py"
Cohesion: 0.10
Nodes (39): get_cell(), get_disk(), ge, get, gt, le, Query, cell_for() (+31 more)

### Community 6 - "main.py"
Cohesion: 0.08
Nodes (28): app_api_routers, get_settings(), Parse comma-separated BH_CORS_ORIGINS into explicit origins., psycopg-compatible URL for migrations (yoyo)., Settings, FastAPI, register_exception_handlers(), app_db (+20 more)

### Community 7 - "register"
Cohesion: 0.21
Nodes (29): httpx, _create_request(), AsyncClient, test_cannot_offer_to_own_request(), test_donor_cannot_accept_own_offer(), test_request_offer_accept_accomplish_flow(), test_request_radius_filter(), AsyncClient (+21 more)

### Community 8 - "client/package.json"
Cohesion: 0.06
Nodes (33): dependencies, @bloodheroes/api-client, @bloodheroes/geo, @bloodheroes/ui, next, react, react-dom, devDependencies (+25 more)

### Community 9 - "AGENTS.md"
Cohesion: 0.13
Nodes (13): 1. Create a new branch, 2. Read the context memory, 3. Add tests and linter, 4. Update the graph, 5. Create a PR, 6. CI must be in place and green, Command reference, Context memory — graphify (+5 more)

### Community 10 - "Bloodheroes API"
Cohesion: 0.18
Nodes (10): API (v1), Bloodheroes API, Configuration, Geospatial design, Layout, Migrating from MongoDB, Running locally, Stack (+2 more)

### Community 11 - "pull_request_template.md"
Cohesion: 0.29
Nodes (6): Changes, Checklist, Context, Risk and rollback, Summary, Tests

### Community 21 - "0001_initial.sql"
Cohesion: 0.19
Nodes (20): app_tokens, blood_types, donation_offers, donation_offers_donor_idx, donation_offers_request_idx, donation_offers_status_idx, donation_requests, donation_requests_blood_type_idx (+12 more)

### Community 25 - "dashboard/package.json"
Cohesion: 0.06
Nodes (33): dependencies, @bloodheroes/api-client, @bloodheroes/geo, @bloodheroes/ui, next, react, react-dom, devDependencies (+25 more)

### Community 26 - "ui/package.json"
Cohesion: 0.06
Nodes (31): dependencies, @bloodheroes/api-client, @bloodheroes/geo, maplibre-gl, next, react, react-dom, devDependencies (+23 more)

### Community 27 - "TokenPair"
Cohesion: 0.11
Nodes (12): ref_vitest, ApiClient, ApiClientOptions, MemoryTokenStore, RequestOptions, TOKENS_A, TOKENS_B, TokenStore (+4 more)

### Community 28 - "web/package.json"
Cohesion: 0.09
Nodes (17): @playwright/test, stamp, OPERATOR, description, devDependencies, @playwright/test, engines, node (+9 more)

### Community 29 - "api-client/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, typescript, vitest, main, name (+9 more)

### Community 30 - "geo/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, typescript, vitest, main, name (+9 more)

### Community 31 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+9 more)

### Community 32 - "geo/src/index.ts"
Cohesion: 0.35
Nodes (11): cellsToFeatureCollection(), FeatureCollection, GeoCellLike, haversineM(), LatLng, octagonForCell(), octagonFromCenter(), polygonFeature (+3 more)

### Community 33 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, incremental, jsx, lib, noEmit, paths, plugins (+4 more)

### Community 34 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, incremental, jsx, lib, noEmit, paths, plugins (+4 more)

### Community 35 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, jsx, lib, outDir, rootDir, types, extends (+2 more)

### Community 36 - "api-client/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 37 - "geo/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, rootDir, extends, include, ../../tsconfig.base.json

## Knowledge Gaps
- **239 isolated node(s):** `app_tokens`, `bloodheroes`, `proxy`, `metadata`, `EMPTY_COLLECTION` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 332 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `exceptions.py` to `AGENTS.md`, `routers/users.py`, `services/donations.py`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `maplibre-gl` connect `api-client/src/index.ts` to `ui/package.json`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Guardrails and conventions` connect `AGENTS.md` to `exceptions.py`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `app_tokens`, `bloodheroes`, `proxy` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `exceptions.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06185919343814081 - nodes in this community are weakly interconnected._
- **Should `routers/donations.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._
- **Should `routers/users.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08311688311688312 - nodes in this community are weakly interconnected._