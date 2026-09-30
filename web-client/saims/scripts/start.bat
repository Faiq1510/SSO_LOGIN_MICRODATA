@echo off
setlocal
echo ===================================================
echo   Starting SAIMS Services (Docker, Backend, Frontend)
echo ===================================================

echo [1/5] Checking Docker Engine...
docker info >nul 2>&1
if %errorlevel% equ 0 goto docker_ready

echo Docker Desktop is not running. Starting it now...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo Waiting for Docker Engine to be ready (this may take a minute)...

:wait_docker
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% neq 0 goto wait_docker

echo Docker is now ready!
echo.
goto kill_ports

:docker_ready
echo Docker is already running.
echo.

:kill_ports
echo [2/5] Cleaning up old processes...
taskkill /FI "WINDOWTITLE eq SAIMS Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq SAIMS Frontend*" /T /F >nul 2>&1

echo - Checking port 8080 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo - Checking port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Old processes cleared.
echo.

:start_services
echo [3/5] Starting Docker Services (PostgreSQL ^& Minio)...
cd backend
docker-compose up -d
cd ..
echo Waiting for database to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [4/5] Starting Backend API...
start "SAIMS Backend" cmd /c "title SAIMS Backend && cd backend && go run cmd/server/main.go"

echo Waiting for Backend to be fully active on port 8080...
:wait_backend
timeout /t 2 /nobreak >nul
netstat -aon | find ":8080" | find "LISTENING" >nul
if %errorlevel% neq 0 goto wait_backend
echo Backend is active!

echo.
echo [5/5] Starting Frontend Next.js...
start "SAIMS Frontend" cmd /c "title SAIMS Frontend && cd frontend && npm run dev"

echo Waiting for Frontend to be fully active on port 3000...
:wait_frontend
timeout /t 2 /nobreak >nul
netstat -aon | find ":3000" | find "LISTENING" >nul
if %errorlevel% neq 0 goto wait_frontend
echo Frontend is active!

echo.
echo ===================================================
echo   All services have been started successfully!
echo   - Backend is running on port 8080.
echo   - Frontend is running on port 3000.
echo ===================================================
