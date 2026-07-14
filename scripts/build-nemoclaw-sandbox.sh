#!/usr/bin/env bash
set -euo pipefail

# Pin the complete NVIDIA NemoClaw runtime, not only the OpenClaw npm package.
# The resulting image contains nemoclaw-start, the NemoClaw plugin, generated
# OpenClaw config, gateway supervision, and the managed health check.
readonly NEMOCLAW_REVISION="${NEMOCLAW_REVISION:-2adc8481ff3053a5a7be37d130cb183e222934ff}"
readonly NEMOCLAW_BASE_IMAGE="${NEMOCLAW_BASE_IMAGE:-ghcr.io/nvidia/nemoclaw/sandbox-base@sha256:132dfea81026fe91581ab97d9034fb61d97b41a9951c7fd59d3d8b3b1b37b246}"
readonly NEMOCLAW_IMAGE="${NEMOCLAW_IMAGE:-tasklattice-nemoclaw-sandbox:0.3.0}"

build_context="$(mktemp -d "${TMPDIR:-/tmp}/tasklattice-nemoclaw.XXXXXX")"
trap 'rm -rf "$build_context"' EXIT

git clone --quiet --filter=blob:none https://github.com/NVIDIA/NemoClaw.git "$build_context"
git -C "$build_context" checkout --quiet "$NEMOCLAW_REVISION"

docker build \
  --build-arg "BASE_IMAGE=$NEMOCLAW_BASE_IMAGE" \
  --build-arg NEMOCLAW_MODEL=deepseek-chat \
  --build-arg NEMOCLAW_PRIMARY_MODEL_REF=inference/deepseek-chat \
  --build-arg NEMOCLAW_PROVIDER_KEY=inference \
  --build-arg NEMOCLAW_INFERENCE_BASE_URL=https://inference.local/v1 \
  --build-arg NEMOCLAW_INFERENCE_API=openai-completions \
  --build-arg NEMOCLAW_CONTEXT_WINDOW=65536 \
  --build-arg NEMOCLAW_MAX_TOKENS=8192 \
  --build-arg NEMOCLAW_REASONING=false \
  --build-arg NEMOCLAW_WEB_SEARCH_ENABLED=0 \
  --tag "$NEMOCLAW_IMAGE" \
  "$build_context"
