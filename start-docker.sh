#!/bin/bash

# Startup script for SymptomSense with Docker
# This script automatically starts Docker containers when you run npm start

echo "🚀 Starting SymptomSense with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    echo ""
    echo "Or run without Docker using: ng serve"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running!"
    echo "Please start Docker Desktop and try again."
    echo ""
    echo "Or run without Docker using: ng serve"
    exit 1
fi

# Check if containers are already running
if docker-compose ps | grep -q "Up"; then
    echo "⚠️  Containers are already running!"
    echo ""
    read -p "Do you want to restart them? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Restarting containers..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up
    else
        echo "✅ Keeping existing containers running"
        echo "📱 Application is available at http://localhost:4200"
        docker-compose -f docker-compose.dev.yml logs -f
    fi
else
    echo "🐳 Starting Docker containers..."
    echo ""
    docker-compose -f docker-compose.dev.yml up
fi

