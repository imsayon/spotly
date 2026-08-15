#!/usr/bin/env bash
set -e

echo "🚀 Running database migrations..."
pnpm --filter @spotly/database prisma migrate deploy
echo "✅ Database migrations applied successfully."
