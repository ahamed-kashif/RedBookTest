FROM php:8.4-fpm

WORKDIR /var/www/html

# System dependencies for common PHP extensions.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    default-mysql-client \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions.
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
    gd \
    pdo_mysql \
    mbstring \
    xml \
    bcmath \
    zip \
    intl \
    exif \
    opcache

# Redis extension (app uses CACHE_STORE=redis / SESSION_DRIVER=redis / QUEUE_CONNECTION=redis).
RUN pecl install redis && docker-php-ext-enable redis

# PHP runtime tuning.
RUN { \
    echo "memory_limit = 1024M"; \
    echo "upload_max_filesize = 20M"; \
    echo "post_max_size = 20M"; \
    echo "max_execution_time = 300"; \
    echo "max_input_time = 300"; \
    } > /usr/local/etc/php/conf.d/zz-app.ini

# Listen on TCP so nginx (or the host) can reach php-fpm.
RUN sed -i 's/listen = 127.0.0.1:9000/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf \
    || echo "listen = 0.0.0.0:9000" >> /usr/local/etc/php-fpm.d/www.conf

# Composer.
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Application source.
COPY . /var/www/html

# Install PHP dependencies (overridden by the bind mount in development).
RUN if [ -f "composer.json" ]; then \
    composer install --no-dev --optimize-autoloader --no-interaction || true; \
    fi

# Frontend assets (Wayfinder needs PHP + vendor/ present at build time).
RUN npm ci && npm run build

# Permissions. storage/ + bootstrap/cache are bind-mounted at runtime, so create
# the mount points before chmod'ing them.
RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

COPY docker/images/app/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
