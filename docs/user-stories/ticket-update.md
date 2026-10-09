# Ticket update (triage)

**As** a support agent, **I want** to change a ticket's status and priority, **so that** the team sees progress and urgency accurately.

**Acceptance criteria**
- Status: `open`, `in_progress`, `closed`. Priority: `low`, `medium`, `high`. Defaults are `open` / `medium`.
- One button per status and one per priority; the selected value is shown as pressed (`aria-pressed`). "Salvar alterações" sends the change.
- Only changed fields are sent. With no change, "Nenhuma alteração para salvar." is shown and no request is made.
- All triage buttons are disabled while saving; double clicks on Save send one request.
- On success, the page shows the **server-confirmed** values and an announced message. On failure, a translated reason is shown and the previous values are kept.
- The API rejects an empty body, unknown fields and unknown values (422); a missing ticket gives 404; read-only environments give 403.

**Delivered by:** `PATCH /tickets/{id}` · `TicketService.update_ticket` · `TicketDetail` · tests `test_tickets_update.py`, `TicketDetail.test.tsx`, E2E steps 3–5.
