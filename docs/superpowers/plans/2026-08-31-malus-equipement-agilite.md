# Malus d'équipement (Agilité/Initiative/Défense) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire en sorte que l'armure/le bouclier/le casque réellement équipés par un héros (ou un PNJ) modifient correctement son Agilité, son Initiative et sa Défense effectives, partout où ces valeurs sont utilisées (fiche, statblock, jet d'action, jet d'attaque, jet d'initiative) — au lieu des valeurs brutes non ajustées utilisées partout aujourd'hui.

**Architecture:** Le catalogue d'armures (`bol_armure`) gagne des champs structurés (`categorie`, malus numériques) remplaçant la déduction par texte libre ; le pivot héros↔armure (`bol_heros_armure`) gagne un flag `equipee` (au plus un équipé par catégorie, imposé côté backend). `BolHeros` calcule les attributs effectifs via un service de calcul pur (`BolEquipmentEffectService`), exposés par l'API (`agilite_effective`, `initiative_effective`, `defense_effective`, `equipement_effectif`). Le frontend consomme ces valeurs déjà calculées — aucun écran ne recalcule le malus.

**Tech Stack:** Laravel 12 (backend/), Angular 21 standalone + signals + Angular Material (front/), PHPUnit (backend), Vitest (frontend).

**Spec:** `docs/superpowers/specs/2026-08-31-malus-equipement-agilite-design.md`

## Global Constraints

- Backend : logique métier dans `app/Http/Services/Bol/`, jamais dans les contrôleurs. Modèles Eloquent dans `app/Models/Bol/`.
- Frontend : composants standalone (pas de `standalone: true` explicite), `ChangeDetectionStrategy.OnPush` partout, `input()`/`output()`, `inject()`, contrôle de flux natif (`@if`/`@for`), pas de `ngClass`/`ngStyle`, Angular Material uniquement.
- `npm run build` valide tout changement frontend ; `php artisan test` (ou le test le plus proche) valide tout changement backend.
- **Pas d'infrastructure de tests Feature/DB (`RefreshDatabase`) dans ce repo** (`phpunit.xml` a `DB_CONNECTION`/`DB_DATABASE` commentés, aucun test Feature réel n'existe). En introduire une est hors périmètre de cette fonctionnalité. Les tests backend de ce plan restent donc des tests Unit **sans DB**, sur des fonctions pures ; le comportement qui touche la base (migrations, persistance du flag `equipee`) est vérifié manuellement (Tâche 15, skill `run`), pas par un nouveau test automatisé.
- Valeurs de règles fixes (`doc/resources/armures.md`, déjà vérifiées) : Armure légère = 0 malus. Armure moyenne = -1 Agilité. Armure lourde = -2 Agilité. Casque = -1 Initiative. Petit bouclier = -1 à *une* attaque subie/round (pas de malus Agilité). Grand bouclier = -1 Agilité + -1 à *toutes* les attaques subies/round.
- Catalogue actuel (`backend/database/seeders/BolArmureSeeder.php`) : id 2 = Armure légère, 3 = Armure moyenne, 4 = Armure lourde, 5 = Casque, 6 = Petit bouclier, 7 = Grand bouclier. Le baudrier de guerre n'est **pas** dans ce catalogue (traité comme avantage) — aucune action requise à son sujet.

---

## Task 1: Backend — schéma du catalogue armure + flag "équipé"

**Files:**
- Create: `backend/database/migrations/2026_08_31_120000_add_categorie_and_malus_to_bol_armure.php`
- Create: `backend/database/migrations/2026_08_31_120001_add_equipee_to_bol_heros_armure.php`
- Modify: `backend/app/Models/Bol/BolArmure.php`
- Modify: `backend/app/Models/Bol/BolHerosArmure.php`
- Modify: `backend/app/Http/Controllers/Bol/BolArmureController.php`

**Interfaces:**
- Produces: colonnes `bol_armure.categorie` (`'armure'|'bouclier'|'casque'`), `malus_agilite`/`malus_initiative`/`malus_attaque_subie` (int), `malus_attaque_subie_portee` (`'une'|'toutes'|null`) ; colonne `bol_heros_armure.equipee` (bool). `BolArmureController::createCatalog`/`updateCatalog` acceptent et valident ces champs.

- [ ] **Step 1: Migration catalogue — colonnes + backfill des 6 entrées de référence**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_armure', function (Blueprint $table) {
            $table->enum('categorie', ['armure', 'bouclier', 'casque'])->nullable()->after('malus');
            $table->unsignedInteger('malus_agilite')->default(0)->after('categorie');
            $table->unsignedInteger('malus_initiative')->default(0)->after('malus_agilite');
            $table->unsignedInteger('malus_attaque_subie')->default(0)->after('malus_initiative');
            $table->enum('malus_attaque_subie_portee', ['une', 'toutes'])->nullable()->after('malus_attaque_subie');
        });

        $donnees = [
            2 => ['categorie' => 'armure', 'malus_agilite' => 0, 'malus_initiative' => 0, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            3 => ['categorie' => 'armure', 'malus_agilite' => 1, 'malus_initiative' => 0, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            4 => ['categorie' => 'armure', 'malus_agilite' => 2, 'malus_initiative' => 0, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            5 => ['categorie' => 'casque', 'malus_agilite' => 0, 'malus_initiative' => 1, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            6 => ['categorie' => 'bouclier', 'malus_agilite' => 0, 'malus_initiative' => 0, 'malus_attaque_subie' => 1, 'malus_attaque_subie_portee' => 'une'],
            7 => ['categorie' => 'bouclier', 'malus_agilite' => 1, 'malus_initiative' => 0, 'malus_attaque_subie' => 1, 'malus_attaque_subie_portee' => 'toutes'],
        ];

        foreach ($donnees as $id => $valeurs) {
            DB::table('bol_armure')->where('id', $id)->update($valeurs);
        }
    }

    public function down(): void
    {
        Schema::table('bol_armure', function (Blueprint $table) {
            $table->dropColumn([
                'categorie',
                'malus_agilite',
                'malus_initiative',
                'malus_attaque_subie',
                'malus_attaque_subie_portee',
            ]);
        });
    }
};
```

- [ ] **Step 2: Migration pivot — colonne `equipee` + backfill "premier élément par catégorie"**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_heros_armure', function (Blueprint $table) {
            $table->boolean('equipee')->default(false)->after('armure_id');
        });

        // Préserve le comportement actuel ("premier élément de la liste compte") comme état de
        // départ : marque équipé le pivot le plus ancien par héros et par catégorie d'armure.
        DB::statement(<<<'SQL'
            UPDATE bol_heros_armure bha
            JOIN bol_armure a ON a.id = bha.armure_id
            JOIN (
                SELECT MIN(bha2.id) AS min_id
                FROM bol_heros_armure bha2
                JOIN bol_armure a2 ON a2.id = bha2.armure_id
                WHERE a2.categorie IS NOT NULL
                GROUP BY bha2.heros_id, a2.categorie
            ) first_per_category ON first_per_category.min_id = bha.id
            SET bha.equipee = true
        SQL);
    }

    public function down(): void
    {
        Schema::table('bol_heros_armure', function (Blueprint $table) {
            $table->dropColumn('equipee');
        });
    }
};
```

- [ ] **Step 3: Exécuter les migrations et vérifier manuellement**

Run: `cd backend && php artisan migrate`
Expected: les deux migrations passent sans erreur.

Run: `php artisan tinker --execute="dd(\App\Models\Bol\BolArmure::find(7)->toArray());"`
Expected: `categorie => 'bouclier'`, `malus_agilite => 1`, `malus_attaque_subie => 1`, `malus_attaque_subie_portee => 'toutes'`.

- [ ] **Step 4: Modèle `BolArmure` — fillable + casts**

Modifier `backend/app/Models/Bol/BolArmure.php` :

```php
<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolArmure extends Model
{
    use HasFactory;

    protected $table = 'bol_armure';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        'user_id',
        'armure',
        'protection',
        'malus',
        'pts_de_pouvoir',
        'categorie',
        'malus_agilite',
        'malus_initiative',
        'malus_attaque_subie',
        'malus_attaque_subie_portee',
    ];
    protected $casts = [
        'id' => 'integer',
        'malus_agilite' => 'integer',
        'malus_initiative' => 'integer',
        'malus_attaque_subie' => 'integer',
    ];
}
```

- [ ] **Step 5: Modèle `BolHerosArmure` — fillable + casts**

Modifier `backend/app/Models/Bol/BolHerosArmure.php` :

```php
<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHerosArmure extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_armure';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        "heros_id",
        "armure_id",
        "equipee",
    ];
    protected $casts = [
        'id' => 'integer',
        'armure_id' => 'integer',
        'equipee' => 'boolean',
    ];

    public function armure(): HasOne
    {
        return $this->HasOne(BolArmure::class, 'id', 'armure_id');
    }
}
```

- [ ] **Step 6: `BolArmureController` — accepter les nouveaux champs sur le catalogue personnel**

Dans `backend/app/Http/Controllers/Bol/BolArmureController.php`, remplacer les trois usages de `$this->validatedPayload(...)` (dans `createCatalog`, ligne du bloc `$armure = new BolArmure(); ...`, et `updateCatalog`) et la méthode `validatedPayload` elle-même :

```php
    public function createCatalog(Request $request)
    {
        $payload = $this->validatedPayload($request);

        $armure = new BolArmure();
        $armure->user_id = Auth::id();
        $armure->armure = $payload['armure'];
        $armure->protection = $payload['protection'];
        $armure->malus = $payload['malus'];
        $armure->pts_de_pouvoir = $payload['pts_de_pouvoir'];
        $armure->categorie = $payload['categorie'];
        $armure->malus_agilite = $payload['malus_agilite'];
        $armure->malus_initiative = $payload['malus_initiative'];
        $armure->malus_attaque_subie = $payload['malus_attaque_subie'];
        $armure->malus_attaque_subie_portee = $payload['malus_attaque_subie_portee'];
        $armure->save();

        $this->flushCache();

        return response()->json($armure, 201);
    }
```

```php
    public function updateCatalog(Request $request)
    {
        $request->validate([
            'id' => ['required', 'integer'],
        ]);

        $id = (int) $request->input('id');
        $armure = BolArmure::query()->where('user_id', Auth::id())->find($id);

        if (!$armure) {
            return response()->json(['message' => 'Armure personnelle introuvable.'], 404);
        }

        $payload = $this->validatedPayload($request, $armure->id);

        $armure->armure = $payload['armure'];
        $armure->protection = $payload['protection'];
        $armure->malus = $payload['malus'];
        $armure->pts_de_pouvoir = $payload['pts_de_pouvoir'];
        $armure->categorie = $payload['categorie'];
        $armure->malus_agilite = $payload['malus_agilite'];
        $armure->malus_initiative = $payload['malus_initiative'];
        $armure->malus_attaque_subie = $payload['malus_attaque_subie'];
        $armure->malus_attaque_subie_portee = $payload['malus_attaque_subie_portee'];
        $armure->save();

        $this->flushCache();

        return response()->json($armure);
    }
```

```php
    private function validatedPayload(Request $request, ?int $ignoreId = null): array
    {
        $request->merge([
            'armure' => is_string($request->input('armure')) ? trim($request->input('armure')) : $request->input('armure'),
            'protection' => is_string($request->input('protection')) ? trim($request->input('protection')) : $request->input('protection'),
            'malus' => is_string($request->input('malus')) ? trim($request->input('malus')) : $request->input('malus'),
            'pts_de_pouvoir' => is_string($request->input('pts_de_pouvoir'))
                ? trim($request->input('pts_de_pouvoir'))
                : $request->input('pts_de_pouvoir'),
        ]);

        $validated = $request->validate([
            'armure' => ['required', 'string', 'max:255', Rule::unique('bol_armure', 'armure')->ignore($ignoreId)],
            'protection' => ['required', 'string', 'max:255'],
            'malus' => ['nullable', 'string', 'max:255'],
            'pts_de_pouvoir' => ['nullable', 'string', 'max:50'],
            'categorie' => ['required', Rule::in(['armure', 'bouclier', 'casque'])],
            'malus_agilite' => ['nullable', 'integer', 'min:0'],
            'malus_initiative' => ['nullable', 'integer', 'min:0'],
            'malus_attaque_subie' => ['nullable', 'integer', 'min:0'],
            'malus_attaque_subie_portee' => ['nullable', Rule::in(['une', 'toutes'])],
        ]);

        $validated['malus'] = isset($validated['malus']) && $validated['malus'] !== '' ? $validated['malus'] : null;
        $validated['pts_de_pouvoir'] = isset($validated['pts_de_pouvoir']) && $validated['pts_de_pouvoir'] !== ''
            ? $validated['pts_de_pouvoir']
            : null;
        $validated['malus_agilite'] = (int) ($validated['malus_agilite'] ?? 0);
        $validated['malus_initiative'] = (int) ($validated['malus_initiative'] ?? 0);
        $validated['malus_attaque_subie'] = (int) ($validated['malus_attaque_subie'] ?? 0);
        $validated['malus_attaque_subie_portee'] = $validated['malus_attaque_subie_portee'] ?? null;

        return $validated;
    }
```

- [ ] **Step 7: Vérifier que le backend ne casse rien**

Run: `cd backend && php artisan test`
Expected: tous les tests existants passent (aucun test ne couvrait encore le catalogue armure).

- [ ] **Step 8: Commit**

```bash
git add backend/database/migrations/2026_08_31_120000_add_categorie_and_malus_to_bol_armure.php \
        backend/database/migrations/2026_08_31_120001_add_equipee_to_bol_heros_armure.php \
        backend/app/Models/Bol/BolArmure.php \
        backend/app/Models/Bol/BolHerosArmure.php \
        backend/app/Http/Controllers/Bol/BolArmureController.php
git commit -m "feat(backend): structured categorie/malus fields on armure catalog + equipee flag on hero pivot"
```

---

## Task 2: Backend — `BolEquipmentEffectService` (calcul pur, testé sans DB)

**Files:**
- Create: `backend/app/Http/Services/Bol/BolEquipmentEffectService.php`
- Test: `backend/tests/Unit/BolEquipmentEffectServiceTest.php`

**Interfaces:**
- Consumes: rien (fonctions pures sur tableaux PHP simples).
- Produces: `BolEquipmentEffectService::agiliteEffective(int, array): int`, `::initiativeEffective(int, array): int`, `::defenseEffective(int, array): int`, `::equipementEffectif(array): array{bouclier_malus_attaque_subie: int, bouclier_malus_attaque_subie_portee: ?string}`, `::normalizeEquippedFlags(array): array`, `::normalizeArmureEquipmentForHeros(string): void` (seule méthode touchant la DB, utilisée par la Tâche 4). Chaque élément de `$equippedArmures` : `array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}`.

- [ ] **Step 1: Écrire les tests (échouent, la classe n'existe pas encore)**

Créer `backend/tests/Unit/BolEquipmentEffectServiceTest.php` :

```php
<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolEquipmentEffectService;
use PHPUnit\Framework\TestCase;

class BolEquipmentEffectServiceTest extends TestCase
{
    private function armure(string $categorie, int $malusAgilite = 0, int $malusInitiative = 0, int $malusAttaqueSubie = 0, ?string $portee = null): array
    {
        return [
            'categorie' => $categorie,
            'malus_agilite' => $malusAgilite,
            'malus_initiative' => $malusInitiative,
            'malus_attaque_subie' => $malusAttaqueSubie,
            'malus_attaque_subie_portee' => $portee,
        ];
    }

    public function test_agilite_effective_without_equipment_returns_raw_value(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(8, $service->agiliteEffective(8, []));
    }

    public function test_agilite_effective_applies_armure_moyenne_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(7, $service->agiliteEffective(8, [$this->armure('armure', malusAgilite: 1)]));
    }

    public function test_agilite_effective_combines_armure_and_grand_bouclier_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [
            $this->armure('armure', malusAgilite: 2),
            $this->armure('bouclier', malusAgilite: 1, malusAttaqueSubie: 1, portee: 'toutes'),
        ];
        $this->assertSame(5, $service->agiliteEffective(8, $equipped));
    }

    public function test_initiative_effective_applies_casque_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(3, $service->initiativeEffective(4, [$this->armure('casque', malusInitiative: 1)]));
    }

    public function test_defense_effective_applies_grand_bouclier_bonus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [$this->armure('bouclier', malusAgilite: 1, malusAttaqueSubie: 1, portee: 'toutes')];
        $this->assertSame(9, $service->defenseEffective(8, $equipped));
    }

    public function test_defense_effective_ignores_petit_bouclier_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [$this->armure('bouclier', malusAttaqueSubie: 1, portee: 'une')];
        $this->assertSame(8, $service->defenseEffective(8, $equipped));
    }

    public function test_equipement_effectif_exposes_petit_bouclier_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [$this->armure('bouclier', malusAttaqueSubie: 1, portee: 'une')];
        $this->assertSame(
            ['bouclier_malus_attaque_subie' => 1, 'bouclier_malus_attaque_subie_portee' => 'une'],
            $service->equipementEffectif($equipped),
        );
    }

    public function test_equipement_effectif_returns_zero_without_petit_bouclier(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(
            ['bouclier_malus_attaque_subie' => 0, 'bouclier_malus_attaque_subie_portee' => null],
            $service->equipementEffectif([]),
        );
    }

    public function test_normalize_equipped_flags_keeps_highest_id_per_categorie(): void
    {
        $service = new BolEquipmentEffectService();
        $rows = [
            ['id' => 10, 'categorie' => 'armure', 'equipee' => true],
            ['id' => 12, 'categorie' => 'armure', 'equipee' => true],
        ];
        $this->assertSame([['id' => 10, 'equipee' => false]], $service->normalizeEquippedFlags($rows));
    }

    public function test_normalize_equipped_flags_returns_empty_when_no_conflict(): void
    {
        $service = new BolEquipmentEffectService();
        $rows = [
            ['id' => 10, 'categorie' => 'armure', 'equipee' => true],
            ['id' => 11, 'categorie' => 'bouclier', 'equipee' => true],
        ];
        $this->assertSame([], $service->normalizeEquippedFlags($rows));
    }
}
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `cd backend && php artisan test --filter=BolEquipmentEffectServiceTest`
Expected: FAIL — `Class "App\Http\Services\Bol\BolEquipmentEffectService" not found`.

- [ ] **Step 3: Implémenter le service**

Créer `backend/app/Http/Services/Bol/BolEquipmentEffectService.php` :

```php
<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolHerosArmure;

/**
 * Calcule les attributs "effectifs" d'un héros (Agilité/Initiative/Défense) en tenant compte du
 * malus d'équipement porté (armure/bouclier/casque). Les méthodes de calcul sont pures (pas
 * d'accès DB) et testables sans base de données — voir tests/Unit/BolEquipmentEffectServiceTest.php.
 * Seule `normalizeArmureEquipmentForHeros()` touche la DB (appelée par BolHerosController et
 * BolPnjController après synchronisation des armures d'un héros/PNJ).
 */
class BolEquipmentEffectService
{
    /**
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     */
    public function agiliteEffective(int $agiliteBrute, array $equippedArmures): int
    {
        $malus = array_sum(array_map(fn ($a) => $a['malus_agilite'], $equippedArmures));
        return $agiliteBrute - $malus;
    }

    /**
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     */
    public function initiativeEffective(int $initiativeBrute, array $equippedArmures): int
    {
        $malus = array_sum(array_map(fn ($a) => $a['malus_initiative'], $equippedArmures));
        return $initiativeBrute - $malus;
    }

    /**
     * Le malus "-1 à toutes les attaques subies" du grand bouclier équivaut, pour l'attaquant, à
     * un jet réduit de la même valeur — replié directement dans le seuil de défense pour rester
     * automatique côté jet d'attaque (spec, section Backend).
     *
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     */
    public function defenseEffective(int $defenseBrute, array $equippedArmures): int
    {
        $bonus = array_sum(array_map(
            fn ($a) => $a['malus_attaque_subie_portee'] === 'toutes' ? $a['malus_attaque_subie'] : 0,
            $equippedArmures,
        ));
        return $defenseBrute + $bonus;
    }

    /**
     * Malus du petit bouclier ("-1 à une attaque subie par round") : ne peut pas être replié
     * automatiquement (l'app ne suit pas de round), exposé tel quel pour que le dialog d'attaque
     * propose une case à cocher manuelle.
     *
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     * @return array{bouclier_malus_attaque_subie: int, bouclier_malus_attaque_subie_portee: ?string}
     */
    public function equipementEffectif(array $equippedArmures): array
    {
        foreach ($equippedArmures as $armure) {
            if ($armure['malus_attaque_subie_portee'] === 'une') {
                return [
                    'bouclier_malus_attaque_subie' => $armure['malus_attaque_subie'],
                    'bouclier_malus_attaque_subie_portee' => 'une',
                ];
            }
        }

        return ['bouclier_malus_attaque_subie' => 0, 'bouclier_malus_attaque_subie_portee' => null];
    }

    /**
     * Garantit au plus un élément équipé par catégorie : en cas de conflit (plusieurs `equipee=true`
     * dans la même catégorie), ne garde que celui avec le plus grand id (le plus récemment
     * synchronisé). Fonction pure, appelée après la persistance du payload entrant.
     *
     * @param array<int, array{id: int, categorie: string, equipee: bool}> $rows
     * @return array<int, array{id: int, equipee: bool}> uniquement les lignes dont l'état change
     */
    public function normalizeEquippedFlags(array $rows): array
    {
        $byCategorie = [];
        foreach ($rows as $row) {
            $byCategorie[$row['categorie']][] = $row;
        }

        $changes = [];
        foreach ($byCategorie as $group) {
            $equipped = array_values(array_filter($group, fn ($row) => $row['equipee']));
            if (count($equipped) <= 1) {
                continue;
            }

            $keepId = max(array_column($equipped, 'id'));
            foreach ($equipped as $row) {
                if ($row['id'] !== $keepId) {
                    $changes[] = ['id' => $row['id'], 'equipee' => false];
                }
            }
        }

        return $changes;
    }

    /** Recharge les pivots armure d'un héros/PNJ et applique normalizeEquippedFlags(). */
    public function normalizeArmureEquipmentForHeros(string $herosId): void
    {
        $rows = BolHerosArmure::with('armure')
            ->where('heros_id', $herosId)
            ->get()
            ->filter(fn (BolHerosArmure $item) => $item->armure !== null)
            ->map(fn (BolHerosArmure $item) => [
                'id' => $item->id,
                'categorie' => $item->armure->categorie,
                'equipee' => (bool) $item->equipee,
            ])
            ->values()
            ->all();

        $changes = $this->normalizeEquippedFlags($rows);

        foreach ($changes as $change) {
            BolHerosArmure::where('id', $change['id'])->update(['equipee' => $change['equipee']]);
        }
    }
}
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `cd backend && php artisan test --filter=BolEquipmentEffectServiceTest`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http/Services/Bol/BolEquipmentEffectService.php backend/tests/Unit/BolEquipmentEffectServiceTest.php
git commit -m "feat(backend): pure equipment-effect calculator for agilite/initiative/defense malus"
```

---

## Task 3: Backend — attributs effectifs sur `BolHeros`

**Files:**
- Modify: `backend/app/Models/Bol/BolHeros.php`

**Interfaces:**
- Consumes: `BolEquipmentEffectService` (Tâche 2).
- Produces: `BolHeros->agilite_effective`, `->initiative_effective`, `->defense_effective`, `->equipement_effectif` (accesseurs, ajoutés à `$appends` donc présents dans toute réponse JSON du modèle — fiche héros, statblock, session de combat qui lit `heros.heros` en direct).

- [ ] **Step 1: Ajouter les imports et les accesseurs**

Dans `backend/app/Models/Bol/BolHeros.php`, ajouter l'import et étendre `$appends` :

```php
use App\Http\Services\Bol\BolEquipmentEffectService;
```

```php
    protected $appends = ['combat', 'attributs', 'origines', 'ressources', 'type_order', 'agilite_effective', 'initiative_effective', 'defense_effective', 'equipement_effectif'];
```

Puis ajouter ces méthodes juste après `getAttributsAttribute()` :

```php
    public function getAgiliteEffectiveAttribute()
    {
        return (new BolEquipmentEffectService())->agiliteEffective($this->agilite, $this->equippedArmuresData());
    }

    public function getInitiativeEffectiveAttribute()
    {
        return (new BolEquipmentEffectService())->initiativeEffective($this->initiative, $this->equippedArmuresData());
    }

    public function getDefenseEffectiveAttribute()
    {
        return (new BolEquipmentEffectService())->defenseEffective($this->defense, $this->equippedArmuresData());
    }

    public function getEquipementEffectifAttribute()
    {
        return (new BolEquipmentEffectService())->equipementEffectif($this->equippedArmuresData());
    }

    private function equippedArmuresData(): array
    {
        return $this->armures
            ->filter(fn (BolHerosArmure $item) => $item->equipee && $item->armure !== null)
            ->map(fn (BolHerosArmure $item) => [
                'categorie' => $item->armure->categorie,
                'malus_agilite' => $item->armure->malus_agilite,
                'malus_initiative' => $item->armure->malus_initiative,
                'malus_attaque_subie' => $item->armure->malus_attaque_subie,
                'malus_attaque_subie_portee' => $item->armure->malus_attaque_subie_portee,
            ])
            ->values()
            ->all();
    }
```

`$this->armures` utilise la relation déjà eager-loadée par `BolHerosService::heroRelations()` (`'armures.armure'`, confirmé présent) et `BolPnjController::getAll/getOne` (mêmes relations) — pas de N+1 supplémentaire.

- [ ] **Step 2: Vérification manuelle (pas de test DB dans ce repo — voir Global Constraints)**

Run: `cd backend && php artisan tinker`, puis dans le REPL :

```php
$h = \App\Models\Bol\BolHeros::with('armures.armure')->where('type', 'H')->first();
$h->armures()->update(['equipee' => false]); // état de départ propre pour le test manuel
$armureId = \App\Models\Bol\BolArmure::where('categorie', 'bouclier')->where('malus_attaque_subie_portee', 'toutes')->value('id');
\App\Models\Bol\BolHerosArmure::updateOrCreate(['heros_id' => $h->id, 'armure_id' => $armureId], ['equipee' => true]);
$h = $h->fresh(['armures.armure']);
dd([$h->attributs['agilite'], $h->agilite_effective, $h->combat['defense'], $h->defense_effective]);
```

Expected: `agilite_effective` = `agilite` − 1, `defense_effective` = `defense` + 1 (si un héros de test avec un grand bouclier existe ; sinon adapter avec un héros réel de la base de dev).

- [ ] **Step 3: `php artisan test` complet — non-régression**

Run: `cd backend && php artisan test`
Expected: tous les tests passent (aucun test existant n'inspecte `BolHeros::toArray()` précisément, donc l'ajout de champs `$appends` ne casse rien).

- [ ] **Step 4: Commit**

```bash
git add backend/app/Models/Bol/BolHeros.php
git commit -m "feat(backend): expose agilite/initiative/defense_effective and equipement_effectif on BolHeros"
```

---

## Task 4: Backend — persister `equipee` dans les flux héros et PNJ

**Files:**
- Modify: `backend/app/Http/Controllers/Bol/BolHerosController.php`
- Modify: `backend/app/Http/Controllers/Bol/BolPnjController.php`

**Interfaces:**
- Consumes: `BolEquipmentEffectService::normalizeArmureEquipmentForHeros(string $herosId)` (Tâche 2).
- Produces: le payload `armures[]` accepte désormais un champ `equipee` (bool) par entrée, persisté et normalisé (un seul équipé par catégorie).

**Contexte important** : `BolPnjController::create()`/`update()` a sa **propre** logique de synchronisation des armures, dupliquée et distincte de `BolHerosController::syncHeroRelations()` (ce n'est pas un appel à la même méthode). Les deux doivent être mis à jour séparément.

- [ ] **Step 1: `BolHerosController::syncHeroRelations()` — bloc armures**

Dans `backend/app/Http/Controllers/Bol/BolHerosController.php`, remplacer le bloc armures (lignes 232-251) :

```php
        $armures = $request->input('armures', []);
        $armures = is_array($armures) ? $armures : [];
        $armureIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'armure_id'),
            $armures
        ));
        if (!$creating) {
            if (count($armureIds) === 0) {
                BolHerosArmure::where('heros_id', $herosId)->delete();
            } else {
                BolHerosArmure::where('heros_id', $herosId)->whereNotIn('armure_id', $armureIds)->delete();
            }
        }
        foreach ($armures as $armure) {
            $armureId = $extractRelationId($armure, 'armure_id');
            if ($armureId === 0) {
                continue;
            }
            $equipee = is_array($armure) ? (bool) ($armure['equipee'] ?? false) : false;
            BolHerosArmure::updateOrCreate(
                ['heros_id' => $herosId, 'armure_id' => $armureId],
                ['equipee' => $equipee]
            );
        }
        (new BolEquipmentEffectService())->normalizeArmureEquipmentForHeros($herosId);
```

Ajouter l'import en tête de fichier :

```php
use App\Http\Services\Bol\BolEquipmentEffectService;
```

- [ ] **Step 2: `BolPnjController::create()` — bloc armures**

Dans `backend/app/Http/Controllers/Bol/BolPnjController.php`, remplacer :

```php
        $armures = $request->input('armures');
        foreach ($armures as $armure) {
            $newarmure['heros_id'] = $pnj['id'];
            $newarmure['armure_id'] = $armure['id'];
            BolHerosArmure::create($newarmure);
        }
```

par :

```php
        $armures = $request->input('armures');
        foreach ($armures as $armure) {
            BolHerosArmure::create([
                'heros_id' => $pnj['id'],
                'armure_id' => $armure['id'],
                'equipee' => (bool) ($armure['equipee'] ?? false),
            ]);
        }
        (new BolEquipmentEffectService())->normalizeArmureEquipmentForHeros($pnj['id']);
```

- [ ] **Step 3: `BolPnjController::update()` — bloc armures**

Remplacer :

```php
        $armures = $request->input('armures');
        $ids_armures = array_column($armures, 'id');
        BolHerosArmure::whereNotIn('armure_id', $ids_armures)->where('heros_id', $pnjId)->delete();
        foreach ($armures as $item) {
            BolHerosArmure::updateOrCreate(['heros_id' => $pnjId, 'armure_id' => $item['id']], []);
        }
```

par :

```php
        $armures = $request->input('armures');
        $ids_armures = array_column($armures, 'id');
        BolHerosArmure::whereNotIn('armure_id', $ids_armures)->where('heros_id', $pnjId)->delete();
        foreach ($armures as $item) {
            BolHerosArmure::updateOrCreate(
                ['heros_id' => $pnjId, 'armure_id' => $item['id']],
                ['equipee' => (bool) ($item['equipee'] ?? false)]
            );
        }
        (new BolEquipmentEffectService())->normalizeArmureEquipmentForHeros($pnjId);
```

Ajouter l'import en tête de fichier :

```php
use App\Http\Services\Bol\BolEquipmentEffectService;
```

- [ ] **Step 4: Vérification manuelle — exclusivité par catégorie**

Run: `cd backend && php artisan tinker`, puis :

```php
$h = \App\Models\Bol\BolHeros::where('type', 'H')->first();
$armureLegere = \App\Models\Bol\BolArmure::where('categorie', 'armure')->where('malus_agilite', 0)->value('id');
$armureLourde = \App\Models\Bol\BolArmure::where('categorie', 'armure')->where('malus_agilite', 2)->value('id');
\App\Models\Bol\BolHerosArmure::updateOrCreate(['heros_id' => $h->id, 'armure_id' => $armureLegere], ['equipee' => true]);
\App\Models\Bol\BolHerosArmure::updateOrCreate(['heros_id' => $h->id, 'armure_id' => $armureLourde], ['equipee' => true]);
(new \App\Http\Services\Bol\BolEquipmentEffectService())->normalizeArmureEquipmentForHeros($h->id);
dd(\App\Models\Bol\BolHerosArmure::where('heros_id', $h->id)->get(['armure_id', 'equipee'])->toArray());
```

Expected: un seul des deux pivots a `equipee = true` (celui avec l'id de pivot le plus élevé).

- [ ] **Step 5: `php artisan test` complet — non-régression**

Run: `cd backend && php artisan test`
Expected: tous les tests passent.

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/Bol/BolHerosController.php backend/app/Http/Controllers/Bol/BolPnjController.php
git commit -m "feat(backend): persist and normalize the equipee flag in hero and PNJ sync flows"
```

---

## Task 5: Frontend — modèles TypeScript

**Files:**
- Modify: `front/src/app/bol/models/bol-armure.model.ts`
- Modify: `front/src/app/bol/models/bol-heros.model.ts`

**Interfaces:**
- Produces: `BolArmureCategorie`, `BolArmureModel` étendu, `BolHerosArmureModel` étendu (`equipee`), `BolEquipementEffectifModel`, `BolHerosModel`/`BolHerosCombat`/`BolHerosAttributs` étendus (`*_effective`, `equipement_effectif`).

- [ ] **Step 1: `bol-armure.model.ts`**

Remplacer le contenu de `front/src/app/bol/models/bol-armure.model.ts` par :

```ts
export type BolArmureCategorie = 'armure' | 'bouclier' | 'casque';

export interface BolArmureModel {
  id: number | null;
  user_id?: string | null;
  armure: string;
  protection: string | null;
  malus: string | null;
  pts_de_pouvoir: string | null;
  categorie: BolArmureCategorie;
  malus_agilite: number;
  malus_initiative: number;
  malus_attaque_subie: number;
  malus_attaque_subie_portee: 'une' | 'toutes' | null;
}

export interface BolHerosArmureModel {
  id?: number;
  armure_id: number;
  equipee: boolean;
  armure?: BolArmureModel;
}
```

- [ ] **Step 2: `bol-heros.model.ts`**

Remplacer le contenu de `front/src/app/bol/models/bol-heros.model.ts` par :

```ts
import {BolHerosCarriereModel} from "./bol-carriere.model";
import {BolHerosArmureModel} from "./bol-armure.model";
import {BolHerosArmeModel} from "./bol-arme.model";
import {BolHerosTraitsModel} from "./bol-trait.model";
import {BolHerosLangueModel} from "./bol-langue.model";
import {BolRegionModel} from "./bol-region.model";

export interface BolHerosModel {
  id: string | null;
  user_id: string | null;
  active: boolean;
  type: string;
  type_order?: number;
  combat: BolHerosCombat;
  attributs: BolHerosAttributs;
  origines: BolHerosOrigines;
  ressources: BolHerosRessources;
  equipement_effectif: BolEquipementEffectifModel;
  traits: BolHerosTraitsModel[];
  carrieres: BolHerosCarriereModel[];
  langues?: BolHerosLangueModel[] | number[];
  armures: BolHerosArmureModel[] | number[];
  armes: BolHerosArmeModel[] | number[];
}

export interface BolHerosCombat {
  initiative: number;
  initiative_effective: number;
  melee: number;
  tir: number;
  defense: number;
  defense_effective: number;
}

export interface BolHerosAttributs {
  vigueur: number;
  agilite: number;
  agilite_effective: number;
  esprit: number;
  aura: number;
}

/** Malus défensif du petit bouclier ("-1 à une attaque subie par round") — le grand bouclier est
 * déjà replié dans `combat.defense_effective`, il n'apparaît pas ici. */
export interface BolEquipementEffectifModel {
  bouclier_malus_attaque_subie: number;
  bouclier_malus_attaque_subie_portee: 'une' | 'toutes' | null;
}

export interface BolHerosOrigines {
  nom: string | null;
  joueur: string | null;
  commentaire?: string | null;
  region_id: number | null;
  region?: BolRegionModel | null;
  avatar: string | null;
  langues: BolHerosLangueModel[] | number[];
}

export interface BolHerosRessources {
  vitalite: number;
  heroisme: number;
  foi: number;
  pouvoir: number;
  vilenie: number;
  creation: number;
  experience: number;
}
```

- [ ] **Step 2: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.app.json`
Expected: des erreurs apparaissent dans les fichiers qui utilisent `BolArmureModel`/`BolHerosArmureModel`/`BolHerosModel` sans les nouveaux champs (attendu — corrigé dans les tâches suivantes). Noter la liste des fichiers en erreur pour vérifier qu'ils sont bien couverts par les tâches 6 à 14.

- [ ] **Step 3: Commit**

```bash
git add front/src/app/bol/models/bol-armure.model.ts front/src/app/bol/models/bol-heros.model.ts
git commit -m "feat(frontend): extend armure and heros models with categorie/malus/equipee/effective fields"
```

---

## Task 6: Frontend — `ArmureDraft` + exclusivité par catégorie (fonction pure)

**Files:**
- Modify: `front/src/app/bol/shared/form/form-selection.ts`
- Test: `front/src/app/bol/shared/form/form-selection.spec.ts`

**Interfaces:**
- Produces: `ArmureDraft` (type), `applyArmureEquipToggle<T extends {id: number; equipee: boolean}>(armures: readonly T[], index: number, categorieOf: (id: number) => string | null): T[]` — utilisé par les Tâches 9 et 10.

- [ ] **Step 1: Écrire le test (échoue, la fonction n'existe pas)**

Créer `front/src/app/bol/shared/form/form-selection.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {applyArmureEquipToggle} from './form-selection';

describe('applyArmureEquipToggle', () => {
  const categorieOf = (id: number): string | null => ({1: 'armure', 2: 'armure', 3: 'bouclier'} as Record<number, string>)[id] ?? null;

  it('equips an item and unequips others of the same categorie', () => {
    const armures = [
      {id: 1, equipee: true},
      {id: 2, equipee: false},
      {id: 3, equipee: true},
    ];

    const result = applyArmureEquipToggle(armures, 1, categorieOf);

    expect(result).toEqual([
      {id: 1, equipee: false},
      {id: 2, equipee: true},
      {id: 3, equipee: true},
    ]);
  });

  it('unequips an item without affecting others', () => {
    const armures = [
      {id: 1, equipee: true},
      {id: 3, equipee: true},
    ];

    const result = applyArmureEquipToggle(armures, 0, categorieOf);

    expect(result).toEqual([
      {id: 1, equipee: false},
      {id: 3, equipee: true},
    ]);
  });

  it('returns a copy unchanged when the index is out of range', () => {
    const armures = [{id: 1, equipee: false}];
    expect(applyArmureEquipToggle(armures, 5, categorieOf)).toEqual(armures);
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `cd front && npm test`
Expected: FAIL — `applyArmureEquipToggle` n'est pas exporté par `form-selection.ts`.

- [ ] **Step 3: Implémenter**

Dans `front/src/app/bol/shared/form/form-selection.ts`, ajouter (après `RankedDraft`) :

```ts
/** Entrée d'armure avec son état "équipé" (armure/bouclier/casque actif vs juste en inventaire). */
export interface ArmureDraft extends IdDraft {
  equipee: boolean;
}

/**
 * Applique l'exclusivité "un seul équipé par catégorie" dans un brouillon local : équiper un
 * élément déséquipe les autres de la même catégorie. Le backend applique la même règle en
 * persistance (BolEquipmentEffectService::normalizeArmureEquipmentForHeros) — cette fonction ne
 * fait qu'éviter un aller-retour serveur pour le retour visuel immédiat.
 */
export function applyArmureEquipToggle<T extends {id: number; equipee: boolean}>(
  armures: readonly T[],
  index: number,
  categorieOf: (id: number) => string | null,
): T[] {
  const target = armures[index];
  if (!target) {
    return [...armures];
  }

  const nextEquipee = !target.equipee;
  const categorie = nextEquipee ? categorieOf(target.id) : null;

  return armures.map((armure, i) => {
    if (i === index) {
      return {...armure, equipee: nextEquipee};
    }
    if (categorie && categorieOf(armure.id) === categorie) {
      return {...armure, equipee: false};
    }
    return armure;
  });
}
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `cd front && npm test`
Expected: PASS — 3 nouveaux tests (plus les 93 existants, en tenant compte du chapitre "Aura"/"Jet d'action" déjà en place).

- [ ] **Step 5: Commit**

```bash
git add front/src/app/bol/shared/form/form-selection.ts front/src/app/bol/shared/form/form-selection.spec.ts
git commit -m "feat(frontend): add ArmureDraft type and pure per-categorie equip-toggle helper"
```

---

## Task 7: Frontend — `armure-list` : catégorie + toggle "équipé"

**Files:**
- Modify: `front/src/app/bol/shared/armure/list/armure-list.component.ts`
- Modify: `front/src/app/bol/shared/armure/list/armure-list.component.html`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: `ArmureEntry` gagne `categorie`, `equipee`, `malusAgilite`, `malusInitiative` ; nouvel `output<number> equippedToggled` (émet l'index, même convention que `removed`). Consommé par les Tâches 9 et 10.

- [ ] **Step 1: Composant**

Remplacer le contenu de `front/src/app/bol/shared/armure/list/armure-list.component.ts` par :

```ts
import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {BolArmureCategorie} from '../../../models/bol-armure.model';

export interface ArmureEntry {
  readonly id: number;
  readonly label: string;
  readonly protection: string | null;
  readonly malus: string | null;
  readonly ptsDePouvoir: string | null;
  readonly categorie: BolArmureCategorie;
  readonly equipee: boolean;
  readonly malusAgilite: number;
  readonly malusInitiative: number;
}

const CATEGORIE_LABELS: Record<BolArmureCategorie, string> = {
  armure: 'Armure',
  bouclier: 'Bouclier',
  casque: 'Casque',
};

@Component({
  selector: 'bol-armure-list',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule, DwCollapsibleRowComponent],
  templateUrl: './armure-list.component.html',
  styleUrl: './armure-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmureListComponent {
  readonly armures = input.required<readonly ArmureEntry[]>();
  readonly removed = output<number>();
  readonly equippedToggled = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly categorieLabel = (categorie: BolArmureCategorie): string => CATEGORIE_LABELS[categorie];

  protected isExpanded(entry: ArmureEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: ArmureEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
```

- [ ] **Step 2: Template**

Remplacer le contenu de `front/src/app/bol/shared/armure/list/armure-list.component.html` par :

```html
<div class="flex flex-col gap-2">
  @for (armure of armures(); track armure.id; let index = $index) {
    <dw-collapsible-row
      [expanded]="isExpanded(armure)"
      [ariaLabel]="'Armure : ' + armure.label"
      [label]="armure.label"
      [stat]="armure.protection"
      (toggled)="toggle(armure)"
    >
      <ng-container row-body>
        <p class="dw-entry-meta">
          <span class="dw-entry-detail-title">Catégorie :</span>
          {{ categorieLabel(armure.categorie) }}
        </p>
        @if (armure.protection) {
          <p class="dw-entry-meta">
            <span class="dw-entry-detail-title">Protection :</span>
            {{ armure.protection }}
          </p>
        }
        @if (armure.malus) {
          <p class="dw-entry-meta">
            <span class="dw-entry-detail-title">Malus :</span>
            {{ armure.malus }}
          </p>
        }
        @if (armure.ptsDePouvoir) {
          <p class="dw-entry-meta">
            <span class="dw-entry-detail-title">Points de pouvoir :</span>
            {{ armure.ptsDePouvoir }}
          </p>
        }

        <mat-slide-toggle [checked]="armure.equipee" (change)="equippedToggled.emit(index)">
          Équipé·e
        </mat-slide-toggle>

        <button mat-button type="button" class="dw-entry-delete-btn" (click)="removed.emit(index)">
          <mat-icon>delete</mat-icon> Supprimer
        </button>
      </ng-container>
    </dw-collapsible-row>
  } @empty {
    <p class="dw-entry-empty">
      Ajoute l'armure ou les protections portées par le héros.
    </p>
  }
</div>
```

- [ ] **Step 3: Build**

Run: `cd front && npm run build`
Expected: échoue encore sur `hero-form-page.ts`/`pnj-form-page.ts` (pas encore mis à jour — Tâches 9/10), mais pas d'erreur sur `armure-list.component.*` lui-même. Vérifier dans la sortie qu'aucune erreur ne cite `armure-list.component`.

- [ ] **Step 4: Commit**

```bash
git add front/src/app/bol/shared/armure/list/armure-list.component.ts front/src/app/bol/shared/armure/list/armure-list.component.html
git commit -m "feat(frontend): show categorie and equip toggle in armure-list"
```

---

## Task 8: Frontend — catalogue armure (intendance) : champs catégorie/malus

**Files:**
- Modify: `front/src/app/bol/armure/library/armure-library-page.ts`
- Modify: `front/src/app/bol/armure/library/armure-library-page.html`

**Interfaces:**
- Consumes: `BolArmureModel` étendu (Tâche 5).
- Produces: le formulaire de création/édition d'une armure personnelle expose `categorie`/`malus_agilite`/`malus_initiative`/`malus_attaque_subie`/`malus_attaque_subie_portee`.

- [ ] **Step 1: Composant — form group, import, computed**

Dans `front/src/app/bol/armure/library/armure-library-page.ts` :

Ajouter l'import :

```ts
import {BolArmureCategorie, BolArmureModel} from '../../models/bol-armure.model';
```

Remplacer `armorForm` :

```ts
  protected readonly armorForm = this.formBuilder.nonNullable.group({
    armure: ['', [Validators.required, Validators.maxLength(255)]],
    protection: ['', [Validators.required, Validators.maxLength(255)]],
    malus: ['', [Validators.maxLength(255)]],
    pts_de_pouvoir: ['', [Validators.maxLength(50)]],
    categorie: this.formBuilder.nonNullable.control<BolArmureCategorie>('armure', [Validators.required]),
    malus_agilite: [0, [Validators.required, Validators.min(0)]],
    malus_initiative: [0, [Validators.required, Validators.min(0)]],
    malus_attaque_subie: [0, [Validators.required, Validators.min(0)]],
    malus_attaque_subie_portee: this.formBuilder.control<'une' | 'toutes' | null>(null),
  });
```

Remplacer `shieldCount` :

```ts
  protected readonly shieldCount = computed(
    () => this.armors.data().filter((armor) => armor.categorie === 'bouclier').length,
  );
```

Ajouter, à côté des autres helpers protégés :

```ts
  protected readonly categorieLabel = (categorie: BolArmureCategorie): string =>
    ({armure: 'Armure', bouclier: 'Bouclier', casque: 'Casque'})[categorie];
```

- [ ] **Step 2: Composant — reset/submit**

Remplacer `startCreate` :

```ts
  protected startCreate(): void {
    this.editingArmorId.set(null);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.armorForm.reset({
      armure: '',
      protection: '',
      malus: '',
      pts_de_pouvoir: '',
      categorie: 'armure',
      malus_agilite: 0,
      malus_initiative: 0,
      malus_attaque_subie: 0,
      malus_attaque_subie_portee: null,
    });
  }
```

Remplacer `startEdit` :

```ts
  protected startEdit(armor: BolArmureModel): void {
    if (!this.canManage(armor)) {
      return;
    }

    this.editingArmorId.set(armor.id);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.armorForm.reset({
      armure: armor.armure,
      protection: armor.protection ?? '',
      malus: armor.malus ?? '',
      pts_de_pouvoir: armor.pts_de_pouvoir ?? '',
      categorie: armor.categorie,
      malus_agilite: armor.malus_agilite,
      malus_initiative: armor.malus_initiative,
      malus_attaque_subie: armor.malus_attaque_subie,
      malus_attaque_subie_portee: armor.malus_attaque_subie_portee,
    });
  }
```

Remplacer `cancelForm` :

```ts
  protected cancelForm(): void {
    this.formVisible.set(false);
    this.editingArmorId.set(null);
    this.errorMessage.set('');
    this.armorForm.reset({
      armure: '',
      protection: '',
      malus: '',
      pts_de_pouvoir: '',
      categorie: 'armure',
      malus_agilite: 0,
      malus_initiative: 0,
      malus_attaque_subie: 0,
      malus_attaque_subie_portee: null,
    });
  }
```

Remplacer le `payload` dans `submitForm` :

```ts
    const payload: BolArmureModel = {
      id: this.editingArmorId(),
      armure: this.armorForm.controls.armure.getRawValue().trim(),
      protection: this.armorForm.controls.protection.getRawValue().trim(),
      malus: this.nullableTrimmed(this.armorForm.controls.malus.getRawValue()),
      pts_de_pouvoir: this.nullableTrimmed(this.armorForm.controls.pts_de_pouvoir.getRawValue()),
      categorie: this.armorForm.controls.categorie.getRawValue(),
      malus_agilite: this.armorForm.controls.malus_agilite.getRawValue(),
      malus_initiative: this.armorForm.controls.malus_initiative.getRawValue(),
      malus_attaque_subie: this.armorForm.controls.malus_attaque_subie.getRawValue(),
      malus_attaque_subie_portee: this.armorForm.controls.malus_attaque_subie_portee.getRawValue(),
    };
```

- [ ] **Step 3: Imports Material additionnels**

Ajouter `MatSelectModule` aux imports du composant (`@angular/material/select`) et à la liste `imports: [...]` du `@Component`.

- [ ] **Step 4: Template**

Dans `front/src/app/bol/armure/library/armure-library-page.html`, dans le `<form [formGroup]="armorForm" class="grid gap-4 md:grid-cols-2">`, ajouter après le champ "Malus" :

```html
              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Catégorie</mat-label>
                <mat-select formControlName="categorie">
                  <mat-option value="armure">Armure</mat-option>
                  <mat-option value="bouclier">Bouclier</mat-option>
                  <mat-option value="casque">Casque</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Malus Agilité</mat-label>
                <input matInput type="number" min="0" formControlName="malus_agilite" />
              </mat-form-field>

              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Malus Initiative</mat-label>
                <input matInput type="number" min="0" formControlName="malus_initiative" />
              </mat-form-field>

              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Malus attaque subie</mat-label>
                <input matInput type="number" min="0" formControlName="malus_attaque_subie" />
              </mat-form-field>

              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Portée du malus (bouclier)</mat-label>
                <mat-select formControlName="malus_attaque_subie_portee">
                  <mat-option [value]="null">Aucune</mat-option>
                  <mat-option value="une">Une attaque par round</mat-option>
                  <mat-option value="toutes">Toutes les attaques du round</mat-option>
                </mat-select>
              </mat-form-field>
```

Dans le `<thead>` du tableau, ajouter une colonne après "Équipement" :

```html
              <th>Catégorie</th>
```

Dans le `<tbody>`, ajouter la cellule correspondante juste après la cellule Équipement :

```html
                <td class="arlp-muted-cell">{{ categorieLabel(armor.categorie) }}</td>
```

- [ ] **Step 5: Build**

Run: `cd front && npm run build`
Expected: pas de nouvelle erreur sur `armure-library-page.*`.

- [ ] **Step 6: Commit**

```bash
git add front/src/app/bol/armure/library/armure-library-page.ts front/src/app/bol/armure/library/armure-library-page.html
git commit -m "feat(frontend): expose categorie and numeric malus fields in the armure catalog admin form"
```

---

## Task 9: Frontend — `hero-form-page` : équiper + aperçu Agilité/Initiative effectives

**Files:**
- Modify: `front/src/app/bol/hero/form/hero-form-page.ts`
- Modify: `front/src/app/bol/hero/form/hero-form-page.html`
- Modify: `front/src/app/bol/hero/form/hero-form-page.scss`

**Interfaces:**
- Consumes: `ArmureDraft`, `applyArmureEquipToggle` (Tâche 6) ; `ArmureEntry.categorie/equipee/malusAgilite/malusInitiative` (Tâche 7) ; `BolHerosArmureModel.equipee` (Tâche 5).

- [ ] **Step 1: Import et type du modèle de brouillon**

Dans `front/src/app/bol/hero/form/hero-form-page.ts`, remplacer l'import de `form-selection` :

```ts
import {ArmureDraft, RankedDraft, applyArmureEquipToggle, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
```

(`IdDraft` reste utilisé pour `armes`/`langues` — l'import complet devient :)

```ts
import {ArmureDraft, IdDraft, RankedDraft, applyArmureEquipToggle, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
```

Ajouter l'import du type pivot armure :

```ts
import {BolHerosArmureModel} from '../../models/bol-armure.model';
```

Dans `HeroFormModel`, remplacer :

```ts
  armures: IdDraft[];
```

par :

```ts
  armures: ArmureDraft[];
```

- [ ] **Step 2: `selectedArmures` — inclure `categorie`/`equipee`/malus numériques**

Remplacer :

```ts
  protected readonly selectedArmures = selectedEntries(
    this.selectedArmuresDraft,
    this.armuresList,
    (armure, entry): ArmureEntry => ({
      id: entry.id,
      label: armure.armure,
      protection: armure.protection,
      malus: armure.malus,
      ptsDePouvoir: armure.pts_de_pouvoir,
    }),
  );
```

par :

```ts
  protected readonly selectedArmures = selectedEntries(
    this.selectedArmuresDraft,
    this.armuresList,
    (armure, entry): ArmureEntry => ({
      id: entry.id,
      label: armure.armure,
      protection: armure.protection,
      malus: armure.malus,
      ptsDePouvoir: armure.pts_de_pouvoir,
      categorie: armure.categorie,
      equipee: entry.equipee,
      malusAgilite: armure.malus_agilite,
      malusInitiative: armure.malus_initiative,
    }),
  );
```

- [ ] **Step 3: `addArmureEntry`/`toggleArmureEquipped` + aperçu effectif**

Remplacer `addArmureEntry` :

```ts
  protected addArmureEntry(id: number): void {
    this.model.update((current) => ({...current, armures: [...current.armures, {id, equipee: false}]}));
  }
```

Ajouter, juste après `removeArmure` :

```ts
  protected toggleArmureEquipped(index: number): void {
    const catalog = this.armuresList() ?? [];
    this.model.update((current) => ({
      ...current,
      armures: applyArmureEquipToggle(current.armures, index, (id) => catalog.find((a) => a.id === id)?.categorie ?? null),
    }));
  }
```

Ajouter, à côté de `selectedArmures` :

```ts
  protected readonly agiliteMalusTotal = computed(() =>
    this.selectedArmures()
      .filter((armure) => armure.equipee)
      .reduce((sum, armure) => sum + armure.malusAgilite, 0),
  );

  protected readonly initiativeMalusTotal = computed(() =>
    this.selectedArmures()
      .filter((armure) => armure.equipee)
      .reduce((sum, armure) => sum + armure.malusInitiative, 0),
  );
```

- [ ] **Step 4: `hydrateForm` — lire `equipee` depuis l'API**

Remplacer :

```ts
      armures: referencedIds(hero.armures, (armure) => armure.armure_id).map((id) => ({id})),
```

par :

```ts
      armures: (hero.armures as (BolHerosArmureModel | number)[])
        .filter((armure): armure is BolHerosArmureModel => typeof armure === 'object')
        .map((armure) => ({id: armure.armure_id, equipee: Boolean(armure.equipee)})),
```

(`referencedIds` reste importé et utilisé pour `armes`/`langues` — ne pas retirer l'import.)

- [ ] **Step 5: `buildPayload` — envoyer `equipee`**

Remplacer :

```ts
    const armures = rawValue.armures.map((armure) => ({
      id: armure.id,
      armure_id: armure.id,
    }));
```

par :

```ts
    const armures = rawValue.armures.map((armure) => ({
      id: armure.id,
      armure_id: armure.id,
      equipee: armure.equipee,
    }));
```

- [ ] **Step 6: Template — brancher le toggle + afficher l'aperçu effectif**

Dans `front/src/app/bol/hero/form/hero-form-page.html`, remplacer :

```html
                    <bol-armure-list [armures]="selectedArmures()" (removed)="removeArmure($event)" />
```

par :

```html
                    <bol-armure-list
                      [armures]="selectedArmures()"
                      (removed)="removeArmure($event)"
                      (equippedToggled)="toggleArmureEquipped($event)"
                    />
```

Juste après la ligne `<bol-stats-grid [form]="statsForm" [groups]="heroStatGroups" />` (dans le même `<div class="dw-section--form">`), ajouter :

```html
                  @if (agiliteMalusTotal() > 0 || initiativeMalusTotal() > 0) {
                    <p class="hfp-effective-hint">
                      @if (agiliteMalusTotal() > 0) {
                        <span>Agilité effective : {{ model().agilite - agiliteMalusTotal() }} (équipement −{{ agiliteMalusTotal() }})</span>
                      }
                      @if (initiativeMalusTotal() > 0) {
                        <span>Initiative effective : {{ model().initiative - initiativeMalusTotal() }} (équipement −{{ initiativeMalusTotal() }})</span>
                      }
                    </p>
                  }
```

- [ ] **Step 7: Style de l'aperçu**

Ajouter à la fin de `front/src/app/bol/hero/form/hero-form-page.scss` :

```scss
.hfp-effective-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: var(--dw-color-legendary);
}
```

- [ ] **Step 8: Type-check + build**

Run: `cd front && npx tsc --noEmit -p tsconfig.app.json && npm run build`
Expected: pas d'erreur sur `hero-form-page.*`.

- [ ] **Step 9: Commit**

```bash
git add front/src/app/bol/hero/form/hero-form-page.ts front/src/app/bol/hero/form/hero-form-page.html front/src/app/bol/hero/form/hero-form-page.scss
git commit -m "feat(frontend): wire armure equip toggle and effective agilite/initiative preview into hero form"
```

---

## Task 10: Frontend — `pnj-form-page` : même câblage que hero-form-page

**Files:**
- Modify: `front/src/app/bol/pnj/form/pnj-form-page.ts`
- Modify: `front/src/app/bol/pnj/form/pnj-form-page.html`

**Interfaces:**
- Consumes: identique à la Tâche 9.

**Contexte** : `pnj-form-page` a son propre `PnjFormModel` (pas `BolHerosModel`) et son propre `buildPayload()` qui n'envoyait jusqu'ici que `{id: armure.id}` (pas de clé `armure_id` — `BolPnjController::update()` lit directement `$item['id']`, voir Tâche 4). Garder ce format, y ajouter `equipee`.

- [ ] **Step 1: Import et type du modèle de brouillon**

Dans `front/src/app/bol/pnj/form/pnj-form-page.ts`, remplacer l'import de `form-selection` :

```ts
import {ArmureDraft, IdDraft, RankedDraft, applyArmureEquipToggle, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
```

Ajouter :

```ts
import {BolHerosArmureModel} from '../../models/bol-armure.model';
```

Dans `PnjFormModel`, remplacer :

```ts
  armures: IdDraft[];
```

par :

```ts
  armures: ArmureDraft[];
```

- [ ] **Step 2: `selectedArmures` — inclure `categorie`/`equipee`/malus numériques**

Identique à la Tâche 9, Step 2 (même bloc `selectedEntries`, dans ce fichier).

- [ ] **Step 3: `addArmureEntry`/`toggleArmureEquipped`**

Remplacer `addArmureEntry` :

```ts
  protected addArmureEntry(id: number): void {
    this.model.update((current) => ({...current, armures: [...current.armures, {id, equipee: false}]}));
  }
```

Ajouter, juste après `removeArmure` :

```ts
  protected toggleArmureEquipped(index: number): void {
    const catalog = this.armuresList() ?? [];
    this.model.update((current) => ({
      ...current,
      armures: applyArmureEquipToggle(current.armures, index, (id) => catalog.find((a) => a.id === id)?.categorie ?? null),
    }));
  }
```

- [ ] **Step 4: `hydrateForm` — lire `equipee` depuis l'API**

Remplacer :

```ts
      armures: referencedIds(pnj.armures, (armure) => armure.armure_id).map((id) => ({id})),
```

par :

```ts
      armures: (pnj.armures as (BolHerosArmureModel | number)[])
        .filter((armure): armure is BolHerosArmureModel => typeof armure === 'object')
        .map((armure) => ({id: armure.armure_id, equipee: Boolean(armure.equipee)})),
```

- [ ] **Step 5: `buildPayload` — envoyer `equipee`**

Remplacer :

```ts
      armures: rawValue.armures.map((armure) => ({id: armure.id})),
```

par :

```ts
      armures: rawValue.armures.map((armure) => ({id: armure.id, equipee: armure.equipee})),
```

- [ ] **Step 6: Template**

Dans `front/src/app/bol/pnj/form/pnj-form-page.html`, remplacer :

```html
                    <bol-armure-list [armures]="selectedArmures()" (removed)="removeArmure($event)" />
```

par :

```html
                    <bol-armure-list
                      [armures]="selectedArmures()"
                      (removed)="removeArmure($event)"
                      (equippedToggled)="toggleArmureEquipped($event)"
                    />
```

(Pas d'aperçu Agilité/Initiative effectives ajouté ici : `pnj-form-page` n'a pas de rail de statistiques équivalent affichant ces valeurs de façon aussi visible que hero-form-page — la fiche PNJ elle-même et le statblock, mis à jour en Tâche 11, suffisent pour vérifier la valeur effective.)

- [ ] **Step 7: Type-check + build**

Run: `cd front && npx tsc --noEmit -p tsconfig.app.json && npm run build`
Expected: pas d'erreur sur `pnj-form-page.*`.

- [ ] **Step 8: Commit**

```bash
git add front/src/app/bol/pnj/form/pnj-form-page.ts front/src/app/bol/pnj/form/pnj-form-page.html
git commit -m "feat(frontend): wire armure equip toggle into pnj form"
```

---

## Task 11: Frontend — statblock : Agilité/Initiative/Défense effectives

**Files:**
- Modify: `front/src/app/bol/shared/statblock/bol-statblock.builders.ts`

**Interfaces:**
- Consumes: `BolHerosModel.attributs.agilite_effective`/`combat.initiative_effective`/`combat.defense_effective` (Tâche 5, alimentées par Tâche 3).

- [ ] **Step 1: Swap des valeurs de tuiles**

Dans `herosLikeStatblockData()` (`front/src/app/bol/shared/statblock/bol-statblock.builders.ts`), remplacer le bloc `tiles` :

```ts
    tiles: [
      {label: 'Vig', value: heros.attributs.vigueur},
      {label: 'Agi', value: heros.attributs.agilite},
      {label: 'Esp', value: heros.attributs.esprit},
      {label: 'Aura', value: heros.attributs.aura},
      {label: 'Init', value: heros.combat.initiative},
      {label: 'Mêlée', value: heros.combat.melee},
      {label: 'Tir', value: heros.combat.tir},
      {label: 'Déf', value: heros.combat.defense},
    ],
```

par :

```ts
    tiles: [
      {label: 'Vig', value: heros.attributs.vigueur},
      {label: 'Agi', value: heros.attributs.agilite_effective},
      {label: 'Esp', value: heros.attributs.esprit},
      {label: 'Aura', value: heros.attributs.aura},
      {label: 'Init', value: heros.combat.initiative_effective},
      {label: 'Mêlée', value: heros.combat.melee},
      {label: 'Tir', value: heros.combat.tir},
      {label: 'Déf', value: heros.combat.defense_effective},
    ],
```

(`creatureStatblockData`/`demonStatblockData` restent inchangés — pas de système d'équipement structuré pour ces types.)

- [ ] **Step 2: Build**

Run: `cd front && npm run build`
Expected: pas d'erreur sur `bol-statblock.builders.ts`.

- [ ] **Step 3: Commit**

```bash
git add front/src/app/bol/shared/statblock/bol-statblock.builders.ts
git commit -m "feat(frontend): show effective agilite/initiative/defense in the hero/pnj statblock"
```

---

## Task 12: Frontend — jet d'action et jet d'initiative : valeurs effectives

**Files:**
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts`

**Interfaces:**
- Consumes: `BolHerosModel.attributs.agilite_effective`/`combat.initiative_effective` (Tâche 5).

- [ ] **Step 1: `onSkillCheck()` — Agilité effective**

Dans `front/src/app/bol/session/play/session-play-page.ts`, remplacer (méthode `onSkillCheck`) :

```ts
            heroNom: token.nom,
            agilite: hero.attributs.agilite,
            vigueur: hero.attributs.vigueur,
            esprit: hero.attributs.esprit,
            aura: hero.attributs.aura,
          },
```

par :

```ts
            heroNom: token.nom,
            agilite: hero.attributs.agilite_effective,
            vigueur: hero.attributs.vigueur,
            esprit: hero.attributs.esprit,
            aura: hero.attributs.aura,
          },
```

- [ ] **Step 2: Dialog d'initiative — Initiative effective**

Dans `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts`, remplacer :

```ts
              esprit: h.attributs.esprit,
              initiative: h.combat.initiative,
```

par :

```ts
              esprit: h.attributs.esprit,
              initiative: h.combat.initiative_effective,
```

- [ ] **Step 3: Type-check + build**

Run: `cd front && npx tsc --noEmit -p tsconfig.app.json && npm run build`
Expected: pas d'erreur sur ces deux fichiers.

- [ ] **Step 4: Commit**

```bash
git add front/src/app/bol/session/play/session-play-page.ts front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts
git commit -m "feat(frontend): use effective agilite/initiative in the action-roll and initiative dialogs"
```

---

## Task 13: Frontend — `combat-attack.util.ts` : stats résolues effectives + malus de petit bouclier

**Files:**
- Modify: `front/src/app/bol/session/combat-attack.util.ts`

**Interfaces:**
- Consumes: `BolHerosModel.attributs.agilite_effective`/`combat.defense_effective`/`equipement_effectif` (Tâche 5).
- Produces: `ResolvedCombatStats` gagne `bouclierMalusUneAttaque: number` — consommé par la Tâche 14.

- [ ] **Step 1: Étendre l'interface et la branche héros**

Dans `front/src/app/bol/session/combat-attack.util.ts`, remplacer l'interface :

```ts
export interface ResolvedCombatStats {
  readonly agilite: number;
  readonly vigueur: number;
  readonly melee: number;
  readonly tir: number;
  /** Bonus d'attaque combiné des créatures (remplace agilité+mêlée). */
  readonly attaque: number | null;
  readonly defense: number;
  readonly degats: string;
  readonly protection: number;
  /** Malus du petit bouclier ("-1 à une attaque subie par round") — 0 si absent ou déjà replié
   * dans `defense` (cas du grand bouclier, portée "toutes"). Consommé manuellement par le dialog
   * d'attaque, l'app ne suivant pas de round. */
  readonly bouclierMalusUneAttaque: number;
}
```

Remplacer la branche `token.kind === 'hero'` de `resolveAttackStats()` :

```ts
  if (token.kind === 'hero') {
    const herosId = c.sourceId;
    if (!herosId) {
      return of({
        agilite: 0,
        vigueur: 0,
        melee: 0,
        tir: 0,
        attaque: null,
        defense: 0,
        degats: 'd3',
        protection: 0,
        bouclierMalusUneAttaque: 0,
      });
    }

    return herosService.heros(herosId).pipe(
      map((hero) => ({
        agilite: hero.attributs.agilite_effective,
        vigueur: hero.attributs.vigueur,
        melee: hero.combat.melee,
        tir: hero.combat.tir,
        attaque: null,
        defense: hero.combat.defense_effective,
        degats: firstWeaponDegats(hero.armes) ?? 'd3',
        protection: parseProtectionValue(firstArmureProtection(hero.armures)),
        bouclierMalusUneAttaque:
          hero.equipement_effectif.bouclier_malus_attaque_subie_portee === 'une'
            ? hero.equipement_effectif.bouclier_malus_attaque_subie
            : 0,
      })),
    );
  }
```

Remplacer le `return of({...})` final (branche pnj/créature/démon) :

```ts
  return of({
    agilite: c.agilite ?? 0,
    vigueur: c.vigueur ?? 0,
    melee: c.melee ?? 0,
    tir: c.tir ?? 0,
    attaque: c.attaque,
    defense: c.defense ?? 0,
    degats: c.degats ?? 'd3',
    protection: parseProtectionValue(c.protection),
    bouclierMalusUneAttaque: 0,
  });
```

- [ ] **Step 2: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.app.json`
Expected: erreur restante uniquement dans `attack-roll-dialog.ts` (littéral `{agilite, vigueur, melee, tir, attaque, defense, degats, protection}` sans `bouclierMalusUneAttaque` s'il en construit un ailleurs — sinon aucune erreur ; corrigé en Tâche 14 de toute façon).

- [ ] **Step 3: Commit**

```bash
git add front/src/app/bol/session/combat-attack.util.ts
git commit -m "feat(frontend): resolve effective agilite/defense and petit bouclier malus for attack rolls"
```

---

## Task 14: Frontend — `attack-roll-dialog` : malus de petit bouclier consommable

**Files:**
- Modify: `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.ts`
- Modify: `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.html`
- Modify: `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.scss`
- Test: `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.spec.ts`

**Interfaces:**
- Consumes: `ResolvedCombatStats.bouclierMalusUneAttaque` (Tâche 13).
- Produces: `computeAttackTotal(diceSum, attackerBonus, targetDefense, modifier, shieldMalus): number` (fonction pure exportée, testée).

**Note** : `targetDefense = signal(this.data.target.defense)` n'a pas besoin de changer — `data.target.defense` porte déjà la valeur effective (le malus du grand bouclier, portée "toutes", y est replié en amont dans `resolveAttackStats`). Seul le cas "une" (petit bouclier) a besoin d'un nouveau contrôle manuel, car l'app ne suit pas de round.

- [ ] **Step 1: Écrire le test (échoue, `computeAttackTotal` n'existe pas encore)**

Créer `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {computeAttackTotal} from './attack-roll-dialog';

describe('computeAttackTotal', () => {
  it('sums dice, attacker bonus and modifier, then subtracts target defense', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0)).toBe(4);
  });

  it('subtracts the petit bouclier malus when consumed', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 1)).toBe(3);
  });

  it('ignores the shield malus when not consumed (caller passes 0)', () => {
    expect(computeAttackTotal(7, 5, 8, 2, 0)).toBe(6);
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `cd front && npm test`
Expected: FAIL — `computeAttackTotal` n'est pas exporté par `attack-roll-dialog.ts`.

- [ ] **Step 3: Implémenter — export de la fonction pure + wiring**

Dans `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.ts`, ajouter juste avant la classe `AttackRollDialogComponent` (après la constante `THRESHOLD`) :

```ts
/** Total du jet d'attaque : 2d6 + bonus attaquant − défense cible + modificateur − malus de petit bouclier consommé. */
export function computeAttackTotal(
  diceSum: number,
  attackerBonus: number,
  targetDefense: number,
  modifier: number,
  shieldMalus: number,
): number {
  return diceSum + attackerBonus - targetDefense + modifier - shieldMalus;
}
```

Ajouter le signal, juste après `protected readonly modifier = signal(0);` :

```ts
  protected readonly shieldBonusAvailable = signal(this.data.target.bouclierMalusUneAttaque > 0);
```

Remplacer `attackTotal` :

```ts
  protected readonly attackTotal = computed(() => {
    const sum = this.attackDiceSum();
    if (sum === null) {
      return null;
    }
    const shieldMalus = this.shieldBonusAvailable() ? this.data.target.bouclierMalusUneAttaque : 0;
    return computeAttackTotal(sum, this.attackerBonus(), this.targetDefense(), this.modifier(), shieldMalus);
  });
```

Remplacer `attackFormula` :

```ts
  protected readonly attackFormula = computed(() => {
    const d = this.attackDice();
    if (!d) {
      return '';
    }
    const bonus = this.attackerBonus();
    const mod = this.modifier();
    const shieldMalus = this.shieldBonusAvailable() ? this.data.target.bouclierMalusUneAttaque : 0;
    let formula = `2d6 (${d[0]}+${d[1]}) ${bonus >= 0 ? '+' : ''}${bonus} −${this.targetDefense()}`;
    if (mod !== 0) {
      formula += ` ${mod >= 0 ? '+' : ''}${mod}`;
    }
    if (shieldMalus !== 0) {
      formula += ` −${shieldMalus} (bouclier)`;
    }
    return formula;
  });
```

- [ ] **Step 4: Template — case à cocher conditionnelle**

Dans `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.html`, dans le bloc `<div class="atd-fields">` (lignes 58-71), ajouter après le champ "Modificateur" :

```html
      @if (data.target.bouclierMalusUneAttaque > 0) {
        <label class="atd-field atd-field--checkbox">
          <input type="checkbox" [(ngModel)]="shieldBonusAvailable" />
          <span>Bonus de petit bouclier disponible (−{{ data.target.bouclierMalusUneAttaque }})</span>
        </label>
      }
```

- [ ] **Step 5: Style de la case à cocher**

Ajouter à la fin de `front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.scss` :

```scss
.atd-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;

  input[type='checkbox'] {
    width: auto;
  }
}
```

- [ ] **Step 6: Lancer les tests, vérifier qu'ils passent**

Run: `cd front && npm test`
Expected: PASS — 3 nouveaux tests.

- [ ] **Step 7: Type-check + build**

Run: `cd front && npx tsc --noEmit -p tsconfig.app.json && npm run build`
Expected: propre, plus aucune erreur résiduelle des tâches précédentes.

- [ ] **Step 8: Commit**

```bash
git add front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.ts \
        front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.html \
        front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.scss \
        front/src/app/bol/session/attack-roll-dialog/attack-roll-dialog.spec.ts
git commit -m "feat(frontend): consumable petit bouclier malus in the attack-roll dialog"
```

---

## Task 15: Vérification manuelle de bout en bout + suite complète

**Files:** aucun (vérification uniquement).

- [ ] **Step 1: Suites automatisées complètes**

Run: `cd backend && php artisan test`
Expected: tous les tests passent (y compris les 10 nouveaux de `BolEquipmentEffectServiceTest`).

Run: `cd front && npm run build && npm test`
Expected: build propre, tous les tests Vitest passent (93 existants + 3 `applyArmureEquipToggle` + 3 `computeAttackTotal` = 99).

- [ ] **Step 2: Vérification manuelle via le skill `run`**

Démarrer l'environnement (`docker compose up -d` depuis `backend/`, `npm start` depuis `front/`), se connecter en `claude-test@example.com` / `ClaudeTest123!`, puis avec Playwright :

1. Ouvrir la fiche d'un héros de test, ajouter/équiper un grand bouclier (toggle "Équipé·e") → vérifier l'aperçu "Agilité effective : X (équipement −1)" sous la grille de stats.
2. Enregistrer, ouvrir le statblock du héros → vérifier que la tuile "Agi" affiche la valeur effective (et "Déf" +1, "Init" inchangée si pas de casque).
3. Démarrer/rejoindre une session, ouvrir le jet d'action ("Jet d'action") sur ce héros → vérifier que l'Agilité pré-remplie est la valeur effective.
4. Démarrer un combat, lancer un jet d'attaque avec ce héros comme cible → vérifier que "Défense cible" est déjà la valeur effective (+1).
5. Équiper un petit bouclier à la place (déséquipant le grand bouclier — vérifier qu'un seul reste équipé) → relancer un jet d'attaque contre ce héros → vérifier que la case "Bonus de petit bouclier disponible" apparaît et modifie le total quand cochée/décochée.
6. Déséquiper toute armure → vérifier que la fiche, le statblock, le jet d'action et le jet d'attaque reviennent tous aux valeurs brutes.
7. Répéter les points 1-2 sur un PNJ (bibliothèque `/pnj`) pour confirmer que le même mécanisme s'applique.

Capturer des captures d'écran dans le répertoire scratchpad pour chaque étape clé (équipement, statblock, jet d'action, jet d'attaque).

- [ ] **Step 3: Nettoyage**

Supprimer toute session/héros de test créés pour la vérification (via l'API ou l'UI), arrêter `ng serve` et `docker compose down`.

- [ ] **Step 4: Rapport final**

Confirmer au responsable du projet que la vérification de bout en bout est passée, avant toute demande de revue de code ou de merge.
