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

### PrimeNG
- For buttons, do not use `styleClass` — prefer component inputs (`size`, `severity`, `outlined`, `text`) and CSS on container wrappers.

### Theming
- Angular Material theming (used for `front/src/styles/_material-theme.scss`) — reference guide: https://material.angular.dev/guide/theming
- `MatFormField` app-wide defaults (`appearance: 'outline'`, `floatLabel: 'always'`) are set via `MAT_FORM_FIELD_DEFAULT_OPTIONS` in `front/src/app/app.config.ts` — don't re-set `appearance="outline"` on individual `<mat-form-field>` elements.

### Library pages

Every library page (list of entities) follows this structure:

1. **Header card** — `<p-card class="dw-card--header">` containing:
   - Eyebrow (`text-xs font-black uppercase tracking-[0.22em] text-amber-300`) + `<h1>` title
   - Short description paragraph
   - `<p-tag>` with the item count
   - `<div class="library-header-actions flex flex-wrap items-center justify-between gap-1.5">`:
     - Left side: navigation links + primary action wrapped in `<span class="library-header-actions__primary">` (`severity="warn"`, `size="small"`)
     - Right side: `<p-button label="Retour au dashboard" icon="pi pi-arrow-left" [routerLink]="'/'" severity="secondary" [outlined]="true" size="small" />`

2. **Content card** — `<p-card>` with search field and item list/table.

See `creature-library-page.html` or `pnj-library-page.html` as reference.

### Accessibility
- All components must pass AXE checks and meet WCAG AA minimums (focus management, color contrast, ARIA attributes).

## Backend architecture (`backend/`)

- **RESTful API** — 150+ routes in `routes/api.php`, grouped under `sanctum` auth middleware.
- **Service layer** — business logic in `app/Http/Services/Bol/`, not in controllers.
- **Eloquent models** — in `app/Models/Bol/`. Primary entities: `BolHeros`, `BolCreature`, `BolDemon`, `BolPnj`, `BolScenario`.
- **Auth** — Laravel Sanctum (Bearer tokens) + Google OAuth (`POST /api/auth/google/id-token`). Tokens stored in `sessionStorage` on the frontend.
- **Note** — `DatabaseSeeder.php` does not call the 19 seeders; reference data requires manual population.
