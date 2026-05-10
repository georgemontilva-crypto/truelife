#!/bin/sh
if [ -z "$DATABASE_URL" ]; then
  echo "[start] DATABASE_URL not set, skipping migrations..."
else
  echo "[start] Running database migrations..."
  pnpm drizzle-kit migrate
  echo "[start] Migrations complete."
fi

echo "[start] Starting server..."
NODE_ENV=production node dist/index.js
