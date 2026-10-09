# Implementation Plan: Platform & Delivery

**Spec**: [spec.md](spec.md)

## Environments

| | local (compose) | local (kind) | azure-dev | azure-prod |
|---|---|---|---|---|
| Compute | Docker | kind + Traefik | AKS (1 node, B-series) | AKS (2+ nodes, zones) |
| Database | SQLite (volume) | SQLite (PVC) | PostgreSQL Flexible B1ms | PostgreSQL Flexible GP + backups |
| Metrics file | bind mount | PVC, ETL Job | Azure Files PVC, ETL CronJob | same |
| n8n | container | pod | external or disabled | external or disabled |
| Secrets | `.env` / compose env | ConfigMap (no secrets needed locally) | Key Vault → CSI files (`SECRETS_DIR`) + workload identity | same |
| Writes | ✅ | ✅ | ✅ | ❌ `READ_ONLY_MODE=true` |
| Human access | — | — | Contributor + AKS RBAC Writer | Reader + AKS RBAC Reader |

## Layout

```text
deploy/k8s/base/                 Deployments, Services, CronJob, PVC, Ingress (Traefik, /api → backend), ConfigMaps
deploy/k8s/components/azure      workload identity, Key Vault SecretProviderClass, Azure Files RWX, TLS (cert-manager)
deploy/k8s/overlays/local        SQLite PVC, in-cluster n8n, local images (kind load)
deploy/k8s/overlays/azure-dev    base + azure component, writable
deploy/k8s/overlays/azure-prod   + READ_ONLY_MODE, replicas, PDB, HPA, zone spread
scripts/                         k8s-local.sh (kind), aks-addons.sh (Traefik, cert-manager), deploy.sh
infra/terraform/bootstrap        state storage + GitHub OIDC identities
infra/terraform/modules/*        network, aks, acr, postgres, keyvault, monitoring, workload_identity, environment
infra/terraform/envs/{dev,prod}  composition per env
.github/workflows/               ci, cd-dev, cd-prod, terraform, _build-push (reusable)
```

## Constitution Check

VI ✅ per-component build contexts and path-filtered pipelines · VII ✅ OIDC, Key Vault, approval gates, read-only prod · I ⚠️ The platform layer is larger than the MVP strictly needs. It is justified by the explicit requirement and kept conventional (plain Kustomize, plain azurerm modules, no Helm charts or service mesh).
