FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    default-mysql-client \
    && docker-php-ext-install zip pdo pdo_mysql pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

# The canonical DOONO backend lives under backend/dono-api. Railway must not
# boot the legacy root Laravel tree, which has a different composer manifest.
WORKDIR /app/backend/dono-api
RUN composer install --no-dev --optimize-autoloader

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD php -r '$port = getenv("PORT") ?: "8080"; $body = @file_get_contents("http://127.0.0.1:" . $port . "/up"); exit($body === false ? 1 : 0);'

# Set PROCESS_ROLE=web (default), queue, or scheduler per Railway service.
CMD if [ "${PROCESS_ROLE:-web}" = "queue" ]; then \
        php artisan queue:work --sleep=3 --tries=3 --timeout=120 --max-time=3600; \
    elif [ "${PROCESS_ROLE:-web}" = "scheduler" ]; then \
        php artisan schedule:work; \
    else \
        php artisan serve --host=0.0.0.0 --port=${PORT:-8080}; \
    fi
