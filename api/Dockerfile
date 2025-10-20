# PHP + Apache for Laravel (PHP 8.4)
FROM php:8.4-apache

# System dependencies and PHP extensions
RUN apt-get update \
    && apt-get install -y git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev \
    && docker-php-ext-install pdo_mysql bcmath zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Set Apache vhost to serve /public and enable overrides
COPY docker/app/vhost.conf /etc/apache2/sites-available/000-default.conf

# Install Composer (from official image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Workdir
WORKDIR /var/www/html
