#!/usr/bin/env bash
set -e

echo "================================================================"
echo "      Setup & Launch Docker - Surat Penomoran + WhatsApp"
echo "================================================================"
echo ""

# 1. Cek file .env
if [ ! -f ".env" ]; then
    echo "[1/5] File .env tidak ditemukan. Menyalin dari .env.docker.example..."
    if [ -f ".env.docker.example" ]; then
        cp .env.docker.example .env
    else
        cp .env.example .env
    fi
    echo "      Berhasil membuat .env!"
else
    echo "[1/5] File .env sudah ada."
fi

# 2. Build & Start Docker Compose
echo ""
echo "[2/5] Membangun dan menjalankan container Docker..."
docker compose up -d --build

# 3. Generate APP_KEY
echo ""
echo "[3/5] Memastikan Application Key telah ter-generate..."
docker compose exec app php artisan key:generate --force

# 4. Storage Link
echo ""
echo "[4/5] Menghubungkan storage link..."
docker compose exec app php artisan storage:link --force

# 5. Migrate Database
echo ""
echo "[5/5] Menjalankan migrasi database..."
docker compose exec app php artisan migrate --force

echo ""
echo "================================================================"
echo "                  SETUP BERHASIL & SIAP DIGUNAKAN!"
echo "================================================================"
echo " * Laravel Web App : http://localhost:8000"
echo " * Database Adminer: http://localhost:8081 (PostgreSQL User: postgres, Pass: secret)"
echo " * WA Baileys API  : http://localhost:3000"
echo ""
echo " Untuk melihat QR Code WhatsApp, jalankan:"
echo "   docker compose logs -f wa-server"
echo "================================================================"
