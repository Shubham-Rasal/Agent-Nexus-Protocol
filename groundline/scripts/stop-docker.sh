#!/bin/bash

# Groundline Docker Stop Script

set -e

echo "🛑 Stopping Groundline Docker Services"
echo "======================================"
echo ""

# Check if any containers are running
if ! docker compose ps | grep -q "Up"; then
    echo "ℹ️  No containers are currently running."
    exit 0
fi

echo "Current running services:"
docker compose ps
echo ""

read -p "Do you want to remove volumes (deletes all data)? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Stopping containers and removing volumes..."
    docker compose down -v
    echo "✅ All containers and volumes removed"
else
    echo "🔄 Stopping containers (preserving data)..."
    docker compose down
    echo "✅ Containers stopped, data preserved"
fi

echo ""
echo "💡 To start again, run: ./scripts/start-docker.sh"
echo ""

