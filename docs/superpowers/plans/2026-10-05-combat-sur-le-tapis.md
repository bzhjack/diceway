# Le combat sur le Tapis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jouer le combat sur le tapis de cartes — ordre de jeu de BoL, carte active, désignation de la cible, résolution par le dialogue d'attaque existant — avec un suivi du round et des tours gardé en base, et retirer le battlefield à jetons.

**Architecture:** Le tour de jeu est une fonction pure (`combat-turn.util.ts`) de trois données : les cartes ordonnées, l'état du combat (`round`, `joues`, `defense_totale`, colonne JSON de la session) et l'ordre manuel. `bol-tapis` sert aux deux modes ; en combat il reçoit l'état de chaque carte, affiche `bol-action-bar` à la place du « Dernier jet », et `bol-turn-order` remplace le ruban. La page calcule, persiste l'état après chaque action et ouvre `AttackRollDialogComponent`, inchangé.

**Tech Stack:** Angular 22 (standalone, signals, OnPush), Angular Material, CDK drag-drop, Vitest ; Laravel 12, PHPUnit sans base.

**Spec:** `docs/superpowers/specs/2026-10-05-combat-sur-le-tapis-design.md`

## Global Constraints

- `AttackRollDialogComponent`, `StartCombatDialogComponent`, `maybePromptDefierLaMort` et la récupération post-combat ne sont pas modifiés.
- L'ordre de jeu est celui de `buildPlayBoard` (paliers BoL), ramené aux cartes : un lot est une seule entrée. L'ordre manuel (`ordre_manuel`) contient des clés de carte (`creature-12`) ; une clé inconnue est ignorée.
- État du combat, forme exacte : `{"round": <entier ≥ 1>, "joues": [<clés de carte>], "defense_totale": [<clés de carte>]}`. Absent ou mal formé, il vaut `{"round": 1, "joues": [], "defense_totale": []}`.
- Hors combat : un héros dont la vitalité de session est **négative** ; un PNJ, une créature ou un démon dont la vitalité est à 0, ou dont tous les exemplaires sont à 0 pour un lot. Un personnage dont la vitalité maximale est 0 ou inconnue n'est jamais hors combat.
- Désignable : toute carte du camp opposé à la carte active, qui n'est pas hors combat.
- Lot pris pour cible : les dégâts vont au premier exemplaire dont la vitalité est supérieure à 0.
- Défense totale : +2 à la défense de la cible dans le dialogue d'attaque.
- Les stats de combat restent résolues par `resolveAttackStats(token, herosService)` à partir du jeton (`PlayToken`) correspondant à la carte : `buildPlayBoard` et `PlayToken` sont conservés (ils servent aussi à `session-library-page`).
- Les colonnes et routes de positions de jetons restent en base, inutilisées.
- Conventions Angular du `CLAUDE.md` : pas de `standalone: true`, `OnPush`, `input()`/`output()`, `inject()`, `@if`/`@for`, pas de `ngClass`/`ngStyle`, pas de `@HostListener`, pas de fonction fléchée dans les templates, Angular Material uniquement, boutons `size="small"`, couleurs par tokens `--dw-*`. Un élément qui porte une classe maison ne porte pas d'utilitaire Tailwind.
- Tests : fonctions pures uniquement, des deux côtés ; le reste est vérifié dans le navigateur (tâche 8).
- Lancer un test front : `cd front && npx ng test --watch=false --include "**/<fichier>.spec.ts"`. Valider : `cd front && npm run build`. Tests backend : `cd backend && php artisan test` — **échec préexistant connu** : `Tests\Feature\ExampleTest`.
- **Backend en Docker** : `cd backend && docker compose up -d --build diceway && sleep 5 && docker exec diceway php artisan migrate --force`. Ce plan contient **une migration** (colonne `etat_combat`), que Lionel a acceptée.
- **Git** : pas de commit, pas de branche, pas de worktree, sauf autorisation explicite donnée pour l'exécution.
- Textes d'interface en français.

## Review Focus

Cas que la spec implique sans les nommer, les plus probables d'abord. Chacun a son test dans la tâche indiquée.

1. **Personnage sans vitalité** (fiche à 0 de vitalité maximale, comme le PNJ « Garde du port » du compte de test) : il n'est pas hors combat, sinon il serait sauté à vie. → `isOut`, tâche 2.
2. **Round 1 où seules des cartes bloquées restent à jouer** : le round passe à 2 et elles jouent alors, au lieu de bloquer le combat. → `endTurn`, tâche 2.
3. **Tout le monde est hors combat** : « Fin du tour » ne fait pas tourner les rounds à l'infini ; il n'y a plus de carte active. → `endTurn` et `turnState`, tâche 2.
4. **État du combat hérité** contenant des clés de cartes retirées, des doublons ou des valeurs non textuelles : elles sont ignorées sans casser l'ordre. → `normalizeEtat` (front) et `BolCombatState::normalize` (back), tâches 1 et 2.
5. **Lot dont le premier exemplaire est tombé** : c'est le suivant encore debout qui prend les dégâts, pas le mort. → `firstStandingInstance`, tâche 2.

---

### Task 1: Backend — état du combat

**Files:**
- Create: `backend/app/Http/Services/Bol/BolCombatState.php`
- Test: `backend/tests/Unit/BolCombatStateTest.php`
- Create: `backend/database/migrations/2026_10_05_100000_add_etat_combat_to_bol_fight_session.php`
- Modify: `backend/app/Models/Bol/BolFightSession.php`
- Modify: `backend/app/Http/Services/Bol/BolFightSessionService.php` (`startCombat`, `endCombat`, `updateCombatState`)
- Modify: `backend/app/Http/Controllers/Bol/BolFightSessionController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Produces:
  - `BolCombatState::INITIAL` = `['round' => 1, 'joues' => [], 'defense_totale' => []]` ; `BolCombatState::normalize(mixed $raw): array`.
  - Colonne `bol_fight_session.etat_combat` (json, nullable), sérialisée avec la session.
  - `PATCH /api/bol/fight-session/{id}/etat-combat`, corps `{round, joues, defense_totale}` → la session ; 404 si la session n'appartient pas à l'utilisateur ou n'est pas en combat ; 422 si le corps est invalide.
  - `startCombat` pose `etat_combat = INITIAL` ; `endCombat` le remet à `null`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `backend/tests/Unit/BolCombatStateTest.php` :

```php
<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolCombatState;
use PHPUnit\Framework\TestCase;

class BolCombatStateTest extends TestCase
{
    public function test_a_missing_state_is_round_one_with_nobody_played(): void
    {
        $this->assertSame(['round' => 1, 'joues' => [], 'defense_totale' => []], BolCombatState::normalize(null));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize('n-importe-quoi'));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize([]));
    }

    public function test_keeps_a_valid_state(): void
    {
        $state = ['round' => 3, 'joues' => ['hero-1', 'pnj-7'], 'defense_totale' => ['hero-1']];

        $this->assertSame($state, BolCombatState::normalize($state));
    }

    public function test_round_is_at_least_one(): void
    {
        $this->assertSame(1, BolCombatState::normalize(['round' => 0])['round']);
        $this->assertSame(1, BolCombatState::normalize(['round' => -4])['round']);
        $this->assertSame(1, BolCombatState::normalize(['round' => 'abc'])['round']);
        $this->assertSame(2, BolCombatState::normalize(['round' => '2'])['round']);
    }

    public function test_drops_duplicates_empty_and_non_string_keys(): void
    {
        $state = BolCombatState::normalize([
            'round'          => 2,
            'joues'          => ['hero-1', 'hero-1', '', 12, null, ['x'], 'pnj-7'],
            'defense_totale' => 'pas-un-tableau',
        ]);

        $this->assertSame(['hero-1', 'pnj-7'], $state['joues']);
        $this->assertSame([], $state['defense_totale']);
    }

    public function test_ignores_unknown_fields(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'joues' => [], 'defense_totale' => [], 'autre' => true]);

        $this->assertSame(['round', 'joues', 'defense_totale'], array_keys($state));
    }
}
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd backend && php artisan test --filter=BolCombatStateTest`
Expected: FAIL, `Class "App\Http\Services\Bol\BolCombatState" not found`.

- [ ] **Step 3: Écrire la classe**

Créer `backend/app/Http/Services/Bol/BolCombatState.php` :

```php
<?php

namespace App\Http\Services\Bol;

/**
 * État d'un combat en cours, gardé dans `bol_fight_session.etat_combat` : le round, les cartes qui
 * ont joué ce round et celles en défense totale. Les clés de carte sont celles du front
 * (`{kind}-{pivotId}`, ex. `creature-12`). Fonctions pures, sans base.
 */
class BolCombatState
{
    public const INITIAL = ['round' => 1, 'joues' => [], 'defense_totale' => []];

    /**
     * État valide à partir de n'importe quelle valeur lue ou reçue : un état absent ou mal formé
     * (combat démarré avant que l'état n'existe) vaut le round 1, personne n'ayant joué.
     *
     * @return array{round: int, joues: array<int, string>, defense_totale: array<int, string>}
     */
    public static function normalize(mixed $raw): array
    {
        if (!is_array($raw)) {
            return self::INITIAL;
        }

        return [
            'round'          => max(1, (int) (is_numeric($raw['round'] ?? null) ? $raw['round'] : 1)),
            'joues'          => self::keys($raw['joues'] ?? null),
            'defense_totale' => self::keys($raw['defense_totale'] ?? null),
        ];
    }

    /** @return array<int, string> clés de carte uniques, dans leur ordre d'apparition */
    private static function keys(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        $keys = array_filter($raw, fn ($key) => is_string($key) && $key !== '');

        return array_values(array_unique($keys));
    }
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd backend && php artisan test --filter=BolCombatStateTest`
Expected: PASS, 5 tests.

- [ ] **Step 5: Migration et modèle**

Créer `backend/database/migrations/2026_10_05_100000_add_etat_combat_to_bol_fight_session.php` :

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->json('etat_combat')->nullable()->after('positions_jetons');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('etat_combat');
        });
    }
};
```

Dans `backend/app/Models/Bol/BolFightSession.php`, remplacer les lignes `$fillable` et `$casts` par :

```php
    protected $fillable = ['user_id', 'titre', 'statut', 'ordre_manuel', 'positions_jetons', 'scene_id', 'etat_combat'];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = ['ordre_manuel' => 'array', 'positions_jetons' => 'array', 'etat_combat' => 'array'];
```

(la ligne `$hidden` existante se trouve entre les deux : le bloc ci-dessus remplace les trois lignes).

- [ ] **Step 6: Service, contrôleur, route**

Dans `backend/app/Http/Services/Bol/BolFightSessionService.php` :

`startCombat` — remplacer `$session->update(['statut' => 'combat']);` par :

```php
        $session->update(['statut' => 'combat', 'etat_combat' => BolCombatState::INITIAL]);
```

`endCombat` — remplacer `$session->update(['statut' => 'libre', 'ordre_manuel' => null]);` par :

```php
        $session->update(['statut' => 'libre', 'ordre_manuel' => null, 'etat_combat' => null]);
```

Ajouter après la méthode `endCombat` :

```php
    /**
     * Enregistre l'état du combat (round, cartes qui ont joué, cartes en défense totale). Renvoie
     * null si la session est introuvable ou n'est pas en combat.
     *
     * @param array<string, mixed> $etat
     */
    public function updateCombatState(string $sessionId, string $userId, array $etat): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || $session->statut !== 'combat') {
            return null;
        }

        $session->update(['etat_combat' => BolCombatState::normalize($etat)]);

        return $this->getSessionWithRelations($sessionId);
    }
```

Dans `backend/app/Http/Controllers/Bol/BolFightSessionController.php`, ajouter après la méthode `endCombat` :

```php
    public function updateCombatState(Request $request, string $id)
    {
        $data = $request->validate([
            'round'            => 'required|integer|min:1',
            'joues'            => 'present|array',
            'joues.*'          => 'string',
            'defense_totale'   => 'present|array',
            'defense_totale.*' => 'string',
        ]);

        $session = $this->fightSessionService->updateCombatState($id, Auth::id(), $data);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }
```

Dans `backend/routes/api.php`, juste après la ligne `Route::patch('/bol/fight-session/{id}/end-combat', …);`, ajouter :

```php
    Route::patch('/bol/fight-session/{id}/etat-combat', [BolFightSessionController::class, 'updateCombatState']);
```

- [ ] **Step 7: Vérifier, reconstruire, migrer, sonder**

Run: `cd backend && for f in app/Http/Services/Bol/BolCombatState.php app/Models/Bol/BolFightSession.php app/Http/Services/Bol/BolFightSessionService.php app/Http/Controllers/Bol/BolFightSessionController.php routes/api.php database/migrations/2026_10_05_100000_add_etat_combat_to_bol_fight_session.php; do php -l $f; done && php artisan test`
Expected: `No syntax errors detected` six fois ; tous les tests passent sauf l'échec préexistant `ExampleTest`.

Run: `cd backend && docker compose up -d --build diceway && sleep 5 && docker exec diceway php artisan migrate --force`
Expected: la migration `2026_10_05_100000_add_etat_combat_to_bol_fight_session` passe en `DONE`, et elle seule.

Avec le compte de test, sur une session en mode libre (prendre le premier id de `GET /api/bol/fight-session`) :

```bash
T=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"claude-test@example.com","password":"ClaudeTest123!"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
SID=$(curl -s http://localhost:8080/api/bol/fight-session -H "Authorization: Bearer $T" -H 'Accept: application/json' | python3 -c 'import sys,json;print(next(s["id"] for s in json.load(sys.stdin) if s["statut"]=="libre"))')
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "http://localhost:8080/api/bol/fight-session/$SID/etat-combat" -H "Authorization: Bearer $T" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"round":1,"joues":[],"defense_totale":[]}'
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "http://localhost:8080/api/bol/fight-session/$SID/etat-combat" -H "Authorization: Bearer $T" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"round":0,"joues":[],"defense_totale":[]}'
```

Expected: `404` (session pas en combat) puis `422` (round invalide).

- [ ] **Step 8: Commit** (ignoré sans autorisation, cf. Global Constraints)

```bash
git add backend
git commit -m "feat(combat): état du combat (round, tours, défense totale) sur la session"
```

---

### Task 2: Fonctions pures du tour de jeu

**Files:**
- Create: `front/src/app/bol/session/play/tapis/combat-turn.util.ts`
- Test: `front/src/app/bol/session/play/tapis/combat-turn.util.spec.ts`
- Modify: `front/src/app/bol/models/bol-fight-session.model.ts`
- Modify: `front/src/app/bol/services/bol-fight-session.service.ts`
- Modify: `front/src/app/bol/session/play/command-palette/shortcut.util.ts`
- Modify: `front/src/app/bol/session/play/command-palette/shortcut.util.spec.ts`

**Interfaces:**
- Consumes: `TapisCard`, `cardLabel` (`tapis/tapis.util.ts`) ; `PlayToken` (`session/combat-play.util.ts`) ; `InitiativeTierKey` (`session/initiative.util.ts`) ; l'API de la tâche 1.
- Produces (`combat-turn.util.ts`) :
  - `interface EtatCombat { readonly round: number; readonly joues: readonly string[]; readonly defense_totale: readonly string[] }`, `INITIAL_ETAT`
  - `type TurnStatus = 'active' | 'played' | 'skipped' | 'upcoming'`
  - `interface OrderedCard { readonly card: TapisCard; readonly tier: InitiativeTierKey | null; readonly lockedRound1: boolean }`
  - `interface TurnState { readonly round: number; readonly activeKey: string | null; readonly statuses: ReadonlyMap<string, TurnStatus> }`
  - `interface CardCombatState { readonly status: TurnStatus; readonly targetable: boolean; readonly defenseTotale: boolean; readonly out: boolean; readonly locked: boolean }`
  - `type TurnToken = Pick<PlayToken, 'kind' | 'pivotId' | 'tier' | 'lockedRound1'>`
  - `normalizeEtat(raw: unknown): EtatCombat`
  - `orderCards(cards: readonly TapisCard[], tokens: readonly TurnToken[], manualOrder: readonly string[] | null): OrderedCard[]`
  - `isOut(card: TapisCard): boolean`
  - `turnState(ordered: readonly OrderedCard[], etat: EtatCombat): TurnState`
  - `endTurn(ordered, etat): EtatCombat`, `totalDefense(ordered, etat): EtatCombat`, `giveBackTurn(etat, key): EtatCombat`
  - `targetableKeys(ordered: readonly OrderedCard[], activeKey: string | null): ReadonlySet<string>`
  - `buildCombatStates(ordered, etat): ReadonlyMap<string, CardCombatState>`
  - `firstStandingInstance(card: TapisCard): number | null`, `targetLabel(card: TapisCard): string`
  - `tokenForCard<T extends Pick<PlayToken, 'kind' | 'pivotId' | 'instanceIndex'>>(tokens: readonly T[], card: TapisCard, instanceIndex: number | null): T | null`
  - `turnAnnouncement(ordered, etat): string`
- Produces (ailleurs) : `BolFightSessionModel.etat_combat?: EtatCombatDto | null` ; `BolFightSessionService.updateCombatState(sessionId, etat): Observable<BolFightSessionModel>` ; `isEndTurnShortcut(event: ShortcutEvent, target: ShortcutTarget | null): boolean`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `front/src/app/bol/session/play/tapis/combat-turn.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {
  buildCombatStates,
  endTurn,
  EtatCombat,
  firstStandingInstance,
  giveBackTurn,
  INITIAL_ETAT,
  isOut,
  normalizeEtat,
  orderCards,
  OrderedCard,
  targetableKeys,
  targetLabel,
  tokenForCard,
  totalDefense,
  turnAnnouncement,
  turnState,
  TurnToken,
} from './combat-turn.util';
import {TapisCard, TapisKind} from './tapis.util';

function card(kind: TapisKind, pivotId: number, extra: Partial<TapisCard> = {}): TapisCard {
  return {
    key: `${kind}-${pivotId}`,
    kind,
    camp: kind === 'hero' ? 'heros' : 'adversaires',
    pivotId,
    sourceId: 'src',
    nom: `${kind} ${pivotId}`,
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '0',
    vitaliteCourante: 10,
    vitaliteMax: 10,
    instances: null,
    qty: 1,
    ...extra,
  };
}

function ordered(...cards: TapisCard[]): OrderedCard[] {
  return cards.map((c) => ({card: c, tier: null, lockedRound1: false}));
}

function etat(round: number, joues: string[] = [], defense: string[] = []): EtatCombat {
  return {round, joues, defense_totale: defense};
}

const KALENA = card('hero', 1);
const RORK = card('hero', 2);
const PRETRE = card('pnj', 7);
const LOT = card('creature', 3, {qty: 3, instances: [5, 1, 0], vitaliteMax: 5, vitaliteCourante: 5});

describe('normalizeEtat', () => {
  it('starts at round 1 with nobody played when there is no state', () => {
    expect(normalizeEtat(null)).toEqual(INITIAL_ETAT);
    expect(normalizeEtat(undefined)).toEqual(INITIAL_ETAT);
    expect(normalizeEtat('x')).toEqual(INITIAL_ETAT);
  });

  it('keeps a valid state', () => {
    expect(normalizeEtat({round: 3, joues: ['hero-1'], defense_totale: ['pnj-7']})).toEqual(etat(3, ['hero-1'], ['pnj-7']));
  });

  it('repairs a malformed state: bad round, duplicates, non-string keys', () => {
    expect(normalizeEtat({round: 0, joues: ['hero-1', 'hero-1', 4, null, ''], defense_totale: 'x'})).toEqual(etat(1, ['hero-1']));
    expect(normalizeEtat({round: 2.7})).toEqual(etat(2));
  });
});

describe('orderCards', () => {
  const tokens: TurnToken[] = [
    {kind: 'hero', pivotId: 1, tier: 'reussite', lockedRound1: false},
    {kind: 'pnj', pivotId: 7, tier: 'coriace', lockedRound1: true},
    {kind: 'creature', pivotId: 3, tier: 'pietaille', lockedRound1: true},
    {kind: 'creature', pivotId: 3, tier: 'pietaille', lockedRound1: true},
    {kind: 'creature', pivotId: 3, tier: 'pietaille', lockedRound1: true},
    {kind: 'hero', pivotId: 2, tier: 'echec_critique', lockedRound1: true},
  ];
  const cards = [RORK, LOT, KALENA, PRETRE];

  it('follows the initiative order of the tokens, a batch counting once', () => {
    expect(orderCards(cards, tokens, null).map((o) => o.card.key)).toEqual(['hero-1', 'pnj-7', 'creature-3', 'hero-2']);
  });

  it('carries the tier and round-1 lock of each card', () => {
    const [first, second] = orderCards(cards, tokens, null);
    expect(first).toMatchObject({tier: 'reussite', lockedRound1: false});
    expect(second).toMatchObject({tier: 'coriace', lockedRound1: true});
  });

  it('applies the manual order first, then the remaining cards in initiative order', () => {
    expect(orderCards(cards, tokens, ['hero-2', 'creature-3']).map((o) => o.card.key)).toEqual([
      'hero-2',
      'creature-3',
      'hero-1',
      'pnj-7',
    ]);
  });

  it('ignores unknown and duplicated keys of the manual order', () => {
    expect(orderCards(cards, tokens, ['creature-3-0', 'hero-2', 'hero-2', 'pnj-99']).map((o) => o.card.key)).toEqual([
      'hero-2',
      'hero-1',
      'pnj-7',
      'creature-3',
    ]);
  });

  it('still lists a card that has no token', () => {
    expect(orderCards([KALENA, card('demon', 9)], tokens, null).map((o) => o.card.key)).toEqual(['hero-1', 'demon-9']);
  });
});

describe('isOut', () => {
  it('puts a hero out only below zero', () => {
    expect(isOut(card('hero', 1, {vitaliteCourante: 0}))).toBe(false);
    expect(isOut(card('hero', 1, {vitaliteCourante: -1}))).toBe(true);
  });

  it('puts a non-hero out at zero', () => {
    expect(isOut(card('pnj', 7, {vitaliteCourante: 1}))).toBe(false);
    expect(isOut(card('pnj', 7, {vitaliteCourante: 0}))).toBe(true);
  });

  it('puts a batch out only when every instance is down', () => {
    expect(isOut(LOT)).toBe(false);
    expect(isOut(card('creature', 3, {qty: 2, instances: [0, 0], vitaliteMax: 5}))).toBe(true);
  });

  it('never puts out a character without a tracked vitality', () => {
    expect(isOut(card('pnj', 7, {vitaliteCourante: 0, vitaliteMax: 0}))).toBe(false);
    expect(isOut(card('pnj', 7, {vitaliteCourante: null, vitaliteMax: null}))).toBe(false);
  });
});

describe('turnState', () => {
  const order = ordered(KALENA, PRETRE, RORK);

  it('makes the first card of the order active', () => {
    const state = turnState(order, etat(1));
    expect(state.activeKey).toBe('hero-1');
    expect([...state.statuses]).toEqual([['hero-1', 'active'], ['pnj-7', 'upcoming'], ['hero-2', 'upcoming']]);
  });

  it('moves to the next card that has not played', () => {
    const state = turnState(order, etat(1, ['hero-1']));
    expect(state.activeKey).toBe('pnj-7');
    expect(state.statuses.get('hero-1')).toBe('played');
  });

  it('skips a card that is out of combat', () => {
    const out = card('pnj', 7, {vitaliteCourante: 0});
    const state = turnState(ordered(KALENA, out, RORK), etat(1, ['hero-1']));
    expect(state.activeKey).toBe('hero-2');
    expect(state.statuses.get('pnj-7')).toBe('skipped');
  });

  it('skips a locked card in round 1 only', () => {
    const locked: OrderedCard[] = [{card: PRETRE, tier: 'coriace', lockedRound1: true}, ...ordered(KALENA)];
    expect(turnState(locked, etat(1)).activeKey).toBe('hero-1');
    expect(turnState(locked, etat(1)).statuses.get('pnj-7')).toBe('skipped');
    expect(turnState(locked, etat(2)).activeKey).toBe('pnj-7');
  });

  it('has no active card when everybody is out or has played', () => {
    expect(turnState(order, etat(1, ['hero-1', 'pnj-7', 'hero-2'])).activeKey).toBeNull();
    expect(turnState(ordered(card('pnj', 7, {vitaliteCourante: 0})), etat(1)).activeKey).toBeNull();
    expect(turnState([], etat(1)).activeKey).toBeNull();
  });
});

describe('endTurn', () => {
  const order = ordered(KALENA, PRETRE);

  it('marks the active card as played', () => {
    expect(endTurn(order, etat(1))).toEqual(etat(1, ['hero-1']));
  });

  it('starts the next round when everybody has played', () => {
    expect(endTurn(order, etat(1, ['hero-1']))).toEqual(etat(2));
  });

  it('moves to round 2 when only round-1-locked cards are left, so they get to play', () => {
    const locked: OrderedCard[] = [...ordered(KALENA), {card: PRETRE, tier: 'coriace', lockedRound1: true}];
    const next = endTurn(locked, etat(1));
    expect(next).toEqual(etat(2));
    expect(turnState(locked, next).activeKey).toBe('hero-1');
  });

  it('does not spin rounds when nobody can play any more', () => {
    const allOut = ordered(card('hero', 1, {vitaliteCourante: -2}), card('pnj', 7, {vitaliteCourante: 0}));
    expect(endTurn(allOut, etat(4))).toEqual(etat(4));
  });

  it('drops played keys of cards that left the table', () => {
    expect(endTurn(ordered(KALENA, PRETRE, RORK), etat(1, ['pnj-99']))).toEqual(etat(1, ['hero-1']));
  });

  it('lifts the total defense of the card that becomes active', () => {
    expect(endTurn(order, etat(1, [], ['pnj-7']))).toEqual(etat(1, ['hero-1'], []));
  });
});

describe('totalDefense', () => {
  it('marks the active card and ends its turn', () => {
    expect(totalDefense(ordered(KALENA, PRETRE), etat(1))).toEqual(etat(1, ['hero-1'], ['hero-1']));
  });

  it('keeps the marker through the round change, until that card plays again', () => {
    const order = ordered(KALENA, PRETRE);
    const afterPretre = totalDefense(order, etat(1, ['hero-1']));
    expect(afterPretre).toEqual(etat(2, [], ['pnj-7']));
    expect(endTurn(order, afterPretre)).toEqual(etat(2, ['hero-1'], []));
  });

  it('does nothing when nobody is active', () => {
    expect(totalDefense([], etat(1))).toEqual(etat(1));
  });
});

describe('giveBackTurn', () => {
  it('lets a card that has played play again this round', () => {
    expect(giveBackTurn(etat(2, ['hero-1', 'pnj-7']), 'hero-1')).toEqual(etat(2, ['pnj-7']));
  });

  it('leaves the state unchanged for a card that has not played', () => {
    expect(giveBackTurn(etat(2, ['pnj-7']), 'hero-1')).toEqual(etat(2, ['pnj-7']));
  });
});

describe('targetableKeys', () => {
  const ally = card('pnj', 8, {camp: 'heros'});
  const out = card('pnj', 9, {vitaliteCourante: 0});
  const order = ordered(KALENA, RORK, ally, PRETRE, LOT, out);

  it('offers the opposite camp of the active card, minus cards out of combat', () => {
    expect([...targetableKeys(order, 'hero-1')].sort()).toEqual(['creature-3', 'pnj-7']);
  });

  it('lets an adversary target heroes and their allies', () => {
    expect([...targetableKeys(order, 'pnj-7')].sort()).toEqual(['hero-1', 'hero-2', 'pnj-8']);
  });

  it('offers nothing when nobody is active', () => {
    expect(targetableKeys(order, null).size).toBe(0);
  });
});

describe('buildCombatStates', () => {
  it('describes every card: turn status, targetable, total defense, out, locked', () => {
    const order: OrderedCard[] = [...ordered(KALENA, RORK), {card: PRETRE, tier: 'coriace', lockedRound1: true}];
    const states = buildCombatStates(order, etat(1, [], ['hero-2']));
    expect(states.get('hero-1')).toEqual({status: 'active', targetable: false, defenseTotale: false, out: false, locked: false});
    expect(states.get('hero-2')).toEqual({status: 'upcoming', targetable: false, defenseTotale: true, out: false, locked: false});
    expect(states.get('pnj-7')).toEqual({status: 'skipped', targetable: true, defenseTotale: false, out: false, locked: true});
  });

  it('no longer flags the round-1 lock after round 1', () => {
    const order: OrderedCard[] = [{card: PRETRE, tier: 'coriace', lockedRound1: true}];
    expect(buildCombatStates(order, etat(2)).get('pnj-7')?.locked).toBe(false);
  });
});

describe('targets in a batch', () => {
  it('aims at the first instance still standing', () => {
    expect(firstStandingInstance(LOT)).toBe(0);
    expect(firstStandingInstance(card('creature', 3, {qty: 3, instances: [0, 0, 4]}))).toBe(2);
  });

  it('falls back on the first instance when the whole batch is down', () => {
    expect(firstStandingInstance(card('creature', 3, {qty: 2, instances: [0, 0]}))).toBe(0);
  });

  it('uses instance 0 for a single creature or demon, and none for a hero or a PNJ', () => {
    expect(firstStandingInstance(card('demon', 9))).toBe(0);
    expect(firstStandingInstance(PRETRE)).toBeNull();
    expect(firstStandingInstance(KALENA)).toBeNull();
  });

  it('names the targeted instance of a batch', () => {
    expect(targetLabel(card('creature', 3, {nom: 'Hippocampe', qty: 3, instances: [0, 2, 5]}))).toBe('Hippocampe #2');
    expect(targetLabel(card('pnj', 7, {nom: 'Prêtre'}))).toBe('Prêtre');
  });
});

describe('tokenForCard', () => {
  const tokens = [
    {kind: 'hero' as const, pivotId: 1, instanceIndex: null},
    {kind: 'creature' as const, pivotId: 3, instanceIndex: 0},
    {kind: 'creature' as const, pivotId: 3, instanceIndex: 1},
  ];

  it('finds the token of a hero or a PNJ', () => {
    expect(tokenForCard(tokens, KALENA, null)).toBe(tokens[0]);
  });

  it('finds the token of one instance of a batch', () => {
    expect(tokenForCard(tokens, LOT, 1)).toBe(tokens[2]);
  });

  it('returns null when the card has no token', () => {
    expect(tokenForCard(tokens, PRETRE, null)).toBeNull();
    expect(tokenForCard(tokens, LOT, 5)).toBeNull();
  });
});

describe('turnAnnouncement', () => {
  it('says the round and whose turn it is', () => {
    expect(turnAnnouncement(ordered(card('hero', 1, {nom: 'Kalena'})), etat(2))).toBe('Round 2. À Kalena de jouer.');
  });

  it('says when nobody can play', () => {
    expect(turnAnnouncement([], etat(1))).toBe('Round 1. Plus personne ne peut jouer.');
  });
});
```

Dans `front/src/app/bol/session/play/command-palette/shortcut.util.spec.ts`, remplacer l'import par `import {isEndTurnShortcut, isPaletteShortcut, ShortcutEvent} from './shortcut.util';` et ajouter à la fin :

```ts
describe('isEndTurnShortcut', () => {
  it('ends the turn on "f" or "F" outside a field', () => {
    expect(isEndTurnShortcut(key('f'), null)).toBe(true);
    expect(isEndTurnShortcut(key('F'), {tagName: 'BUTTON'})).toBe(true);
  });

  it('ignores "f" typed in a field', () => {
    expect(isEndTurnShortcut(key('f'), {tagName: 'INPUT'})).toBe(false);
    expect(isEndTurnShortcut(key('f'), {tagName: 'DIV', isContentEditable: true})).toBe(false);
  });

  it('ignores "f" with a modifier, so Ctrl+F still searches the page', () => {
    expect(isEndTurnShortcut(key('f', {ctrlKey: true}), null)).toBe(false);
    expect(isEndTurnShortcut(key('f', {metaKey: true}), null)).toBe(false);
    expect(isEndTurnShortcut(key('f', {altKey: true}), null)).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `cd front && npx ng test --watch=false --include "**/combat-turn.util.spec.ts" --include "**/shortcut.util.spec.ts"`
Expected: FAIL — module `./combat-turn.util` introuvable et `isEndTurnShortcut` non exporté.

- [ ] **Step 3: Modèle, service, raccourci**

Dans `front/src/app/bol/models/bol-fight-session.model.ts`, ajouter avant `export interface BolFightSessionModel` :

```ts
/** État d'un combat en cours tel que gardé en base (cf. `combat-turn.util.ts`). */
export interface EtatCombatDto {
  round: number;
  joues: string[];
  defense_totale: string[];
}
```

et, dans `BolFightSessionModel`, après la propriété `scene` :

```ts
  /** Round, cartes qui ont joué et cartes en défense totale — null hors combat. */
  etat_combat?: EtatCombatDto | null;
```

Dans `front/src/app/bol/services/bol-fight-session.service.ts`, ajouter `EtatCombatDto` à l'import de `'../models/bol-fight-session.model'`, et, après la méthode `endCombat` :

```ts
  /** Enregistre l'état du combat (round, cartes qui ont joué, cartes en défense totale). */
  updateCombatState(sessionId: string, etat: EtatCombatDto): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/etat-combat`, etat);
  }
```

Dans `front/src/app/bol/session/play/command-palette/shortcut.util.ts`, ajouter à la fin :

```ts
/** Cet événement clavier doit-il terminer le tour en combat ? `F` seul, hors d'un champ de saisie —
 * avec un modificateur, la touche garde son rôle habituel (Ctrl+F cherche dans la page). */
export function isEndTurnShortcut(event: ShortcutEvent, target: ShortcutTarget | null): boolean {
  return !event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'f' && !isEditable(target);
}
```

- [ ] **Step 4: Écrire `combat-turn.util.ts`**

Créer `front/src/app/bol/session/play/tapis/combat-turn.util.ts` :

```ts
import {PlayToken} from '../../combat-play.util';
import {InitiativeTierKey} from '../../initiative.util';
import {TapisCard} from './tapis.util';

/** État d'un combat : le round, les cartes qui ont joué ce round, celles en défense totale. Gardé
 * dans la session (`etat_combat`) ; les clés sont celles des cartes (`{kind}-{pivotId}`). */
export interface EtatCombat {
  readonly round: number;
  readonly joues: readonly string[];
  readonly defense_totale: readonly string[];
}

export const INITIAL_ETAT: EtatCombat = {round: 1, joues: [], defense_totale: []};

/** Où en est une carte dans le round : c'est à elle, elle a joué, elle est sautée (hors combat ou
 * bloquée au round 1), ou son tour viendra. */
export type TurnStatus = 'active' | 'played' | 'skipped' | 'upcoming';

export interface OrderedCard {
  readonly card: TapisCard;
  readonly tier: InitiativeTierKey | null;
  /** Bloquée au round 1 (règle BoL calculée par `buildInitiativeOrderFrom`). */
  readonly lockedRound1: boolean;
}

export interface TurnState {
  readonly round: number;
  readonly activeKey: string | null;
  readonly statuses: ReadonlyMap<string, TurnStatus>;
}

/** Ce qu'une carte affiche de l'état du combat. */
export interface CardCombatState {
  readonly status: TurnStatus;
  readonly targetable: boolean;
  readonly defenseTotale: boolean;
  readonly out: boolean;
  readonly locked: boolean;
}

export type TurnToken = Pick<PlayToken, 'kind' | 'pivotId' | 'tier' | 'lockedRound1'>;

function uniqueKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...new Set(raw.filter((key): key is string => typeof key === 'string' && key !== ''))];
}

/** État valide à partir de ce que renvoie l'API : absent ou mal formé (combat démarré avant que
 * l'état n'existe), il vaut le round 1, personne n'ayant joué. */
export function normalizeEtat(raw: unknown): EtatCombat {
  if (typeof raw !== 'object' || raw === null) {
    return INITIAL_ETAT;
  }

  const source = raw as Record<string, unknown>;
  const round = typeof source['round'] === 'number' && Number.isFinite(source['round']) ? Math.floor(source['round']) : 1;
  return {
    round: Math.max(1, round),
    joues: uniqueKeys(source['joues']),
    defense_totale: uniqueKeys(source['defense_totale']),
  };
}

function cardKeyOf(token: Pick<PlayToken, 'kind' | 'pivotId'>): string {
  return `${token.kind}-${token.pivotId}`;
}

/** Les cartes dans l'ordre de jeu. Par défaut, l'ordre d'initiative des jetons (déjà trié par
 * paliers), un lot ne comptant qu'une fois. L'ordre manuel du MJ passe devant ; ses clés inconnues
 * ou en double sont ignorées, et les cartes qu'il ne cite pas suivent dans l'ordre d'initiative. */
export function orderCards(
  cards: readonly TapisCard[],
  tokens: readonly TurnToken[],
  manualOrder: readonly string[] | null,
): OrderedCard[] {
  const cardByKey = new Map(cards.map((card) => [card.key, card]));
  const byInitiative = new Map<string, OrderedCard>();

  for (const token of tokens) {
    const key = cardKeyOf(token);
    const card = cardByKey.get(key);
    if (card && !byInitiative.has(key)) {
      byInitiative.set(key, {card, tier: token.tier, lockedRound1: token.lockedRound1});
    }
  }
  for (const card of cards) {
    if (!byInitiative.has(card.key)) {
      byInitiative.set(card.key, {card, tier: null, lockedRound1: false});
    }
  }

  const result: OrderedCard[] = [];
  const placed = new Set<string>();
  for (const key of manualOrder ?? []) {
    const entry = byInitiative.get(key);
    if (entry && !placed.has(key)) {
      placed.add(key);
      result.push(entry);
    }
  }
  for (const [key, entry] of byInitiative) {
    if (!placed.has(key)) {
      result.push(entry);
    }
  }
  return result;
}

/** Hors combat : un héros en vitalité négative (mourant) ; un PNJ, une créature ou un démon à 0 —
 * tous ses exemplaires pour un lot. Un personnage sans vitalité suivie (maximum nul ou inconnu)
 * n'est jamais hors combat. */
export function isOut(card: TapisCard): boolean {
  if (card.vitaliteMax === null || card.vitaliteMax <= 0) {
    return false;
  }
  if (card.instances) {
    return card.instances.every((value) => value <= 0);
  }
  if (card.vitaliteCourante === null) {
    return false;
  }
  return card.kind === 'hero' ? card.vitaliteCourante < 0 : card.vitaliteCourante <= 0;
}

function isSkipped(entry: OrderedCard, round: number): boolean {
  return isOut(entry.card) || (round === 1 && entry.lockedRound1);
}

/** Qui joue, et où en est chaque carte : la carte active est la première de l'ordre qui n'a pas
 * joué ce round et n'est pas sautée. */
export function turnState(ordered: readonly OrderedCard[], etat: EtatCombat): TurnState {
  const played = new Set(etat.joues);
  const statuses = new Map<string, TurnStatus>();
  let activeKey: string | null = null;

  for (const entry of ordered) {
    const key = entry.card.key;
    if (isSkipped(entry, etat.round)) {
      statuses.set(key, 'skipped');
    } else if (played.has(key)) {
      statuses.set(key, 'played');
    } else if (activeKey === null) {
      activeKey = key;
      statuses.set(key, 'active');
    } else {
      statuses.set(key, 'upcoming');
    }
  }

  return {round: etat.round, activeKey, statuses};
}

/** Retire le marqueur de défense totale de la carte qui devient active : il a tenu jusqu'à son tour. */
function liftDefenseOfActive(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null || !etat.defense_totale.includes(activeKey)) {
    return etat;
  }
  return {...etat, defense_totale: etat.defense_totale.filter((key) => key !== activeKey)};
}

/** « Fin du tour » : la carte active a joué. S'il ne reste personne à jouer ce round, le suivant
 * commence — sauf si personne ne pourrait y jouer non plus (tout le monde est hors combat). */
export function endTurn(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  const onTable = new Set(ordered.map((entry) => entry.card.key));
  let next: EtatCombat = {...etat, joues: [...etat.joues.filter((key) => onTable.has(key)), activeKey]};

  if (turnState(ordered, next).activeKey === null) {
    const nextRound: EtatCombat = {...next, round: etat.round + 1, joues: []};
    if (turnState(ordered, nextRound).activeKey !== null) {
      next = nextRound;
    }
  }

  return liftDefenseOfActive(ordered, next);
}

/** « Défense totale » : la carte active est marquée, et son tour se termine. Le marqueur tombe
 * quand elle redevient active. */
export function totalDefense(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  const marked: EtatCombat = {...etat, defense_totale: [...etat.defense_totale.filter((key) => key !== activeKey), activeKey]};
  const ended = endTurn(ordered, marked);
  // Si la carte est seule à pouvoir jouer, elle redevient active aussitôt et `endTurn` a levé son
  // marqueur : on le repose, il doit tenir jusqu'à la fin de son prochain tour.
  return ended.defense_totale.includes(activeKey) || turnState(ordered, ended).activeKey !== activeKey
    ? ended
    : {...ended, defense_totale: [...ended.defense_totale, activeKey]};
}

/** « Rendre la main » : une carte qui a joué redevient jouable ce round. */
export function giveBackTurn(etat: EtatCombat, key: string): EtatCombat {
  return etat.joues.includes(key) ? {...etat, joues: etat.joues.filter((played) => played !== key)} : etat;
}

/** Cartes que la carte active peut désigner d'un clic : le camp d'en face, hors cartes hors combat. */
export function targetableKeys(ordered: readonly OrderedCard[], activeKey: string | null): ReadonlySet<string> {
  const active = ordered.find((entry) => entry.card.key === activeKey)?.card;
  if (!active) {
    return new Set();
  }
  return new Set(
    ordered
      .map((entry) => entry.card)
      .filter((card) => card.camp !== active.camp && !isOut(card))
      .map((card) => card.key),
  );
}

/** Ce que chaque carte affiche du combat. */
export function buildCombatStates(ordered: readonly OrderedCard[], etat: EtatCombat): ReadonlyMap<string, CardCombatState> {
  const turn = turnState(ordered, etat);
  const targetable = targetableKeys(ordered, turn.activeKey);
  const defense = new Set(etat.defense_totale);

  return new Map(
    ordered.map((entry) => [
      entry.card.key,
      {
        status: turn.statuses.get(entry.card.key) ?? 'upcoming',
        targetable: targetable.has(entry.card.key),
        defenseTotale: defense.has(entry.card.key),
        out: isOut(entry.card),
        locked: etat.round === 1 && entry.lockedRound1,
      },
    ]),
  );
}

/** Exemplaire qui prend les dégâts quand une carte est prise pour cible : le premier encore debout
 * d'un lot (le premier tout court si tous sont tombés) ; 0 pour une créature ou un démon seul ;
 * `null` pour un héros ou un PNJ, qui n'ont pas d'exemplaires. */
export function firstStandingInstance(card: TapisCard): number | null {
  if (card.instances) {
    const standing = card.instances.findIndex((value) => value > 0);
    return standing >= 0 ? standing : 0;
  }
  return card.kind === 'creature' || card.kind === 'demon' ? 0 : null;
}

/** Nom de la cible dans le dialogue d'attaque : « Hippocampe #2 » pour l'exemplaire visé d'un lot. */
export function targetLabel(card: TapisCard): string {
  const index = firstStandingInstance(card);
  return card.instances && index !== null ? `${card.nom} #${index + 1}` : card.nom;
}

/** Jeton (`PlayToken`) correspondant à une carte, pour en résoudre les stats de combat : celui du
 * héros ou du PNJ, ou celui d'un exemplaire donné pour une créature ou un démon. */
export function tokenForCard<T extends Pick<PlayToken, 'kind' | 'pivotId' | 'instanceIndex'>>(
  tokens: readonly T[],
  card: TapisCard,
  instanceIndex: number | null,
): T | null {
  return (
    tokens.find(
      (token) =>
        token.kind === card.kind && token.pivotId === card.pivotId && (token.instanceIndex ?? null) === instanceIndex,
    ) ?? null
  );
}

/** Annonce du tour pour les lecteurs d'écran. */
export function turnAnnouncement(ordered: readonly OrderedCard[], etat: EtatCombat): string {
  const activeKey = turnState(ordered, etat).activeKey;
  const active = ordered.find((entry) => entry.card.key === activeKey)?.card;
  return active ? `Round ${etat.round}. À ${active.nom} de jouer.` : `Round ${etat.round}. Plus personne ne peut jouer.`;
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `cd front && npx ng test --watch=false --include "**/combat-turn.util.spec.ts" --include "**/shortcut.util.spec.ts"`
Expected: PASS.

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent.

- [ ] **Step 6: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol
git commit -m "feat(combat): fonctions pures du tour de jeu"
```

---

### Task 3: Choix d'arme et de posture — utilitaire partagé et barre d'action

**Files:**
- Create: `front/src/app/bol/session/attack-options.util.ts`
- Create: `front/src/app/bol/session/attack-options.util.spec.ts` (déplacé depuis `play/attack-menu/attack-menu.spec.ts`)
- Create: `front/src/app/bol/session/play/tapis/action-bar.ts`
- Create: `front/src/app/bol/session/play/tapis/action-bar.html`
- Create: `front/src/app/bol/session/play/tapis/action-bar.scss`
- Modify: `front/src/app/bol/session/play/attack-menu/attack-menu.ts` (réimporte depuis l'utilitaire, en attendant sa suppression à la tâche 7)
- Delete: `front/src/app/bol/session/play/attack-menu/attack-menu.spec.ts`

**Interfaces:**
- Consumes: `BolCombatOptionModel` (`services/bol-combat-reference.service.ts`) ; `BolHerosArmeModel` (`models/bol-arme.model.ts`) ; `dualStrikeDegats`, `isDualWieldEligible` (`session/combat-attack.util.ts`) ; `TapisCard`.
- Produces:
  - `attack-options.util.ts` : `filterAttackMenuCombatOptions`, `filterVisiblePostures` (inchangées), `DUAL_WIELD_SLUGS`, `MAINS_NUES`, `ARME_IMPROVISEE`, `interface AttackChoice { readonly degats: string | null; readonly posture: BolCombatOptionModel | null }`.
  - `ActionBarComponent`, sélecteur `bol-action-bar` : `card = input.required<TapisCard>()`, `armes = input<readonly BolHerosArmeModel[]>([])`, `combatOptions = input<readonly BolCombatOptionModel[]>([])` ; sorties `choiceChanged` (`AttackChoice | null` — `null` quand une posture à deux armes est choisie sans arme secondaire jouable), `totalDefenseRequested`, `endTurnRequested` (`void`).

- [ ] **Step 1: Déplacer les fonctions pures et leurs tests**

Créer `front/src/app/bol/session/attack-options.util.ts` :

```ts
import {BolHerosArmeModel} from '../models/bol-arme.model';
import {BolCombatOptionModel} from '../services/bol-combat-reference.service';
import {isDualWieldEligible} from './combat-attack.util';

/** Postures proposées à l'attaquant (doc/rules/02-actions-combat.md, "Options de combat") — "Défense
 * totale" en est exclue : elle empêche d'attaquer, elle a son propre bouton dans la barre d'action. */
const IN_SCOPE_POSTURE_SLUGS: ReadonlySet<string> = new Set([
  'none',
  'offensive',
  'intrepid',
  'defensive',
  'armor-chink',
  'dual-parry',
  'dual-strike',
]);

export const DUAL_WIELD_SLUGS: ReadonlySet<string> = new Set(['dual-parry', 'dual-strike']);

/** Options de combat proposées à l'attaquant, triées par ordre d'affichage — "Aucune" en premier. */
export function filterAttackMenuCombatOptions(options: readonly BolCombatOptionModel[]): readonly BolCombatOptionModel[] {
  return options.filter((o) => IN_SCOPE_POSTURE_SLUGS.has(o.slug)).sort((a, b) => a.ordre - b.ordre);
}

/** Masque les postures de combat à deux armes tant qu'elles ne sont pas jouables : l'arme principale
 * ET au moins une autre arme doivent toutes deux être légères ou moyennes (02-actions-combat.md). */
export function filterVisiblePostures(
  options: readonly BolCombatOptionModel[],
  mainDegats: string | null,
  otherArmesDegats: readonly (string | null)[],
): readonly BolCombatOptionModel[] {
  const dualWieldPlayable = isDualWieldEligible(mainDegats) && otherArmesDegats.some((d) => isDualWieldEligible(d));
  return dualWieldPlayable ? options : options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
}

/** Options toujours disponibles à un héros en plus de ses armes (table des dégâts de BoL). */
export const MAINS_NUES: BolHerosArmeModel = {
  id: -1,
  arme_id: -1,
  arme: {id: null, arme: 'Mains nues', type: 'M', degats: 'd3', portee: null, notes: null},
};
export const ARME_IMPROVISEE: BolHerosArmeModel = {
  id: -2,
  arme_id: -2,
  arme: {id: null, arme: 'Arme improvisée', type: 'M', degats: 'd3', portee: null, notes: null},
};

/** Ce avec quoi la carte active attaque : les dégâts de l'arme choisie (`null` = ceux de la carte,
 * pour un PNJ, une créature ou un démon) et la posture (`null` = aucune). */
export interface AttackChoice {
  readonly degats: string | null;
  readonly posture: BolCombatOptionModel | null;
}
```

Déplacer le fichier de test et corriger ses imports :

```bash
cd front/src/app/bol/session
git mv play/attack-menu/attack-menu.spec.ts attack-options.util.spec.ts
```

Dans `attack-options.util.spec.ts`, remplacer les deux lignes d'import relatives par :

```ts
import {BolCombatOptionModel} from '../services/bol-combat-reference.service';
import {filterAttackMenuCombatOptions, filterVisiblePostures} from './attack-options.util';
```

Dans `play/attack-menu/attack-menu.ts` (supprimé à la tâche 7, mais qui doit compiler d'ici là) : supprimer les déclarations locales `IN_SCOPE_POSTURE_SLUGS`, `DUAL_WIELD_SLUGS`, `filterAttackMenuCombatOptions`, `filterVisiblePostures`, `MAINS_NUES`, `ARME_IMPROVISEE`, et ajouter l'import :

```ts
import {
  ARME_IMPROVISEE,
  DUAL_WIELD_SLUGS,
  filterAttackMenuCombatOptions,
  filterVisiblePostures,
  MAINS_NUES,
} from '../../attack-options.util';
```

puis, pour que `battlemap.ts` continue d'importer `filterAttackMenuCombatOptions` depuis ce fichier, ajouter en bas de `attack-menu.ts` : `export {filterAttackMenuCombatOptions} from '../../attack-options.util';`.

Run: `cd front && npx ng test --watch=false --include "**/attack-options.util.spec.ts"`
Expected: PASS (les tests existants, inchangés).

- [ ] **Step 2: La barre d'action**

Créer `front/src/app/bol/session/play/tapis/action-bar.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {
  ARME_IMPROVISEE,
  AttackChoice,
  DUAL_WIELD_SLUGS,
  filterAttackMenuCombatOptions,
  filterVisiblePostures,
  MAINS_NUES,
} from '../../attack-options.util';
import {dualStrikeDegats, isDualWieldEligible} from '../../combat-attack.util';
import {TapisCard} from './tapis.util';

/** Barre d'action de la carte active, entre les deux rangs du tapis en combat : arme, posture, arme
 * secondaire, « Défense totale » et « Fin du tour ». Elle ne lance pas l'attaque — c'est le clic sur
 * une carte adverse qui la lance — mais dit à la page avec quoi attaquer (`choiceChanged`). */
@Component({
  selector: 'bol-action-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './action-bar.html',
  styleUrl: './action-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionBarComponent {
  readonly card = input.required<TapisCard>();
  /** Armes du héros actif — vide pour un PNJ, une créature ou un démon, ou tant qu'elles chargent. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);

  readonly choiceChanged = output<AttackChoice | null>();
  readonly totalDefenseRequested = output<void>();
  readonly endTurnRequested = output<void>();

  protected readonly isHero = computed(() => this.card().kind === 'hero');

  /** Armes proposées : celles du héros, puis mains nues et arme improvisée. Un non-héros attaque
   * avec les dégâts de sa carte : pas de choix. */
  protected readonly displayArmes = computed(() => (this.isHero() ? [...this.armes(), MAINS_NUES, ARME_IMPROVISEE] : []));

  // Les choix repartent de zéro à chaque nouvelle carte active.
  private readonly selectedArmeId = linkedSignal<string, number | null>({source: () => this.card().key, computation: () => null});
  private readonly selectedOptionSlug = linkedSignal<string, string | null>({source: () => this.card().key, computation: () => null});
  private readonly selectedOffHandId = linkedSignal<string, number | null>({source: () => this.card().key, computation: () => null});

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    return list.find((a) => a.id === this.selectedArmeId()) ?? list[0] ?? null;
  });

  /** Armes éligibles en second (légères ou moyennes, hors l'arme principale). */
  protected readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    return this.displayArmes().filter((a) => a.id !== mainId && isDualWieldEligible(a.arme?.degats));
  });

  protected readonly visibleOptions = computed(() => {
    const options = filterAttackMenuCombatOptions(this.combatOptions());
    if (!this.isHero()) {
      return options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
    }
    const otherDegats = this.eligibleOffHandArmes().map((a) => a.arme?.degats ?? null);
    return filterVisiblePostures(options, this.effectiveArme()?.arme?.degats ?? null, otherDegats);
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.visibleOptions();
    return list.find((o) => o.slug === this.selectedOptionSlug()) ?? list[0] ?? null;
  });

  protected readonly isDualWieldSelected = computed(() => DUAL_WIELD_SLUGS.has(this.effectiveOption()?.slug ?? ''));

  protected readonly effectiveOffHand = computed(() => {
    const list = this.eligibleOffHandArmes();
    return list.find((a) => a.id === this.selectedOffHandId()) ?? list[0] ?? null;
  });

  /** Ce avec quoi la carte attaque — `null` si une posture à deux armes est choisie sans arme
   * secondaire jouable. */
  private readonly choice = computed<AttackChoice | null>(() => {
    if (this.isDualWieldSelected() && !this.effectiveOffHand()) {
      return null;
    }

    const option = this.effectiveOption();
    const mainDegats = this.isHero() ? (this.effectiveArme()?.arme?.degats ?? null) : null;
    const offHand = this.effectiveOffHand();
    const degats = option?.slug === 'dual-strike' && offHand ? dualStrikeDegats(mainDegats, offHand.arme?.degats) : mainDegats;

    return {degats, posture: option && option.slug !== 'none' ? option : null};
  });

  constructor() {
    effect(() => this.choiceChanged.emit(this.choice()));
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected selectOption(slug: string): void {
    this.selectedOptionSlug.set(slug);
    if (!DUAL_WIELD_SLUGS.has(slug)) {
      this.selectedOffHandId.set(null);
    }
  }

  protected selectOffHand(id: number | undefined): void {
    this.selectedOffHandId.set(id ?? null);
  }
}
```

Créer `front/src/app/bol/session/play/tapis/action-bar.html` :

```html
<div class="acb" role="group" [attr.aria-label]="'Actions de ' + card().nom">
  <div class="acb-who">
    <span class="acb-eyebrow">À elle de jouer</span>
    <strong class="acb-name">{{ card().nom }}</strong>
    <span class="acb-hint">Clique une carte adverse pour attaquer.</span>
  </div>

  <div class="acb-choices">
    @if (displayArmes().length > 0) {
      <div class="acb-group" role="group" aria-label="Arme">
        <span class="acb-eyebrow">Arme</span>
        <div class="acb-chips">
          @for (a of displayArmes(); track a.id) {
            <button
              type="button"
              class="acb-chip"
              [class.acb-chip--selected]="effectiveArme()?.id === a.id"
              [attr.aria-pressed]="effectiveArme()?.id === a.id"
              (click)="selectArme(a.id)"
            >
              {{ a.arme?.arme }}
              @if (a.arme?.degats) {
                <span class="acb-chip-mod">{{ a.arme?.degats }}</span>
              }
            </button>
          }
        </div>
      </div>
    } @else {
      <div class="acb-group">
        <span class="acb-eyebrow">Dégâts</span>
        <span class="acb-fixed">{{ card().degats }}</span>
      </div>
    }

    @if (visibleOptions().length > 1) {
      <div class="acb-group" role="group" aria-label="Posture">
        <span class="acb-eyebrow">Posture</span>
        <div class="acb-chips">
          @for (o of visibleOptions(); track o.slug) {
            <button
              type="button"
              class="acb-chip"
              [class.acb-chip--selected]="effectiveOption()?.slug === o.slug"
              [attr.aria-pressed]="effectiveOption()?.slug === o.slug"
              [matTooltip]="o.note"
              (click)="selectOption(o.slug)"
            >
              {{ o.label }}
            </button>
          }
        </div>
      </div>
    }

    @if (isDualWieldSelected()) {
      <div class="acb-group" role="group" aria-label="Arme secondaire">
        <span class="acb-eyebrow">Arme secondaire</span>
        <div class="acb-chips">
          @for (a of eligibleOffHandArmes(); track a.id) {
            <button
              type="button"
              class="acb-chip"
              [class.acb-chip--selected]="effectiveOffHand()?.id === a.id"
              [attr.aria-pressed]="effectiveOffHand()?.id === a.id"
              (click)="selectOffHand(a.id)"
            >
              {{ a.arme?.arme }}
              @if (a.arme?.degats) {
                <span class="acb-chip-mod">{{ a.arme?.degats }}</span>
              }
            </button>
          } @empty {
            <span class="acb-hint">Aucune arme secondaire légère ou moyenne.</span>
          }
        </div>
      </div>
    }
  </div>

  <div class="acb-actions">
    <button
      mat-stroked-button
      size="small"
      type="button"
      matTooltip="+2 en défense, pas d'attaque ce round. Termine le tour."
      (click)="totalDefenseRequested.emit()"
    >
      <mat-icon>shield</mat-icon> Défense totale
    </button>
    <button mat-flat-button size="small" type="button" matTooltip="Raccourci : F" (click)="endTurnRequested.emit()">
      <mat-icon>skip_next</mat-icon> Fin du tour
    </button>
  </div>
</div>
```

Créer `front/src/app/bol/session/play/tapis/action-bar.scss` :

```scss
:host {
  display: block;
  align-self: center;
  max-width: 100%;
}

.acb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem 1.2rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--dw-color-legendary);
  border-radius: 8px;
  background: var(--dw-surface-0);
}

.acb-who {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.acb-eyebrow {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

.acb-name {
  font-family: 'Muse Display Harmony', 'Muse Sans', serif;
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--dw-color-legendary);
}

.acb-hint {
  font-size: 0.76rem;
  color: var(--dw-surface-500);
}

.acb-choices {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.1rem;
}

.acb-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.acb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.acb-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--dw-border);
  border-radius: 999px;
  background: var(--dw-surface-100);
  color: var(--dw-surface-700);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: var(--dw-surface-500);
    color: var(--dw-surface-900);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-color-legendary);
    outline-offset: 2px;
  }
}

.acb-chip--selected {
  border-color: var(--dw-color-legendary);
  background: var(--dw-color-legendary);
  color: #1c1200;

  &:hover {
    color: #1c1200;
  }
}

.acb-chip-mod {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}

.acb-fixed {
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dw-surface-900);
}

.acb-actions {
  flex-shrink: 0;
  display: flex;
  gap: 0.4rem;
}
```

- [ ] **Step 3: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent.

- [ ] **Step 4: Commit** (ignoré sans autorisation)

```bash
git add -A front/src/app/bol/session
git commit -m "feat(combat): barre d'action (arme, posture, défense totale, fin du tour)"
```

---

### Task 4: La bande d'ordre (`bol-turn-order`)

**Files:**
- Create: `front/src/app/bol/session/play/tapis/turn-order.ts`
- Create: `front/src/app/bol/session/play/tapis/turn-order.html`
- Create: `front/src/app/bol/session/play/tapis/turn-order.scss`

**Interfaces:**
- Consumes: `TurnStatus` (tâche 2), `TapisKind`.
- Produces: `interface TurnOrderEntry { readonly key: string; readonly nom: string; readonly kind: TapisKind; readonly status: TurnStatus }` ; `TurnOrderComponent`, sélecteur `bol-turn-order` : `entries = input.required<readonly TurnOrderEntry[]>()`, `round = input.required<number>()`, `announcement = input('')` ; sorties `reordered` (`readonly string[]`, clés de carte dans le nouvel ordre), `gaveBack` (`string`, clé), `addRequested` (`void`).

- [ ] **Step 1: Écrire le composant**

Créer `front/src/app/bol/session/play/tapis/turn-order.ts` :

```ts
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnStatus} from './combat-turn.util';
import {TapisKind} from './tapis.util';

export interface TurnOrderEntry {
  readonly key: string;
  readonly nom: string;
  readonly kind: TapisKind;
  readonly status: TurnStatus;
}

const STATUS_LABELS: Record<TurnStatus, string> = {
  active: 'à elle de jouer',
  played: 'a joué',
  skipped: 'ne joue pas ce round',
  upcoming: 'à venir',
};

/** Bande d'ordre du combat : le round, puis les cartes dans l'ordre de jeu de BoL. Réordonnable par
 * glisser-déposer (persisté par la page) ; une carte qui a joué peut reprendre la main. */
@Component({
  selector: 'bol-turn-order',
  imports: [DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './turn-order.html',
  styleUrl: './turn-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnOrderComponent {
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  /** Texte annoncé aux lecteurs d'écran à chaque changement de tour ou de round. */
  readonly announcement = input('');

  readonly reordered = output<readonly string[]>();
  readonly gaveBack = output<string>();
  readonly addRequested = output<void>();

  protected statusLabel(status: TurnStatus): string {
    return STATUS_LABELS[status];
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const keys = this.entries().map((entry) => entry.key);
    moveItemInArray(keys, event.previousIndex, event.currentIndex);
    this.reordered.emit(keys);
  }
}
```

Créer `front/src/app/bol/session/play/tapis/turn-order.html` :

```html
<div class="tor">
  <span class="tor-round">Round {{ round() }}</span>

  <ol
    class="tor-list"
    aria-label="Ordre de jeu — glisser-déposer pour réordonner"
    cdkDropList
    cdkDropListOrientation="horizontal"
    (cdkDropListDropped)="onDrop($event)"
  >
    @for (entry of entries(); track entry.key) {
      <li
        cdkDrag
        [class]="'tor-chip tor-chip--' + entry.kind + ' tor-chip--' + entry.status"
        [attr.aria-current]="entry.status === 'active' ? 'true' : null"
      >
        <span class="tor-dot"></span>
        <span class="tor-name">{{ entry.nom }}</span>
        <span class="tor-status">{{ statusLabel(entry.status) }}</span>
        @if (entry.status === 'played') {
          <button
            type="button"
            class="tor-back"
            [attr.aria-label]="'Rendre la main à ' + entry.nom"
            matTooltip="Rendre la main"
            (click)="gaveBack.emit(entry.key)"
          >
            <mat-icon>undo</mat-icon>
          </button>
        }
      </li>
    }
  </ol>

  <button mat-stroked-button size="small" type="button" class="tor-add" (click)="addRequested.emit()">
    <mat-icon>add</mat-icon> Ajouter
  </button>

  <p class="tor-live" aria-live="polite">{{ announcement() }}</p>
</div>
```

Créer `front/src/app/bol/session/play/tapis/turn-order.scss` :

```scss
:host {
  display: block;
  flex-shrink: 0;
}

.tor {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.45rem 0.9rem;
  border-bottom: 1px solid var(--dw-border);
  background: var(--dw-surface-50);
}

.tor-round {
  flex-shrink: 0;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--dw-color-legendary);
  border-radius: 999px;
  color: var(--dw-color-legendary);
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.tor-list {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0.15rem 0;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent;
}

.tor-chip {
  --tor-kind: var(--dw-color-reussite);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--dw-border);
  border-radius: 999px;
  background: var(--dw-surface-100);
  color: var(--dw-surface-700);
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: grab;

  &.cdk-drag-preview {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  }

  &.cdk-drag-placeholder {
    opacity: 0.35;
  }
}

.tor-chip--pnj { --tor-kind: var(--dw-color-pnj); }
.tor-chip--creature { --tor-kind: var(--dw-color-creature); }
.tor-chip--demon { --tor-kind: var(--dw-color-demon); }

.tor-chip--active {
  border-color: var(--dw-color-legendary);
  color: var(--dw-color-legendary);
  font-weight: 700;
}

.tor-chip--played {
  opacity: 0.55;
}

.tor-chip--skipped {
  opacity: 0.45;

  .tor-name {
    text-decoration: line-through;
  }
}

.tor-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--tor-kind);
}

// L'état est dit par la forme (or, estompé, barré) et lu par les lecteurs d'écran.
.tor-status,
.tor-live {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.tor-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  .mat-icon {
    font-size: 0.95rem;
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover {
    background: var(--dw-surface-200);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-color-legendary);
  }
}

.tor-add {
  flex-shrink: 0;
}
```

- [ ] **Step 2: Valider**

Run: `cd front && npm run build`
Expected: build réussi (branché à la tâche 7).

- [ ] **Step 3: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/tapis
git commit -m "feat(combat): bande d'ordre (bol-turn-order)"
```

---

### Task 5: Les cartes en combat

**Files:**
- Modify: `front/src/app/bol/session/play/tapis/character-card.ts`
- Modify: `front/src/app/bol/session/play/tapis/character-card.html` (réécrit)
- Modify: `front/src/app/bol/session/play/tapis/character-card.scss`
- Modify: `front/src/app/bol/session/play/tapis/expanded-card.ts`
- Modify: `front/src/app/bol/session/play/tapis/expanded-card.html`

**Interfaces:**
- Consumes: `CardCombatState` (tâche 2).
- Produces:
  - `CharacterCardComponent` gagne `combat = input<CardCombatState | null>(null)` et la sortie `expandRequested = output<void>()` (bouton « déplier », affiché seulement quand `combat` n'est pas nul). `toggled` reste le clic sur la face.
  - `ExpandedCardComponent` gagne `mode = input<'libre' | 'combat'>('libre')`, `canAttack = input(false)` et la sortie `attackRequested = output<TapisCard>()`.

- [ ] **Step 1: La face en combat**

Dans `character-card.ts` :

- ajouter l'import `import {CardCombatState} from './combat-turn.util';` ;
- ajouter après `readonly toggled = output<void>();` :

```ts
  /** État de la carte dans le combat — `null` en mode libre. */
  readonly combat = input<CardCombatState | null>(null);
  /** Bouton « déplier » de la face, affiché en combat (le clic sur la face y sert à attaquer). */
  readonly expandRequested = output<void>();
```

- remplacer `protected readonly ariaLabel = computed(() => cardAriaLabel(this.card()));` par :

```ts
  /** Libellé accessible : en combat, une carte désignable s'annonce comme une cible, et l'état de la
   * carte dans le round est dit. */
  protected readonly ariaLabel = computed(() => {
    const base = cardAriaLabel(this.card());
    const combat = this.combat();
    if (!combat) {
      return base;
    }

    const states = [
      combat.out ? 'hors combat' : null,
      combat.status === 'active' ? 'à elle de jouer' : null,
      combat.status === 'played' ? 'a joué' : null,
      combat.locked ? 'bloquée ce round' : null,
      combat.defenseTotale ? 'en défense totale' : null,
    ].filter((state): state is string => state !== null);
    const described = states.length ? `${base}, ${states.join(', ')}` : base;
    return combat.targetable ? `Attaquer ${described}` : described;
  });
```

Remplacer tout le contenu de `character-card.html` par :

```html
<div class="chc-wrap">
  <button
    type="button"
    [id]="'chc-' + card().key"
    [class]="'chc chc--' + card().kind"
    [class.chc--active]="combat()?.status === 'active'"
    [class.chc--played]="combat()?.status === 'played'"
    [class.chc--targetable]="combat()?.targetable"
    [class.chc--out]="combat()?.out"
    aria-expanded="false"
    [attr.aria-label]="ariaLabel()"
    (click)="toggled.emit()"
  >
    @if (card().badge; as badge) {
      <span class="chc-badge">{{ badge }}</span>
    }
    <span class="chc-name">{{ card().nom }}</span>

    <span class="chc-art">
      @if (hasAvatar()) {
        <img class="chc-avatar" [src]="card().avatar" alt="" (error)="onAvatarError()" />
      } @else if (kindIconIsSvg()) {
        <mat-icon [svgIcon]="kindIcon()" />
      } @else {
        <mat-icon>{{ kindIcon() }}</mat-icon>
      }
      @if (combat()?.defenseTotale) {
        <mat-icon class="chc-marker chc-marker--defense" aria-hidden="true">shield</mat-icon>
      }
      @if (combat()?.locked) {
        <mat-icon class="chc-marker chc-marker--locked" aria-hidden="true">lock</mat-icon>
      }
    </span>

    <span class="chc-stats">
      <span class="chc-stat"><small>Dég.</small>{{ card().degats }}</span>
      <span class="chc-stat"><small>Déf.</small>{{ card().defense }}</span>
      <span class="chc-stat"><small>Vit.</small>{{ vitalite() }}</span>
    </span>

    @if (card().instances; as instances) {
      <span class="chc-pips">
        @for (value of instances; track $index) {
          <i
            class="chc-pip"
            role="img"
            [class.chc-pip--low]="value > 0 && instanceLow(value)"
            [class.chc-pip--out]="value <= 0"
            [attr.aria-label]="instanceLabel($index, value)"
          ></i>
        }
      </span>
    } @else {
      <span class="chc-bar"><i [class.chc-bar-fill--low]="low()" class="chc-bar-fill" [style.width.%]="percent()"></i></span>
    }
  </button>

  @if (combat()) {
    <button
      type="button"
      class="chc-expand"
      [attr.aria-label]="'Déplier la carte de ' + card().nom"
      (click)="expandRequested.emit()"
    >
      <mat-icon>open_in_full</mat-icon>
    </button>
  }
</div>
```

Dans `character-card.scss`, ajouter à la fin :

```scss
// En combat, la face est un bouton d'action (attaquer) et un second bouton, posé dessus, la déplie :
// deux boutons frères, jamais imbriqués.
.chc-wrap {
  position: relative;
}

.chc-expand {
  position: absolute;
  left: 0.3rem;
  bottom: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 1px solid var(--dw-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dw-surface-0) 80%, transparent);
  color: var(--dw-surface-600);
  cursor: pointer;

  .mat-icon {
    font-size: 0.95rem;
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover {
    color: var(--dw-surface-900);
    border-color: var(--dw-surface-500);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-color-legendary);
    outline-offset: 2px;
  }
}

// Carte active : soulevée, cerclée d'or.
.chc--active {
  transform: translateY(-8px);
  border-color: var(--dw-color-legendary);
  box-shadow: 0 0 0 2px var(--dw-color-legendary), 0 10px 22px rgba(0, 0, 0, 0.5);

  &:hover {
    transform: translateY(-8px);
    border-color: var(--dw-color-legendary);
  }
}

// A joué ce round.
.chc--played {
  opacity: 0.5;
}

// Désignable : liseré rouge au survol et au focus.
.chc--targetable {
  cursor: crosshair;

  &:hover,
  &:focus-visible {
    border-color: var(--dw-color-echec-forte);
    box-shadow: 0 0 0 2px var(--dw-color-echec-forte);
    outline: none;
  }
}

// Hors combat : grisée, reste sur le tapis.
.chc--out {
  opacity: 0.4;
  filter: grayscale(1);
}

@media (prefers-reduced-motion: reduce) {
  .chc--active,
  .chc--active:hover {
    transform: none;
  }
}

.chc-art {
  position: relative;
}

.chc-marker {
  position: absolute;
  bottom: 0.2rem;
  padding: 0.1rem;
  border-radius: 4px;
  background: var(--dw-surface-0);
  font-size: 1rem;
  width: 1.2rem;
  height: 1.2rem;
}

.chc-marker--defense {
  right: 0.25rem;
  color: var(--dw-color-dice-kicker);
}

.chc-marker--locked {
  right: 1.7rem;
  color: var(--dw-surface-500);
}
```

Le bloc `.chc-art { position: relative; }` complète la règle `.chc-art` existante (même sélecteur, plus bas dans le fichier : la propriété s'ajoute).

- [ ] **Step 2: La carte dépliée en combat**

Dans `expanded-card.ts`, ajouter après `readonly returnUrl = input<string | null>(null);` :

```ts
  /** En combat : pas de jet d'action ni de changement de camp. */
  readonly mode = input<'libre' | 'combat'>('libre');
  /** En combat, la carte active peut attaquer cette carte (qui n'est pas elle-même). */
  readonly canAttack = input(false);
```

et après `readonly fullSheetRequested = output<TapisCard>();` :

```ts
  /** « Attaquer cette carte » : le moyen de viser une carte de son propre camp. */
  readonly attackRequested = output<TapisCard>();
```

Dans `expanded-card.html` :

- remplacer la ligne `<bol-action-roll-panel [data]="h.actionRoll" [(heroisme)]="heroisme" (rolled)="rolled.emit($event)" />` par :

```html
        @if (mode() === 'libre') {
          <bol-action-roll-panel [data]="h.actionRoll" [(heroisme)]="heroisme" (rolled)="rolled.emit($event)" />
        }
```

- remplacer le bloc `@if (campLabel(); as label) { … }` (le bouton de changement de camp) par :

```html
        @if (mode() === 'libre') {
          @if (campLabel(); as label) {
            <button mat-stroked-button size="small" type="button" (click)="campToggleRequested.emit(card())">
              <mat-icon>swap_vert</mat-icon> {{ label }}
            </button>
          }
        }
```

- juste avant la balise fermante `</div>` de `<div class="exc-body">`, ajouter :

```html
    @if (canAttack()) {
      <button mat-flat-button size="small" type="button" class="exc-attack" (click)="attackRequested.emit(card())">
        <mat-icon svgIcon="sword" /> Attaquer cette carte
      </button>
    }
```

Dans `expanded-card.scss`, ajouter à la fin :

```scss
.exc-attack {
  align-self: flex-start;
}
```

- [ ] **Step 3: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent. Le mode libre ne change pas : `combat` vaut `null`, `mode` vaut `'libre'`.

- [ ] **Step 4: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/tapis
git commit -m "feat(combat): états de combat sur les cartes"
```

---

### Task 6: Le tapis en combat

**Files:**
- Modify: `front/src/app/bol/session/play/tapis/tapis.ts` (réécrit)
- Modify: `front/src/app/bol/session/play/tapis/tapis.html` (réécrit)

**Interfaces:**
- Consumes: `ActionBarComponent`, `AttackChoice` (tâche 3) ; `CardCombatState` (tâche 2) ; `CharacterCardComponent`, `ExpandedCardComponent` (tâche 5) ; `BolHerosArmeModel`, `BolCombatOptionModel`.
- Produces: `TapisComponent` gagne les entrées `mode = input<'libre' | 'combat'>('libre')`, `combatStates = input<ReadonlyMap<string, CardCombatState> | null>(null)`, `activeCard = input<TapisCard | null>(null)`, `armes = input<readonly BolHerosArmeModel[]>([])`, `combatOptions = input<readonly BolCombatOptionModel[]>([])` et les sorties `attackRequested` (`TapisCard`), `choiceChanged` (`AttackChoice | null`), `totalDefenseRequested`, `endTurnRequested` (`void`). Ses entrées et sorties existantes ne changent pas.

- [ ] **Step 1: Réécrire le composant**

Remplacer tout le contenu de `tapis.ts` par :

```ts
import {NgTemplateOutlet} from '@angular/common';
import {afterRenderEffect, ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {LastRoll} from '../../action-roll.util';
import {AttackChoice} from '../../attack-options.util';
import {ActionBarComponent} from './action-bar';
import {CharacterCardComponent} from './character-card';
import {CardCombatState} from './combat-turn.util';
import {ExpandedCardComponent, ExpandedHeroData} from './expanded-card';
import {splitRows, TapisCard} from './tapis.util';

/** Le tapis : deux rangs de cartes rangées automatiquement. Mode libre : « Présents dans la scène »
 * et « Héros et alliés », avec le bandeau « Dernier jet » entre les deux. Mode combat : « Adversaires »
 * et « Héros et alliés », avec la barre d'action de la carte active ; un clic sur une carte
 * désignable demande une attaque. La carte dépliée prend la place de sa face. Ne parle à aucun service. */
@Component({
  selector: 'bol-tapis',
  imports: [NgTemplateOutlet, CharacterCardComponent, ExpandedCardComponent, ActionBarComponent],
  templateUrl: './tapis.html',
  styleUrl: './tapis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TapisComponent {
  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  /** Clé de la carte dépliée — une seule à la fois. */
  readonly expandedKey = input<string | null>(null);
  readonly hero = input<ExpandedHeroData | null>(null);
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);
  readonly lastRoll = input<LastRoll | null>(null);

  readonly mode = input<'libre' | 'combat'>('libre');
  /** État de chaque carte dans le combat — `null` en mode libre. */
  readonly combatStates = input<ReadonlyMap<string, CardCombatState> | null>(null);
  /** Carte dont c'est le tour — `null` en mode libre ou quand plus personne ne peut jouer. */
  readonly activeCard = input<TapisCard | null>(null);
  /** Armes du héros actif, pour la barre d'action. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);

  readonly cardToggled = output<TapisCard>();
  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  readonly fullSheetRequested = output<TapisCard>();
  readonly attackRequested = output<TapisCard>();
  readonly choiceChanged = output<AttackChoice | null>();
  readonly totalDefenseRequested = output<void>();
  readonly endTurnRequested = output<void>();

  protected readonly rows = computed(() => splitRows(this.cards()));
  protected readonly topLabel = computed(() => (this.mode() === 'combat' ? 'Adversaires' : 'Présents dans la scène'));

  /** Dernière carte dépliée, pour rendre le focus à sa face quand elle se replie. */
  private previousKey: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const key = this.expandedKey();
      if (key === null && this.previousKey !== null) {
        document.getElementById(`chc-${this.previousKey}`)?.focus();
      }
      this.previousKey = key;
    });
  }

  protected stateOf(card: TapisCard): CardCombatState | null {
    return this.combatStates()?.get(card.key) ?? null;
  }

  /** Clic sur la face : en combat, une carte désignable est attaquée ; toute autre carte se déplie. */
  protected onFaceClick(card: TapisCard): void {
    if (this.stateOf(card)?.targetable) {
      this.attackRequested.emit(card);
    } else {
      this.cardToggled.emit(card);
    }
  }

  /** « Attaquer cette carte » sur la carte dépliée : en combat, pour toute carte qui n'est ni la
   * carte active ni hors combat. */
  protected canAttack(card: TapisCard): boolean {
    const active = this.activeCard();
    return this.mode() === 'combat' && active !== null && active.key !== card.key && !this.stateOf(card)?.out;
  }
}
```

Remplacer tout le contenu de `tapis.html` par :

```html
<div class="tps">
  <section class="tps-row" aria-labelledby="tps-presents-label">
    <h2 class="tps-row-label" id="tps-presents-label">{{ topLabel() }}</h2>
    <ng-container
      *ngTemplateOutlet="
        rowTpl;
        context: {cards: rows().presents, labelId: 'tps-presents-label', empty: 'Personne ici pour l’instant. Pose des personnages depuis la réserve.'}
      "
    />
  </section>

  @if (mode() === 'combat') {
    @if (activeCard(); as active) {
      <bol-action-bar
        [card]="active"
        [armes]="armes()"
        [combatOptions]="combatOptions()"
        (choiceChanged)="choiceChanged.emit($event)"
        (totalDefenseRequested)="totalDefenseRequested.emit()"
        (endTurnRequested)="endTurnRequested.emit()"
      />
    } @else {
      <p class="tps-nobody">Plus personne ne peut jouer.</p>
    }
  } @else {
    <div class="tps-last-roll" aria-live="polite" [class.tps-last-roll--empty]="!lastRoll()">
      @if (lastRoll(); as roll) {
        <span class="tps-last-roll-label">Dernier jet</span>
        <span class="tps-last-roll-formula">{{ roll.nom }} · {{ roll.formula }} → {{ roll.total }}</span>
        <strong [class]="'tps-last-roll-result tps-last-roll-result--' + roll.tone">{{ roll.label }}</strong>
      }
    </div>
  }

  <section class="tps-row tps-row--heros" aria-labelledby="tps-heros-label">
    <ng-container
      *ngTemplateOutlet="rowTpl; context: {cards: rows().heros, labelId: 'tps-heros-label', empty: 'Aucun héros à table.'}"
    />
    <h2 class="tps-row-label" id="tps-heros-label">Héros et alliés</h2>
  </section>
</div>

<ng-template #rowTpl let-cards="cards" let-labelId="labelId" let-empty="empty">
  <ul class="tps-cards" role="list" [attr.aria-labelledby]="labelId">
    @for (card of cards; track card.key) {
      <li class="tps-slot">
        @if (card.key === expandedKey()) {
          <bol-expanded-card
            [card]="card"
            [sessionId]="sessionId()"
            [hero]="hero()"
            [statblock]="statblock()"
            [returnUrl]="returnUrl()"
            [mode]="mode()"
            [canAttack]="canAttack(card)"
            (closed)="closed.emit()"
            (changed)="changed.emit()"
            (rolled)="rolled.emit($event)"
            (removeRequested)="removeRequested.emit($event)"
            (campToggleRequested)="campToggleRequested.emit($event)"
            (fullSheetRequested)="fullSheetRequested.emit($event)"
            (attackRequested)="attackRequested.emit($event)"
          />
        } @else {
          <bol-character-card
            [card]="card"
            [combat]="stateOf(card)"
            (toggled)="onFaceClick(card)"
            (expandRequested)="cardToggled.emit(card)"
          />
        }
      </li>
    } @empty {
      <li class="tps-empty">{{ empty }}</li>
    }
  </ul>
</ng-template>
```

Dans `tapis.scss`, ajouter à la fin :

```scss
.tps-nobody {
  align-self: center;
  margin: 0;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--dw-border);
  border-radius: 8px;
  background: var(--dw-surface-0);
  font-size: 0.9rem;
  color: var(--dw-surface-500);
}
```

- [ ] **Step 2: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent. Le mode libre est inchangé (valeurs par défaut des nouvelles entrées).

- [ ] **Step 3: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/tapis
git commit -m "feat(combat): le tapis affiche le combat"
```

---

### Task 7: Brancher le combat dans la page, retirer le battlefield

**Files:**
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html` (réécrit)
- Modify: `front/src/app/bol/session/play/session-play-page.scss`
- Delete: `front/src/app/bol/session/play/battlemap/` (dossier entier, dont `token-layout.util.ts` et son test)
- Delete: `front/src/app/bol/session/play/initiative-rail/` (dossier entier)
- Delete: `front/src/app/bol/session/play/attack-menu/` (dossier entier)
- Modify: `front/src/app/bol/session/combat-play.util.ts` (retrait de `canTarget`)

**Interfaces:**
- Consumes: tout `combat-turn.util.ts` (tâche 2) ; `BolFightSessionService.updateCombatState` (tâche 2) ; `isEndTurnShortcut` (tâche 2) ; `AttackChoice` (tâche 3) ; `TurnOrderComponent`, `TurnOrderEntry` (tâche 4) ; `TapisComponent` en combat (tâche 6) ; `BolCombatReferenceService.getCombatOptions()` ; `resolveAttackStats(token, herosService)` et `AttackRollDialogComponent` (inchangés).

- [ ] **Step 1: Réécrire le template de la page**

Remplacer tout le contenu de `session-play-page.html` par :

```html
@if (loading()) {
  <div class="cp-status">Chargement de la table…</div>
} @else if (errorMessage()) {
  <div class="cp-status cp-status--error">
    <p>{{ errorMessage() }}</p>
    <a routerLink="/library/sessions">Voir mes sessions</a>
  </div>
} @else if (board(); as b) {
  <div class="cp-page">
    <bol-session-header
      [mode]="mode()"
      [titre]="headerTitle()"
      [legendaryActive]="b.legendaryActive"
      (startCombat)="openStartCombatDialog()"
      (endCombat)="askEndCombat()"
      (search)="openPalette()"
    />

    @if (sessionId(); as sid) {
      @if (mode() === 'combat') {
        <bol-turn-order
          [entries]="turnEntries()"
          [round]="etat().round"
          [announcement]="turnAnnouncement()"
          (reordered)="onTurnReordered($event)"
          (gaveBack)="onGiveBackTurn($event)"
          (addRequested)="openAddCombatantDialog()"
        />
      }

      <bol-tapis
        [cards]="cards()"
        [sessionId]="sid"
        [expandedKey]="expandedCard()?.key ?? null"
        [hero]="expandedHero()"
        [statblock]="expandedStatblock()"
        [returnUrl]="returnUrl()"
        [lastRoll]="lastRoll()"
        [mode]="mode()"
        [combatStates]="combatStates()"
        [activeCard]="activeCard()"
        [armes]="activeArmes()"
        [combatOptions]="combatOptions()"
        (cardToggled)="onCardToggled($event)"
        (closed)="foldCard()"
        (changed)="reloadSession()"
        (rolled)="lastRoll.set($event)"
        (removeRequested)="askRemoveCard($event)"
        (campToggleRequested)="toggleCamp($event)"
        (fullSheetRequested)="openFullSheet($event)"
        (attackRequested)="onAttackCard($event)"
        (choiceChanged)="attackChoice.set($event)"
        (totalDefenseRequested)="onTotalDefense()"
        (endTurnRequested)="onEndTurn()"
      />

      @if (mode() === 'libre') {
        <button
          type="button"
          class="spp-reserve-toggle"
          aria-controls="spp-reserve"
          [attr.aria-expanded]="reserveOpen()"
          (click)="toggleReserve()"
        >
          <mat-icon>{{ reserveOpen() ? 'expand_more' : 'expand_less' }}</mat-icon>
          {{ reserveOpen() ? 'Replier la réserve' : 'Déplier la réserve' }}
        </button>

        @if (reserveOpen()) {
          <aside id="spp-reserve" class="spp-reserve" aria-label="Réserve">
            <bol-reserve
              [sessionId]="sid"
              [existingHeroIds]="existingHeroIds()"
              [existingPnjIds]="existingPnjIds()"
              [currentSceneId]="session()?.scene_id ?? null"
              [nonHeroCount]="nonHeroCount()"
              (sceneChanged)="onSceneChanged()"
              (placed)="reloadSession()"
            />
          </aside>
        }
      }
    }
  </div>
}
```

Dans `session-play-page.scss`, supprimer le bloc `.spp-combat` et son commentaire.

- [ ] **Step 2: Mettre à jour la classe de la page**

Dans `session-play-page.ts` :

**Imports.** Supprimer :

```ts
import {AttackRequest, BattlemapComponent, TokenPositionChange} from './battlemap/battlemap';
import {InitiativeRailComponent} from './initiative-rail/initiative-rail';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
```

Remplacer `import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';` par :

```ts
import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
```

Remplacer `import {BolCombatOptionModel} from '../../services/bol-combat-reference.service';` par :

```ts
import {BolCombatOptionModel, BolCombatReferenceService} from '../../services/bol-combat-reference.service';
```

Remplacer `import {BolStatblockComponent, BolStatblockData} from '../../shared/statblock/bol-statblock.component';` par :

```ts
import {BolStatblockData} from '../../shared/statblock/bol-statblock.component';
```

Remplacer `import {isPaletteShortcut} from './command-palette/shortcut.util';` par :

```ts
import {isEndTurnShortcut, isPaletteShortcut} from './command-palette/shortcut.util';
```

Ajouter :

```ts
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {AttackChoice} from '../attack-options.util';
import {
  buildCombatStates,
  CardCombatState,
  endTurn,
  EtatCombat,
  firstStandingInstance,
  giveBackTurn,
  normalizeEtat,
  orderCards,
  targetLabel,
  tokenForCard,
  totalDefense,
  turnAnnouncement,
  turnState,
} from './tapis/combat-turn.util';
import {TurnOrderComponent, TurnOrderEntry} from './tapis/turn-order';
```

**Décorateur.** Remplacer la liste `imports` par :

```ts
  imports: [RouterLink, MatIconModule, SessionHeaderComponent, ReserveComponent, TapisComponent, TurnOrderComponent],
```

et le commentaire de classe par :

```ts
/**
 * La table : page d'accueil d'une session. Orchestre le chargement/la persistance de la session et
 * l'ouverture des dialogs. `bol-tapis` (cartes de personnage sur deux rangs) sert aux deux modes.
 * Mode libre : `bol-reserve` en bandeau. Mode combat : `bol-turn-order` (ordre de jeu) ; le tour est
 * calculé par `combat-turn.util.ts` à partir de l'état gardé dans la session.
 */
```

**Injections.** Après `private readonly sceneActions = inject(SceneActionsService);`, ajouter :

```ts
  private readonly combatReference = inject(BolCombatReferenceService);
```

**Membres à supprimer** (commentaires compris) : `tokenPositions`, `orderedTokens`, `adversaireTokens`, `activeKey`. Conserver `board`, `mode`, `manualOrder`, `heroTokens` (utilisé par la récupération post-combat).

**`expandedCard`.** Une carte peut maintenant se déplier en combat. Remplacer :

```ts
  protected readonly expandedCard = computed(() => (this.mode() === 'libre' ? findCard(this.cards(), this.expandedKey()) : null));
```

par :

```ts
  protected readonly expandedCard = computed(() => findCard(this.cards(), this.expandedKey()));
```

**Membres à ajouter** après la déclaration de `expandedStatblock` :

```ts
  /** Options de combat (postures) — référence statique, chargée une fois. */
  protected readonly combatOptions = signal<readonly BolCombatOptionModel[]>([]);

  /** État du combat gardé dans la session (round, cartes qui ont joué, défense totale). */
  protected readonly etat = computed<EtatCombat>(() => normalizeEtat(this.session()?.etat_combat));

  /** Cartes dans l'ordre de jeu : initiative BoL des jetons, puis ordre manuel du MJ. */
  private readonly orderedCards = computed(() => orderCards(this.cards(), this.board()?.tokens ?? [], this.manualOrder()));

  private readonly turn = computed(() => turnState(this.orderedCards(), this.etat()));

  /** Carte dont c'est le tour — `null` hors combat, ou quand plus personne ne peut jouer. */
  protected readonly activeCard = computed(() => (this.mode() === 'combat' ? findCard(this.cards(), this.turn().activeKey) : null));

  protected readonly combatStates = computed<ReadonlyMap<string, CardCombatState> | null>(() =>
    this.mode() === 'combat' ? buildCombatStates(this.orderedCards(), this.etat()) : null,
  );

  protected readonly turnEntries = computed<readonly TurnOrderEntry[]>(() => {
    const statuses = this.turn().statuses;
    return this.orderedCards().map(({card}) => ({
      key: card.key,
      nom: cardLabel(card),
      kind: card.kind,
      status: statuses.get(card.key) ?? 'upcoming',
    }));
  });

  protected readonly turnAnnouncement = computed(() => turnAnnouncement(this.orderedCards(), this.etat()));

  /** Id du héros actif — les armes ne sont rechargées que lorsqu'il change, pas à chaque
   * rechargement de la session. */
  private readonly activeHeroId = computed(() => {
    const active = this.activeCard();
    return active?.kind === 'hero' ? active.sourceId : null;
  });
  protected readonly activeArmes = signal<readonly BolHerosArmeModel[]>([]);

  /** Arme et posture choisies dans la barre d'action — `null` si le choix n'est pas jouable. */
  protected readonly attackChoice = signal<AttackChoice | null>({degats: null, posture: null});
```

**Constructeur.** Remplacer :

```ts
    this.loadSession(id);
  }
```

par :

```ts
    this.loadSession(id);
    this.combatReference
      .getCombatOptions()
      .pipe(take(1))
      .subscribe((options) => this.combatOptions.set(options));

    // Armes du héros dont c'est le tour, pour la barre d'action.
    effect(() => {
      const herosId = this.activeHeroId();
      this.activeArmes.set([]);
      if (!herosId) {
        return;
      }
      this.herosService
        .heros(herosId)
        .pipe(take(1))
        .subscribe((hero) => {
          if (this.activeHeroId() !== herosId) {
            return;
          }
          const armes =
            Array.isArray(hero.armes) && hero.armes.length > 0 && typeof hero.armes[0] !== 'number'
              ? (hero.armes as BolHerosArmeModel[])
              : [];
          this.activeArmes.set(armes);
        });
    });
  }
```

Attention : le constructeur a un `return` anticipé quand l'id de route manque ; le bloc ci-dessus ne s'exécute alors pas, ce qui est voulu (la page affiche une erreur).

**Méthodes à supprimer** (commentaires compris) : `askRemoveCombatant`, `onAttackRequested`, `openAttackDialog` (ancienne, à jetons), `openStatblockFor`, `onRailReordered`, `onPositionChanged`.

**Méthodes à ajouter** après `tableError` :

```ts
  /** Enregistre l'état du combat, puis recharge la session : l'affichage suit toujours la base. */
  private saveEtat(next: EtatCombat): void {
    const sessionId = this.sessionId();
    if (!sessionId || this.mode() !== 'combat') {
      return;
    }

    this.fightSessionService
      .updateCombatState(sessionId, {round: next.round, joues: [...next.joues], defense_totale: [...next.defense_totale]})
      .subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => this.tableError(error, "Impossible d'enregistrer le tour."),
      });
  }

  protected onEndTurn(): void {
    this.saveEtat(endTurn(this.orderedCards(), this.etat()));
  }

  protected onTotalDefense(): void {
    this.saveEtat(totalDefense(this.orderedCards(), this.etat()));
  }

  protected onGiveBackTurn(key: string): void {
    this.saveEtat(giveBackTurn(this.etat(), key));
  }

  /** Réordonnancement de la bande d'ordre (glisser-déposer), persisté en base — clés de carte. */
  protected onTurnReordered(keys: readonly string[]): void {
    this.manualOrder.set(keys);

    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    this.fightSessionService.updateOrder(sessionId, keys).subscribe({
      error: (error: unknown) => this.tableError(error, "Impossible d'enregistrer ce nouvel ordre."),
    });
  }

  /** La carte active attaque `target` : clic sur une carte désignable, ou « Attaquer cette carte ». */
  protected onAttackCard(target: TapisCard): void {
    const attacker = this.activeCard();
    if (!attacker || attacker.key === target.key) {
      return;
    }

    const choice = this.attackChoice();
    if (!choice) {
      this.snackBar.open('Choisis une arme secondaire légère ou moyenne pour cette posture.', 'Fermer', {duration: 5000});
      return;
    }

    this.openAttackDialog(attacker, target, choice);
  }

  /** Ouvre le dialogue d'attaque existant, prérempli. Les stats sont résolues à partir des jetons
   * (`PlayToken`) correspondant aux deux cartes ; pour un lot pris pour cible, c'est le premier
   * exemplaire encore debout qui est visé et qui prend les dégâts. */
  private openAttackDialog(attacker: TapisCard, target: TapisCard, choice: AttackChoice): void {
    const sessionId = this.sessionId();
    const tokens = this.board()?.tokens ?? [];
    const targetIndex = firstStandingInstance(target);
    const attackerToken = tokenForCard(tokens, attacker, firstStandingInstance(attacker));
    const targetToken = tokenForCard(tokens, target, targetIndex);
    if (!sessionId || !attackerToken || !targetToken) {
      return;
    }

    const targetInTotalDefense = this.etat().defense_totale.includes(target.key);

    forkJoin({
      attacker: resolveAttackStats(attackerToken, this.herosService),
      target: resolveAttackStats(targetToken, this.herosService),
    }).subscribe(({attacker: attackerStats, target: targetStats}) => {
      const finalAttacker = choice.degats ? {...attackerStats, degats: choice.degats} : attackerStats;
      // Défense totale (02-actions-combat.md) : +2 en défense jusqu'au prochain tour de la cible.
      const finalTarget = targetInTotalDefense ? {...targetStats, defense: targetStats.defense + 2} : targetStats;
      const posture = choice.posture;

      this.dialog
        .open(AttackRollDialogComponent, {
          maxWidth: 'min(32rem, 92vw)',
          panelClass: 'atd-panel',
          data: {
            attackerNom: attacker.nom,
            targetNom: targetLabel(target),
            attackerAvatar: attacker.avatar,
            targetAvatar: target.avatar,
            attacker: finalAttacker,
            target: finalTarget,
            legendaryBonusActive: attackerToken.tier === 'legendaire',
            posture: posture ? {label: posture.label, slug: posture.slug, modificateur: posture.modificateur} : null,
          },
        })
        .afterClosed()
        .subscribe((delta: number | undefined) => {
          if (delta === undefined) {
            return;
          }

          this.fightSessionService.applyDamage(sessionId, target.kind, target.pivotId, delta, targetIndex).subscribe({
            next: () => {
              this.loadSession(sessionId);

              const newVitalite = (targetToken.vitaliteCourante ?? 0) + delta;
              if (targetStats.herosId && newVitalite < 0) {
                maybePromptDefierLaMort({
                  dialog: this.dialog,
                  fightSessionService: this.fightSessionService,
                  herosService: this.herosService,
                  sessionId,
                  herosId: targetStats.herosId,
                  pivotId: target.pivotId,
                  heroNom: target.nom,
                  vitaliteCourante: newVitalite,
                  heroisme: targetStats.heroisme ?? 0,
                  onApplied: () => this.loadSession(sessionId),
                });
              }
            },
            error: (error: unknown) => this.tableError(error, "Impossible d'appliquer les dégâts."),
          });
        });
    });
  }
```

**Raccourci `F`.** Remplacer la méthode `onKeydown` par :

```ts
  /** `/` ou `Ctrl+K` ouvre la barre de commande ; `F` termine le tour en combat. Rien de tout cela
   * quand un dialogue est ouvert. */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (isPaletteShortcut(event, target)) {
      event.preventDefault();
      this.openPalette();
    } else if (this.mode() === 'combat' && isEndTurnShortcut(event, target)) {
      event.preventDefault();
      this.onEndTurn();
    }
  }
```

**`loadSession`.** Supprimer la ligne `this.tokenPositions.set(session.positions_jetons ?? {});`.

**`askRemoveCard`.** La carte dépliée sert maintenant aussi en combat : rien à changer.

- [ ] **Step 3: Supprimer le battlefield, le ruban et le menu d'attaque**

```bash
rm -r front/src/app/bol/session/play/battlemap front/src/app/bol/session/play/initiative-rail front/src/app/bol/session/play/attack-menu
```

Dans `front/src/app/bol/session/combat-play.util.ts`, supprimer la fonction `canTarget` et son commentaire (elle ne servait qu'au battlefield) ; si `combat-play.util.spec.ts` la teste, y supprimer le bloc `describe('canTarget', …)` et son import.

Run: `grep -rn "battlemap\|initiative-rail\|attack-menu\|token-layout\|canTarget\|tokenPositions\|onRailReordered\|onPositionChanged\|orderedTokens\|adversaireTokens\|BattlemapComponent\|InitiativeRailComponent\|AttackMenuComponent" front/src/app --include=*.ts --include=*.html --include=*.scss`
Expected: aucune ligne hors commentaires. Corriger les commentaires qui citent encore `bol-battlemap`, `bol-initiative-rail` ou `bol-attack-menu` (dans `attack-roll-dialog.*`, `start-combat-dialog.*`, `combat-play.util.ts`, `combat-attack.util.ts`) en remplaçant ces noms par `bol-tapis`, `bol-turn-order` ou `bol-action-bar` selon le cas.

- [ ] **Step 4: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi sans erreur ni avertissement (en particulier aucun import inutilisé), tous les tests passent. Le nombre de tests baisse de ceux de `token-layout.util.spec.ts` (6) et de `canTarget` s'il y en avait.

- [ ] **Step 5: Commit** (ignoré sans autorisation)

```bash
git add -A front/src/app/bol/session
git commit -m "feat(combat): le combat se joue sur le tapis, retrait du battlefield"
```

---

### Task 8: Vérification de bout en bout

**Files:** aucun fichier créé dans le dépôt ; un script Playwright jetable dans `front/scripts/`, supprimé à la fin. Corrections éventuelles dans les fichiers des tâches précédentes.

**Interfaces:**
- Consumes: l'application complète. Skill `run`. Compte de test `claude-test@example.com` / `ClaudeTest123!`. API en conteneur, front sur `http://localhost:4200` (vérifier `<title>Front</title>`).

Le script crée une session et la supprime à la fin. Le combat est démarré par l'API (`PATCH …/start-combat`) : le dialogue de démarrage n'est pas modifié par ce chantier. Dans le dialogue d'attaque, saisir les totaux à la main (les dés 3D ne sont pas fiables sans affichage) ; repérer ses champs en lisant `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.html` avant d'écrire le script.

- [ ] **Step 1: Préparer**

Ouvrir une table avec deux héros ; poser un PNJ et le passer du côté des héros (allié) ; poser une créature simple ; poser un lot de trois (barre de commande, « 3 loup g »). Démarrer le combat par l'API et recharger.

- [ ] **Step 2: L'écran de combat**

Expected: aucun `bol-battlemap` ni `bol-initiative-rail` ; la bande d'ordre affiche « Round 1 » et une puce par carte (le lot compte pour une) ; le rang du haut s'intitule « Adversaires » ; une carte est active (soulevée, or) ; la barre d'action porte son nom ; la réserve est absente. Capture d'écran.

- [ ] **Step 3: Cibles désignables**

Expected: si la carte active est un héros, les cartes désignables sont exactement celles du rang du haut ; les héros et l'allié ne le sont pas. Chaque face porte un bouton « déplier ».

- [ ] **Step 4: Une attaque sur un lot**

Faire en sorte qu'un héros soit actif (réordonner la bande par l'API `PATCH …/ordre` si besoin). Cliquer la carte du lot.
Expected: le dialogue d'attaque s'ouvre, la cible s'appelle « … #1 ». Mener l'attaque à une réussite avec des dégâts et valider : en base, `vitalite_instances[0]` du lot a baissé, les deux autres exemplaires n'ont pas bougé ; la carte du héros est toujours active.

- [ ] **Step 5: Fin du tour et round**

« Fin du tour » autant de fois qu'il y a de cartes jouables.
Expected: à chaque fois la carte active change, la précédente s'estompe et sa puce aussi ; après la dernière, la bande affiche « Round 2 » et plus rien n'est estompé. En base, `etat_combat.round` vaut 2 et `joues` est vide. La touche `F` termine aussi le tour.

- [ ] **Step 6: Rechargement en plein round**

Terminer un tour, recharger la page.
Expected: même round, même carte active, même carte estompée.

- [ ] **Step 7: Défense totale**

Sur une carte du rang du haut active : « Défense totale ».
Expected: son tour se termine, un marqueur bouclier apparaît sur sa face. Quand un héros l'attaque ensuite, le dialogue affiche sa défense augmentée de 2. Le marqueur disparaît quand cette carte redevient active.

- [ ] **Step 8: Hors combat**

Mettre la créature simple à 0 de vitalité (carte dépliée par le bouton « déplier », stepper).
Expected: sa face est grisée, elle n'est plus désignable, sa puce est barrée, et « Fin du tour » ne lui donne jamais la main.

- [ ] **Step 9: Rendre la main, réordonner**

Cliquer « Rendre la main » sur une puce estompée.
Expected: la carte n'est plus estompée et rejouera ce round. Réordonner par l'API (`PATCH …/ordre` avec des clés de carte) et recharger : la bande suit le nouvel ordre.

- [ ] **Step 10: Attaquer son propre camp**

Déplier la carte d'un allié (bouton « déplier ») pendant le tour d'un héros.
Expected: la carte dépliée propose « Attaquer cette carte », pas de jet d'action ni de changement de camp ; le bouton ouvre le dialogue d'attaque.

- [ ] **Step 11: Fin du combat**

« Terminer le combat » dans la barre du haut → confirmer.
Expected: retour au mode libre, tapis avec « Présents dans la scène », réserve revenue, l'allié toujours en bas. En base, `etat_combat` est `null`.

- [ ] **Step 12: Suites complètes et nettoyage**

Run: `cd front && npm run build && npx ng test --watch=false`
Run: `cd backend && php artisan test`
Expected: front tout vert ; backend tout vert sauf l'échec préexistant `ExampleTest`. Aucune erreur dans la console du navigateur pendant le parcours.

Supprimer le script jetable et la session de test. Vérifier qu'il ne reste que `screenshot.mjs` dans `front/scripts/`.

- [ ] **Step 13: Commit des corrections éventuelles** (ignoré sans autorisation)

```bash
git add -A
git commit -m "fix(combat): corrections issues de la vérification de bout en bout"
```
