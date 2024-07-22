# DICEWAY

## Création du projet 

```
composer create-project laravel/laravel diceway
```

## Commandes

```
php artisan serve
php artisan migrate

// Gestion database

php artisan make:migration create_bol_region_table
php artisan make:model BolRegion
php artisan make:seeder BolRegionSeeder
php artisan db:seed --class=BolRegionSeeder

// suppression des tokens périmés
php artisan auth:clear-resets 

// Création d'un controller
php artisan make:controller Auth/VerifyController

// récupération du template email
php artisan vendor:publish --tag=laravel-notifications 

sudo apt remove '^php8.x.*$'
```

## Build pour MEP

npm run build:prod


## Gestion de l'aplication angular dans le projet

https://medium.com/swlh/how-to-setup-laravel-with-angular-d3de171afa03

## Commandes mysql
CREATE DATABASE diceway;
create user 'diceway'@'localhost' IDENTIFIED BY 'diceway';
GRANT ALL PRIVILEGES ON diceway.* TO 'diceway'@'localhost';
git branch -D -r origin/feature/xxx

export PATH="/opt/alt/alt-nodejs20/root/usr/bin/:$PATH"