<?php

// Données de référence de Cyberpunk RED : table cpr_accessoire. Seule source de ces lignes (voir CprReferenceCatalogue) ;
// l'id est fixe et ne se réutilise jamais. Après une modification : php artisan cpr:reference.

return [
    ['id' => 1, 'code' => 'baionnette', 'nom' => 'Baïonnette', 'prix' => 100, 'emplacements' => 1, 'compatibilite' => 'armes_d_epaule', 'dissimulable' => false, 'effet' => 'Sert d’arme de mêlée légère.', 'ordre' => 1],
    ['id' => 2, 'code' => 'chargeur_cylindre', 'nom' => 'Chargeur à cylindre', 'prix' => 500, 'emplacements' => 1, 'compatibilite' => 'distance_sauf_arcs', 'dissimulable' => false, 'effet' => 'Capacité « cylindre » du chargeur. Un seul chargeur par arme.', 'ordre' => 2],
    ['id' => 3, 'code' => 'double_canon_a_pompe', 'nom' => 'Double canon à pompe', 'prix' => 500, 'emplacements' => 2, 'compatibilite' => 'armes_d_epaule', 'dissimulable' => false, 'effet' => 'À deux mains, sert aussi de fusil à pompe (2 cartouches).', 'ordre' => 3],
    ['id' => 4, 'code' => 'extension_de_chargeur', 'nom' => 'Extension de chargeur', 'prix' => 100, 'emplacements' => 1, 'compatibilite' => 'distance_sauf_arcs', 'dissimulable' => false, 'effet' => 'Capacité « extension » du chargeur. Un seul chargeur par arme.', 'ordre' => 4],
    ['id' => 5, 'code' => 'lance_grenades_sous_canon', 'nom' => 'Lance-grenades sous canon', 'prix' => 500, 'emplacements' => 2, 'compatibilite' => 'armes_d_epaule', 'dissimulable' => false, 'effet' => 'À deux mains, sert aussi de lance-grenades (1 grenade).', 'ordre' => 5],
    ['id' => 6, 'code' => 'liaison_smartgun', 'nom' => 'Liaison smartgun', 'prix' => 500, 'emplacements' => 2, 'compatibilite' => 'distance', 'dissimulable' => true, 'effet' => '+1 aux attaques à distance si l’on est relié (ports d’interface neuronale ou poignée subdermique, câblage neural requis). Pose en 1 heure.', 'ordre' => 6],
    ['id' => 7, 'code' => 'lunette_de_precision', 'nom' => 'Lunette de précision', 'prix' => 100, 'emplacements' => 1, 'compatibilite' => 'distance', 'dissimulable' => true, 'effet' => 'Détails jusqu’à 800 m ; +1 au tir simple ou visé sur une cible à 51 m ou plus (non cumulable avec la téléoptique).', 'ordre' => 7],
    ['id' => 8, 'code' => 'lunette_infrarouge', 'nom' => 'Lunette infrarouge de vision nocturne', 'prix' => 500, 'emplacements' => 1, 'compatibilite' => 'distance', 'dissimulable' => true, 'effet' => 'Annule le malus de tir dû à l’obscurité, la fumée, le brouillard.', 'ordre' => 8],
];
