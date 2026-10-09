# Tasks: Inbox Frontend

## Phase 1: Setup

- [x] T001 Next.js app (TS strict, ESLint, Prettier, `output: standalone`)
- [x] T002 [P] Vitest + RTL + MSW config with a coverage threshold (75% lines)
- [x] T003 [P] next-intl config (`i18n/`), `messages/pt-BR.json`, `messages/en.json`, key-parity test
- [x] T004 [P] Brand config schema, loader and `config/brand.default.json`; brand tests

## Phase 2: Foundational

- [x] T005 `lib/api/client.ts` (`ApiError`, base URL resolution) plus tests
- [x] T006 Root layout: header (brand, nav, language switcher), footer (contact info), CSS variables

## Phase 3: US1 Browse and search 🎯

- [x] T007 [US1] Tests: render, search debounce, loading, empty, error/retry
- [x] T008 [US1] `TicketTable`, `TicketSearch`, `useDebouncedValue`, badges, `StateMessage`

## Phase 4: US2 Triage

- [x] T009 [US2] Tests: detail render, mutation success, failure, pending disable, read-only banner
- [x] T010 [US2] `/tickets/[id]` page, `TicketUpdateForm`, `ReadOnlyBanner`, not-found

## Phase 5: US3 Dashboard

- [x] T011 [US3] Tests: metrics render, empty, error
- [x] T012 [US3] `/dashboard` with `MetricsView`

## Phase 6: US4/US5 Language and brand

- [x] T013 [US4] `LanguageSwitcher` (server action sets the `NEXT_LOCALE` cookie) plus a test
- [x] T014 [US5] Runtime `BRAND_CONFIG_PATH` override; invalid file falls back with a log

## Phase 7: Polish

- [x] T015 Playwright E2E critical path
- [x] T016 Dockerfile (standalone, non-root) and README
