# Tasks: Ticket Inbox API

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md)

## Phase 1: Setup

- [x] T001 Create `backend/pyproject.toml` (uv, ruff, mypy, pytest, coverage ≥ 85%)
- [x] T002 [P] Create `backend/.env.example` and `app/core/config.py` (Settings)
- [x] T003 [P] Create `app/core/logging.py` (JSON/text formatter, request-id middleware)

## Phase 2: Foundational

- [x] T004 `app/models/enums.py`, `app/models/ticket.py`, `app/db/{base,session}.py`
- [x] T005 Alembic setup plus `versions/0001_create_tickets.py`
- [x] T006 `app/db/init.py` (migrate plus idempotent seed) and `seeds/tickets.json` (about 20 pt-BR tickets)
- [x] T007 `app/core/errors.py` (error envelope plus exception handlers)
- [x] T008 `app/main.py` app factory (CORS, middleware, routers, root_path)

## Phase 3: US1/US2 List, search and inspect 🎯

- [x] T009 [P] [US1] Tests: list, search (case-insensitive, literal wildcards), empty search
- [x] T010 [P] [US2] Tests: get by id, 404 envelope
- [x] T011 [US1] `repositories/ticket_repository.py` list/search/get
- [x] T012 [US1] `api/routes/tickets.py` GET endpoints and schemas

## Phase 4: US3 Triage

- [x] T013 [US3] Tests: status, priority, both, invalid status, invalid priority, empty body, unknown field, 404, read-only 403
- [x] T014 [US3] `schemas/ticket.py` `TicketUpdate` (extra=forbid, non-empty)
- [x] T015 [US3] `services/ticket_service.py` `update_ticket` plus the PATCH route

## Phase 5: US4 Automation

- [x] T016 [US4] Tests: closed, high, both in one event, non-triggering, already closed, already high, failure keeps update
- [x] T017 [US4] `integrations/n8n.py` (protocol, `HttpN8nNotifier`, `NullNotifier`) and DI wiring

## Phase 6: US5 Metrics and health

- [x] T018 [US5] Tests: metrics ok, missing, malformed; health incl. read_only flag
- [x] T019 [US5] `services/metrics_service.py` plus `api/routes/{metrics,health}.py`

## Phase 7: Polish

- [x] T020 Seed idempotency test; Postgres-marked smoke test
- [x] T021 Export `contracts/openapi.json` (`make openapi`)
- [x] T022 Dockerfile (multi-stage, non-root) and README
