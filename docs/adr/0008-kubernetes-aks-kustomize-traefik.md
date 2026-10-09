# ADR-0008: Kubernetes with Kustomize; Traefik everywhere; AKS in Azure

**Context.** Three environments must stay as similar as possible: local (kind), Azure dev and Azure prod. Upstream **ingress-nginx was retired in March 2026**, and the AKS application-routing add-on's managed NGINX is supported only through **November 2026**.

**Decision.**
- **Kustomize** (built into kubectl): one `base/`, three overlays, and an `azure` component shared by dev and prod. No Helm charts for our own app: there are no templates to maintain and the rendered YAML is easy to review.
- **Plain `Ingress` with no controller-specific annotations.** The backend serves under `/api` itself (`API_PREFIX`), so no rewrite rules are needed and any controller works.
- **Traefik** as the controller in every environment (Helm: `scripts/k8s-local.sh` on kind, `scripts/aks-addons.sh` on AKS). It is actively maintained and also implements the **Gateway API**, so the migration path is a manifest change, not a controller change.
- **AKS** with Entra ID + Azure RBAC (no local accounts), workload identity, the Key Vault CSI driver, Cilium and Container Insights. TLS via cert-manager + Let's Encrypt.
- Pods run hardened: non-root, read-only root filesystem, dropped capabilities, seccomp `RuntimeDefault`, requests and limits, probes.

**Consequences.** Local Kubernetes exercises the same manifests, ingress controller and `/api` routing as Azure (verified end to end on kind, including Playwright through the ingress). Prod adds 2+ replicas, PDBs, HPAs and zone spreading.

**Alternatives.** Azure Container Apps (simpler and cheaper, but no Kubernetes parity with local; it was considered and rejected in favor of AKS for consistency). The AKS app-routing NGINX (reaching end of support). Application Gateway for Containers (strong option for Gateway API on Azure, but more infrastructure; a candidate for the roadmap).
