#!/usr/bin/env bash
# Cluster add-ons for an AKS environment: Traefik (ingress) + cert-manager (TLS).
# Idempotent; run by CD before deploying the app, or manually by an operator:
#   az aks get-credentials -g rg-stalse-dev -n aks-stalse-dev && kubelogin convert-kubeconfig -l azurecli
#   scripts/aks-addons.sh
set -euo pipefail

TRAEFIK_CHART_VERSION="${TRAEFIK_CHART_VERSION:-41.7.0}"
CERT_MANAGER_VERSION="${CERT_MANAGER_VERSION:-v1.21.2}"

helm repo add traefik https://traefik.github.io/charts >/dev/null 2>&1 || true
helm repo add jetstack https://charts.jetstack.io >/dev/null 2>&1 || true
helm repo update >/dev/null

# Traefik behind an Azure Standard Load Balancer (public IP). Same controller as local kind.
helm upgrade --install traefik traefik/traefik --version "$TRAEFIK_CHART_VERSION" \
  --namespace traefik --create-namespace \
  --set ingressClass.enabled=true --set ingressClass.isDefaultClass=true --set ingressClass.name=traefik \
  --set providers.kubernetesIngress.enabled=true \
  --set ports.web.redirections.entryPoint.to=websecure \
  --set ports.web.redirections.entryPoint.scheme=https \
  --set "service.annotations.service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path=/ping" \
  --set deployment.replicas=2 \
  --wait

helm upgrade --install cert-manager jetstack/cert-manager --version "$CERT_MANAGER_VERSION" \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true \
  --wait

echo "Ingress public IP (point your DNS A record for INGRESS_HOST here):"
kubectl -n traefik get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'; echo
