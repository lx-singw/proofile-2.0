#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] API health"
curl -fsS http://localhost:8001/health >/dev/null

echo "[2/4] DB select 1"
docker compose exec -T backend python - <<'PY'
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT 1'))
        assert result.scalar() == 1
    await engine.dispose()

asyncio.run(main())
PY

echo "[3/4] Celery ping"
docker compose exec -T backend python - <<'PY'
from app.celery_app import ping
result = ping.delay().get(timeout=20)
assert result == "pong", result
print("pong")
PY

echo "[4/4] Frontend routes"
curl -fsSI http://localhost:3000/ >/dev/null
curl -fsSI http://localhost:3000/login >/dev/null

echo "Smoke pass: OK"