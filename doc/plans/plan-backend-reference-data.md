# Plan — Données de référence : front → back

## Contexte

Le front contient trois catégories de données qui mériteraient d'être en base ou exposées par l'API :

1. **IDs de BDD hardcodés** — fragiles, le front casse en silence si un ID change
2. **Flags mécaniques absents du modèle** — comportements déduits de chaînes de caractères au lieu de champs structurés
3. **Données de règles embarquées** — contenu métier qui a sa place en BDD comme les autres données BoL

Les labels UI purs (`TYPE_LABELS`, `ADVANTAGE_OPTIONS`, traductions de champs) restent côté front.

---

## Priorité 1 — IDs hardcodés dans `create.rules.ts` ✅

### 1a — `est_lemurienne` sur `bol_langue` ✅
Migration + seeder. Front : `langues.find(l => l.est_lemurienne)`.

### 1b — `donne_langue` sur `bol_carriere` ✅
Migration + seeder. Front : `carrieres.filter(c => c.donne_langue)`.

### 1c — `langue_native_id` sur `bol_region` ✅
Migration + seeder. Front : `region.langue_native_id`.

### 1d — Règles carrières sur `bol_region` ✅
Migration (`premiere_carriere_id`, `carrieres_requises`, `carrieres_interdites`) + seeder. Front : lecture directe depuis la région.

---

## Priorité 2 — Flags mécaniques sur `bol_pouvoir` ✅

Flags ajoutés : `avantage_attaque`, `degats_superieurs`, `regeneration`, `intangible`, `avertissement_combat`.  
`PouvoirSlot` remplace `string[]` dans `InitiativeSlot`. Toutes les comparaisons de chaînes remplacées par des vérifications de flags.  
`BolScenarioService::enrichDemonPouvoirs()` joint les flags au snapshot JSON à la lecture.

---

## Priorité 3 — Données de règles embarquées ✅

Nouvelles tables `bol_combat_option`, `bol_heroic_option`, `bol_difficulte` avec modèles, seeders, controller (`BolCombatReferenceController`) et routes :
- `GET /api/bol/combat/options`
- `GET /api/bol/combat/heroic-options`
- `GET /api/bol/combat/difficultes`

Front : `BolCombatReferenceService` avec `toSignal()`, plus de constantes hardcodées dans l'assistant d'attaque.

---

## Priorité 4 — Validations back manquantes ✅

`BolHerosRequest` Laravel (`app/Http/Requests/Bol/`) :
- Plage attribut : −1 à +3
- Max 1 attribut négatif
- Somme attributs ≤ 4
- Plage carrière : 0 à +3
- Somme rangs carrières ≤ 4

Utilisé dans `BolHerosController::create()` et `update()`.

---

## Priorité 5 — Dédoublons front ✅

`CATEGORY_LABELS` (3 copies) et `TYPE_LABELS` (2 copies) extraits dans `combat.constants.ts` partagé.  
`INITIATIVE_ORDER` également déplacé. Les 4 fichiers concernés importent depuis ce fichier.

---

## Migrations en attente d'exécution (Docker)

| Migration | Seeder à relancer |
|---|---|
| `add_est_lemurienne_to_bol_langue` | `BolLangueSeeder` |
| `add_donne_langue_to_bol_carriere` | `BolCarriereSeeder` |
| `add_langue_native_to_bol_region` | `BolRegionSeeder` |
| `add_career_rules_to_bol_region` | `BolRegionSeeder` |
| `add_flags_to_bol_pouvoir` | `BolPouvoirSeeder` |
| `create_bol_combat_option_table` | `BolCombatOptionSeeder` (nouveau) |
| `create_bol_heroic_option_table` | `BolHeroicOptionSeeder` (nouveau) |
| `create_bol_difficulte_table` | `BolDifficulteSeeder` (nouveau) |
