# Feature Specification: Platform & Delivery

**Feature Branch**: `005-platform-delivery`

**Created**: 2026-10-08

**Status**: Implemented (Azure apply is an operator step)

**Input**: "Monorepo whose components deploy independently to three environments (local through docker compose or Kubernetes, Azure dev, Azure prod) using Docker, Kubernetes, Terraform and GitHub Actions. Production is read-only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run everything locally with one command (Priority: P1) 🎯

1. **Given** Docker, **When** `make compose-up`, **Then** the backend (migrated and seeded), frontend, n8n (with the workflow imported) and the ETL output are available at `localhost:3000`, `:8000` and `:5678`.
2. **Given** kind, **When** `make k8s-up`, **Then** the same stack runs on a local Kubernetes cluster behind an ingress at `http://stalse.localtest.me:8080`.

### User Story 2 - Provision Azure environments (Priority: P1)

1. **Given** an Azure subscription, **When** the operator runs the Terraform bootstrap and then `envs/dev` and `envs/prod`, **Then** each env gets a resource group, VNet, AKS (workload identity, Key Vault CSI, app routing), ACR, PostgreSQL Flexible Server (private), Key Vault, an Azure Files share for metrics and Log Analytics.
2. In prod, the human group has only `Reader` and `Azure Kubernetes Service RBAC Reader`. The CI identity can deploy.

### User Story 3 - Independent continuous delivery (Priority: P1)

1. **Given** a merge to `main` that changes only `frontend/**`, **Then** only the frontend image is built, pushed to the dev ACR and rolled out to Azure dev.
2. **Given** a `v*` tag, **When** a reviewer approves the `production` environment, **Then** the exact dev image digests are imported into the prod ACR and rolled out to prod with `READ_ONLY_MODE=true`, followed by a smoke test.
3. Every PR runs CI for the components it touches, plus k8s and Terraform validation.

## Requirements *(mandatory)*

- **FR-001**: Each component has its own Dockerfile and build context, and images are environment-agnostic.
- **FR-002**: Kubernetes manifests use a Kustomize base plus `local`, `azure-dev` and `azure-prod` overlays, with Traefik as the ingress controller everywhere (ADR-0008).
- **FR-003**: Terraform uses reusable modules, per-env roots and remote state, with no secrets in state inputs or in git.
- **FR-004**: GitHub authenticates to Azure only through OIDC federated credentials.
- **FR-005**: Prod: `READ_ONLY_MODE=true`, ≥ 2 replicas, a PDB, image digests and approval gates.

## Success Criteria *(mandatory)*

- **SC-001**: `terraform validate` passes for bootstrap, dev and prod. Every overlay passes `kubeconform`.
- **SC-002**: The CI workflow passes on a clean clone.
- **SC-003**: The docs let a new engineer deploy to an empty subscription without help.
