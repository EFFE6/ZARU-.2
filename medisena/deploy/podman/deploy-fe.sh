#!/usr/bin/env bash
set -euo pipefail

NETWORK_NAME="${NETWORK_NAME:-medisena-projecthub-net}"
CONTAINER_NAME="${CONTAINER_NAME:-medisena-fe}"
IMAGE_NAME="${IMAGE_NAME:-localhost/medisena-projecthub-fe:latest}"
HOST_PORT="${HOST_PORT:-8080}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if ! command -v podman >/dev/null 2>&1; then
  echo "Podman no esta en PATH." >&2
  exit 1
fi

podman network inspect "${NETWORK_NAME}" >/dev/null 2>&1 || podman network create "${NETWORK_NAME}"

cd "${REPO_ROOT}"
podman build -f deploy/container/frontend.Containerfile -t "${IMAGE_NAME}" "${REPO_ROOT}"

podman rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
podman run -d \
  --name "${CONTAINER_NAME}" \
  --network "${NETWORK_NAME}" \
  --replace \
  -p "${HOST_PORT}:80" \
  "${IMAGE_NAME}"

echo "Frontend: http://127.0.0.1:${HOST_PORT}/ (API via /api hacia medisena-be)"
