# ADR-0007: Monorepo with independently deployable components

**Context.** Backend, frontend and ETL change at different rates, but a reviewer (and a small team) benefits from one repository, one PR per feature and shared docs and specs.

**Decision.**
- Each component (`backend/`, `frontend/`, `data/`) owns its dependency manifest, lockfile, Dockerfile (**its own directory is the build context**), tests and README.
- CI uses path filters, so a frontend-only PR runs only frontend jobs (plus E2E).
- CD dev rebuilds **only changed components**. `scripts/deploy.sh` keeps the running image for untouched components.
- After each dev deploy, the complete running image set is tagged with the commit SHA in ACR. A release (`v*` tag) **imports those exact digests** into the prod registry. Nothing is rebuilt for prod, so prod runs bit-for-bit what was tested in dev.
- Images are environment-agnostic: config comes from env, ConfigMaps and Key Vault at runtime (the browser API base is the relative `/api`).

**Consequences.** Independent release cadence without polyrepo overhead. Contracts between components are explicit and versioned in the repo (OpenAPI, the `metrics.json` shape and the webhook payload).

**Alternatives.** Polyrepo (cross-cutting changes need several PRs). Rebuild per environment (what runs in prod would differ from what was tested).
