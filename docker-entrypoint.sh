#!/bin/sh
set -e

echo "🚀 Starting WhatsApp API Container..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed database with default user
echo "🌱 Seeding database..."
npx prisma db seed || echo "⚠️  Seed already exists or failed"

echo "🎉 Starting API server..."
exec "$@"
''