#!/bin/bash
set -e

echo "🔍 Running Proofile smoke / health checks..."

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

check_file() {
    local path="$REPO_ROOT/$1"
    if [ -f "$path" ]; then
        echo "  ✅ $1"
    else
        echo "  ❌ Missing required file: $1"
        exit 1
    fi
}

check_dir() {
    local path="$REPO_ROOT/$1"
    if [ -d "$path" ]; then
        echo "  ✅ $1/"
    else
        echo "  ❌ Missing required directory: $1"
        exit 1
    fi
}

echo ""
echo "── Infrastructure ──────────────────────────────────"
check_file "docker-compose.yml"
check_file "Makefile"

echo ""
echo "── Backend ─────────────────────────────────────────"
check_file "backend/pyproject.toml"
check_file "backend/alembic.ini"
check_file "backend/app/main.py"
check_file "backend/app/core/config.py"
check_file "backend/app/core/database.py"
check_dir  "backend/alembic/versions"

echo ""
echo "── Frontend ────────────────────────────────────────"
check_file "frontend/package.json"
check_file "frontend/next.config.ts"
check_file "frontend/tsconfig.json"
check_dir  "frontend/src"

echo ""
echo "✅ All smoke checks passed."
