@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo       Setup & Launch Docker - Surat Penomoran + WhatsApp
echo ================================================================
echo.

:: 1. Cek apakah Docker Desktop aktif & daemon ready
echo [1/6] Memeriksa status Docker Engine...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker Engine belum aktif / sedang proses starting!
    echo Solusi:
    echo  1. Buka aplikasi Docker Desktop di Windows.
    echo  2. Tunggu beberapa saat sampai status di pojok kiri bawah menjadi hijau "Engine running".
    echo  3. Jalankan kembali script ini.
    echo.
    pause
    exit /b 1
)
echo       Docker Engine aktif dan siap.

:: 2. Cek file .env
echo.
if not exist ".env" (
    echo [2/6] File .env tidak ditemukan. Menyalin dari .env.docker.example...
    if exist ".env.docker.example" (
        copy .env.docker.example .env >nul
    ) else (
        copy .env.example .env >nul
    )
    echo       Berhasil membuat .env!
) else (
    echo [2/6] File .env sudah ada.
)

:: 3. Build & Start Docker Compose
echo.
echo [3/6] Membangun dan menjalankan container Docker...
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo [ERROR] Gagal menjalankan docker compose up.
    echo Silakan periksa pesan error di atas.
    pause
    exit /b 1
)

:: 4. Generate APP_KEY jika belum ada
echo.
echo [4/6] Memastikan Application Key telah ter-generate...
docker compose exec app php artisan key:generate --force

:: 5. Storage Link & Permission
echo.
echo [5/6] Menghubungkan storage link...
docker compose exec app php artisan storage:link --force

:: 6. Migrate Database
echo.
echo [6/6] Menjalankan migrasi database...
docker compose exec app php artisan migrate --force

echo.
echo ================================================================
echo                   SETUP BERHASIL & SIAP DIGUNAKAN!
echo ================================================================
echo  * Laravel Web App : http://localhost:8000
echo  * Database Adminer: http://localhost:8081 (PostgreSQL User: postgres, Pass: secret)
echo  * WA Baileys API  : http://localhost:3000
echo.
echo  Untuk melihat QR Code WhatsApp, jalankan:
echo    docker compose logs -f wa-server
echo ================================================================
echo.
pause
