# La table en « Théâtre » : plan d'implémentation

> **Pour l'exécutant :** utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** remplacer le mode libre de `bol-session-play-page` (réserve en colonne + tapis à deux rangs) par une mise en scène : la scène courante occupe l'écran (décor, lieu, ambiance, texte à lire, secret, pistes), la distribution se tient sur une rampe avec une carte dont la taille dit le rang, la compagnie des héros est en bas, les scènes du scénario forment une frise d'actes dans l'en-tête, et un rideau se ferme puis se rouvre à chaque changement de scène.

**Architecture :**
- **Back :** la scène gagne ses champs de préparation (région, lieu, moment, météo, danger, texte à lire, pistes, illustration). La session retient les scènes déjà jouées. Les lignes de PNJ, créatures et démons portent une attitude (tâche 7).
- **Front, état :** un store limité à la page (`SceneStageStore`, fourni par `SessionPlayPageComponent`) détient les scènes, la frise et le rideau ; l'en-tête et le plateau le partagent.
- **Front, composants :** la logique est dans des fonctions pures (`theatre.util.ts`). Les composants sont des présentations OnPush. Le mode combat ne change pas.

**Stack :** Angular 22 (signaux, OnPush, zoneless, Vitest), Angular Material (menus, sidenav, dialogues), CDK drag-drop, Laravel 12 (PHPUnit dans le conteneur `diceway`), Playwright (scripts dans `front/scripts/`).

**Spec :** la maquette « Diceway Théâtre » validée par Lionel le 2026-10-16 : https://claude.ai/artifact/LzehwLWEZzSDtUYdSqxtHB. Ses sources étaient dans le dossier temporaire de la session. Les décisions et les valeurs qui en sont tirées sont recopiées ci-dessous (section « Ce que la page doit faire »). Ce plan fait foi là où il s'en écarte.

## Contraintes globales

- **Conventions Angular (`CLAUDE.md`) :**
  - composants standalone sans `standalone: true`, `ChangeDetectionStrategy.OnPush`, `input()` / `output()` ;
  - pas de `@HostBinding`, `@HostListener`, `ngClass` ni `ngStyle` ; contrôle de flux natif ;
  - formulaires réactifs ; pas de `any` ;
  - types exportés dans un dossier `models/` (`<nom>.model.ts`).
- **UI :**
  - Angular Material uniquement ; menus ancrés par `MatMenuModule` (modèle : `front/src/app/bol/shared/add-menu/`) ;
  - pas de `appearance="outline"` sur les `mat-form-field` ;
  - une classe custom ne se mélange pas à des utilitaires Tailwind.
- **Langue :** texte d'interface et commentaires en français, au style du code voisin. Pas de libellé en capitales espacées.
- **Thème :**
  - palette sombre unique, tokens `--dw-*` (`front/src/styles/_tokens.scss`) et `--bar-*` (`front/src/styles/_barbare.scss`) ; aucune nouvelle police (titres et lettrine en `'Muse Display Harmony'`, texte en `'Muse Sans'`) ;
  - icônes : police **Material Icons classique** (pas Symbols), plus les SVG enregistrés dans `front/src/app/app.ts` (`CUSTOM_SVG_ICONS`).
- **Accessibilité :**
  - AXE sans erreur, contraste AA, focus visible (`outline: 2px solid var(--dw-color-legendary)`) ;
  - `prefers-reduced-motion: reduce` coupe le rideau animé et les braises.
- **Budget de styles :** 16 kB d'avertissement par composant (`angular.json`). Découper le SCSS par composant.
- **Validation front, depuis `front/` :**
  - `npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals` ;
  - `npm run build` (sans avertissement de budget) ;
  - `npm test -- --watch=false` ;
  - `npx knip` (muet).
- **Validation back, depuis la racine :** ni `tests/` ni `database/` ne sont montés dans le conteneur (seul `app/` l'est). Copier avant de lancer :
  - `docker cp backend/tests/Unit/<Fichier>.php diceway:/var/www/html/tests/Unit/` puis `docker exec diceway php artisan test --filter=<Classe>` ;
  - migration : `docker cp backend/database/migrations/<fichier>.php diceway:/var/www/html/database/migrations/` puis `docker exec diceway php artisan migrate`.
- **Navigateur :**
  - lancer son propre `npx ng serve --port 4400` en arrière-plan, noter son pid et ne tuer que lui ; **ne jamais toucher au port 4200** (serveur IntelliJ de Lionel) ;
  - compte de test `claude-test@example.com` ; supprimer les sessions et scènes `TMP` créées.
- **Git :** Lionel gère branches, merges et worktrees. Les étapes « Point de contrôle » proposent un message de commit ; ne committer que sur son feu vert.
- **Catalogue :** ne jamais modifier ses entités (créatures, démons, PNJ semés, `user_id` nul).

## Ce que la page doit faire

Ce sont les décisions prises à partir de la maquette, la référence pour chaque tâche.

### 1. En-tête

- **Contenu, dans l'ordre :**
  - le titre de la session ;
  - **la frise des actes** ;
  - la recherche ( / ) ;
  - « Coulisses » (ouvre ou ferme la réserve) ;
  - « Démarrer un combat » ;
  - le menu du compte.
- **La frise des actes :**
  - elle montre les scènes du scénario affiché, dans leur ordre ;
  - devant elle, un bouton-menu change de scénario (« Sans scénario » compris) ;
  - au premier chargement, le scénario affiché est celui de la scène courante.
- **Un acte :**
  - c'est une pastille numérotée ; une coche remplace le numéro si la scène est jouée ;
  - seul l'acte en cours affiche aussi son titre.
- **Clic sur un acte :** il ouvre l'**aperçu**, un `mat-menu` qui contient :
  - une vignette du décor, le lieu, le titre, l'ambiance et les portraits de la distribution ;
  - « Scène déjà jouée. » si c'est le cas ;
  - « Lever le rideau » (chargement en remplacement) ;
  - « Ajouter ses personnages » (chargement en ajout, masqué si la distribution est vide) ;
  - « Préparer la scène » (ouvre l'éditeur).

### 2. Plateau

Il occupe tout l'espace entre l'en-tête et la compagnie.

- **Le décor :**
  - l'illustration de la scène si elle en a une ;
  - sinon la carte de Lémurie (`/assets/bol/cartes/carte.jpg`), centrée sur la région de la scène, à 300 % : `filter: sepia(.55) saturate(.8) brightness(.62) blur(1.5px)`, `transform: scale(1.04)` ;
  - sinon le fond cuir de la table ;
  - une illustration qui ne se charge pas retombe sur la carte ;
  - un dégradé sombre en bas et sur les bords garde le texte lisible.
- **Les braises :** un canvas de 36 particules au plus, en `--bar-ember`, sous le texte. Il s'arrête si le mouvement est réduit ou si l'onglet est caché.
- **Le cartouche, en haut à gauche (largeur max. 46rem) :**
  - le lieu (icône `place`, région puis précision), suivi de « scène N sur M » quand la scène courante est dans la frise ;
  - le titre en grand (`'Muse Display Harmony'`, `clamp(2rem, 4vw, 3.4rem)`) ;
  - les puces d'ambiance : moment, météo, danger (1 à 4 crânes) ;
  - il est `aria-live="polite"` ;
  - sans scène : « Aucune scène chargée », puis « Choisis une scène dans la frise, ou fais entrer des personnages depuis les coulisses. ».
- **La lecture : un aside à droite, de 24rem, qui défile.**
  - « À lire aux joueurs » :
    - le texte à lire, en 1.12rem, interligne 1.58, avec une lettrine en `'Muse Display Harmony'` à 3.35em, couleur `--dw-color-legendary` ;
    - sans texte : « Pas de texte à lire. » et le bouton « Préparer la scène ».
  - « Secret du MJ » (les `notes` existantes) :
    - flouté (`filter: blur(6px)`, `inert`, `aria-hidden`) tant que « Afficher le secret » n'est pas pressé ;
    - le bouton bascule et porte `aria-pressed` ;
    - le secret redevient flouté à chaque changement de scène.
  - « Pistes » :
    - une liste de textes ;
    - une piste reliée à une scène de la frise montre un bouton « Scène N », qui ouvre le même aperçu.
- **La troupe, posée sur une rampe éclairée en bas du plateau :**
  - **qui :** les personnages du camp `adversaires` ;
  - **ordre :** rivaux, coriaces, piétaille ; puis par type, puis par arrivée ;
  - **tailles :** rival 10.8 × 15.2rem, coriace 9 × 12.6rem, piétaille 7.2 × 10rem ; deux piétailles voisines se chevauchent de 2.6rem, et la carte survolée ou focalisée passe devant ;
  - **une carte montre :**
    - le portrait ;
    - le rang en haut à gauche et l'icône du type en haut à droite ;
    - le nom et une barre de vitalité de 4px, rouge sous 35 % ;
    - le portrait en gris à 0 de vitalité.
  - **gestes :**
    - clic : ouvre la carte en dialogue (le dialogue existant) ;
    - Ctrl/Cmd + clic : sélectionne (Suppr retire, comme aujourd'hui) ;
    - glisser la carte vers la compagnie : en fait un allié.
  - la troupe défile horizontalement dans sa propre zone ;
  - sans personnage : « Personne en scène. », puis le bouton « Ouvrir les coulisses ».
- **Le rideau :**
  - au chargement d'une scène, deux pans de velours (51 % de largeur chacun) se ferment en 750 ms ;
  - le titre de la scène s'affiche au centre ;
  - après le chargement et une pause de 250 ms, ils se rouvrent ;
  - avec le mouvement réduit : pas d'animation, et le chargement n'attend pas.

### 3. Compagnie, en pied de page

- **Une plaque par héros :**
  - un portrait cliquable, qui ouvre la carte en dialogue ;
  - le nom et le joueur ;
  - la vitalité : − / +, une barre et « 8/12 » ;
  - l'héroïsme : gemmes de `heroismeGems`, − / +.
  - Chaque pas est enregistré tout de suite.
- **Les alliés :** des petites cartes de 6.4 × 8.8rem, à droite des plaques.
- La zone est la cible de dépôt `heros`.

### 4. Coulisses

- C'est un `mat-sidenav` à droite (`mode="over"`, sans fond bloquant) qui contient la `bol-reserve` actuelle, inchangée.
- **Ouverture :**
  - par « Coulisses » dans l'en-tête, la barre de commande, ou les boutons « Ouvrir les coulisses » ;
  - Échap la ferme ;
  - son état est retenu (`RESERVE_PANEL_KEY`), fermé par défaut.
- Glisser un personnage des coulisses sur la troupe ou sur la compagnie le pose dans ce camp. Le mécanisme ne change pas : `data-drop-camp` et `ReservePlacementService`.

### 5. Préparer une scène

C'est un dialogue d'édition, ouvert depuis l'aperçu, la lecture et « Gérer les scènes ». Il remplace le champ « Notes du MJ » de la liste.

| Champ | Contrôle | Règle |
| --- | --- | --- |
| Titre | texte | obligatoire, 120 car. max |
| Région | `mat-select` des régions du catalogue | facultatif ; elle donne la position sur la carte via `REGION_MAP_COORDINATES` |
| Lieu | texte | 120 car. max, par exemple « Gué du Tyr » |
| Moment | groupe de boutons | aube, jour, crépuscule, nuit, ou aucun |
| Météo | `mat-select` | clair, couvert, pluie, brume, vent, orage, cendres, ou aucune |
| Danger | groupe de boutons 1 à 4 | ou aucun |
| Illustration | texte (adresse) avec aperçu | `https://…` ou `/assets/…`, 500 car. max |
| À lire aux joueurs | zone de texte | 5000 car. max |
| Secret du MJ | zone de texte (`notes`) | 10000 car. max |
| Pistes | liste éditable (texte + scène liée du même scénario) | 8 au plus, texte de 200 car. max |

### 6. Attitude

- **Valeurs :** hostile, méfiant, neutre ou amical.
- **Où elle se règle :** sur chaque PNJ, créature ou démon du camp `adversaires`, depuis sa carte en dialogue.
- **Où elle s'affiche :** sur la carte de la troupe, en bas à gauche, par une pastille de couleur et un libellé.
- **Scènes :** elle est enregistrée avec la scène et restaurée au chargement.

## Écarts assumés avec la maquette

1. **Pas de fiche en popover.** Le clic ouvre le dialogue de carte existant (`ExpandedCardDialogComponent`), qui a déjà le jet d'action, l'équipement et le retrait. Le panneau de jet de la plaque de héros n'est pas repris : le portrait ouvre ce même dialogue.
2. **Lieu.** Il vient de la **région** du catalogue (avec ses coordonnées déjà relevées pour le choix de région du héros), plus une précision en texte libre. Il n'y a pas de position libre sur la carte : l'Atlas viendra plus tard.
3. **Illustration.** C'est une adresse, faute de téléversement dans l'API. La carte de la région sert de décor par défaut.
4. **Polices.** La maquette utilisait Alegreya pour le récit. On garde les polices de l'app, sans en ajouter.
5. **Libellés.** Le bouton de combat reste « Démarrer un combat » (et non « Aux armes ! »), pour que l'action garde son nom partout.
6. **Hors de ce plan :** journal de séance, table d'événements d6, vue Atlas, téléversement d'images.

## Revue : cas que le spec implique sans les nommer

Chaque ligne a son test dans la tâche indiquée.

1. **Session neuve, aucune scène courante :**
   - la frise montre les scènes sans scénario et le cartouche son état vide, sans erreur ;
   - Tâche 2 (`sceneActs`) et Tâche 4 (store).
2. **Double clic sur « Lever le rideau » :**
   - un seul chargement part ;
   - Tâche 4 (store).
3. **Chargement refusé** (combat en cours, réseau) :
   - le rideau se rouvre, le store n'est plus occupé, le message d'erreur s'affiche ;
   - Tâche 4 (store).
4. **Illustration cassée, ou région sans coordonnées :**
   - le décor retombe sur la carte, puis sur le fond cuir ;
   - Tâche 2 (`sceneDecor`) et Tâche 8 (script, image invalide).
5. **Scène bondée** (dix adversaires, surtout de la piétaille) **et texte à lire très long :**
   - la page ne défile pas en largeur ;
   - la troupe et la lecture défilent chacune dans leur zone ;
   - Tâche 8 (script, mesure de `scrollWidth`).

Hors de ces cinq cas, une piste qui vise une scène supprimée ou d'un autre scénario perd son lien côté back (Tâche 1) et n'affiche pas de bouton côté front (Tâche 6).

---

## Structure des fichiers

| Fichier | Rôle | Tâche |
| --- | --- | --- |
| `backend/database/migrations/2026_10_16_100000_add_preparation_to_bol_scene.php` | Colonnes de préparation de `bol_scene`, `scenes_jouees` de `bol_fight_session` | 1 |
| `backend/app/Http/Services/Bol/BolScenePreparation.php` (+ `tests/Unit/BolScenePreparationTest.php`) | Fonctions pures : pistes normalisées, scènes jouées | 1 |
| `backend/app/Models/Bol/BolScene.php`, `BolFightSession.php` | `fillable` et `casts` | 1 |
| `backend/app/Http/Controllers/Bol/BolSceneController.php`, `backend/app/Http/Services/Bol/BolSceneService.php` | Validation et mise à jour des nouveaux champs, scènes jouées | 1 |
| `front/src/app/bol/models/bol-scene.model.ts`, `bol-fight-session.model.ts` | Types de la scène préparée, `scenes_jouees`, attitude | 2, 7 |
| `front/src/app/bol/session/models/theatre.model.ts` | Types du théâtre (acte, décor, options d'ambiance, rideau, troupe) | 2 |
| `front/src/app/bol/session/play/theatre/theatre.util.ts` (+ spec) | Noyau pur : actes, décor, troupe, compagnie, portraits, options d'ambiance | 2, 5, 7 |
| `front/src/app/bol/shared/region/region-map-coordinates.ts` | Déplacé depuis `bol/hero/advanced/region/` (deux usages désormais) | 3 |
| `front/src/app/bol/session/models/scene-editor-dialog.model.ts` | Données et valeur du dialogue d'édition | 3 |
| `front/src/app/bol/session/play/theatre/scene-editor-dialog/*` (+ `scene-editor.util.spec.ts`) | Dialogue « Préparer la scène » et sa conversion formulaire ↔ changements | 3 |
| `front/src/app/bol/session/play/scene-list/scene-list.*` | « Préparer la scène » remplace le champ notes | 3 |
| `front/src/app/bol/session/play/theatre/scene-stage.store.ts` (+ spec) | Store de page : scènes, frise, scène courante, régions, rideau, chargement | 4 |
| `front/src/app/bol/session/scene-actions.service.ts` | `loadAs` (chargement sans dialogue de choix) | 4 |
| `front/src/app/bol/session/play/theatre/scene-acts.ts`, `scene-preview.ts`, `scene-ambiance.ts`, `rideau.ts` | Frise, aperçu, puces d'ambiance, rideau | 4 |
| `front/src/app/bol/session/play/session-header/session-header.*` | Emplacement projeté pour la frise, bouton « Coulisses » | 4, 6 |
| `front/src/app/bol/session/play/theatre/acteur.*`, `troupe.*`, `compagnie.*` | Cartes de la troupe, rampe, compagnie | 5 |
| `front/src/app/bol/session/play/tapis/tapis.util.ts` (+ spec), `front/src/app/bol/session/models/tapis.model.ts` | `TapisCard` gagne `joueur`, `heroisme` (puis `attitude`) | 5, 7 |
| `front/src/app/bol/session/play/tapis/tapis.*`, `character-card.*` | Supprimés (remplacés par troupe et compagnie) | 5 |
| `front/src/app/bol/session/play/theatre/theatre.*`, `scene-decor.ts`, `braises.ts`, `scene-cartouche.ts`, `scene-lecture.*` | Plateau | 6 |
| `front/src/app/bol/session/play/session-play-page.*` | Store fourni, frise, rideau, théâtre, coulisses | 4, 5, 6 |
| `front/src/app/bol/session/play/command-palette/command-palette.util.ts` (+ spec) | Libellé « Ouvrir / Fermer les coulisses » | 6 |
| `front/src/assets/icons/skull.svg`, `front/src/app/app.ts` | Icône du danger | 4 |
| `backend/database/migrations/2026_10_16_100100_add_attitude_to_bol_fight_session_rows.php`, `BolSceneDistribution.php` (+ test), `BolFightSessionService.php`, `BolFightSessionController.php`, `routes/api.php`, modèles de lignes | Attitude | 7 |
| `front/src/app/bol/session/play/tapis/expanded-card.*`, `front/src/app/bol/services/bol-fight-session.service.ts` | Choix de l'attitude dans la carte en dialogue | 7 |
| `front/scripts/e2e-theatre.mjs` | Parcours navigateur | 8 |

---

### Tâche 1 : le back enregistre la préparation d'une scène et les scènes jouées

**Fichiers :**
- Créer : `backend/database/migrations/2026_10_16_100000_add_preparation_to_bol_scene.php`, `backend/app/Http/Services/Bol/BolScenePreparation.php`, `backend/tests/Unit/BolScenePreparationTest.php`
- Modifier : `backend/app/Models/Bol/BolScene.php`, `backend/app/Models/Bol/BolFightSession.php`, `backend/app/Http/Controllers/Bol/BolSceneController.php` (`update`), `backend/app/Http/Services/Bol/BolSceneService.php` (`update`, `createFromSession`, `loadIntoSession`)

**Interfaces :**
- Produit (API) : chaque scène renvoyée par `GET /bol/scene` et `POST /bol/scene/update` porte en plus :
  - `region_id: int|null`, `lieu: string|null` ;
  - `moment: 'aube'|'jour'|'crepuscule'|'nuit'|null` ;
  - `meteo: 'clair'|'couvert'|'pluie'|'brume'|'vent'|'orage'|'cendres'|null` ;
  - `danger: 1..4|null`, `lecture: string|null` ;
  - `pistes: {texte: string, scene_id: string|null}[]|null`, `image: string|null`.
- Produit (API) : la session porte `scenes_jouees: string[]|null`, la liste de toutes les scènes qui ont été courantes.
- Produit (PHP) : `BolScenePreparation::MOMENTS`, `::METEOS`, `::pistes(?array $pistes, array $sceneIds): ?array`, `::played(?array $played, string $sceneId): array`.

- [ ] **Étape 1 : écrire les tests qui échouent** (`backend/tests/Unit/BolScenePreparationTest.php`, `PHPUnit\Framework\TestCase`, comme `BolSceneDistributionTest`)

```php
public function test_pistes_trims_and_drops_blank(): void
{
    $this->assertSame(
        [['texte' => 'Suivre les traces', 'scene_id' => null]],
        BolScenePreparation::pistes([['texte' => '  Suivre les traces  ', 'scene_id' => null], ['texte' => '   ']], []),
    );
}

public function test_pistes_unknown_scene_loses_its_link(): void
{
    $result = BolScenePreparation::pistes([['texte' => 'A', 'scene_id' => 'zzz'], ['texte' => 'B', 'scene_id' => 's2']], ['s2', 's3']);
    $this->assertNull($result[0]['scene_id']);
    $this->assertSame('s2', $result[1]['scene_id']);
}

public function test_pistes_keeps_eight_and_cuts_texte_at_200(): void
{
    $pistes = array_fill(0, 10, ['texte' => str_repeat('é', 250), 'scene_id' => null]);
    $result = BolScenePreparation::pistes($pistes, []);
    $this->assertCount(8, $result);
    $this->assertSame(200, mb_strlen($result[0]['texte']));
}

public function test_pistes_empty_is_null(): void
{
    $this->assertNull(BolScenePreparation::pistes([], []));
    $this->assertNull(BolScenePreparation::pistes(null, []));
    $this->assertNull(BolScenePreparation::pistes([['texte' => ' ']], []));
}

public function test_played_appends_each_scene_once(): void
{
    $this->assertSame(['a'], BolScenePreparation::played(null, 'a'));
    $this->assertSame(['a'], BolScenePreparation::played(['a'], 'a'));
    $this->assertSame(['a', 'b'], BolScenePreparation::played(['a'], 'b'));
}

public function test_played_keeps_the_last_hundred(): void
{
    $played = array_map(fn ($i) => "s$i", range(1, 100));
    $result = BolScenePreparation::played($played, 'nouvelle');
    $this->assertCount(100, $result);
    $this->assertSame('s2', $result[0]);
    $this->assertSame('nouvelle', $result[99]);
}
```

- [ ] **Étape 2 : lancer les tests et vérifier qu'ils échouent.** Copier le test dans le conteneur, puis `docker exec diceway php artisan test --filter=BolScenePreparationTest`. Attendu : échec, « Class "App\Http\Services\Bol\BolScenePreparation" not found ».

- [ ] **Étape 3 : écrire `BolScenePreparation`**
  - Classe finale aux méthodes statiques, avec le docblock du voisin `BolSceneDistribution`.
  - `MOMENTS = ['aube', 'jour', 'crepuscule', 'nuit']`.
  - `METEOS = ['clair', 'couvert', 'pluie', 'brume', 'vent', 'orage', 'cendres']`.
  - `PISTES_MAX = 8`, `PISTE_TEXTE_MAX = 200`, `JOUEES_MAX = 100`.
  - `pistes()` : rogne le texte (`trim`), puis le coupe avec `mb_substr`.
  - `played()` : conserve l'ordre et ne garde que les 100 dernières scènes.

- [ ] **Étape 4 : relancer les tests.** Attendu : 6 tests réussis.

- [ ] **Étape 5 : écrire la migration**
  - **`bol_scene`, après `scenario_id`, dans cet ordre :**
    - `foreignId('region_id')->nullable()->constrained('bol_region')->nullOnDelete()` ;
    - `string('lieu', 120)->nullable()`, `string('moment', 12)->nullable()`, `string('meteo', 12)->nullable()` ;
    - `unsignedTinyInteger('danger')->nullable()`, `text('lecture')->nullable()` ;
    - `json('pistes')->nullable()`, `string('image', 500)->nullable()`.
  - **`bol_fight_session` :** `json('scenes_jouees')->nullable()->after('scene_id')`.
  - **`down()` :** retire tout, en commençant par la clé étrangère.

- [ ] **Étape 6 : brancher les modèles, le contrôleur et le service**
  - **`BolScene` :**
    - ajoute à `$fillable` les huit colonnes ;
    - ajoute aux `$casts` : `'region_id' => 'integer'`, `'danger' => 'integer'`, `'pistes' => 'array'`.
  - **`BolFightSession` :** ajoute `scenes_jouees` à `$fillable` et `'scenes_jouees' => 'array'` aux `$casts`.
  - **`BolSceneController::update`, règles à ajouter :**
    - `'region_id' => 'sometimes|nullable|integer|exists:bol_region,id'` ;
    - `'lieu' => 'sometimes|nullable|string|max:120'` ;
    - `'moment' => ['sometimes', 'nullable', Rule::in(BolScenePreparation::MOMENTS)]` ;
    - `'meteo' => ['sometimes', 'nullable', Rule::in(BolScenePreparation::METEOS)]` ;
    - `'danger' => 'sometimes|nullable|integer|between:1,4'` ;
    - `'lecture' => 'sometimes|nullable|string|max:5000'` ;
    - `'pistes' => 'sometimes|nullable|array|max:8'`, `'pistes.*.texte' => 'required|string|max:200'`, `'pistes.*.scene_id' => 'nullable|string'` ;
    - `'image' => ['sometimes', 'nullable', 'string', 'max:500', 'regex:#^(https://|/assets/)#']`.
    - Étendre la liste passée à `array_intersect_key` en conséquence.
  - **`BolSceneService::update` :**
    - copie les clés simples présentes (`titre`, `notes`, `region_id`, `lieu`, `moment`, `meteo`, `danger`, `lecture`, `image`) ;
    - pour `pistes`, normalise avec `BolScenePreparation::pistes($data['pistes'], $siblingIds)`. `$siblingIds` = ids des scènes du même utilisateur et du scénario d'arrivée (après un éventuel changement de scénario), sauf la scène elle-même.
  - **`createFromSession` et `loadIntoSession` :** dans la même transaction, mettent `'scenes_jouees' => BolScenePreparation::played($session->scenes_jouees, $scene->id)` à côté de `scene_id`.

- [ ] **Étape 7 : migrer et vérifier de bout en bout**
  - Copier et lancer la migration (voir les contraintes globales).
  - Avec un jeton du compte de test, appeler `POST /api/bol/scene/update` avec `{"id": "<scène>", "moment": "crepuscule", "danger": 3, "pistes": [{"texte": " Suivre ", "scene_id": "inconnue"}]}`. Attendu : 200, `pistes: [{"texte": "Suivre", "scene_id": null}]`.
  - Appeler la même route avec `"danger": 5`. Attendu : 422.

- [ ] **Étape 8 : point de contrôle.** Message proposé : `feat(scene): champs de préparation d'une scène et scènes jouées`.

---

### Tâche 2 : les modèles front et le noyau pur du théâtre

**Fichiers :**
- Modifier : `front/src/app/bol/models/bol-scene.model.ts`, `front/src/app/bol/models/bol-fight-session.model.ts`, les fixtures `BolSceneModel` de `scene.util.spec.ts` et `command-palette.util.spec.ts`
- Créer : `front/src/app/bol/session/models/theatre.model.ts`, `front/src/app/bol/session/play/theatre/theatre.util.ts`, `theatre.util.spec.ts`

**Interfaces :**
- Produit (`bol-scene.model.ts`) :
  - `type SceneMoment = 'aube' | 'jour' | 'crepuscule' | 'nuit'` ;
  - `type SceneMeteo = 'clair' | 'couvert' | 'pluie' | 'brume' | 'vent' | 'orage' | 'cendres'` ;
  - `interface BolScenePiste {texte: string; scene_id: string | null}` ;
  - `BolSceneModel` gagne, tous **obligatoires** : `region_id: number | null`, `lieu: string | null`, `moment: SceneMoment | null`, `meteo: SceneMeteo | null`, `danger: number | null`, `lecture: string | null`, `pistes: BolScenePiste[] | null`, `image: string | null` ;
  - `BolSceneChanges` gagne les mêmes clés, facultatives.
- Produit (`bol-fight-session.model.ts`) : `BolFightSessionModel.scenes_jouees?: string[] | null`.
- Produit (`theatre.model.ts`) :
  - `type ActeStatut = 'jouee' | 'en-cours' | 'a-venir'` ;
  - `interface SceneActe {readonly scene: BolSceneModel; readonly numero: number; readonly statut: ActeStatut}` ;
  - `type SceneDecor = {readonly kind: 'image'; readonly url: string} | {readonly kind: 'carte'; readonly x: number; readonly y: number} | {readonly kind: 'aucun'}` ;
  - `interface AmbianceOption<T> {readonly value: T; readonly label: string; readonly icon: string}` ;
  - `type RideauEtat = 'ouvert' | 'ferme'` ;
  - `type TroupeTaille = 'rival' | 'coriace' | 'pietaille' | 'allie'` ;
  - `interface TroupeCard {readonly card: TapisCard; readonly taille: TroupeTaille}` ;
  - `interface ScenePortrait {readonly nom: string; readonly avatar: string | null; readonly qty: number}`.
- Produit (`theatre.util.ts`) :
  - `MOMENTS: readonly AmbianceOption<SceneMoment>[]` ;
  - `METEOS: readonly AmbianceOption<SceneMeteo>[]` ;
  - `sceneActs(scenes: readonly BolSceneModel[], scenarioId: string | null, knownScenarioIds: ReadonlySet<string>, currentId: string | null, played: readonly string[]): SceneActe[]` ;
  - `sceneDecor(scene: BolSceneModel | null, coords: Readonly<Record<number, {x: number; y: number}>>): SceneDecor` ;
  - `distributionPortraits(distribution: readonly BolSceneEntry[], catalog: readonly CombatCatalogEntry[]): ScenePortrait[]`.

- [ ] **Étape 1 : étendre les modèles.** Ajouter les champs ci-dessus. Les fixtures existantes reçoivent les huit champs à `null` : passer par un petit `scene()` local à chaque spec plutôt que de répéter les champs. `npx tsc -p tsconfig.app.json --noEmit` doit passer.

- [ ] **Étape 2 : écrire les tests qui échouent** (`theatre.util.spec.ts`)

```ts
function scene(id: string, ordre: number, extra: Partial<BolSceneModel> = {}): BolSceneModel {
  return {id, scenario_id: 'sc1', titre: `Scène ${id}`, ordre, notes: null, distribution: [], region_id: null, lieu: null,
    moment: null, meteo: null, danger: null, lecture: null, pistes: null, image: null, ...extra};
}
const KNOWN = new Set(['sc1']);

describe('sceneActs', () => {
  it('numérote les scènes du scénario et donne leur statut', () => {
    const acts = sceneActs([scene('s3', 2), scene('s1', 0), scene('s2', 1)], 'sc1', KNOWN, 's2', ['s1', 's2']);
    expect(acts.map((a) => [a.scene.id, a.numero, a.statut])).toEqual([['s1', 1, 'jouee'], ['s2', 2, 'en-cours'], ['s3', 3, 'a-venir']]);
  });

  it('sans scène courante ni scénario, montre les scènes sans scénario', () => {
    const acts = sceneActs([scene('s1', 0), scene('libre', 0, {scenario_id: null})], null, KNOWN, null, []);
    expect(acts.map((a) => [a.scene.id, a.statut])).toEqual([['libre', 'a-venir']]);
  });
});

describe('sceneDecor', () => {
  const coords = {5: {x: 26.4, y: 59}};
  it("préfère l'illustration", () => {
    expect(sceneDecor(scene('s', 0, {image: '/assets/bol/quest.jpg', region_id: 5}), coords)).toEqual({kind: 'image', url: '/assets/bol/quest.jpg'});
  });
  it('retombe sur la carte de la région, même avec une adresse vide', () => {
    expect(sceneDecor(scene('s', 0, {image: '  ', region_id: 5}), coords)).toEqual({kind: 'carte', x: 26.4, y: 59});
  });
  it('sans région connue ni illustration, rien', () => {
    expect(sceneDecor(scene('s', 0, {region_id: 99}), coords)).toEqual({kind: 'aucun'});
    expect(sceneDecor(null, coords)).toEqual({kind: 'aucun'});
  });
});

describe('distributionPortraits', () => {
  it('retrouve nom et portrait dans le catalogue et garde la quantité', () => {
    const catalog = [{catalogId: 'creature-24', kind: 'creature', sourceId: '24', nom: 'Kroark', vitalite: 14, avatar: '/k.jpg'}] as unknown as CombatCatalogEntry[];
    expect(distributionPortraits([{kind: 'creature', source_id: '24', qty: 3, positions: []}, {kind: 'pnj', source_id: '404', qty: 1, positions: []}], catalog))
      .toEqual([{nom: 'Kroark', avatar: '/k.jpg', qty: 3}]);
  });
});
```

- [ ] **Étape 3 : lancer les tests et vérifier l'échec.** `npm test -- --watch=false theatre.util`. Attendu : échec, module absent.

- [ ] **Étape 4 : implémenter `theatre.util.ts`**
  - `sceneActs` s'appuie sur `scenesOf` (`scene-list/scene.util.ts`).
  - `distributionPortraits` ignore les entrées absentes du catalogue.
  - **`MOMENTS` (valeur, libellé, icône) :**
    - aube, « Aube », `wb_twilight` ;
    - jour, « Jour », `wb_sunny` ;
    - crepuscule, « Crépuscule », `wb_twilight` ;
    - nuit, « Nuit », `nights_stay`.
  - **`METEOS` :**
    - clair, « Ciel clair », `wb_sunny` ;
    - couvert, « Ciel de plomb », `cloud` ;
    - pluie, « Pluie », `umbrella` ;
    - brume, « Brume », `blur_on` ;
    - vent, « Grand vent », `air` ;
    - orage, « Orage », `thunderstorm` ;
    - cendres, « Pluie de cendres », `local_fire_department`.

- [ ] **Étape 5 : relancer les tests.** `npm test -- --watch=false theatre.util`. Attendu : tout passe.

- [ ] **Étape 6 : vérifications du front** (les quatre commandes des contraintes globales). `knip` signalera les exports pas encore utilisés : c'est attendu jusqu'à la tâche 4. Les noter, sans les supprimer.

- [ ] **Étape 7 : point de contrôle.** Message proposé : `feat(theatre): modèles de scène préparée et noyau pur`.

---

### Tâche 3 : préparer une scène

**Fichiers :**
- Déplacer : `front/src/app/bol/hero/advanced/region/region-map-coordinates.ts` → `front/src/app/bol/shared/region/region-map-coordinates.ts` (mettre à jour l'import de `region.component.ts`)
- Créer : `front/src/app/bol/session/models/scene-editor-dialog.model.ts`, `front/src/app/bol/session/play/theatre/scene-editor-dialog/scene-editor-dialog.ts`, `.html`, `.scss`, `scene-editor.util.ts`, `scene-editor.util.spec.ts`
- Modifier : `front/src/app/bol/session/play/scene-list/scene-list.ts`, `.html`

**Interfaces :**
- Consomme : `BolSceneChanges`, `MOMENTS`, `METEOS` (tâche 2), `BolSceneService.update`, `BolCatalogService.regions()`.
- Produit :
  - `interface SceneEditorDialogData {readonly scene: BolSceneModel; readonly siblings: readonly BolSceneModel[]}` ;
  - `interface SceneEditorValue {titre: string; region_id: number | null; lieu: string; moment: SceneMoment | null; meteo: SceneMeteo | null; danger: number; image: string; lecture: string; notes: string; pistes: {texte: string; scene_id: string | null}[]}` ;
  - `editorValue(scene: BolSceneModel): SceneEditorValue` ;
  - `sceneChanges(value: SceneEditorValue): BolSceneChanges` ;
  - `openSceneEditor(dialog: MatDialog, data: SceneEditorDialogData): Observable<BolSceneModel | undefined>`, exportée par `scene-editor-dialog.ts` et qui émet la scène enregistrée.

- [ ] **Étape 1 : écrire les tests qui échouent** (`scene-editor.util.spec.ts`)

```ts
it('rogne les textes, vide devient null, danger 0 devient null', () => {
  const changes = sceneChanges({titre: '  Le gué  ', region_id: 5, lieu: ' ', moment: 'crepuscule', meteo: null, danger: 0, image: ' ',
    lecture: '  Il pleut.  ', notes: '', pistes: [{texte: ' Suivre ', scene_id: 's3'}, {texte: '  ', scene_id: null}]});
  expect(changes).toEqual({titre: 'Le gué', region_id: 5, lieu: null, moment: 'crepuscule', meteo: null, danger: null, image: null,
    lecture: 'Il pleut.', notes: null, pistes: [{texte: 'Suivre', scene_id: 's3'}]});
});

it('aucune piste devient null', () => {
  expect(sceneChanges({...editorValue(SCENE), pistes: []}).pistes).toBeNull();
});

it('un aller-retour garde la préparation', () => {
  const prepared = {...SCENE, lieu: 'Gué du Tyr', danger: 3, pistes: [{texte: 'Suivre', scene_id: null}]};
  expect(sceneChanges(editorValue(prepared))).toEqual(expect.objectContaining({lieu: 'Gué du Tyr', danger: 3, pistes: [{texte: 'Suivre', scene_id: null}]}));
});
```

(`SCENE` : une `BolSceneModel` de fixture, comme le `scene()` de la tâche 2.)

- [ ] **Étape 2 : lancer et vérifier l'échec.** `npm test -- --watch=false scene-editor`.

- [ ] **Étape 3 : implémenter `scene-editor.util.ts`** pour faire passer les tests. Relancer : tout passe.

- [ ] **Étape 4 : écrire le dialogue `bol-scene-editor-dialog`.**
  - **Formulaire :** un `FormGroup` typé de `SceneEditorValue`, initialisé par `editorValue(data.scene)`. `titre` est requis et limité à 120 caractères ; `pistes` est un `FormArray`.
  - **Mise en page :** deux colonnes au-delà de 56rem.
    - « Le décor » : titre ; région (régions triées par nom) ; lieu ; moment (`mat-button-toggle-group`, plus « Aucun ») ; météo ; danger (`mat-button-toggle-group` 1 à 4, plus « Aucun ») ; illustration, avec un aperçu de 16:9 rendu par `sceneDecor` sur la valeur en cours.
    - « Le texte » : « À lire aux joueurs » (8 lignes, compteur sur 5000) ; « Secret du MJ » (5 lignes) ; « Pistes » (texte + `mat-select` des scènes de `siblings`, ou « Aucune scène » ; bouton de retrait ; « Ajouter une piste » désactivé à 8).
  - **Actions :** « Annuler » et « Enregistrer ». « Enregistrer » appelle `BolSceneService.update(scene.id, sceneChanges(value))` puis ferme le dialogue avec la scène renvoyée. Une erreur ouvre un snackbar `extractApiErrorMessage(error, "Impossible d'enregistrer la scène.")`.
  - **Ouverture :** `openSceneEditor` ouvre le dialogue avec `width: 'min(60rem, 96vw)'`, `maxWidth: '96vw'`, `autoFocus: 'first-tabbable'`.

- [ ] **Étape 5 : brancher la liste des scènes.** Dans `scene-list.html`, le `mat-form-field` « Notes du MJ » est remplacé par un bouton `mat-stroked-button` « Préparer la scène » (icône `edit_note`), qui appelle `prepare(scene)`.
  - `prepare` ouvre `openSceneEditor` avec `siblings` = `visibleScenes()` sans la scène.
  - Au retour, `replaceScene(updated)` puis `changed.emit()`.
  - Supprimer `saveNotes`.

- [ ] **Étape 6 : vérifier à la main** (serveur sur 4400). Ouvrir une table, puis Réserve → Scènes → Gérer les scènes → Préparer la scène. Remplir tous les champs et enregistrer ; rouvrir : tout est là. Mettre un danger, l'enlever, enregistrer : `danger` est `null` dans la réponse réseau.

- [ ] **Étape 7 : vérifications du front, puis point de contrôle.** Message proposé : `feat(scene): dialogue « Préparer la scène »`.

---

### Tâche 4 : la frise des actes, l'aperçu et le rideau

**Fichiers :**
- Créer : `front/src/app/bol/session/play/theatre/scene-stage.store.ts`, `scene-stage.store.spec.ts`, `scene-acts.ts`, `scene-preview.ts`, `scene-ambiance.ts`, `rideau.ts`, `front/src/assets/icons/skull.svg`
- Modifier : `front/src/app/bol/session/scene-actions.service.ts`, `front/src/app/bol/session/play/session-header/session-header.html`, `.scss`, `front/src/app/bol/session/play/session-play-page.ts`, `.html`, `.scss`, `front/src/app/app.ts` (icône `skull`)

**Interfaces :**
- Consomme : `sceneActs`, `sceneDecor`, `distributionPortraits`, `MOMENTS`, `METEOS` (tâche 2), `openSceneEditor` (tâche 3), `REGION_MAP_COORDINATES`.
- Produit : `SceneActionsService.loadAs(sessionId: string, scene: BolSceneModel, mode: SceneLoadMode): Observable<BolSceneLoadResult>`, avec le message de chargement ; `load` existant s'appuie dessus.
- Produit : `SceneStageStore`, `@Injectable()` **sans** `providedIn`, fourni par `SessionPlayPageComponent.providers`.

```ts
readonly scenes: Signal<readonly BolSceneModel[]>;
readonly scenarios: Signal<readonly BolSceneScenarioRef[]>;
readonly scenarioId: Signal<string | null>;          // scénario affiché dans la frise
readonly acts: Signal<readonly SceneActe[]>;
readonly currentScene: Signal<BolSceneModel | null>;
readonly currentActe: Signal<SceneActe | null>;      // l'acte « en-cours » s'il est dans la frise
readonly regionNoms: Signal<ReadonlyMap<number, string>>;
readonly rideau: Signal<RideauEtat>;
readonly rideauTitre: Signal<string | null>;          // titre de la scène qui se charge
readonly busy: Signal<boolean>;
sync(sessionId: string, currentSceneId: string | null, played: readonly string[]): void;
reload(): void;
selectScenario(id: string | null): void;
replaceScene(updated: BolSceneModel): void;
load(scene: BolSceneModel, mode: SceneLoadMode): Observable<BolSceneLoadResult | null>; // null si déjà occupé
```

- Produit : les composants suivants.

| Composant | Entrées | Sorties |
| --- | --- | --- |
| `bol-scene-acts` | aucune (lit le store) | `sceneChanged: void` |
| `bol-scene-preview` | `scene: BolSceneModel` (requis), `statut: ActeStatut \| null` | `loadRequested: SceneLoadMode`, `editRequested: void` |
| `bol-scene-ambiance` | `moment`, `meteo`, `danger` | aucune |
| `bol-rideau` | `etat: RideauEtat`, `titre: string \| null` | aucune |

- [ ] **Étape 1 : écrire les tests du store qui échouent** (`scene-stage.store.spec.ts`)
  - **Mise en place :** `TestBed` fournit `SceneStageStore` et des doubles :
    - `BolSceneService` : `scenes: () => of(SCENES)`, avec `s1`, `s2`, `s3` dans `sc1` et `libre` sans scénario ;
    - `BolScenarioService` : `scenarios: () => of([{id: 'sc1', titre: 'Le Sceau d’Ambre'}])` ;
    - `BolCatalogService` : `regions: () => of([{id: 5, region: 'Jungle de Qo et jungle de Qush'}])` ;
    - `SceneActionsService` : `loadAs: vi.fn()`.
  - Utiliser `vi.useFakeTimers()`.
  - Fixtures : `S2` est la scène `s2` de `SCENES`, `RESULT` un `BolSceneLoadResult` quelconque.

```ts
it('suit le scénario de la scène courante au premier sync', () => {
  store.sync('sess', 's2', ['s1']);
  expect(store.scenarioId()).toBe('sc1');
  expect(store.acts().map((a) => a.statut)).toEqual(['jouee', 'en-cours', 'a-venir']);
  expect(store.currentScene()?.id).toBe('s2');
  expect(store.regionNoms().get(5)).toBe('Jungle de Qo et jungle de Qush');
});

it('sans scène courante, montre les scènes sans scénario', () => {
  store.sync('sess', null, []);
  expect(store.scenarioId()).toBeNull();
  expect(store.acts().map((a) => a.scene.id)).toEqual(['libre']);
  expect(store.currentScene()).toBeNull();
});

it('ne charge qu’une fois sur un double clic', async () => {
  loadAs.mockReturnValue(of(RESULT));
  store.sync('sess', 's1', []);
  store.load(S2, 'replace').subscribe();
  const second = await firstValueFrom(store.load(S2, 'replace'));
  expect(second).toBeNull();
  vi.advanceTimersByTime(1000);
  expect(loadAs).toHaveBeenCalledTimes(1);
});

it('ferme le rideau pendant le chargement et le rouvre après', () => {
  loadAs.mockReturnValue(of(RESULT));
  store.sync('sess', 's1', []);
  const values: unknown[] = [];
  store.load(S2, 'replace').subscribe((v) => values.push(v));
  expect(store.rideau()).toBe('ferme');
  expect(store.rideauTitre()).toBe(S2.titre);
  vi.advanceTimersByTime(750);
  expect(values).toEqual([RESULT]);
  vi.advanceTimersByTime(250);
  expect(store.rideau()).toBe('ouvert');
  expect(store.busy()).toBe(false);
});

it('rouvre le rideau après une erreur', () => {
  loadAs.mockReturnValue(throwError(() => new Error('409')));
  store.sync('sess', 's1', []);
  store.load(S2, 'replace').subscribe({error: () => undefined});
  vi.advanceTimersByTime(1000);
  expect(store.rideau()).toBe('ouvert');
  expect(store.busy()).toBe(false);
});
```

- [ ] **Étape 2 : lancer et vérifier l'échec.** `npm test -- --watch=false scene-stage`.

- [ ] **Étape 3 : implémenter le store et `loadAs`.**
  - **Données :**
    - `sync` mémorise la session ;
    - au premier appel, ou si la scène courante n'est pas dans `scenes()`, il recharge scènes, scénarios et régions (les régions, une seule fois) ;
    - au premier chargement, `scenarioId` prend le scénario de la scène courante.
  - **Chargement (`load`) :**
    - il passe `busy` à vrai et `rideau` à `'ferme'` ;
    - il attend `forkJoin([timer(RIDEAU_FERMETURE_MS), loadAs(...)])` ;
    - à la fin (succès ou erreur), il remet `busy` à faux et rouvre après `timer(RIDEAU_PAUSE_MS)`.
  - **Constantes :** `RIDEAU_FERMETURE_MS = 750` et `RIDEAU_PAUSE_MS = 250`. Les deux valent 0 si `matchMedia('(prefers-reduced-motion: reduce)')` répond vrai. Vérifier `typeof matchMedia === 'function'` : jsdom ne l'a pas.
  - Relancer les tests : tout passe.

- [ ] **Étape 4 : écrire `bol-scene-ambiance`, `bol-scene-preview` et `bol-rideau`.**
  - **`skull.svg` :** une tête de mort pleine en 24 × 24, `fill="currentColor"`, enregistrée sous le nom `skull` dans `CUSTOM_SVG_ICONS`.
  - **`bol-scene-ambiance` :**
    - une puce par valeur renseignée ; elle ne rend rien si tout est nul ;
    - pour le danger, quatre `mat-icon svgIcon="skull"`, allumés jusqu'à la valeur, sous `role="img"` avec `aria-label="Danger N sur 4"`.
  - **`bol-scene-preview` (largeur 20rem) :**
    - vignette en 16:9 d'après `sceneDecor` ;
    - lieu, titre, ambiance ;
    - portraits ronds de 2.2rem, d'après `distributionPortraits` sur `CombatSelectionService.catalog()`, avec « ×3 » quand `qty > 1` ;
    - les boutons décrits dans « Ce que la page doit faire », § 1.
  - **`bol-rideau` :**
    - `aria-hidden="true"`, `position: absolute; inset: 0`, au-dessus du contenu de `.cp-table` ;
    - deux pans `bol-rideau-pan` en velours (dégradé `#5a0f12` → `#2a0608`, plis en `repeating-linear-gradient`) ;
    - `transition: transform 750ms cubic-bezier(.7, 0, .3, 1)` ; le titre apparaît en 300 ms après 400 ms ;
    - sous `prefers-reduced-motion: reduce` : opacité seulement, sans transition.

- [ ] **Étape 5 : écrire `bol-scene-acts`.**
  - **Structure :** `<nav aria-label="Scènes du scénario"><ol>…`.
  - **Le scénario :** un `mat-stroked-button` (icône `auto_stories`, titre du scénario ou « Sans scénario ») avec un `mat-menu` des scénarios triés.
  - **Chaque acte :**
    - un bouton avec `[matMenuTriggerFor]="apercu"`, `[matMenuTriggerData]="{acte}"`, `aria-label="Scène 2, Embuscade au gué du Tyr, en cours"` et `aria-current="step"` sur l'acte en cours ;
    - un seul `<mat-menu #apercu class="sca-apercu">` avec `<ng-template matMenuContent let-acte="acte">` qui rend `bol-scene-preview`.
  - **Les sorties de l'aperçu :**
    - `loadRequested` appelle `store.load`, puis émet `sceneChanged` sur un résultat non nul ; une erreur ouvre le snackbar `extractApiErrorMessage(error, 'Impossible de charger la scène.')` ;
    - `editRequested` appelle `openSceneEditor`, puis `store.replaceScene`.
  - **Catalogue :** le constructeur appelle `CombatSelectionService.loadCatalog()`, comme `bol-reserve`, pour que les portraits de l'aperçu soient disponibles même coulisses fermées.
  - **Petits écrans :** sous 56rem, la frise passe sur sa propre ligne et défile horizontalement.

- [ ] **Étape 6 : brancher l'en-tête et la page.**
  - **`session-header.html` :** entre `.cp-header-title` et `.cp-header-actions`, un `<div class="cp-header-center"><ng-content /></div>` (`flex: 1; min-width: 0`).
  - **La page :**
    - `providers: [SceneStageStore]` ;
    - un `effect` appelle `stage.sync(session.id, session.scene_id ?? null, session.scenes_jouees ?? [])` à chaque session chargée ;
    - en mode libre, projeter `<bol-scene-acts (sceneChanged)="onSceneChanged()" />` dans l'en-tête ;
    - rendre `<bol-rideau [etat]="stage.rideau()" [titre]="stage.rideauTitre()" />` dans `.cp-table` ;
    - `onSceneChanged` appelle aussi `stage.reload()`.
  - La réserve et le tapis restent en place pour l'instant.

- [ ] **Étape 7 : vérifier à la main** (4400).
  - La frise apparaît ; l'aperçu s'ouvre ; « Lever le rideau » ferme le rideau et le rouvre sur la scène chargée.
  - Le titre de l'en-tête change ; l'acte précédent prend la coche.
  - Avec le mouvement réduit (DevTools, Rendering), il n'y a plus d'animation.

- [ ] **Étape 8 : vérifications du front, puis point de contrôle.** Message proposé : `feat(theatre): frise des actes, aperçu et rideau`.

---

### Tâche 5 : la troupe et la compagnie remplacent le tapis

**Fichiers :**
- Créer : `front/src/app/bol/session/play/theatre/acteur.ts`, `.html`, `.scss`, `troupe.ts`, `.html`, `.scss`, `compagnie.ts`, `.html`, `.scss`
- Modifier :
  - `front/src/app/bol/session/models/tapis.model.ts`, `front/src/app/bol/session/play/tapis/tapis.util.ts`, `tapis.util.spec.ts`, les fixtures `TapisCard` de `combat-turn.util.spec.ts` ;
  - `front/src/app/bol/session/play/theatre/theatre.util.ts`, `theatre.util.spec.ts` ;
  - `front/src/app/bol/session/play/session-play-page.ts`, `.html`, `.scss`
- Supprimer : `front/src/app/bol/session/play/tapis/tapis.ts`, `tapis.html`, `tapis.scss`, `character-card.ts`, `character-card.html`, `character-card.scss`

**Interfaces :**
- Produit : `TapisCard` gagne `readonly joueur: string | null` et `readonly heroisme: number | null`. Les deux sont renseignés pour un héros (`heros.origines.joueur`, `heros.ressources.heroisme`) et valent `null` sinon.
- Produit (`theatre.util.ts`) :
  - `troupe(cards: readonly TapisCard[]): TroupeCard[]` : camp `adversaires`, trié par rang, puis par type (`hero`, `pnj`, `creature`, `demon`), puis par `pivotId` ; la `taille` vient de `card.rang` ;
  - `compagnie(cards: readonly TapisCard[]): {heros: TapisCard[]; allies: TapisCard[]}`.
- Produit : les composants suivants.

| Composant | Entrées | Sorties |
| --- | --- | --- |
| `bol-acteur` | `card: TapisCard` (requis), `taille: TroupeTaille` (requis), `selected: boolean` | `toggled: MouseEvent` |
| `bol-troupe` | `cards`, `selectedKeys` | `cardToggled`, `selectToggled`, `campToggleRequested` (chacune `TapisCard`), `coulissesRequested: void` |
| `bol-compagnie` | `cards`, `sessionId`, `selectedKeys` | `cardToggled`, `selectToggled`, `campToggleRequested`, `changed: void` |

- [ ] **Étape 1 : écrire les tests qui échouent**
  - **Dans `tapis.util.spec.ts` :** « donne le joueur et l'héroïsme des héros ». Fixture : un héros avec `origines.joueur: 'Clara'` et `ressources.heroisme: 3`, plus un PNJ.
    - Carte du héros : `joueur` `'Clara'`, `heroisme` `3`.
    - Carte du PNJ : `joueur` et `heroisme` à `null`.
  - **Dans `theatre.util.spec.ts` :**

```ts
it('troupe : seulement les présents, rival puis coriace puis piétaille', () => {
  const cards = [card('creature-3', 'Piétaille'), card('pnj-1', 'Coriace'), card('pnj-2', 'Rival'), card('creature-4', 'Piétaille', 'heros')];
  expect(troupe(cards).map((t) => [t.card.key, t.taille])).toEqual([['pnj-2', 'rival'], ['pnj-1', 'coriace'], ['creature-3', 'pietaille']]);
});

it('compagnie : les héros, puis les alliés', () => {
  const cards = [card('pnj-2', 'Rival', 'heros'), heroCard('hero-1'), card('pnj-1', 'Coriace')];
  expect(compagnie(cards)).toEqual({heros: [cards[1]], allies: [cards[0]]});
});
```

(`card(key, rang, camp = 'adversaires')` et `heroCard(key)` : petites fabriques locales de `TapisCard`.)

- [ ] **Étape 2 : lancer et vérifier l'échec.** `npm test -- --watch=false tapis.util theatre.util`.

- [ ] **Étape 3 : implémenter.** Ajouter les deux champs dans `buildTapisCards` et dans les fixtures (`joueur: null, heroisme: null`), puis écrire `troupe` et `compagnie`. Relancer : tout passe.

- [ ] **Étape 4 : écrire `bol-acteur`.**
  - **Structure :** un `<button>` avec `aria-label` = `cardAriaLabel(card)`, et `aria-pressed` quand il est sélectionné.
  - **Taille :** largeur et hauteur par `--w` / `--h` selon `taille`, aux valeurs du § 2 (allié : 6.4 × 8.8rem).
  - **Contenu :**
    - le portrait en `object-fit: cover`, avec le repli sur l'icône du type comme dans l'ancienne `character-card` (`combatantKindIcon`, `EMPTY_AVATAR`, `avatarFailed`) ;
    - le rang en haut à gauche (« Allié » pour un allié), coloré par `--dw-color-rival` pour un rival ;
    - en bas : le nom (1.12rem pour un rival, 0.8rem pour la piétaille) et la barre de vitalité (`vitalitePercent`, `isLowVitalite`).
  - **États :** classe `act--tombe` (portrait en `grayscale(1)`, opacité 0.7) quand la vitalité courante vaut 0 ou moins.

- [ ] **Étape 5 : écrire `bol-troupe`.**
  - **Structure :** `<section data-drop-camp="adversaires" aria-label="En scène">`.
  - **Glisser-déposer :** reprendre tel quel la logique de l'ancien `TapisComponent` (`ReservePlacementService` : `startDrag`, `campAt`, `endDrag`, aperçu `*cdkDragPreview`, `rejectDrop`, classes `--droppable` et `--hot`).
  - **Les cartes :**
    - elles reposent sur la rampe : `align-items: flex-end`, avec un sol éclairé en `radial-gradient(60% 100% at 50% 100%, rgba(232, 135, 58, .28), transparent)` ;
    - piétaille consécutive : `margin-left: -2.6rem`, et `z-index` relevé au survol et au focus.
  - **Défilement :** la liste défile dans un `dw-scroller` (`label="En scène"`).
  - **Gestes :** Ctrl/Cmd + clic émet `selectToggled`, un clic simple émet `cardToggled`.
  - **État vide :** le texte et le bouton du § 2.

- [ ] **Étape 6 : écrire `bol-compagnie`.**
  - **Structure :** `<section data-drop-camp="heros" aria-label="La compagnie">`.
  - **Une plaque par héros, en grille `minmax(17.5rem, 1fr)` :**
    - le portrait en bouton (`cardToggled`) ;
    - le nom et le joueur ;
    - la vitalité : boutons `aria-label="Retirer 1 point de vitalité à Grimar"` / `"Rendre …"`, une barre et le texte `vitaliteText` ;
    - l'héroïsme : boutons − / + et gemmes `heroismeGems(card.heroisme ?? 0)` dans un `role="img"` avec `aria-label="N points d’héroïsme"`.
  - **Les alliés :** `bol-acteur` de taille `allie`, déplaçables vers la troupe (même logique de glisser).
  - **Enregistrement des pas :**
    - vitalité : `BolFightSessionService.applyDamage(sessionId, 'hero', pivotId, ±1)` ;
    - héroïsme : `BolHerosService.adjustHeroisme(sourceId, ±1)`, avec le bouton − désactivé à 0 ;
    - chaque pas émet `changed` ;
    - un pas est ignoré tant que le précédent du même héros n'est pas revenu (un `Set` des clés en cours) ;
    - une erreur ouvre un snackbar.

- [ ] **Étape 7 : brancher la page et supprimer le tapis.**
  - Dans `.spp-main`, `<bol-tapis>` est remplacé par `<bol-troupe>` puis `<bol-compagnie>`.
  - **Sorties :**
    - `cardToggled` → `onCardToggled` ;
    - `selectToggled` → `toggleSelected` ;
    - `campToggleRequested` → `toggleCamp` ;
    - `changed` → `reloadSession` ;
    - `coulissesRequested` → ouvrir la réserve (méthode `openReserve()`, qui met `reserveOpen` à vrai et le retient).
  - Supprimer les six fichiers du tapis et de `character-card`, ainsi que leurs imports.
  - Mettre à jour le commentaire de `expanded-card.ts:119`, qui cite `TapisComponent`.

- [ ] **Étape 8 : vérifier à la main** (4400).
  - Poser un PNJ par glisser : il entre dans la troupe à la bonne taille.
  - Le glisser sur la compagnie : il devient allié.
  - Retirer et rendre de la vitalité, puis de l'héroïsme : les valeurs tiennent après un rechargement de la page.
  - Ctrl + clic puis Suppr : la carte est retirée.

- [ ] **Étape 9 : vérifications du front, puis point de contrôle.** `knip` doit être muet : plus aucun reste du tapis. Message proposé : `feat(theatre): troupe et compagnie remplacent le tapis`.

---

### Tâche 6 : le plateau et les coulisses

**Fichiers :**
- Créer : `front/src/app/bol/session/play/theatre/theatre.ts`, `.html`, `.scss`, `scene-decor.ts`, `braises.ts`, `scene-cartouche.ts`, `scene-lecture.ts`, `.html`, `.scss`
- Modifier :
  - `front/src/app/bol/session/play/session-play-page.ts`, `.html`, `.scss` ;
  - `front/src/app/bol/session/play/session-header/session-header.ts`, `.html` ;
  - `front/src/app/bol/session/play/command-palette/command-palette.util.ts` et sa spec ;
  - `front/src/app/bol/session/play/table-state.util.ts` (pas de changement de clé ; seule la valeur par défaut, lue dans la page, passe à `false`)

**Interfaces :**
- Consomme : le store (tâche 4), `bol-troupe` et `bol-compagnie` (tâche 5), `bol-scene-ambiance` et `bol-scene-preview` (tâche 4), `openSceneEditor` (tâche 3).
- Produit : les composants suivants.

| Composant | Entrées | Sorties |
| --- | --- | --- |
| `bol-theatre` | `cards`, `sessionId`, `selectedKeys` | `cardToggled`, `selectToggled`, `campToggleRequested`, `sceneChanged`, `changed`, `coulissesRequested` (mêmes types qu'aux tâches 4 et 5) |
| `bol-scene-decor` | `scene: BolSceneModel \| null` | aucune |
| `bol-braises` | aucune | aucune |
| `bol-scene-cartouche` | `scene: BolSceneModel \| null`, `regionNom: string \| null`, `acte: SceneActe \| null`, `total: number` | aucune |
| `bol-scene-lecture` | `scene: BolSceneModel \| null`, `acts: readonly SceneActe[]` | `sceneChanged: void` |

- `bol-session-header` gagne l'entrée `coulissesOpen: boolean` et la sortie `coulissesToggled: void`.

- [ ] **Étape 1 : adapter la spec de la barre de commande (échec attendu).** Dans `command-palette.util.spec.ts`, l'action `toggleReserve` doit afficher « Fermer les coulisses » quand `reserveOpen` vaut vrai, et « Ouvrir les coulisses » sinon. Lancer `npm test -- --watch=false command-palette` : échec.

- [ ] **Étape 2 : changer le libellé** dans `command-palette.util.ts:48`. Relancer : tout passe.

- [ ] **Étape 3 : écrire `bol-scene-decor` et `bol-braises`.**
  - **`bol-scene-decor` :**
    - `decor = computed(() => sceneDecor(imageFailed() && scene ? {...scene, image: null} : scene, REGION_MAP_COORDINATES))`, où `imageFailed` est un `linkedSignal` remis à `false` à chaque changement de `scene()?.image` ;
    - une image : `<img alt="" (error)="imageFailed.set(true)">` en `object-fit: cover`, avec `filter: saturate(.9) brightness(.72)` ;
    - la carte : `background: url('/assets/bol/cartes/carte.jpg') {x}% {y}% / 300% auto`, avec les filtres du § 2 ;
    - un voile `::after` en dégradé (bas et bords à `rgba(0, 0, 0, .75)`).
  - **`bol-braises` :**
    - un canvas `aria-hidden="true"` dimensionné par `ResizeObserver` ;
    - 36 particules qui montent en dérivant, d'opacité 0.2 à 0.8, de couleur lue sur `--bar-ember` ;
    - la boucle `requestAnimationFrame` s'arrête si `prefers-reduced-motion: reduce`, si `document.hidden`, ou à la destruction (`DestroyRef`).

- [ ] **Étape 4 : écrire `bol-scene-cartouche` et `bol-scene-lecture`.**
  - Le cartouche suit le § 2, y compris l'état vide.
  - **La lecture :**
    - suit le § 2 ;
    - `secretVisible = linkedSignal(() => { this.scene()?.id; return false; })` ;
    - les pistes reliées cherchent leur scène dans `acts` : pas d'acte, pas de bouton ;
    - le bouton « Scène N » ouvre un `mat-menu` avec `bol-scene-preview`, branché comme dans `bol-scene-acts` (`store.load`, puis `sceneChanged`) ;
    - « Préparer la scène » appelle `openSceneEditor` avec `siblings` = les scènes de `acts` sans la scène courante, puis `store.replaceScene`.

- [ ] **Étape 5 : écrire `bol-theatre`.**
  - **Mise en page :** une grille sur toute la hauteur disponible.

```
┌───────────────── plateau (décor + braises en fond) ──────────────┐
│ cartouche                                     │ lecture (24rem)  │
│                                               │ défile seule     │
│ troupe (rampe, en bas)                        │                  │
├──────────────────────────────────────────────────────────────────┤
│ compagnie                                                        │
└──────────────────────────────────────────────────────────────────┘
```

  - `grid-template-columns: minmax(0, 1fr) 24rem` et `grid-template-rows: auto minmax(0, 1fr) auto` sur le plateau.
  - **Sous 70rem :** une seule colonne ; la lecture passe sous la troupe et le plateau défile verticalement. **Aucune largeur fixe ne doit dépasser l'écran** : `minmax(0, 1fr)` partout.
  - **Données :** le cartouche et la lecture lisent `store.currentScene()`, `store.currentActe()`, `store.acts()` et `store.regionNoms()` ; le `total` du cartouche vaut `store.acts().length`.
  - **Sorties :** les sorties de la troupe, de la compagnie et de la lecture sont relayées telles quelles.

- [ ] **Étape 6 : brancher les coulisses et la page.**
  - **Mode libre :** `.spp-body`, avec la colonne de réserve et sa languette, est remplacé par :
    - un `<mat-sidenav-container class="spp-coulisses">` ;
    - dedans, un `<mat-sidenav position="end" mode="over" [opened]="reserveOpen()" (closed)="closeReserve()">`, de 21rem, qui contient un en-tête (« Coulisses », bouton de fermeture `aria-label="Fermer les coulisses"`) et `bol-reserve`, avec ses entrées et sorties actuelles ;
    - à côté, `<mat-sidenav-content>` avec `<bol-theatre>` (`sceneChanged` → `onSceneChanged`, `changed` → `reloadSession`, `coulissesRequested` → `openReserve`).
  - **`reserveOpen` :**
    - se lit avec `readPanelOpen(browserStorage(), RESERVE_PANEL_KEY, false)` ;
    - `toggleReserve`, `openReserve` et `closeReserve` l'écrivent.
  - **En-tête :** `[coulissesOpen]="reserveOpen()"` et `(coulissesToggled)="toggleReserve()"`.
    - Le bouton n'apparaît qu'en mode libre ; il porte l'icône `theater_comedy`, le libellé « Coulisses », et `aria-expanded` / `aria-controls="spp-coulisses-panel"`.
  - Supprimer les styles `spp-reserve*` devenus inutiles.

- [ ] **Étape 7 : vérifier à la main** (4400), à 1440 × 900 puis 1024 × 768.
  - Le plateau montre décor, cartouche, lecture, troupe et compagnie.
  - Le secret est flouté puis s'affiche, et redevient flouté au changement de scène.
  - Une piste reliée ouvre l'aperçu.
  - Les coulisses s'ouvrent, et un personnage glissé sur la troupe y entre.
  - Échap ferme les coulisses.
  - La console n'a aucune erreur.

- [ ] **Étape 8 : vérifications du front, puis point de contrôle.** Message proposé : `feat(theatre): plateau et coulisses`.

---

### Tâche 7 : l'attitude des personnages

**Fichiers :**
- Créer : `backend/database/migrations/2026_10_16_100100_add_attitude_to_bol_fight_session_rows.php`
- Modifier (back) :
  - `backend/app/Http/Services/Bol/BolSceneDistribution.php`, `backend/tests/Unit/BolSceneDistributionTest.php` ;
  - `backend/app/Http/Services/Bol/BolSceneService.php` (`distributionOf`, `loadIntoSession`), `backend/app/Http/Services/Bol/BolFightSessionService.php` (`setAttitude`) ;
  - `backend/app/Http/Controllers/Bol/BolFightSessionController.php` (`setAttitude`), `backend/routes/api.php` ;
  - `backend/app/Models/Bol/BolFightSessionPnj.php`, `BolFightSessionCreature.php`, `BolFightSessionDemon.php` (`fillable`)
- Modifier (front) :
  - `front/src/app/bol/models/bol-fight-session.model.ts`, `bol-scene.model.ts`, `front/src/app/bol/services/bol-fight-session.service.ts` ;
  - `front/src/app/bol/session/models/tapis.model.ts`, `tapis.util.ts` (+ spec, fixtures) ;
  - `front/src/app/bol/session/play/theatre/theatre.util.ts` (+ spec), `acteur.*` ;
  - `front/src/app/bol/session/play/tapis/expanded-card.ts`, `.html`

**Interfaces :**
- Produit (API) : `PATCH /bol/fight-session/{id}/combatant/{kind}/{pivotId}/attitude` avec le corps `{attitude: 'hostile'|'mefiant'|'neutre'|'amical'|null}`. La route renvoie la session, ou 404 comme `setCamp`.
- Produit (API) : chaque ligne PNJ, créature ou démon porte `attitude`, et chaque entrée de distribution aussi.
- Produit (PHP) : `BolSceneDistribution::ATTITUDES` et `BolSceneDistribution::entryAttitude(array $entry): ?string`.
- Produit (TS) :
  - `type CombatantAttitude = 'hostile' | 'mefiant' | 'neutre' | 'amical'` (dans `bol-fight-session.model.ts`) ;
  - `BolSceneEntry.attitude?: CombatantAttitude | null` ;
  - `TapisCard.attitude: CombatantAttitude | null` ;
  - `BolFightSessionService.setAttitude(sessionId: string, kind: 'pnj' | 'creature' | 'demon', pivotId: number, attitude: CombatantAttitude | null): Observable<BolFightSessionModel>` ;
  - `ATTITUDES: readonly AmbianceOption<CombatantAttitude>[]` (dans `theatre.util.ts`).

- [ ] **Étape 1 : écrire les tests back qui échouent**, dans `BolSceneDistributionTest` :
  - `test_from_session_keeps_attitude` : une ligne PNJ avec `'attitude' => 'mefiant'` donne une entrée avec `'attitude' => 'mefiant'` ; une ligne sans attitude donne `null` ;
  - `test_entry_attitude_rejects_unknown` : `entryAttitude(['attitude' => 'furieux'])` vaut `null`, et `entryAttitude(['attitude' => 'amical'])` vaut `'amical'`.
  - Lancer (copie dans le conteneur) : échec.

- [ ] **Étape 2 : implémenter le back.**
  - **Migration :** `string('attitude', 10)->nullable()->after('camp')` sur les trois tables de lignes.
  - **Distribution :** `fromSession` ajoute `'attitude' => self::entryAttitude($row)` ; `distributionOf` sélectionne la colonne `attitude`.
  - **Chargement (`loadIntoSession`) :** une attitude non nulle est écrite sur les lignes créées.
  - **Route :** `setAttitude` suit le patron de `setCamp`, avec la validation `'attitude' => ['present', 'nullable', Rule::in(BolSceneDistribution::ATTITUDES)]`.
  - **Modèles :** `fillable` des trois modèles de lignes.
  - Relancer les tests : tout passe. Migrer.

- [ ] **Étape 3 : écrire les tests front qui échouent.**
  - Dans `tapis.util.spec.ts` : la carte d'un PNJ avec `attitude: 'amical'` porte `attitude` `'amical'`, et celle d'un héros `null`.
  - Dans `theatre.util.spec.ts` : `ATTITUDES.map((a) => a.label)` vaut `['Hostile', 'Méfiant', 'Neutre', 'Amical']`.

- [ ] **Étape 4 : implémenter le front.**
  - **Types et service :** les types, le champ de carte (fixtures : `attitude: null`) et `setAttitude`.
  - **`ATTITUDES` (valeur, libellé, icône) :**
    - hostile, « Hostile », `sentiment_very_dissatisfied` ;
    - mefiant, « Méfiant », `visibility` ;
    - neutre, « Neutre », `remove` ;
    - amical, « Amical », `handshake`.
  - **Pastilles, dans `acteur.scss` :** hostile `--dw-color-echec`, méfiant `--dw-color-warn`, neutre `--dw-surface-500`, amical `--dw-color-reussite`.
  - **`bol-acteur` :** la pastille et le libellé en bas à gauche, pour le camp `adversaires`. L'`aria-label` de la carte s'y termine par « , méfiant ».
  - **`expanded-card` :** pour une carte non héros du camp `adversaires`, un `mat-button-toggle-group` « Attitude envers les héros » sous l'en-tête. Un nouveau clic sur la valeur choisie la remet à `null`. Il appelle `setAttitude`, puis `data.changed()` ; une erreur ouvre un snackbar.
  - Relancer les tests : tout passe.

- [ ] **Étape 5 : vérifier à la main.**
  - Régler un PNJ sur « Méfiant » : la pastille apparaît.
  - Enregistrer la table comme scène, la recharger en remplacement : l'attitude revient.

- [ ] **Étape 6 : vérifications front et back, puis point de contrôle.** Message proposé : `feat(theatre): attitude des personnages en scène`.

---

### Tâche 8 : parcours navigateur et bilan

**Fichiers :**
- Créer : `front/scripts/e2e-theatre.mjs`

**Interfaces :**
- Consomme : tout ce qui précède.
- Modèle : `front/scripts/e2e-petit-bouclier.mjs` (connexion par `/api/auth/login`, jeton dans `sessionStorage['diceway-session']`, `APP_URL` par défaut `http://localhost:4400`).

- [ ] **Étape 1 : écrire le script.**
  - **Préparation par l'API :**
    - créer une session `TMP théâtre` avec le premier héros, plus un PNJ (`sourceId: '2'`) ;
    - créer la scène `TMP Gué` depuis la table (sans scénario) ;
    - la préparer avec `region_id: 5`, `lieu`, `moment: 'crepuscule'`, `meteo: 'pluie'`, `danger: 3`, un `lecture` de 3000 caractères, `notes`, une piste ;
    - retirer le PNJ de la table, puis ajouter 10 créatures (`qty` 10, première créature de `GET /api/bol/creatures` ; son rang importe peu, il faut dix cartes).
  - **Contrôles, dans l'ordre :**
    1. Ouvrir `/session/{id}/play` à 1440 × 900.
    2. Ouvrir l'acte « TMP Gué », puis cliquer « Lever le rideau ». Attendre que `bol-rideau` passe fermé puis ouvert. Le titre du cartouche vaut « TMP Gué ».
    3. Les 10 créatures ont été remplacées par le PNJ, qui est dans `bol-troupe`.
    4. Cliquer « Afficher le secret » : `aria-pressed="true"`.
    5. Ouvrir les coulisses, double-cliquer le premier PNJ de la liste : la troupe compte une carte de plus.
    6. Remettre 10 piétailles par l'API, recharger. À 1440 puis à 1024 : `document.documentElement.scrollWidth <= innerWidth`.
    7. Mettre `image: '/assets/bol/nexiste-pas.jpg'` par l'API et recharger : le décor porte la classe de la carte.
    8. La console n'a aucune erreur.
    9. Prendre des captures dans le dossier temporaire de la session.
  - **Nettoyage :** dans un `finally`, supprimer la scène et la session `TMP`.

- [ ] **Étape 2 : lancer le script** contre un `npx ng serve --port 4400` à soi : `node front/scripts/e2e-theatre.mjs`. Attendu : « OK » et le code de sortie 0. Arrêter ensuite son propre serveur (son pid), pas celui du 4200.

- [ ] **Étape 3 : passe d'accessibilité.** Avec le serveur 4400, lancer AXE sur la page (le panneau AXE du navigateur, ou `@axe-core/playwright` installé temporairement sans l'ajouter au `package.json`). Attendu : aucune violation sérieuse ni critique. Corriger les contrastes au besoin, dans les SCSS des composants du théâtre.

- [ ] **Étape 4 : vérifications finales.**
  - **Front :** les quatre commandes des contraintes globales.
  - **Back :** `BolScenePreparationTest` et `BolSceneDistributionTest`.
  - **Bilan :** remettre à Lionel les captures et les commits proposés de chaque tâche.

---

## Hors périmètre

Ces sujets feront des plans séparés quand Lionel les demandera :
- **Journal de séance :** entrées horodatées, pistes cochées, jets.
- **Table d'événements d6 par scène :** reprise du Paravent.
- **Vue Atlas :** carte du scénario et trajet de la compagnie.
- **Téléversement d'illustrations.**
- **Mode combat :** le théâtre ne le touche pas.
