# ADR-0010: pt-BR first i18n with next-intl

**Context.** The users are Brazilian support agents. English is needed for reviewers and future markets.

**Decision.**
- `next-intl` **without locale-prefixed routes** (`/tickets` stays `/tickets`). The locale comes from the `NEXT_LOCALE` cookie (set by the header switcher through a server action), then `Accept-Language`, then **pt-BR**.
- Catalogs: `frontend/messages/pt-BR.json` (source of truth) and `en.json`. A test fails if their keys differ.
- Dates and numbers are formatted with `Intl` per locale; the display time zone is `APP_TIME_ZONE` (default `America/Sao_Paulo`).
- **The backend stays English and returns stable error `code`s**; the UI maps codes to `errors.*` messages. Data values (customer text, ETL category labels) are shown as-is.
- Source-code identifiers, logs and commit messages are in English.

**Consequences.** Adding a language means adding one JSON file in `frontend/messages/` plus one entry in `frontend/i18n/config.ts`; the catalog test then checks that its keys match pt-BR. Without URL prefixes there is no per-language SEO, which does not matter for an internal tool.

**Alternatives.** `/[locale]/` routing (unnecessary URL churn). Translating API messages server-side (couples the API to UI languages).
