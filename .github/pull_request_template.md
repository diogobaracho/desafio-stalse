## What & why

<!-- One paragraph. Link the spec: specs/NNN-feature/spec.md (and the issue, if any). -->

Spec: `specs/___/spec.md`

## How it was verified

- [ ] `make check` passes locally (lint, types, tests + coverage gates, contract/metrics drift)
- [ ] E2E (`make compose-up && make e2e`) if user-facing behavior changed
- [ ] Screenshots for UI changes (pt-BR **and** en)

## Checklist (constitution)

- [ ] Business rules live in services, not routes/components; HTTP only via `frontend/lib/api`
- [ ] New user-facing strings exist in **both** `messages/pt-BR.json` and `messages/en.json`
- [ ] No brand names/contact data in code (use the brand config)
- [ ] No secrets, hostnames or env-specific values hardcoded
- [ ] Docs/ADRs/specs updated (`tasks.md` ticked, OpenAPI exported with `make openapi`)
- [ ] Migration added for schema changes (`alembic revision`), safe for PostgreSQL

## Deployment notes

<!-- Infra/config changes, Key Vault secrets, rollout order, rollback plan. -->
