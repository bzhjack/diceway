# Économie : acheter, vendre, vivre, gagner sa vie

Pages source : p. 333-386 (« La nouvelle économie de la Rue »). Texte : `doc/cyberpunk/pdf-text/16-economie-de-la-rue-p333-386.txt`.

Le catalogue du Marché de nuit (p. 340-376 : armes, munitions, accessoires, armures, équipement, vêtements, cyberimplants, services) relève de `resources/` (à faire). Ce qui suit, ce sont les règles.

## Catégories de prix

Tout objet appartient à une des huit catégories.

| Catégorie | Prix du marché |
| --- | --- |
| Bon marché | 10 ED |
| Ordinaire | 20 ED |
| Coûteux | 50 ED |
| Très coûteux | 100 ED |
| Onéreux | 500 ED |
| Très onéreux | 1 000 ED |
| Luxueux | 5 000 ED |
| Super luxueux | 10 000 ED ou plus |

- **Sans Fixer et hors Marché de nuit, seuls les objets Coûteux ou moins chers sont disponibles.** Au-delà, il faut un Fixer (selon sa Gamme) ou un Marché de nuit (`03-capacites-de-role.md`).
- Seul un Fixer marchande (bonnes affaires d'Intermédiaire). Les autres paient le prix du marché.
- La catégorie de prix sert aussi aux SD et aux temps de réparation et de fabrication (`02-competences-et-resolution.md`, `03-capacites-de-role.md`).
- L'eurodollar (ED, « EDdie ») est la monnaie de référence.

## Marchés de nuit

Marchés éphémères (véhicules, caravanes, conteneurs) qui apparaissent quand une cargaison arrive ; on les trouve par ses contacts ou par un Fixer (un Fixer de rang 5+ peut en organiser un par mois, `03-capacites-de-role.md`).

**Générateur** : lancer deux fois `1d6` (relancer un doublon) pour les types de produits, puis `1d10` par type pour le nombre d'articles, tirés au `d100` dans la liste du type (relancer les doublons ; un objet à plusieurs qualités est présent dans toutes).

| 1d6 | Produits | Remarque |
| --- | --- | --- |
| 1 | Nourriture et drogues | plats, produits frais, animaux, parfois drogues de rue |
| 2 | Électronique personnelle | gadgets ; parfois un GLACE Noir sur les étals louches |
| 3 | Armes et protections | |
| 4 | Cybermatériel | la pièce mère nécessaire est aussi disponible ; pose gratuite chez le charcudoc du vendeur |
| 5 | Vêtements et cyberfashion | la cyberfashion se pose sur place |
| 6 | Équipement de survie | |

## Qualité des armes

| Qualité | Effet |
| --- | --- |
| Mauvaise | Sur un **échec critique** (1 au jet d'attaque), l'arme s'enraye : une action (sans jet) pour la remettre en état. |
| Ordinaire | — |
| Excellente | **+1 au jet d'attaque.** |

Les armes exotiques sont de qualité ordinaire sauf mention.

| Prix en qualité ordinaire | Mauvaise qualité | Excellente qualité |
| --- | --- | --- |
| 50 (Coûteux) | 20 (Ordinaire) | 100 (Très coûteux) |
| 100 (Très coûteux) | 50 (Coûteux) | 500 (Onéreux) |
| 500 (Onéreux) | 100 (Très coûteux) | 1 000 (Très onéreux) |

**Accessoires** : 3 emplacements par arme à distance non exotique ; le même accessoire deux fois n'a pas d'effet ; un seul chargeur (extension ou cylindre). Exemples : **liaison smartgun** (500, 2 emplacements, +1 aux attaques à distance si on est relié par ports d'interface ou poignée subdermique, ce qui demande un câblage neural), lance-grenades sous canon (500, 2 emplacements, 1 grenade), double canon à pompe (500, 2 emplacements, 2 cartouches), baïonnette (100, arme de mêlée légère), lunettes. Liste et effets complets : p. 342-344.

## Niveau de vie et logement

On fixe au début de chaque mois son **Niveau de vie** et son **Logement**. Vivre au-dessus du niveau choisi : le MJ fait payer l'excédent.

**Niveau de vie impayé** : une semaine de délai, puis **un jet de sauvegarde contre la mort par jour**.

| Niveau de vie | Ce qu'il représente | Par mois |
| --- | --- | --- |
| Croquette | nourriture infâme ; un film ou une danse sensorielle par mois | 100 |
| Prépack standard | meilleur goût ; un bar ou un bon restaurant chaque week-end | 300 |
| Prépack de qualité | qualité restaurant ; bars réputés ; un concert ou un match par mois | 600 |
| Aliments frais | vraie nourriture ; un hôtel sans compter et un grand restaurant par mois | 1 500 |

| Logement | Loyer mensuel | Prix d'achat |
| --- | --- | --- |
| Vivre dans la rue | — | — |
| Vivre dans son véhicule | — | — |
| Hôtel cube | 500 | — |
| Conteneur | 1 000 | 15 000 |
| Studio | 1 500 | 25 000 |
| Appartement T2 | 2 500 | 35 000 |
| Conapt corporatiste | offert par la corpo | — |
| Conapt haut de gamme | 7 500 | 85 000 |
| Suite luxueuse | 15 000 | 150 000 |
| Maison de Petite couronne corporatiste | offerte par la corpo | 200 000 |
| Manoir préfabriqué de Petite couronne | offert par la corpo | 500 000 |

Au départ : conteneur + croquettes, soit 1 100 ED par mois (premier mois gratuit) ; Corporatiste : conapt gratuit + prépack de qualité 600 ED (`01-creation-personnage.md`).

### Sommeil

- Moins de 6 heures de sommeil : **−2 à tous les jets** jusqu'à une nuit complète (6 heures d'affilée).
- Nuit inconfortable : réveil **fatigué**, −2 à tous les jets tant qu'on est épuisé. C'est le cas :
  - entassés (plus de `1 + nombre de chambres` dormeurs ; inconscients en cryostase et cadavres non comptés ; à deux dans un hôtel cube) ;
  - dans la rue, sauf **Endurance SD 15** ;
  - dans la nature, sauf **Survie en milieu hostile SD 15** (quelqu'un d'autre peut faire le jet pour vous).
- Dans son véhicule : il doit être hermétique ; confortable avec un matelas, sinon Endurance SD 15. Interdit en zones Corporatiste, Exécutive et Modérée.
- Particularités (p. 378-380) : hôtel cube dans les zones Corporatiste, Modérée et de combat, sanitaires communs ; conteneur en banlieue, au Périmètre ou en zone de combat ; studio et T2 avec parking couvert ; conapt corporatiste sous surveillance (50 ED d'amende si on abîme les micros) ; les maisons de Petite couronne donnent des badges d'accès à la zone exécutive.

## Gagner sa vie

Trois sources : les **Contrats** (missions en équipe, la principale), les **petits boulots**, l'**achat et la revente**.

| Contrat | Exemple | Paie par personne |
| --- | --- | --- |
| Facile | protéger un VIP d'une éventuelle menace | 500 ED |
| Habituel | résistance prévisible : voler un diamant gardé | 1 000 ED |
| Dangereux | adversaires nombreux et armés : faire sauter l'armurerie d'une caserne | 2 000 ED |

Le Fixer peut augmenter la paie (+20 % au rang 5-6, × 2 sur un Contrat dangereux au rang 10).

**Petits boulots** : pendant une semaine libre, `1d6` dans la table de son rôle ; le gain dépend du rang de capacité de rôle. Les tables (p. 381-385) donnent, selon le résultat, l'une de ces trois échelles (ou un résultat nul).

| Échelle | Rang 1-4 | Rang 5-7 | Rang 8-10 |
| --- | --- | --- | --- |
| Semaine blanche | 0 | 100 | 300 |
| Petit gain | 100 | 200 | 500 |
| Gain moyen | 200 | 300 | 600 |
| Gros gain | 300 | 500 | 800 |

Exemple (Solo) : 1 garde du corps pour un client lambda (petit gain) ; 2 client aisé (moyen) ; 3 assassinat ou extraction délicate (moyen) ; 4 vigile pour un Fixer, une corpo ou un gang (petit) ; 5 profil bas (semaine blanche) ; 6 tueur à gages pour une corpo locale (petit). Les tables des dix rôles relèvent de `resources/`.

Une seule ligne sort de ces échelles : Nomade, 5 (client conduit sans heurt), 100 / 200 / 300.
