# ==============================================================================
# 1. Node.js stage: Build frontend assets (Vite + Tailwind)
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY resources ./resources
COPY public ./public
COPY vite.config.js tailwind.config.js postcss.config.js ./

RUN npm run build

# ==============================================================================
# 2. Main PHP-FPM Application stage
# ==============================================================================
FROM php:8.2-fpm

# Install system dependencies & libraries (including libicu-dev for intl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libwebp-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libicu-dev \
    zip \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions using docker-php-ext-install & configure
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache

# Install Redis extension via PECL
RUN pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy custom PHP configuration
COPY docker/php/local.ini /usr/local/etc/php/conf.d/local.ini

# Copy application files
COPY . /var/www/html

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/public/build /var/www/html/public/build

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]
