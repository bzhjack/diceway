# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Diceway** is a role-playing game companion app for **Barbarians of Lemuria (BoL)**. It supports character creation, creature/demon/NPC management, and live game sessions.

- **Frontend**: Angular 22 app in `/front/`
- **Backend**: Laravel 13 REST API in `/backend/`
- Game documentation: one folder per game under `/doc/` — `/doc/bol/` (Barbarians of Lemuria), `/doc/cyberpunk/` (Cyberpunk RED, being modelled; rules in `doc/cyberpunk/rules/` from `00-index.md`, reference data in `doc/cyberpunk/resources/`, rulebook text in `doc/cyberpunk/pdf-text/`, PDF page = book page + 4); layout in `doc/README.md`
- **Reference screen**: the smallest screen Diceway is designed for is a desktop browser window of about **1440 × 704 CSS px** (the home page was given as the reference on 2026-11-07: a 1795 × 880 px capture at 125 % scaling, where `.acc-cadre`, 1360 CSS px, measures 1700 px). Lay out and mock up screens at that size first: what a screen is for should fit without scrolling. No phone or tablet layouts.


## Commands

### Frontend (`front/`)

```bash
npm start          # Dev server on localhost:4200 (proxies API to localhost:8080)
npm run build      # Production build — run this to validate any frontend change
npm test           # Unit tests with Vitest
npm run lint       # ESLint and Stylelint — run this too after any frontend change
npm run lint:prune # After fixing a listed debt: lowers the counts in the suppression files
npm run watch      # Incremental dev build
```

> `eslint-suppressions.json` and `stylelint-suppressions.json` count the existing debts: never add to them to get past the lint, fix the new violation.

### Backend (`backend/`)

```bash
php artisan serve              # Dev server on port 8080
php artisan migrate            # Run migrations
php artisan test               # PHPUnit tests — run the closest test to validate any backend change

# Docker
npm run docker:build           # Build image (diceway-app)
npm run docker:start           # docker-compose up + mailpit
npm run docker:exec            # Shell into container
```

> `backend/package.json` is only for Vite asset bundling on the Laravel side, not a Node app.

> `php artisan test` runs on in-memory SQLite, forced by `phpunit.xml` and enforced by `tests/TestCase.php`: `RefreshDatabase` wipes the database it runs on, so it must never reach the real MySQL. The container only mounts `app/` and `database/`: after changing `tests/` or `phpunit.xml`, `docker cp` them into `/var/www/html/` before running the tests there.

### Scenario import

Scenarios live in each machine's database, not in git: after a pull that brings new JSON files under `doc/bol/scenarios/<saga>/app/`, import them on this machine (the container only mounts `app/`, so copy the file first). Full format and behaviour: `doc/bol/scenarios/format-import.md`.

```bash
# from the repo root
docker cp doc/bol/scenarios/le-dieu-voile/app/ch1.json diceway:/tmp/ch1.json
docker exec diceway php artisan bol:import-scenario /tmp/ch1.json --user=<email> --dry-run   # validate only
docker exec diceway php artisan bol:import-scenario /tmp/ch1.json --user=<email>             # import
```

- Import a saga's chapters **in order** (e.g. `intro`, then `ch1`…`ch5`): a chapter reuses characters created by earlier ones, so a dry-run of a later chapter fails until the earlier ones are really imported.
- Re-importing updates what the file created (`bol_import_ref`), without duplicates, but **overwrites** sheets edited in the app since.
- Check what is already imported: `docker exec diceway php artisan tinker --execute='echo json_encode(DB::table("bol_import_ref")->select("saga", DB::raw("count(*) n"))->groupBy("saga")->get());'`

## Vocabulary (UI)

What the screens call things — keep to these words in any visible text:
- **Scénario** › **Chapitre** › **Scène**. A scénario (« Perle du Beshaar ») is a `BolSaga` (table `bol_saga`); a chapitre, a `BolScenario` (its `saga_id`, its `numero`: 0 for the introduction, null without number; `titre` is the chapter's name only); a scène, a `BolScene`. Every chapitre has a scénario: there is no « one shot » (a scénario of one chapter is a scénario like any other). Where a chapter is written in one piece (import file, « Nouveau chapitre » at the table), `Scénario — 1. Nom` is split by `BolTitreChapitre`; without « — », the chapter goes in a scénario of its own name; the screens compose it back with `titreDeChapitre` (`bol/session/scenario.util.ts`).
- **Compagnie**: a `BolCompagnie`, a name and heroes of the account, created with « Nouvelle compagnie ». **Partie**: a `BolFightSession` seen from the home page, created with « + Partie »: a compagnie on one scénario (a compagnie can play several, each once; without chapter it is a « partie improvisée »). It copies the compagnie's heroes at creation and follows its name (`titre`). **Table**: the same record on the play screen (never « session » in the UI).

## Business rules & reference data

Each game's documentation follows the same layout (`resources/`, `rules/`, `pdf-text/`, `specs/`, `scenarios/`, `image-prompts/`, `plans/`): look in the folder of the game the task is about. For BoL, when a task touches game rules, character creation, equipment, careers, languages, traits, or activation:
1. Check `/doc/bol/resources/` first — authoritative reference data (weapons, armor, careers, languages, advantages, disadvantages, regions, bestiary, demons, NPCs).
2. Use `/doc/bol/rules/` for additional context or mechanics not covered in `/doc/bol/resources/`.
3. To verify a rule against the original rulebook, grep `/doc/bol/pdf-text/` — pre-extracted text of the rulebook PDF, one file per chapter (see its README; PDF page = book page + 2). Do not re-run `pdftotext` on the PDF.

`/doc/bol/rules/` was audited against the rulebook PDF on 2026-06-10: all numeric tables and formulas are accurate.

## Angular conventions (`front/`)

### TypeScript
- Strict type checking; avoid `any`, use `unknown` when type is uncertain.
- Prefer type inference when the type is obvious.

### Components
- **Standalone by default** — never set `standalone: true` explicitly (it's the default since Angular v20).
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- Use `input()` and `output()` functions instead of `@Input()`/`@Output()` decorators.
- Do NOT use `@HostBinding` or `@HostListener` — put host bindings in the `host` object of `@Component`/`@Directive`.
- Do NOT use `ngClass` or `ngStyle` — use `class` and `style` bindings instead.
- Use native control flow (`@if`, `@for`, `@switch`) — not `*ngIf`, `*ngFor`, `*ngSwitch`.
- Keep templates simple; no arrow functions and no globals (e.g. `new Date()`) in templates.
- Use `NgOptimizedImage` for all static images (not for inline base64).
- Prefer inline templates for small components.
- External templates/styles: use paths relative to the component `.ts` file.

### Styling
- If an element carries a custom (non-Tailwind) class alongside Tailwind utility classes, fold the utilities' styles into the custom class's CSS so the element ends up with only that one class (e.g. `class="dw-row-stat ml-auto min-w-0 truncate"` → move `margin-left`/`min-width`/`truncate` into `.dw-row-stat`, leaving `class="dw-row-stat"`).
- Exception: shared cross-page layout primitives (`dw-section--form`, `dw-page`, …) may be combined with page-specific Tailwind utilities — don't fold page-specific composition into a primitive used by other pages. If a page needs its own variant, add a small local modifier class instead (e.g. `hfp-rail-panel` for `xl:sticky xl:top-4`).
- An element with only Tailwind utility classes (no custom class) is fine as-is — this rule only applies once a custom class is already present.
- Multiple custom classes together (e.g. BEM-style `hs-block hs-block--attr`) are not a violation — the rule targets mixing custom classes with Tailwind utilities, not custom classes with each other.

### Button shapes
- **Action** (does something: Ajouter, Fin du tour, Lancer, Parade…) → pill: Material buttons as-is, custom buttons `border-radius: var(--dw-radius-pill)`.
- **Toggle** (on/off state or a choice in a group, carries `aria-pressed`: Dé bonus MJ, weapon/career chips, tabs, segmented choices, `mat-button-toggle`) → rectangle `border-radius: var(--dw-radius-toggle)` (6px). A Material button used as a toggle sets `--mat-button-*-container-shape` to that token.
- **Icon-only button** (dice, ×, the −/+ of a counter, chevrons) → circle (`50%`, or `mat-icon-button` without shape override).
- **Primary action** of a screen, header, card or dialog (Démarrer / Terminer le combat, Fin du tour, Appliquer, Lancer, Commencer le combat, the confirm button of a dialog) → solid gold fill: `mat-flat-button`, or for a custom button `background: var(--dw-color-legendary)` with dark text — flat, no gradient or 3D shadow. Secondary actions stay outlined (`mat-stroked-button` / `matButton="outlined"`); one filled button per zone. In the header of a library or hub page, that gold button is the way back (« Retour… »), see Library pages.
- Out of scope: portraits, avatars, cards, tiles, list rows and links inside text.
- Shape is never the only signal: a toggle keeps `aria-pressed` and a visible "on" state. A class used for both kinds styles the toggles with `&[aria-pressed]`.
- Tokens live in `front/src/styles/_tokens.scss`.

### State
- Signals for local state; `computed()` for derived state.
- Use `.update()` or `.set()` on signals — not `.mutate()`.
- Keep state transformations pure.

### Forms
- Signal Forms only (`@angular/forms/signals`): ESLint forbids importing `@angular/forms`. `dw-value-stepper` is a `FormValueControl`: `[formField]` in a form, with its bounds in the schema (`min()`, `max()`: Angular refuses `[min]` next to `[formField]`); `[value]` and `(valueChange)` for a lone number.

### Services
- `inject()` function instead of constructor injection.
- `providedIn: 'root'` for singleton services.
- Single responsibility per service.

### Models (types)
- Never declare an exported `interface` / `type` / `enum` in a component, dialog, directive, service or `*.util.ts` file: put it in a `models/` folder, in a file named `<name>.model.ts` (without the `.component` / `.service` / `.util` suffix — a component and its util share the same model file).
- API data and the types of a service: `front/src/app/bol/models/` (`bol-*.model.ts`).
- Types of a UI feature area: `front/src/app/bol/<area>/models/` — `<area>` is `shared`, `session`, `hero`, `pnj`, `creature` or `demon`; `front/src/app/shared/models/` for the primitives of `front/src/app/shared/`; `front/src/app/core/models/` for `core/`.
- Non-exported helper types used by one file only may stay in that file.

### UI toolkit
- **Angular Material only** — the app has fully migrated off PrimeNG (no `primeng`/`primeicons` dependency, no `p-*` element anywhere in `front/src/app/`). Use `mat-flat-button`/`mat-stroked-button`/`mat-icon-button` etc., not PrimeNG component names or `pi-*` icons.
- For buttons, prefer component attributes (`mat-flat-button`, `mat-stroked-button`, `color`) and CSS on container wrappers over ad-hoc inline styling. Material buttons have no `size` input.
- Small anchored popups (e.g. a menu triggered by an icon button) use `MatMenuModule` (`mat-menu` + `[matMenuTriggerFor]`) — see `bol/shared/add-menu/` for the reference pattern.
- Custom cross-page primitives live under `front/src/app/shared/` (`dw-tag`, `dw-badge`, `dw-panel`, `dw-collapsible-row`, `dw-confirm-dialog`, `dw-statblock-dialog`, `dw-library-header`, `dw-library-toolbar`, `dw-gemmes`, `dw-roll-sum`, `dwPopover`, …) — reuse these before inventing a new one.

### Theming
- Angular Material theming (used for `front/src/styles/_material-theme.scss`) — reference guide: https://material.angular.dev/guide/theming
- `MatFormField` app-wide defaults (`appearance: 'outline'`, `floatLabel: 'always'`) are set via `MAT_FORM_FIELD_DEFAULT_OPTIONS` in `front/src/app/app.config.ts` — don't re-set `appearance="outline"` on individual `<mat-form-field>` elements.
- Visual/dark-fantasy tokens (`--dw-surface-0` … `--dw-surface-900`, `--dw-border`, `--dw-color-reussite`/`echec`/`echec-forte`/`legendary`/`pnj`/`creature`/`demon`, and the forge look `--dw-forge-*`) are defined in `front/src/styles/_tokens.scss` — single fixed dark palette, no light/dark toggle.
- The forge is the look of every page. `front/src/styles/_forge-page.scss` sets the tokens of `dw-page` and of its overlays; components write their own materials with `front/src/styles/_forge-mixins.scss` (`@use 'styles/forge-mixins' as forge;`, then `forge.plate`, `forge.recess`, `forge.stud`, `forge.medallion`; `forge.coeur` and `forge.coeur-chiffre` draw the vitality heart of the statblock, the stepper and the table, `--coeur-fond` changing its gradient). Display font `'Muse Display Harmony'` and body font `'Muse Sans'` are self-hosted (`front/src/styles/_fonts.scss`, files in `front/src/assets/fonts/`).

### Library pages

Every library page (list of entities) follows this structure:

1. **Header** — `<dw-library-header [title]="…" [description]="…" [image]="…">`:
   - `dwHeaderTags` slot: `<dw-tag>` with the item count(s).
   - `dwHeaderActions` slot: left side — navigation links and actions (create…) as `mat-stroked-button`; right side — the way back as the one gold button, `<button mat-flat-button routerLink="/"><mat-icon>arrow_back</mat-icon> Retour à l'accueil</button>` (same on the hub pages and in the `dw-compact-bar`; not on the form pages, where « Enregistrer » stays gold and « Retour » outlined) (`/` affiche l'accueil ; avec un `returnUrl`, « Retour à la table »).

2. **Content card** — `<mat-card appearance="outlined">` containing a `<dw-library-toolbar>` (search field via `[(searchTerm)]`, optional filter controls in the `dwToolbarFilter` slot, `<dw-tag dwToolbarCount>` for the filtered count) and the item grid/list/table below.

The weapons and armours (`arme-library-page`, `armure-library-page`) keep this layout, with their own table below the toolbar. The home page groups libraries behind a hub page, `<bol-hub-page>` (`bol/shared/hub/`): the Intendance (weapons, armours) and the Bestiaire (`/bestiaire`: creatures, demons).

**Library in rows** — the creatures, demons, NPCs and heroes (`creature-library-page` is the reference): a compact header (`<dw-library-header [compact]="true">`, one line; its `image` is a fixed backdrop behind translucent cards, over the top of the page and fading into the soot: the illustrations are ~200 px banners; `[fondPleinePage]="true"` covers the whole screen with a tall one, like the scenarios) with a `dw-compact-bar` once it scrolls out; on the left, the filters always in view (source, scenario; the heroes' status), each option with its count, as toggles (`aria-pressed`); on the right, the content card with `<dw-library-toolbar [withFilters]="false">`, whose `dwToolbarFilter` slot holds the other filters as selects (`dw-lr-select-barre`, options on one line: `panelClass="dw-lr-select-panel" [panelWidth]="null"`) and whose right end holds « Effacer les filtres » once a filter is set, then a sortable table (`aria-sort`) whose actions column header shows the filtered count, with the rank in its own « Type » column, square portraits, a click on the name opens the statblock, edit and delete only on the account's sheets. Shared pieces: `BolLibraryRowsPageBase` (columns and sort) and `BolFichesPageBase` (catalogue and account sheets: the source, scenario and rank filters) in `bol/shared/library/library-rows-page.base.ts`; `<bol-library-facettes>` renders source and scenario, `<bol-library-rang>` the rank select of the toolbar, each page adding its own select (size, category, region); `<tr bol-library-entete [compte]>` renders the header row; the styles are global, `styles/_library-rows.scss` (`dw-lr-*`). The scenarios of a sheet come from the API (`scenarios` on creatures, demons and NPCs, filled by `BolScenariosDesFiches` from `bol_import_ref`).

### Accessibility
- All components must pass AXE checks and meet WCAG AA minimums (focus management, color contrast, ARIA attributes).

### Combat screens

- In free mode (no combat), `play/theatre/theatre` lays the table out for the GM, in the style of « Préparer la scène », with nothing to scroll on the reference screen: on the left, the GM's notebook (`bol-scene-lecture`: read aloud, en jeu, secret as tabs, the last two only when written; « Ensuite » below, the clues, each opening the preview of its scene to load it); on the right, the scene banner on two lines (place and « scène n sur m », then the title followed by the mood; « Démarrer un combat ») above the situation (`bol-situation`): the two camps side by side as tiles in the style of « Préparer la scène »'s cast, « En face » on the left (four per row, ranked, with its total vitality, its attitudes counted and « Ajouter », which opens the backstage) and « La compagnie » on the right (three per row: heroes, then allies). The copies of one sheet in one camp share a tile, stacked as a deck (« ×6 »). Tiles are small, for an overview, with nothing to adjust on them: the portrait (« ×n » on its top left), the name followed by a dot at the colour of the attitude (tooltip, its menu, `setAttitude`), the rank and the kind as an icon (tooltip); the border takes the attitude's colour (the compagnie keeps the plain dark `--dw-border`: no green, no gold). Vitality is always one heart at the bottom right, drawn like the statblock's (`forge.coeur`): on the portrait (in the foot for a hero), with the value inside for a single character; a group's heart is empty and opens a popover (`dwPopover`) listing each copy's vitality, each line opening that copy's card. A hero's foot, on a dark gradient (no green), holds its roll, its heroism in a shield and its heart (no player name). A tile changes camp only by being dragged to the other column (no menu). A click anywhere else on a tile opens the character's card, where vitality and heroism are adjusted (the portrait is the tile's button: its hit area, `::after`, covers the tile under its other buttons); Ctrl + click selects all its copies. The two columns are the `adversaires` and `heros` drop zones of the backstage drag.
- `bol/session/play/session-play-page` assembles the table; its state and actions live in page-scoped services under `play/table/` (`TableStore`, `CombatTurnStore`, `CombatStatsStore`, `CombatWoundsService`, `CombatEndService`, `ExpandedCardStore`, `TableCommandsService`). Combat and theatre each load through `@defer`: don't reference their component classes outside `imports`.
- `play/tapis/turn-assistant` holds its inputs and outputs; the screen is in the `tas-*` blocks; state and rules are in six stores, one per step of the turn, each depending only on the earlier ones: `TurnContextStore`, `TurnLoadoutStore`, `TurnAttackStore`, `TurnDamageStore`, `TurnCibleStore`, `TurnFlowStore`. Its stylesheets have no encapsulation and are scoped to `.tas-scope`, set on the assistant and on the panel of its popover: a new overlay needs `cdkConnectedOverlayPanelClass="tas-scope"`.
- `bol_fight_session.scenario_id` is the only source of a table's current chapter (the strip, the home page, saving the table as a scene): never infer it from the current scene. It is chosen in « Nouvelle partie », or with « Changer de chapitre » (`bol-partie-chapitre`, `bol/session/partie-chapitre/`: on the home page's banner and on each row of « Mes parties »); the strip only shows it as text. A partie stays on its scénario (`BolScenario::dansLeScenario`): loading or saving a scene moves it server-side only within that scénario, or gives an improvised partie its scénario; `PATCH …/scenario` answers 422 otherwise. An improvised partie cannot take a scénario its compagnie already plays (`BolFightSession::peutPasserSur`).

## Cyberpunk RED (second game, being modelled)

- Same pattern as BoL with the `cpr` prefix: tables `cpr_*`, models `App\Models\Cpr\Cpr*`, services `App\Http\Services\Cpr\`, controllers `App\Http\Controllers\Cpr\`, routes `/api/cpr/...`; front (to come) in `front/src/app/cpr/`, pages under `/cpr/...`, types in `front/src/app/cpr/models/cpr-*.model.ts`. BoL keeps its routes at the root. Plan and progress: `doc/cyberpunk/plans/2026-11-06-architecture-multi-jeu.md` — tick it as work lands.
- Reference data (the book's rows) lives in `backend/database/data/cpr/<table>.php`, one row per line, each with a **fixed `id`**: the only source. The migrations create the tables and fill them through `CprReferenceCatalogue`, so `php artisan migrate` is enough on each machine and tests get the data for free. To fix data: edit the file, then `docker exec diceway php artisan cpr:reference` (`--dry-run` first; table names as arguments to limit it): it updates by id, adds new rows, never deletes (sheets may cite a row), reports book rows missing from their file, and clears the cache. Never change or reuse an id: a new row takes the next id of its file. Images are named by id, e.g. `front/src/assets/cpr/cyber/<id>.webp`.
- Book rows have `user_id` null and ids below 10 000; catalogue tables keep a nullable `user_id` for items an account may create later, whose ids start at 10 000 (`CprReferenceCatalogue::ID_DES_COMPTES`).
- `GET /api/cpr/reference` (`CprReferenceData`, cached one hour) serves every catalogue in one call; `cpr:reference` and the migrations forget its cache keys.
- Rules: `doc/cyberpunk/rules/` (start at `00-index.md`); data: `doc/cyberpunk/resources/`; rulebook text: `doc/cyberpunk/pdf-text/` (PDF page = book page + 4). Two VF inconsistencies were settled for the app (Solo starting cyberware, Nomad garage at rank 4): see the plan's « Décisions ».
- After pulling new `cpr_*` migrations: `docker exec diceway php artisan migrate`; after pulling changed files in `database/data/cpr/`: `docker exec diceway php artisan cpr:reference`.

## Backend architecture (`backend/`)

- **RESTful API** — about 100 routes in `routes/api.php`, grouped under `sanctum` auth middleware.
- **Ownership** — `app/Policies/Bol/` and the `accessibleTo` scope: another account's sheet answers 404; the public catalogue (`user_id` null) is readable by all and writable by nobody; never take `user_id` from the request.
- **Service layer** — business logic in `app/Http/Services/Bol/`, not in controllers.
- **Eloquent models** — in `app/Models/Bol/`. Primary entities: `BolHeros` (an NPC is a `BolHeros` whose `type` is not `H`; there is no `BolPnj`), `BolCreature`, `BolDemon`, `BolScenario`, `BolFightSession`.
- **Auth** — Laravel Sanctum (Bearer tokens) + Google OAuth (`POST /api/auth/google/id-token`). Tokens stored in `sessionStorage` on the frontend.
- **Portraits** — files, not base64: writing `avatar` on a sheet (`HasPortrait`, `BolPortraits`) stores the image and keeps its address, `/api/bol/portraits/<hash>.<ext>`. The address stays relative; `portraitUrlInterceptor` adds `apiBase` in production. On each machine, once: `docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php`, `php artisan migrate`, then `docker exec -u www-data diceway php artisan bol:extract-portraits` (as root, Apache can no longer write to the folder it creates, and new portraits silently stay in base64). The base64 originals are not kept. `bol:prune-portraits` deletes the files no sheet carries any more; run it by hand, with `-u www-data` too.
- **Table scenario** — after pulling the home page feature, on each machine: `docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php`, then `docker exec diceway php artisan migrate` (adds `bol_fight_session.scenario_id`, filled from each table's current scene).
- **Scenarios as records** — after pulling the `bol_saga` change, on each machine: `docker exec diceway php artisan migrate` (creates `bol_saga` and files every chapter under its scenario from its title; the rollback rebuilds the titles).
- **Parties** — several parties live side by side and nothing closes them: a partie stays until it is deleted, `statut` is only `libre` or `combat`. Entering the table sets `jouee_le` (`PATCH …/jouer`), which orders the home page, and loads the first scene of its chapter if it has not played any yet (`BolSceneService`, added to what is on the table). Changing chapter loads the new chapter's first scene, replacing the adversaries and keeping the heroes and their allies; it is refused during a combat (409), like loading a scene. Progress is per partie (`BolAccueilService::chapitresJoues`): a chapter is played for a table once it left it for another chapter (`chapitres_quittes`, kept by `BolFightSession`) or once all its scenes were loaded on that table, the current scene not counting. « Scénario terminé » is only what the GM says (`scenario_termine`, under the chapters of « Changer de chapitre »); changing chapter clears it. After pulling this change, on each machine: `docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php`, then `docker exec diceway php artisan migrate`.
- **Compagnies** — `BolCompagnie` + `bol_compagnie_heros`; `bol_fight_session.compagnie_id`. Changing a compagnie applies to its next parties: started ones keep their heroes. It cannot be deleted while it has parties. `POST …/fight-session/create` with `compagnie_id` makes a partie (422 with `partie_id` if the compagnie already plays that scénario); with `titre` and no compagnie it remains for the e2e scripts. After pulling this change, on each machine: `docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php`, then `docker exec diceway php artisan migrate` (files each existing table under a compagnie, by name).
- **Ordre manuel retiré** — after pulling this change, on each machine: `docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php`, then `docker exec diceway php artisan migrate` (drops `bol_fight_session.ordre_manuel`, adds `scenario_termine`).
- **Suppressions** — nothing stays behind citing what is deleted. A sheet (PNJ, créature, démon) leaves the scenes' `distribution` and `bol_import_ref` (`CiteeDansLesScenes`), a table keeps its copy (`pnj_id`… set to null). A scene leaves the `pistes` of the others (their text stays) and `bol_import_ref`. A chapter takes its scenes and leaves `chapitres_quittes`; refused (409) while a partie is on it. A scénario stays when its last chapter goes (deleted, or filed elsewhere by a new title): it only goes when deleted itself. A hero leaves compagnies and tables; refused (409) during a combat. A compagnie cannot go while it has parties, nor start one without heroes (422). Weapons and armours: 409 while carried, no foreign key because their seeders `truncate`. These go through model events: delete through the instance (`$scene->delete()`), not a query, except where the caller cleans up itself (`BolScenarioImporter`). `scenes_jouees` keeps deleted scenes on purpose (a table that has played one does not reload its first scene). After pulling this change, on each machine: `docker exec diceway php artisan migrate` (removes existing orphan references and empty scénarios, adds the `user_id` foreign keys of `bol_heros`, `bol_creature`, `bol_demon`).
- **Scenario library** — `/library/scenarios` (`bol/scenario/library/`): the scénarios on the left (the library rail); the chosen one as a board, one column per chapter (its pitch on two lines, « Lire tout le pitch », then its scenes as cards); the page fits the screen, the board scrolls sideways under two carets (no scrollbar), each column vertically; all created, renamed, deleted there, secondary actions in `⋯` menus. A card is dragged (CDK drag-drop) to reorder its chapter or move to another one (`PATCH /bol/scene/ordre`, after `POST /bol/scene/update` with `scenario_id` for another chapter; the card stays put meanwhile); its `⋯` menu does the same from the keyboard (« Plus haut », « Plus bas », « Vers le chapitre… »). A scene moved to another chapter keeps its clues as they were. A scénario is born from its name alone (`POST /bol/saga/create`, 422 if another of the account has that name; `GET /bol/saga` lists them, empty ones included); a chapter is added with « Chapitre » (`POST /bol/scenario/create`, title `Scénario — 1. Nom`); `PATCH /bol/saga/{id}` renames a scénario (422 on a homonym), `DELETE /bol/saga/{id}` deletes it with its chapters and their scenes (409 while a partie plays one of them; an empty one goes too). « Scène » opens « Préparer la scène » (`/create/scene?chapitre=…`): saving creates the scene, last in its chapter, then saves the rest. After pulling this change, on each machine: `docker cp backend/routes/api.php diceway:/var/www/html/routes/api.php`, then `docker exec diceway php artisan migrate` (gives each former one shot a scénario of its name).
- **Préparer la scène** — a page, not a dialog: `/create/scene/:id` (`bol/scenario/scene-form/`), reached from the scenario library and from the table (`preparerLaScene`, which closes any open dialog, then comes back to `returnUrl`). Laid out as a poster, at the height of the screen: on top, the scene's illustration as a banner (`sceneDecor`, the table's default decor without one), with the place and region, the title, and the mood as pills (moment, weather, danger), each changed in place (inline inputs, `mat-menu`); below, a card for the text (read aloud, en jeu, GM secret) and the clues, one tab each, and « La distribution »: the characters (NPCs, creatures, demons of the catalogue and the account) as portrait cards (`bol-scene-carte`), a click opening a `dwPopover` for their count, camp and attitude (`bol-attitude-choix` is shared with the table's card). « Ajouter des personnages » (`personnages-dialog/`), a casting: a banner with the scene's illustration, title and mood, the search; filters as toggles (type, rank, source; the scénario in a menu, starting on the scene's when it cites sheets); every sheet as a portrait tile, a click adding it (a second one, one more copy); on the right « La distribution », the scene's characters as small `bol-scene-perso` cards; « Valider la distribution » hands back the whole cast, which replaces the page's (`avecLaFiche`, `avecLeReglage` in `scene-form.util.ts`). The illustration is not edited there and stays as it is. The characters are saved as `distribution` on `POST /bol/scene/update` (`BolSceneDistribution::fromSaisie`): only sheets the account can use (`idsAccessibles` of `AccessibleToUser`), each with its count of copies (an NPC too: three guards from one sheet; loading the scene seats one table row per copy), with its camp and attitude. The table keeps no token positions since the battlemap went (`positions_jetons` dropped on 2026-11-13: after pulling, `docker exec diceway php artisan migrate`).
- **Note** — `DatabaseSeeder.php` does not call the 18 other seeders; reference data requires manual population.
