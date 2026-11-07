<?php

// Données de référence de Cyberpunk RED : table cpr_materiel_net. Seule source de ces lignes (voir CprReferenceCatalogue) ;
// l'id est fixe et ne se réutilise jamais. Après une modification : php artisan cpr:reference.

return [
    ['id' => 1, 'code' => 'barriere_anti_krash', 'nom' => 'Barrière anti-KRASH', 'emplacements' => 2, 'prix' => 100, 'effet' => 'Immunise contre les effets qui forcent la déconnexion.', 'ordre' => 1],
    ['id' => 2, 'code' => 'cablage_isole', 'nom' => 'Câblage isolé', 'emplacements' => 1, 'prix' => 100, 'effet' => 'La console ne prend pas feu et n’enflamme pas les vêtements.', 'ordre' => 2],
    ['id' => 3, 'code' => 'circuits_renforces', 'nom' => 'Circuits renforcés', 'emplacements' => 1, 'prix' => 100, 'effet' => 'Insensible aux IEM et aux effets de programmes non-GLACE qui la désactivent.', 'ordre' => 3],
    ['id' => 4, 'code' => 'disque_dur_de_sauvegarde', 'nom' => 'Disque dur de sauvegarde', 'emplacements' => 2, 'prix' => 100, 'effet' => 'Sauve les programmes non-GLACE détruits ; une action réelle pour les réinstaller, dans leur état sauvegardé.', 'ordre' => 4],
    ['id' => 5, 'code' => 'extension_de_portee', 'nom' => 'Extension de portée', 'emplacements' => 1, 'prix' => 100, 'effet' => 'Connexion à 8 m d’un point d’accès.', 'ordre' => 5],
    ['id' => 6, 'code' => 'verrou_biometrique', 'nom' => 'Verrou biométrique', 'emplacements' => 2, 'prix' => 100, 'effet' => 'Console verrouillée ; Sécurité électronique SD 17 pour la forcer.', 'ordre' => 6],
];
