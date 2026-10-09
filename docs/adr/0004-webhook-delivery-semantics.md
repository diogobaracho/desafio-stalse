# ADR-0004: Webhook on transitions, after commit, best-effort

**Context.** When a ticket is closed or escalated to high priority, an n8n workflow must be notified. The automation service may be slow or down, and duplicate notifications annoy people (for example, two CSAT surveys).

**Decision.**
1. **Transition semantics.** A trigger fires only when the value *changes into* the triggering value: `old.status != closed && new.status == closed`, and `old.priority != high && new.priority == high`. Re-saving `closed` or editing an already-high ticket sends nothing. Reopening and closing again *is* a new transition.
2. **One event per update.** If one PATCH triggers both rules, a single event carries `trigger_reasons: ["status_closed", "priority_high"]`.
3. **Commit first, then notify** synchronously with a short timeout (`N8N_WEBHOOK_TIMEOUT_SECONDS`, default 3 s).
4. **Failures never undo the update.** Timeouts, connection errors and non-2xx responses are logged at WARNING with `ticket_id`, `trigger_reasons` and the error; the client still gets 200 with the updated ticket.
5. The notifier sits behind a protocol (`TicketEventNotifier`). An empty URL (or `none`) selects `NullNotifier`.

**Consequences / limitations.**
- **At-most-once delivery.** A crash between commit and send, or an n8n outage, loses the event. Logs make the loss visible but do not recover it.
- The request latency includes the webhook call (bounded by the timeout).
- Concurrent PATCHes on the same ticket could both observe `open → closed`. This is acceptable for the MVP; row locking (`SELECT … FOR UPDATE` on Postgres) or the outbox below fixes it.

**Production evolution: transactional outbox.** Write an `outbox_events` row *in the same transaction* as the ticket update. A worker (a CronJob, or a queue consumer such as Azure Service Bus) delivers events with retries, exponential backoff and an idempotency key (`event_id`), and marks them sent. This gives at-least-once delivery, no request-path latency and replayability. The service-layer API does not change; only the notifier implementation does.

**Alternatives.** Notify before commit (could announce changes that then fail). FastAPI `BackgroundTasks` (still lost on crash, harder to test, and hides failures from the request log). A queue now (infrastructure the MVP does not need).
