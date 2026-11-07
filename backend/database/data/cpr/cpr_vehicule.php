<?php

// Données de référence de Cyberpunk RED : table cpr_vehicule. Seule source de ces lignes (voir CprReferenceCatalogue) ;
// l'id est fixe et ne se réutilise jamais. Après une modification : php artisan cpr:reference.

return [
    ['id' => 1, 'code' => 'moto_de_route', 'nom' => 'Moto de route', 'milieu' => 'terrestre', 'genre' => 'moto', 'pds' => 35, 'places' => 2, 'mouv' => 20, 'vitesse_kmh' => 161, 'prix' => 20000, 'pieces_minimum' => null, 'rang_nomade' => 1, 'ordre' => 1],
    ['id' => 2, 'code' => 'supermoto', 'nom' => 'Supermoto', 'milieu' => 'terrestre', 'genre' => 'moto', 'pds' => 35, 'places' => 2, 'mouv' => 60, 'vitesse_kmh' => 483, 'prix' => 100000, 'pieces_minimum' => null, 'rang_nomade' => 7, 'ordre' => 2],
    ['id' => 3, 'code' => 'voiture_compacte', 'nom' => 'Voiture terrestre compacte', 'milieu' => 'terrestre', 'genre' => 'voiture', 'pds' => 50, 'places' => 4, 'mouv' => 20, 'vitesse_kmh' => 161, 'prix' => 30000, 'pieces_minimum' => null, 'rang_nomade' => 1, 'ordre' => 3],
    ['id' => 4, 'code' => 'voiture_haute_performance', 'nom' => 'Voiture terrestre à haute performance', 'milieu' => 'terrestre', 'genre' => 'voiture', 'pds' => 50, 'places' => 4, 'mouv' => 40, 'vitesse_kmh' => 322, 'prix' => 50000, 'pieces_minimum' => null, 'rang_nomade' => 5, 'ordre' => 4],
    ['id' => 5, 'code' => 'supervoiture', 'nom' => 'Supervoiture terrestre', 'milieu' => 'terrestre', 'genre' => 'voiture', 'pds' => 50, 'places' => 2, 'mouv' => 60, 'vitesse_kmh' => 483, 'prix' => 100000, 'pieces_minimum' => null, 'rang_nomade' => 9, 'ordre' => 5],
    ['id' => 6, 'code' => 'jet_ski', 'nom' => 'Jet ski', 'milieu' => 'maritime', 'genre' => 'jet_ski', 'pds' => 35, 'places' => 2, 'mouv' => 20, 'vitesse_kmh' => 97, 'prix' => 20000, 'pieces_minimum' => null, 'rang_nomade' => 1, 'ordre' => 6],
    ['id' => 7, 'code' => 'hors_bord', 'nom' => 'Hors-bord', 'milieu' => 'maritime', 'genre' => 'bateau', 'pds' => 50, 'places' => 4, 'mouv' => 20, 'vitesse_kmh' => 97, 'prix' => 30000, 'pieces_minimum' => null, 'rang_nomade' => 5, 'ordre' => 7],
    ['id' => 8, 'code' => 'bateau_de_plaisance', 'nom' => 'Bateau de plaisance', 'milieu' => 'maritime', 'genre' => 'bateau_de_plaisance', 'pds' => 60, 'places' => 2, 'mouv' => 10, 'vitesse_kmh' => 24, 'prix' => 30000, 'pieces_minimum' => 2, 'rang_nomade' => 7, 'ordre' => 8],
    ['id' => 9, 'code' => 'yacht', 'nom' => 'Yacht', 'milieu' => 'maritime', 'genre' => 'yacht', 'pds' => 100, 'places' => 4, 'mouv' => 10, 'vitesse_kmh' => 24, 'prix' => 50000, 'pieces_minimum' => 4, 'rang_nomade' => 9, 'ordre' => 9],
    ['id' => 10, 'code' => 'gyrocoptere', 'nom' => 'Gyrocoptère', 'milieu' => 'aerien', 'genre' => 'gyrocoptere', 'pds' => 35, 'places' => 2, 'mouv' => 20, 'vitesse_kmh' => 161, 'prix' => 20000, 'pieces_minimum' => null, 'rang_nomade' => 1, 'ordre' => 10],
    ['id' => 11, 'code' => 'helicoptere', 'nom' => 'Hélicoptère', 'milieu' => 'aerien', 'genre' => 'helicoptere', 'pds' => 60, 'places' => 4, 'mouv' => 40, 'vitesse_kmh' => 322, 'prix' => 40000, 'pieces_minimum' => null, 'rang_nomade' => 5, 'ordre' => 11],
    ['id' => 12, 'code' => 'av_4', 'nom' => 'Aérodyne polyvalent AV-4', 'milieu' => 'aerien', 'genre' => 'aerodyne', 'pds' => 100, 'places' => 6, 'mouv' => 40, 'vitesse_kmh' => 322, 'prix' => 50000, 'pieces_minimum' => null, 'rang_nomade' => 7, 'ordre' => 12],
    ['id' => 13, 'code' => 'av_9', 'nom' => 'Superaérodyne AV-9', 'milieu' => 'aerien', 'genre' => 'aerodyne', 'pds' => 60, 'places' => 2, 'mouv' => 60, 'vitesse_kmh' => 483, 'prix' => 100000, 'pieces_minimum' => null, 'rang_nomade' => 9, 'ordre' => 13],
    ['id' => 14, 'code' => 'aerozep', 'nom' => 'Aérozep', 'milieu' => 'aerien', 'genre' => 'aerozep', 'pds' => 100, 'places' => 2, 'mouv' => 20, 'vitesse_kmh' => 161, 'prix' => 30000, 'pieces_minimum' => 2, 'rang_nomade' => 9, 'ordre' => 14],
];
