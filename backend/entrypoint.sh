#!/bin/sh
set -e

mkdir -p /var/www/html/storage/framework/cache \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Avoid shipping stale local bootstrap cache into the production image.
rm -f /var/www/html/bootstrap/cache/*.php

if [ ! -L /var/www/html/public/storage ]; then
  php artisan storage:link || true
fi

php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

exec "$@"
