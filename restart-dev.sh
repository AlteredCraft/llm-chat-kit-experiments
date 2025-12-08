#!/bin/bash

# Helper script to restart both server and client idempotently
# Usage: ./restart-dev.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a process is running
is_running() {
    local process_name="$1"
    pgrep -f "$process_name" > /dev/null 2>&1
}

# Function to stop processes
stop_processes() {
    print_status "Stopping existing development servers..."
    
    if is_running "bun.*dev:server"; then
        print_status "Stopping server..."
        pkill -f "bun.*dev:server" || true
        sleep 1
    fi
    
    if is_running "bun.*dev"; then
        print_status "Stopping client..."
        pkill -f "bun.*dev" || true
        sleep 1
    fi
    
    # Force kill any remaining processes
    pkill -9 -f "bun.*dev:server" 2>/dev/null || true
    pkill -9 -f "bun.*dev" 2>/dev/null || true
    
    print_success "All development servers stopped"
}

# Function to start processes
start_processes() {
    print_status "Starting development servers..."
    
    # Start server
    print_status "Starting server (bun run dev:server)..."
    bun run dev:server > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 2
    
    # Check if server started successfully
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_success "Server started (PID: $SERVER_PID)"
    else
        print_error "Failed to start server"
        exit 1
    fi
    
    # Start client
    print_status "Starting client (bun run dev)..."
    bun run dev > client.log 2>&1 &
    CLIENT_PID=$!
    
    # Wait a moment for client to start
    sleep 3
    
    # Check if client started successfully
    if kill -0 $CLIENT_PID 2>/dev/null; then
        print_success "Client started (PID: $CLIENT_PID)"
    else
        print_error "Failed to start client"
        print_error "Check client.log for details"
        exit 1
    fi
    
    # Verify servers are accessible
    print_status "Verifying servers are accessible..."
    
    # Check server
    if curl -s http://localhost:3000/api/providers > /dev/null 2>&1; then
        print_success "Server API is accessible at http://localhost:3000"
    else
        print_warning "Server API not yet accessible, may still be starting..."
    fi
    
    # Check client
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_success "Client is accessible at http://localhost:5173"
    else
        print_warning "Client not yet accessible, may still be starting..."
    fi
}

# Function to show status
show_status() {
    echo ""
    print_status "Development Server Status:"
    echo "----------------------------------------"
    
    local server_pid=""
    local client_pid=""
    
    # Check server
    if is_running "bun.*dev:server"; then
        server_pid=$(pgrep -f "bun.*dev:server" | head -1)
        echo -e "Server: ${GREEN}RUNNING${NC} (PID: $server_pid) - http://localhost:3000"
    else
        echo -e "Server: ${RED}STOPPED${NC}"
    fi
    
    # Check client (exclude server process)
    if is_running "bun.*dev"; then
        # Get all bun dev processes and exclude the server one
        local all_dev_pids=$(pgrep -f "bun.*dev")
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
    
    echo "----------------------------------------"
    echo ""
}

# Main script logic
main() {
    echo "🔄 Development Server Restart Script"
    echo "====================================="
    
    # Show current status
    show_status
    
    # Stop existing processes
    stop_processes
    
    # Start new processes
    start_processes
    
    # Show final status
    echo ""
    print_success "Development servers restarted successfully!"
    show_status
    
    echo ""
    print_status "Log files:"
    echo "  - Server: server.log"
    echo "  - Client: client.log"
    echo ""
    print_status "To stop servers manually, run:"
    echo "  pkill -f 'bun.*dev'"
    echo ""
    print_status "To view logs, run:"
    echo "  tail -f server.log  # Server logs"
    echo "  tail -f client.log  # Client logs"
}

# Handle script interruption
trap 'print_warning "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"