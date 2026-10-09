# User stories

**Problem.** A small support team receives tickets from e-mail, chat, phone, WhatsApp and web. Agents need one place to find a ticket fast, see its context, and move it through `open → in_progress → closed` while signaling urgency (`low/medium/high`). Closing a ticket or escalating it must trigger follow-up automatically (a CSAT survey, a page to the on-call lead). Leads need a periodic view of the volume and mix of demand to plan staffing.

**Personas.** *Ana, support agent* (pt-BR speaker, keyboard-heavy, works the queue all day). *Rafael, team lead* (plans shifts, watches volume trends). *Automation* (n8n), a system actor.

| Story | Persona | Priority | Spec | Delivered by |
|---|---|---|---|---|
| [Ticket list](ticket-list.md) | Ana | P1 (MVP) | 001 US1, 002 US1 | `GET /tickets`, `/tickets` |
| [Ticket search](ticket-search.md) | Ana | P1 | 001 US1, 002 US1 | `?search=`, debounced search box |
| [Ticket details](ticket-details.md) | Ana | P1 | 001 US2, 002 US2 | `GET /tickets/{id}`, `/tickets/[id]` |
| [Ticket update](ticket-update.md) | Ana | P1 | 001 US3, 002 US2 | `PATCH /tickets/{id}`, triage form |
| [Metrics dashboard](metrics-dashboard.md) | Rafael | P2 | 001 US5, 002 US3, 003 | ETL → `metrics.json` → `/dashboard` |
| [Automation notification](automation-notification.md) | Automation | P2 | 001 US4, 004 | transition-based webhook → n8n |

**Intentionally out of scope (MVP):** authentication and assignment, creating tickets or replying to customers, SLAs and timers, pagination (about 20 tickets), realtime updates, and metrics computed from the live `tickets` table. Known next steps are recorded in the ADRs (for example the transactional outbox in [ADR-0004](../adr/0004-webhook-delivery-semantics.md)).
