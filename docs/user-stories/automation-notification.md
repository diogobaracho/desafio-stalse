# Automation notification

**As** the support operation, **we want** n8n to be notified when a ticket is closed or escalated to high priority, **so that** follow-ups (a CSAT survey, a page to the lead) happen without manual work.

**Acceptance criteria**
- An event is sent only when a ticket **becomes** `closed` and/or **becomes** `high`.
- One PATCH that does both sends **one** event with `trigger_reasons: ["status_closed", "priority_high"]`.
- No event for unrelated edits to an already closed or already high ticket.
- The ticket update is committed first. If n8n is down or slow (timeout), the update still succeeds and the failure is logged with context.
- The webhook URL is configurable (`N8N_WEBHOOK_URL`); empty or `none` disables it.

**Delivered by:** `TicketService` + `detect_trigger_reasons` · `integrations/n8n.py` · `n8n/workflow.json` · tests `test_webhook_rules.py`, `test_n8n_client.py` · CI `n8n` job (the export is valid JSON with no credentials) · [ADR-0004](../adr/0004-webhook-delivery-semantics.md).
