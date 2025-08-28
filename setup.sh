#!/bin/bash

# DRDO Emergency Response System - Setup Script
# This script sets up and runs the complete emergency response system

set -e

echo "=========================================="
echo "DRDO Emergency Response System Setup"
echo "=========================================="

# Color codes for output
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

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js version 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    print_success "npm $(npm -v) detected"
}

# Function to check if a port is available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port $port is already in use. Please stop the service using this port or choose a different port for $service."
        return 1
    fi
    return 0
}

# Function to install dependencies for a service
install_dependencies() {
    local service_dir=$1
    local service_name=$2
    
    if [ -d "$service_dir" ]; then
        print_status "Installing dependencies for $service_name..."
        cd "$service_dir"
        
        if [ -f "package.json" ]; then
            npm install
            print_success "$service_name dependencies installed"
        else
            print_warning "No package.json found in $service_dir"
        fi
        
        cd ..
    else
        print_warning "$service_dir directory not found, skipping $service_name"
    fi
}

# Function to create environment file if it doesn't exist
create_env_file() {
    local service_dir=$1
    local service_name=$2
    local port=$3
    
    if [ -d "$service_dir" ]; then
        cd "$service_dir"
        
        if [ ! -f ".env" ]; then
            print_status "Creating .env file for $service_name..."
            cat > .env << EOF
NODE_ENV=development
PORT=$port
REALTIME_SERVER_URL=http://localhost:8081
AUTH_DISABLED=true
LOG_LEVEL=info
EOF
            print_success ".env file created for $service_name"
        else
            print_status ".env file already exists for $service_name"
        fi
        
        cd ..
    fi
}

# Function to start a service in the background
start_service() {
    local service_dir=$1
    local service_name=$2
    local port=$3
    
    if [ -d "$service_dir" ]; then
        print_status "Starting $service_name on port $port..."
        cd "$service_dir"
        
        # Check if the service has a start script
        if [ -f "server.js" ]; then
            nohup node server.js > "../logs/${service_name}.log" 2>&1 &
            echo $! > "../logs/${service_name}.pid"
        elif [ -f "index.js" ]; then
            nohup node index.js > "../logs/${service_name}.log" 2>&1 &
            echo $! > "../logs/${service_name}.pid"
        else
            print_warning "No server file found for $service_name"
            cd ..
            return 1
        fi
        
        cd ..
        sleep 2
        
        # Check if service started successfully
        if check_port $port "$service_name"; then
            print_error "$service_name failed to start on port $port"
            return 1
        else
            print_success "$service_name started successfully on port $port"
            return 0
        fi
    else
        print_warning "$service_dir directory not found, skipping $service_name"
        return 1
    fi
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    if [ -d "logs" ]; then
        for pidfile in logs/*.pid; do
            if [ -f "$pidfile" ]; then
                pid=$(cat "$pidfile")
                service_name=$(basename "$pidfile" .pid)
                
                if kill -0 "$pid" 2>/dev/null; then
                    print_status "Stopping $service_name (PID: $pid)..."
                    kill "$pid"
                    rm "$pidfile"
                else
                    print_warning "$service_name (PID: $pid) is not running"
                    rm "$pidfile"
                fi
            fi
        done
    fi
    
    print_success "All services stopped"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo "----------------------------------------"
    
    # Check Real-time Server
    if check_port 8081 "Real-time Server"; then
        echo "Real-time Server (8081): ❌ Not Running"
    else
        echo "Real-time Server (8081): ✅ Running"
    fi
    
    # Check Command Center
    if check_port 3002 "Command Center"; then
        echo "Command Center (3002):   ❌ Not Running"
    else
        echo "Command Center (3002):   ✅ Running"
    fi
    
    # Check Citizen Portal
    if check_port 3003 "Citizen Portal"; then
        echo "Citizen Portal (3003):   ❌ Not Running"
    else
        echo "Citizen Portal (3003):   ✅ Running"
    fi
    
    echo "----------------------------------------"
}

# Main setup function
main_setup() {
    print_status "Starting DRDO Emergency Response System setup..."
    
    # Create logs directory
    mkdir -p logs
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    # Check if required ports are available
    print_status "Checking port availability..."
    check_port 8081 "Real-time Server"
    check_port 3002 "Command Center"
    check_port 3003 "Citizen Portal"
    
    # Install dependencies for all services
    print_status "Installing dependencies for all services..."
    install_dependencies "realtime-server" "Real-time Server"
    install_dependencies "command-center" "Command Center"
    install_dependencies "citizen-portal" "Citizen Portal"
    
    # Create environment files
    print_status "Setting up environment files..."
    create_env_file "realtime-server" "Real-time Server" 8081
    create_env_file "command-center" "Command Center" 3002
    create_env_file "citizen-portal" "Citizen Portal" 3003
    
    print_success "Setup completed successfully!"
}

# Function to start all services
start_all_services() {
    print_status "Starting all services..."
    
    # Start services in order
    start_service "realtime-server" "realtime-server" 8081
    sleep 3
    start_service "command-center" "command-center" 3002
    sleep 3
    start_service "citizen-portal" "citizen-portal" 3003
    
    print_success "All services started!"
    
    # Show access URLs
    echo ""
    echo "=========================================="
    echo "Access URLs:"
    echo "=========================================="
    echo "Command Center:  http://localhost:3002"
    echo "Citizen Portal:  http://localhost:3003"
    echo "Real-time API:   http://localhost:8081"
    echo "=========================================="
    echo ""
    
    show_status
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  start     Setup and start all services"
    echo "  stop      Stop all running services"
    echo "  status    Show status of all services"
    echo "  setup     Install dependencies and setup environment"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start   # Setup and start all services"
    echo "  $0 stop    # Stop all services"
    echo "  $0 status  # Check service status"
}

# Parse command line arguments
case "${1:-start}" in
    "start")
        main_setup
        start_all_services
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "setup")
        main_setup
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac

print_status "Script execution completed."
