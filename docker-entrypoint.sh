#!/bin/sh
# Startup script for combined API + Web container

# Render provides the externally reachable port via $PORT. Nginx uses that
# port, while the Go API stays on an internal port to avoid a conflict.
PUBLIC_PORT=${PORT:-8080}
export PORT=8081

sed -i "s/listen 80;/listen ${PUBLIC_PORT};/" /etc/nginx/conf.d/default.conf

if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set; PostgreSQL will use the local development default."
fi

nginx -t

# Wait for database to be ready
echo "Waiting for database..."
for i in $(seq 1 30); do
    # Try to connect to database using pg_isready or a simple Go program
    if /usr/local/bin/server -check-db 2>&1 | grep -q "database ready"; then
        echo "Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Database not ready after 30 attempts, starting anyway..."
        break
    fi
    echo "Database not ready, waiting... ($i/30)"
    sleep 2
done

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