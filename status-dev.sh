#!/bin/bash

# Helper script to check status of development servers
# Usage: ./status-dev.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo "📊 Development Server Status"
echo "============================="
echo ""

# Check server
if pgrep -f "bun.*dev:server" > /dev/null 2>&1; then
    server_pid=$(pgrep -f "bun.*dev:server" | head -1)
    echo -e "Server: ${GREEN}RUNNING${NC} (PID: $server_pid) - http://localhost:3000"
else
    echo -e "Server: ${RED}STOPPED${NC}"
fi

# Check client
if pgrep -f "bun.*dev" > /dev/null 2>&1; then
    server_pid=$(pgrep -f "bun.*dev:server" | head -1 2>/dev/null || echo "")
    all_dev_pids=$(pgrep -f "bun.*dev")
    client_pid=""
    for pid in $all_dev_pids; do
        if [ "$pid" != "$server_pid" ]; then
            client_pid=$pid
            break
        fi
    done
    
    if [ -n "$client_pid" ]; then
        echo -e "Client: ${GREEN}RUNNING${NC} (PID: $client_pid) - http://localhost:5173"
    else
        echo -e "Client: ${RED}STOPPED${NC}"
    fi
else
    echo -e "Client: ${RED}STOPPED${NC}"
fi

echo ""
print_status "Quick commands:"
echo "  ./restart-dev.sh  # Restart both servers"
echo "  pkill -f 'bun.*dev'  # Stop all servers"