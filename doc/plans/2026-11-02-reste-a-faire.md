# Reste à faire

Date : 2026-11-02, mis à jour le 2026-11-03. Ce fichier ne garde que ce qui reste ouvert : ce qui est fait en est retiré et reste dans l'historique git (dont les anciens `2026-10-14-combat-reste-a-faire.md` et `2026-10-31-revue-de-code.md`). Le comportement actuel du combat est décrit dans `2026-10-13-combat-etat-des-lieux.md`.

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## En bref : ce qui reste ouvert

| Sujet | Section | Effort |
| --- | --- | --- |
| Mise en production : migrations du 2026-11-02 et du 2026-11-03, extraction des portraits, puis nettoyage de `bol_portrait_backup` | 1 | S |
| Combat : script navigateur rejouable pour l'héroïsme | 2 | S |
| Revue globale du 2026-11-03 : une vingtaine de mineurs à trier | 3 bis | M |
| Code : dette suivie par le lint (couleurs en dur, `::ng-deep`, clavier, `$any()`) | 4 | M |

Sans objet tant que l'appli ne les gère pas : la progression par XP (double coût de Non-combattant, désavantage des rangs de sorcier gagnés plus tard) et les races (listes des kalukans).

## 1. Mise en production

À faire sur le serveur, dans cet ordre (précautions relevées par la revue globale du 2026-11-03, `2026-11-03-revue-globale.md` § 3) :

0. **Avant tout** : sauvegarder la base, et vérifier que `bol_scenario_heros`, `bol_scenario_pnj`, `bol_scenario_creature` et `bol_scenario_demon` sont vides (`COUNT(*)`) — la migration `170000` les supprime et son `down()` les recrée vides. Puis `php artisan down` : entre le `git pull` et `migrate`, le code tourne déjà sur une base qui n'a pas ses nouvelles colonnes (erreurs 500), et les nouvelles routes manquent tant que `routes/api.php` n'est pas copié.
1. `docker cp backend/routes/api.php …` (le conteneur ne monte que `app/` et `database/`), puis `php artisan migrate`, qui passe dans l'ordre :
   - `2026_11_02_100000_add_scenario_id_to_bol_fight_session` : le scénario d'une table (accueil) ;
   - `2026_11_02_120000_fix_reference_data_from_rulebook_audit` : les erreurs du catalogue relevées par l'audit du livre ;
   - `2026_11_02_130000_add_cote_de_feu_and_klaar_regional_lists` : les listes de la Côte de Feu et des Plaines de Klaar ;
   - `2026_11_02_140000_terrain_advantages_name_their_terrain` : le terrain des six avantages de terrain ;
   - `2026_11_02_150000_npcs_take_mythic_plus_regional_weapons` : trois PNJ du catalogue aux armes régionales ;
   - `2026_11_02_160000_add_undead_sorcerer_king_to_catalogue` : le Roi-Sorcier mort-vivant ;
   - `2026_11_02_170000_drop_unused_reference_and_scenario_cast_tables` : supprime 7 tables inutilisées (`bol_race`, `bol_heroic_option`, `bol_difficulte`, `bol_scenario_heros`, `bol_scenario_pnj`, `bol_scenario_creature`, `bol_scenario_demon`) ; son `down()` les recrée vides ;
   - `2026_11_02_180000_add_mort_vivant_to_bol_creature` : la case « mort-vivant » des créatures, cochée pour les morts-vivants du catalogue ;
   - `2026_11_03_100000_add_foi_and_pouvoir_to_bol_fight_session_pnj` : la foi et le pouvoir des PNJ posés aux tables (dé de foi, sorts), remplis d'après leur fiche.

   La première ajoute une colonne aux tables de jeu et la remplit d'après leur scène en cours ; les cinq suivantes ne touchent que le catalogue (fiches sans compte) et n'ajoutent rien si on les relance ; la septième supprime des tables dont l'appli ne se sert plus, la huitième ajoute une colonne aux créatures, et la dernière deux colonnes aux PNJ des tables. Le `docker cp` de `routes/api.php` est nécessaire : l'accueil, la foi et le pouvoir, la clôture et la réouverture des tables, la Fuite opportune ont de nouvelles routes.
   Ensuite `php artisan cache:clear`, puis `php artisan up`. Les `down()` des migrations `120000` et `160000` défont aussi des lignes qui existaient avant elles : ne pas compter sur un retour en arrière pour ces deux-là.
2. Portraits : `docker exec -u www-data diceway php artisan bol:extract-portraits` (voir `CLAUDE.md`, section Portraits).
3. **Après** la mise en production des portraits : supprimer la table `bol_portrait_backup` et les options `--restore` / `--forget-originals` de `bol:extract-portraits` (S).

## 2. Combat

Toutes les règles de combat du livre sont gérées (le détail et les limites connues sont dans `2026-10-13-combat-etat-des-lieux.md`). Reste un outil :

- **Script rejouable de l'héroïsme** (S) : un script navigateur, comme `front/scripts/e2e-petit-bouclier.mjs`, qui rejoue l'héroïsme en combat.

### Question à trancher

- **Barre de commande en combat** : depuis le 2026-11-02, `/` y trouve aussi les cartes de la table (ajouté pour ouvrir la carte d'un rival à terre et lancer sa « Fuite opportune »). À garder, ou à limiter aux actions comme avant ?

### Hors périmètre du combat

- **Guerre terrestre et navale** (`03-guerre.md`) : un autre système (valeur d'armée, jets de bataille, manœuvres navales), à traiter comme un module à part.
- **Déplacement sur quadrillage** : le livre le laisse facultatif et abstrait ; un jet d'agilité via le jet d'action suffit.
- **Fabrication alchimique** : hors combat ; l'usage d'une préparation en combat se traite comme un effet posé à la main.
- **Journal complet des événements et annulation d'un coup**.

## 3. Données de référence

- Les listes des kalukans (Côte de Feu, chapitre 5) ne sont pas modélisées : l'appli ne gère pas les races.
- Copie faite avant les corrections du catalogue et gardée telle quelle : le Mythunga posé à une table garde sa taille fausse (Colossale au lieu d'Énorme) ; le MJ peut la corriger sur la carte ou le reposer depuis le catalogue.
- Non-combattant : aptitudes de combat au double du coût en XP (p. 45), sans objet tant que l'appli ne gère pas la dépense d'XP.

## 3 bis. Revue globale du 2026-11-03

Une vingtaine de mineurs restent ouverts, listés dans `2026-11-03-revue-globale.md` § 5 (à trier quand on y reviendra).

## 4. Code

- **Dette suivie par le lint** (`eslint-suppressions.json`, `stylelint-suppressions.json`) : 285 couleurs hexadécimales hors de `_tokens.scss`, 14 `::ng-deep`, 6 clics sans clavier et 5 éléments cliquables sans focus, 3 `$any()`. `npm run lint:prune` baisse les comptes après correction (M).
- Hauteurs fixes mesurées à la main (`--tas-h`, `min-height` de `combattant-carte.scss`) : toute nouvelle option dans ces cartes peut demander de les remesurer.
