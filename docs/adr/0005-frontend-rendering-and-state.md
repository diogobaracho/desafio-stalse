# ADR-0005: Server components for reads, client components for interaction

**Context.** Three pages: a searchable list, a detail page with a mutation, and a read-only dashboard. The team must find the data flow obvious.

**Decision.**

| Route | Server component | Client component |
|---|---|---|
| `/tickets` | Shell + headings | `TicketsView`: fetch, 300 ms debounced API search, `AbortController` for stale requests, loading/empty/error/retry |
| `/tickets/[id]` | Loads the ticket and the read-only flag; `notFound()` on 404 | `TicketDetail`: local form state, double-submit guard (ref + disabled), aria-live feedback, renders the **server-confirmed** ticket |
| `/dashboard` | Loads metrics and renders `MetricsView` | — |

- **All HTTP goes through `lib/api`** (`request<T>()` → `ApiError{status, code}`). Components never call `fetch`.
- The browser uses `NEXT_PUBLIC_API_BASE_URL` (`/api` behind the ingress, so the same image works in every env). Server components use the runtime `API_INTERNAL_BASE_URL` (cluster DNS).
- No global state library: state is local to the two interactive components.

**Consequences.**
- The list is client-rendered (no SSR of the table). That keeps a single source of truth for search state and avoids hydration mismatches; SEO is irrelevant for an internal inbox.
- `loading.tsx` streams a loading state for server pages. Trade-off: once streaming has started, `notFound()` renders the not-found UI with a `noindex` tag but HTTP status 200 (a Next.js streaming limitation).

**Alternatives.** Server actions for the mutation (would bypass the typed API client and mix transport styles). SWR or TanStack Query (unnecessary for two fetches).
