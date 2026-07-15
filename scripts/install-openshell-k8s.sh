#!/usr/bin/env bash
set -euo pipefail

AGENT_SANDBOX_VERSION="${AGENT_SANDBOX_VERSION:-0.5.1}"
OPENSHELL_VERSION="${OPENSHELL_VERSION:-0.0.82}"
OPENSHELL_NAMESPACE="${OPENSHELL_NAMESPACE:-openshell}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIR}"' EXIT

echo "[1/4] Installing Agent Sandbox ${AGENT_SANDBOX_VERSION}"
kubectl apply -f "https://github.com/kubernetes-sigs/agent-sandbox/releases/download/v${AGENT_SANDBOX_VERSION}/manifest.yaml"
kubectl -n agent-sandbox-system rollout status deployment/agent-sandbox-controller --timeout=180s

echo "[2/4] Downloading OpenShell ${OPENSHELL_VERSION} Helm chart source"
curl --fail --location --retry 5 \
  --output "${TEMP_DIR}/openshell.tar.gz" \
  "https://github.com/NVIDIA/OpenShell/archive/refs/tags/v${OPENSHELL_VERSION}.tar.gz"
tar -xzf "${TEMP_DIR}/openshell.tar.gz" -C "${TEMP_DIR}"

echo "[3/4] Installing OpenShell in namespace ${OPENSHELL_NAMESPACE}"
helm upgrade --install openshell \
  "${TEMP_DIR}/OpenShell-${OPENSHELL_VERSION}/deploy/helm/openshell" \
  --namespace "${OPENSHELL_NAMESPACE}" \
  --create-namespace \
  --values "${ROOT_DIR}/infra/kubernetes/openshell/values-local.yaml" \
  --wait \
  --timeout 5m

echo "[4/4] Verifying OpenShell gateway"
kubectl -n "${OPENSHELL_NAMESPACE}" rollout status statefulset/openshell --timeout=180s
kubectl -n "${OPENSHELL_NAMESPACE}" get pods
