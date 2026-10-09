# Implementation Plan: Inbox Frontend

**Branch**: `002-inbox-frontend` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

## Summary

A Next.js App Router app. Server components load initial data (the ticket detail, the read-only flag and the brand config); client components handle interaction (search, mutation, language switch). next-intl provides i18n without locale-prefixed routes. A zod-validated brand config is read at request time on the server.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 24
**Primary Dependencies**: next, react, next-intl, zod
**Styling**: CSS Modules plus CSS custom properties (brand colors injected at runtime)
**Testing**: Vitest, React Testing Library, user-event, MSW (API boundary), Playwright (E2E)
**Target Platform**: `output: "standalone"` container, non-root

## Constitution Check

| Principle | Status |
|---|---|
| I. MVP first | ✅ No global state library; local state plus server components |
| II. Boundaries | ✅ `lib/api` is the only HTTP layer |
| III. Tests | ✅ Behavior tests with MSW; no snapshots |
| IV. Config | ✅ API URLs through env; brand through a file; nothing hardcoded |
| V. i18n | ✅ next-intl, pt-BR default, key-parity test |
| VI. Independent deploy | ✅ One image for every env (`/api` relative base URL in k8s) |
| VII. Safe envs | ✅ Read-only banner driven by `/health` |

## Project Structure

```text
frontend/
├── app/                  layout.tsx, page.tsx, tickets/page.tsx, tickets/[id]/page.tsx, dashboard/page.tsx, not-found.tsx, error.tsx, globals.css
├── components/           TicketTable, TicketSearch, TicketUpdateForm, MetricsView, StatusBadge, PriorityBadge, StateMessage, SiteHeader, SiteFooter, LanguageSwitcher, ReadOnlyBanner
├── lib/api/              client.ts, tickets.ts, metrics.ts, health.ts, types.ts
├── lib/brand/            schema.ts, load.ts (server-only)
├── lib/hooks/            useDebouncedValue.ts
├── i18n/                 config.ts, request.ts, actions.ts (setLocale server action)
├── messages/             pt-BR.json, en.json
├── config/               brand.default.json
├── tests/                *.test.tsx, msw handlers
└── e2e/                  inbox.spec.ts
```

## Rendering strategy

| Route | Server | Client |
|---|---|---|
| `/tickets` | Page shell, translations | `TicketTable` (fetch plus debounced search; avoids an SSR/CSR double source of truth) |
| `/tickets/[id]` | Fetch ticket and health (404 → `notFound()`) | `TicketUpdateForm` (mutation state) |
| `/dashboard` | Fetch metrics; render or show the error state | — (read-only content) |

All server fetches use `cache: "no-store"` because the inbox data is live.
