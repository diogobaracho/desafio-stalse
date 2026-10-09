# ADR-0006: Behavior tests at the boundaries; coverage gates

**Decision.**

| Layer | Tool | Boundary mocked | Focus |
|---|---|---|---|
| Backend API + services | pytest + TestClient | n8n notifier (fake); per-test SQLite copy | Every acceptance scenario in spec 001: validation, 404s, transitions, failure isolation, read-only, seeding |
| Backend integrations | httpx `MockTransport` | network | Payload shape, timeouts and HTTP errors → `NotificationError` |
| PostgreSQL portability | pytest `-m postgres` | — (real Postgres service in CI) | Migrations, seed and sequence reset, `ilike` |
| ETL | pytest + small fixtures | — | Outputs: reading, dates, invalid dates, aggregation, ties, empty input, determinism, CLI exit codes |
| Frontend | Vitest + RTL + **MSW** | HTTP only | What users see and do: states, debounce, mutation success and failure, double submit, i18n, brand |
| Critical path | Playwright | nothing (full compose stack) | list → search → detail → update → reload → dashboard; language switch; not-found |

- **No snapshots.** Queries use roles and labels (which double as accessibility checks).
- **No real outbound HTTP** in unit tests (MSW `onUnhandledRequest: "error"`, fake notifier).
- **Coverage gates fail CI**: backend 85%, ETL 90%, frontend 75% lines on `components/` and `lib/`. Pages in `app/` are thin and covered by E2E. Current levels are higher (≈94% / 98% / 100%), but the gates sit lower on purpose so nobody writes tests just to keep a number up.

**Consequences.** Tests survive refactors (no implementation details), the API boundary is the only mock in the frontend, and E2E is kept to one critical path to stay fast and reliable.
