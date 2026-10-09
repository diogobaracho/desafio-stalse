#!/usr/bin/env bash
# Deploy the app to an AKS environment (used by the CD workflows; usable by operators).
#
#   scripts/deploy.sh azure-dev|azure-prod
#
# Required env: ACR_LOGIN_SERVER KEYVAULT_NAME BACKEND_CLIENT_ID AZURE_TENANT_ID INGRESS_HOST
#               LETSENCRYPT_EMAIL
# Optional env: DRY_RUN=1 - render + check manifests to stdout, touch no cluster.
#               BACKEND_IMAGE FRONTEND_IMAGE ETL_IMAGE - full image refs (prefer @sha256 digests).
#               A component left empty keeps the image currently running in the cluster, so a
#               change to one component deploys only that component.
set -euo pipefail

OVERLAY="${1:?usage: deploy.sh azure-dev|azure-prod}"
NAMESPACE=stalse
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OVERLAY_DIR="$ROOT/deploy/k8s/overlays/$OVERLAY"
: "${ACR_LOGIN_SERVER:?}" "${KEYVAULT_NAME:?}" "${BACKEND_CLIENT_ID:?}" "${AZURE_TENANT_ID:?}" \
  "${INGRESS_HOST:?}" "${LETSENCRYPT_EMAIL:?}"

current_image() { # kind name -> image currently deployed (empty if none)
  local path='{.spec.template.spec.containers[0].image}'
  [[ "$1" == cronjob ]] && path='{.spec.jobTemplate.spec.template.spec.containers[0].image}'
  kubectl -n "$NAMESPACE" get "$1" "$2" -o jsonpath="$path" 2>/dev/null || true
}

BACKEND_IMAGE="${BACKEND_IMAGE:-$(current_image deployment backend)}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-$(current_image deployment frontend)}"
ETL_IMAGE="${ETL_IMAGE:-$(current_image cronjob etl)}"
for var in BACKEND_IMAGE FRONTEND_IMAGE ETL_IMAGE; do
  if [[ -z "${!var}" ]]; then
    echo "::error::$var is not set and nothing is deployed yet - run the first deploy with all components." >&2
    exit 1
  fi
done
echo "backend:  $BACKEND_IMAGE" >&2
echo "frontend: $FRONTEND_IMAGE" >&2
echo "etl:      $ETL_IMAGE" >&2

# Pin images in a throwaway copy of the overlay (the working tree stays clean).
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp -r "$ROOT/deploy" "$WORK/"
(
  cd "$WORK/deploy/k8s/overlays/$OVERLAY"
  # Rewrite the overlay's `images:` block (kubectl has no `kustomize edit`).
  python3 - "$BACKEND_IMAGE" "$FRONTEND_IMAGE" "$ETL_IMAGE" <<'PY'
import re, sys
backend, frontend, etl = sys.argv[1:4]
def entry(name, ref):
    if "@" in ref:
        repo, digest = ref.split("@", 1)
        return f'  - {{ name: {name}, newName: "{repo}", digest: "{digest}" }}'
    repo, _, tag = ref.rpartition(":")
    return f'  - {{ name: {name}, newName: "{repo}", newTag: "{tag}" }}'
text = open("kustomization.yaml").read()
block = "images:\n" + "\n".join([
    entry("stalse-backend", backend), entry("stalse-frontend", frontend), entry("stalse-etl", etl)
]) + "\n"
text = re.sub(r"images:\n(?:  - .*\n)+", block, text)
open("kustomization.yaml", "w").write(text)
PY
)

export ACR_LOGIN_SERVER KEYVAULT_NAME BACKEND_CLIENT_ID AZURE_TENANT_ID INGRESS_HOST LETSENCRYPT_EMAIL
kubectl kustomize "$WORK/deploy/k8s/overlays/$OVERLAY" \
  | envsubst '${ACR_LOGIN_SERVER} ${KEYVAULT_NAME} ${BACKEND_CLIENT_ID} ${AZURE_TENANT_ID} ${INGRESS_HOST} ${LETSENCRYPT_EMAIL}' \
  > "$WORK/rendered.yaml"

if grep -q '\${' "$WORK/rendered.yaml"; then
  echo "::error::Unsubstituted variables left in manifests:" >&2
  grep -n '\${' "$WORK/rendered.yaml" >&2
  exit 1
fi

if [[ "${DRY_RUN:-0}" == 1 ]]; then
  cat "$WORK/rendered.yaml"
  exit 0
fi

kubectl apply --server-side --force-conflicts -f "$WORK/rendered.yaml"

# Ensure metrics exist on first deploy (afterwards the daily CronJob keeps them fresh).
if ! kubectl -n "$NAMESPACE" get jobs -l app.kubernetes.io/name=etl -o name | grep -q .; then
  kubectl -n "$NAMESPACE" create job --from=cronjob/etl "etl-bootstrap-$(date +%s)"
fi

kubectl -n "$NAMESPACE" rollout status deployment/backend --timeout=300s
kubectl -n "$NAMESPACE" rollout status deployment/frontend --timeout=300s
echo "Deployed $OVERLAY -> https://$INGRESS_HOST"
