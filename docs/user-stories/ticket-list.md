# Ticket list

**As** a support agent, **I want** to see all tickets with their key attributes, newest first, **so that** I can pick what to work on next.

**Acceptance criteria**
- The table shows created date (local format), customer, channel, subject, status and priority.
- Status and priority are readable without color (text plus icon).
- Each subject links to `/tickets/{id}`.
- Loading, empty ("A caixa de entrada está vazia.") and error (with retry) states are shown and announced to screen readers.
- The UI is in pt-BR by default.

**Delivered by:** `GET /tickets` · `components/TicketsView.tsx`, `TicketTable.tsx` · tests `test_tickets_read.py`, `TicketsView.test.tsx`, E2E step 1.
