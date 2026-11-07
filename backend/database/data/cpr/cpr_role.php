<?php

// Données de référence de Cyberpunk RED : table cpr_role. Seule source de ces lignes (voir CprReferenceCatalogue) ;
// l'id est fixe et ne se réutilise jamais. Après une modification : php artisan cpr:reference.

return [
    ['id' => 1, 'code' => 'rockeur', 'nom' => 'Rockeur', 'capacite' => 'Charisme irrésistible', 'resume' => 'Musicien, artiste, agitateur : influence ses fans.', 'ordre' => 1],
    ['id' => 2, 'code' => 'solo', 'nom' => 'Solo', 'capacite' => 'Conscience tactique', 'resume' => 'Combattant professionnel, garde du corps, assassin.', 'ordre' => 2],
    ['id' => 3, 'code' => 'netrunner', 'nom' => 'Netrunner', 'capacite' => 'Interface', 'resume' => 'Pirate informatique du NET.', 'ordre' => 3],
    ['id' => 4, 'code' => 'techie', 'nom' => 'Techie', 'capacite' => 'Bricoleur', 'resume' => 'Répare, modifie, fabrique, invente.', 'ordre' => 4],
    ['id' => 5, 'code' => 'medtech', 'nom' => 'Medtech', 'capacite' => 'Médecine', 'resume' => 'Médecin de rue et charcudoc.', 'ordre' => 5],
    ['id' => 6, 'code' => 'media', 'nom' => 'Média', 'capacite' => 'Crédibilité', 'resume' => 'Journaliste qui expose la vérité.', 'ordre' => 6],
    ['id' => 7, 'code' => 'justicier', 'nom' => 'Justicier', 'capacite' => 'Renforts', 'resume' => 'Agent des forces de l\'ordre.', 'ordre' => 7],
    ['id' => 8, 'code' => 'corporatiste', 'nom' => 'Corporatiste', 'capacite' => 'Travail d\'équipe', 'resume' => 'Cadre d\'une corporation.', 'ordre' => 8],
    ['id' => 9, 'code' => 'fixer', 'nom' => 'Fixer', 'capacite' => 'Intermédiaire', 'resume' => 'Négociant, receleur, entremetteur.', 'ordre' => 9],
    ['id' => 10, 'code' => 'nomade', 'nom' => 'Nomade', 'capacite' => 'Moto', 'resume' => 'Membre d\'une famille nomade, pilote et mécanicien.', 'ordre' => 10],
];
