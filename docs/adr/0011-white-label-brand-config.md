# ADR-0011: White-label brand config loaded at runtime

**Context.** The product may be resold or deployed for a real brand. Brand names and contact information must not be hardcoded.

**Decision.** A single JSON document holds product name, company, localized tagline, logo, favicon, colors, contact (email, phone, website, address, localized hours) and social links. It is validated by a **zod schema** (`lib/brand/schema.ts`).
- Default: `frontend/config/brand.default.json` (fictitious `example.com` contacts).
- Override: `BRAND_CONFIG_PATH` read **at request time on the server**. In Kubernetes it is a ConfigMap (`deploy/k8s/base/brand.json`, overridable per overlay); in compose it is a mounted file. **Re-branding needs no rebuild.**
- An invalid file logs an error and falls back to the default brand, so the site never goes down over branding.
- Colors become CSS custom properties; all components use tokens.

**Consequences.** A test (`frontend/tests/brand.test.tsx`) renders the header and footer with an alternate brand and asserts that no default brand text remains. To see a runtime swap locally: `BRAND_CONFIG_PATH=/etc/stalse/brand/acme.example.json docker compose up -d frontend` (the file comes from `deploy/compose/brand/`).

**Alternatives.** Build-time env vars (one image per brand). A CMS (overkill).
