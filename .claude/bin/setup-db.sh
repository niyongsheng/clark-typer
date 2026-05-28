#!/bin/bash
# Setup Python venv + install sqlite-vec + sentence-transformers
# One-time setup: bash .claude/bin/setup-db.sh

set -e
if project_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  cd "$project_root"
else
  cd "$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)/../.."
fi

echo "[setup-db] Creating Python virtual environment..."
python3 -m venv .claude/.venv

echo "[setup-db] Installing dependencies..."
.claude/.venv/bin/pip install --quiet --upgrade pip
.claude/.venv/bin/pip install --quiet \
    sqlite-vec \
    sentence-transformers \
    numpy

echo "[setup-db] Initializing database..."
.claude/.venv/bin/python .claude/bin/typer-index.py init

echo "[setup-db] Done. clark.db is ready at .clarke/clark.db"
