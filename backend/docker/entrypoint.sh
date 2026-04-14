#!/bin/sh
set -eu

mkdir -p /var/www/html/storage/app/public/avatars
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R ug+rwX /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@"
