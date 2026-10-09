# Architecture Decision Records

Format: context → decision → consequences → alternatives considered. Status is *Accepted* unless noted otherwise.

| # | Decision |
|---|---|
| [0001](0001-use-fastapi.md) | FastAPI for the API |
| [0002](0002-use-sqlite.md) | SQLite for the challenge, behind SQLAlchemy and Alembic |
| [0003](0003-serve-precomputed-metrics.md) | Serve precomputed ETL metrics; never aggregate at request time |
| [0004](0004-webhook-delivery-semantics.md) | Webhook on transitions, after commit, best-effort |
| [0005](0005-frontend-rendering-and-state.md) | Server components for reads, client components for interaction |
| [0006](0006-testing-strategy.md) | Behavior tests at the boundaries; coverage gates |
| [0007](0007-monorepo-independent-deploys.md) | Monorepo with independently deployable components |
| [0008](0008-kubernetes-aks-kustomize-traefik.md) | Kubernetes with Kustomize; Traefik everywhere; AKS in Azure |
| [0009](0009-sqlite-local-postgresql-azure.md) | SQLite locally, PostgreSQL Flexible Server in Azure |
| [0010](0010-i18n-pt-br-first.md) | pt-BR first i18n with next-intl |
| [0011](0011-white-label-brand-config.md) | White-label brand config loaded at runtime |
| [0012](0012-read-only-production.md) | Read-only production (app flag + RBAC) |
| [0013](0013-spec-driven-development.md) | Spec-driven development with GitHub Spec Kit |
