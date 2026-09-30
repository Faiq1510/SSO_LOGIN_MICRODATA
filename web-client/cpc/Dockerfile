# Stage 1: build frontend assets (Vite + React)
FROM node:22-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: PHP-FPM + Nginx dalam satu container
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git \
    curl \
    zip \
    unzip \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    icu-dev \
    postgresql-client \
    nginx \
    supervisor

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

COPY . .
COPY --from=assets /app/public/build ./public/build

COPY .docker/render/nginx.conf /etc/nginx/http.d/default.conf
COPY .docker/render/supervisord.conf /etc/supervisord.conf

RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD sh -c "php artisan migrate --force && php artisan config:cache && php artisan route:cache && supervisord -c /etc/supervisord.conf"