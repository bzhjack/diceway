<?php

// Données de référence de Cyberpunk RED : table cpr_munition. Seule source de ces lignes (voir CprReferenceCatalogue) ;
// l'id est fixe et ne se réutilise jamais. Après une modification : php artisan cpr:reference.

return [
    ['id' => 1, 'code' => 'standard', 'nom' => 'Standard', 'prix' => 10, 'types' => ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'chevrotine', 'fleche'], 'effet' => 'Aucun effet particulier.', 'ordre' => 1],
    ['id' => 2, 'code' => 'biotoxine', 'nom' => 'Biotoxine', 'prix' => 500, 'types' => ['fleche', 'grenade'], 'effet' => 'Pas de dégâts : Résistance à la torture/aux drogues SD 15 ou 3d6 directs aux PS (armure non perforée).', 'ordre' => 2],
    ['id' => 3, 'code' => 'empoisonnee', 'nom' => 'Empoisonnée', 'prix' => 100, 'types' => ['fleche', 'grenade'], 'effet' => 'Pas de dégâts : Résistance à la torture/aux drogues SD 13 ou 2d6 directs aux PS (armure non perforée).', 'ordre' => 3],
    ['id' => 4, 'code' => 'caoutchouc', 'nom' => 'Caoutchouc', 'prix' => 10, 'types' => ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'fleche'], 'effet' => 'Ni blessure critique ni perforation ; une cible à plus de 1 PS ne descend pas sous 1 PS.', 'ordre' => 4],
    ['id' => 5, 'code' => 'etourdissante', 'nom' => 'Étourdissante', 'prix' => 100, 'types' => ['grenade'], 'effet' => 'Pas de dégâts : Résistance SD 15 ou œil endommagé et oreille endommagée (sans dégâts bonus).', 'ordre' => 5],
    ['id' => 6, 'code' => 'expansive', 'nom' => 'Expansive', 'prix' => 100, 'types' => ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'fleche'], 'effet' => 'Une « plaie avec corps étranger » fait tirer une seconde blessure critique d’un autre type (sans dégâts bonus).', 'ordre' => 6],
    ['id' => 7, 'code' => 'fumigene', 'nom' => 'Fumigène', 'prix' => 50, 'types' => ['grenade'], 'effet' => 'Pas de dégâts : fumée sur 10 × 10 m pendant 1 minute (−4 aux actions dedans).', 'ordre' => 7],
    ['id' => 8, 'code' => 'iem', 'nom' => 'IEM', 'prix' => 500, 'types' => ['grenade'], 'effet' => 'Pas de dégâts : Cybertech SD 15 ou deux appareils (au choix du MJ) hors service 1 minute.', 'ordre' => 8],
    ['id' => 9, 'code' => 'incendiaire', 'nom' => 'Incendiaire', 'prix' => 100, 'types' => ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'chevrotine', 'fleche', 'grenade'], 'effet' => 'Si les dégâts traversent l’armure : en feu, 2 directs aux PS à chaque fin de tour jusqu’à une action pour s’éteindre (non cumulable).', 'ordre' => 9],
    ['id' => 10, 'code' => 'intelligente', 'nom' => 'Intelligente', 'prix' => 500, 'types' => ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'fleche', 'roquette'], 'effet' => 'Demande une lunette de visée. Tir simple raté de 4 ou moins : second jet contre le même SD avec 1d10 + 10 (+ Chance). Esquivable.', 'ordre' => 10],
    ['id' => 11, 'code' => 'lacrymogene', 'nom' => 'Lacrymogène', 'prix' => 50, 'types' => ['grenade'], 'effet' => 'Pas de dégâts : Résistance SD 13 ou œil endommagé (sans dégâts bonus).', 'ordre' => 11],
    ['id' => 12, 'code' => 'perforante', 'nom' => 'Perforante', 'prix' => 100, 'types' => ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'fleche', 'grenade', 'roquette'], 'effet' => 'Perfore l’armure de 2 au lieu de 1. Standard pour les grenades et les roquettes.', 'ordre' => 12],
    ['id' => 13, 'code' => 'soporifique', 'nom' => 'Soporifique', 'prix' => 500, 'types' => ['fleche', 'grenade'], 'effet' => 'Pas de dégâts : Résistance SD 13 ou au sol et inconscient 1 minute (réveillé par des dégâts ou une action).', 'ordre' => 13],
];
