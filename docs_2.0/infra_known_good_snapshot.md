# Proofile 2.0 Known-Good Infra Snapshot

Date: 2026-04-26
Command: docker compose ps

Services
- backend: Up (healthy), port 8001 -> 8000
- frontend: Up (healthy), port 3000 -> 3000
- postgres: Up (healthy), port 5432 -> 5432
- redis: Up (healthy), port 6379 -> 6379
- worker: Up
- beat: Up

Notes
- Migration command executed: docker compose exec -T backend alembic upgrade head
- Smoke checks passed: API health, DB select 1, Celery ping, frontend routes (/ and /login)
- Compose project isolation enabled via COMPOSE_PROJECT_NAME=proofile_20
