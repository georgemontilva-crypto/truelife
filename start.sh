#!/bin/sh
set -e
echo "[start] Running database migrations..."
pnpm drizzle-kit migrate
echo "[start] Migrations complete. Starting server..."
NODE_ENV=production node dist/index.js
