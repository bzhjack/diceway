#!/bin/bash

php artisan db:seed --class=BolDesavantageSeeder
php artisan db:seed --class=BolAvantageSeeder

php artisan db:seed --class=BolRegionSeeder
php artisan db:seed --class=BolRegionAvantageSeeder
php artisan db:seed --class=BolRegionDesavantageSeeder
php artisan db:seed --class=BolRegionNomSeeder

