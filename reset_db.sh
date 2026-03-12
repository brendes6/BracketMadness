#!/bin/bash
set -euo pipefail

# If TURSO_DB_NAME is set, use the Turso CLI to reset the remote cloud DB
if [ -n "${TURSO_DB_NAME:-}" ]; then
    echo "=== Resetting Remote Turso Database: ${TURSO_DB_NAME} ==="
    echo "→ Running schema.sql..."
    turso db shell "${TURSO_DB_NAME}" < schema.sql
    echo "→ Loading seed data (Dummy Teams)..."
    turso db shell "${TURSO_DB_NAME}" < seed_data.sql
    echo "✅ Remote Database updated."
    exit 0
fi

# Otherwise, default to local SQLite DB
DB_FILE="bracket.db"
export DB_PATH=$DB_FILE

echo "=== Resetting Local Database ==="

if [ -f "$DB_FILE" ]; then
    echo "→ Removing existing database..."
    rm "$DB_FILE"
fi

echo "→ Initializing new database..."
sqlite3 "$DB_FILE" < schema.sql

if [ -f "seed_data.sql" ]; then
    echo "→ Loading seed data (Dummy Teams & 64 Player League)..."
    sqlite3 "$DB_FILE" < seed_data.sql
else
    echo "→ WARNING: seed_data.sql not found! Database is empty."
fi

echo "✅ Local Database initialized. Restart backend."
