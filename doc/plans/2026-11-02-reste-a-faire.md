# Reste à faire

Date : 2026-11-02. Ce fichier regroupe tout ce qui reste ouvert. Ce qui est fait (revue de code du 2026-10-31 et ses six phases, audits des calculs du combat, horde, vilénie, accueil) est dans l'historique git, notamment dans `2026-10-14-combat-reste-a-faire.md` et `2026-10-31-revue-de-code.md`, supprimés ce jour. Le comportement actuel du combat est décrit dans `2026-10-13-combat-etat-des-lieux.md`.

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## 1. Mise en production

À faire sur le serveur, dans cet ordre, une fois le code déployé :

1. `docker cp backend/routes/api.php …` (le conteneur ne monte que `app/` et `database/`), puis `php artisan migrate` : il ajoute `bol_fight_session.scenario_id` (accueil), corrige les données du catalogue relevées par l'audit du livre (`2026_11_02_120000_fix_reference_data_from_rulebook_audit.php`) ajoute les listes de la Côte de Feu et des Plaines de Klaar (`2026_11_02_130000_add_cote_de_feu_and_klaar_regional_lists.php`) précise le terrain des avantages de terrain (`2026_11_02_140000_terrain_advantages_name_their_terrain.php`) et passe trois PNJ du catalogue aux armes régionales (`2026_11_02_150000_npcs_take_mythic_plus_regional_weapons.php`).
2. Portraits : `docker exec -u www-data diceway php artisan bol:extract-portraits` (voir `CLAUDE.md`, section Portraits).
3. **Après** la mise en production des portraits : supprimer la table `bol_portrait_backup` et les options `--restore` / `--forget-originals` de `bol:extract-portraits` (S).

## 2. Combat : les règles du livre pas encore gérées

Sources des règles : `doc/rules/02-actions-combat.md`, `04-pnj-creatures-demons.md`, `05-alchimie-foi-sorcellerie.md` (vérifiables dans `doc/pdf-text/`).

### Synthèse

| # | Sujet | État | Effort | Lot |
| --- | --- | --- | --- | --- |
| 12 | Avantages et pouvoirs des créatures et démons | En partie : dés d'attaque et attaques multiples faits | L | 3 |
| 13 | Horde de piétaille | Reste piétaille contre piétaille | S | 3 |
| 14 | Points de vilenie des rivaux | Reste « Fuite opportune » | S | 3 |
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

#### 13. Horde de piétaille

- **Fait** : l'attaque en groupe contre un héros (`hordeMates`, `endTurn` dans `combat-turn.util.ts`).
- **Reste** : piétaille contre piétaille (le camp le plus nombreux tue d6M adversaires, qui lui infligent d3 pertes), sans jet d'attaque.

#### 14. Points de vilenie des rivaux

- **Fait** : le compteur de vilenie sur la carte d'un rival, ses dépenses à l'attaque, la parade in extremis et « Bouclier humain ».
- **Reste** : « Fuite opportune ».

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

### Question à trancher

1. **Sorcellerie** (point 15) : faut-il un catalogue de sorts, ou une saisie libre (cercle, difficulté, coût) au moment du jet ?

### Hors périmètre du combat

- **Guerre terrestre et navale** (`03-guerre.md`) : un autre système (valeur d'armée, jets de bataille, manœuvres navales), à traiter comme un module à part.
- **Déplacement sur quadrillage** : le livre le laisse facultatif et abstrait ; un jet d'agilité via le jet d'action suffit.
- **Fabrication alchimique** : hors combat ; l'usage d'une préparation en combat se traite comme un effet posé à la main.
- **Journal complet des événements et annulation d'un coup**.

## 3. Création et données : écarts avec le livre

Relevés par l'audit de `doc/` et des seeders contre le livre et Mythic+ (2026-11-02). Les erreurs de la doc et des seeders sont corrigées ; restent les points ci-dessous.

### Création de héros

| Règle du livre | État | Effort |
| --- | --- | --- |
| ✅ Plafond d'attribut : 3 pour les points répartis, +1 d'un avantage d'attribut par-dessus (Savant, Agilité de l'homme-oiseau, Vigueur céruléenne, Prestance) | Déjà géré par l'appli (`create.validators.ts`, `bol-heros-state.service.ts`), spec corrigée — vérifié le 2026-11-02 | — |
| ✅ Budgets et ressources modifiés par les traits : Non-combattant (2 en combat, 6 en carrières), Marqué par les dieux et Maudit (héroïsme), Dur à cuire et Chétif (vitalité), Pouvoir du Néant (pouvoir) | Déjà géré par l'appli, spec corrigée — vérifié le 2026-11-02 | — |
| ✅ Carrière exigée par Maître artisan et Envoûtant, arme favorite régionale (Mythic+) | Déjà géré par l'appli (`bol-rules.constants.ts`) — vérifié le 2026-11-02 | — |
| ✅ Pilote des airs réservé aux Satarlans (p. 21) | Avertissement à la création (`CARRIERES_RESERVEES`) — fait le 2026-11-02 | S |
| ✅ Carrières interdites aux céruléens : 4 en p. 21, 2 en p. 91 | On garde les 4 de la p. 21, déjà dans les données — tranché le 2026-11-02 | — |
| Non-combattant : aptitudes de combat au double du coût en XP (p. 45) | L'appli ne gère pas la dépense d'XP ; à reprendre si elle la gère un jour | — |

### Données de référence

- ✅ Listes d'avantages, de désavantages et de noms absentes pour la Côte de Feu (le livre renvoie à Halakh ou Kasht) et les Plaines de Klaar (chapitre 5) (S) — fait le 2026-11-02
  (migration `2026_11_02_130000_add_cote_de_feu_and_klaar_regional_lists` et seeders : Klaar 10 avantages, 6 désavantages, 50 noms ; Côte de Feu 13, 8, 80, union de Halakh et Kasht sans le kriss).
- Les listes des kalukans (Côte de Feu, chapitre 5) ne sont pas modélisées : l'appli ne gère pas les races.
- ✅ Les six avantages de terrain (Fils des plaines, Montagnard, Pisteur des marais, Renard du désert, Roi de la jungle, Tigre des neiges) ont le même texte, sans leur terrain (S) — fait le 2026-11-02
  (seeder et migration `2026_11_02_140000_terrain_advantages_name_their_terrain` : chacun nomme son terrain et exclut le combat, comme le livre).
- ✅ Passer les PNJ du livre aux armes régionales Mythic+ (Archer de Tyrus, Assassin halakhi, Garde jemadar) — fait le 2026-11-02
  (seeder et migration `2026_11_02_150000_npcs_take_mythic_plus_regional_weapons` : arc de guerre de Tyrus, kriss en plus de la dague des couteaux de lancer, khastok ; les copies déjà posées à une table ou dans un scénario gardent leurs armes).
- Copies faites avant la correction et gardées telles quelles : le Mythunga posé à une table (taille), la Main cavaleuse d'un scénario (capacité manquante).

### Doc

L'audit a aussi relevé des oublis (environ 70, surtout dans `02-actions-combat.md` et `03-guerre.md`) et des règles sans source (environ 25, souvent des choix de l'appli) qui n'ont pas été traités. Les plus utiles :

- Portée des armes : la colonne « portée » est la largeur de la bande Bout portant, chaque bande suivante en est un multiple (p. 62).
- Armure lourde interdite si vigueur < 0 (p. 52), et le casque n'ajoute +1 qu'avec une armure.
- Langues : les langues supplémentaires viennent du rang de 8 carrières (p. 46).
- Sorts de cercle 1 à 3 : au moins une condition d'incantation (p. 150).
- Guerre navale : succès légendaire, une action par phase, dégâts de feu à chaque round.
- Magie des Rois-Sorciers et Pouvoir du Néant imposent un désavantage supplémentaire.

Pour la liste complète, relancer l'audit (doc ↔ `doc/pdf-text/`).

## 4. Code

- **Dette suivie par le lint** (`eslint-suppressions.json`, `stylelint-suppressions.json`) : 285 couleurs hexadécimales hors de `_tokens.scss`, 14 `::ng-deep`, 6 clics sans clavier et 5 éléments cliquables sans focus, 3 `$any()`, 1 syntaxe interdite. `npm run lint:prune` baisse les comptes après correction (M).
- `region.component.html:7` : la carte de Lémurie est une `<img>` sans `NgOptimizedImage` (S).
- Hauteurs fixes mesurées à la main (`--tas-h`, `min-height` de `combattant-carte.scss`) : toute nouvelle option dans ces cartes peut demander de les remesurer.

## 5. Accueil

- Si l'accueil ne charge pas (par exemple `routes/api.php` non copié dans le conteneur), le bandeau « Reprendre la table » disparaît : ajouter un lien « Mes sessions » dans le message d'erreur (S).
