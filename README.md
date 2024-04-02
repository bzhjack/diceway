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

php artisan make:migration create_bol_regions_table
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

## Gestion de l'aplication angular dans le projet

https://medium.com/swlh/how-to-setup-laravel-with-angular-d3de171afa03

## Commandes mysql

GRANT ALL PRIVILEGES ON diceway.* TO 'diceway'@'localhost';
