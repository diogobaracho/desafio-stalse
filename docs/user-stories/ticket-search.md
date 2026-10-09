# Ticket search

**As** a support agent, **I want** to type part of a customer name or subject, **so that** I find a specific ticket quickly when a customer calls back.

**Acceptance criteria**
- Matching is case-insensitive on customer name and subject (`pagamento` matches "Pagamento recusado…").
- Search runs on the server (`GET /tickets?search=`), debounced by 300 ms; only the latest response is shown.
- `%` and `_` are literal characters, not wildcards.
- No result: "Nenhum ticket encontrado. Tente outro termo de busca." The result count is announced (aria-live).

**Delivered by:** `TicketRepository.list` (escaped `ilike`) · `TicketsView` + `useDebouncedValue` · tests: search, wildcard, debounce (one request per pause).
