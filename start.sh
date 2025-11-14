#!/bin/bash

# Start Python backend in the background
echo "Starting Python backend on port 8000..."
python api/main.py &
PYTHON_PID=$!

# Wait a moment for Python to start
sleep 2

# Start Node.js server (this will run in foreground)
echo "Starting Node.js server on port 5000..."
NODE_ENV=development tsx server/index.ts

# Cleanup: kill Python backend when Node server stops
kill $PYTHON_PID 2>/dev/null || true
