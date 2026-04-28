#!/usr/bin/env bash
set -euo pipefail

NETWORK_NAME="${NETWORK_NAME:-medisena-projecthub-net}"
CONTAINER_NAME="${CONTAINER_NAME:-medisena-be}"
IMAGE_NAME="${IMAGE_NAME:-localhost/medisena-projecthub-be:latest}"
HOST_PORT="${HOST_PORT:-8081}"
ENV_FILE="${ENV_FILE:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if ! command -v podman >/dev/null 2>&1; then
  echo "Podman no esta en PATH." >&2
  exit 1
fi

podman network inspect "${NETWORK_NAME}" >/dev/null 2>&1 || podman network create "${NETWORK_NAME}"

cd "${REPO_ROOT}"
podman build -f deploy/container/backend.Containerfile -t "${IMAGE_NAME}" "${REPO_ROOT}"

RUN=(
  podman run -d --name "${CONTAINER_NAME}" --network "${NETWORK_NAME}" --replace -p "${HOST_PORT}:8081"
  --add-host=host.docker.internal:host-gateway
  --add-host=host.containers.internal:host-gateway
)
if [[ -n "${ENV_FILE}" && -f "${ENV_FILE}" ]]; then
  RUN+=(--env-file "${ENV_FILE}")
fi
RUN+=("${IMAGE_NAME}")

podman rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
"${RUN[@]}"

echo "Backend: http://127.0.0.1:${HOST_PORT}/health"
