#!/bin/sh
set -e

# Pastikan direktori storage & cache tersedia
mkdir -p /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/logs \
         /var/www/html/storage/app/public/surat_keluar/temp \
         /var/www/html/storage/app/public/surat_masuk \
         /var/www/html/bootstrap/cache

# Generate .env jika belum ada
if [ ! -f /var/www/html/.env ]; then
    echo "==> .env file not found, creating from .env.docker.example or .env.example..."
    if [ -f /var/www/html/.env.docker.example ]; then
        cp /var/www/html/.env.docker.example /var/www/html/.env
    elif [ -f /var/www/html/.env.example ]; then
        cp /var/www/html/.env.example /var/www/html/.env
    fi
fi

# Pastikan composer vendor terinstal
if [ ! -d /var/www/html/vendor ]; then
    echo "==> Running composer install..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Set permission direktori storage dan cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Generate app key jika kosong
if grep -q "APP_KEY=$" /var/www/html/.env 2>/dev/null || grep -q "APP_KEY=\"\"" /var/www/html/.env 2>/dev/null || ! grep -q "APP_KEY=" /var/www/html/.env 2>/dev/null; then
    echo "==> Generating application key..."
    php artisan key:generate --force
fi

# Storage symlink
php artisan storage:link --force 2>/dev/null || true

# Clear cache lama saat start
php artisan optimize:clear 2>/dev/null || true

echo "==> Laravel App ready!"

# Jalankan command default container (misal: php-fpm)
exec "$@"
