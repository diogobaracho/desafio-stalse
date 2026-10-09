# Implementation Plan: Ticket Inbox API

**Branch**: `001-ticket-inbox-api` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

## Summary

A FastAPI service with a thin route layer, a `TicketService` that holds the business rules (validation, read-only guard, webhook transition detection), a `TicketRepository` for persistence, and a `TicketEventNotifier` integration for n8n. The schema is owned by Alembic. An idempotent seed loads `seeds/tickets.json`.

## Technical Context

**Language/Version**: Python 3.12 (managed by uv)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Pydantic v2, pydantic-settings, Alembic, httpx, uvicorn
**Storage**: SQLite (local), PostgreSQL 16 Flexible Server (Azure) via `DATABASE_URL`
**Testing**: pytest, pytest-cov (fail under 85%), FastAPI TestClient, fake notifier
**Target Platform**: Linux container (non-root), Kubernetes
**Performance Goals**: Not a concern for the MVP (about 20 tickets); indexes on `created_at`
**Constraints**: No real outbound HTTP in tests; webhook timeout ≤ 5 s by default

## Constitution Check

| Principle | Status |
|---|---|
| I. MVP first | ✅ No pagination, no auth, no generic CRUD framework |
| II. Layer boundaries | ✅ routes → service → repository / integrations |
| III. Tests protect rules | ✅ Webhook transitions, validation, seed idempotency, read-only mode |
| IV. Config over hardcoding | ✅ `Settings` (pydantic-settings), validated at startup |
| V. i18n | ✅ Error `code`s are stable and translated by the frontend |
| VI. Independent deploys | ✅ Own Dockerfile, pyproject and CI filter (`backend/**`) |
| VII. Safe environments | ✅ `READ_ONLY_MODE`; secrets only through env/Key Vault |

## Project Structure

```text
backend/
├── app/
│   ├── main.py                 # app factory, middleware, exception handlers
│   ├── api/                    # deps.py, routes/{tickets,metrics,health}.py
│   ├── core/                   # config.py, logging.py, errors.py
│   ├── db/                     # base.py, session.py, init.py (migrate + seed)
│   ├── models/                 # enums.py, ticket.py
│   ├── schemas/                # ticket.py, health.py, error.py
│   ├── repositories/           # ticket_repository.py
│   ├── services/               # ticket_service.py, metrics_service.py
│   └── integrations/           # n8n.py (protocol + http + null notifier)
├── alembic/                    # env.py, versions/0001_create_tickets.py
├── seeds/tickets.json
└── tests/
```

## Design Decisions

- **Transition detection** happens in the service by comparing the old and new values before commit (ADR-0004).
- **Notify after commit**: the update is committed first, then the webhook is sent synchronously with a short timeout. Failures are logged at WARNING with the ticket id and reasons.
- **Metrics** are read from disk on every request (the file is tiny and the ETL may update it at any time).
- **Error envelope** comes from custom exception handlers for `AppError`, `RequestValidationError`, `HTTPException` and unhandled `Exception` (logged with a stack trace, while the client gets a generic message).
- **Ingress prefix**: `API_PREFIX=/api` in Kubernetes mounts every route under `/api`, so any ingress controller can route `/api` to the backend without controller-specific rewrite rules.

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| Alembic | Same schema on SQLite and Postgres; prod needs migrations | `create_all` cannot evolve the schema in Azure |
| Notifier protocol | Test seam and a "disabled" implementation | `if url:` checks spread through the service |
