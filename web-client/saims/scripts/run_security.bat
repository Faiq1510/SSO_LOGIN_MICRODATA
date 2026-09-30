@echo off
echo ========================================================
echo 🛡️ SAIMS Automated Security Scanner (SAST)
echo ========================================================
echo.

echo [1/2] Menganalisa Keamanan Kode Backend (Golang)...
cd backend

where gosec >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Menggunakan gosec lokal...
    gosec ./...
) else (
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Menggunakan gosec via Docker...
        docker run --rm -e GOTOOLCHAIN=auto -v "%cd%:/app" -w /app securego/gosec ./...
    ) else (
        echo ⚠️ Skip backend SAST: 'gosec' tidak terinstall dan Docker daemon tidak aktif / tidak terinstall.
        goto skip_backend_warn
    )
)

if %errorlevel% neq 0 (
    echo ⚠️ Peringatan: Ditemukan potensi kerentanan di Backend!
) else (
    echo ✅ Backend Aman dari kerentanan statis.
)

:skip_backend_warn
cd ..
echo.

echo [2/2] Menganalisa Keamanan Dependensi Frontend (Node.js) menggunakan NPM Audit...
cd frontend

where npm >nul 2>&1
if %errorlevel% equ 0 (
    call npm audit --audit-level=high
    if %errorlevel% neq 0 (
        echo ⚠️ Peringatan: Ditemukan kerentanan High/Critical di package Frontend!
    ) else (
        echo ✅ Package Frontend Aman.
    )
) else (
    echo ⚠️ Skip frontend audit: 'npm' tidak ditemukan.
)

cd ..
echo.

echo ========================================================
echo 🎉 Pemindaian Selesai! Baca panduan mitigasi bila terdapat error.
echo ========================================================

