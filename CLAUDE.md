# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Diceway** is a role-playing game companion app for **Barbarians of Lemuria (BoL)**. It supports character creation, creature/demon/NPC management, and live game sessions.

- **Frontend**: Angular 21 app in `/front/`
- **Backend**: Laravel 12 REST API in `/backend/`
- Game rules reference: `/doc/rules/` and `/doc/resources/` (Markdown)


## Commands

### Frontend (`front/`)

```bash
npm start          # Dev server on localhost:4200 (proxies API to localhost:8080)
npm run build      # Production build — run this to validate any frontend change
npm test           # Unit tests with Vitest
npm run watch      # Incremental dev build
```

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

## Business rules & reference data

When a task touches game rules, character creation, equipment, careers, languages, traits, or activation:
1. Check `/doc/resources/` first — authoritative reference data (weapons, armor, careers, languages, advantages, disadvantages, regions, bestiary, demons, NPCs).
2. Use `/doc/rules/` for additional context or mechanics not covered in `/doc/resources/`.
3. To verify a rule against the original rulebook, grep `/doc/pdf-text/` — pre-extracted text of the rulebook PDF, one file per chapter (see its README; PDF page = book page + 2). Do not re-run `pdftotext` on the PDF.

`/doc/rules/` was audited against the rulebook PDF on 2026-06-10 (see `doc/plans/plan-alignement-rules-pdf.md`): all numeric tables and formulas are accurate; the few known wording gaps are listed there.

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

### State
- Signals for local state; `computed()` for derived state.
- Use `.update()` or `.set()` on signals — not `.mutate()`.
- Keep state transformations pure.

### Forms
- Prefer Reactive Forms over template-driven forms.

### Services
- `inject()` function instead of constructor injection.
- `providedIn: 'root'` for singleton services.
- Single responsibility per service.

### UI toolkit
- **Angular Material only** — the app has fully migrated off PrimeNG (no `primeng`/`primeicons` dependency, no `p-*` element anywhere in `front/src/app/`). Use `mat-flat-button`/`mat-stroked-button`/`mat-icon-button` etc., not PrimeNG component names or `pi-*` icons.
- For buttons, prefer component inputs/attributes (`mat-flat-button`, `mat-stroked-button`, `size="small"`, `color`) and CSS on container wrappers over ad-hoc inline styling.
- Small anchored popups (e.g. a menu triggered by an icon button) use `MatMenuModule` (`mat-menu` + `[matMenuTriggerFor]`) — see `bol/shared/add-menu/` for the reference pattern.
- Custom cross-page primitives live under `front/src/app/shared/` (`dw-tag`, `dw-badge`, `dw-panel`, `dw-collapsible-row`, `dw-confirm-dialog`, `dw-statblock-dialog`, `dw-library-header`, `dw-library-toolbar`, …) — reuse these before inventing a new one.

### Theming
- Angular Material theming (used for `front/src/styles/_material-theme.scss`) — reference guide: https://material.angular.dev/guide/theming
- `MatFormField` app-wide defaults (`appearance: 'outline'`, `floatLabel: 'always'`) are set via `MAT_FORM_FIELD_DEFAULT_OPTIONS` in `front/src/app/app.config.ts` — don't re-set `appearance="outline"` on individual `<mat-form-field>` elements.
- Visual/dark-fantasy tokens (`--dw-surface-0` … `--dw-surface-900`, `--dw-border`, `--dw-color-reussite`/`echec`/`echec-forte`/`legendary`/`pnj`/`creature`/`demon`) are defined in `front/src/styles/_tokens.scss` — single fixed dark palette, no light/dark toggle. Display font `'Muse Display Harmony'` and body font `'Muse Sans'` are self-hosted (`front/src/styles/_fonts.scss`, files in `front/src/assets/fonts/`).

### Library pages

Every library page (list of entities) follows this structure:

1. **Header** — `<dw-library-header [title]="…" [description]="…" [color]="…" [image]="…">`:
   - `dwHeaderTags` slot: `<dw-tag>` with the item count(s).
   - `dwHeaderActions` slot: left side — navigation links + primary action as `mat-flat-button`/`mat-stroked-button` (`size="small"`); right side — `<button mat-stroked-button size="small" routerLink="/"><mat-icon>arrow_back</mat-icon> Retour au dashboard</button>`.

2. **Content card** — `<mat-card appearance="outlined">` containing a `<dw-library-toolbar>` (search field via `[(searchTerm)]`, optional filter controls in the `dwToolbarFilter` slot, `<dw-tag dwToolbarCount>` for the filtered count) and the item grid/list/table below.

See `creature-library-page.html` or `pnj-library-page.html` as reference.

### Accessibility
- All components must pass AXE checks and meet WCAG AA minimums (focus management, color contrast, ARIA attributes).

## Backend architecture (`backend/`)

- **RESTful API** — 150+ routes in `routes/api.php`, grouped under `sanctum` auth middleware.
- **Service layer** — business logic in `app/Http/Services/Bol/`, not in controllers.
- **Eloquent models** — in `app/Models/Bol/`. Primary entities: `BolHeros`, `BolCreature`, `BolDemon`, `BolPnj`, `BolScenario`.
- **Auth** — Laravel Sanctum (Bearer tokens) + Google OAuth (`POST /api/auth/google/id-token`). Tokens stored in `sessionStorage` on the frontend.
- **Note** — `DatabaseSeeder.php` does not call the 19 seeders; reference data requires manual population.
