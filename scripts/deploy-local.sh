#!/usr/bin/env bash
set -euo pipefail

overlay="${1:-openshell}"
case "$overlay" in
  local | openshell) ;;
  *)
    echo "usage: $0 [local|openshell]" >&2
    exit 2
    ;;
esac

if [[ ! -f .env ]]; then
  echo "missing .env; copy .env.example and set DEEPSEEK_API_KEY" >&2
  exit 1
fi

if ! grep -Eq '^DEEPSEEK_API_KEY=.+$' .env; then
  echo "DEEPSEEK_API_KEY is missing from .env" >&2
  exit 1
fi

credential_file="$(mktemp)"
trap 'rm -f "$credential_file"' EXIT
grep -E '^DEEPSEEK_API_KEY=' .env >"$credential_file"

kubectl apply -f infra/kubernetes/base/namespace.yaml
kubectl -n tasklattice-sandboxes create secret generic tasklattice-provider-credentials \
  --from-env-file="$credential_file" \
  --dry-run=client \
  -o yaml | kubectl apply -f -
kubectl apply -k "infra/kubernetes/overlays/$overlay"
