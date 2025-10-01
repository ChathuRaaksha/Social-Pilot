#!/bin/bash

# Demo script for the Social Campaign Backend

echo "🚀 Social Campaign Backend Demo"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please add your Google Gemini API key to .env file"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Start Temporal server in Docker
echo "🔄 Starting Temporal server..."
docker run -d --name temporal-dev \
    -p 7233:7233 \
    temporalio/temporal:latest

# Wait for Temporal to start
echo "⏳ Waiting for Temporal to start..."
sleep 10

# Check if Temporal is running
if docker ps | grep -q temporal-dev; then
    echo "✅ Temporal server is running"
else
    echo "❌ Failed to start Temporal server"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Build the project
echo ""
echo "🔨 Building TypeScript project..."
npm run build

# Start the application
echo ""
echo "🚀 Starting the application..."
echo "   - API Server: http://localhost:3000"
echo "   - Temporal UI: http://localhost:8088"
echo ""

# Run both server and worker
npm run temporal:dev

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker stop temporal-dev
    docker rm temporal-dev
    echo "✅ Demo stopped"
}

# Set up trap to cleanup on exit
trap cleanup EXIT
