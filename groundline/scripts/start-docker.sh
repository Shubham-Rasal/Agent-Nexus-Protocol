#!/bin/bash

# Groundline Docker Startup Script
# This script helps with the initial setup and starting of Docker services

set -e

echo "🚀 Groundline Docker Setup"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed."
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available."
    echo "Please ensure you have Docker Compose v2+ installed."
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is available"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "Creating .env file from env.example..."
    cp env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your OPENAI_API_KEY"
    echo "   You can get an API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your API key to continue, or Ctrl+C to exit..."
fi

# Check if OPENAI_API_KEY is set
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Warning: OPENAI_API_KEY is not set in .env file"
    echo "   The application may not work properly without it."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please set your OPENAI_API_KEY in .env file."
        exit 1
    fi
fi

echo "🔧 Configuration check complete"
echo ""

# Check if containers are already running
if docker compose ps | grep -q "Up"; then
    echo "⚠️  Some containers are already running"
    read -p "Do you want to restart them? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Stopping existing containers..."
        docker compose down
    else
        echo "Keeping existing containers. Use 'docker compose logs -f' to view logs."
        exit 0
    fi
fi

echo "🏗️  Building and starting services..."
echo "   This may take several minutes on first run..."
echo ""

# Build and start services
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Access your services:"
echo "   • Main Site:      http://localhost:3000"
echo "   • Memgraph Lab:   http://localhost:3001"
echo "   • Memgraph DB:    bolt://localhost:7687"
echo ""
echo "📝 View logs with:"
echo "   docker compose logs -f"
echo ""
echo "🛑 Stop services with:"
echo "   docker compose down"
echo ""
echo "📚 Full documentation: DOCKER_SETUP.md"
echo ""

