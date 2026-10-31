# Revue de code et plan d'action

Date : 2026-10-31. Périmètre : `front/src/app`, `front/src/styles`, `front/src/assets`, `backend/app`, `backend/routes`.

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## 1. Le bilan en bref

Le code est sain sur le fond. Les conventions Angular sont presque toutes respectées et la duplication exacte reste faible. Les vrais sujets sont ailleurs.

| Sujet | État | Ce qu'il faut retenir |
|---|---|---|
| Sécurité (hors demande) | **À traiter d'abord** | N'importe quel compte connecté peut supprimer le héros ou la créature d'un autre, y compris le catalogue public |
| Cache (hors demande) | **Bug** | Le cache des créatures et des démons mélange les créations de tous les comptes |
| Performance | **Gain facile** | 92 % du poids d'une session vient des portraits, et chaque enregistrement la transfère deux fois |
| Mutualisation | À faire par étapes | Formulaires et bibliothèques d'abord, puis les briques du combat |
| Duplication | Faible et concentrée | 3,76 % côté front, 1,49 % côté back, surtout entre héros et PNJ |
| Conventions | Bonnes | 10 règles à 100 %, quelques écarts ciblés, et rien ne les vérifie automatiquement |
| Règles du jeu | Bonnes sur l'échantillon | 8 règles vérifiées, aucun écart ; les manques connus sont dans le plan du reste à faire |

**Ce qui marche déjà bien :** OnPush sur les 122 composants, application sans zone.js, routes chargées à la demande, dés 3D (2,6 Mo) chargés seulement via `import()`, aucun `any`, plus aucune trace de PrimeNG dans les gabarits.

## 2. Sécurité et cache : à traiter en premier

Ces deux points sortent de la demande, mais ils passent avant le reste. Ils viennent de la lecture du code : je n'ai pas tenté d'attaque sur un serveur.

### 2.1 Pas de contrôle de propriété sur plusieurs routes

Il n'y a aucune policy (`app/Policies` n'existe pas). Chaque méthode doit donc filtrer sur `Auth::id()`, et plusieurs ne le font pas.

| Route | Code | Risque |
|---|---|---|
| `DELETE /bol/heros/delete/{id}` | `BolHerosController.php:136` | Supprimer le héros d'un autre |
| `POST /bol/heros/origines/update/{herosId}` | `BolHerosController.php:150` | Modifier le héros d'un autre |
| `DELETE /bol/pnj/delete/{id}` | `BolPnjController.php:180` | Supprimer le PNJ d'un autre |
| `DELETE /bol/creature/delete/{id}` | `BolCreatureController.php:131` | Ids entiers faciles à deviner, **catalogue public compris** |
| `DELETE /bol/demon/delete/{id}` | `BolDemonController.php:129` | Idem |
| Traits, carrières, langues d'un héros | `BolTraitController.php:44`, `BolCarriereController.php:43`, `BolLangueController.php:36` | Modifier la fiche d'un autre |
| `GET /bol/heros/{id}` | `BolHerosController.php:44` | Lire la fiche d'un autre |
| `GET /bol/fight-session/{id}` | `BolFightSessionController.php:23` | Lire une session d'un autre |
| `GET` d'un scénario | `BolScenarioController.php:27` | Lire un scénario d'un autre, contenu de supplément du commerce compris |

**Correction :** une policy par entité (`view`, `update`, `delete`), appelée dans chaque méthode, avec un refus explicite sur le catalogue (`user_id` nul). Un test par route : le compte B reçoit 403 ou 404 sur les données du compte A. `tests/Feature` est vide aujourd'hui.

Les autres routes de `create` et de modification d'équipement par `{herosId}` restent à relire lors de ce chantier. Le relevé automatique les signale, je ne les ai pas toutes lues.

### 2.2 Cache partagé entre les comptes

`BolCreatureController.php:30` et `BolDemonController.php:28` mettent en cache, sous une clé commune (`bol_creatures`, `bol_demons`), une requête filtrée sur `Auth::id()`.

- **Effet :** le premier compte qui charge la liste remplit le cache avec ses créations. Les autres comptes voient alors ces créations et pas les leurs, jusqu'à l'expiration.
- **Correction :** une clé par compte, comme `BolArmeController.php:20`, ou bien un cache du seul catalogue, avec les créations du compte lues à part.

**Durée mal comprise :** `60 * 24` est commenté « 60 minutes » dans plusieurs contrôleurs. Laravel compte en secondes, donc cela fait 24 minutes. Il faut une constante unique et une durée voulue.

## 3. Composants à mutualiser

Classés par gain. Les chiffres viennent de `jscpd` et de recherches dans le code.

### 3.1 Le socle des pages

| # | Mutualisation | Aujourd'hui | Effort |
|---|---|---|---|
| M1 | **La forge devient le style par défaut.** Les 14 pages `dw-page` portent `dw-forge-page` : le scope ne sert plus à rien | `styles/_forge-page.scss` surcharge les composants à coups de spécificité et de jetons `--dw-surface-*` redéfinis, par-dessus des styles morts (`entity-card--dark`, palettes d'accent, `--dw-lh-color-*`) | M |
| M2 | **Mixins SCSS de la forge** : `forge-plate`, `forge-recess`, `forge-stud` | `--dw-forge-recess` écrit 40 fois, `--dw-forge-stud` 28 fois, l'effet de survol du clou 16 fois | S |
| M3 | **`dw-form-header`** : icône, titre, actions, puce « non enregistré » | Répété dans 5 pages avec un préfixe différent (`pfp`, `hfp`, `cfp`, `dfp`, `hap`) : 16 `section-eyebrow`, 16 `title`, 15 `icon`, 5 `dirty-dot`, 5 `error-box` | S |
| M4 | **`dw-avatar-picker`** | 4 copies (2 rails, créature, démon). Sur les 4, c'est un `div` cliquable, inaccessible au clavier : corriger une fois suffirait | S |
| M5 | **`dw-field-message`** (erreur, avertissement) | `.dw-field-error` et `.dw-field-warning` recopiés dans 6 feuilles | S |

### 3.2 Les fiches et les bibliothèques

| # | Mutualisation | Aujourd'hui | Effort |
|---|---|---|---|
| M6 | **Un seul `bol-summary-rail`** pour héros et PNJ | 169 lignes de SCSS et 57 de HTML identiques | S |
| M7 | **`BolCharacterFormPageBase`** au-dessus de `BolEntityFormPageBase` | 213 lignes de TS et 81 de HTML communes à `hero-form-page` et `pnj-form-page` | M |
| M8 | **`bol-list-panel`** : titre, compteur, menu d'ajout, liste | Bloc répété pour carrières, armes, armures, capacités et pouvoirs, dans 5 pages | S |
| M9 | **Un seul composant « général »** pour créature et démon | Ils ne diffèrent que par 3 champs et un préfixe CSS | S |
| M10 | **`dw-library-grid`** et une classe de base des bibliothèques | Grille et zone de défilement recopiées dans 4 feuilles ; 19 à 24 lignes communes par paire de pages | M |
| M11 | **Page de catalogue d'équipement** pour armes et armures | 30 lignes de HTML, 32 de SCSS, 25 de TS communes ; le tableau existe en deux versions | M |
| M12 | **`dw-library-toolbar`** avec filtre optionnel | La page des sessions a sa propre barre (`.cl-toolbar`) | S |

### 3.3 Les briques du combat

Les trois écrans de jet (réaction, jet d'action, attaque) réécrivent les mêmes pièces.

| # | Mutualisation | Aujourd'hui | Effort |
|---|---|---|---|
| M13 | **`dw-roll-sum`** : l'addition d'un jet | `.tas-sum-term`, `.scd-sum-term`, `.ard-sum-term` ; `TraySumTerm` étend `RollSumTerm` | M |
| M14 | **`dw-roll-entry`** : case du total, dé, faces | `.tas-total`, `.scd-total`, `.ard-*`, `.rsc-total`, et les boutons de dé associés | M |
| M15 | **`dw-verdict`** : titre, détail, options | `.tas-verdict`, `.scd-verdict`, `.ard-verdict`, `.rsc-verdict` | M |
| M16 | **Un seul compteur de points** : gemmes et boutons | 7 implémentations de gemmes (`pst`, `cmp`, `hrs`, `scd`, `ard`, `tas`, `bs`) ; `points-stepper` existe déjà et peut servir de base | S |
| M17 | **`dwPopover`** : position, fond, piège du focus | `popoverPositions` copié (`turn-assistant.ts:650`, `start-combat-page.ts:682`) ; `.cp-pop`, `.scd-pop`, `.tas-options--pop` | S |
| M18 | **Directive de glisser** vers la scène | `onDragStarted`, `onDragMoved`, `onDragEnded` dans `troupe`, `compagnie` et `reserve` | S |
| M19 | **`usableAvatar()`** | Le test `avatar !== EMPTY_AVATAR` est écrit dans 6 fichiers ; `EMPTY_AVATAR` est redéclaré dans `avatar-fallback.directive.ts:3` | S |
| M20 | **Un seul constructeur de cartes** | `combat-play.util.ts` et `tapis.util.ts` calculent les mêmes portraits de la même façon pour les 4 types | S |

### 3.4 Les composants trop gros

| Fichier | Taille | Découpage proposé | Effort |
|---|---|---|---|
| `turn-assistant.ts` | 2 186 lignes, 141 signaux, 15 sorties, **aucun test** | Un store du tour, puis 4 composants : ligne de l'attaquant, carte de la cible, attaque, dégâts. Le gabarit a déjà ces 4 blocs | L |
| `session-play-page.ts` | 1 556 lignes, 38 `subscribe`, **aucun test** | Un service par domaine : état du combat, passage de tour, table | L |
| `hero-advanced-page.ts` | 1 365 lignes, **aucun test** | Après M7, ne garder que les validations propres à la création | M |
| `start-combat-page` | 918 lignes de TS, 1 380 de SCSS, 598 de HTML | Une ligne de héros en composant ; sa feuille dépasse le budget (20,19 ko pour 16) | M |

**À faire avant ce découpage :** écrire les tests de ces écrans. Aujourd'hui, seuls mes scripts de vérification temporaires les ont couverts.

## 4. Duplication de code

Mesure `jscpd` sur les copies exactes d'au moins 8 lignes et 60 jetons, hors tests.

| Périmètre | Lignes | Copies | Lignes dupliquées | Taux |
|---|---|---|---|---|
| Front, TypeScript | 21 640 | 37 | 568 | 2,62 % |
| Front, SCSS | 10 350 | 22 | 469 | 4,53 % |
| Front, HTML | 7 180 | 33 | 436 | 6,07 % |
| **Front, total** | **39 172** | **92** | **1 473** | **3,76 %** |
| Back, PHP | 7 407 | 8 | 110 | 1,49 % |

**Lecture :** ces taux sont bas, mais ils sous-estiment le problème. `jscpd` ne voit pas les copies renommées, comme `.cfp-avatar` et `.dfp-avatar` ou les 7 implémentations de gemmes.

Les plus grosses paires, en lignes communes :

| Lignes | Fichiers | Traité par |
|---|---|---|
| 213 | `hero-form-page.ts` / `pnj-form-page.ts` | M7 |
| 169 | `summary-rail.scss` héros / PNJ | M6 |
| 81 | `hero-form-page.html` / `pnj-form-page.html` | M7, M8 |
| 57 | `summary-rail.html` héros / PNJ | M6 |
| 47 | avatars créature et démon / rail PNJ | M4 |
| 38 + 22 + 21 | pages `register`, `reset`, `forgotten`, `resend` | Un formulaire d'authentification commun (S) |
| 35 | `hero-card.ts` / `pnj-card.ts` | Fonction commune pour jauges et puces (S) |
| 32 + 30 + 25 | bibliothèques armes / armures | M11 |
| 30 | `bol-fight-session.model.ts` / `bol-scenario.model.ts` | Types de personnages communs (S) |
| 26 | `after-combat-dialog.scss` / `rescue-dialog.scss` | Styles de dialogue communs (S) |
| 24 | `BolFightSessionCreature.php` / `BolScenarioCreature.php` | Un trait PHP (S) |
| 20 | `BolFightSessionService.php` / `BolScenarioController.php` | Déplacer vers un service (S) |
| 14 | `BolHerosController.php` / `BolPnjController.php` | Service commun (S) |

## 5. Performance

### 5.1 Réseau : les portraits dans le JSON

C'est le gain le plus net. Les portraits sont stockés en base64 dans la base (`longText`) et voyagent dans chaque réponse.

| Constat | Mesure | Code |
|---|---|---|
| Poids d'une session réelle à 4 héros, dont 2 avec portrait | 303 ko, dont 281 ko de portraits (92 %) | `origines.avatar` |
| Chaque enregistrement de l'état du combat transfère la session **deux fois** : la réponse du PATCH, puis un GET qui la redemande | Environ 600 ko par action | `session-play-page.ts`, `etatSaver` ; `BolFightSessionService.php:202` |
| Chaque réglage de vie ou d'héroïsme dans le bas de la table recharge la session | Environ 300 ko par clic | `compagnie.ts` (`changed`), `reloadSession` |
| L'accueil `/` charge toutes les sessions de l'utilisateur, avec relations et portraits, pour en choisir une | Variable, croît avec le nombre de sessions | `home-redirect.guard.ts:21` |
| La bibliothèque des sessions charge tout, alors qu'elle n'affiche qu'un titre et des compteurs | Idem | `getSessionsWithRelations` |

**Corrections, de la plus simple à la plus complète :**

1. Utiliser la réponse du PATCH au lieu de refaire un GET : la moitié du trafic en moins sur ces actions (S).
2. Une route légère pour l'accueil et la liste : `withCount` et colonnes choisies (S).
3. Sortir les portraits du JSON : fichiers servis avec un cache navigateur et une simple URL dans l'API, avec une migration des données existantes (L). Ce point rend les deux premiers bien moins critiques, mais il touche aussi les cartes, les fiches et l'import.

### 5.2 Images et polices

| Constat | Mesure | Correction | Effort |
|---|---|---|---|
| 9 en-têtes en PNG | 8,5 Mo → 0,9 Mo en WebP (conversion réelle, qualité 80) | Convertir | S |
| 20 cartes `cartes/carte-<n>.jpg` sans référence trouvée dans le front ni les seeders | 13 Mo | Vérifier en base, puis supprimer | S |
| Aucune image en `loading="lazy"` | 0 sur 28 `<img>` | L'ajouter aux grilles des bibliothèques | S |
| Police Inter importée en `@import` bloquant, sans usage | `styles/_fonts.scss:1` | Supprimer | S |
| Police Roboto chargée, seulement en secours | `index.html:11` | Supprimer | S |
| Material Icons chargée depuis Google | `index.html:12` | L'héberger, ou finir le passage aux `gi-*` | M |

### 5.3 Paquets JavaScript

| Paquet | Taille brute | Remarque |
|---|---|---|
| Initial | 622 ko (150 ko transférés) | Sous le budget de 800 ko. Contient `@angular/forms` (103 ko), `form-field` (70 ko), `angular-oauth2-oidc` (57 ko) |
| `session-play-page` | 523 ko (105 ko transférés) | Contient le combat et le théâtre. **Aucun `@defer` dans l'application** |
| Dés 3D | 2,6 Mo environ | Déjà à la demande : rien à faire |

**Pistes :** `@defer` sur `combat-board` et sur le théâtre, pour ne charger que le mode affiché (M). Charger `angular-oauth2-oidc` seulement à la connexion Google (S).

### 5.4 Points mineurs

- 19 `track $index`, à remplacer quand la liste peut changer d'ordre.
- `.subscribe()` : 38 dans `session-play-page.ts`. Ce sont surtout des appels HTTP qui se terminent seuls : c'est un sujet de lisibilité plus que de fuite mémoire.

## 6. Alignement avec les règles

### 6.1 Conventions de `CLAUDE.md`

**Respectées à 100 %, à garder :** OnPush (122/122), `input()`/`output()`, pas de `@HostBinding`/`@HostListener`, pas de `ngClass`/`ngStyle`, pas de `*ngIf`/`*ngFor`, pas de `.mutate()`, pas de `any`, pas de `appearance="outline"` répété, pas de PrimeNG, pas de `cursor: help`.

| Écart | Nombre | Où | Effort |
|---|---|---|---|
| Classe maison et utilitaires Tailwind sur un même élément | 54 dans 14 fichiers | Surtout `region.component.html` (20), `intendance-page.html` (8) | M |
| Types exportés hors d'un dossier `models/` | 10 | `core/auth/auth.models.ts` (8), `combat-resolution.util.ts:9`, `combat-effects.util.ts:65` | S |
| `standalone: true` explicite | 1 | `dw-error-message.ts:34` | S |
| Injection par constructeur | 1 | `region.component.ts:74` | S |
| `ngModel` alors que les Signal Forms sont la règle | 7 fichiers | `dw-library-toolbar`, bibliothèques créatures, démons, PNJ et sessions, dialogues d'ajout de combattant | M |
| Formulaires réactifs à passer en Signal Forms | 10 fichiers | Bibliothèques armes et armures, `add-menu`, `trait-add-menu`, `region`, `hero-resources`, `card-vitalite`, `turn-assistant`, `scene-editor-dialog`, `dw-prompt-dialog` | M à L |
| `$any()` dans les gabarits | 7 | 4 dans `trait-add-menu` (`region_id` à typer), 3 pour `$event.target` | S |
| Image statique sans `NgOptimizedImage` | 1 | `region.component.html:7` | S |
| Clic sur un `div` sans clavier (AXE, WCAG) | 4 avatars | Traité par M4 | S |
| Style en ligne | 1 | `demon-library-page.html:45` : il impose un gris qui échappe à la forge | S |
| Deux boutons pleins dans une même zone | 2 écrans | `hero-form-page`, `hero-advanced-page` : Enregistrer et Activer | S |
| Structure de page de bibliothèque | 2 pages | Sessions (`.cl-toolbar`), intendance (en-tête maison) | S |
| Couleurs en dur hors des jetons | 202 hexadécimaux, 58 feuilles | Surtout `start-combat-page.scss`, `entity-card` : à réduire avec M1 et M2 | M |
| `::ng-deep` (déprécié) | 19 dans 10 feuilles | À réduire avec M1 et M16 | M |

**Le manque principal :** rien ne vérifie ces règles. Il n'y a ni ESLint, ni Stylelint, ni intégration continue (pas de `.github`). Ajouter `angular-eslint`, Stylelint et une intégration continue qui lance le build et les tests évitera de refaire ce relevé à la main (M).

### 6.2 Backend

| Écart à « la logique dans les services » | Mesure | Effort |
|---|---|---|
| Requêtes directes dans les contrôleurs | Au moins 94 ; `BolHerosController` 18, `BolScenarioController` 15, `BolPnjController` 11 | L, par entité, en même temps que les policies |
| Validation dispersée | `validate()` dans 5 contrôleurs, `BolHerosRequest` ailleurs | M |
| Tests | 78 tests unitaires, `tests/Feature` vide | Commencer par les tests d'accès (section 2) |

### 6.3 `CLAUDE.md` lui-même est à corriger

**Décidé le 2026-10-31 :** les Signal Forms sont la règle pour les formulaires, et `CLAUDE.md` le dit désormais. Leur API est publique depuis Angular 22, et 20 fichiers les utilisent déjà.

| Il dit | La réalité |
|---|---|
| Laravel 12 | `composer.json` demande `^13.0` |
| 150+ routes | Environ 100 dans `routes/api.php` |
| Entité `BolPnj` | Ce modèle n'existe pas : un PNJ est un `BolHeros` |
| 19 seeders | 22 fichiers dans `database/seeders` |
| Boutons `size="small"` | 50 usages, sans effet : les boutons Material n'ont pas d'entrée `size`, et aucun style ne reprend cet attribut |
| — | Rien sur `dw-forge-page` ni sur les jetons `--dw-forge-*`, pourtant le style de toutes les pages |

Autre reste : `dw-tag` lit des variables `--p-tag-*` issues de PrimeNG, définies seulement dans `_forge-page.scss`. À renommer en `--dw-tag-*`, avec des valeurs par défaut.

### 6.4 Règles du jeu

**Vérifié dans `doc/rules/`, sans écart :**

| Règle | Valeur | Code |
|---|---|---|
| Seuil d'attaque | 9 | `combat-resolution.util.ts:5` |
| Seuil de réaction | 9 | `reaction-roll.util.ts:9` |
| Embuscade | +2, ou −1 si surpris | `start-combat-page.ts:144` |
| Initiative ennemie en malus | Plus haute des rivaux et coriaces | `start-combat-page.ts:218` |
| Défense totale | +2 en défense | `combat-turn.util.ts:237` |
| Coup dévastateur | +6 dégâts | `combat-resolution.util.ts:44` |
| Juste une égratignure | d6B | `turn-assistant.html` |
| Horde | Dégâts d6M | `04-pnj-creatures-demons.md` |

**Manques connus :** tout est dans `2026-10-14-combat-reste-a-faire.md` : capacités des créatures et démons (régénération, intangible, poison, vulnérabilité), sorcellerie, foi, fuite opportune, piétaille contre piétaille.

**Fragilité :** certaines règles reposent sur un texte plutôt que sur un identifiant. Renommer une entrée dans le catalogue les casserait sans erreur visible.

- `reaction-roll.util.ts:13` compare le nom des traits « vigilant » et « lent à la détente » ;
- `attack-options.util.ts` lit « armes à deux mains » dans les notes d'une arme ;
- `combat-resolution.util.ts:67` déduit une arme polyvalente de son texte de dégâts.

`bol-rules.constants.ts` montre le bon modèle, avec des identifiants (S à M).

### 6.5 Dette laissée par les derniers changements

- **Hauteurs fixes mesurées à la main :** `--tas-h` et les `min-height` de `combattant-carte.scss` valent pour le contenu actuel. Toute nouvelle option dans ces cartes peut demander de les remesurer.
- **En 1280 × 720, l'écran de combat défile d'environ 40 px :** c'est le prix de la hauteur fixe de la ligne de l'attaquant.
- **Sous 704 px de large,** cette ligne n'a pas de hauteur fixe : son contenu empilé varie trop.
- **Libellés doublés :** `diceSourcesFor` et `traitNote` (`start-combat-page.ts`) répètent les noms « Vigilant » et « Lent à la détente ».

## 7. Plan d'action

L'ordre compte : d'abord le risque, puis les gains rapides, puis les outils de contrôle, et les gros découpages en dernier, une fois les tests en place.

### Phase 0 : sécurité et cache (M à L)

- [ ] Policies et filtres de propriété sur les routes de la section 2.1, catalogue protégé
- [ ] Tests d'accès : le compte B ne touche pas aux données du compte A
- [ ] Clés de cache par compte pour créatures et démons, durée en constante unique

### Phase 1 : gains rapides (M en tout)

- [ ] Reprendre la réponse du PATCH au lieu de refaire un GET
- [ ] Route légère pour l'accueil et la bibliothèque des sessions
- [ ] Convertir les en-têtes en WebP (−7,6 Mo)
- [ ] Vérifier puis supprimer les 20 cartes sans référence (−13 Mo)
- [ ] Retirer Inter et Roboto
- [ ] `loading="lazy"` dans les grilles
- [ ] Corriger le reste de `CLAUDE.md` (section 6.3)
- [ ] Petits écarts : `standalone`, constructeur, types hors `models/`, style en ligne, `size="small"`

### Phase 2 : les outils de contrôle (M)

- [ ] ESLint avec `angular-eslint`, et Stylelint
- [ ] Intégration continue : build, tests Vitest, tests PHPUnit

### Phase 3 : le socle du style (M)

- [ ] M1 : la forge par défaut, suppression du scope et des styles morts
- [ ] M2 : mixins de la forge
- [ ] `dw-tag` sans variables `--p-tag-*`

### Phase 4 : fiches et bibliothèques (L)

- [ ] M3, M4, M5 : en-tête de formulaire, choix d'avatar, messages
- [ ] M6, M7, M8, M9 : rail, base des personnages, panneaux de liste, « général »
- [ ] M10, M11, M12 : grille, catalogue d'équipement, barre d'outils
- [ ] Formulaire d'authentification commun
- [ ] Classes maison et Tailwind : les 54 écarts
- [ ] Signal Forms : `dw-library-toolbar`, les 6 autres gabarits en `ngModel`, puis les formulaires réactifs des fiches et bibliothèques

### Phase 5 : le combat (L)

- [ ] Tests de `turn-assistant`, `start-combat-page`, `session-play-page`
- [ ] M16, M17, M18, M19, M20 : les petites briques
- [ ] M13, M14, M15 : addition, saisie, verdict
- [ ] Découpage de `turn-assistant`, puis de `session-play-page`
- [ ] Signal Forms : `turn-assistant`, `card-vitalite`, `hero-resources`, au moment de leur reprise
- [ ] `@defer` sur le combat et le théâtre

### Phase 6 : portraits et backend (L)

- [ ] Sortir les portraits du JSON : fichiers, URL, migration
- [ ] Déplacer les requêtes des contrôleurs vers les services
- [ ] Règles appuyées sur des identifiants plutôt que sur des textes

## 8. Limites de cette revue

- **Mesures :** faites sur le code de ce jour. Le poids d'une session vient d'une copie de ta session réelle ; il varie avec le nombre de portraits.
- **Sécurité :** revue limitée à la propriété des données et au cache, par lecture du code. Ce n'est pas un audit complet.
- **Règles du jeu :** 8 règles vérifiées par échantillon. La création de personnage et les données de référence n'ont pas été recontrôlées.
- **Duplication :** `jscpd` ne compte que les copies exactes. Les doublons renommés de la section 3 viennent de recherches ciblées, pas d'un comptage exhaustif.
- **Efforts :** ce sont des estimations.
