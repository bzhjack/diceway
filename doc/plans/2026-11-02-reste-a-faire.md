# Reste à faire

Date : 2026-11-02. Ce fichier ne garde que ce qui reste ouvert : ce qui est fait en est retiré et reste dans l'historique git (dont les anciens `2026-10-14-combat-reste-a-faire.md` et `2026-10-31-revue-de-code.md`). Le comportement actuel du combat est décrit dans `2026-10-13-combat-etat-des-lieux.md`.

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## En bref : ce qui reste ouvert

| Sujet | Section | Effort |
| --- | --- | --- |
| Mise en production : migrations du 2026-11-02, extraction des portraits, puis nettoyage de `bol_portrait_backup` | 1 | S |
| Combat : capacités des créatures et démons (régénération, intangible, poison, vulnérabilité, force vitale) | 2, lot 3 | L |
| Combat : sorcellerie et foi | 2, lot 4 | L |
| Combat : petites limites de l'assistant | 2, point 17 | S à M |
| Code : dette suivie par le lint (couleurs en dur, `::ng-deep`, clavier, `$any()`) | 4 | M |

Sans objet tant que l'appli ne les gère pas : la progression par XP (double coût de Non-combattant, désavantage des rangs de sorcier gagnés plus tard) et les races (listes des kalukans).

## 1. Mise en production

À faire sur le serveur, dans cet ordre, une fois le code déployé :

1. `docker cp backend/routes/api.php …` (le conteneur ne monte que `app/` et `database/`), puis `php artisan migrate`, qui passe dans l'ordre :
   - `2026_11_02_100000_add_scenario_id_to_bol_fight_session` : le scénario d'une table (accueil) ;
   - `2026_11_02_120000_fix_reference_data_from_rulebook_audit` : les erreurs du catalogue relevées par l'audit du livre ;
   - `2026_11_02_130000_add_cote_de_feu_and_klaar_regional_lists` : les listes de la Côte de Feu et des Plaines de Klaar ;
   - `2026_11_02_140000_terrain_advantages_name_their_terrain` : le terrain des six avantages de terrain ;
   - `2026_11_02_150000_npcs_take_mythic_plus_regional_weapons` : trois PNJ du catalogue aux armes régionales ;
   - `2026_11_02_160000_add_undead_sorcerer_king_to_catalogue` : le Roi-Sorcier mort-vivant.
   - `2026_11_02_170000_drop_unused_reference_and_scenario_cast_tables` : supprime 7 tables inutilisées (`bol_race`, `bol_heroic_option`, `bol_difficulte`, `bol_scenario_heros`, `bol_scenario_pnj`, `bol_scenario_creature`, `bol_scenario_demon`) ; son `down()` les recrée vides.

   La première ajoute une colonne aux tables de jeu et la remplit d'après leur scène en cours ; les cinq suivantes ne touchent que le catalogue (fiches sans compte) et n'ajoutent rien si on les relance ; la dernière supprime des tables dont l'appli ne se sert plus.
2. Portraits : `docker exec -u www-data diceway php artisan bol:extract-portraits` (voir `CLAUDE.md`, section Portraits).
3. **Après** la mise en production des portraits : supprimer la table `bol_portrait_backup` et les options `--restore` / `--forget-originals` de `bol:extract-portraits` (S).

## 2. Combat : les règles du livre pas encore gérées

Sources des règles : `doc/rules/02-actions-combat.md`, `04-pnj-creatures-demons.md`, `05-alchimie-foi-sorcellerie.md` (vérifiables dans `doc/pdf-text/`).

### Synthèse

| # | Sujet | État | Effort | Lot |
| --- | --- | --- | --- | --- |
| 12 | Avantages et pouvoirs des créatures et démons | En partie : dés d'attaque et attaques multiples faits | L | 3 |
| 15 | Sorcellerie en combat | Règle absente | L | 4 |
| 16 | Foi en combat | Règle absente | S | 4 |
| 17 | Petites limites de l'assistant | Confort | S à M | au fil de l'eau |

### Lot 3 : le bestiaire

#### 12. Avantages et pouvoirs des créatures et démons

- **Fait** : « Attaque féroce », « Attaque timide » et « Armes améliorées » donnent leur dé à chaque attaque (`attackDiceAbilities`, `combat-play.util.ts`) ; « Attaques dévastatrices » monte les dégâts d'une catégorie (`demonDegats`) ; « Autre attaque » enchaîne un nouveau jet pour qui frappe plusieurs fois par round (sans limite au nombre d'attaques du profil).
- **Reste** (règles dans `04-pnj-creatures-demons.md`) :

  | Capacité | Effet en combat | Proposition |
  | --- | --- | --- |
  | Régénération (démon) | +1 vitalité par round ; se débarrasse d'un coup précis au bout de 2 rounds | +1 au passage de round |
  | Intangible (démon) | Blessé seulement par sorcellerie ou alchimie | Rappel sur la carte de la cible |
  | Poison (démon) | Jet de vigueur Difficile (−2) pour éviter la paralysie | Rappel du jet, effet « paralysé » posé à la main |
  | Vulnérabilité (démon) | Double dégâts d'un élément | Rappel sur la carte, case « dégâts doublés » |
  | Morts-vivants | « Force vitale » au lieu de vitalité | Libellé « Force vitale » |

- Les pouvoirs à prévenir (`avertissement_combat` : Poison, Intangible) ne s'affichent pas encore sur la carte de l'attaquant ou de la cible.

### Lot 4 : la magie en combat

#### 15. Sorcellerie en combat

- **Règle** (`05-alchimie-foi-sorcellerie.md`) :
  - jet de sort : `2d6 + esprit + sorcier ± difficulté` ;
  - coût en points de pouvoir selon le cercle, plus 1 à 3 points selon l'armure portée ;
  - un sort du 1er cercle qui blesse inflige d6 par défaut ;
  - un sort qui influence l'esprit subit en plus l'esprit de la cible en malus.
- **Aujourd'hui** : pas de jet de sort ni de réserve de pouvoir suivie en combat.
- **Proposition** :
  - une action « Lancer un sort » dans l'assistant, à côté de l'attaque : cercle, difficulté, coût calculé avec le surcoût d'armure, réserve de pouvoir décomptée ;
  - pour un sort blessant, on enchaîne sur un jet de dégâts sans protection d'armure ni vigueur (à confirmer dans le livre).

#### 16. Foi en combat

- **Règle** : 1 point de foi donne un dé de bonus ou impose un dé de malus à un être visible, sans jet.
- **Aujourd'hui** : le dé du MJ permet de le simuler, sans décompter la foi.
- **Proposition** : pour un prêtre ou un druide, des puces « Dé de foi » qui posent le dé et décomptent un point de foi.
- **Prérequis** : vérifier que la réserve de foi est suivie sur la fiche du héros.

#### 17. Petites limites de l'assistant

- Carnage pris deux fois : si la première attaque rate, rappeler la seconde.
- Renversement et désarmement : vérifier la taille de la cible et l'arme tenue, au moins par un rappel.
- Effet libre (valeur et durée au choix) dans « + Effet ».
- Retirer une carte en cours de combat (l'événement `carte-retiree` existe déjà).
- Massacrer la piétaille : retirer les cartes depuis l'assistant.
- Script navigateur rejouable pour l'héroïsme en combat.
- « Perd sa prochaine action » (juste une égratignure) est un rappel : le tour n'est pas sauté d'office.
- Parade in extremis : le bouclier est choisi quand il y en a un ; le MJ retire l'effet si le joueur sacrifie plutôt son arme.
- Un héros qui a sombré, puis est soigné et retombe à 0 dans le même combat, n'a plus la question « Reprendre ses esprits ».
- Un héros stabilisé, soigné puis de nouveau mourant dans le même combat ne perd plus de vitalité.
- Un héros assommé (bagarre) garde la trace « assommé » jusqu'à la fin du combat, même relevé puis remis à 0 par une arme.
- Carrière en feinte : héros seulement, pas les PNJ rivaux.
- Secours : seuls les héros secourent ; pas de dé de bonus ou de malus sur le jet ; un soigneur soigne tous les blessés cochés, sans limite ni jet quotidien de doublement.

### Questions à trancher

1. **Sorcellerie** (point 15) : faut-il un catalogue de sorts, ou une saisie libre (cercle, difficulté, coût) au moment du jet ?
2. **Barre de commande en combat** : depuis le 2026-11-02, `/` y trouve aussi les cartes de la table (ajouté pour ouvrir la carte d'un rival à terre et lancer sa « Fuite opportune »). À garder, ou à limiter aux actions comme avant ?

### Hors périmètre du combat

- **Guerre terrestre et navale** (`03-guerre.md`) : un autre système (valeur d'armée, jets de bataille, manœuvres navales), à traiter comme un module à part.
- **Déplacement sur quadrillage** : le livre le laisse facultatif et abstrait ; un jet d'agilité via le jet d'action suffit.
- **Fabrication alchimique** : hors combat ; l'usage d'une préparation en combat se traite comme un effet posé à la main.
- **Journal complet des événements et annulation d'un coup**.

## 3. Données de référence

- Les listes des kalukans (Côte de Feu, chapitre 5) ne sont pas modélisées : l'appli ne gère pas les races.
- Copies faites avant les corrections du catalogue et gardées telles quelles : le Mythunga posé à une table (taille), la Main cavaleuse d'un scénario (capacité manquante).
- Non-combattant : aptitudes de combat au double du coût en XP (p. 45), sans objet tant que l'appli ne gère pas la dépense d'XP.

## 4. Code

- **Dette suivie par le lint** (`eslint-suppressions.json`, `stylelint-suppressions.json`) : 285 couleurs hexadécimales hors de `_tokens.scss`, 14 `::ng-deep`, 6 clics sans clavier et 5 éléments cliquables sans focus, 3 `$any()`. `npm run lint:prune` baisse les comptes après correction (M).
- Hauteurs fixes mesurées à la main (`--tas-h`, `min-height` de `combattant-carte.scss`) : toute nouvelle option dans ces cartes peut demander de les remesurer.
