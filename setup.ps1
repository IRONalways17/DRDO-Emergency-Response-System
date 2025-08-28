# DRDO Emergency Response System - Setup Script (PowerShell)
# This script sets up and runs the complete emergency response system on Windows

param(
    [Parameter(Position=0)]
    [string]$Action = "start"
)

# Color codes for output
$RED = [System.ConsoleColor]::Red
$GREEN = [System.ConsoleColor]::Green
$YELLOW = [System.ConsoleColor]::Yellow
$BLUE = [System.ConsoleColor]::Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $BLUE
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $GREEN
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $YELLOW
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $RED
}

# Check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        if ($nodeVersion -match "v(\d+)\.") {
            $majorVersion = [int]$matches[1]
            if ($majorVersion -ge 16) {
                Write-Success "Node.js $nodeVersion detected"
                return $true
            } else {
                Write-Error "Node.js version 16 or higher is required. Current version: $nodeVersion"
                return $false
            }
        }
    } catch {
        Write-Error "Node.js is not installed. Please install Node.js version 16 or higher."
        return $false
    }
}

# Check if npm is installed
function Test-NPM {
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion detected"
        return $true
    } catch {
        Write-Error "npm is not installed. Please install npm."
        return $false
    }
}

# Function to check if a port is available
function Test-Port {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Warning "Port $Port is already in use. Please stop the service using this port or choose a different port for $ServiceName."
            return $false
        }
        return $true
    } catch {
        return $true
    }
}

# Function to install dependencies for a service
function Install-ServiceDependencies {
    param(
        [string]$ServiceDir,
        [string]$ServiceName
    )
    
    if (Test-Path $ServiceDir) {
        Write-Status "Installing dependencies for $ServiceName..."
        Push-Location $ServiceDir
        
        if (Test-Path "package.json") {
            try {
                npm install
                Write-Success "$ServiceName dependencies installed"
            } catch {
                Write-Error "Failed to install dependencies for $ServiceName"
            }
        } else {
            Write-Warning "No package.json found in $ServiceDir"
        }
        
        Pop-Location
    } else {
        Write-Warning "$ServiceDir directory not found, skipping $ServiceName"
    }
}

# Function to create environment file if it doesn't exist
function New-EnvironmentFile {
    param(
        [string]$ServiceDir,
        [string]$ServiceName,
        [int]$Port
    )
    
    if (Test-Path $ServiceDir) {
        Push-Location $ServiceDir
        
        if (-not (Test-Path ".env")) {
            Write-Status "Creating .env file for $ServiceName..."
            $envContent = @"
NODE_ENV=development
PORT=$Port
REALTIME_SERVER_URL=http://localhost:8081
AUTH_DISABLED=true
LOG_LEVEL=info
"@
            $envContent | Out-File -FilePath ".env" -Encoding UTF8
            Write-Success ".env file created for $ServiceName"
        } else {
            Write-Status ".env file already exists for $ServiceName"
        }
        
        Pop-Location
    }
}

# Function to start a service in the background
function Start-Service {
    param(
        [string]$ServiceDir,
        [string]$ServiceName,
        [int]$Port
    )
    
    if (Test-Path $ServiceDir) {
        Write-Status "Starting $ServiceName on port $Port..."
        Push-Location $ServiceDir
        
        # Create logs directory if it doesn't exist
        if (-not (Test-Path "../logs")) {
            New-Item -ItemType Directory -Path "../logs" -Force | Out-Null
        }
        
        # Check if the service has a start script
        if (Test-Path "server.js") {
            $process = Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden -PassThru
            $process.Id | Out-File -FilePath "../logs/$ServiceName.pid" -Encoding UTF8
        } elseif (Test-Path "index.js") {
            $process = Start-Process -FilePath "node" -ArgumentList "index.js" -WindowStyle Hidden -PassThru
            $process.Id | Out-File -FilePath "../logs/$ServiceName.pid" -Encoding UTF8
        } else {
            Write-Warning "No server file found for $ServiceName"
            Pop-Location
            return $false
        }
        
        Pop-Location
        Start-Sleep -Seconds 2
        
        # Check if service started successfully
        if (Test-Port -Port $Port -ServiceName $ServiceName) {
            Write-Error "$ServiceName failed to start on port $Port"
            return $false
        } else {
            Write-Success "$ServiceName started successfully on port $Port"
            return $true
        }
    } else {
        Write-Warning "$ServiceDir directory not found, skipping $ServiceName"
        return $false
    }
}

# Function to stop all services
function Stop-AllServices {
    Write-Status "Stopping all services..."
    
    if (Test-Path "logs") {
        Get-ChildItem -Path "logs" -Filter "*.pid" | ForEach-Object {
            $pidContent = Get-Content $_.FullName -ErrorAction SilentlyContinue
            if ($pidContent) {
                $processId = [int]$pidContent
                $serviceName = $_.BaseName
                
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Status "Stopping $serviceName (PID: $processId)..."
                        Stop-Process -Id $processId -Force
                    } else {
                        Write-Warning "$serviceName (PID: $processId) is not running"
                    }
                    Remove-Item $_.FullName -Force
                } catch {
                    Write-Warning "Failed to stop $serviceName (PID: $processId)"
                    Remove-Item $_.FullName -Force
                }
            }
        }
    }
    
    Write-Success "All services stopped"
}

# Function to show service status
function Show-ServiceStatus {
    Write-Status "Service Status:"
    Write-Host "----------------------------------------"
    
    # Check Real-time Server
    if (Test-Port -Port 8081 -ServiceName "Real-time Server") {
        Write-Host "Real-time Server (8081): ❌ Not Running"
    } else {
        Write-Host "Real-time Server (8081): ✅ Running"
    }
    
    # Check Command Center
    if (Test-Port -Port 3002 -ServiceName "Command Center") {
        Write-Host "Command Center (3002):   ❌ Not Running"
    } else {
        Write-Host "Command Center (3002):   ✅ Running"
    }
    
    # Check Citizen Portal
    if (Test-Port -Port 3003 -ServiceName "Citizen Portal") {
        Write-Host "Citizen Portal (3003):   ❌ Not Running"
    } else {
        Write-Host "Citizen Portal (3003):   ✅ Running"
    }
    
    Write-Host "----------------------------------------"
}

# Main setup function
function Start-MainSetup {
    Write-Status "Starting DRDO Emergency Response System setup..."
    
    # Create logs directory
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    
    # Check prerequisites
    if (-not (Test-NodeJS)) { exit 1 }
    if (-not (Test-NPM)) { exit 1 }
    
    # Check if required ports are available
    Write-Status "Checking port availability..."
    Test-Port -Port 8081 -ServiceName "Real-time Server" | Out-Null
    Test-Port -Port 3002 -ServiceName "Command Center" | Out-Null
    Test-Port -Port 3003 -ServiceName "Citizen Portal" | Out-Null
    
    # Install dependencies for all services
    Write-Status "Installing dependencies for all services..."
    Install-ServiceDependencies -ServiceDir "realtime-server" -ServiceName "Real-time Server"
    Install-ServiceDependencies -ServiceDir "command-center" -ServiceName "Command Center"
    Install-ServiceDependencies -ServiceDir "citizen-portal" -ServiceName "Citizen Portal"
    
    # Create environment files
    Write-Status "Setting up environment files..."
    New-EnvironmentFile -ServiceDir "realtime-server" -ServiceName "Real-time Server" -Port 8081
    New-EnvironmentFile -ServiceDir "command-center" -ServiceName "Command Center" -Port 3002
    New-EnvironmentFile -ServiceDir "citizen-portal" -ServiceName "Citizen Portal" -Port 3003
    
    Write-Success "Setup completed successfully!"
}

# Function to start all services
function Start-AllServices {
    Write-Status "Starting all services..."
    
    # Start services in order
    Start-Service -ServiceDir "realtime-server" -ServiceName "realtime-server" -Port 8081
    Start-Sleep -Seconds 3
    Start-Service -ServiceDir "command-center" -ServiceName "command-center" -Port 3002
    Start-Sleep -Seconds 3
    Start-Service -ServiceDir "citizen-portal" -ServiceName "citizen-portal" -Port 3003
    
    Write-Success "All services started!"
    
    # Show access URLs
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "Access URLs:"
    Write-Host "=========================================="
    Write-Host "Command Center:  http://localhost:3002"
    Write-Host "Citizen Portal:  http://localhost:3003"
    Write-Host "Real-time API:   http://localhost:8081"
    Write-Host "=========================================="
    Write-Host ""
    
    Show-ServiceStatus
}

# Function to show usage
function Show-Usage {
    Write-Host "Usage: .\setup.ps1 [OPTION]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  start     Setup and start all services"
    Write-Host "  stop      Stop all running services"
    Write-Host "  status    Show status of all services"
    Write-Host "  setup     Install dependencies and setup environment"
    Write-Host "  help      Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\setup.ps1 start   # Setup and start all services"
    Write-Host "  .\setup.ps1 stop    # Stop all services"
    Write-Host "  .\setup.ps1 status  # Check service status"
}

# Main script execution
Write-Host "=========================================="
Write-Host "DRDO Emergency Response System Setup"
Write-Host "=========================================="

switch ($Action.ToLower()) {
    "start" {
        Start-MainSetup
        Start-AllServices
    }
    "stop" {
        Stop-AllServices
    }
    "status" {
        Show-ServiceStatus
    }
    "setup" {
        Start-MainSetup
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Error "Unknown option: $Action"
        Show-Usage
        exit 1
    }
}

Write-Status "Script execution completed."
