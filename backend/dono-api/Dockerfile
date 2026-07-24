FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git unzip zip libzip-dev \
    && docker-php-ext-install zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=$PORT
