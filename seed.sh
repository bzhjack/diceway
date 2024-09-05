#!/bin/bash

php artisan db:seed --class=BolDesavantageSeeder
php artisan db:seed --class=BolAvantageSeeder
php artisan db:seed --class=BolLangueSeeder
php artisan db:seed --class=BolArmeSeeder
php artisan db:seed --class=BolArmureSeeder

php artisan db:seed --class=BolRegionSeeder
php artisan db:seed --class=BolRegionAvantageSeeder
php artisan db:seed --class=BolRegionDesavantageSeeder
php artisan db:seed --class=BolRegionNomSeeder
php artisan db:seed --class=BolCarriereSeeder
php artisan db:seed --class=BolTailleSeeder
php artisan db:seed --class=BolCapaciteSeeder
php artisan db:seed --class=BolCreatureSeeder
php artisan db:seed --class=BolPnjSeeder

