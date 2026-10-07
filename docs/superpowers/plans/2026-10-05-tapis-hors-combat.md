# Le Tapis hors combat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En mode libre, remplacer le battlefield à jetons par un tapis de cartes de personnage rangées automatiquement sur deux rangs, dont la face montre dégâts, défense et vitalité, et qui se déplient sur place pour agir.

**Architecture:** Une fonction pure transforme la session en cartes (`buildTapisCards`) ; trois composants de présentation (`bol-character-card`, `bol-expanded-card`, `bol-tapis`) les affichent et remontent leurs événements à `session-play-page`, qui reste seule à parler à la session. La réserve garde sa logique et passe en bandeau horizontal ; l'onglet Scènes y devient une rangée de puces (`bol-scene-strip`), la gestion fine restant dans `bol-scene-list`, ouvert en dialogue. Le mode combat garde le battlefield actuel.

**Tech Stack:** Angular 22 (standalone, signals, OnPush), Angular Material, Vitest ; Laravel 12, PHPUnit sans base.

**Spec:** `docs/superpowers/specs/2026-10-05-tapis-hors-combat-design.md`

## Global Constraints

- **Le mode combat ne change pas.** `bol-battlemap`, `bol-initiative-rail`, `attack-menu`, `attack-roll-dialog`, `start-combat-dialog` restent en place et servent en mode `combat`. Seules l'entrée `selectedKey`, la sortie `tokenSelected` et le style du jeton sélectionné sont retirés de `bol-battlemap`.
- Les positions de jetons continuent d'être enregistrées et restituées par les scènes (le combat s'en sert encore).
- Une carte par ligne de session. Clé d'une carte : `{kind}-{pivotId}` (ex. `creature-12`), sans index d'exemplaire.
- Rangs : en haut « Présents dans la scène » (camp `adversaires`), en bas « Héros et alliés » (camp `heros`).
- Étiquette d'une carte : « ×N » pour un lot ; sinon « Allié » pour un non-héros de camp `heros` ; sinon le rang (« Rival », « Coriace », « Piétaille ») ; rien pour un héros.
- Les trois chiffres de la face sont libellés « Dég. », « Déf. », « Vit. », dans cet ordre.
- Une entrée de distribution de scène sans champ `camp` vaut `adversaires`.
- Conventions Angular du `CLAUDE.md` : pas de `standalone: true`, `OnPush`, `input()`/`output()`/`model()`, `inject()`, `@if`/`@for`, pas de `ngClass`/`ngStyle`, pas de `@HostListener`, pas de fonction fléchée dans les templates, Angular Material uniquement, boutons `size="small"`, couleurs par tokens `--dw-*`. Un élément qui porte une classe maison ne porte pas d'utilitaire Tailwind.
- Tests : fonctions pures uniquement, des deux côtés. Le comportement des composants et les écritures en base sont vérifiés dans le navigateur (tâche 8).
- Lancer un test front : `cd front && npx ng test --watch=false --include "**/<fichier>.spec.ts"`. Valider le front : `cd front && npm run build`. Tests backend : `cd backend && php artisan test` — **échec préexistant connu et sans rapport** : `Tests\Feature\ExampleTest` (`GET /` → 404).
- **Backend en Docker** : le conteneur `diceway` ne monte que `backend/app`. Une route nouvelle demande de reconstruire l'image : `cd backend && docker compose up -d --build diceway`. Aucune migration dans ce plan.
- **Git** : pas de commit, pas de branche, pas de worktree, sauf autorisation explicite donnée pour l'exécution. Lionel gère git lui-même.
- Textes d'interface en français.

## Review Focus

Cas que la spec implique sans les nommer, les plus probables d'abord. Chacun a son test dans la tâche indiquée.

1. **Lot dont les vitalités par exemplaire sont absentes ou incomplètes** (anciennes sessions : `vitalite_instances` nul ou plus court que `qty`) : la carte montre quand même une jauge par exemplaire, remplie depuis `vitalite_courante`. → `buildTapisCards`, tâche 2.
2. **Héros sans arme, ou dont les armes ne sont pas chargées** : « Dég. » affiche « — », la carte ne plante pas. → `buildTapisCards`, tâche 2.
3. **Scène enregistrée avant ce chantier** (entrées sans `camp`) : elle se charge dans le rang du haut, comme avant. → `BolSceneDistribution::entryCamp`, tâche 1.
4. **Carte dépliée qui disparaît** (retirée, scène chargée en remplacement) : plus aucune carte n'est dépliée, pas de carte fantôme. → `findCard`, tâche 2.
5. **Héros en vitalité négative** (mourant) : la face affiche la valeur négative, la barre est vide et rouge. → `buildTapisCards` et `vitalitePercent`, tâche 2.

---

### Task 1: Backend — camp modifiable, camp dans les scènes, armes des héros

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolSceneDistribution.php`
- Modify: `backend/tests/Unit/BolSceneDistributionTest.php`
- Modify: `backend/app/Http/Services/Bol/BolSceneService.php` (`loadIntoSession`, `distributionOf`)
- Modify: `backend/app/Http/Services/Bol/BolFightSessionService.php` (`setCamp`, `relations`)
- Modify: `backend/app/Http/Controllers/Bol/BolFightSessionController.php` (`setCamp`)
- Modify: `backend/routes/api.php`

**Interfaces:**
- Produces:
  - `BolSceneDistribution::fromSession` : chaque entrée porte `camp` (`'heros'` ou `'adversaires'`), lu sur la ligne de session.
  - `BolSceneDistribution::entryCamp(array $entry): string` — `'heros'` si l'entrée le dit, `'adversaires'` sinon (champ absent compris).
  - `PATCH /api/bol/fight-session/{id}/combatant/{kind}/{pivotId}/camp`, corps `{camp}` → la session ; 422 `{"error": "Un héros reste dans le camp des héros."}` pour `kind = hero` ; 404 si session ou ligne introuvable.
  - La session sérialisée contient `heros[].heros.armes[].arme` (avec `degats`).

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `backend/tests/Unit/BolSceneDistributionTest.php`, ajouter ces méthodes à la fin de la classe (avant l'accolade fermante) :

```php
    public function test_records_the_camp_of_each_row(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => 'p', 'camp' => 'heros']],
            [['id' => 3, 'creature_id' => 'c', 'qty' => 1, 'camp' => 'adversaires']],
            [['id' => 9, 'demon_id' => 'd', 'qty' => 1]],
            [],
        );

        $this->assertSame(['heros', 'adversaires', 'adversaires'], array_column($entries, 'camp'));
    }

    public function test_entry_camp_defaults_to_adversaires_for_scenes_saved_before_camps_existed(): void
    {
        $this->assertSame('adversaires', BolSceneDistribution::entryCamp(['kind' => 'pnj', 'source_id' => 'p', 'qty' => 1]));
        $this->assertSame('adversaires', BolSceneDistribution::entryCamp(['camp' => 'n-importe-quoi']));
        $this->assertSame('adversaires', BolSceneDistribution::entryCamp(['camp' => null]));
    }

    public function test_entry_camp_keeps_an_ally_with_the_heroes(): void
    {
        $this->assertSame('heros', BolSceneDistribution::entryCamp(['camp' => 'heros']));
    }
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `cd backend && php artisan test --filter=BolSceneDistributionTest`
Expected: FAIL — `Call to undefined method …::entryCamp()` et, pour le premier test, un tableau `camp` vide.

- [ ] **Step 3: Porter le camp dans la distribution**

Dans `backend/app/Http/Services/Bol/BolSceneDistribution.php` :

Dans `fromSession`, entrée PNJ — remplacer :

```php
            $entries[] = [
                'kind'      => 'pnj',
                'source_id' => $sourceId,
                'qty'       => 1,
                'positions' => [self::position($positions['pnj-' . $row['id']] ?? null)],
            ];
```

par :

```php
            $entries[] = [
                'kind'      => 'pnj',
                'source_id' => $sourceId,
                'qty'       => 1,
                'camp'      => self::entryCamp($row),
                'positions' => [self::position($positions['pnj-' . $row['id']] ?? null)],
            ];
```

Entrée créature / démon — remplacer :

```php
                $entries[] = [
                    'kind'      => $kind,
                    'source_id' => $sourceId,
                    'qty'       => $qty,
                    'positions' => $instancePositions,
                ];
```

par :

```php
                $entries[] = [
                    'kind'      => $kind,
                    'source_id' => $sourceId,
                    'qty'       => $qty,
                    'camp'      => self::entryCamp($row),
                    'positions' => $instancePositions,
                ];
```

Ajouter, juste avant `private static function sourceId` :

```php
    /**
     * Camp d'une entrée de distribution (ou d'une ligne de session) : `heros` pour un allié,
     * `adversaires` dans tous les autres cas — y compris les scènes enregistrées avant que le camp
     * n'existe, dont les entrées n'ont pas ce champ.
     *
     * @param array<string, mixed> $entry
     */
    public static function entryCamp(array $entry): string
    {
        return ($entry['camp'] ?? null) === 'heros' ? 'heros' : 'adversaires';
    }
```

Mettre à jour le type de retour documenté de `fromSession` : `@return array<int, array{kind: string, source_id: string, qty: int, camp: string, positions: array<int, array{x: float, y: float}|null>}>`.

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `cd backend && php artisan test --filter=BolSceneDistributionTest`
Expected: PASS, 14 tests.

- [ ] **Step 5: Lire et restituer le camp dans le service des scènes**

Dans `backend/app/Http/Services/Bol/BolSceneService.php` :

`distributionOf` — ajouter `'camp'` aux colonnes lues sur les trois modèles :

```php
        return BolSceneDistribution::fromSession(
            BolFightSessionPnj::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'pnj_id', 'camp'])->toArray(),
            BolFightSessionCreature::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'creature_id', 'qty', 'camp'])->toArray(),
            BolFightSessionDemon::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'demon_id', 'qty', 'camp'])->toArray(),
            $session->positions_jetons,
        );
```

`loadIntoSession` — dans la boucle `foreach ($scene->distribution ?? [] as $entry)`, après la ligne `$qty = max(1, (int) ($entry['qty'] ?? 1));`, ajouter :

```php
                $camp = BolSceneDistribution::entryCamp($entry);
```

et remplacer le `match` de création par :

```php
                $row = $alreadyThere ? null : match ($kind) {
                    'pnj'      => $this->fightSessionService->createPnjRow($sessionId, $sourceId, $camp),
                    'creature' => $this->fightSessionService->createCreatureRow($sessionId, $sourceId, $camp, $qty),
                    'demon'    => $this->fightSessionService->createDemonRow($sessionId, $sourceId, $camp, $qty),
                    default    => null,
                };
```

- [ ] **Step 6: Changer de camp et charger les armes des héros**

Dans `backend/app/Http/Services/Bol/BolFightSessionService.php`, ajouter après la méthode `removeCombatant` :

```php
    /**
     * Change le camp d'un PNJ, d'une créature ou d'un démon : `heros` pour un allié qui accompagne
     * les héros, `adversaires` sinon. Renvoie null si la session ou la ligne est introuvable, ou si
     * `$kind` n'est pas l'un des trois types (un héros ne change pas de camp).
     */
    public function setCamp(string $sessionId, string $userId, string $kind, int $pivotId, string $camp): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        $model = match ($kind) {
            'pnj'      => BolFightSessionPnj::class,
            'creature' => BolFightSessionCreature::class,
            'demon'    => BolFightSessionDemon::class,
            default    => null,
        };
        $row = $model ? $model::where('id', $pivotId)->where('fight_session_id', $sessionId)->first() : null;
        if (!$row) {
            return null;
        }

        $row->update(['camp' => $this->normalizeCamp($camp)]);

        return $this->getSessionWithRelations($sessionId);
    }
```

Dans `relations()` du même fichier, ajouter `'heros.heros.armes.arme',` juste après `'heros.heros.armures.armure',`.

Dans `backend/app/Http/Controllers/Bol/BolFightSessionController.php`, ajouter après la méthode `removeCombatant` :

```php
    public function setCamp(Request $request, string $id, string $kind, int $pivotId)
    {
        $data = $request->validate(['camp' => 'required|in:heros,adversaires']);

        if ($kind === 'hero') {
            return response()->json(['error' => 'Un héros reste dans le camp des héros.'], 422);
        }

        $session = $this->fightSessionService->setCamp($id, Auth::id(), $kind, $pivotId, $data['camp']);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }
```

Dans `backend/routes/api.php`, juste après la ligne `Route::patch('/bol/fight-session/{id}/combatant/{kind}/{pivotId}/damage', …);`, ajouter :

```php
    Route::patch('/bol/fight-session/{id}/combatant/{kind}/{pivotId}/camp', [BolFightSessionController::class, 'setCamp']);
```

- [ ] **Step 7: Vérifier, reconstruire, sonder l'API**

Run: `cd backend && for f in app/Http/Services/Bol/BolSceneDistribution.php app/Http/Services/Bol/BolSceneService.php app/Http/Services/Bol/BolFightSessionService.php app/Http/Controllers/Bol/BolFightSessionController.php routes/api.php; do php -l $f; done && php artisan test`
Expected: `No syntax errors detected` cinq fois ; tous les tests passent sauf l'échec préexistant `ExampleTest`.

Run: `cd backend && docker compose up -d --build diceway && sleep 5`

Puis, avec le compte de test :

```bash
T=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"claude-test@example.com","password":"ClaudeTest123!"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s http://localhost:8080/api/bol/fight-session -H "Authorization: Bearer $T" -H 'Accept: application/json' \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);s=next(x for x in d if x.get("heros"));print("armes" in s["heros"][0]["heros"], s["id"])'
```

Expected: `True <id de session>`. Si `False` : le modèle `BolHeros` filtre sa sérialisation ; ouvrir `backend/app/Models/Bol/BolHeros.php`, repérer la méthode qui construit le tableau (`toArray` ou `$appends`/`$visible`) et y exposer la relation `armes` de la même façon que `armures`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH "http://localhost:8080/api/bol/fight-session/<id de session>/combatant/hero/1/camp" \
  -H "Authorization: Bearer $T" -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"camp":"adversaires"}'
```

Expected: `422`.

- [ ] **Step 8: Commit** (ignoré sans autorisation, cf. Global Constraints)

```bash
git add backend
git commit -m "feat(tapis): camp modifiable, camp dans les scènes, armes des héros dans la session"
```

---

### Task 2: Modèles front et fonctions pures du tapis

**Files:**
- Create: `front/src/app/bol/session/play/tapis/tapis.util.ts`
- Test: `front/src/app/bol/session/play/tapis/tapis.util.spec.ts`
- Modify: `front/src/app/bol/models/bol-fight-session.model.ts`
- Modify: `front/src/app/bol/models/bol-scene.model.ts`
- Modify: `front/src/app/bol/services/bol-fight-session.service.ts`

**Interfaces:**
- Consumes: l'API de la tâche 1 ; `EMPTY_AVATAR` (`session/combat-play.util.ts`) ; `BolFightSessionModel`, `CombatCamp`.
- Produces (`tapis.util.ts`) :
  - `type TapisKind = 'hero' | 'pnj' | 'creature' | 'demon'`
  - `interface TapisCard { key: string; kind: TapisKind; camp: CombatCamp; pivotId: number; sourceId: string | null; nom: string; avatar: string; badge: string | null; rang: string | null; degats: string; defense: string; vitaliteCourante: number | null; vitaliteMax: number | null; instances: readonly number[] | null; qty: number }`
  - `interface TapisRows { presents: TapisCard[]; heros: TapisCard[] }`
  - `interface VitaliteStepper { index: number | null; label: string; value: number }`
  - `buildTapisCards(session: BolFightSessionModel): TapisCard[]`
  - `splitRows(cards: readonly TapisCard[]): TapisRows`
  - `findCard(cards: readonly TapisCard[], key: string | null): TapisCard | null`
  - `cardLabel(card): string` — « Hippocampe ×3 » pour un lot, le nom sinon
  - `vitaliteText(card): string`, `vitalitePercent(courante: number | null, max: number | null): number`, `isLowVitalite(courante, max): boolean`
  - `cardAriaLabel(card): string`
  - `campActionLabel(card): string | null`, `removeActionLabel(card): string`
  - `vitaliteSteppers(card): VitaliteStepper[]`
- Produces (ailleurs) : `BolFightSessionService.setCamp(sessionId, kind, pivotId, camp): Observable<BolFightSessionModel>` ; `BolSceneEntry.camp?: CombatCamp` ; `BolFightSessionHerosModel.heros` typé avec `combat` et `armes`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `front/src/app/bol/session/play/tapis/tapis.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {
  buildTapisCards,
  campActionLabel,
  cardAriaLabel,
  cardLabel,
  findCard,
  isLowVitalite,
  removeActionLabel,
  splitRows,
  TapisCard,
  vitalitePercent,
  vitaliteSteppers,
  vitaliteText,
} from './tapis.util';

function hero(id: number, nom: string, extra: Record<string, unknown> = {}): NonNullable<BolFightSessionModel['heros']>[number] {
  return {
    id,
    fight_session_id: 's',
    heros_id: `h${id}`,
    camp: 'heros',
    initiative_resultat: null,
    vitalite_courante: 9,
    heros: {
      id: `h${id}`,
      origines: {nom, avatar: null, joueur: null},
      ressources: {vitalite: 11, heroisme: 4},
      combat: {defense: 1, defense_effective: 0},
      armes: [{arme: {arme: 'Dague', degats: 'd6B'}}],
    },
    ...extra,
  } as NonNullable<BolFightSessionModel['heros']>[number];
}

const PNJ = {
  id: 7, fight_session_id: 's', pnj_id: 'p1', camp: 'adversaires', surnom: null, rang: 'coriace', nom: 'Prêtre de Shazzadion',
  vigueur: 0, agilite: 0, esprit: 1, aura: 0, melee: 1, tir: 0, defense: 0, vitalite_max: 6, vitalite_courante: 2,
  armes: [{nom: 'Dague', degats: 'd6B', type: 'M'}],
};

const CREATURE = {
  id: 3, fight_session_id: 's', creature_id: '48', camp: 'adversaires', qty: 3, surnom: null, rang: 'pietaille', nom: 'Hippocampe',
  vigueur: 1, agilite: 1, esprit: 0, vitalite_max: 5, vitalite_courante: 5, vitalite_instances: [5, 1, 0],
  attaque: 1, defense: 1, degats: 'd6', protection: null, id_taille: 1, capacites: null,
};

const DEMON = {
  id: 9, fight_session_id: 's', demon_id: 'd1', camp: 'adversaires', qty: 1, surnom: 'Le Voilé', rang: 'rival', nom: 'Mazallakos',
  vigueur: 3, agilite: 2, esprit: 2, aura: 3, melee: 2, tir: 0, defense: 2, vitalite_max: 20, vitalite_courante: 20,
  vitalite_instances: [20], degats: 'd6+3', pouvoirs: null,
};

function session(overrides: Partial<BolFightSessionModel> = {}): BolFightSessionModel {
  return {
    id: 's',
    titre: null,
    statut: 'libre',
    heros: [hero(1, 'Kalena')],
    pnjs: [PNJ],
    creatures: [CREATURE],
    demons: [DEMON],
    ...overrides,
  } as BolFightSessionModel;
}

function card(key: string, s = session()): TapisCard {
  return buildTapisCards(s).find((c) => c.key === key)!;
}

describe('buildTapisCards', () => {
  it('builds one card per session row, keyed by kind and row id', () => {
    expect(buildTapisCards(session()).map((c) => c.key)).toEqual(['hero-1', 'pnj-7', 'creature-3', 'demon-9']);
  });

  it('puts damage, effective defense and session vitality on a hero face', () => {
    expect(card('hero-1')).toMatchObject({
      nom: 'Kalena', degats: 'd6B', defense: '0', vitaliteCourante: 9, vitaliteMax: 11, badge: null, rang: null, qty: 1,
    });
  });

  it('shows a dash for the damage of a hero without a weapon, or whose weapons are not loaded', () => {
    const none = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: []}})]});
    const missing = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: undefined}})]});
    const noDamage = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: [{arme: {arme: 'Filet', degats: null}}]}})]});
    expect(card('hero-1', none).degats).toBe('—');
    expect(card('hero-1', missing).degats).toBe('—');
    expect(card('hero-1', noDamage).degats).toBe('—');
  });

  it('keeps a negative vitality for a dying hero', () => {
    const dying = session({heros: [hero(1, 'Kalena', {vitalite_courante: -3})]});
    expect(card('hero-1', dying).vitaliteCourante).toBe(-3);
  });

  it('labels a PNJ with its rank and reads its first weapon', () => {
    expect(card('pnj-7')).toMatchObject({badge: 'Coriace', rang: 'Coriace', degats: 'd6B', defense: '0', vitaliteCourante: 2, vitaliteMax: 6});
  });

  it('labels a non-hero in the heroes camp as an ally', () => {
    const s = session({pnjs: [{...PNJ, camp: 'heros'}] as BolFightSessionModel['pnjs']});
    expect(card('pnj-7', s).badge).toBe('Allié');
    expect(card('pnj-7', s).rang).toBe('Coriace');
  });

  it('builds a single card for a batch, with one gauge per instance and a ×N badge', () => {
    expect(card('creature-3')).toMatchObject({qty: 3, badge: '×3', rang: 'Piétaille', instances: [5, 1, 0], degats: 'd6', defense: '1', vitaliteMax: 5});
  });

  it('fills the missing gauges of a batch from its current vitality', () => {
    const nullInstances = session({creatures: [{...CREATURE, vitalite_instances: null}] as BolFightSessionModel['creatures']});
    const shortInstances = session({creatures: [{...CREATURE, vitalite_instances: [2]}] as BolFightSessionModel['creatures']});
    expect(card('creature-3', nullInstances).instances).toEqual([5, 5, 5]);
    expect(card('creature-3', shortInstances).instances).toEqual([2, 5, 5]);
  });

  it('has no gauges for a single creature or demon, and uses its nickname', () => {
    expect(card('demon-9')).toMatchObject({nom: 'Le Voilé', instances: null, badge: 'Rival', vitaliteCourante: 20, qty: 1});
  });

  it('still builds the card when the library source was deleted', () => {
    const s = session({pnjs: [{...PNJ, pnj_id: null}] as BolFightSessionModel['pnjs']});
    expect(card('pnj-7', s)).toMatchObject({sourceId: null, nom: 'Prêtre de Shazzadion'});
  });

  it('returns no card for an empty session', () => {
    expect(buildTapisCards({id: 's', titre: null, statut: 'libre'})).toEqual([]);
  });
});

describe('splitRows', () => {
  it('puts adversaries on top (PNJ, creatures, demons) and heroes below', () => {
    const rows = splitRows(buildTapisCards(session()));
    expect(rows.presents.map((c) => c.key)).toEqual(['pnj-7', 'creature-3', 'demon-9']);
    expect(rows.heros.map((c) => c.key)).toEqual(['hero-1']);
  });

  it('puts allies after the heroes in the bottom row', () => {
    const s = session({
      heros: [hero(2, 'Rork'), hero(1, 'Kalena')],
      pnjs: [{...PNJ, camp: 'heros'}] as BolFightSessionModel['pnjs'],
    });
    const rows = splitRows(buildTapisCards(s));
    expect(rows.heros.map((c) => c.key)).toEqual(['hero-1', 'hero-2', 'pnj-7']);
    expect(rows.presents.map((c) => c.key)).toEqual(['creature-3', 'demon-9']);
  });

  it('orders cards of the same kind by arrival', () => {
    const s = session({pnjs: [{...PNJ, id: 12}, {...PNJ, id: 4}] as BolFightSessionModel['pnjs'], creatures: [], demons: []});
    expect(splitRows(buildTapisCards(s)).presents.map((c) => c.key)).toEqual(['pnj-4', 'pnj-12']);
  });
});

describe('findCard', () => {
  const cards = buildTapisCards(session());

  it('finds a card by key', () => {
    expect(findCard(cards, 'creature-3')?.nom).toBe('Hippocampe');
  });

  it('returns null for a card that is no longer on the table, or when nothing is expanded', () => {
    expect(findCard(cards, 'pnj-99')).toBeNull();
    expect(findCard(cards, null)).toBeNull();
  });
});

describe('labels', () => {
  it('names a batch with its count', () => {
    expect(cardLabel(card('creature-3'))).toBe('Hippocampe ×3');
    expect(cardLabel(card('pnj-7'))).toBe('Prêtre de Shazzadion');
  });

  it('writes the vitality of a face', () => {
    expect(vitaliteText(card('pnj-7'))).toBe('2/6');
    expect(vitaliteText(card('creature-3'))).toBe('5');
  });

  it('describes a card for screen readers', () => {
    expect(cardAriaLabel(card('pnj-7'))).toBe('Prêtre de Shazzadion, PNJ, Coriace, dégâts d6B, défense 0, vitalité 2 sur 6');
    expect(cardAriaLabel(card('hero-1'))).toBe('Kalena, Héros, dégâts d6B, défense 0, vitalité 9 sur 11');
    expect(cardAriaLabel(card('creature-3'))).toBe('Hippocampe, Créature, lot de 3, dégâts d6, défense 1, vitalité 5 par exemplaire');
  });

  it('offers to change camp, except for a hero', () => {
    expect(campActionLabel(card('hero-1'))).toBeNull();
    expect(campActionLabel(card('pnj-7'))).toBe('Passer du côté des héros');
    const ally = session({pnjs: [{...PNJ, camp: 'heros'}] as BolFightSessionModel['pnjs']});
    expect(campActionLabel(card('pnj-7', ally))).toBe('Remettre avec les présents');
  });

  it('names the removal after what it removes', () => {
    expect(removeActionLabel(card('pnj-7'))).toBe('Retirer de la table');
    expect(removeActionLabel(card('creature-3'))).toBe('Retirer un exemplaire');
  });
});

describe('vitalite helpers', () => {
  it('computes the fill of a vitality bar, clamped between 0 and 100', () => {
    expect(vitalitePercent(3, 6)).toBe(50);
    expect(vitalitePercent(-3, 11)).toBe(0);
    expect(vitalitePercent(20, 10)).toBe(100);
    expect(vitalitePercent(null, 10)).toBe(100);
    expect(vitalitePercent(5, 0)).toBe(100);
  });

  it('flags half vitality or less as low', () => {
    expect(isLowVitalite(3, 6)).toBe(true);
    expect(isLowVitalite(4, 6)).toBe(false);
    expect(isLowVitalite(-3, 11)).toBe(true);
    expect(isLowVitalite(null, 6)).toBe(false);
  });

  it('gives one stepper per instance of a batch, numbered from 1', () => {
    expect(vitaliteSteppers(card('creature-3'))).toEqual([
      {index: 0, label: '#1', value: 5},
      {index: 1, label: '#2', value: 1},
      {index: 2, label: '#3', value: 0},
    ]);
  });

  it('gives a single stepper otherwise, with instance 0 for a creature or demon and none for a PNJ', () => {
    expect(vitaliteSteppers(card('demon-9'))).toEqual([{index: 0, label: 'Vitalité', value: 20}]);
    expect(vitaliteSteppers(card('pnj-7'))).toEqual([{index: null, label: 'Vitalité', value: 2}]);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd front && npx ng test --watch=false --include "**/tapis.util.spec.ts"`
Expected: FAIL, module `./tapis.util` introuvable.

- [ ] **Step 3: Compléter les modèles et le service**

Dans `front/src/app/bol/models/bol-fight-session.model.ts`, remplacer dans `BolFightSessionHerosModel` :

```ts
  heros?: {
    id: string | null;
    origines: {nom: string | null; avatar: string | null; joueur: string | null};
    ressources?: {vitalite: number; heroisme: number};
  };
```

par :

```ts
  heros?: {
    id: string | null;
    origines: {nom: string | null; avatar: string | null; joueur: string | null};
    ressources?: {vitalite: number; heroisme: number};
    /** Défense du héros ; `defense_effective` tient compte de l'équipement porté. */
    combat?: {defense: number; defense_effective: number};
    /** Armes du héros (chargées avec la session pour afficher ses dégâts sur sa carte). */
    armes?: {arme?: {arme: string; degats: string | null} | null}[];
  };
```

Dans `front/src/app/bol/models/bol-scene.model.ts`, remplacer la ligne d'import par :

```ts
import {BolFightSessionModel, CombatCamp} from './bol-fight-session.model';
```

et, dans `BolSceneEntry`, ajouter après `qty: number;` :

```ts
  /** Camp au chargement : `heros` pour un allié. Absent sur les scènes anciennes (= `adversaires`). */
  camp?: CombatCamp;
```

Dans `front/src/app/bol/services/bol-fight-session.service.ts`, ajouter `CombatCamp` à l'import de `'../models/bol-fight-session.model'`, et, après la méthode `removeCombatant` :

```ts
  /** Passe un PNJ, une créature ou un démon du côté des héros (allié) ou le remet avec les présents. */
  setCamp(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
    camp: CombatCamp,
  ): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/camp`, {camp});
  }
```

- [ ] **Step 4: Écrire `tapis.util.ts`**

Créer `front/src/app/bol/session/play/tapis/tapis.util.ts` :

```ts
import {BolFightSessionModel, CombatCamp} from '../../../models/bol-fight-session.model';
import {EMPTY_AVATAR} from '../../combat-play.util';

export type TapisKind = 'hero' | 'pnj' | 'creature' | 'demon';

/** Une carte du tapis : une ligne de session (héros, PNJ, créature ou démon), avec sa face déjà
 * calculée. Un lot (`qty > 1`) est une seule carte, avec la vitalité de chaque exemplaire. */
export interface TapisCard {
  /** `{kind}-{pivotId}`, sans index d'exemplaire. */
  readonly key: string;
  readonly kind: TapisKind;
  readonly camp: CombatCamp;
  readonly pivotId: number;
  /** Id de la fiche en bibliothèque — null si elle a été supprimée depuis. */
  readonly sourceId: string | null;
  readonly nom: string;
  readonly avatar: string;
  /** Étiquette de la face : « ×N », « Allié », le rang, ou rien pour un héros. */
  readonly badge: string | null;
  /** Rang en clair (« Coriace »…) — null pour un héros. */
  readonly rang: string | null;
  readonly degats: string;
  readonly defense: string;
  readonly vitaliteCourante: number | null;
  readonly vitaliteMax: number | null;
  /** Vitalité de chaque exemplaire d'un lot — null hors lot. */
  readonly instances: readonly number[] | null;
  readonly qty: number;
}

export interface TapisRows {
  /** Rang du haut, « Présents dans la scène ». */
  readonly presents: TapisCard[];
  /** Rang du bas, « Héros et alliés ». */
  readonly heros: TapisCard[];
}

export interface VitaliteStepper {
  /** Index d'exemplaire à passer à l'API — null pour un PNJ. */
  readonly index: number | null;
  readonly label: string;
  readonly value: number;
}

const NO_VALUE = '—';

const KIND_LABELS: Record<TapisKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

const RANK_LABELS: Record<string, string> = {
  rival: 'Rival',
  coriace: 'Coriace',
  pietaille: 'Piétaille',
};

const KIND_ORDER: Record<TapisKind, number> = {hero: 0, pnj: 1, creature: 2, demon: 3};

function rankLabel(rang: string | null | undefined): string {
  return RANK_LABELS[rang ?? ''] ?? 'Coriace';
}

function badgeFor(camp: CombatCamp, rang: string, qty: number): string {
  if (qty > 1) {
    return `×${qty}`;
  }
  return camp === 'heros' ? 'Allié' : rang;
}

/** Vitalité de chaque exemplaire d'un lot ; un exemplaire sans valeur enregistrée (anciennes
 * sessions) reprend la vitalité courante de la ligne. */
function batchInstances(qty: number, stored: readonly number[] | null | undefined, fallback: number): number[] {
  return Array.from({length: qty}, (_, index) => stored?.[index] ?? fallback);
}

/** Les cartes du tapis, une par ligne de session : héros, puis PNJ, créatures et démons. */
export function buildTapisCards(session: BolFightSessionModel): TapisCard[] {
  const cards: TapisCard[] = [];

  for (const h of session.heros ?? []) {
    const defense = h.heros?.combat?.defense_effective ?? h.heros?.combat?.defense;
    cards.push({
      key: `hero-${h.id}`,
      kind: 'hero',
      camp: 'heros',
      pivotId: h.id,
      sourceId: h.heros_id,
      nom: h.heros?.origines.nom ?? 'Héros',
      avatar: h.heros?.origines.avatar || EMPTY_AVATAR,
      badge: null,
      rang: null,
      degats: h.heros?.armes?.find((a) => a.arme?.degats)?.arme?.degats ?? NO_VALUE,
      defense: defense === undefined ? NO_VALUE : String(defense),
      vitaliteCourante: h.vitalite_courante ?? h.heros?.ressources?.vitalite ?? null,
      vitaliteMax: h.heros?.ressources?.vitalite ?? null,
      instances: null,
      qty: 1,
    });
  }

  for (const p of session.pnjs ?? []) {
    const rang = rankLabel(p.rang);
    cards.push({
      key: `pnj-${p.id}`,
      kind: 'pnj',
      camp: p.camp,
      pivotId: p.id,
      sourceId: p.pnj_id,
      nom: p.surnom ?? p.nom,
      avatar: p.pnj?.origines.avatar || (p.pnj_id ? `/assets/bol/pnj/${p.pnj_id}.jpg` : null) || EMPTY_AVATAR,
      badge: badgeFor(p.camp, rang, 1),
      rang,
      degats: p.armes?.find((a) => a.degats)?.degats ?? NO_VALUE,
      defense: String(p.defense),
      vitaliteCourante: p.vitalite_courante,
      vitaliteMax: p.vitalite_max,
      instances: null,
      qty: 1,
    });
  }

  for (const c of session.creatures ?? []) {
    const qty = Math.max(1, c.qty);
    const rang = rankLabel(c.rang);
    cards.push({
      key: `creature-${c.id}`,
      kind: 'creature',
      camp: c.camp,
      pivotId: c.id,
      sourceId: c.creature_id,
      nom: c.surnom ?? c.nom,
      avatar: c.creature?.avatar || (c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : null) || EMPTY_AVATAR,
      badge: badgeFor(c.camp, rang, qty),
      rang,
      degats: c.degats ?? NO_VALUE,
      defense: String(c.defense),
      vitaliteCourante: c.vitalite_instances?.[0] ?? c.vitalite_courante,
      vitaliteMax: c.vitalite_max,
      instances: qty > 1 ? batchInstances(qty, c.vitalite_instances, c.vitalite_courante) : null,
      qty,
    });
  }

  for (const d of session.demons ?? []) {
    const qty = Math.max(1, d.qty);
    const rang = rankLabel(d.rang);
    cards.push({
      key: `demon-${d.id}`,
      kind: 'demon',
      camp: d.camp,
      pivotId: d.id,
      sourceId: d.demon_id,
      nom: d.surnom ?? d.nom,
      avatar: d.demon?.avatar || (d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : null) || EMPTY_AVATAR,
      badge: badgeFor(d.camp, rang, qty),
      rang,
      degats: d.degats ?? NO_VALUE,
      defense: String(d.defense),
      vitaliteCourante: d.vitalite_instances?.[0] ?? d.vitalite_courante,
      vitaliteMax: d.vitalite_max,
      instances: qty > 1 ? batchInstances(qty, d.vitalite_instances, d.vitalite_courante) : null,
      qty,
    });
  }

  return cards;
}

function byKindThenArrival(left: TapisCard, right: TapisCard): number {
  return KIND_ORDER[left.kind] - KIND_ORDER[right.kind] || left.pivotId - right.pivotId;
}

/** Répartit les cartes sur les deux rangs, dans l'ordre d'affichage : par type, puis par ordre
 * d'arrivée. Dans le rang du bas, les héros passent avant les alliés. */
export function splitRows(cards: readonly TapisCard[]): TapisRows {
  return {
    presents: cards.filter((card) => card.camp === 'adversaires').sort(byKindThenArrival),
    heros: cards.filter((card) => card.camp === 'heros').sort(byKindThenArrival),
  };
}

/** Carte dépliée : celle dont la clé est donnée, ou `null` si elle n'est plus sur la table. */
export function findCard(cards: readonly TapisCard[], key: string | null): TapisCard | null {
  return key ? (cards.find((card) => card.key === key) ?? null) : null;
}

/** Nom d'une carte tel qu'on la désigne dans une liste : « Hippocampe ×3 » pour un lot. */
export function cardLabel(card: TapisCard): string {
  return card.qty > 1 ? `${card.nom} ×${card.qty}` : card.nom;
}

/** Chiffre « Vit. » de la face : `courante/max`, ou le maximum seul pour un lot (ses jauges portent
 * le courant de chaque exemplaire). */
export function vitaliteText(card: TapisCard): string {
  if (card.instances) {
    return card.vitaliteMax === null ? NO_VALUE : String(card.vitaliteMax);
  }
  if (card.vitaliteCourante === null || card.vitaliteMax === null) {
    return NO_VALUE;
  }
  return `${card.vitaliteCourante}/${card.vitaliteMax}`;
}

/** Remplissage d'une barre de vitalité, de 0 à 100. Sans valeur exploitable, la barre est pleine. */
export function vitalitePercent(courante: number | null, max: number | null): number {
  if (courante === null || max === null || max <= 0) {
    return 100;
  }
  return Math.max(0, Math.min(100, (courante / max) * 100));
}

/** Vitalité à la moitié du maximum ou en dessous : la barre passe au rouge. */
export function isLowVitalite(courante: number | null, max: number | null): boolean {
  return courante !== null && max !== null && max > 0 && courante <= max / 2;
}

/** Libellé accessible de la face d'une carte : nom, type, étiquette et les trois chiffres. */
export function cardAriaLabel(card: TapisCard): string {
  const parts = [card.nom, KIND_LABELS[card.kind]];
  if (card.qty > 1) {
    parts.push(`lot de ${card.qty}`);
  } else if (card.badge) {
    parts.push(card.badge);
  }
  parts.push(`dégâts ${card.degats}`, `défense ${card.defense}`);
  parts.push(
    card.instances
      ? `vitalité ${card.vitaliteMax ?? NO_VALUE} par exemplaire`
      : `vitalité ${card.vitaliteCourante ?? NO_VALUE} sur ${card.vitaliteMax ?? NO_VALUE}`,
  );
  return parts.join(', ');
}

/** Libellé de l'action de changement de camp — `null` pour un héros, qui ne change pas de camp. */
export function campActionLabel(card: TapisCard): string | null {
  if (card.kind === 'hero') {
    return null;
  }
  return card.camp === 'heros' ? 'Remettre avec les présents' : 'Passer du côté des héros';
}

/** Libellé du retrait : sur un lot, l'API retire un seul exemplaire (le dernier). */
export function removeActionLabel(card: TapisCard): string {
  return card.qty > 1 ? 'Retirer un exemplaire' : 'Retirer de la table';
}

/** Steppers de vitalité d'une carte non-héros dépliée : un par exemplaire pour un lot, un seul
 * sinon. L'index est celui que l'API attend (`null` pour un PNJ, qui n'a pas d'exemplaires). */
export function vitaliteSteppers(card: TapisCard): VitaliteStepper[] {
  if (card.instances) {
    return card.instances.map((value, index) => ({index, label: `#${index + 1}`, value}));
  }
  return [{index: card.kind === 'pnj' ? null : 0, label: 'Vitalité', value: card.vitaliteCourante ?? 0}];
}
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `cd front && npx ng test --watch=false --include "**/tapis.util.spec.ts"`
Expected: PASS.

- [ ] **Step 6: Valider l'ensemble**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent.

- [ ] **Step 7: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol
git commit -m "feat(tapis): modèles et fonctions pures des cartes"
```

---

### Task 3: La face d'une carte (`bol-character-card`)

**Files:**
- Create: `front/src/app/bol/session/play/tapis/character-card.ts`
- Create: `front/src/app/bol/session/play/tapis/character-card.html`
- Create: `front/src/app/bol/session/play/tapis/character-card.scss`

**Interfaces:**
- Consumes: `TapisCard`, `cardAriaLabel`, `vitaliteText`, `vitalitePercent`, `isLowVitalite` (tâche 2) ; `combatantKindIcon`, `combatantKindIconIsSvg` (`session/combat-statblock.util.ts`) ; `EMPTY_AVATAR`.
- Produces: `CharacterCardComponent`, sélecteur `bol-character-card` : `card = input.required<TapisCard>()`, `toggled = output<void>()`. Le bouton de la face porte l'`id` DOM `chc-{key}`.

- [ ] **Step 1: Écrire le composant**

Créer `front/src/app/bol/session/play/tapis/character-card.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {cardAriaLabel, isLowVitalite, TapisCard, vitalitePercent, vitaliteText} from './tapis.util';

/** Face d'une carte du tapis : nom, étiquette, avatar et les trois chiffres du combat (dégâts,
 * défense, vitalité), aux mêmes endroits pour tous les types. Présentation seule : un clic demande
 * de la déplier. */
@Component({
  selector: 'bol-character-card',
  imports: [MatIconModule],
  templateUrl: './character-card.html',
  styleUrl: './character-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterCardComponent {
  readonly card = input.required<TapisCard>();
  readonly toggled = output<void>();

  /** L'avatar a échoué au chargement (chemin conventionnel sans fichier) : repli sur l'icône du type. */
  private readonly avatarFailed = signal(false);
  protected readonly hasAvatar = computed(() => this.card().avatar !== EMPTY_AVATAR && !this.avatarFailed());

  protected readonly ariaLabel = computed(() => cardAriaLabel(this.card()));
  protected readonly vitalite = computed(() => vitaliteText(this.card()));
  protected readonly percent = computed(() => vitalitePercent(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly low = computed(() => isLowVitalite(this.card().vitaliteCourante, this.card().vitaliteMax));

  protected readonly kindIcon = computed(() => combatantKindIcon(this.card().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.card().kind));

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  protected instanceLow(value: number): boolean {
    return isLowVitalite(value, this.card().vitaliteMax);
  }

  protected instanceLabel(index: number, value: number): string {
    return `exemplaire ${index + 1} : ${value} sur ${this.card().vitaliteMax ?? '—'}`;
  }
}
```

Créer `front/src/app/bol/session/play/tapis/character-card.html` :

```html
<button
  type="button"
  [id]="'chc-' + card().key"
  [class]="'chc chc--' + card().kind"
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
```

Créer `front/src/app/bol/session/play/tapis/character-card.scss` :

```scss
:host {
  display: block;
}

.chc {
  --chc-kind: var(--dw-color-reussite);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 8.25rem;
  padding: 0;
  border: 1px solid var(--dw-border);
  border-top: 3px solid var(--chc-kind);
  border-radius: 8px;
  background: var(--dw-surface-100);
  color: var(--dw-surface-700);
  font: inherit;
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.12s ease-out, border-color 0.12s ease-out;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--dw-surface-500);
    border-top-color: var(--chc-kind);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-color-legendary);
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chc {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}

.chc--pnj { --chc-kind: var(--dw-color-pnj); }
.chc--creature { --chc-kind: var(--dw-color-creature); }
.chc--demon { --chc-kind: var(--dw-color-demon); }

.chc-badge {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: var(--dw-surface-0);
  color: var(--chc-kind);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.chc-name {
  padding: 0.35rem 0.5rem 0.3rem;
  // Deux lignes au plus, toujours la même hauteur : les faces restent alignées dans un rang.
  min-height: 2.35rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--dw-surface-900);
}

// Laisse la place à l'étiquette en haut à droite quand il y en a une.
.chc-badge + .chc-name {
  padding-right: 3.4rem;
}

.chc-art {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 4rem;
  background: linear-gradient(160deg, var(--dw-surface-200), var(--dw-surface-50));
  color: var(--chc-kind);

  .mat-icon {
    font-size: 2rem;
    width: 2rem;
    height: 2rem;
  }
}

.chc-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--dw-border);
}

.chc-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dw-surface-900);

  & + & {
    border-left: 1px solid var(--dw-border);
  }

  small {
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dw-surface-500);
  }
}

.chc-bar {
  display: block;
  height: 4px;
  background: var(--dw-surface-200);
}

.chc-bar-fill {
  display: block;
  height: 100%;
  background: var(--dw-color-health);
}

.chc-bar-fill--low {
  background: var(--dw-color-echec);
}

.chc-pips {
  display: flex;
  gap: 2px;
  padding: 0.25rem 0.4rem;
  border-top: 1px solid var(--dw-border);
}

.chc-pip {
  flex: 1;
  height: 5px;
  border-radius: 2px;
  background: var(--dw-color-health);
}

.chc-pip--low {
  background: var(--dw-color-echec);
}

.chc-pip--out {
  background: var(--dw-surface-200);
}
```

- [ ] **Step 2: Valider**

Run: `cd front && npm run build`
Expected: build réussi (le composant est branché à la tâche 5).

- [ ] **Step 3: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/tapis
git commit -m "feat(tapis): face d'une carte (bol-character-card)"
```

---

### Task 4: La carte dépliée (`bol-expanded-card`)

**Files:**
- Create: `front/src/app/bol/session/play/tapis/instance-vitalite.ts`
- Create: `front/src/app/bol/session/play/tapis/expanded-card.ts`
- Create: `front/src/app/bol/session/play/tapis/expanded-card.html`
- Create: `front/src/app/bol/session/play/tapis/expanded-card.scss`

**Interfaces:**
- Consumes: `TapisCard`, `vitaliteSteppers`, `campActionLabel`, `removeActionLabel` (tâche 2) ; `HeroResourcesComponent` + `HeroResourcesData` (`play/hero-resources/hero-resources.ts`) ; `ActionRollPanelComponent` (`play/action-roll-panel/action-roll-panel.ts`) ; `ActionRollData`, `LastRoll` (`session/action-roll.util.ts`) ; `BolStatblockComponent`, `BolStatblockData` ; `ValueTracker` (`session/value-tracker.ts`) ; `BolFightSessionService.applyDamage(sessionId, kind, pivotId, delta, instanceIndex)`.
- Produces:
  - `InstanceVitaliteComponent`, sélecteur `bol-instance-vitalite` : entrées `sessionId`, `kind`, `pivotId`, `instanceIndex` (`number | null`), `label`, `value`, `max` (`number | null`), `nom` ; sortie `changed`.
  - `interface ExpandedHeroData { readonly resources: HeroResourcesData; readonly actionRoll: ActionRollData }`
  - `ExpandedCardComponent`, sélecteur `bol-expanded-card` : entrées `card` (requise), `sessionId` (requise), `hero: ExpandedHeroData | null`, `statblock: BolStatblockData | null`, `returnUrl: string | null` ; sorties `closed`, `changed` (`void`), `rolled` (`LastRoll`), `removeRequested`, `campToggleRequested`, `fullSheetRequested` (`TapisCard`).

- [ ] **Step 1: Stepper de vitalité d'un exemplaire**

Créer `front/src/app/bol/session/play/tapis/instance-vitalite.ts` :

```ts
import {ChangeDetectionStrategy, Component, effect, inject, input, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {ValueTracker} from '../../value-tracker';
import {TapisKind} from './tapis.util';

/** Vitalité d'un PNJ, d'une créature ou d'un démon — ou d'un seul exemplaire d'un lot — ajustable
 * par stepper et persistée à chaque pas. La valeur affichée suit chaque rechargement de la session. */
@Component({
  selector: 'bol-instance-vitalite',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  template: `
    <span class="ivt-label">{{ label() }} ({{ value() }} / {{ max() ?? '—' }})</span>
    <dw-value-stepper
      [formControl]="control"
      [min]="0"
      [max]="max() ?? undefined"
      [ariaLabel]="'Vitalité de ' + nom() + ' ' + label()"
    />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .ivt-label {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--dw-surface-500);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceVitaliteComponent {
  readonly sessionId = input.required<string>();
  readonly kind = input.required<TapisKind>();
  readonly pivotId = input.required<number>();
  /** Exemplaire visé dans un lot — null pour un PNJ. */
  readonly instanceIndex = input.required<number | null>();
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input.required<number | null>();
  readonly nom = input.required<string>();
  /** Une valeur a été persistée : le parent recharge la session. */
  readonly changed = output<void>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly control = new FormControl(0, {nonNullable: true});
  private readonly tracker = new ValueTracker();

  constructor() {
    effect(() => {
      const value = this.value();
      this.tracker.reset(value);
      if (value !== this.control.value) {
        this.control.setValue(value, {emitEvent: false});
      }
    });

    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onChange(value));
  }

  private onChange(value: number): void {
    const previous = this.tracker.value;
    const delta = this.tracker.take(value);
    if (delta === 0) {
      return;
    }

    this.fightSessionService
      .applyDamage(this.sessionId(), this.kind(), this.pivotId(), delta, this.instanceIndex())
      .subscribe({
        next: () => this.changed.emit(),
        error: (error: unknown) => {
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
            duration: 5000,
          });
          this.tracker.reset(previous);
          this.control.setValue(previous, {emitEvent: false});
        },
      });
  }
}
```

- [ ] **Step 2: La carte dépliée**

Créer `front/src/app/bol/session/play/tapis/expanded-card.ts` :

```ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolStatblockComponent, BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {ActionRollData, LastRoll} from '../../action-roll.util';
import {ActionRollPanelComponent} from '../action-roll-panel/action-roll-panel';
import {HeroResourcesComponent, HeroResourcesData} from '../hero-resources/hero-resources';
import {InstanceVitaliteComponent} from './instance-vitalite';
import {campActionLabel, removeActionLabel, TapisCard, TapisKind, vitaliteSteppers} from './tapis.util';

export interface ExpandedHeroData {
  readonly resources: HeroResourcesData;
  readonly actionRoll: ActionRollData;
}

const KIND_LABELS: Record<TapisKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Carte du tapis dépliée sur place. Héros : ressources, jet d'action, accès à la fiche complète.
 * PNJ / créature / démon : vitalité (par exemplaire pour un lot), statbloc, changement de camp,
 * retrait. Ne recharge rien elle-même : toute modification remonte à la page par événement. */
@Component({
  selector: 'bol-expanded-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    BolStatblockComponent,
    ActionRollPanelComponent,
    HeroResourcesComponent,
    InstanceVitaliteComponent,
  ],
  templateUrl: './expanded-card.html',
  styleUrl: './expanded-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedCardComponent {
  readonly card = input.required<TapisCard>();
  readonly sessionId = input.required<string>();
  /** Données du héros, `null` tant qu'elles chargent. */
  readonly hero = input<ExpandedHeroData | null>(null);
  /** Statbloc d'un PNJ / créature / démon, `null` tant qu'il charge ou si la fiche a disparu. */
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);

  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  readonly fullSheetRequested = output<TapisCard>();

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /** Héroïsme vivant du héros affiché, partagé entre les ressources et le jet d'action. */
  protected readonly heroisme = linkedSignal(() => this.hero()?.actionRoll.heroisme ?? 0);

  protected readonly subtitle = computed(() => {
    const card = this.card();
    const hero = this.hero();
    if (card.kind === 'hero') {
      const carrieres = hero?.actionRoll.carrieres.map((c) => `${c.label} ${c.value}`).join(' · ');
      return carrieres || KIND_LABELS.hero;
    }
    const lot = card.qty > 1 ? ` · lot de ${card.qty}` : '';
    return `${KIND_LABELS[card.kind]} · ${card.rang ?? ''}${lot}`;
  });

  protected readonly steppers = computed(() => vitaliteSteppers(this.card()));
  protected readonly campLabel = computed(() => campActionLabel(this.card()));
  protected readonly removeLabel = computed(() => removeActionLabel(this.card()));

  constructor() {
    // À l'ouverture, le focus entre dans la carte : le clavier et les lecteurs d'écran suivent.
    afterNextRender(() => this.root().nativeElement.focus());
  }
}
```

Créer `front/src/app/bol/session/play/tapis/expanded-card.html` :

```html
<div #root [class]="'exc exc--' + card().kind" role="group" tabindex="-1" [attr.aria-label]="'Carte de ' + card().nom">
  <header class="exc-header">
    <div class="exc-title">
      <h3 class="exc-name">{{ card().nom }}</h3>
      <p class="exc-sub">{{ subtitle() }}</p>
    </div>
    <button mat-icon-button type="button" aria-label="Replier la carte" (click)="closed.emit()">
      <mat-icon>close</mat-icon>
    </button>
  </header>

  <div class="exc-body">
    @if (card().kind === 'hero') {
      @if (hero(); as h) {
        <bol-hero-resources [data]="h.resources" [(heroisme)]="heroisme" (changed)="changed.emit()" />
        <bol-action-roll-panel [data]="h.actionRoll" [(heroisme)]="heroisme" (rolled)="rolled.emit($event)" />
        <button mat-stroked-button size="small" type="button" (click)="fullSheetRequested.emit(card())">
          <mat-icon>badge</mat-icon> Fiche complète
        </button>
      } @else {
        <p class="exc-loading">Chargement de la fiche…</p>
      }
    } @else {
      <div class="exc-vitalite">
        @for (stepper of steppers(); track stepper.label) {
          <bol-instance-vitalite
            [sessionId]="sessionId()"
            [kind]="card().kind"
            [pivotId]="card().pivotId"
            [instanceIndex]="stepper.index"
            [label]="stepper.label"
            [value]="stepper.value"
            [max]="card().vitaliteMax"
            [nom]="card().nom"
            (changed)="changed.emit()"
          />
        }
      </div>

      @if (statblock(); as sb) {
        <bol-statblock [data]="sb" [imageSrc]="card().avatar" [returnUrl]="returnUrl()" />
      }

      <div class="exc-actions">
        @if (campLabel(); as label) {
          <button mat-stroked-button size="small" type="button" (click)="campToggleRequested.emit(card())">
            <mat-icon>swap_vert</mat-icon> {{ label }}
          </button>
        }
        <button mat-stroked-button size="small" type="button" class="exc-remove" (click)="removeRequested.emit(card())">
          <mat-icon>person_remove</mat-icon> {{ removeLabel() }}
        </button>
      </div>
    }
  </div>
</div>
```

Créer `front/src/app/bol/session/play/tapis/expanded-card.scss` :

```scss
:host {
  display: block;
}

.exc {
  --exc-kind: var(--dw-color-reussite);
  width: min(23rem, 92vw);
  border: 1px solid var(--dw-color-legendary);
  border-top: 3px solid var(--exc-kind);
  border-radius: 8px;
  background: var(--dw-surface-50);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);

  // Le focus y entre à l'ouverture (tabindex -1) : pas d'anneau sur le conteneur lui-même, la
  // bordure dorée dit déjà quelle carte est ouverte.
  &:focus {
    outline: none;
  }
}

.exc--pnj { --exc-kind: var(--dw-color-pnj); }
.exc--creature { --exc-kind: var(--dw-color-creature); }
.exc--demon { --exc-kind: var(--dw-color-demon); }

.exc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.4rem 0.5rem 0.9rem;
  border-bottom: 1px solid var(--dw-border);
}

.exc-title {
  min-width: 0;
}

.exc-name {
  margin: 0;
  font-family: 'Muse Display Harmony', 'Muse Sans', serif;
  font-size: 1.15rem;
  font-weight: 400;
  color: var(--exc-kind);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exc-sub {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--dw-surface-500);
}

.exc-body {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.8rem 0.9rem 1rem;
}

.exc-loading {
  margin: 0;
  font-size: 0.88rem;
  color: var(--dw-surface-500);
}

.exc-vitalite {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.exc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.exc-remove {
  color: var(--dw-color-danger-muted);
  border-color: var(--dw-border-remove);
}
```

- [ ] **Step 3: Valider**

Run: `cd front && npm run build`
Expected: build réussi (branché à la tâche 5).

- [ ] **Step 4: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/tapis
git commit -m "feat(tapis): carte dépliée (bol-expanded-card)"
```

---

### Task 5: Le tapis (`bol-tapis`)

**Files:**
- Create: `front/src/app/bol/session/play/tapis/tapis.ts`
- Create: `front/src/app/bol/session/play/tapis/tapis.html`
- Create: `front/src/app/bol/session/play/tapis/tapis.scss`

**Interfaces:**
- Consumes: `CharacterCardComponent` (tâche 3) ; `ExpandedCardComponent`, `ExpandedHeroData` (tâche 4) ; `TapisCard`, `splitRows` (tâche 2) ; `LastRoll` ; `BolStatblockData`.
- Produces: `TapisComponent`, sélecteur `bol-tapis` :
  - entrées : `cards = input.required<readonly TapisCard[]>()`, `sessionId = input.required<string>()`, `expandedKey = input<string | null>(null)`, `hero = input<ExpandedHeroData | null>(null)`, `statblock = input<BolStatblockData | null>(null)`, `returnUrl = input<string | null>(null)`, `lastRoll = input<LastRoll | null>(null)`
  - sorties : `cardToggled` (`TapisCard`), `closed`, `changed` (`void`), `rolled` (`LastRoll`), `removeRequested`, `campToggleRequested`, `fullSheetRequested` (`TapisCard`)

- [ ] **Step 1: Écrire le composant**

Créer `front/src/app/bol/session/play/tapis/tapis.ts` :

```ts
import {NgTemplateOutlet} from '@angular/common';
import {afterRenderEffect, ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {LastRoll} from '../../action-roll.util';
import {CharacterCardComponent} from './character-card';
import {ExpandedCardComponent, ExpandedHeroData} from './expanded-card';
import {splitRows, TapisCard} from './tapis.util';

/** Le tapis (mode libre) : deux rangs de cartes rangées automatiquement — « Présents dans la scène »
 * en haut, « Héros et alliés » en bas — et le bandeau « Dernier jet » entre les deux. La carte dépliée
 * prend la place de sa face dans son rang. Ne parle à aucun service. */
@Component({
  selector: 'bol-tapis',
  imports: [NgTemplateOutlet, CharacterCardComponent, ExpandedCardComponent],
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

  readonly cardToggled = output<TapisCard>();
  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  readonly fullSheetRequested = output<TapisCard>();

  protected readonly rows = computed(() => splitRows(this.cards()));

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
}
```

Créer `front/src/app/bol/session/play/tapis/tapis.html` :

```html
<div class="tps">
  <section class="tps-row" aria-labelledby="tps-presents-label">
    <h2 class="tps-row-label" id="tps-presents-label">Présents dans la scène</h2>
    <ng-container
      *ngTemplateOutlet="
        rowTpl;
        context: {cards: rows().presents, labelId: 'tps-presents-label', empty: 'Personne ici pour l’instant. Pose des personnages depuis la réserve.'}
      "
    />
  </section>

  <div class="tps-last-roll" aria-live="polite" [class.tps-last-roll--empty]="!lastRoll()">
    @if (lastRoll(); as roll) {
      <span class="tps-last-roll-label">Dernier jet</span>
      <span class="tps-last-roll-formula">{{ roll.nom }} · {{ roll.formula }} → {{ roll.total }}</span>
      <strong [class]="'tps-last-roll-result tps-last-roll-result--' + roll.tone">{{ roll.label }}</strong>
    }
  </div>

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
            (closed)="closed.emit()"
            (changed)="changed.emit()"
            (rolled)="rolled.emit($event)"
            (removeRequested)="removeRequested.emit($event)"
            (campToggleRequested)="campToggleRequested.emit($event)"
            (fullSheetRequested)="fullSheetRequested.emit($event)"
          />
        } @else {
          <bol-character-card [card]="card" (toggled)="cardToggled.emit(card)" />
        }
      </li>
    } @empty {
      <li class="tps-empty">{{ empty }}</li>
    }
  </ul>
</ng-template>
```

Créer `front/src/app/bol/session/play/tapis/tapis.scss` :

```scss
:host {
  display: flex;
  flex: 1;
  min-height: 0;
}

.tps {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 1rem 1.2rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent;
  background:
    radial-gradient(ellipse 80% 60% at 50% 50%, color-mix(in srgb, var(--dw-surface-100) 70%, transparent) 0%, transparent 75%),
    var(--dw-surface-0);
}

.tps-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.tps-row-label {
  margin: 0;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

// Un rang trop long passe à la ligne ; les cartes restent alignées par le bas pour que la carte
// dépliée, plus haute, ne décale pas ses voisines.
.tps-cards {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

// Rang du haut : aligné par le haut, la carte dépliée s'étend vers le centre du tapis.
.tps-row:not(.tps-row--heros) .tps-cards {
  align-items: flex-start;
}

.tps-empty {
  padding: 1.2rem 0.5rem;
  font-size: 0.88rem;
  color: var(--dw-surface-500);
}

// Bandeau d'une ligne entre les deux rangs. Toujours présent dans le DOM (région aria-live), sans
// hauteur tant qu'aucun jet n'a été lancé.
.tps-last-roll {
  align-self: center;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--dw-border);
  border-radius: 8px;
  background: var(--dw-surface-0);
  font-size: 0.85rem;
  color: var(--dw-surface-600);
}

.tps-last-roll--empty {
  padding: 0;
  border: none;
}

.tps-last-roll-label {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

.tps-last-roll-formula {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tps-last-roll-result--reussite { color: var(--dw-color-reussite); }
.tps-last-roll-result--echec { color: var(--dw-color-echec); }
.tps-last-roll-result--heroique { color: var(--dw-color-legendary); }
```

- [ ] **Step 2: Valider**

Run: `cd front && npm run build`
Expected: build réussi (branché à la tâche 7).

- [ ] **Step 3: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/tapis
git commit -m "feat(tapis): les deux rangs (bol-tapis)"
```

---

### Task 6: La réserve en bandeau, les scènes en puces

**Files:**
- Create: `front/src/app/bol/session/play/reserve/scene-strip.ts`
- Create: `front/src/app/bol/session/play/reserve/scene-manager-dialog.ts`
- Modify: `front/src/app/bol/session/play/reserve/reserve.ts`
- Modify: `front/src/app/bol/session/play/reserve/reserve.html` (réécrit)
- Modify: `front/src/app/bol/session/play/reserve/reserve.scss` (réécrit)

**Interfaces:**
- Consumes: `SceneActionsService.load` / `.saveTable` (`session/scene-actions.service.ts`) ; `BolSceneService.scenes()`, `BolScenarioService.scenarios()` ; `scenesOf`, `NO_SCENARIO` (`play/scene-list/scene.util.ts`) ; `SceneListComponent` (`play/scene-list/scene-list.ts`, entrées `sessionId`, `currentSceneId`, `nonHeroCount`, sortie `changed`).
- Produces:
  - `SceneManagerDialogComponent` + `interface SceneManagerDialogData { sessionId: string; currentSceneId: string | null; nonHeroCount: number; onChanged: () => void }`.
  - `SceneStripComponent`, sélecteur `bol-scene-strip` : `sessionId = input.required<string>()`, `currentSceneId = input<string | null>(null)`, `nonHeroCount = input(0)`, `changed = output<void>()`.
  - `ReserveComponent` : mêmes entrées et sorties qu'aujourd'hui (`sessionId`, `existingHeroIds`, `existingPnjIds`, `currentSceneId`, `nonHeroCount`, `placed`, `sceneChanged`), mise en page horizontale.

- [ ] **Step 1: Dialogue « Gérer les scènes »**

Créer `front/src/app/bol/session/play/reserve/scene-manager-dialog.ts` :

```ts
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {SceneListComponent} from '../scene-list/scene-list';

export interface SceneManagerDialogData {
  readonly sessionId: string;
  readonly currentSceneId: string | null;
  readonly nonHeroCount: number;
  /** Appelé à chaque opération qui a modifié la session (scène chargée, renommée, supprimée…). */
  readonly onChanged: () => void;
}

/** Gestion fine des scènes (notes, renommer, réordonner, mettre à jour, supprimer, nouveau scénario) :
 * la liste complète `bol-scene-list`, ouverte depuis le bandeau de réserve où il n'y a de place que
 * pour des puces. */
@Component({
  selector: 'bol-scene-manager-dialog',
  imports: [MatDialogModule, MatButtonModule, SceneListComponent],
  template: `
    <h2 mat-dialog-title>Gérer les scènes</h2>
    <mat-dialog-content class="smd-content">
      <bol-scene-list
        [sessionId]="data.sessionId"
        [currentSceneId]="data.currentSceneId"
        [nonHeroCount]="data.nonHeroCount"
        (changed)="data.onChanged()"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: `
    .smd-content {
      display: flex;
      height: min(32rem, 70vh);
      padding-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneManagerDialogComponent {
  protected readonly data = inject<SceneManagerDialogData>(MAT_DIALOG_DATA);
}
```

- [ ] **Step 2: Les scènes en puces**

Créer `front/src/app/bol/session/play/reserve/scene-strip.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {forkJoin} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneModel, BolSceneScenarioRef} from '../../../models/bol-scene.model';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {SceneActionsService} from '../../scene-actions.service';
import {NO_SCENARIO, scenesOf} from '../scene-list/scene.util';
import {SceneManagerDialogComponent, SceneManagerDialogData} from './scene-manager-dialog';

/** Onglet « Scènes » du bandeau de réserve : le scénario, ses scènes en puces (un clic charge), et
 * l'accès à « Enregistrer la table » et « Gérer les scènes ». Signale à la page (`changed`) chaque
 * opération qui a modifié la session. */
@Component({
  selector: 'bol-scene-strip',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="scs-scenario">
      <mat-label>Scénario</mat-label>
      <mat-select id="scs-scenario-select" [value]="selectedScenario() ?? noScenario" (selectionChange)="selectScenario($event)">
        <mat-option [value]="noScenario">Sans scénario</mat-option>
        @for (scenario of sortedScenarios(); track scenario.id) {
          <mat-option [value]="scenario.id">{{ scenario.titre }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <ul class="scs-scenes" role="list" aria-label="Scènes du scénario">
      @for (scene of visibleScenes(); track scene.id; let index = $index) {
        <li>
          <button
            type="button"
            class="scs-chip"
            [class.scs-chip--current]="scene.id === currentSceneId()"
            [attr.aria-current]="scene.id === currentSceneId() ? 'true' : null"
            [attr.aria-label]="'Charger la scène ' + scene.titre"
            [disabled]="busy()"
            (click)="load(scene)"
          >
            {{ index + 1 }} · {{ scene.titre }}
          </button>
        </li>
      } @empty {
        <li class="scs-empty">{{ loading() ? 'Chargement…' : 'Aucune scène ici. Pose tes personnages, puis enregistre la table.' }}</li>
      }
    </ul>

    <div class="scs-actions">
      <button mat-flat-button size="small" type="button" [disabled]="busy() || loading()" (click)="saveTable()">
        <mat-icon>save</mat-icon> Enregistrer la table
      </button>
      <button mat-stroked-button size="small" type="button" [disabled]="loading()" (click)="manage()">
        Gérer les scènes
      </button>
    </div>
  `,
  styles: `
    :host {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .scs-scenario {
      flex: 0 0 13rem;
    }

    .scs-scenes {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
      padding: 0.3rem 0;
      list-style: none;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--dw-border) transparent;
    }

    .scs-chip {
      padding: 0.35rem 0.75rem;
      border: 1px solid var(--dw-border);
      border-radius: 999px;
      background: var(--dw-surface-100);
      color: var(--dw-surface-700);
      font: inherit;
      font-size: 0.82rem;
      white-space: nowrap;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: var(--dw-surface-500);
        color: var(--dw-surface-900);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    }

    .scs-chip--current {
      border-color: var(--dw-color-legendary);
      color: var(--dw-color-legendary);
      background: transparent;
    }

    .scs-empty {
      font-size: 0.85rem;
      color: var(--dw-surface-500);
      white-space: nowrap;
    }

    .scs-actions {
      flex-shrink: 0;
      display: flex;
      gap: 0.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneStripComponent {
  private readonly sceneService = inject(BolSceneService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly sceneActions = inject(SceneActionsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  readonly currentSceneId = input<string | null>(null);
  readonly nonHeroCount = input(0);
  /** La session a été modifiée (scène chargée ou enregistrée…) : la page la recharge. */
  readonly changed = output<void>();

  protected readonly noScenario = NO_SCENARIO;
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  private readonly scenes = signal<readonly BolSceneModel[]>([]);
  private readonly scenarios = signal<readonly BolSceneScenarioRef[]>([]);
  /** Scénario affiché — `null` = « Sans scénario ». */
  protected readonly selectedScenario = signal<string | null>(null);

  protected readonly sortedScenarios = computed(() =>
    [...this.scenarios()].sort((left, right) => left.titre.localeCompare(right.titre, 'fr')),
  );
  private readonly knownScenarioIds = computed(() => new Set(this.scenarios().map((s) => s.id)));
  protected readonly visibleScenes = computed(() =>
    scenesOf(this.scenes(), this.selectedScenario(), this.knownScenarioIds()),
  );

  constructor() {
    this.reload(true);

    // La scène courante peut avoir été créée ailleurs (barre de commande, dialogue de gestion) :
    // si elle n'est pas dans la liste, celle-ci est rechargée.
    effect(() => {
      const currentId = this.currentSceneId();
      const known = untracked(() => this.scenes().some((scene) => scene.id === currentId));
      if (currentId && !known && !untracked(() => this.loading())) {
        this.reload(false);
      }
    });
  }

  /** Recharge scènes et scénarios. Au premier chargement, se place sur le scénario de la scène
   * courante de la session. */
  private reload(selectCurrent: boolean): void {
    forkJoin({scenes: this.sceneService.scenes(), scenarios: this.scenarioService.scenarios()}).subscribe({
      next: ({scenes, scenarios}) => {
        this.scenes.set(scenes);
        this.scenarios.set(
          scenarios.filter((s): s is typeof s & {id: string} => !!s.id).map((s) => ({id: s.id, titre: s.titre})),
        );
        const known = this.knownScenarioIds();
        if (selectCurrent) {
          const scenarioId = scenes.find((s) => s.id === this.currentSceneId())?.scenario_id ?? null;
          this.selectedScenario.set(scenarioId && known.has(scenarioId) ? scenarioId : null);
        } else if (this.selectedScenario() && !known.has(this.selectedScenario()!)) {
          // Le scénario affiché a été supprimé depuis le dialogue de gestion.
          this.selectedScenario.set(null);
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.fail(error, 'Impossible de charger les scènes.');
      },
    });
  }

  protected selectScenario(change: MatSelectChange): void {
    this.selectedScenario.set(change.value === NO_SCENARIO ? null : (change.value as string));
  }

  protected load(scene: BolSceneModel): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.sceneActions.load(this.sessionId(), scene, this.nonHeroCount()).subscribe({
      next: (result) => {
        this.busy.set(false);
        if (result) {
          this.changed.emit();
        }
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.fail(error, 'Impossible de charger la scène.');
      },
    });
  }

  protected saveTable(): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.sceneActions.saveTable(this.sessionId(), this.selectedScenario()).subscribe({
      next: (scene) => {
        this.busy.set(false);
        if (scene) {
          this.scenes.update((list) => [...list, scene]);
          this.changed.emit();
        }
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.fail(error, "Impossible d'enregistrer la scène.");
      },
    });
  }

  /** Ouvre la liste complète des scènes en dialogue ; au retour, les puces sont rechargées. */
  protected manage(): void {
    const data: SceneManagerDialogData = {
      sessionId: this.sessionId(),
      currentSceneId: this.currentSceneId(),
      nonHeroCount: this.nonHeroCount(),
      onChanged: () => this.changed.emit(),
    };
    this.dialog
      .open(SceneManagerDialogComponent, {data, width: 'min(34rem, 94vw)', maxWidth: '94vw'})
      .afterClosed()
      .subscribe(() => this.reload(false));
  }

  private fail(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }
}
```

- [ ] **Step 3: La réserve en bandeau**

Dans `front/src/app/bol/session/play/reserve/reserve.ts` :

- remplacer l'import `import {SceneListComponent} from '../scene-list/scene-list';` par `import {SceneStripComponent} from './scene-strip';` ;
- dans `imports` du décorateur, remplacer `SceneListComponent` par `SceneStripComponent` ;
- remplacer le commentaire de classe par :

```ts
/** Réserve de la table (mode libre), en bandeau au bas de l'écran comme une main de cartes : les
 * quatre bibliothèques et les scènes en onglets. Un clic sur un personnage le pose ; la page
 * recharge la session sur `placed`. */
```

- ajouter dans la classe, après `pendingCatalogId` :

```ts
  /** Entrées dont l'avatar a échoué au chargement : repli sur l'initiale du nom. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());
```

- ajouter ces méthodes après `setQuery` :

```ts
  protected hasAvatar(entry: CombatCatalogEntry): boolean {
    return !!entry.avatar && !this.brokenAvatars().has(entry.catalogId);
  }

  protected onAvatarError(entry: CombatCatalogEntry): void {
    this.brokenAvatars.update((set) => new Set(set).add(entry.catalogId));
  }

  protected initial(entry: CombatCatalogEntry): string {
    return entry.nom.trim().charAt(0).toUpperCase();
  }

  protected miniLabel(row: ReserveRow): string {
    return row.onTable ? `${row.entry.nom}, déjà à table` : `Poser ${row.entry.nom} sur la table`;
  }
```

Remplacer tout le contenu de `reserve.html` par :

```html
<div class="rsv-band">
  <div class="rsv-side">
    <h2 class="rsv-title">Réserve</h2>
    <mat-button-toggle-group
      class="rsv-tabs"
      aria-label="Contenu de la réserve"
      [value]="view()"
      [hideSingleSelectionIndicator]="true"
      (change)="setView($event)"
    >
      @for (tab of tabs; track tab.kind) {
        <mat-button-toggle [value]="tab.kind">{{ tab.label }}</mat-button-toggle>
      }
      <mat-button-toggle value="scene">Scènes</mat-button-toggle>
    </mat-button-toggle-group>
  </div>

  @if (view() === 'scene') {
    <bol-scene-strip
      [sessionId]="sessionId()"
      [currentSceneId]="currentSceneId()"
      [nonHeroCount]="nonHeroCount()"
      (changed)="sceneChanged.emit()"
    />
  } @else {
    <mat-form-field subscriptSizing="dynamic" class="rsv-search">
      <mat-icon matPrefix>search</mat-icon>
      <input
        id="rsv-search-input"
        matInput
        type="search"
        placeholder="Rechercher"
        aria-label="Rechercher dans la réserve"
        [value]="query()"
        (input)="setQuery($any($event.target).value)"
      />
    </mat-form-field>

    <ul class="rsv-hand" role="list" [attr.aria-label]="activeTab().label + ' de la réserve'">
      @for (row of rows(); track row.entry.catalogId) {
        <li>
          <button
            type="button"
            [class]="'rsv-mini rsv-mini--' + row.entry.kind"
            [class.rsv-mini--on-table]="row.onTable"
            [disabled]="row.onTable || pendingCatalogId() !== null"
            [attr.aria-label]="miniLabel(row)"
            (click)="place(row.entry)"
          >
            <span class="rsv-mini-art">
              @if (hasAvatar(row.entry)) {
                <img class="rsv-mini-avatar" [src]="row.entry.avatar" alt="" (error)="onAvatarError(row.entry)" />
              } @else {
                {{ initial(row.entry) }}
              }
            </span>
            <span class="rsv-mini-name">{{ row.entry.nom }}</span>
            @if (row.onTable) {
              <span class="rsv-mini-state">à table</span>
            }
          </button>
        </li>
      } @empty {
        <li class="rsv-empty">
          @if (loading()) {
            Chargement…
          } @else if (query()) {
            Aucun résultat pour cette recherche.
          } @else {
            Rien ici pour l'instant.
          }
        </li>
      }
    </ul>

    <div class="rsv-links">
      <a mat-flat-button size="small" [routerLink]="activeTab().createLink" [state]="navState()">
        <mat-icon>add</mat-icon> {{ activeTab().createLabel }}
      </a>
      <a mat-stroked-button size="small" [routerLink]="activeTab().libraryLink" [state]="navState()">
        Gérer la bibliothèque
      </a>
    </div>
  }
</div>
```

Remplacer tout le contenu de `reserve.scss` par :

```scss
:host {
  display: block;
}

// Bandeau horizontal : onglets à gauche, puis le contenu de l'onglet sur une ligne.
.rsv-band {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 6.4rem;
  padding: 0.5rem 0.9rem;
}

.rsv-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rsv-title {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

.rsv-tabs {
  // Cinq onglets côte à côte : libellés resserrés pour laisser la largeur aux cartes.
  ::ng-deep .mat-button-toggle-label-content {
    padding: 0 0.55rem;
    font-size: 0.76rem;
    line-height: 2.1rem;
  }
}

.rsv-search {
  flex: 0 0 11rem;
}

// La « main » : cartes réduites sur une ligne, défilement horizontal.
.rsv-hand {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin: 0;
  padding: 0.3rem 0.1rem;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent;
}

.rsv-mini {
  --rsv-kind: var(--dw-color-reussite);
  display: flex;
  flex-direction: column;
  width: 5.4rem;
  height: 100%;
  padding: 0;
  border: 1px solid var(--dw-border);
  border-top: 3px solid var(--rsv-kind);
  border-radius: 6px;
  background: var(--dw-surface-100);
  color: var(--dw-surface-700);
  font: inherit;
  text-align: left;
  overflow: hidden;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--dw-surface-500);
    border-top-color: var(--rsv-kind);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-color-legendary);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
  }
}

.rsv-mini--pnj { --rsv-kind: var(--dw-color-pnj); }
.rsv-mini--creature { --rsv-kind: var(--dw-color-creature); }
.rsv-mini--demon { --rsv-kind: var(--dw-color-demon); }

// Déjà à table : estompée, non cliquable.
.rsv-mini--on-table {
  opacity: 0.45;
}

.rsv-mini-art {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.4rem;
  background: linear-gradient(160deg, var(--dw-surface-200), var(--dw-surface-50));
  color: var(--rsv-kind);
  font-family: 'Muse Display Harmony', 'Muse Sans', serif;
  font-size: 1.1rem;
}

.rsv-mini-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rsv-mini-name {
  padding: 0.25rem 0.35rem 0;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  color: var(--dw-surface-900);
}

.rsv-mini-state {
  padding: 0 0.35rem 0.25rem;
  font-size: 0.62rem;
  color: var(--dw-surface-500);
}

.rsv-empty {
  align-self: center;
  font-size: 0.85rem;
  color: var(--dw-surface-500);
  white-space: nowrap;
}

.rsv-links {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
```

- [ ] **Step 4: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent. (La réserve est encore affichée en colonne par la page jusqu'à la tâche 7 : son rendu est provisoirement incorrect, c'est attendu.)

- [ ] **Step 5: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/reserve
git commit -m "feat(tapis): réserve en bandeau et scènes en puces"
```

---

### Task 7: Brancher le tapis dans la page

**Files:**
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html` (réécrit)
- Modify: `front/src/app/bol/session/play/session-play-page.scss`
- Modify: `front/src/app/bol/session/play/battlemap/battlemap.ts`
- Modify: `front/src/app/bol/session/play/battlemap/battlemap.scss`
- Modify: `front/src/app/bol/session/play/table-state.util.ts`
- Modify: `front/src/app/bol/session/play/table-state.util.spec.ts`
- Delete: `front/src/app/bol/session/play/token-inspector/` (dossier entier)

**Interfaces:**
- Consumes: `TapisComponent` (tâche 5) ; `ExpandedHeroData` (tâche 4) ; `buildTapisCards`, `findCard`, `cardLabel`, `removeActionLabel`, `TapisCard` (tâche 2) ; `BolFightSessionService.setCamp` (tâche 2) ; `ReserveComponent` en bandeau (tâche 6).

- [ ] **Step 1: Retirer la sélection de jeton du battlefield**

Dans `front/src/app/bol/session/play/battlemap/battlemap.ts` :

- supprimer les trois lignes :

```ts
  /** Jeton sélectionné (fiche du jeton ouverte, mode libre) — anneau doré. */
  readonly selectedKey = input<string | null>(null);
```

```ts
  /** Clic simple sur un jeton hors mode ciblage. */
  readonly tokenSelected = output<PlayToken>();
```

- dans `onTokenClick`, remplacer :

```ts
    if (!sourceKey) {
      this.tokenSelected.emit(token);
      return;
    }
```

par :

```ts
    if (!sourceKey) {
      return;
    }
```

- dans `tokenClass`, remplacer les deux lignes :

```ts
    const selected = token.key === this.selectedKey() ? ' cp-token--selected' : '';
    return `cp-token cp-token--${token.kind}${active}${selected}${isSource}${isTargetable}${targeting}`;
```

par :

```ts
    return `cp-token cp-token--${token.kind}${active}${isSource}${isTargetable}${targeting}`;
```

Dans `front/src/app/bol/session/play/battlemap/battlemap.scss`, supprimer le bloc :

```scss
.cp-token--selected .cp-token-portrait {
  box-shadow: 0 0 0 3px var(--dw-surface-0), 0 0 0 5px var(--dw-color-legendary);
}
```

- [ ] **Step 2: Retirer `findSelectedToken`**

Dans `front/src/app/bol/session/play/table-state.util.ts`, supprimer la fonction `findSelectedToken` (avec son commentaire) et l'import `import {PlayToken} from '../combat-play.util';` devenu inutile.

Dans `front/src/app/bol/session/play/table-state.util.spec.ts`, supprimer le bloc `describe('findSelectedToken', …)` en entier, l'import de `PlayToken`, et retirer `findSelectedToken` de l'import de `./table-state.util`.

- [ ] **Step 3: Réécrire le template de la page**

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

    @if (mode() === 'combat') {
      <bol-initiative-rail
        [tokens]="orderedTokens()"
        [activeKey]="activeKey()"
        (reordered)="onRailReordered($event)"
        (addCombatant)="openAddCombatantDialog()"
        (removeCombatant)="askRemoveCombatant($event)"
      />

      <div class="spp-combat">
        <bol-battlemap
          [mode]="mode()"
          [heroTokens]="heroTokens()"
          [adversaireTokens]="adversaireTokens()"
          [activeKey]="activeKey()"
          [tokenPositions]="tokenPositions()"
          (attackRequested)="onAttackRequested($event)"
          (statblockRequested)="openStatblockFor($event)"
          (actionRollRequested)="openStatblockFor($event)"
          (positionChanged)="onPositionChanged($event)"
        />
      </div>
    } @else if (sessionId(); as sid) {
      <bol-tapis
        [cards]="cards()"
        [sessionId]="sid"
        [expandedKey]="expandedCard()?.key ?? null"
        [hero]="expandedHero()"
        [statblock]="expandedStatblock()"
        [returnUrl]="returnUrl()"
        [lastRoll]="lastRoll()"
        (cardToggled)="onCardToggled($event)"
        (closed)="foldCard()"
        (changed)="reloadSession()"
        (rolled)="lastRoll.set($event)"
        (removeRequested)="askRemoveCard($event)"
        (campToggleRequested)="toggleCamp($event)"
        (fullSheetRequested)="openFullSheet($event)"
      />

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
  </div>
}
```

- [ ] **Step 4: Mettre à jour la feuille de style de la page**

Dans `session-play-page.scss`, supprimer les blocs `.spp-table`, `.spp-reserve`, `.spp-reserve-toggle`, `.spp-center`, `.spp-inspector`, `.spp-last-roll`, `.spp-last-roll--empty`, `.spp-last-roll-label`, `.spp-last-roll-formula` et les trois règles `.spp-last-roll-result--*` (avec leurs commentaires), puis ajouter à la fin :

```scss
// Mode combat : le battlefield occupe toute la hauteur restante.
.spp-combat {
  flex: 1;
  min-height: 0;
  display: flex;
}

// Mode libre : le tapis (`bol-tapis`, qui s'étire), puis la réserve en bandeau, repliable.
.spp-reserve-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.15rem 0;
  border: none;
  border-top: 1px solid var(--dw-border);
  background: var(--dw-surface-50);
  color: var(--dw-surface-500);
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;

  .mat-icon {
    font-size: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
  }

  &:hover {
    color: var(--dw-surface-900);
    background: var(--dw-surface-100);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-color-legendary);
    outline-offset: -2px;
  }
}

.spp-reserve {
  flex-shrink: 0;
  border-top: 1px solid var(--dw-border);
  background: var(--dw-surface-0);
}
```

- [ ] **Step 5: Mettre à jour la classe de la page**

Dans `session-play-page.ts` :

**Imports.** Supprimer :

```ts
import {TokenInspectorComponent, TokenInspectorHeroData} from './token-inspector/token-inspector';
```

Remplacer l'import de `./table-state.util` par :

```ts
import {browserStorage, readPanelOpen, RESERVE_PANEL_KEY, writePanelOpen} from './table-state.util';
```

Ajouter :

```ts
import {ExpandedHeroData} from './tapis/expanded-card';
import {TapisComponent} from './tapis/tapis';
import {buildTapisCards, cardLabel, findCard, removeActionLabel, TapisCard} from './tapis/tapis.util';
```

**Décorateur.** Dans `imports`, remplacer `TokenInspectorComponent` par `TapisComponent`. Remplacer le commentaire de classe par :

```ts
/**
 * La table : page d'accueil d'une session. Orchestre le chargement/la persistance de la session et
 * l'ouverture des dialogs. Mode libre : `bol-tapis` (cartes de personnage sur deux rangs) et
 * `bol-reserve` (bandeau du bas). Mode combat : `bol-initiative-rail` et `bol-battlemap` (jetons),
 * inchangés en attendant le combat sur le tapis.
 */
```

**Membres.** Remplacer le bloc qui va du commentaire `/** Clé du jeton dont la fiche est ouverte (mode libre). */` jusqu'à la ligne `protected readonly inspectorStatblock = signal<BolStatblockData | null>(null);` incluse par :

```ts
  /** Cartes du tapis (mode libre), une par ligne de session. */
  protected readonly cards = computed(() => {
    const session = this.session();
    return session ? buildTapisCards(session) : [];
  });

  /** Clé de la carte dépliée. La carte elle-même est retrouvée à chaque rechargement : si elle a
   * quitté la table (retirée, scène chargée en remplacement), plus rien n'est déplié. */
  private readonly expandedKey = signal<string | null>(null);
  protected readonly expandedCard = computed(() => (this.mode() === 'libre' ? findCard(this.cards(), this.expandedKey()) : null));
  /** Données de la carte dépliée, chargées au dépliage — `null` pendant le chargement. */
  protected readonly expandedHero = signal<ExpandedHeroData | null>(null);
  protected readonly expandedStatblock = signal<BolStatblockData | null>(null);
```

Dans `paletteContext`, remplacer la ligne `tokens: …` par :

```ts
    tokens: this.cards().map((card) => ({key: card.key, nom: cardLabel(card), kind: card.kind})),
```

**`askRemoveCombatant`** (utilisé par le ruban d'initiative en combat). Remplacer son `next` par :

```ts
        next: () => this.loadSession(sessionId),
```

**`openStatblockFor`.** Supprimer les quatre lignes de la branche mode libre au début de la méthode :

```ts
    if (this.mode() === 'libre') {
      this.onTokenSelected(token);
      return;
    }
```

et remplacer le commentaire de la méthode par `/** Bouton « carte » ou double-clic sur un jeton du battlefield (mode combat) : dialog de statbloc. */`.

**Bloc à supprimer.** Supprimer, commentaires compris, les méthodes `onTokenSelected`, `closeInspector`, `loadInspector`, `buildInspectorHero` et `openFullSheet(token: PlayToken)`. Conserver `toggleReserve`, `reloadSession`, `openHeroPopup`, `buildHeroStatblockData`.

**`onEscape` et `onSceneChanged`.** Les remplacer par :

```ts
  /** Échap replie la carte dépliée, sauf si un dialogue est ouvert : Échap ne ferme alors que lui. */
  protected onEscape(): void {
    if (this.dialog.openDialogs.length === 0) {
      this.foldCard();
    }
  }

  /** Une scène a été chargée, enregistrée, renommée ou supprimée : la table a pu changer du tout au
   * tout, la carte dépliée est repliée avant de recharger la session. */
  protected onSceneChanged(): void {
    this.foldCard();
    this.reloadSession();
  }
```

**Bloc à ajouter** après `reloadSession` :

```ts
  /** Clic sur la face d'une carte : la déplie (une seule carte dépliée à la fois). */
  protected onCardToggled(card: TapisCard): void {
    if (this.expandedKey() === card.key) {
      return;
    }
    this.expandedKey.set(card.key);
    this.loadExpanded(card);
  }

  protected foldCard(): void {
    this.expandedKey.set(null);
  }

  /** Charge les données de la carte dépliée. Chaque réponse est ignorée si une autre carte a été
   * dépliée entre-temps (réponses arrivées dans le désordre). */
  private loadExpanded(card: TapisCard): void {
    this.expandedHero.set(null);
    this.expandedStatblock.set(null);

    const sourceId = card.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    const stillExpanded = (): boolean => this.expandedKey() === card.key;

    switch (card.kind) {
      case 'hero':
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (stillExpanded()) {
              this.expandedHero.set(this.buildExpandedHero(card, hero, sourceId, sessionId));
            }
          });
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(pnjStatblockData(pnj));
            }
          });
        break;
      case 'creature':
        this.creaturesService
          .creature(sourceId)
          .pipe(take(1))
          .subscribe((creature) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(creatureStatblockData(creature));
            }
          });
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(demonStatblockData(demon));
            }
          });
        break;
    }
  }

  private buildExpandedHero(card: TapisCard, hero: BolHerosModel, herosId: string, sessionId: string): ExpandedHeroData {
    return {
      resources: {
        sessionId,
        herosId,
        pivotId: card.pivotId,
        heroNom: card.nom,
        vitaliteCourante: card.vitaliteCourante ?? hero.ressources.vitalite,
        vitaliteMax: hero.ressources.vitalite,
      },
      actionRoll: {
        heroNom: card.nom,
        herosId,
        heroisme: hero.ressources.heroisme,
        agilite: hero.attributs.agilite,
        vigueur: hero.attributs.vigueur,
        esprit: hero.attributs.esprit,
        aura: hero.attributs.aura,
        equipementAgilite: hero.attributs.agilite_effective - hero.attributs.agilite,
        carrieres: hero.carrieres
          .map((c) => ({label: c.carriere?.carriere ?? '', value: c.value}))
          .filter((c) => c.label),
        diceTraits: hero.traits
          .map((trait): ActionRollDiceTrait | null => {
            const traitable = trait.traitable;
            if (!traitable) {
              return null;
            }
            if (trait.type === 'A' && 'de_bonus' in traitable && traitable.de_bonus) {
              return {label: traitable.avantage, domaine: traitable.de_bonus_domaine, kind: 'avantage'};
            }
            if (trait.type === 'D' && 'de_malus' in traitable && traitable.de_malus) {
              return {label: traitable.desavantage, domaine: traitable.de_malus_domaine, kind: 'desavantage'};
            }
            return null;
          })
          .filter((t): t is ActionRollDiceTrait => t !== null),
      },
    };
  }

  /** « Retirer de la table » (ou « Retirer un exemplaire » pour un lot) depuis la carte dépliée. */
  protected askRemoveCard(card: TapisCard): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    const label = removeActionLabel(card);
    confirmDialog(
      this.dialog,
      {
        title: label,
        message:
          card.qty > 1
            ? `Voulez-vous retirer un exemplaire de « ${card.nom} » ? Il en restera ${card.qty - 1}.`
            : `Voulez-vous retirer « ${card.nom} » de la table ?`,
        confirmLabel: 'Retirer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.removeCombatant(sessionId, card.kind, card.pivotId).subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => this.tableError(error, 'Impossible de retirer ce personnage.'),
      });
    });
  }

  /** Passe la carte du côté des héros (allié) ou la remet avec les présents. */
  protected toggleCamp(card: TapisCard): void {
    const sessionId = this.sessionId();
    if (!sessionId || card.kind === 'hero') {
      return;
    }

    this.fightSessionService
      .setCamp(sessionId, card.kind, card.pivotId, card.camp === 'heros' ? 'adversaires' : 'heros')
      .subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => this.tableError(error, 'Impossible de changer ce personnage de camp.'),
      });
  }

  /** « Fiche complète » depuis la carte dépliée d'un héros : statbloc en dialog. À la fermeture, si
   * quelque chose a changé (vitalité, héroïsme, équipement), la session et la carte sont rechargées. */
  protected openFullSheet(card: TapisCard): void {
    const sessionId = this.sessionId();
    // Un héros a la même clé comme carte et comme jeton (`hero-{id}`) : le jeton porte ce dont le
    // dialog de statbloc a besoin.
    const token = this.board()?.tokens.find((t) => t.key === card.key);
    if (!sessionId || !card.sourceId || !token) {
      return;
    }

    this.openHeroPopup(token, card.sourceId, sessionId, () => this.loadExpanded(card));
  }

  private tableError(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }
```

**Barre de commande.** Dans `executePaletteCommand`, remplacer la branche `case 'select'` par :

```ts
      case 'select': {
        const card = findCard(this.cards(), command.key);
        if (card) {
          this.onCardToggled(card);
        }
        break;
      }
```

- [ ] **Step 6: Supprimer la fiche du jeton**

```bash
rm -r front/src/app/bol/session/play/token-inspector
```

Run: `grep -rn "token-inspector\|TokenInspector\|findSelectedToken\|tokenSelected\|selectedKey\|closeInspector\|onTokenSelected" front/src/app --include=*.ts --include=*.html --include=*.scss`
Expected: aucune ligne, hormis d'éventuels commentaires dans `hero-statblock-dialog.ts` / `hero-statblock-popup.ts` / `hero-resources.ts` / `action-roll-panel.*` qui mentionnent `bol-token-inspector` : y remplacer ce nom par `bol-expanded-card`.

- [ ] **Step 7: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi sans erreur ni avertissement, tous les tests passent.

- [ ] **Step 8: Commit** (ignoré sans autorisation)

```bash
git add -A front/src/app/bol/session/play
git commit -m "feat(tapis): le tapis remplace le battlefield en mode libre"
```

---

### Task 8: Vérification de bout en bout

**Files:** aucun fichier créé dans le dépôt ; un script Playwright jetable dans `front/scripts/`, supprimé à la fin. Corrections éventuelles dans les fichiers des tâches précédentes.

**Interfaces:**
- Consumes: l'application complète. Skill `run`. Compte de test `claude-test@example.com` / `ClaudeTest123!`. API en conteneur (`docker ps` montre `diceway`), front sur `http://localhost:4200` (vérifier `<title>Front</title>`).

Le script crée une session, une scène et les supprime à la fin. Attendre la fin de l'ouverture d'un dialogue de saisie avant d'y taper.

- [ ] **Step 1: Préparer**

Ouvrir une table avec deux héros du compte de test (brouillon `diceway-combat-selection` dans `localStorage`, puis `/session/new` → « Ouvrir la table »).

- [ ] **Step 2: Le tapis à l'ouverture**

Expected: aucun battlefield (`bol-battlemap` absent) ; deux cartes de héros dans le rang « Héros et alliés » ; le rang « Présents dans la scène » affiche sa phrase d'aide ; chaque face de héros montre « Dég. », « Déf. », « Vit. » avec des valeurs ; la réserve est en bandeau en bas, onglet Héros, les deux héros estompés « à table ». Capture d'écran à 1280×800.

- [ ] **Step 3: Poser depuis le bandeau**

Onglet PNJ → cliquer « Garde du port ». Onglet Créatures → chercher « loup », cliquer deux fois la même carte.
Expected: le PNJ apparaît dans le rang du haut avec son étiquette de rang et ses trois chiffres ; il devient estompé dans le bandeau ; deux cartes de créature distinctes apparaissent (deux poses = deux lignes).

- [ ] **Step 4: Lot**

Barre de commande : `/`, « 3 loup g », Entrée.
Expected: une seule carte de plus, étiquetée « ×3 », avec trois jauges.

- [ ] **Step 5: Déplier un héros, lancer un jet**

Cliquer la carte d'un héros.
Expected: la carte se déplie dans son rang (les voisines s'écartent), le focus est dans la carte, les steppers de vitalité et d'héroïsme et le jet d'action sont là. Saisir un total manuel de 9 et valider : le bandeau « Dernier jet » apparaît entre les deux rangs. Échap replie la carte et rend le focus à sa face.

- [ ] **Step 6: Déplier le lot, blesser un exemplaire**

Cliquer la carte « ×3 ». Baisser de 2 la vitalité de l'exemplaire « #2 ».
Expected: trois steppers « #1 », « #2 », « #3 » ; après le clic, la deuxième jauge de la face (une fois repliée) reflète la blessure ; en base, `vitalite_instances[1]` a baissé de 2 et les deux autres n'ont pas bougé.

- [ ] **Step 7: Allié**

Déplier le PNJ → « Passer du côté des héros ».
Expected: la carte passe dans le rang du bas, après les héros, étiquetée « Allié » ; son action devient « Remettre avec les présents ».

- [ ] **Step 8: Scène avec allié**

Onglet Scènes du bandeau → « Enregistrer la table », titre « Tapis test ». Retirer le PNJ de la table. Cliquer la puce « Tapis test » → « Remplacer ».
Expected: la puce apparaît, marquée courante ; après chargement le PNJ est revenu **dans le rang du bas, « Allié »** ; les héros et leur vitalité n'ont pas bougé. En base, l'entrée PNJ de la distribution porte `"camp": "heros"`.

- [ ] **Step 9: Gérer les scènes**

« Gérer les scènes » → le dialogue montre la liste complète ; renommer « Tapis test » en « Tapis bis » ; fermer.
Expected: la puce porte le nouveau nom ; la barre du haut aussi.

- [ ] **Step 10: Retrait et carte fantôme**

Déplier une carte de créature simple → « Retirer de la table » → confirmer.
Expected: la carte disparaît et aucune carte n'est dépliée. Sur le lot : « Retirer un exemplaire » → l'étiquette passe à « ×2 » et la carte reste dépliée.

- [ ] **Step 11: Repli de la réserve, largeur**

Replier la réserve, recharger.
Expected: elle reste repliée ; le tapis occupe la hauteur libérée ; pas de défilement horizontal de la page à 1280 px.

- [ ] **Step 12: Le combat est inchangé**

« Démarrer un combat » par l'API, recharger.
Expected: le ruban d'initiative et le battlefield à jetons s'affichent comme avant ; ni tapis ni bandeau de réserve. Terminer le combat par l'API, recharger : le tapis revient, l'allié est toujours dans le rang du bas.

- [ ] **Step 13: Accessibilité au clavier**

Tab jusqu'à une carte, Entrée la déplie, Tab parcourt ses contrôles, Échap la replie et le focus revient sur la carte. Vérifier dans la console du navigateur qu'aucune erreur Angular n'apparaît pendant tout le parcours.

- [ ] **Step 14: Suites complètes et nettoyage**

Run: `cd front && npm run build && npx ng test --watch=false`
Run: `cd backend && php artisan test`
Expected: front tout vert ; backend tout vert sauf l'échec préexistant `ExampleTest`.

Supprimer le script jetable, la session et la scène de test. Vérifier qu'il ne reste que `screenshot.mjs` dans `front/scripts/`.

- [ ] **Step 15: Commit des corrections éventuelles** (ignoré sans autorisation)

```bash
git add -A
git commit -m "fix(tapis): corrections issues de la vérification de bout en bout"
```
