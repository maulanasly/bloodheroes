# Graph Report - bloodheroes  (2026-09-19)

## Corpus Check
- 113 files · ~26,378 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .css 2, .example 1)

## Summary
- 899 nodes · 2016 edges · 56 communities (38 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cc73de1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- exceptions.py
- routers/donations.py
- routers/users.py
- dashboard/app/page.tsx
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
- helpers.ts
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
- ui/src/index.ts
- api-client/src/index.ts
- .request
- ref_react
- routers/stats.py
- useAuth
- auth.tsx
- list_requests
- routers/auth.py
- routers/geo.py
- createBackendProxy
- RegisterPage

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 30 edges
2. `register()` - 27 edges
3. `APIModel` - 25 edges
4. `AppError` - 22 edges
5. `auth_headers()` - 22 edges
6. `useToast()` - 18 edges
7. `TokenPair` - 16 edges
8. `compilerOptions` - 16 edges
9. `decode_token()` - 15 edges
10. `ApiClient` - 15 edges

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

## Communities (56 total, 18 thin omitted)

### Community 0 - "exceptions.py"
Cohesion: 0.06
Nodes (63): get_current_user_id(), Connection, require_app_token(), AppError, FieldRequired, InternalError, InvalidCredentials, InvalidEmailFormat (+55 more)

### Community 1 - "routers/donations.py"
Cohesion: 0.24
Nodes (13): create_offer(), create_request(), post, update_offer(), APIModel, DonationRequestCreate, DonationRequestList, DonationRequestOut (+5 more)

### Community 2 - "routers/users.py"
Cohesion: 0.08
Nodes (50): delete_me(), get_me(), get_user(), list_users(), alias, Connection, ge, get (+42 more)

### Community 3 - "dashboard/app/page.tsx"
Cohesion: 0.17
Nodes (23): EMPTY_COLLECTION, H3Map, OWNER_ACTIONS, DEFAULT_CENTER, EMPTY_COLLECTION, H3Map, ACTION_LABELS, web_packages_api_client_src_index_donationrequestout (+15 more)

### Community 4 - "services/donations.py"
Cohesion: 0.21
Nodes (26): AccessDenied, DonationNotFound, InvalidInput, RequisiteAlreadySatisfied, count_accomplished_for_donor(), create_offer(), create_request(), get_offer() (+18 more)

### Community 5 - "migrate_from_mongo.py"
Cohesion: 0.07
Nodes (46): get_cell(), get_disk(), ge, get, gt, le, Query, get_settings() (+38 more)

### Community 6 - "main.py"
Cohesion: 0.15
Nodes (17): app_api_routers, FastAPI, register_exception_handlers(), close_pool(), get_conn(), get_pool(), init_pool(), FastAPI dependency yielding a pooled connection. Lazily initialises the pool so… (+9 more)

### Community 7 - "register"
Cohesion: 0.11
Nodes (47): app_db, CompletedProcess, httpx, os, pathlib, pytest_asyncio, subprocess, sys (+39 more)

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
Nodes (33): dependencies, @bloodheroes/api-client, @bloodheroes/geo, maplibre-gl, next, react, react-dom, devDependencies (+25 more)

### Community 27 - "TokenPair"
Cohesion: 0.12
Nodes (11): ApiClient, ApiClientOptions, MemoryTokenStore, RequestOptions, TOKENS_A, TOKENS_B, TokenStore, ApiError (+3 more)

### Community 28 - "helpers.ts"
Cohesion: 0.09
Nodes (24): @playwright/test, stamp, OPERATOR, api(), API_URL, APP_TOKEN, CLIENT_URL, DASH_URL (+16 more)

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
Cohesion: 0.12
Nodes (22): maplibre-gl, web_apps_client_app_globals, metadata, Providers(), web_apps_dashboard_app_globals, metadata, Providers(), cellsToFeatureCollection() (+14 more)

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

### Community 44 - "ui/src/index.ts"
Cohesion: 0.10
Nodes (31): ref_vitest, getMe(), AuthProvider(), controlStyle, TextArea(), CopyButton(), KpiCard(), pageButton() (+23 more)

### Community 45 - "api-client/src/index.ts"
Cohesion: 0.14
Nodes (20): ProfilePage(), onSubmit(), validate(), listLevels(), RequestSearchParams, updateMe(), UserSearchParams, BloodTypeCount (+12 more)

### Community 46 - ".request"
Cohesion: 0.20
Nodes (21): DiscoveryPage(), offer(), ClientRequestDetailPage(), confirmStatusChange(), offer(), DashboardHome(), RequestDetailPage(), confirmStatusChange() (+13 more)

### Community 47 - "ref_react"
Cohesion: 0.33
Nodes (11): ref_react, web_packages_api_client_src_index_blood_types, web_packages_api_client_src_index_levelout, BLOOD_TYPES, Alert(), Button(), Card(), Field() (+3 more)

### Community 48 - "routers/stats.py"
Cohesion: 0.16
Nodes (14): levels(), overview(), Connection, get, ErrorResponse, BloodTypeCount, LevelOut, StatsOverview (+6 more)

### Community 49 - "useAuth"
Cohesion: 0.19
Nodes (12): HistoryPage(), LoginForm(), NewRequestPage(), onSubmit(), validate(), DonorDetailPage(), DonorsPage(), openDonor() (+4 more)

### Community 50 - "auth.tsx"
Cohesion: 0.18
Nodes (8): ref_next, nextConfig, nextConfig, web_packages_api_client_src_index_tokenpair, web_packages_api_client_src_index_userout, UserOut, AuthContext, AuthContextValue

### Community 51 - "list_requests"
Cohesion: 0.26
Nodes (12): _cells_for(), get_request(), history(), list_offers(), list_requests(), alias, Connection, ge (+4 more)

### Community 52 - "routers/auth.py"
Cohesion: 0.38
Nodes (9): login(), logout(), Connection, post, Response, refresh(), LoginRequest, RefreshRequest (+1 more)

### Community 53 - "routers/geo.py"
Cohesion: 0.38
Nodes (5): GeoCell, GeoDisk, LatLng, app_services, fastapi

### Community 54 - "createBackendProxy"
Cohesion: 0.33
Nodes (3): proxy, proxy, createBackendProxy()

### Community 55 - "RegisterPage"
Cohesion: 0.50
Nodes (3): RegisterPage(), onSubmit(), registerUser()

## Knowledge Gaps
- **254 isolated node(s):** `app_tokens`, `bloodheroes`, `proxy`, `metadata`, `EMPTY_COLLECTION` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 357 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `maplibre-gl` connect `geo/src/index.ts` to `ui/package.json`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `AppError` connect `exceptions.py` to `AGENTS.md`, `routers/users.py`, `services/donations.py`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Guardrails and conventions` connect `AGENTS.md` to `exceptions.py`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `app_tokens`, `bloodheroes`, `proxy` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `exceptions.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06202435312024353 - nodes in this community are weakly interconnected._
- **Should `routers/users.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08311688311688312 - nodes in this community are weakly interconnected._
- **Should `migrate_from_mongo.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06918238993710692 - nodes in this community are weakly interconnected._