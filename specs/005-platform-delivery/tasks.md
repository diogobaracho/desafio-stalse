# Tasks: Platform & Delivery

## Phase 1: Containers

- [x] T001 [P] `backend/Dockerfile`, `frontend/Dockerfile`, `data/Dockerfile` (multi-stage, non-root)
- [x] T002 `docker-compose.yml` (backend, frontend, n8n, etl profile) plus `deploy/compose/docker-compose.debug.yml`

## Phase 2: Kubernetes

- [x] T003 Kustomize base (backend with init container, frontend, etl CronJob, PVC, ingress, ConfigMaps)
- [x] T004 [P] Overlays: local (kind), azure-dev, azure-prod
- [x] T005 `deploy/kind/cluster.yaml`, `scripts/k8s-local.sh` and `make k8s-up` / `make k8s-down`

## Phase 3: Terraform

- [x] T006 bootstrap (state storage, GitHub OIDC identities, federated credentials)
- [x] T007 [P] Modules: network, aks, acr, postgres, keyvault, monitoring, workload_identity, environment (Azure Files is provisioned dynamically by the AKS `azurefile-csi` class, so no storage module)
- [x] T008 envs/dev and envs/prod (RBAC model, read-only humans in prod)

## Phase 4: GitHub

- [x] T009 `ci.yml` (path filters, per-component jobs, k8s/tf validation, e2e)
- [x] T010 `_build-push.yml`, `cd-dev.yml`, `cd-prod.yml` (digest promotion)
- [x] T011 `terraform.yml` (plan on PR, gated apply)
- [x] T012 dependabot, CODEOWNERS, PR and issue templates

## Phase 5: Docs

- [x] T013 `docs/guides/deployment-azure.md`, `ci-cd.md`, `local-development.md`, `debugging.md`
