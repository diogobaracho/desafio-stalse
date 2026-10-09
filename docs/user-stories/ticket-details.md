# Ticket details

**As** a support agent, **I want** to open a ticket and read its full description and history fields, **so that** I understand the customer's problem before acting.

**Acceptance criteria**
- Shows number, customer, channel, subject, status, priority, created and updated timestamps, and the description.
- An unknown id shows a "Ticket não encontrado" page with a link back; the API returns `404 ticket_not_found`.
- API failure shows an error state; loading shows a loading state.
- A "Voltar para a lista de tickets" link is always present.

**Delivered by:** `GET /tickets/{id}` · `app/tickets/[id]/page.tsx` (server), `not-found.tsx`, `loading.tsx`, `TicketDetail.tsx`.
