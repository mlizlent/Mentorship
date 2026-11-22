#!/bin/sh
# Startup script for combined API + Web container

# Start API in background
/usr/local/bin/server &

# Store API PID
API_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down..."
    kill $API_PID 2>/dev/null
    nginx -s quit 2>/dev/null
    wait $API_PID 2>/dev/null
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Start nginx in foreground (blocking)
exec nginx -g "daemon off;"