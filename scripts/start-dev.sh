#!/bin/bash

echo "🚀 Starting Blind Nut Development Server..."
echo ""

# Kill any existing Vite processes
echo "Cleaning up any existing processes..."
pkill -f vite || true

# Start the development server
echo "Starting development server..."
npm run dev

# This script will keep running until you press Ctrl+C