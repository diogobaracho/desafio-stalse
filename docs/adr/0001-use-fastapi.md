# ADR-0001: FastAPI for the API

**Context.** The API is small (5 endpoints) and needs explicit request/response schemas, strong validation and consistent errors. It must be easy to test with injected fakes. The team's stack is Python + Next.js.

**Decision.** Use FastAPI with Pydantic v2 schemas and FastAPI's dependency injection (`app/api/deps.py`). Routes stay thin: they translate HTTP to service calls. Business rules live in `services/`, persistence in `repositories/` and outbound I/O in `integrations/`.

**Consequences.**
- OpenAPI comes for free and is exported to `specs/001-ticket-inbox-api/contracts/openapi.json`. CI fails on drift.
- `app.dependency_overrides` makes swapping the database and the notifier in tests trivial.
- Handlers are synchronous (`def`) on purpose. SQLAlchemy sync sessions plus a short webhook timeout are simpler, and FastAPI runs them in a threadpool. Async would only pay off with many slow outbound calls. The only one today is the n8n webhook, bounded by a 3 s timeout; the transactional outbox proposed in [ADR-0004](0004-webhook-delivery-semantics.md) (not implemented) would take it off the request path.

**Alternatives.** Django + DRF (too much framework for 5 endpoints). Flask (manual validation and OpenAPI). Litestar (smaller ecosystem and less familiar to reviewers).
