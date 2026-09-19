# Graph Report - bloodheroes  (2026-09-19)

## Corpus Check
- 43 files · ~9,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .ini 1)

## Summary
- 352 nodes · 835 edges · 25 communities (13 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d443305`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- security.py
- routers/donations.py
- routers/users.py
- services/users.py
- services/donations.py
- migrate_from_mongo.py
- config.py
- register
- exceptions.py
- AGENTS.md
- Bloodheroes API
- pull_request_template.md
- bloodheroes
- 0001_initial.sql

## God Nodes (most connected - your core abstractions)
1. `AppError` - 22 edges
2. `APIModel` - 17 edges
3. `register()` - 17 edges
4. `decode_token()` - 15 edges
5. `auth_headers()` - 13 edges
6. `cell_for()` - 12 edges
7. `create_user()` - 12 edges
8. `update_user()` - 12 edges
9. `list_users()` - 11 edges
10. `UnAuthorized` - 11 edges

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

## Communities (25 total, 12 thin omitted)

### Community 0 - "security.py"
Cohesion: 0.07
Nodes (57): get_current_user_id(), Connection, require_app_token(), login(), logout(), Connection, post, Response (+49 more)

### Community 1 - "routers/donations.py"
Cohesion: 0.12
Nodes (28): _cells_for(), create_offer(), create_request(), get_request(), history(), list_offers(), list_requests(), alias (+20 more)

### Community 2 - "routers/users.py"
Cohesion: 0.11
Nodes (26): delete_me(), get_me(), get_user(), list_users(), alias, Connection, ge, get (+18 more)

### Community 3 - "services/users.py"
Cohesion: 0.20
Nodes (25): EmailConflict, UserNotFound, hash_password(), create_user(), delete_user(), email_exists(), get_by_email(), get_by_id() (+17 more)

### Community 4 - "services/donations.py"
Cohesion: 0.21
Nodes (26): AccessDenied, DonationNotFound, InvalidInput, count_accomplished_for_donor(), create_offer(), create_request(), get_offer(), get_request() (+18 more)

### Community 5 - "migrate_from_mongo.py"
Cohesion: 0.12
Nodes (28): cell_for(), cell_for_hex(), disk_for(), haversine_m(), k_for_radius(), Return H3 cell indices forming a disk covering the search radius., H3 cell index containing the coordinate at the given resolution., search_cells() (+20 more)

### Community 6 - "config.py"
Cohesion: 0.10
Nodes (24): app_api_routers, get_settings(), psycopg-compatible URL for migrations (yoyo)., Settings, app_db, close_pool(), get_conn(), get_pool() (+16 more)

### Community 7 - "register"
Cohesion: 0.27
Nodes (22): httpx, _create_request(), AsyncClient, test_cannot_offer_to_own_request(), test_donor_cannot_accept_own_offer(), test_request_offer_accept_accomplish_flow(), test_request_radius_filter(), AsyncClient (+14 more)

### Community 8 - "exceptions.py"
Cohesion: 0.17
Nodes (14): AppError, FieldRequired, InternalError, InvalidCredentials, InvalidEmailFormat, MissingSessionID, OfferNotFound, Any (+6 more)

### Community 9 - "AGENTS.md"
Cohesion: 0.13
Nodes (13): 1. Create a new branch, 2. Read the context memory, 3. Add tests and linter, 4. Update the graph, 5. Create a PR, 6. CI must be in place and green, Command reference, Context memory — graphify (+5 more)

### Community 10 - "Bloodheroes API"
Cohesion: 0.20
Nodes (9): API (v1), Bloodheroes API, Configuration, Geospatial design, Layout, Migrating from MongoDB, Running locally, Stack (+1 more)

### Community 11 - "pull_request_template.md"
Cohesion: 0.29
Nodes (6): Changes, Checklist, Context, Risk and rollback, Summary, Tests

### Community 21 - "0001_initial.sql"
Cohesion: 0.19
Nodes (20): app_tokens, blood_types, donation_offers, donation_offers_donor_idx, donation_offers_request_idx, donation_offers_status_idx, donation_requests, donation_requests_blood_type_idx (+12 more)

## Knowledge Gaps
- **27 isolated node(s):** `app_tokens`, `bloodheroes`, `Summary`, `Context`, `Changes` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 96 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `exceptions.py` to `security.py`, `AGENTS.md`, `services/users.py`, `services/donations.py`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `Guardrails and conventions` connect `AGENTS.md` to `exceptions.py`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `list_users()` connect `routers/users.py` to `services/users.py`, `migrate_from_mongo.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `app_tokens`, `bloodheroes`, `Summary` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `security.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07341269841269842 - nodes in this community are weakly interconnected._
- **Should `routers/donations.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._
- **Should `routers/users.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10574712643678161 - nodes in this community are weakly interconnected._