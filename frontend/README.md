# Frontend (Next.js App Router)

Agent inbox UI: `/tickets`, `/tickets/[id]`, `/dashboard`. Brazilian Portuguese by default, English
as the second language, white-label branding from a config file.

```bash
cp .env.example .env.local
npm ci
npm run dev            # http://localhost:3000 (backend expected at http://localhost:8000)
npm test               # Vitest + RTL + MSW
npm run test:coverage  # coverage gate: 75% lines
npm run test:e2e       # Playwright; needs a running stack (E2E_BASE_URL)
npm run lint && npm run typecheck && npm run format:check
```

| Folder               | Purpose                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `app/`               | Routes (thin server components): data loading, `notFound()`, metadata                                                             |
| `components/`        | UI components. Client components only where interaction is needed (`TicketsView`, `TicketDetail`, `LanguageSwitcher`, `NavLinks`) |
| `lib/api/`           | **The only HTTP layer**: typed endpoints, `ApiError` with the backend error `code`                                                |
| `lib/brand/`         | White-label schema (zod) and runtime loader (`BRAND_CONFIG_PATH`)                                                                 |
| `i18n/`, `messages/` | next-intl config (cookie / Accept-Language, pt-BR default) and catalogs                                                           |
| `tests/`             | Component and unit tests; `msw.ts` mocks the API boundary                                                                         |
| `e2e/`               | Playwright critical path                                                                                                          |
