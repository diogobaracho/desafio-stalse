# Feature Specification: Ticket Inbox API

**Feature Branch**: `001-ticket-inbox-api`

**Created**: 2026-10-08

**Status**: Implemented

**Input**: "Expose customer-support tickets through a REST API so agents can list, search, inspect and triage tickets (status and priority), notify automation when a ticket is closed or escalated, and serve pre-computed support metrics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List and search tickets (Priority: P1) 🎯 MVP

A support agent opens the inbox and sees every ticket. They type a word (a customer name or part of a subject) to narrow the list.

**Why this priority**: Without a list, nothing else in the product is reachable.

**Independent Test**: `GET /tickets` and `GET /tickets?search=pagamento` against a seeded database.

**Acceptance Scenarios**:

1. **Given** a seeded database, **When** `GET /tickets`, **Then** 200 with every ticket, newest first.
2. **Given** tickets whose customer or subject contains "Pagamento", **When** `GET /tickets?search=pagamento`, **Then** only the matching tickets are returned (case-insensitive).
3. **Given** no ticket matches, **When** searching, **Then** 200 with an empty list.

### User Story 2 - Inspect a ticket (Priority: P1)

An agent opens a single ticket to read its full description.

**Independent Test**: `GET /tickets/{id}` for an existing and a missing id.

**Acceptance Scenarios**:

1. **Given** ticket 1 exists, **When** `GET /tickets/1`, **Then** 200 with all fields and ISO 8601 timestamps.
2. **Given** ticket 999 does not exist, **When** `GET /tickets/999`, **Then** 404 with the standard error body (`code=ticket_not_found`).

### User Story 3 - Triage a ticket (Priority: P1)

An agent changes the status and/or priority of a ticket.

**Independent Test**: `PATCH /tickets/{id}` with valid and invalid bodies.

**Acceptance Scenarios**:

1. **Given** an open ticket, **When** PATCH `{"status": "in_progress"}`, **Then** 200 with the updated ticket and a refreshed `updated_at`.
2. **Given** any ticket, **When** PATCH with `{}`, an unknown enum value or an unknown field, **Then** 422 with `code=validation_error` and nothing is persisted.
3. **Given** a missing ticket, **When** PATCH, **Then** 404.
4. **Given** the API runs with `READ_ONLY_MODE=true`, **When** PATCH, **Then** 403 with `code=read_only_mode`.

### User Story 4 - Notify automation on closure or escalation (Priority: P2)

When a ticket *becomes* closed or *becomes* high priority, an n8n workflow is notified so the team can act (for example, send a CSAT survey or page a lead).

**Independent Test**: Service-level tests with a fake notifier.

**Acceptance Scenarios**:

1. **Given** an open ticket, **When** status changes to `closed`, **Then** exactly one event is sent with `trigger_reasons=["status_closed"]`.
2. **Given** a medium ticket, **When** priority changes to `high`, **Then** one event is sent with `["priority_high"]`.
3. **Given** an open medium ticket, **When** one PATCH sets both, **Then** one event is sent with both reasons.
4. **Given** a ticket that is already closed (or already high), **When** an unrelated field or the same value is PATCHed, **Then** no event is sent.
5. **Given** n8n is down, **When** a triggering PATCH happens, **Then** the update is persisted, 200 is returned and the failure is logged.

### User Story 5 - Read support metrics (Priority: P2)

A team lead reads aggregated metrics produced by the ETL pipeline.

**Acceptance Scenarios**:

1. **Given** `metrics.json` exists, **When** `GET /metrics`, **Then** 200 with its content unchanged.
2. **Given** the file is missing, malformed or unreadable, **When** `GET /metrics`, **Then** 503 with `code=metrics_unavailable` and a server log entry.

### Edge Cases

- A search term with SQL wildcard characters (`%`, `_`) is treated literally.
- A PATCH that sets the current value again is valid (200) but triggers no webhook.
- Re-running the seed never duplicates tickets.
- An empty `N8N_WEBHOOK_URL` disables notifications without errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose `GET /tickets` with an optional `search` parameter (case-insensitive match on customer_name and subject).
- **FR-002**: The system MUST expose `GET /tickets/{id}` returning 200 or 404.
- **FR-003**: The system MUST expose `PATCH /tickets/{id}` accepting only `status` and/or `priority`, rejecting empty bodies, unknown fields and unknown enum values.
- **FR-004**: Status values MUST be `open | in_progress | closed` (default `open`). Priority values MUST be `low | medium | high` (default `medium`).
- **FR-005**: All errors MUST use the envelope `{"error": {"code", "message", "details"}}`.
- **FR-006**: The system MUST send one webhook event per PATCH that transitions a ticket into `status=closed` and/or `priority=high`, *after* the update is committed, with a configurable timeout.
- **FR-007**: Webhook failures MUST NOT roll back or fail the update.
- **FR-008**: `GET /metrics` MUST return the pre-computed file without computing anything.
- **FR-009**: `GET /health` MUST report status, version, environment and read-only mode.
- **FR-010**: With `READ_ONLY_MODE=true`, every mutation MUST return 403.
- **FR-011**: The database MUST be creatable from a clean checkout (migrations plus an idempotent seed).

### Key Entities

- **Ticket**: id, created_at, updated_at, customer_name, channel, subject, description, status, priority.
- **TicketEvent** (outbound): event name, trigger reasons, ticket snapshot.

## Success Criteria *(mandatory)*

- **SC-001**: Every acceptance scenario above is covered by an automated test.
- **SC-002**: Backend line coverage ≥ 85%.
- **SC-003**: The same code runs unchanged on SQLite (local) and PostgreSQL (Azure).

## Assumptions

- There is no authentication in the MVP. The API sits behind the cluster ingress, and auth is on the roadmap.
- About 20 seed tickets keeps pagination unnecessary. Search keeps the payload small.
- Webhook delivery is "at most once, best effort". The outbox pattern is documented as the production evolution (ADR-0004).
