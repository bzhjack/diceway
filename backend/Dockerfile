# -----------------------------
# 1) Composer stage (build dependencies)
# -----------------------------
FROM composer:2 AS vendor

WORKDIR /app

# Copier uniquement les fichiers Composer pour tirer parti du cache Docker
COPY composer.json ./

# Installer les dépendances PHP sans les packages dev
RUN composer install --prefer-dist --no-progress --no-interaction --no-scripts

# -----------------------------
# 2) Runtime stage with Apache + PHP
# -----------------------------
FROM php:8.4-apache

# Installer les extensions PHP et dépendances système courantes pour Laravel
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
        unzip \
        git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql zip gd opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Définir le document root sur le dossier public de Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}/../!g' /etc/apache2/apache2.conf \
    && sed -ri -e 's!Directory /var/www/!Directory ${APACHE_DOCUMENT_ROOT}/../!g' /etc/apache2/apache2.conf

# Ensure Laravel's public/.htaccess is honored
RUN set -eux; \
    echo "<Directory ${APACHE_DOCUMENT_ROOT}>" > /etc/apache2/conf-available/laravel.conf; \
    echo "    Options Indexes FollowSymLinks" >> /etc/apache2/conf-available/laravel.conf; \
    echo "    AllowOverride All" >> /etc/apache2/conf-available/laravel.conf; \
    echo "    Require all granted" >> /etc/apache2/conf-available/laravel.conf; \
    echo "</Directory>" >> /etc/apache2/conf-available/laravel.conf; \
    a2enconf laravel

WORKDIR /var/www/html

# Copier le code source de l'application
COPY . .

# Copier le vendor depuis la stage composer
COPY --from=vendor /app/vendor ./vendor
COPY --from=vendor /app/composer.lock ./composer.lock

# Assurer les permissions correctes pour Laravel
RUN chown -R www-data:www-data storage bootstrap/cache \
    && find storage bootstrap/cache -type d -exec chmod 775 {} \; \
    && find storage bootstrap/cache -type f -exec chmod 664 {} \;

# Exposer le port HTTP
EXPOSE 80

# Commande par défaut pour démarrer Apache
CMD ["apache2-foreground"]
