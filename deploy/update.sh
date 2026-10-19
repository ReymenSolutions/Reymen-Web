#!/usr/bin/env bash
# Actualiza el sitio en la VPS: pull de main, build y arranque. Uso: sudo ./deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only origin main
docker compose up -d --build
for i in $(seq 1 20); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' reymen-web 2>/dev/null)" = "healthy" ] && { echo "reymen-web: running / healthy"; exit 0; }
  sleep 3
done
echo "reymen-web no quedó healthy" >&2; docker logs --tail 30 reymen-web >&2; exit 1
