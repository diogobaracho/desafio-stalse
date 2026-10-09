#!/usr/bin/env bash
# Local Kubernetes environment on kind: cluster + Traefik + images + manifests + ETL bootstrap.
#   scripts/k8s-local.sh up      # create/update everything
#   scripts/k8s-local.sh down    # delete the cluster
set -euo pipefail

CLUSTER=stalse
NAMESPACE=stalse
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TRAEFIK_CHART_VERSION=41.7.0

up() {
  if ! kind get clusters | grep -qx "$CLUSTER"; then
    kind create cluster --config "$ROOT/deploy/kind/cluster.yaml"
  fi
  kubectl config use-context "kind-$CLUSTER" >/dev/null

  echo "==> Traefik ingress controller"
  helm repo add traefik https://traefik.github.io/charts >/dev/null 2>&1 || true
  helm upgrade --install traefik traefik/traefik --version "$TRAEFIK_CHART_VERSION" \
    --namespace traefik --create-namespace -f "$ROOT/deploy/kind/traefik-values.yaml" --wait

  echo "==> Building images (tag: local)"
  docker build -q -t stalse-backend:local "$ROOT/backend"
  docker build -q -t stalse-etl:local "$ROOT/data"
  docker build -q -t stalse-frontend:local --build-arg NEXT_PUBLIC_API_BASE_URL=/api "$ROOT/frontend"
  kind load docker-image --name "$CLUSTER" stalse-backend:local stalse-etl:local stalse-frontend:local

  echo "==> Applying deploy/k8s/overlays/local"
  kubectl kustomize --load-restrictor LoadRestrictionsNone "$ROOT/deploy/k8s/overlays/local" \
    | kubectl apply -f -

  echo "==> Bootstrapping metrics (one ETL run)"
  kubectl -n "$NAMESPACE" create job --from=cronjob/etl "etl-bootstrap-$(date +%s)"

  kubectl -n "$NAMESPACE" rollout restart deployment/backend deployment/frontend
  kubectl -n "$NAMESPACE" rollout status deployment/backend --timeout=180s
  kubectl -n "$NAMESPACE" rollout status deployment/frontend --timeout=180s
  kubectl -n "$NAMESPACE" rollout status deployment/n8n --timeout=180s

  cat <<MSG

Ready:  http://stalse.localtest.me:8080        (UI)
        http://stalse.localtest.me:8080/api/docs (API)
n8n:    kubectl -n $NAMESPACE port-forward svc/n8n 5678:5678
MSG
}

down() {
  kind delete cluster --name "$CLUSTER"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  *) echo "usage: $0 up|down" >&2; exit 2 ;;
esac
