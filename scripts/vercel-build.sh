#!/bin/bash
set -e

# Vercel Supabase integration sets POSTGRES_* vars.
# Prisma expects DATABASE_URL + DIRECT_URL. Map automatically when missing.

if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="${POSTGRES_PRISMA_URL:-$POSTGRES_URL}"
fi

if [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="${POSTGRES_URL_NON_POOLING:-$POSTGRES_URL}"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Connect Supabase in Vercel → Settings → Integrations"
  exit 1
fi

if [ -z "$DIRECT_URL" ]; then
  echo "ERROR: DIRECT_URL is not set."
  echo "Connect Supabase in Vercel → Settings → Integrations"
  exit 1
fi

echo "Using DATABASE_URL (pooled) and DIRECT_URL for Prisma migrate..."

npx prisma generate
npx prisma migrate deploy
npx next build
