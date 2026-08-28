# Session générale — généralisation de la page de combat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing combat grid/battlemap (`bol/combat/*`) into a general session hub: a session opens with the heroes present (mode `libre`), and a menu lets the GM start/end combat (mode `combat`) from the same page. Outside combat, clicking a hero's token opens a generic action menu (skill check, quick stat adjustment, open sheet) instead of the attack menu.

**Architecture:** `BolFightSession` (backend model, unchanged tables) gains a `statut` state machine (`libre` / `combat`, `terminee` reserved for later) instead of its currently-unused `'preparation'` default. The frontend `bol/combat/*` module is renamed to `bol/session/*` (routes `combat/*` → `session/*`), and the play page becomes mode-aware: the initiative rail and attack menu only render in `combat` mode; a new generic action menu renders on hero tokens in `libre` mode. Starting combat adds adversaries via the existing "add combatant" dialog and rolls hero initiative with a simple 2d6 + attribute + manual modifier (no reconstruction of the old ambush/adverse-initiative auto-calc, which is dropped along with the old combat-prep screen). Ending combat deletes the adversary pivots and returns to `libre`.

**Tech Stack:** Angular 21 (standalone components, signals, Angular Material), Laravel 12 (Eloquent, Sanctum), PHPUnit, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-28-session-generale.md`

## Global Constraints

- Standalone components, no explicit `standalone: true`, `ChangeDetectionStrategy.OnPush` everywhere, `input()`/`output()` functions, `inject()`, native control flow (`@if`/`@for`), reactive forms — per `CLAUDE.md`.
- No `ngClass`/`ngStyle`, no `@HostBinding`/`@HostListener`.
- Angular Material only (`mat-flat-button`/`mat-stroked-button`/`mat-icon-button`, `MatMenuModule` for anchored popups) — no PrimeNG.
- `php artisan test` — run the closest test to validate any backend change; `npm run build` — run to validate any frontend change; `npm test` for Vitest unit tests.
- **No DB-backed test infrastructure exists for the Bol domain today** (no factories, no sqlite test DB configured, zero `Feature` tests under `backend/tests/Feature` beyond the Laravel example, and the already-shipped combat feature has no automated tests either). This plan does not introduce that infrastructure as a side effect — it stays consistent with the existing project state. Backend tasks therefore use a mix of pure-logic PHPUnit `Unit` tests (no DB) where the logic can be extracted, and explicit manual verification steps (exact `php artisan tinker` snippets / curl commands with expected output) for anything DB-dependent. Frontend tasks use Vitest for pure utilities and `npm run build` + manual browser verification (skill `run`) for component wiring.
- Every new/changed backend route lives under the existing `sanctum` auth group in `backend/routes/api.php`, next to the other `bol/fight-session` or `bol/heros` routes.
- **Task ordering matters in this plan**: each task is written to build and (where applicable) pass its tests in isolation, given every earlier task is done. Do not skip ahead — a later task's code references classes/methods only earlier tasks create.

---

## Task 1: Backend — `statut` state machine on session creation

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolFightSessionService.php`
- Test: `backend/tests/Unit/BolFightSessionStatutTest.php` (new)

**Interfaces:**
- Produces: `BolFightSessionService::determineInitialStatut(array $data): string` — pure, no DB access. `$data` has the same shape as `createSession`'s `$data` (`heros`, `creatures`, `demons`, `pnjs` arrays).

- [ ] **Step 1: Write the failing unit test**

Create `backend/tests/Unit/BolFightSessionStatutTest.php`:

```php
<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolFightSessionService;
use PHPUnit\Framework\TestCase;

class BolFightSessionStatutTest extends TestCase
{
    public function test_libre_when_no_adversaries(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'heros' => [['heroId' => 'abc']],
            'creatures' => [],
            'demons' => [],
            'pnjs' => [],
        ]);

        $this->assertSame('libre', $statut);
    }

    public function test_combat_when_creatures_present(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'heros' => [],
            'creatures' => [['creatureId' => 'x', 'qty' => 1]],
            'demons' => [],
            'pnjs' => [],
        ]);

        $this->assertSame('combat', $statut);
    }

    public function test_combat_when_demons_present(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'demons' => [['demonId' => 'x', 'qty' => 1]],
        ]);

        $this->assertSame('combat', $statut);
    }

    public function test_combat_when_pnjs_present(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'pnjs' => [['pnjId' => 'x']],
        ]);

        $this->assertSame('combat', $statut);
    }

    public function test_libre_when_data_is_empty(): void
    {
        $service = new BolFightSessionService();

        $this->assertSame('libre', $service->determineInitialStatut([]));
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && php artisan test tests/Unit/BolFightSessionStatutTest.php`
Expected: FAIL — `Call to undefined method App\Http\Services\Bol\BolFightSessionService::determineInitialStatut()`

- [ ] **Step 3: Implement `determineInitialStatut` and wire it into `createSession`**

In `backend/app/Http/Services/Bol/BolFightSessionService.php`, replace the `createSession` method:

```php
    public function createSession(string $userId, array $data): ?BolFightSession
    {
        $session = BolFightSession::create([
            'user_id' => $userId,
            'titre'   => $data['titre'] ?? null,
            'statut'  => $this->determineInitialStatut($data),
        ]);

        $this->syncHeros($session->id, $data['heros'] ?? []);
        $this->syncCreatures($session->id, $data['creatures'] ?? []);
        $this->syncDemons($session->id, $data['demons'] ?? []);
        $this->syncPnjs($session->id, $data['pnjs'] ?? []);

        return $this->getSessionWithRelations($session->id);
    }

    /** Une session créée sans adversaire démarre "libre" (héros seuls, hors combat) ; sinon "combat". */
    public function determineInitialStatut(array $data): string
    {
        $hasAdversaries = !empty($data['creatures']) || !empty($data['demons']) || !empty($data['pnjs']);

        return $hasAdversaries ? 'combat' : 'libre';
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && php artisan test tests/Unit/BolFightSessionStatutTest.php`
Expected: PASS (5 tests)

- [ ] **Step 5: Manual verification against the running API**

Start the backend (`php artisan serve`, port 8080) and, via `php artisan tinker`:

```php
$service = app(\App\Http\Services\Bol\BolFightSessionService::class);
$hero = \App\Models\Bol\BolHeros::where('type', 'H')->first();
$session = $service->createSession($hero->user_id, [
    'heros' => [['heroId' => $hero->id]],
]);
$session->statut; // expect "libre"
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Services/Bol/BolFightSessionService.php backend/tests/Unit/BolFightSessionStatutTest.php
git commit -m "feat(backend): derive fight-session statut (libre/combat) at creation"
```

---

## Task 2: Backend — `start-combat` / `end-combat` endpoints

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolFightSessionService.php`
- Modify: `backend/app/Http/Controllers/Bol/BolFightSessionController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `BolFightSession` model (Task 1), `BolFightSessionCreature`/`BolFightSessionDemon`/`BolFightSessionPnj` models (existing).
- Produces: `BolFightSessionService::startCombat(string $sessionId, string $userId): ?BolFightSession`, `BolFightSessionService::endCombat(string $sessionId, string $userId): ?BolFightSession`. Routes `PATCH /bol/fight-session/{id}/start-combat` and `PATCH /bol/fight-session/{id}/end-combat`.

- [ ] **Step 1: Add the two service methods**

In `backend/app/Http/Services/Bol/BolFightSessionService.php`, add (near `updateOrder`):

```php
    /** Bascule une session `libre` en `combat` — les adversaires sont déjà en place via addCombatant(). */
    public function startCombat(string $sessionId, string $userId): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || $session->statut !== 'libre') {
            return null;
        }

        $session->update(['statut' => 'combat']);

        return $this->getSessionWithRelations($sessionId);
    }

    /** Termine le combat : retire les adversaires, la session redevient `libre` avec les héros seuls. */
    public function endCombat(string $sessionId, string $userId): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || $session->statut !== 'combat') {
            return null;
        }

        BolFightSessionCreature::where('fight_session_id', $sessionId)->delete();
        BolFightSessionDemon::where('fight_session_id', $sessionId)->delete();
        BolFightSessionPnj::where('fight_session_id', $sessionId)->delete();

        $session->update(['statut' => 'libre']);

        return $this->getSessionWithRelations($sessionId);
    }
```

- [ ] **Step 2: Add the controller actions**

In `backend/app/Http/Controllers/Bol/BolFightSessionController.php`, add (near `updateOrder`):

```php
    public function startCombat(string $id)
    {
        $session = $this->fightSessionService->startCombat($id, Auth::id());

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function endCombat(string $id)
    {
        $session = $this->fightSessionService->endCombat($id, Auth::id());

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }
```

- [ ] **Step 3: Add the routes**

In `backend/routes/api.php`, right after the `updateOrder` route (`Route::patch('/bol/fight-session/{id}/ordre', ...)`), add:

```php
    Route::patch('/bol/fight-session/{id}/start-combat', [BolFightSessionController::class, 'startCombat']);
    Route::patch('/bol/fight-session/{id}/end-combat', [BolFightSessionController::class, 'endCombat']);
```

- [ ] **Step 4: Manual verification**

With the dev server running and a `libre` session id from Task 1's tinker session:

```bash
curl -X PATCH -H "Authorization: Bearer <token>" -H "Accept: application/json" \
  http://localhost:8080/api/bol/fight-session/<id>/start-combat
# expect statut: "combat" in the JSON response

curl -X PATCH -H "Authorization: Bearer <token>" -H "Accept: application/json" \
  http://localhost:8080/api/bol/fight-session/<id>/end-combat
# expect statut: "libre", and "creatures"/"demons"/"pnjs" empty arrays
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http/Services/Bol/BolFightSessionService.php backend/app/Http/Controllers/Bol/BolFightSessionController.php backend/routes/api.php
git commit -m "feat(backend): add start-combat/end-combat fight-session transitions"
```

---

## Task 3: Backend — backfill migration for existing sessions

**Files:**
- Create: `backend/database/migrations/2026_08_28_100000_backfill_bol_fight_session_statut.php`

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $withAdversaries = DB::table('bol_fight_session')
            ->select('bol_fight_session.id')
            ->distinct()
            ->leftJoin('bol_fight_session_creature', 'bol_fight_session_creature.fight_session_id', '=', 'bol_fight_session.id')
            ->leftJoin('bol_fight_session_demon', 'bol_fight_session_demon.fight_session_id', '=', 'bol_fight_session.id')
            ->leftJoin('bol_fight_session_pnj', 'bol_fight_session_pnj.fight_session_id', '=', 'bol_fight_session.id')
            ->where(function ($query) {
                $query->whereNotNull('bol_fight_session_creature.id')
                    ->orWhereNotNull('bol_fight_session_demon.id')
                    ->orWhereNotNull('bol_fight_session_pnj.id');
            })
            ->pluck('bol_fight_session.id');

        DB::table('bol_fight_session')->whereIn('id', $withAdversaries)->update(['statut' => 'combat']);
        DB::table('bol_fight_session')->whereNotIn('id', $withAdversaries)->update(['statut' => 'libre']);
    }

    public function down(): void
    {
        DB::table('bol_fight_session')->update(['statut' => 'preparation']);
    }
};
```

- [ ] **Step 2: Run the migration**

Run: `cd backend && php artisan migrate`
Expected: migration listed as ran, no errors.

- [ ] **Step 3: Manual verification**

```bash
php artisan tinker --execute="dump(\App\Models\Bol\BolFightSession::pluck('statut', 'id'));"
```
Expected: every existing row's `statut` is `libre` or `combat` (no `preparation` left).

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2026_08_28_100000_backfill_bol_fight_session_statut.php
git commit -m "chore(backend): backfill fight-session statut for existing rows"
```

---

## Task 4: Backend — héroïsme adjustment endpoint

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolHerosService.php`
- Modify: `backend/app/Http/Controllers/Bol/BolHerosController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Produces: `BolHerosService::adjustHeroisme(string $herosId, string $userId, int $delta): ?BolHeros`. Route `PATCH /bol/heros/{id}/heroisme`.

- [ ] **Step 1: Add the service method**

In `backend/app/Http/Services/Bol/BolHerosService.php`, add:

```php
    /** Ajuste l'héroïsme d'un héros (delta positif ou négatif), borné à 0 minimum. */
    public function adjustHeroisme(string $herosId, string $userId, int $delta): ?BolHeros
    {
        $heros = BolHeros::where('id', $herosId)->where('user_id', $userId)->first();
        if (!$heros) {
            return null;
        }

        $heros->update(['heroisme' => max(0, $heros->heroisme + $delta)]);

        return $heros->fresh();
    }
```

- [ ] **Step 2: Add the controller action**

In `backend/app/Http/Controllers/Bol/BolHerosController.php`, add:

```php
    public function adjustHeroisme(Request $request, string $id)
    {
        $heros = $this->bolHerosService->adjustHeroisme($id, Auth::id(), (int) $request->input('delta'));

        if (!$heros) {
            return response()->json(['error' => 'Hero not found'], 404);
        }

        return response()->json($heros);
    }
```

- [ ] **Step 3: Add the route**

In `backend/routes/api.php`, next to the other `bol/heros` routes (after `Route::post('/bol/heros/origines/update/{herosId}', ...)`), add:

```php
    Route::patch('/bol/heros/{id}/heroisme', [BolHerosController::class, 'adjustHeroisme']);
```

- [ ] **Step 4: Manual verification**

```bash
curl -X PATCH -H "Authorization: Bearer <token>" -H "Accept: application/json" \
  -H "Content-Type: application/json" -d '{"delta": -1}' \
  http://localhost:8080/api/bol/heros/<id>/heroisme
# expect "heroisme" one less than before, never below 0
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http/Services/Bol/BolHerosService.php backend/app/Http/Controllers/Bol/BolHerosController.php backend/routes/api.php
git commit -m "feat(backend): add heroisme adjustment endpoint"
```

---

## Task 5: Frontend — move `bol/combat` to `bol/session` (mechanical)

**Files:** all 34 files under `front/src/app/bol/combat/**`, plus `front/src/app/app.routes.ts`.

This task is a pure structural move: no new behavior. The two pages that get a new name (`combat-select-page` → `session-new-page`, `combat-play-page` → `session-play-page`) are moved here as shells with the old content unchanged besides the rename — their behavioral rewrite happens in later tasks. `combat-library-page` is renamed to `session-library-page` with its content unchanged (only class/selector names change).

- [ ] **Step 1: Move the files**

```bash
cd front/src/app/bol
mkdir -p session/play/add-combatant-dialog session/play/attack-menu session/new/combatant-picker-dialog/catalog-card session/library session/initiative-help-dialog session/initiative-roll-dialog session/attack-roll-dialog

git mv combat/attack-roll-dialog/attack-roll-dialog.html session/attack-roll-dialog/attack-roll-dialog.html
git mv combat/attack-roll-dialog/attack-roll-dialog.scss session/attack-roll-dialog/attack-roll-dialog.scss
git mv combat/attack-roll-dialog/attack-roll-dialog.ts session/attack-roll-dialog/attack-roll-dialog.ts

git mv combat/combat-attack.util.ts session/combat-attack.util.ts
git mv combat/combat-play.util.ts session/combat-play.util.ts
git mv combat/select/combat-statblock.util.ts session/combat-statblock.util.ts
git mv combat/initiative.util.ts session/initiative.util.ts

git mv combat/initiative-help-dialog/initiative-help-dialog.html session/initiative-help-dialog/initiative-help-dialog.html
git mv combat/initiative-help-dialog/initiative-help-dialog.scss session/initiative-help-dialog/initiative-help-dialog.scss
git mv combat/initiative-help-dialog/initiative-help-dialog.ts session/initiative-help-dialog/initiative-help-dialog.ts

git mv combat/initiative-roll-dialog/initiative-roll-dialog.html session/initiative-roll-dialog/initiative-roll-dialog.html
git mv combat/initiative-roll-dialog/initiative-roll-dialog.scss session/initiative-roll-dialog/initiative-roll-dialog.scss
git mv combat/initiative-roll-dialog/initiative-roll-dialog.ts session/initiative-roll-dialog/initiative-roll-dialog.ts

git mv combat/library/combat-library-page.html session/library/session-library-page.html
git mv combat/library/combat-library-page.scss session/library/session-library-page.scss
git mv combat/library/combat-library-page.ts session/library/session-library-page.ts

git mv combat/play/add-combatant-dialog/add-combatant-dialog.html session/play/add-combatant-dialog/add-combatant-dialog.html
git mv combat/play/add-combatant-dialog/add-combatant-dialog.scss session/play/add-combatant-dialog/add-combatant-dialog.scss
git mv combat/play/add-combatant-dialog/add-combatant-dialog.ts session/play/add-combatant-dialog/add-combatant-dialog.ts

git mv combat/play/attack-menu/attack-menu.html session/play/attack-menu/attack-menu.html
git mv combat/play/attack-menu/attack-menu.scss session/play/attack-menu/attack-menu.scss
git mv combat/play/attack-menu/attack-menu.ts session/play/attack-menu/attack-menu.ts

git mv combat/play/combat-play-page.html session/play/session-play-page.html
git mv combat/play/combat-play-page.scss session/play/session-play-page.scss
git mv combat/play/combat-play-page.ts session/play/session-play-page.ts

git mv combat/select/combatant-picker-dialog/combatant-picker-dialog.html session/new/combatant-picker-dialog/combatant-picker-dialog.html
git mv combat/select/combatant-picker-dialog/combatant-picker-dialog.scss session/new/combatant-picker-dialog/combatant-picker-dialog.scss
git mv combat/select/combatant-picker-dialog/combatant-picker-dialog.ts session/new/combatant-picker-dialog/combatant-picker-dialog.ts
git mv combat/select/combatant-picker-dialog/catalog-card/catalog-card.html session/new/combatant-picker-dialog/catalog-card/catalog-card.html
git mv combat/select/combatant-picker-dialog/catalog-card/catalog-card.scss session/new/combatant-picker-dialog/catalog-card/catalog-card.scss
git mv combat/select/combatant-picker-dialog/catalog-card/catalog-card.ts session/new/combatant-picker-dialog/catalog-card/catalog-card.ts

git mv combat/select/combat-select-page.html session/new/session-new-page.html
git mv combat/select/combat-select-page.scss session/new/session-new-page.scss
git mv combat/select/combat-select-page.ts session/new/session-new-page.ts

git rm -r combat/select/combatant-card
rmdir combat/select combat/play combat 2>/dev/null || true
```

- [ ] **Step 2: Fix the `combat-statblock.util` cross-references**

`combat-statblock.util.ts` moved from `combat/select/` to `session/` (one level up from where it used to be relative to `play/` and `new/`). Fix its three known importers:

In `front/src/app/bol/session/play/session-play-page.ts`, change:
```ts
import {combatantKindIcon, combatantKindIconIsSvg} from '../select/combat-statblock.util';
```
to:
```ts
import {combatantKindIcon, combatantKindIconIsSvg} from '../combat-statblock.util';
```

In `front/src/app/bol/session/play/add-combatant-dialog/add-combatant-dialog.ts`, change:
```ts
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel} from '../../select/combat-statblock.util';
```
to:
```ts
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel} from '../../combat-statblock.util';
```

In `front/src/app/bol/session/new/combatant-picker-dialog/catalog-card/catalog-card.ts`, change:
```ts
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel, openCombatantStatblock} from '../../combat-statblock.util';
```
to:
```ts
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel, openCombatantStatblock} from '../../../combat-statblock.util';
```

- [ ] **Step 3: Rename the renamed pages' class/selector/template references**

In `front/src/app/bol/session/play/session-play-page.ts`:
- `templateUrl: './combat-play-page.html'` → `templateUrl: './session-play-page.html'`
- `styleUrl: './combat-play-page.scss'` → `styleUrl: './session-play-page.scss'`
- `selector: 'bol-combat-play-page'` → `selector: 'bol-session-play-page'`
- `export class CombatPlayPageComponent` → `export class SessionPlayPageComponent`

In `front/src/app/bol/session/new/session-new-page.ts`:
- `templateUrl: './combat-select-page.html'` → `templateUrl: './session-new-page.html'`
- `styleUrl: './combat-select-page.scss'` → `styleUrl: './session-new-page.scss'`
- `selector: 'bol-combat-select-page'` → `selector: 'bol-session-new-page'`
- `export class CombatSelectPageComponent` → `export class SessionNewPageComponent`

In `front/src/app/bol/session/library/session-library-page.ts`:
- `templateUrl: './combat-library-page.html'` → `templateUrl: './session-library-page.html'`
- `styleUrl: './combat-library-page.scss'` → `styleUrl: './session-library-page.scss'`
- `selector: 'bol-combat-library-page'` → `selector: 'bol-session-library-page'`
- `export class CombatLibraryPageComponent` → `export class SessionLibraryPageComponent`

- [ ] **Step 4: Update the routes**

In `front/src/app/app.routes.ts`, replace the three combat-related route entries:

```ts
  {
    path: 'combat/new',
    loadComponent: () =>
      import('./bol/combat/select/combat-select-page').then((module) => module.CombatSelectPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'combat/:id/play',
    loadComponent: () =>
      import('./bol/combat/play/combat-play-page').then((module) => module.CombatPlayPageComponent),
    canActivate: [authGuard],
  },
```
and
```ts
  {
    path: 'library/combats',
    loadComponent: () =>
      import('./bol/combat/library/combat-library-page').then(
        (module) => module.CombatLibraryPageComponent,
      ),
    canActivate: [authGuard],
  },
```

with:

```ts
  {
    path: 'session/new',
    loadComponent: () =>
      import('./bol/session/new/session-new-page').then((module) => module.SessionNewPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'session/:id/play',
    loadComponent: () =>
      import('./bol/session/play/session-play-page').then((module) => module.SessionPlayPageComponent),
    canActivate: [authGuard],
  },
```
and
```ts
  {
    path: 'library/sessions',
    loadComponent: () =>
      import('./bol/session/library/session-library-page').then(
        (module) => module.SessionLibraryPageComponent,
      ),
    canActivate: [authGuard],
  },
```

- [ ] **Step 5: Fix the remaining navigation references**

These are string route literals, not imports — the TypeScript compiler will not catch a stale one, so fix them explicitly:

In `front/src/app/bol/session/new/session-new-page.ts`, the `launchCombat()` method navigates with `void this.router.navigate(['/combat', session.id, 'play']);` — change to `void this.router.navigate(['/session', session.id, 'play']);`.

In `front/src/app/bol/session/library/session-library-page.html`, change:
```html
          <button mat-flat-button size="small" routerLink="/combat/new">
```
to:
```html
          <button mat-flat-button size="small" routerLink="/session/new">
```
and change:
```html
              <button mat-flat-button size="small" [routerLink]="['/combat', item.session.id, 'play']">
```
to:
```html
              <button mat-flat-button size="small" [routerLink]="['/session', item.session.id, 'play']">
```

In `front/src/app/bol/workspace/workspace-page.ts`, in the `metrics()` array, change the `Combats` entry's link:
```ts
      link: '/library/combats',
```
to:
```ts
      link: '/library/sessions',
```
(the label/detail wording for this entry and the remaining "combat" copy inside `session-library-page.html` are updated for terminology consistency in Task 15 — this step only fixes what would otherwise be a dead link.)

- [ ] **Step 6: Build and let the compiler catch anything missed**

Run: `cd front && npm run build`
Expected: build succeeds. If it fails on an unresolved import, it will name the exact file/path still pointing at `bol/combat/...` or the old class names — fix and re-run.

- [ ] **Step 7: Commit**

```bash
git add -A -- front/src/app/bol/session front/src/app/bol/combat front/src/app/app.routes.ts
git commit -m "refactor(frontend): move bol/combat to bol/session, rename combat/* routes to session/*"
```

---

## Task 6: Frontend — `BolFightSessionModel.statut` type + new service methods

**Files:**
- Modify: `front/src/app/bol/models/bol-fight-session.model.ts`
- Modify: `front/src/app/bol/services/bol-fight-session.service.ts`
- Modify: `front/src/app/bol/services/bol-heros.service.ts`

**Interfaces:**
- Produces: `BolFightSessionService.startCombat(sessionId): Observable<BolFightSessionModel>`, `.endCombat(sessionId): Observable<BolFightSessionModel>`, `.updateHeroInitiative(sessionId, herosPivotId, resultat): Observable<BolFightSessionHerosModel>`. `BolHerosService.adjustHeroisme(id, delta): Observable<BolHerosModel>`.

- [ ] **Step 1: Narrow the `statut` type**

In `front/src/app/bol/models/bol-fight-session.model.ts`, change:
```ts
export interface BolFightSessionModel {
  id: string | null;
  user_id?: string | null;
  titre: string | null;
  statut: string;
```
to:
```ts
export type BolFightSessionStatut = 'libre' | 'combat' | 'terminee';

export interface BolFightSessionModel {
  id: string | null;
  user_id?: string | null;
  titre: string | null;
  statut: BolFightSessionStatut;
```

- [ ] **Step 2: Add the fight-session service methods**

In `front/src/app/bol/services/bol-fight-session.service.ts`, change the model import to:

```ts
import {
  BolFightSessionAddCombatantPayload,
  BolFightSessionCreatePayload,
  BolFightSessionHerosModel,
  BolFightSessionModel,
  InitiativeResultat,
} from '../models/bol-fight-session.model';
```

and add, after `updateOrder`:

```ts
  startCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/start-combat`, {});
  }

  endCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/end-combat`, {});
  }

  /** Résultat du jet de réaction d'un héros déjà présent dans la session (endpoint backend existant, jamais câblé côté front jusqu'ici). */
  updateHeroInitiative(
    sessionId: string,
    herosPivotId: number,
    resultat: InitiativeResultat | null,
  ): Observable<BolFightSessionHerosModel> {
    return this.http.patch<BolFightSessionHerosModel>(`${this.base}/${sessionId}/heros/${herosPivotId}/initiative`, {
      resultat,
    });
  }
```

- [ ] **Step 3: Add the héroïsme service method**

In `front/src/app/bol/services/bol-heros.service.ts`, add:

```ts
  adjustHeroisme(id: string, delta: number): Observable<BolHerosModel> {
    return this.http.patch<BolHerosModel>(apiUrl(`bol/heros/${id}/heroisme`), {delta});
  }
```

- [ ] **Step 4: Build**

Run: `cd front && npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add front/src/app/bol/models/bol-fight-session.model.ts front/src/app/bol/services/bol-fight-session.service.ts front/src/app/bol/services/bol-heros.service.ts
git commit -m "feat(frontend): add start-combat/end-combat/heroisme service methods, narrow statut type"
```

---

## Task 7: Frontend — `session-new-page` (heroes-only creation)

**Files:**
- Modify: `front/src/app/bol/session/new/session-new-page.ts`
- Modify: `front/src/app/bol/session/new/session-new-page.html`
- Modify: `front/src/app/bol/session/new/session-new-page.scss`
- Modify: `front/src/app/bol/session/new/combatant-picker-dialog/combatant-picker-dialog.ts`
- Modify: `front/src/app/bol/session/new/combatant-picker-dialog/combatant-picker-dialog.html`

**Interfaces:**
- Consumes: `CombatSelectionService` (existing, unchanged), `CombatantPickerDialogComponent` (extended here with an optional `lockKind`).

- [ ] **Step 1: Add `lockKind` to the combatant picker dialog**

Replace the full content of `front/src/app/bol/session/new/combatant-picker-dialog/combatant-picker-dialog.ts` with:

```ts
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CombatantKind, CombatSelectionService} from '../../../services/combat-selection.service';
import {CatalogCardComponent} from './catalog-card/catalog-card';

type CatalogFilter = CombatantKind | 'all';

export interface CombatantPickerDialogData {
  /** Restreint le catalogue à un seul type (héros pour la création de session) et masque les onglets de filtre. */
  readonly lockKind?: CombatantKind;
}

/** Dialog de sélection d'un combattant à ajouter à la fight-session en préparation. */
@Component({
  selector: 'bol-combatant-picker-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, CatalogCardComponent],
  templateUrl: './combatant-picker-dialog.html',
  styleUrl: './combatant-picker-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantPickerDialogComponent {
  protected readonly ref = inject(MatDialogRef<CombatantPickerDialogComponent>);
  protected readonly selection = inject(CombatSelectionService);
  private readonly data = inject<CombatantPickerDialogData | null>(MAT_DIALOG_DATA, {optional: true});

  protected readonly lockKind = this.data?.lockKind ?? null;
  protected readonly activeType = signal<CatalogFilter>(this.lockKind ?? 'all');
  protected readonly query = signal('');

  protected readonly filteredCatalog = computed(() => {
    const type = this.lockKind ?? this.activeType();
    const query = this.query().trim().toLowerCase();

    return this.selection
      .catalog()
      .filter((entry) => (type === 'all' || entry.kind === type) && (!query || entry.nom.toLowerCase().includes(query)));
  });

  constructor() {
    this.selection.loadCatalog();
  }

  protected setType(type: CatalogFilter): void {
    this.activeType.set(type);
  }

  protected close(): void {
    this.ref.close();
  }
}
```

- [ ] **Step 2: Hide the type tabs when locked**

In `front/src/app/bol/session/new/combatant-picker-dialog/combatant-picker-dialog.html`, wrap the `.cpd-tabs` block:

```html
    @if (!lockKind) {
      <div class="cpd-tabs">
        <button type="button" class="cpd-tab" [class.cpd-tab--active]="activeType() === 'all'" (click)="setType('all')">
          Tous
        </button>
        <button type="button" class="cpd-tab" [class.cpd-tab--active]="activeType() === 'hero'" (click)="setType('hero')">
          Héros
        </button>
        <button type="button" class="cpd-tab" [class.cpd-tab--active]="activeType() === 'pnj'" (click)="setType('pnj')">
          PNJ
        </button>
        <button type="button" class="cpd-tab" [class.cpd-tab--active]="activeType() === 'creature'" (click)="setType('creature')">
          Créatures
        </button>
        <button type="button" class="cpd-tab" [class.cpd-tab--active]="activeType() === 'demon'" (click)="setType('demon')">
          Démons
        </button>
      </div>
    }
```

- [ ] **Step 3: Rewrite `session-new-page.ts`**

Replace the full file with:

```ts
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {CombatantPickerDialogComponent} from './combatant-picker-dialog/combatant-picker-dialog';

/** Écran de création d'une session : choix des héros présents à table, sans adversaire ni initiative (mode libre). */
@Component({
  selector: 'bol-session-new-page',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './session-new-page.html',
  styleUrl: './session-new-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionNewPageComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly launching = signal(false);
  protected readonly canLaunch = computed(() => this.selection.combatants().length > 0);

  constructor() {
    this.selection.loadCatalog();
  }

  protected openPicker(): void {
    this.dialog.open(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
      data: {lockKind: 'hero'},
    });
  }

  protected launchSession(): void {
    this.launching.set(true);
    this.selection
      .launch()
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.launching.set(false);
          this.selection.reset();

          if (session.id) {
            void this.router.navigate(['/session', session.id, 'play']);
          }
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de créer la session.'), 'OK', {
            duration: 6000,
          });
        },
      });
  }
}
```

- [ ] **Step 4: Rewrite `session-new-page.html`**

Replace the full file with:

```html
<section class="dw-page">
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <div class="dw-section--form snp-header">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="snp-icon">
            <mat-icon>groups</mat-icon>
          </div>
          <div>
            <p class="snp-eyebrow">Nouvelle session</p>
            <h1 class="snp-title">Héros présents à table</h1>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button mat-stroked-button type="button" routerLink="/">
            <mat-icon>arrow_back</mat-icon> Retour au dashboard
          </button>
          <button mat-flat-button type="button" [disabled]="!canLaunch() || launching()" (click)="launchSession()">
            <mat-icon>play_arrow</mat-icon> Créer la session
          </button>
        </div>
      </div>
    </div>

    <div class="dw-section--form snp-heroes">
      <div class="snp-heroes-head">
        <h2>Héros</h2>
        <span class="snp-heroes-total">{{ selection.combatants().length }}</span>
      </div>

      @if (selection.combatants().length) {
        <div class="snp-hero-list">
          @for (combatant of selection.combatants(); track combatant.catalogId) {
            @if (selection.entryFor(combatant.catalogId); as entry) {
              <div class="snp-hero-chip">
                <img [src]="entry.avatar" [alt]="entry.nom" />
                <span class="snp-hero-name">{{ entry.nom }}</span>
                <button
                  type="button"
                  class="snp-hero-remove"
                  [attr.aria-label]="'Retirer ' + entry.nom"
                  (click)="selection.remove(combatant.catalogId)"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          }
        </div>
      } @else {
        <p class="snp-empty">Aucun héros pour l'instant.</p>
      }

      <button type="button" class="snp-add-tile" (click)="openPicker()">
        <mat-icon>add</mat-icon> Ajouter un héros
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Rewrite the stylesheet**

Replace the full content of `session-new-page.scss` (currently `.csp-*` rules inherited from `combat-select-page.scss`, including rules for markup that no longer exists — mods/rail/banner) with:

```scss
.snp-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.snp-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.6rem;
  background: var(--dw-surface-700);
}

.snp-eyebrow {
  margin: 0;
  font-size: 0.8rem;
  color: var(--dw-surface-300);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.snp-title {
  margin: 0;
  font-size: 1.3rem;
}

.snp-heroes-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  h2 {
    margin: 0;
    font-size: 1rem;
  }
}

.snp-heroes-total {
  border-radius: 999px;
  background: var(--dw-surface-700);
  padding: 0.1rem 0.6rem;
  font-size: 0.85rem;
}

.snp-empty {
  color: var(--dw-surface-300);
  font-size: 0.9rem;
}

.snp-hero-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.snp-hero-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-800);
  border-radius: 999px;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;

  img {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 999px;
    object-fit: cover;
  }
}

.snp-hero-name {
  font-size: 0.9rem;
}

.snp-hero-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;

  mat-icon {
    font-size: 1rem;
    width: 1rem;
    height: 1rem;
  }
}

.snp-add-tile {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px dashed var(--dw-border);
  background: transparent;
  color: inherit;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;

  &:hover {
    background: var(--dw-surface-800);
  }
}
```

- [ ] **Step 6: Build**

Run: `cd front && npm run build`
Expected: succeeds, no reference to `CombatantCardComponent` or `combatant-card` remains.

- [ ] **Step 7: Manual verification (skill `run`)**

Start the app, log in, navigate to `/session/new`, add two heroes via the picker (only the "Héros" catalog should be visible, no tabs), remove one, add it back, click "Créer la session" — expect navigation to `/session/<id>/play` and no console errors.

- [ ] **Step 8: Commit**

```bash
git add front/src/app/bol/session/new
git commit -m "feat(frontend): rewrite session-new-page as heroes-only session creation"
```

---

## Task 8: Frontend — `session-play-page` mode awareness (rail/attack-menu gating + end combat)

**Files:**
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html`

**Interfaces:**
- Consumes: `session().statut` (`'libre' | 'combat' | 'terminee'`, Task 6), `BolFightSessionService.endCombat` (Task 6).
- Produces: `protected readonly mode = computed<'libre' | 'combat'>(...)` — consumed by Tasks 10 and 14.

This task deliberately does **not** wire "Démarrer un combat" yet (that dialog is built in Task 9) — it only adds the mode-aware rendering and the "Terminer le combat" action, both of which only need what Task 6 already provides. `npm run build` must pass at the end of this task on its own.

- [ ] **Step 1: Add the `mode` computed and `askEndCombat`**

In `front/src/app/bol/session/play/session-play-page.ts`, add near the other `computed` declarations (after `board`):

```ts
  /** Dérivé de `statut` — `'terminee'` n'a pas d'affichage dédié pour l'instant, traité comme `'libre'`. */
  protected readonly mode = computed<'libre' | 'combat'>(() => (this.session()?.statut === 'combat' ? 'combat' : 'libre'));
```

Add this method near `openAddCombatantDialog`:

```ts
  protected askEndCombat(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Terminer le combat',
        message: 'Les adversaires seront retirés et la session repassera en mode libre. Continuer ?',
        confirmLabel: 'Terminer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.endCombat(sessionId).subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => {
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de terminer le combat.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
    });
  }
```

- [ ] **Step 2: Add the header menu (end-combat only for now)**

In `front/src/app/bol/session/play/session-play-page.html`, replace the `<header class="cp-header">` block:

```html
    <header class="cp-header">
      <a class="cp-back" routerLink="/" aria-label="Retour au dashboard">
        <mat-icon>arrow_back</mat-icon>
      </a>

      <div class="cp-header-title">
        <span class="cp-eyebrow">{{ mode() === 'combat' ? 'Combat' : 'Session' }}</span>
        <h1>{{ session()?.titre || (mode() === 'combat' ? 'Combat en cours' : 'Session en cours') }}</h1>
      </div>

      <button type="button" class="cp-menu-trigger" [matMenuTriggerFor]="sessionMenu" aria-label="Actions de la session">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #sessionMenu="matMenu">
        @if (mode() === 'combat') {
          <button mat-menu-item type="button" (click)="askEndCombat()">
            <mat-icon>flag</mat-icon>
            Terminer le combat
          </button>
        }
        <button mat-menu-item type="button" (click)="openAddCombatantDialog()">
          <mat-icon>person_add</mat-icon>
          Ajouter un héros à la session
        </button>
      </mat-menu>
    </header>
```

Add `MatMenuModule` to the `imports` array of `SessionPlayPageComponent` in `session-play-page.ts`.

- [ ] **Step 3: Hide the initiative rail outside combat**

In `session-play-page.html`, wrap the existing `@if (b.legendaryActive) { ... }` banner and the `<div class="cp-rail" ...>` block that follows it in a single `@if (mode() === 'combat') { ... }`.

- [ ] **Step 4: Restrict the attack menu to combat mode**

In `session-play-page.html`'s `#tokenTpl`, change:
```html
        @if (token.key === activeKey()) {
          <bol-attack-menu
```
to:
```html
        @if (mode() === 'combat' && token.key === activeKey()) {
          <bol-attack-menu
```

- [ ] **Step 5: Build**

Run: `cd front && npm run build`
Expected: succeeds.

- [ ] **Step 6: Manual verification (skill `run`)**

Open an existing `combat`-mode session (or flip one via the Task 2 curl command): confirm the rail and attack menus render, and "Terminer le combat" appears in the header menu and works (session returns to libre, rail disappears, adversaries gone). Open a `libre`-mode session: confirm no rail, no attack menu on any token.

- [ ] **Step 7: Commit**

```bash
git add front/src/app/bol/session/play/session-play-page.ts front/src/app/bol/session/play/session-play-page.html
git commit -m "feat(frontend): make session-play-page mode-aware (libre/combat), wire end-combat"
```

---

## Task 9: Frontend — `StartCombatDialogComponent`

**Files:**
- Create: `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts`
- Create: `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.html`
- Create: `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.scss`

This is a standalone new component — it is not yet referenced from `session-play-page` (that wiring is Task 10), so it builds independently.

**Interfaces:**
- Consumes: `BolFightSessionService.fightSession/updateHeroInitiative/startCombat` (Task 6), `AddCombatantDialogComponent` (existing, moved in Task 5), `InitiativeRollDialogComponent` (existing, moved in Task 5), `BolHerosService.heros` (existing).
- Produces: `StartCombatDialogComponent`, `StartCombatDialogData {sessionId: string}`. Closes with `true` (combat started) or `undefined`.

- [ ] **Step 1: Create the component**

`front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts`:

```ts
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {AddCombatantDialogComponent} from '../add-combatant-dialog/add-combatant-dialog';
import {InitiativeRollDialogComponent} from '../../initiative-roll-dialog/initiative-roll-dialog';

export interface StartCombatDialogData {
  readonly sessionId: string;
}

interface AdversaryRow {
  readonly nom: string;
}

interface HeroRow {
  readonly pivotId: number;
  readonly herosId: string;
  readonly nom: string;
  readonly resultat: InitiativeResultat | null;
}

/** Ajoute les adversaires (dialog existant, réutilisé) puis fait rouler l'initiative de chaque héros avant de démarrer le combat. */
@Component({
  selector: 'bol-start-combat-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './start-combat-dialog.html',
  styleUrl: './start-combat-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartCombatDialogComponent {
  protected readonly ref = inject(MatDialogRef<StartCombatDialogComponent, boolean>);
  private readonly data = inject<StartCombatDialogData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly starting = signal(false);
  protected readonly adversaries = signal<readonly AdversaryRow[]>([]);
  protected readonly heroes = signal<readonly HeroRow[]>([]);
  protected readonly existingHeroIds = signal<ReadonlySet<string>>(new Set());
  protected readonly existingPnjIds = signal<ReadonlySet<string>>(new Set());

  protected readonly canStart = computed(
    () => this.adversaries().length > 0 && this.heroes().every((h) => h.resultat !== null),
  );

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.fightSessionService
      .fightSession(this.data.sessionId)
      .pipe(take(1))
      .subscribe((session) => {
        this.adversaries.set([
          ...(session.pnjs ?? []).map((p) => ({nom: p.surnom ?? p.nom})),
          ...(session.creatures ?? []).map((c) => ({nom: c.surnom ?? c.nom})),
          ...(session.demons ?? []).map((d) => ({nom: d.surnom ?? d.nom})),
        ]);
        this.existingHeroIds.set(new Set((session.heros ?? []).map((h) => String(h.heros_id))));
        this.existingPnjIds.set(
          new Set((session.pnjs ?? []).map((p) => p.pnj_id).filter((id): id is string => !!id).map(String)),
        );

        const previousResultats = new Map(this.heroes().map((h) => [h.pivotId, h.resultat]));
        this.heroes.set(
          (session.heros ?? []).map((h) => ({
            pivotId: h.id,
            herosId: h.heros_id,
            nom: h.heros?.origines.nom ?? 'Héros',
            resultat: previousResultats.get(h.id) ?? h.initiative_resultat,
          })),
        );
        this.loading.set(false);
      });
  }

  protected openAddAdversary(): void {
    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId: this.data.sessionId,
          existingHeroIds: this.existingHeroIds(),
          existingPnjIds: this.existingPnjIds(),
        },
      })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  protected rollInitiative(hero: HeroRow): void {
    this.herosService
      .heros(hero.herosId)
      .pipe(take(1))
      .subscribe((h) => {
        this.dialog
          .open(InitiativeRollDialogComponent, {
            maxWidth: 'min(30rem, 92vw)',
            panelClass: 'ird-panel',
            data: {
              heroNom: hero.nom,
              esprit: h.attributs.esprit,
              initiative: h.combat.initiative,
              modifierTotal: 0,
            },
          })
          .afterClosed()
          .subscribe((resultat: InitiativeResultat | undefined) => {
            if (!resultat) {
              return;
            }

            this.fightSessionService.updateHeroInitiative(this.data.sessionId, hero.pivotId, resultat).subscribe({
              next: () => {
                this.heroes.update((list) =>
                  list.map((h2) => (h2.pivotId === hero.pivotId ? {...h2, resultat} : h2)),
                );
              },
              error: (error: unknown) => {
                this.snackBar.open(
                  extractApiErrorMessage(error, "Impossible d'enregistrer ce jet d'initiative."),
                  'Fermer',
                  {duration: 5000},
                );
              },
            });
          });
      });
  }

  protected start(): void {
    this.starting.set(true);
    this.fightSessionService.startCombat(this.data.sessionId).subscribe({
      next: () => {
        this.starting.set(false);
        this.ref.close(true);
      },
      error: (error: unknown) => {
        this.starting.set(false);
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de démarrer le combat.'), 'Fermer', {
          duration: 5000,
        });
      },
    });
  }

  protected close(): void {
    this.ref.close(undefined);
  }
}
```

- [ ] **Step 2: Create the template**

`front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.html`:

```html
<h2 mat-dialog-title>Démarrer un combat</h2>

<mat-dialog-content>
  @if (loading()) {
    <p>Chargement…</p>
  } @else {
    <section class="scd-section">
      <div class="scd-section-head">
        <h3>Adversaires</h3>
        <button mat-stroked-button type="button" (click)="openAddAdversary()">
          <mat-icon>add</mat-icon> Ajouter
        </button>
      </div>

      @if (adversaries().length) {
        <ul class="scd-list">
          @for (a of adversaries(); track a.nom) {
            <li>{{ a.nom }}</li>
          }
        </ul>
      } @else {
        <p class="scd-empty">Aucun adversaire pour l'instant.</p>
      }
    </section>

    <section class="scd-section">
      <h3>Initiative des héros</h3>
      <ul class="scd-list scd-list--heroes">
        @for (hero of heroes(); track hero.pivotId) {
          <li class="scd-hero-row">
            <span>{{ hero.nom }}</span>
            <button mat-stroked-button type="button" (click)="rollInitiative(hero)">
              <mat-icon>casino</mat-icon>
              {{ hero.resultat ? 'Relancer' : "Lancer l'initiative" }}
            </button>
          </li>
        }
      </ul>
    </section>
  }
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-stroked-button type="button" (click)="close()">Annuler</button>
  <button mat-flat-button type="button" [disabled]="!canStart() || starting()" (click)="start()">
    <mat-icon>play_arrow</mat-icon> Démarrer le combat
  </button>
</mat-dialog-actions>
```

- [ ] **Step 3: Create the stylesheet**

`front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.scss`:

```scss
.scd-section {
  margin-bottom: 1.25rem;

  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.95rem;
  }
}

.scd-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.scd-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.scd-hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--dw-border);
}

.scd-empty {
  color: var(--dw-surface-300);
  font-size: 0.9rem;
}
```

- [ ] **Step 4: Build**

Run: `cd front && npm run build`
Expected: succeeds (the component is standalone and not yet imported anywhere, so this only checks it compiles in isolation).

- [ ] **Step 5: Commit**

```bash
git add front/src/app/bol/session/play/start-combat-dialog
git commit -m "feat(frontend): add start-combat dialog (adversaries + hero initiative rolls)"
```

---

## Task 10: Frontend — wire "Démarrer un combat" into `session-play-page`

**Files:**
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html`

**Interfaces:**
- Consumes: `StartCombatDialogComponent` (Task 9).

- [ ] **Step 1: Add the import and handler**

In `front/src/app/bol/session/play/session-play-page.ts`, add the import:

```ts
import {StartCombatDialogComponent} from './start-combat-dialog/start-combat-dialog';
```

and add this method near `askEndCombat`:

```ts
  protected openStartCombatDialog(): void {
    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    this.dialog
      .open(StartCombatDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {sessionId},
      })
      .afterClosed()
      .subscribe((started: boolean | undefined) => {
        if (started) {
          this.loadSession(sessionId);
        }
      });
  }
```

- [ ] **Step 2: Add the menu item**

In `session-play-page.html`, in the `#sessionMenu` from Task 8, add the `libre`-mode branch:

```html
      <mat-menu #sessionMenu="matMenu">
        @if (mode() === 'libre') {
          <button mat-menu-item type="button" (click)="openStartCombatDialog()">
            <mat-icon>shield</mat-icon>
            Démarrer un combat
          </button>
        } @else {
          <button mat-menu-item type="button" (click)="askEndCombat()">
            <mat-icon>flag</mat-icon>
            Terminer le combat
          </button>
        }
        <button mat-menu-item type="button" (click)="openAddCombatantDialog()">
          <mat-icon>person_add</mat-icon>
          Ajouter un héros à la session
        </button>
      </mat-menu>
```

(this replaces the `@if (mode() === 'combat') { ... }`-only block from Task 8 Step 2 with the full `@if/@else`.)

- [ ] **Step 3: Build**

Run: `cd front && npm run build`
Expected: succeeds.

- [ ] **Step 4: Manual verification (skill `run`)**

Open a `libre` session, header menu → "Démarrer un combat" → dialog opens, add an adversary, roll initiative for every hero, confirm "Démarrer le combat" is disabled until all heroes have rolled, then enabled and working — the page reloads in `combat` mode with the rail visible.

- [ ] **Step 5: Commit**

```bash
git add front/src/app/bol/session/play/session-play-page.ts front/src/app/bol/session/play/session-play-page.html
git commit -m "feat(frontend): wire start-combat dialog into session-play-page header menu"
```

---

## Task 11: Frontend — `SkillCheckDialogComponent`

**Files:**
- Create: `front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.ts`
- Create: `front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.html`
- Create: `front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.scss`
- Test: `front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.spec.ts`

This is a standalone new component, not yet referenced anywhere — it builds and tests independently.

**Interfaces:**
- Produces: `SkillCheckDialogComponent`, `SkillCheckDialogData {heroNom, agilite, vigueur, esprit}`, `SkillAttribute = 'agilite' | 'vigueur' | 'esprit'`, `suggestedSkillResult(dice, modifierSum, threshold)`, `SKILL_DIFFICULTIES`, `SKILL_ATTRIBUTE_LABELS`.

- [ ] **Step 1: Write a failing pure-logic test**

Since the dialog needs `MatDialog`/`DiceBoxHostComponent` to render, test the pure result-computation logic directly as an exported function rather than through `TestBed`. Create `front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.spec.ts`:

```ts
import {describe, expect, it} from 'vitest';
import {suggestedSkillResult} from './skill-check-dialog';

describe('suggestedSkillResult', () => {
  it('returns echec on a natural 2, regardless of total', () => {
    expect(suggestedSkillResult([1, 1], 20, 6)).toBe('echec');
  });

  it('returns heroique on a natural 12, regardless of total', () => {
    expect(suggestedSkillResult([6, 6], -20, 12)).toBe('heroique');
  });

  it('returns reussite when the total meets the threshold', () => {
    expect(suggestedSkillResult([4, 5], 0, 9)).toBe('reussite');
  });

  it('returns echec when the total is below the threshold', () => {
    expect(suggestedSkillResult([2, 3], 0, 9)).toBe('echec');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd front && npx vitest run src/app/bol/session/play/skill-check-dialog/skill-check-dialog.spec.ts`
Expected: FAIL — module `./skill-check-dialog` does not exist yet.

- [ ] **Step 3: Implement the component**

`front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.ts`:

```ts
import {ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation, viewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';

export interface SkillCheckDialogData {
  readonly heroNom: string;
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
}

export type SkillAttribute = 'agilite' | 'vigueur' | 'esprit';

export const SKILL_ATTRIBUTE_LABELS: Record<SkillAttribute, string> = {
  agilite: 'Agilité',
  vigueur: 'Vigueur',
  esprit: 'Esprit',
};

export const SKILL_DIFFICULTIES: readonly {value: number; label: string}[] = [
  {value: 6, label: 'Facile (6)'},
  {value: 9, label: 'Normal (9)'},
  {value: 12, label: 'Difficile (12)'},
];

/** Résultat suggéré d'un jet de compétence : 2/12 naturels priment sur le seuil (même règle absolue que l'initiative). */
export function suggestedSkillResult(
  dice: readonly [number, number],
  modifierSum: number,
  threshold: number,
): InitiativeResultat {
  const [a, b] = dice;
  if (a === 1 && b === 1) {
    return 'echec';
  }
  if (a === 6 && b === 6) {
    return 'heroique';
  }
  return a + b + modifierSum >= threshold ? 'reussite' : 'echec';
}

const RESULT_LABELS: Record<InitiativeResultat, string> = {
  echec_critique: 'Échec critique',
  echec: 'Échec',
  reussite: 'Réussite',
  heroique: 'Héroïque',
  legendaire: 'Légendaire',
};

/** Jet de compétence générique (hors combat) : 2d6 + attribut + modificateur libre, comparé à un seuil choisi. */
@Component({
  selector: 'bol-skill-check-dialog',
  imports: [MatDialogModule, MatIconModule, DiceBoxHostComponent],
  templateUrl: './skill-check-dialog.html',
  styleUrl: './skill-check-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SkillCheckDialogComponent {
  protected readonly data = inject<SkillCheckDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<SkillCheckDialogComponent>);

  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  protected readonly attributes: readonly SkillAttribute[] = ['agilite', 'vigueur', 'esprit'];
  protected readonly attributeLabels = SKILL_ATTRIBUTE_LABELS;
  protected readonly difficulties = SKILL_DIFFICULTIES;

  protected readonly attribute = signal<SkillAttribute>('agilite');
  protected readonly difficulty = signal(9);
  protected readonly modifier = signal(0);

  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);

  protected readonly modifierSum = computed(() => this.data[this.attribute()] + this.modifier());

  protected readonly formula = computed(() => {
    const sum = this.modifierSum();
    const base = sum >= 0 ? `2d6 + ${sum}` : `2d6 − ${Math.abs(sum)}`;
    return `${base} > ${this.difficulty()}`;
  });

  protected readonly diceSum = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] : null;
  });

  protected readonly total = computed(() => {
    const sum = this.diceSum();
    return sum === null ? null : sum + this.modifierSum();
  });

  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    const d = this.dice();
    return d ? suggestedSkillResult(d, this.modifierSum(), this.difficulty()) : null;
  });

  protected readonly resultLabel = computed(() => {
    const result = this.suggestedResult();
    return result ? RESULT_LABELS[result] : '';
  });

  protected readonly bannerTone = computed<'echec' | 'reussite' | 'heroique' | null>(() => {
    const result = this.suggestedResult();
    if (!result) {
      return null;
    }
    return result === 'reussite' ? 'reussite' : result === 'heroique' ? 'heroique' : 'echec';
  });

  protected setAttribute(attribute: SkillAttribute): void {
    this.attribute.set(attribute);
  }

  protected setDifficulty(value: number): void {
    this.difficulty.set(value);
  }

  protected incrementModifier(delta: number): void {
    this.modifier.update((m) => m + delta);
  }

  protected async roll(): Promise<void> {
    this.rolling.set(true);
    try {
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation('2d6');
      const [a, b] = results.map((r) => r.value);
      this.dice.set([a, b]);
    } finally {
      this.rolling.set(false);
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `cd front && npx vitest run src/app/bol/session/play/skill-check-dialog/skill-check-dialog.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Create the template**

`front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.html`:

```html
<div class="skd-shell">
  <div class="skd-header">
    <h2 mat-dialog-title class="skd-title">
      <div class="skd-title-eyebrow">Jet de compétence</div>
      <div class="skd-title-name">{{ data.heroNom }}</div>
    </h2>
    <button type="button" class="skd-close" aria-label="Fermer" (click)="close()">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <div class="skd-row">
    <span class="skd-row-label">Attribut</span>
    <div class="skd-toggle">
      @for (attr of attributes; track attr) {
        <button type="button" [class.active]="attribute() === attr" (click)="setAttribute(attr)">
          {{ attributeLabels[attr] }} ({{ data[attr] >= 0 ? '+' : '' }}{{ data[attr] }})
        </button>
      }
    </div>
  </div>

  <div class="skd-row">
    <span class="skd-row-label">Difficulté</span>
    <div class="skd-toggle">
      @for (d of difficulties; track d.value) {
        <button type="button" [class.active]="difficulty() === d.value" (click)="setDifficulty(d.value)">
          {{ d.label }}
        </button>
      }
    </div>
  </div>

  <div class="skd-row">
    <span class="skd-row-label">Modificateur</span>
    <div class="skd-stepper">
      <button type="button" (click)="incrementModifier(-1)">−</button>
      <span>{{ modifier() >= 0 ? '+' : '' }}{{ modifier() }}</span>
      <button type="button" (click)="incrementModifier(1)">+</button>
    </div>
  </div>

  @if (dice(); as d) {
    <div
      class="skd-result"
      [class.skd-result--reussite]="bannerTone() === 'reussite'"
      [class.skd-result--echec]="bannerTone() === 'echec'"
      [class.skd-result--heroique]="bannerTone() === 'heroique'"
    >
      <div class="skd-result-total">{{ total() }}</div>
      <p class="skd-result-label">{{ resultLabel() }}</p>
    </div>
  } @else {
    <div class="skd-result skd-result--idle">
      <p>Lancez les dés pour connaître le résultat du jet.</p>
    </div>
  }

  <app-dice-box-host class="skd-box" [scale]="12" />

  <p class="skd-formula">{{ formula() }}</p>

  <button type="button" class="skd-reroll" [disabled]="rolling()" (click)="roll()">
    <mat-icon>refresh</mat-icon>
    {{ dice() ? 'Relancer' : 'Lancer 2d6' }}
  </button>
</div>
```

- [ ] **Step 6: Create the stylesheet**

`front/src/app/bol/session/play/skill-check-dialog/skill-check-dialog.scss` — copy `../../initiative-roll-dialog/initiative-roll-dialog.scss` verbatim and rename every `.ird-` class prefix to `.skd-` (this covers `.skd-shell`, `.skd-header`, `.skd-title*`, `.skd-close`, `.skd-result*`, `.skd-box`, `.skd-formula`, `.skd-reroll`), then append these new rules for the attribute/difficulty/modifier controls:

```scss
.skd-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.skd-row-label {
  font-size: 0.85rem;
  color: var(--dw-surface-300);
}

.skd-toggle {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;

  button {
    border: 1px solid var(--dw-border);
    background: var(--dw-surface-800);
    border-radius: 0.4rem;
    padding: 0.25rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;

    &.active {
      background: var(--dw-surface-600);
      border-color: var(--dw-color-reussite);
    }
  }
}

.skd-stepper {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  button {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 999px;
    border: 1px solid var(--dw-border);
    background: var(--dw-surface-800);
    cursor: pointer;
  }
}
```

- [ ] **Step 7: Build**

Run: `cd front && npm run build`

- [ ] **Step 8: Commit**

```bash
git add front/src/app/bol/session/play/skill-check-dialog
git commit -m "feat(frontend): add generic skill-check dialog"
```

---

## Task 12: Frontend — `AdjustHeroStatsDialogComponent`

**Files:**
- Create: `front/src/app/bol/session/play/adjust-hero-stats-dialog/adjust-hero-stats-dialog.ts`
- Create: `front/src/app/bol/session/play/adjust-hero-stats-dialog/adjust-hero-stats-dialog.html`
- Create: `front/src/app/bol/session/play/adjust-hero-stats-dialog/adjust-hero-stats-dialog.scss`

This is a standalone new component, not yet referenced anywhere — it builds independently.

**Interfaces:**
- Consumes: `DwValueStepperComponent` (`front/src/app/shared/value-stepper/value-stepper.ts`, existing), `BolFightSessionService.applyDamage` (existing), `BolHerosService.adjustHeroisme` (Task 6).
- Produces: `AdjustHeroStatsDialogComponent`, `AdjustHeroStatsDialogData {sessionId, herosId, pivotId, heroNom, vitaliteCourante, vitaliteMax, heroisme}`. Closes with `true` if anything changed, else `undefined`.

- [ ] **Step 1: Create the component**

`front/src/app/bol/session/play/adjust-hero-stats-dialog/adjust-hero-stats-dialog.ts`:

```ts
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';

export interface AdjustHeroStatsDialogData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
  readonly heroisme: number;
}

/** Ajustement rapide de la vitalité (scoped à la session) et de l'héroïsme (ressource globale du héros). */
@Component({
  selector: 'bol-adjust-hero-stats-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, DwValueStepperComponent],
  templateUrl: './adjust-hero-stats-dialog.html',
  styleUrl: './adjust-hero-stats-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdjustHeroStatsDialogComponent {
  protected readonly data = inject<AdjustHeroStatsDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<AdjustHeroStatsDialogComponent, boolean>);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly vitaliteControl = new FormControl(this.data.vitaliteCourante, {nonNullable: true});
  protected readonly heroismeControl = new FormControl(this.data.heroisme, {nonNullable: true});

  private lastVitalite = this.data.vitaliteCourante;
  private lastHeroisme = this.data.heroisme;
  protected readonly changed = signal(false);

  constructor() {
    this.vitaliteControl.valueChanges.subscribe((value) => this.onVitaliteChange(value));
    this.heroismeControl.valueChanges.subscribe((value) => this.onHeroismeChange(value));
  }

  private onVitaliteChange(value: number): void {
    const delta = value - this.lastVitalite;
    if (delta === 0) {
      return;
    }

    this.fightSessionService.applyDamage(this.data.sessionId, 'hero', this.data.pivotId, delta).subscribe({
      next: () => {
        this.lastVitalite = value;
        this.changed.set(true);
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.vitaliteControl.setValue(this.lastVitalite, {emitEvent: false});
      },
    });
  }

  private onHeroismeChange(value: number): void {
    const delta = value - this.lastHeroisme;
    if (delta === 0) {
      return;
    }

    this.herosService.adjustHeroisme(this.data.herosId, delta).subscribe({
      next: () => {
        this.lastHeroisme = value;
        this.changed.set(true);
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
          duration: 5000,
        });
        this.heroismeControl.setValue(this.lastHeroisme, {emitEvent: false});
      },
    });
  }

  protected close(): void {
    this.ref.close(this.changed());
  }
}
```

- [ ] **Step 2: Create the template**

`front/src/app/bol/session/play/adjust-hero-stats-dialog/adjust-hero-stats-dialog.html`:

```html
<h2 mat-dialog-title>Ajuster {{ data.heroNom }}</h2>

<mat-dialog-content>
  <div class="ahs-field">
    <label id="ahs-vitalite-label">Vitalité ({{ vitaliteControl.value }} / {{ data.vitaliteMax }})</label>
    <dw-value-stepper [formControl]="vitaliteControl" [min]="0" [max]="data.vitaliteMax" [ariaLabel]="'Vitalité'" />
  </div>

  <div class="ahs-field">
    <label id="ahs-heroisme-label">Héroïsme ({{ heroismeControl.value }})</label>
    <dw-value-stepper [formControl]="heroismeControl" [min]="0" [ariaLabel]="'Héroïsme'" />
  </div>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-flat-button type="button" (click)="close()">Fermer</button>
</mat-dialog-actions>
```

- [ ] **Step 3: Create the stylesheet**

`front/src/app/bol/session/play/adjust-hero-stats-dialog/adjust-hero-stats-dialog.scss`:

```scss
.ahs-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;

  label {
    font-size: 0.85rem;
    color: var(--dw-surface-300);
  }
}
```

- [ ] **Step 4: Build**

Run: `cd front && npm run build`

- [ ] **Step 5: Commit**

```bash
git add front/src/app/bol/session/play/adjust-hero-stats-dialog
git commit -m "feat(frontend): add adjust-hero-stats dialog (vitality + heroism)"
```

---

## Task 13: Frontend — `HeroActionMenuComponent`

**Files:**
- Create: `front/src/app/bol/session/play/hero-action-menu/hero-action-menu.ts`
- Create: `front/src/app/bol/session/play/hero-action-menu/hero-action-menu.html`
- Create: `front/src/app/bol/session/play/hero-action-menu/hero-action-menu.scss`

A dumb, self-contained menu component (mirrors `attack-menu`'s pattern) — no dialogs opened here, so it has no dependency on Tasks 9/11/12 and builds independently.

**Interfaces:**
- Produces: `HeroActionMenuComponent` with `input.required<string>() heroName`, `output<void>() opened`, `output<void>() skillCheck`, `output<void>() adjustStats`, `output<void>() viewSheet`.

- [ ] **Step 1: Create the component**

`front/src/app/bol/session/play/hero-action-menu/hero-action-menu.ts`:

```ts
import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

/**
 * Menu d'action générique sur l'avatar d'un héros en mode libre (hors combat) : jet de compétence,
 * ajustement rapide des stats, accès à la fiche. Auto-contenu comme `bol-attack-menu` (bouton +
 * mat-menu dans le même composant) — la logique métier (dialogs) reste côté page parente.
 */
@Component({
  selector: 'bol-hero-action-menu',
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './hero-action-menu.html',
  styleUrl: './hero-action-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroActionMenuComponent {
  readonly heroName = input.required<string>();

  /** Émis à l'ouverture du menu, pour laisser le parent charger les attributs du héros à la demande. */
  readonly opened = output<void>();
  readonly skillCheck = output<void>();
  readonly adjustStats = output<void>();
  readonly viewSheet = output<void>();
}
```

- [ ] **Step 2: Create the template**

`front/src/app/bol/session/play/hero-action-menu/hero-action-menu.html`:

```html
<button
  type="button"
  class="ham-trigger"
  [attr.aria-label]="'Actions pour ' + heroName()"
  [matMenuTriggerFor]="menu"
  (click)="$event.stopPropagation()"
  (menuOpened)="opened.emit()"
>
  <mat-icon>more_vert</mat-icon>
</button>

<mat-menu #menu="matMenu">
  <button mat-menu-item type="button" (click)="skillCheck.emit()">
    <mat-icon>casino</mat-icon>
    Jet de compétence
  </button>
  <button mat-menu-item type="button" (click)="adjustStats.emit()">
    <mat-icon>tune</mat-icon>
    Ajuster les stats
  </button>
  <button mat-menu-item type="button" (click)="viewSheet.emit()">
    <mat-icon>badge</mat-icon>
    Voir la fiche
  </button>
</mat-menu>
```

- [ ] **Step 3: Create the stylesheet**

`front/src/app/bol/session/play/hero-action-menu/hero-action-menu.scss` (mirrors `../attack-menu/attack-menu.scss`'s `.am-trigger` rule — a small circular icon button overlaid on the token portrait's top-right corner):

```scss
.ham-trigger {
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-700);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  mat-icon {
    font-size: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
  }

  &:hover {
    background: var(--dw-surface-600);
  }
}
```

- [ ] **Step 4: Build**

Run: `cd front && npm run build`

- [ ] **Step 5: Commit**

```bash
git add front/src/app/bol/session/play/hero-action-menu
git commit -m "feat(frontend): add generic hero-action-menu component"
```

---

## Task 14: Frontend — wire the generic action menu into `session-play-page`

**Files:**
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html`

**Interfaces:**
- Consumes: `HeroActionMenuComponent` (Task 13), `SkillCheckDialogComponent` (Task 11), `AdjustHeroStatsDialogComponent` (Task 12).

- [ ] **Step 1: Extend `HeroMenuData` with `esprit`**

In `front/src/app/bol/session/play/session-play-page.ts`, change the interface:

```ts
interface HeroMenuData {
  readonly armes: readonly BolHerosArmeModel[];
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
}
```

and in `loadArmes`, add `esprit: hero.attributs.esprit,` to the object passed to `heroMenuData.update`.

- [ ] **Step 2: Add the imports and handlers**

Add the imports:

```ts
import {HeroActionMenuComponent} from './hero-action-menu/hero-action-menu';
import {SkillCheckDialogComponent} from './skill-check-dialog/skill-check-dialog';
import {AdjustHeroStatsDialogComponent} from './adjust-hero-stats-dialog/adjust-hero-stats-dialog';
```

Add `HeroActionMenuComponent` to the component's `imports` array.

Add these methods near `openStatblock`:

```ts
  protected onSkillCheck(token: PlayToken): void {
    const data = this.heroMenuData().get(token.key);
    if (!data) {
      return;
    }

    this.dialog.open(SkillCheckDialogComponent, {
      maxWidth: 'min(30rem, 92vw)',
      panelClass: 'skd-panel',
      data: {heroNom: token.nom, agilite: data.agilite, vigueur: data.vigueur, esprit: data.esprit},
    });
  }

  protected onAdjustStats(token: PlayToken): void {
    const sessionId = this.session()?.id;
    const herosId = token.combat.sourceId;
    if (!sessionId || !herosId) {
      return;
    }

    this.herosService
      .heros(herosId)
      .pipe(take(1))
      .subscribe((hero) => {
        this.dialog
          .open(AdjustHeroStatsDialogComponent, {
            maxWidth: 'min(26rem, 92vw)',
            data: {
              herosId,
              sessionId,
              pivotId: token.pivotId,
              heroNom: token.nom,
              vitaliteCourante: token.vitaliteCourante ?? hero.ressources.vitalite,
              vitaliteMax: hero.ressources.vitalite,
              heroisme: hero.ressources.heroisme,
            },
          })
          .afterClosed()
          .subscribe((changed: boolean | undefined) => {
            if (changed) {
              this.loadSession(sessionId);
            }
          });
      });
  }

  protected openStatblockFor(token: PlayToken): void {
    this.openStatblock(token, new Event('click'));
  }
```

(`openStatblock`'s only use of its `Event` argument is `event.stopPropagation()`, harmless on a synthetic event here — this wrapper exists because `viewSheet` is a `void` output while `openStatblock` expects an `Event`.)

- [ ] **Step 3: Wire the menu into the token template**

In `session-play-page.html`'s `#tokenTpl`, right after the `bol-attack-menu` block, add the libre-mode branch:

```html
        @if (mode() === 'combat' && token.key === activeKey()) {
          <bol-attack-menu
            [attackerName]="token.nom"
            [armes]="armesFor(token)"
            [stats]="combatStatsFor(token)"
            (opened)="loadArmes(token)"
            (confirmed)="onAttackConfirmed(token, $event)"
          />
        } @else if (mode() === 'libre' && token.kind === 'hero') {
          <bol-hero-action-menu
            [heroName]="token.nom"
            (opened)="loadArmes(token)"
            (skillCheck)="onSkillCheck(token)"
            (adjustStats)="onAdjustStats(token)"
            (viewSheet)="openStatblockFor(token)"
          />
        }
```

- [ ] **Step 4: Build**

Run: `cd front && npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual verification (skill `run`)**

Open a `libre`-mode session, click a hero token's action menu icon:
- "Jet de compétence" opens the dice dialog with correct attribute values; rolling shows a result.
- "Ajuster les stats" opens the stepper dialog; incrementing vitality/heroism persists (reload the page and confirm the values stuck).
- "Voir la fiche" opens the statblock with correct data.

- [ ] **Step 6: Commit**

```bash
git add front/src/app/bol/session/play/session-play-page.ts front/src/app/bol/session/play/session-play-page.html
git commit -m "feat(frontend): wire generic hero action menu into session-play-page"
```

---

## Task 15: Frontend — dashboard entry point

**Files:**
- Modify: `front/src/app/bol/workspace/workspace-quick-actions/workspace-quick-actions.ts`
- Modify: `front/src/app/bol/workspace/workspace-quick-actions/workspace-quick-actions.html`

**Interfaces:**
- Consumes: `BolFightSessionService.fightSessions()` (existing).

- [ ] **Step 1: Load sessions and compute the dynamic action**

Replace `front/src/app/bol/workspace/workspace-quick-actions/workspace-quick-actions.ts` with:

```ts
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {WorkspaceActionCardComponent} from './workspace-action-card';

interface WorkspaceQuickAction {
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
  readonly link: string;
  readonly state?: Record<string, string>;
  readonly advancedLink?: string;
  readonly advancedState?: Record<string, string>;
  readonly severity: 'primary' | 'secondary';
}

const STATIC_ACTIONS: readonly WorkspaceQuickAction[] = [
  {
    label: 'Créer un héros',
    detail: 'Ajouter un héros jouable prêt pour la table.',
    icon: 'person_add',
    link: '/create/hero',
    state: {returnUrl: '/'},
    advancedLink: '/create/hero-advanced',
    advancedState: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Créer une créature',
    detail: 'Ajouter une créature au bestiaire de scène.',
    icon: 'menu_book',
    link: '/create/creature',
    state: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Créer un démon',
    detail: 'Préparer un démon pour la scène ou l’intrigue.',
    icon: 'bolt',
    link: '/create/demon',
    state: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Créer un PNJ',
    detail: 'Ajouter un PNJ à la réserve de jeu.',
    icon: 'badge',
    link: '/create/pnj',
    state: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Bibliothèque d’intendance',
    detail: 'Ouvrir les référentiels armes, armures.',
    icon: 'work',
    link: '/intendance',
    severity: 'secondary',
  },
];

@Component({
  selector: 'bol-workspace-quick-actions',
  imports: [MatCard, MatCardContent, WorkspaceActionCardComponent],
  templateUrl: './workspace-quick-actions.html',
  styleUrl: './workspace-quick-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceQuickActionsComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly sessions = refreshableResource(() => this.fightSessionService.fightSessions());

  /** Session non close la plus récente (les sessions sont déjà triées par date décroissante côté backend). */
  private readonly openSession = computed(() =>
    this.sessions.data().find((s) => s.statut === 'libre' || s.statut === 'combat'),
  );

  private readonly sessionAction = computed<WorkspaceQuickAction>(() => {
    const open = this.openSession();
    return open?.id
      ? {
          label: 'Reprendre la session',
          detail: open.titre ?? 'Continuer la session en cours.',
          icon: 'groups',
          link: `/session/${open.id}/play`,
          severity: 'primary',
        }
      : {
          label: 'Nouvelle session',
          detail: 'Ouvrir une session avec les héros présents à table.',
          icon: 'groups',
          link: '/session/new',
          severity: 'primary',
        };
  });

  protected readonly quickActions = computed<readonly WorkspaceQuickAction[]>(() => [
    this.sessionAction(),
    ...STATIC_ACTIONS,
  ]);
}
```

- [ ] **Step 2: Update the template to read the signal**

In `front/src/app/bol/workspace/workspace-quick-actions/workspace-quick-actions.html`, change:
```html
        @for (action of quickActions; track action.label) {
```
to:
```html
        @for (action of quickActions(); track action.label) {
```

- [ ] **Step 3: Rename the "Combats" dashboard metric to "Sessions"**

In `front/src/app/bol/workspace/workspace-page.ts`, in the `metrics()` array, change:
```ts
    {
      label: 'Combats',
      value: String(this.fightSessions().length),
      detail: 'Combats lancés, à reprendre pour continuer le suivi d’initiative et des PV.',
      icon: 'shield',
      color: 'rose',
      link: '/library/sessions',
    },
```
to:
```ts
    {
      label: 'Sessions',
      value: String(this.fightSessions().length),
      detail: 'Sessions ouvertes, à reprendre pour continuer une soirée de jeu ou un combat.',
      icon: 'groups',
      color: 'rose',
      link: '/library/sessions',
    },
```

- [ ] **Step 4: Update the session-library-page copy**

In `front/src/app/bol/session/library/session-library-page.html`, replace the remaining "combat" wording with "session" wording: `title="Mes combats"` → `title="Mes sessions"`; the description mentioning "les combats déjà lancés" → "les sessions déjà lancées, en combat ou non"; `Nouveau combat` (both the button label and the empty-state hint referencing it) → `Nouvelle session`; `placeholder="Rechercher un combat"` → `placeholder="Rechercher une session"`; `{{ totalCount() }} combat...` tag and the two "Aucun combat..." empty-state messages → the equivalent "session" wording. Keep the surrounding structure and bindings unchanged — this is a text-only pass.

- [ ] **Step 5: Build**

Run: `cd front && npm run build`

- [ ] **Step 6: Manual verification (skill `run`)**

Log in with no open session: dashboard shows "Nouvelle session" linking to `/session/new`, and the "Sessions" metric card links to `/library/sessions`. Create one, go back to `/`: dashboard now shows "Reprendre la session" linking to the created session's play page.

- [ ] **Step 7: Commit**

```bash
git add front/src/app/bol/workspace/workspace-quick-actions/workspace-quick-actions.ts front/src/app/bol/workspace/workspace-quick-actions/workspace-quick-actions.html front/src/app/bol/workspace/workspace-page.ts front/src/app/bol/session/library/session-library-page.html
git commit -m "feat(frontend): dashboard entry point for session create/resume, rename session-library copy"
```

---

## Task 16: Full end-to-end verification

**Files:** none (verification-only task).

- [ ] **Step 1: Backend test suite**

Run: `cd backend && php artisan test`
Expected: all tests pass, including the new `BolFightSessionStatutTest`.

- [ ] **Step 2: Frontend test suite and build**

Run: `cd front && npm test && npm run build`
Expected: all Vitest tests pass (including `skill-check-dialog.spec.ts`), production build succeeds.

- [ ] **Step 3: Full manual flow (skill `run`)**

1. Dashboard → "Nouvelle session" → pick 2 heroes → "Créer la session" → lands on `/session/<id>/play` in libre mode (no rail, hero tokens only).
2. Click a hero's action menu → "Jet de compétence" → roll → result shown. Close.
3. Click the same hero's action menu → "Ajuster les stats" → decrease vitality by 2, increase heroism by 1 → close → reload the page → values persisted.
4. Click the same hero's action menu → "Voir la fiche" → statblock opens with correct data.
5. Header menu → "Démarrer un combat" → add one creature → roll initiative for both heroes → "Démarrer le combat" enabled → confirm → dialog closes, page now shows the initiative rail and attack menus, adversary token visible.
6. Resolve one attack (existing flow, unchanged) — confirm damage applies.
7. Header menu → "Terminer le combat" → confirm → rail disappears, adversary token gone, heroes remain with their vitality intact.
8. Dashboard → confirm "Reprendre la session" now points at this session.
9. `/library/sessions` → confirm the session is listed and can be deleted.

- [ ] **Step 4: Report**

No commit for this task — it is a verification gate. If any step fails, file it as a fix within the relevant earlier task rather than a new task.
