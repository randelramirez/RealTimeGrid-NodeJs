# RealTimeGrid Development Servers Startup Script (PowerShell)
# This script starts both the backend and frontend development servers

Write-Host "🚀 Starting RealTimeGrid Development Servers..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Function to cleanup background jobs on exit
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Shutting down development servers..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    exit 0
}

# Set up signal handler for Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Navigate to backend directory and install dependencies if needed
Write-Host "📦 Setting up backend..." -ForegroundColor Blue
$rootDir = Get-Location
Set-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start backend server as background job
Write-Host "🔧 Starting backend server on port 5047..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:rootDir
    Set-Location backend
    npm run dev
} -Name "Backend"

# Navigate to frontend directory and install dependencies if needed
Write-Host "📦 Setting up frontend..." -ForegroundColor Blue
Set-Location ../frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start frontend server as background job
Write-Host "🎨 Starting frontend server on port 5173..." -ForegroundColor Blue
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:rootDir
    Set-Location frontend
    npm run dev
} -Name "Frontend"

# Wait a moment for servers to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Development servers are running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:5047" -ForegroundColor Blue
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Monitor jobs and display output
try {
    while ($true) {
        # Check if jobs are still running
        $runningJobs = Get-Job | Where-Object { $_.State -eq "Running" }
        
        if ($runningJobs.Count -eq 0) {
            Write-Host "❌ All servers have stopped" -ForegroundColor Red
            break
        }

        # Display job output
        foreach ($job in $runningJobs) {
            $output = Receive-Job $job -Keep
            if ($output) {
                Write-Host "[$($job.Name)] $output" -ForegroundColor Gray
            }
        }

        Start-Sleep -Seconds 1
    }
} catch {
    # Handle Ctrl+C
    Cleanup
} finally {
    # Cleanup jobs
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    
    # Navigate back to root directory
    Set-Location $rootDir
}

Write-Host "🛑 Development servers stopped." -ForegroundColor Yellow
