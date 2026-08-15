#!/usr/bin/env bash
set -e

echo "🌱 Running database seed..."
pnpm --filter @spotly/database prisma db seed
echo "✅ Database seed completed."
