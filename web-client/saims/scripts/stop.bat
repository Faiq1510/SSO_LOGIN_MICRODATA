@echo off
setlocal
echo ===================================================
echo   Stopping SAIMS Services (Docker, Backend, Frontend)
echo ===================================================

echo [1/4] Closing Terminal Windows...
taskkill /FI "WINDOWTITLE eq SAIMS Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq SAIMS Frontend*" /T /F >nul 2>&1

echo [2/4] Ensuring Ports 8080 and 3000 are freed...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/4] Stopping Docker Services (PostgreSQL ^& Minio)...
cd backend
docker-compose down
cd ..

echo [4/4] Quitting Docker Desktop Application...
"C:\Program Files\Docker\Docker\DockerCli.exe" -Quit

echo.
echo ===================================================
echo   All SAIMS services have been successfully stopped!
echo   Docker Desktop has been closed and exited.
echo ===================================================
pause
