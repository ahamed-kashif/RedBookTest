#!/bin/bash
set -e

echo "Waiting for MySQL to be ready..."
until mysql --skip-ssl -h mysql -u "${DB_USERNAME:-redbook-test_user}" -p"${DB_PASSWORD:-redbook-test_password}" -e "SELECT 1" &> /dev/null; do
    echo "MySQL is unavailable - sleeping"
    sleep 2
done
echo "MySQL is ready!"

# Install composer dependencies if vendor is missing (first run on a bind mount).
if [ ! -d "/var/www/html/vendor" ]; then
    echo "Installing composer dependencies..."
    git config --global --add safe.directory /var/www/html
    cd /var/www/html && composer install --no-interaction --prefer-dist || true
fi

# Permissions for runtime-writable dirs.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Laravel housekeeping.
if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link || true
fi
php artisan config:clear || true
php artisan cache:clear || true
# Uncomment to auto-migrate on boot:
# php artisan migrate --force || true

exec "$@"
