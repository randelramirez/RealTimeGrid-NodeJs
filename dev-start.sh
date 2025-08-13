#!/bin/bash

# RealTimeGrid Development Servers Startup Script
# This script starts both the backend and frontend development servers

echo "🚀 Starting RealTimeGrid Development Servers..."
echo "================================================"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory and install dependencies if needed
echo "📦 Setting up backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Start backend server in background
echo "🔧 Starting backend server on port 5047..."
npm run dev &
BACKEND_PID=$!

# Navigate to frontend directory and install dependencies if needed
echo "📦 Setting up frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend server in background
echo "🎨 Starting frontend server on port 5173..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for servers to start
sleep 3

echo ""
echo "✅ Development servers are running!"
echo "================================================"
echo "🔧 Backend:  http://localhost:5047"
echo "🎨 Frontend: http://localhost:5173"
echo "================================================"
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
