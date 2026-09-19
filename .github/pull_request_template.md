## Summary

<!-- What does this PR change and why? -->

## Context

<!-- Graphify: query the knowledge graph and state the blast radius. -->
- Graph context / query used:
- Layers, endpoints, tables, or migrations affected:

## Changes

---

## Tests

<!-- New/updated tests and evidence (make test). -->

## Risk and rollback

<!-- Risk level, edge cases, and how to revert (migration rollback, revert commit). -->

## Checklist

- [ ] Branch based on current `master` with a `feat/` | `fix/` | `chore/` | `docs/` prefix
- [ ] Tests added/updated; `make test` passes
- [ ] `make lint` and `make typecheck` pass
- [ ] Migrations are additive and reversible (`.rollback.sql` present)
- [ ] No secrets or credentials committed
- [ ] Public API changes documented and versioned
- [ ] `graphify-out/graph.json` + `GRAPH_REPORT.md` refreshed if architecture changed
- [ ] CI is green
