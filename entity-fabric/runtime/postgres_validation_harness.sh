#!/usr/bin/env bash
set -euo pipefail

DB_IMAGE="${DB_IMAGE:-postgres:16-alpine}"
CONTAINER_NAME="${CONTAINER_NAME:-entity-fabric-pg}"
PGUSER="${PGUSER:-entity_fabric}"
PGPASSWORD="${PGPASSWORD:-entity_fabric}"
PGDATABASE="${PGDATABASE:-entity_fabric}"
PGPORT="${PGPORT:-55432}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup

docker run -d --name "$CONTAINER_NAME" \
  -e POSTGRES_USER="$PGUSER" \
  -e POSTGRES_PASSWORD="$PGPASSWORD" \
  -e POSTGRES_DB="$PGDATABASE" \
  -p "$PGPORT:5432" \
  "$DB_IMAGE" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

for f in entity-fabric/sql/*.sql; do
  docker exec -i "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U "$PGUSER" -d "$PGDATABASE" < "$f"
done

docker exec "$CONTAINER_NAME" psql -U "$PGUSER" -d "$PGDATABASE" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('core','priv') ORDER BY schemaname, tablename;"
