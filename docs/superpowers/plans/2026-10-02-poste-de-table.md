# Poste de table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire de la table (battlemap) la page d'accueil de Diceway : réserve à gauche pour poser héros, PNJ, créatures et démons, fiche du jeton à droite avec un jet d'action en une seule surface, et suppression du dashboard.

**Architecture:** `session-play-page` devient une mise en page à trois zones (réserve / carte / fiche du jeton) faite de composants indépendants qui remontent leurs événements à la page, seule à parler à la session. La logique du jet d'action sort du composant vers un utilitaire pur. La route `/` est gardée par un guard qui redirige vers la session ouverte ; sans session, elle affiche le seuil (l'ancienne page « nouvelle session »).

**Tech Stack:** Angular 22 (standalone, signals, OnPush), Angular Material, Vitest (`ng test`), Laravel 12 (un seul changement backend).

**Spec:** `docs/superpowers/specs/2026-10-02-poste-de-table-design.md`

## Global Constraints

- Conventions Angular du `CLAUDE.md` : pas de `standalone: true`, `ChangeDetectionStrategy.OnPush` partout, `input()`/`output()`/`model()`, `inject()`, contrôle de flux natif (`@if`/`@for`), pas de `ngClass`/`ngStyle`, pas de `@HostListener` (objet `host`), pas de fonction fléchée dans les templates.
- **Angular Material uniquement.** Boutons `mat-flat-button`/`mat-stroked-button`/`mat-icon-button` avec `size="small"`.
- Style : un élément qui porte une classe maison ne porte pas en plus des utilitaires Tailwind. Tous les nouveaux composants de ce plan n'utilisent que des classes maison.
- Couleurs : uniquement les tokens `--dw-*` de `front/src/styles/_tokens.scss`.
- Accessibilité WCAG AA : libellés ARIA sur tout bouton icône, `aria-expanded` sur le repli de la réserve, `aria-live="polite"` sur le bandeau « Dernier jet ».
- **Le combat n'est pas modifié**, sauf `endCombat` (tâche 1). `start-combat-dialog`, `attack-menu`, `attack-roll-dialog`, `initiative-rail` restent intacts.
- Tests front : le dépôt ne teste que des fonctions pures avec Vitest (aucun test de composant `TestBed` hors `app.spec.ts`). Ce plan suit cette pratique : chaque comportement à tester est extrait dans un fichier `*.util.ts`.
- **Pas d'infrastructure de test backend avec base de données** (`phpunit.xml` a `DB_CONNECTION` commenté, aucun test Feature réel). `endCombat` ne fait que des écritures en base : il est vérifié à la main (tâche 11), pas par un test automatisé.
- Lancer un fichier de test front : `cd front && npx ng test --watch=false --include "**/<fichier>.spec.ts"`. Valider le front : `cd front && npm run build`.
- **Git** : Lionel gère lui-même branches, merges et worktrees. Les étapes « Commit » ne s'exécutent que s'il a autorisé les commits pour cette exécution ; sinon, laisser les changements dans l'arbre de travail et passer à la tâche suivante.
- Textes d'interface en français.

## Review Focus

Cas que la spec implique sans les nommer, les plus probables d'abord. Chacun a son test dans la tâche indiquée.

1. **Clics rapides sur un stepper de vitalité** : deux clics avant la réponse du serveur doivent envoyer deux deltas de −1, pas −1 puis −2. → `ValueTracker`, tâche 4.
2. **Recherche dans la réserve sans accent ni majuscule** : taper « pretre » doit trouver « Prêtre de Shazzadion ». → `filterReserve`, tâche 5.
3. **Jeton sélectionné qui disparaît** (retiré, ou passage en combat) : la fiche doit se fermer, pas afficher un jeton fantôme. → `findSelectedToken`, tâche 7.
4. **`localStorage` indisponible ou valeur corrompue** : la table doit s'ouvrir avec la réserve dépliée. → `readPanelOpen`, tâche 7.
5. **Aucune session ouverte, ou session sans id** : `/` doit afficher le seuil, pas rediriger vers `/session/null/play`. → `openSessionId`, tâche 9.

---

### Task 1: Fin de combat sans retrait des personnages

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolFightSessionService.php:116-132`
- Modify: `front/src/app/bol/session/play/session-play-page.ts:172-179`

**Interfaces:**
- Produces: `endCombat` conserve les pivots créature / démon / PNJ. Les tâches suivantes comptent dessus : des personnages posés en mode libre survivent à un combat.

- [ ] **Step 1: Modifier `endCombat`**

Dans `backend/app/Http/Services/Bol/BolFightSessionService.php`, remplacer la méthode `endCombat` (docblock compris) par :

```php
    /** Termine le combat : la session redevient `libre`. Les PNJ, créatures et démons restent sur la
     * table (ils ont pu y être posés en mode libre) — le MJ retire les vaincus à la main. */
    public function endCombat(string $sessionId, string $userId): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || $session->statut !== 'combat') {
            return null;
        }

        BolFightSessionHeros::where('fight_session_id', $sessionId)->update(['initiative_resultat' => null]);

        $session->update(['statut' => 'libre', 'ordre_manuel' => null]);

        return $this->getSessionWithRelations($sessionId);
    }
```

- [ ] **Step 2: Vérifier que les imports inutilisés ne cassent rien**

`BolFightSessionCreature`, `BolFightSessionDemon` et `BolFightSessionPnj` sont encore utilisés ailleurs dans le fichier (`createCreatureRow`, etc.) : ne pas toucher aux `use`.

Run: `cd backend && php artisan test`
Expected: PASS (les tests existants `BolFightSessionStatutTest` et `BolEquipmentEffectServiceTest` passent toujours).

- [ ] **Step 3: Corriger le message de confirmation côté front**

Dans `front/src/app/bol/session/play/session-play-page.ts`, méthode `askEndCombat`, remplacer :

```ts
        message: 'Les adversaires seront retirés et la session repassera en mode libre. Continuer ?',
```

par :

```ts
        message: 'La session repassera en mode libre. Les personnages restent sur la table. Continuer ?',
```

- [ ] **Step 4: Valider le front**

Run: `cd front && npm run build`
Expected: build réussi.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http/Services/Bol/BolFightSessionService.php front/src/app/bol/session/play/session-play-page.ts
git commit -m "feat(session): la fin de combat conserve les personnages sur la table"
```

---

### Task 2: Utilitaire pur du jet d'action

**Files:**
- Create: `front/src/app/bol/session/action-roll.util.ts`
- Create: `front/src/app/bol/session/action-roll.util.spec.ts`
- Delete: `front/src/app/bol/session/play/action-roll-dialog/action-roll-dialog.spec.ts`
- Modify: `front/src/app/bol/session/play/action-roll-dialog/action-roll-dialog.ts`
- Modify: `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts:13`
- Modify: `front/src/app/bol/session/play/session-play-page.ts:28`
- Modify: `front/src/app/bol/session/play/hero-action-panel/hero-action-panel.ts`

**Interfaces:**
- Produces (toutes exportées par `action-roll.util.ts`) :
  - types `ActionRollCarriere`, `ActionRollDiceTrait`, `ActionRollData` (ancien `ActionRollDialogData`, mêmes champs), `ActionAttribute`, `ActionDifficulty`, `ActionRollParts`, `ActionRollTone`, `LastRoll`
  - constantes `ACTION_ATTRIBUTES`, `ACTION_ATTRIBUTE_LABELS`, `ACTION_ROLL_THRESHOLD`, `ACTION_DIFFICULTIES`, `DEFAULT_ACTION_DIFFICULTY`, `ACTION_RESULT_LABELS`
  - fonctions `suggestedActionResult(dice, modifierSum, threshold): InitiativeResultat`, `keepBestOrWorstTwo(values, net): readonly [number, number]`, `diceFromTotal(total): readonly [number, number]`, `netDiceModifier(avantages, desavantages): number`, `diceCountLabel(avantages, desavantages): string`, `signedModifier(value): string`, `actionModifierSum(parts: ActionRollParts): number`, `formatActionFormula(parts: ActionRollParts, dice: readonly [number, number] | null): string`, `actionResultTone(result: InitiativeResultat): ActionRollTone`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `front/src/app/bol/session/action-roll.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {
  ACTION_DIFFICULTIES,
  DEFAULT_ACTION_DIFFICULTY,
  actionModifierSum,
  actionResultTone,
  diceCountLabel,
  diceFromTotal,
  formatActionFormula,
  keepBestOrWorstTwo,
  netDiceModifier,
  signedModifier,
  suggestedActionResult,
} from './action-roll.util';

describe('suggestedActionResult', () => {
  it('returns echec on a natural 2, regardless of total', () => {
    expect(suggestedActionResult([1, 1], 20, 6)).toBe('echec');
  });

  it('returns heroique on a natural 12, regardless of total', () => {
    expect(suggestedActionResult([6, 6], -20, 12)).toBe('heroique');
  });

  it('returns reussite when the total meets the threshold', () => {
    expect(suggestedActionResult([4, 5], 0, 9)).toBe('reussite');
  });

  it('returns echec when the total is below the threshold', () => {
    expect(suggestedActionResult([2, 3], 0, 9)).toBe('echec');
  });
});

describe('diceFromTotal', () => {
  it('reconstructs (1,1) for a manually entered total of 2', () => {
    expect(diceFromTotal(2)).toEqual([1, 1]);
  });

  it('reconstructs (6,6) for a manually entered total of 12', () => {
    expect(diceFromTotal(12)).toEqual([6, 6]);
  });

  it('reconstructs a valid pair summing to the entered total', () => {
    const [a, b] = diceFromTotal(7);
    expect(a + b).toBe(7);
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(6);
    expect(b).toBeGreaterThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(6);
  });
});

describe('keepBestOrWorstTwo', () => {
  it('returns the pair as-is for a normal 2d6 roll', () => {
    expect(keepBestOrWorstTwo([3, 5], 0)).toEqual([3, 5]);
  });

  it('keeps the 2 best of 3 for a single avantage', () => {
    expect(keepBestOrWorstTwo([1, 4, 6], 1)).toEqual([4, 6]);
  });

  it('keeps the 2 worst of 4 for two désavantages', () => {
    expect(keepBestOrWorstTwo([1, 2, 5, 6], -2)).toEqual([1, 2]);
  });
});

describe('netDiceModifier', () => {
  it('cancels one avantage against one désavantage', () => {
    expect(netDiceModifier(1, 1)).toBe(0);
  });

  it('caps the net at +2 and −2', () => {
    expect(netDiceModifier(5, 0)).toBe(2);
    expect(netDiceModifier(0, 4)).toBe(-2);
  });
});

describe('diceCountLabel', () => {
  it('is empty for a plain roll', () => {
    expect(diceCountLabel(0, 0)).toBe('');
  });

  it('says the traits cancel out when both kinds are selected and net is 0', () => {
    expect(diceCountLabel(1, 1)).toBe("S'annulent — 2d6");
  });

  it('describes a bonus die', () => {
    expect(diceCountLabel(1, 0)).toBe('3d6, garde les 2 meilleurs');
  });

  it('describes two malus dice', () => {
    expect(diceCountLabel(0, 2)).toBe('4d6, garde les 2 moins bons');
  });
});

describe('signedModifier', () => {
  it('prefixes positive values with + and never writes +0', () => {
    expect(signedModifier(2)).toBe('+2');
    expect(signedModifier(0)).toBe('0');
    expect(signedModifier(-1)).toBe('-1');
  });
});

describe('actionModifierSum', () => {
  it('adds attribute, career, difficulty, equipment and free modifier', () => {
    expect(actionModifierSum({attribute: 2, carriere: 1, difficulty: -1, equipment: -1, modifier: 3})).toBe(4);
  });
});

describe('formatActionFormula', () => {
  it('lists every non-zero term before the roll', () => {
    expect(formatActionFormula({attribute: 2, carriere: 1, difficulty: -1, equipment: 0, modifier: 0}, null)).toBe(
      '2d6 + 2 + 1 − 1 ≥ 9',
    );
  });

  it('shows only 2d6 when every modifier is zero', () => {
    expect(formatActionFormula({attribute: 0, carriere: 0, difficulty: 0, equipment: 0, modifier: 0}, null)).toBe(
      '2d6 ≥ 9',
    );
  });

  it('replaces 2d6 by the kept dice once rolled', () => {
    expect(formatActionFormula({attribute: 2, carriere: 0, difficulty: -4, equipment: -1, modifier: 0}, [4, 5])).toBe(
      '4 + 5 + 2 − 1 − 4 ≥ 9',
    );
  });
});

describe('actionResultTone', () => {
  it('maps both failures to echec and both exceptional successes to heroique', () => {
    expect(actionResultTone('echec')).toBe('echec');
    expect(actionResultTone('echec_critique')).toBe('echec');
    expect(actionResultTone('reussite')).toBe('reussite');
    expect(actionResultTone('heroique')).toBe('heroique');
    expect(actionResultTone('legendaire')).toBe('heroique');
  });
});

describe('ACTION_DIFFICULTIES', () => {
  it('has eight levels and defaults to Moyenne (0)', () => {
    expect(ACTION_DIFFICULTIES).toHaveLength(8);
    expect(DEFAULT_ACTION_DIFFICULTY).toEqual({label: 'Moyenne', modifier: 0});
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd front && npx ng test --watch=false --include "**/action-roll.util.spec.ts"`
Expected: FAIL, le module `./action-roll.util` n'existe pas.

- [ ] **Step 3: Créer l'utilitaire**

Créer `front/src/app/bol/session/action-roll.util.ts` :

```ts
import {InitiativeResultat} from '../models/bol-fight-session.model';

export interface ActionRollCarriere {
  readonly label: string;
  readonly value: number;
}

/** Avantage/désavantage à dé de bonus/malus du héros (`de_bonus`/`de_malus` en base) — ne modifie pas
 * un attribut, change le mécanisme de lancer (cf. `netDiceModifier`/`keepBestOrWorstTwo`). */
export interface ActionRollDiceTrait {
  readonly label: string;
  readonly domaine: string | null;
  readonly kind: 'avantage' | 'desavantage';
}

export interface ActionRollData {
  readonly heroNom: string;
  readonly herosId: string;
  /** Héroïsme du héros au chargement — la valeur vivante est portée par le `model()` du composant. */
  readonly heroisme: number;
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
  readonly aura: number;
  /** Malus d'équipement (armure/casque) sur l'agilité — appliqué automatiquement quand cet attribut est sélectionné. */
  readonly equipementAgilite: number;
  /** Carrières du héros — `2d6 + attribut + carrière appropriée` (02-actions-combat.md), sélection manuelle. */
  readonly carrieres: readonly ActionRollCarriere[];
  /** Avantages/désavantages à dé de bonus/malus — sélection manuelle. Les traits à modificateur fixe
   * d'attribut sont exclus : déjà intégrés à la valeur stockée (décision du 2026-09-01). */
  readonly diceTraits: readonly ActionRollDiceTrait[];
}

export type ActionAttribute = 'agilite' | 'vigueur' | 'esprit' | 'aura';

export const ACTION_ATTRIBUTES: readonly ActionAttribute[] = ['agilite', 'vigueur', 'esprit', 'aura'];

export const ACTION_ATTRIBUTE_LABELS: Record<ActionAttribute, string> = {
  agilite: 'Agilité',
  vigueur: 'Vigueur',
  esprit: 'Esprit',
  aura: 'Aura',
};

export interface ActionDifficulty {
  readonly label: string;
  readonly modifier: number;
}

/** Seuil fixe de réussite d'un jet d'action BoL (02-actions-combat.md) — la difficulté agit en modificateur, jamais sur le seuil. */
export const ACTION_ROLL_THRESHOLD = 9;

/** Échelle de difficulté officielle BoL (02-actions-combat.md), appliquée en modificateur au jet. */
export const ACTION_DIFFICULTIES: readonly ActionDifficulty[] = [
  {label: 'Très facile', modifier: 2},
  {label: 'Facile', modifier: 1},
  {label: 'Moyenne', modifier: 0},
  {label: 'Ardue', modifier: -1},
  {label: 'Difficile', modifier: -2},
  {label: 'Très difficile', modifier: -4},
  {label: 'Impossible', modifier: -6},
  {label: 'Héroïque', modifier: -8},
];

export const DEFAULT_ACTION_DIFFICULTY: ActionDifficulty = ACTION_DIFFICULTIES[2];

export const ACTION_RESULT_LABELS: Record<InitiativeResultat, string> = {
  echec_critique: 'Échec critique',
  echec: 'Échec',
  reussite: 'Réussite',
  heroique: 'Héroïque',
  legendaire: 'Légendaire',
};

/** Résultat suggéré d'un jet d'action : 2/12 naturels priment sur le seuil (même règle absolue que l'initiative). */
export function suggestedActionResult(
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

/** Résout un dé de bonus/malus (02-actions-combat.md, p. 16-17 du livre) : `net` positif garde les 2
 * meilleurs des dés lancés, négatif garde les 2 moins bons, 0 = lancer normal. */
export function keepBestOrWorstTwo(values: readonly number[], net: number): readonly [number, number] {
  if (values.length <= 2) {
    return [values[0], values[1]];
  }
  const sorted = [...values].sort((a, b) => a - b);
  return net < 0 ? [sorted[0], sorted[1]] : [sorted[sorted.length - 2], sorted[sorted.length - 1]];
}

/** Reconstruit une paire de dés valide à partir d'un total 2d6 saisi à la main — un total de 2 ou 12
 * n'est atteignable que par (1,1) ou (6,6), donc la règle absolue reste correcte. */
export function diceFromTotal(total: number): readonly [number, number] {
  const a = Math.max(1, Math.min(6, total - 6));
  return [a, total - a];
}

/** Solde net de dés de bonus/malus, plafonné à ±2 (02-actions-combat.md) : un avantage et un
 * désavantage contradictoires s'annulent. */
export function netDiceModifier(avantages: number, desavantages: number): number {
  return Math.max(-2, Math.min(2, avantages - desavantages));
}

export function diceCountLabel(avantages: number, desavantages: number): string {
  const net = netDiceModifier(avantages, desavantages);
  if (net === 0) {
    return avantages > 0 && desavantages > 0 ? "S'annulent — 2d6" : '';
  }
  const count = 2 + Math.abs(net);
  return net > 0 ? `${count}d6, garde les 2 meilleurs` : `${count}d6, garde les 2 moins bons`;
}

/** Formate un modificateur avec son signe — jamais de "+0" (zéro n'est ni un bonus ni un malus). */
export function signedModifier(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/** Les cinq termes ajoutés aux 2d6, dans l'ordre où la formule les affiche. */
export interface ActionRollParts {
  readonly attribute: number;
  readonly carriere: number;
  readonly equipment: number;
  readonly difficulty: number;
  readonly modifier: number;
}

export function actionModifierSum(parts: ActionRollParts): number {
  return parts.attribute + parts.carriere + parts.equipment + parts.difficulty + parts.modifier;
}

/** Formule en clair : `2d6 + 2 + 1 − 1 ≥ 9`. Les termes nuls sont omis ; une fois les dés lancés,
 * `2d6` est remplacé par les deux dés gardés. */
export function formatActionFormula(parts: ActionRollParts, dice: readonly [number, number] | null): string {
  const head = dice ? `${dice[0]} + ${dice[1]}` : '2d6';
  const terms = [parts.attribute, parts.carriere, parts.equipment, parts.difficulty, parts.modifier]
    .filter((value) => value !== 0)
    .map((value) => (value > 0 ? ` + ${value}` : ` − ${Math.abs(value)}`))
    .join('');
  return `${head}${terms} ≥ ${ACTION_ROLL_THRESHOLD}`;
}

export type ActionRollTone = 'echec' | 'reussite' | 'heroique';

export function actionResultTone(result: InitiativeResultat): ActionRollTone {
  if (result === 'reussite') {
    return 'reussite';
  }
  return result === 'heroique' || result === 'legendaire' ? 'heroique' : 'echec';
}

/** Dernier jet affiché dans le bandeau sous la carte (`session-play-page`). */
export interface LastRoll {
  readonly nom: string;
  readonly formula: string;
  readonly total: number;
  readonly label: string;
  readonly tone: ActionRollTone;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd front && npx ng test --watch=false --include "**/action-roll.util.spec.ts"`
Expected: PASS.

- [ ] **Step 5: Faire consommer l'utilitaire par le code existant**

Supprimer `front/src/app/bol/session/play/action-roll-dialog/action-roll-dialog.spec.ts` (ses cas sont repris dans le nouveau spec).

Dans `front/src/app/bol/session/play/action-roll-dialog/action-roll-dialog.ts` :
- supprimer les déclarations locales `ActionRollCarriere`, `ActionRollDiceTrait`, `ActionRollDialogData`, `ActionAttribute`, `ACTION_ATTRIBUTE_LABELS`, `ActionDifficulty`, `ACTION_ROLL_THRESHOLD`, `ACTION_DIFFICULTIES`, `suggestedActionResult`, `keepBestOrWorstTwo`, `diceFromTotal`, `RESULT_LABELS` (lignes 22 à 126) ;
- ajouter l'import :

```ts
import {
  ACTION_ATTRIBUTE_LABELS,
  ACTION_DIFFICULTIES,
  ACTION_RESULT_LABELS,
  ACTION_ROLL_THRESHOLD,
  ActionAttribute,
  ActionDifficulty,
  ActionRollCarriere,
  ActionRollData,
  diceFromTotal,
  keepBestOrWorstTwo,
  suggestedActionResult,
} from '../../action-roll.util';
```

- remplacer `input.required<ActionRollDialogData>()` par `input.required<ActionRollData>()` ;
- remplacer `RESULT_LABELS[result]` par `ACTION_RESULT_LABELS[result]` ;
- l'import `InitiativeResultat` reste (utilisé par `suggestedResult`).

Dans `front/src/app/bol/session/play/start-combat-dialog/start-combat-dialog.ts`, ligne 13, remplacer :

```ts
import {diceFromTotal} from '../action-roll-dialog/action-roll-dialog';
```

par :

```ts
import {diceFromTotal} from '../../action-roll.util';
```

Dans `front/src/app/bol/session/play/session-play-page.ts`, ligne 28, remplacer :

```ts
import {ActionRollDiceTrait, ActionRollDialogData} from './action-roll-dialog/action-roll-dialog';
```

par :

```ts
import {ActionRollDiceTrait} from '../action-roll.util';
```

Dans `front/src/app/bol/session/play/hero-action-panel/hero-action-panel.ts`, remplacer l'import du dialogue par :

```ts
import {ActionRollData} from '../../action-roll.util';
import {ActionRollDialogComponent} from '../action-roll-dialog/action-roll-dialog';
```

et le type `readonly actionRoll: ActionRollDialogData;` par `readonly actionRoll: ActionRollData;`.

- [ ] **Step 6: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent.

- [ ] **Step 7: Commit**

```bash
git add -A front/src/app/bol/session
git commit -m "refactor(jet): extraire le calcul du jet d'action dans un utilitaire pur"
```

---

### Task 3: Surface unique du jet d'action (`bol-action-roll-panel`)

**Files:**
- Rename: `front/src/app/bol/session/play/action-roll-dialog/` → `front/src/app/bol/session/play/action-roll-panel/` (fichiers `action-roll-panel.ts`, `.html`, `.scss`)
- Modify: `front/src/app/bol/session/play/hero-action-panel/hero-action-panel.ts`
- Modify: `front/src/app/bol/session/play/hero-action-panel/hero-action-panel.html`
- Modify: `front/src/app/bol/session/play/hero-action-panel/hero-action-panel.scss`

**Interfaces:**
- Consumes: tout `action-roll.util.ts` (tâche 2).
- Produces: `ActionRollPanelComponent`, sélecteur `bol-action-roll-panel`.
  - `data = input.required<ActionRollData>()`
  - `heroisme = model.required<number>()` (lu et écrit : dépenses de PH)
  - `rolled = output<LastRoll>()` (émis à chaque résultat affiché ou modifié)

- [ ] **Step 1: Renommer les fichiers**

```bash
cd front/src/app/bol/session/play
git mv action-roll-dialog action-roll-panel
git mv action-roll-panel/action-roll-dialog.ts action-roll-panel/action-roll-panel.ts
git mv action-roll-panel/action-roll-dialog.html action-roll-panel/action-roll-panel.html
git mv action-roll-panel/action-roll-dialog.scss action-roll-panel/action-roll-panel.scss
```

- [ ] **Step 2: Réécrire le composant**

Remplacer tout le contenu de `action-roll-panel.ts` par :

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolHerosService} from '../../../services/bol-heros.service';
import {
  ACTION_ATTRIBUTE_LABELS,
  ACTION_ATTRIBUTES,
  ACTION_DIFFICULTIES,
  ACTION_RESULT_LABELS,
  ACTION_ROLL_THRESHOLD,
  ActionAttribute,
  ActionDifficulty,
  actionModifierSum,
  actionResultTone,
  ActionRollCarriere,
  ActionRollData,
  ActionRollParts,
  DEFAULT_ACTION_DIFFICULTY,
  diceCountLabel,
  diceFromTotal,
  formatActionFormula,
  keepBestOrWorstTwo,
  LastRoll,
  netDiceModifier,
  signedModifier,
  suggestedActionResult,
} from '../../action-roll.util';
import {applyHeroismeDelta} from '../../heroisme-spend.util';

/** Jet d'action d'un héros en une seule surface (fiche du jeton, `bol-token-inspector`) : attribut,
 * carrière, difficulté, dés de bonus/malus et ajustements sur des rangées compactes, puis la formule
 * en clair et le résultat. Le calcul est dans `action-roll.util.ts`. */
@Component({
  selector: 'bol-action-roll-panel',
  imports: [MatButtonToggleModule, MatIconModule, MatTooltipModule, DiceBoxHostComponent],
  templateUrl: './action-roll-panel.html',
  styleUrl: './action-roll-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ActionRollPanelComponent {
  readonly data = input.required<ActionRollData>();
  /** Héroïsme courant du héros, partagé avec `bol-hero-resources` : une dépense ici met à jour le
   * stepper d'à côté, et inversement. */
  readonly heroisme = model.required<number>();
  readonly rolled = output<LastRoll>();

  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  protected readonly attributes = ACTION_ATTRIBUTES;
  protected readonly attributeLabels = ACTION_ATTRIBUTE_LABELS;
  protected readonly difficulties = ACTION_DIFFICULTIES;
  protected readonly signed = signedModifier;

  protected readonly attribute = signal<ActionAttribute>('agilite');
  protected readonly difficulty = signal<ActionDifficulty>(DEFAULT_ACTION_DIFFICULTY);
  protected readonly carrieres = computed(() => this.data().carrieres);
  protected readonly carriere = signal<ActionRollCarriere | null>(null);
  protected readonly modifier = signal(0);

  protected readonly avantageTraits = computed(() => this.data().diceTraits.filter((t) => t.kind === 'avantage'));
  protected readonly desavantageTraits = computed(() => this.data().diceTraits.filter((t) => t.kind === 'desavantage'));
  protected readonly selectedDiceTraits = signal<ReadonlySet<string>>(new Set());

  private readonly selectedDiceTraitCounts = computed(() => {
    let avantages = 0;
    let desavantages = 0;
    for (const trait of this.data().diceTraits) {
      if (!this.selectedDiceTraits().has(trait.label)) {
        continue;
      }
      if (trait.kind === 'avantage') {
        avantages++;
      } else {
        desavantages++;
      }
    }
    return {avantages, desavantages};
  });

  private readonly netDice = computed(() => {
    const {avantages, desavantages} = this.selectedDiceTraitCounts();
    return netDiceModifier(avantages, desavantages);
  });

  protected readonly diceCountLabel = computed(() => {
    const {avantages, desavantages} = this.selectedDiceTraitCounts();
    return diceCountLabel(avantages, desavantages);
  });

  protected readonly rollButtonLabel = computed(() => `Lancer ${2 + Math.abs(this.netDice())}d6`);

  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);

  /** Saisie manuelle du total (dés physiques lancés à table) — toujours disponible à côté du lancer virtuel. */
  protected readonly manualTotal = signal<number | null>(null);
  protected readonly manualTotalValid = computed(() => {
    const t = this.manualTotal();
    return t !== null && Number.isInteger(t) && t >= 2 && t <= 12;
  });
  /** true quand le résultat vient d'un total saisi à la main — les deux valeurs de `dice()` sont
   * alors reconstruites (`diceFromTotal`), pas les vraies faces lancées. */
  protected readonly manualEntry = signal(false);

  /** Malus d'équipement, appliqué automatiquement quand l'agilité est sélectionnée. */
  protected readonly equipmentModifier = computed(() =>
    this.attribute() === 'agilite' ? this.data().equipementAgilite : 0,
  );

  private readonly parts = computed<ActionRollParts>(() => ({
    attribute: this.data()[this.attribute()],
    carriere: this.carriere()?.value ?? 0,
    equipment: this.equipmentModifier(),
    difficulty: this.difficulty().modifier,
    modifier: this.modifier(),
  }));

  private readonly modifierSum = computed(() => actionModifierSum(this.parts()));

  /** Avant le jet : `2d6 + …`. Après un lancer virtuel : les deux dés gardés. Après une saisie
   * manuelle : `2d6 + …` (les faces individuelles ne sont pas connues). */
  protected readonly formula = computed(() =>
    formatActionFormula(this.parts(), this.manualEntry() ? null : this.dice()),
  );

  protected readonly total = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] + this.modifierSum() : null;
  });

  protected readonly isNatural2 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 1 && d[1] === 1;
  });

  protected readonly isNatural12 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 6 && d[1] === 6;
  });

  /** Réussite normale (ni 2 ni 12 naturel) — seul ce cas peut être converti en succès héroïque
   * par dépense de PH (02-actions-combat.md). */
  protected readonly canUpgradeToHeroique = computed(() => {
    const d = this.dice();
    if (!d || this.isNatural2() || this.isNatural12()) {
      return false;
    }
    return suggestedActionResult(d, this.modifierSum(), ACTION_ROLL_THRESHOLD) === 'reussite';
  });

  /** Échec critique (2 naturel) — un choix volontaire qui OCTROIE 1 PH. */
  protected readonly critiqueChosen = signal(false);
  /** Succès légendaire (2e dépense sur un 12 naturel) — dépense 1 PH. */
  protected readonly legendaryChosen = signal(false);
  /** Conversion d'une réussite normale en succès héroïque — dépense 1 PH. */
  protected readonly heroicUpgradeChosen = signal(false);

  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    const d = this.dice();
    if (!d) {
      return null;
    }
    if (this.isNatural2()) {
      return this.critiqueChosen() ? 'echec_critique' : 'echec';
    }
    if (this.isNatural12()) {
      return this.legendaryChosen() ? 'legendaire' : 'heroique';
    }
    const base = suggestedActionResult(d, this.modifierSum(), ACTION_ROLL_THRESHOLD);
    return base === 'reussite' && this.heroicUpgradeChosen() ? 'heroique' : base;
  });

  /** Faveur divine n'a de sens que pour retenter un échec. */
  protected readonly isFailure = computed(() => {
    const result = this.suggestedResult();
    return result === 'echec' || result === 'echec_critique';
  });

  protected readonly resultLabel = computed(() => {
    const result = this.suggestedResult();
    return result ? ACTION_RESULT_LABELS[result] : '';
  });

  protected readonly tone = computed(() => {
    const result = this.suggestedResult();
    return result ? actionResultTone(result) : null;
  });

  constructor() {
    // Remonte chaque résultat affiché (lancer, saisie manuelle, changement de palier ou de réglage
    // après coup) pour le bandeau « Dernier jet » de la page.
    effect(() => {
      const result = this.suggestedResult();
      const total = this.total();
      if (result === null || total === null) {
        return;
      }
      this.rolled.emit({
        nom: this.data().heroNom,
        formula: this.formula(),
        total,
        label: ACTION_RESULT_LABELS[result],
        tone: actionResultTone(result),
      });
    });
  }

  protected setAttribute(change: MatButtonToggleChange): void {
    this.attribute.set(change.value as ActionAttribute);
  }

  protected setDifficulty(change: MatButtonToggleChange): void {
    const difficulty = this.difficulties.find((d) => d.label === change.value);
    if (difficulty) {
      this.difficulty.set(difficulty);
    }
  }

  protected setCarriere(change: MatButtonToggleChange): void {
    this.carriere.set(this.carrieres().find((c) => c.label === change.value) ?? null);
  }

  protected isTraitSelected(label: string): boolean {
    return this.selectedDiceTraits().has(label);
  }

  protected toggleDiceTrait(label: string): void {
    this.selectedDiceTraits.update((set) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected incrementModifier(delta: number): void {
    this.modifier.update((m) => m + delta);
  }

  protected async roll(): Promise<void> {
    this.rolling.set(true);
    try {
      const net = this.netDice();
      const count = 2 + Math.abs(net);
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation(`${count}d6`);
      const values = results.map((r) => r.value);
      this.resetTierChoices();
      this.manualEntry.set(false);
      this.manualTotal.set(null);
      this.dice.set(keepBestOrWorstTwo(values, net));
    } finally {
      this.rolling.set(false);
    }
  }

  /** Dégage les dés 3D encore posés (le résultat n'est pas touché). Ignoré pendant un lancer : ce
   * clear() entrerait en course avec celui de `roll()` et corromprait l'état de la librairie de dés. */
  protected dismissDice(): void {
    if (this.rolling()) {
      return;
    }
    void this.diceBox().clear();
  }

  protected onManualTotalInput(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.manualTotal.set(parsed === null || Number.isNaN(parsed) ? null : parsed);
  }

  protected submitManualTotal(): void {
    const total = this.manualTotal();
    if (total === null || !this.manualTotalValid()) {
      return;
    }
    this.resetTierChoices();
    this.manualEntry.set(true);
    this.dice.set(diceFromTotal(total));
  }

  /** Faveur divine (02-actions-combat.md) : dépense 1 PH, relance tous les dés, conserve le second jet. */
  protected async rollWithDivineFavor(): Promise<void> {
    if (this.heroisme() <= 0) {
      return;
    }

    applyHeroismeDelta(this.herosService, this.snackBar, this.data().herosId, this.heroisme, -1);
    await this.roll();
  }

  private resetTierChoices(): void {
    this.critiqueChosen.set(false);
    this.legendaryChosen.set(false);
    this.heroicUpgradeChosen.set(false);
  }

  /** Échec critique (2 naturel) : choisir OCTROIE 1 PH ; revenir en arrière le reprend. */
  protected toggleCritique(): void {
    this.toggleTierChoice(this.critiqueChosen, {spendOnChoose: false});
  }

  /** Succès légendaire (12 naturel) : choisir DÉPENSE 1 PH ; revenir en arrière la rembourse. */
  protected toggleLegendaire(): void {
    this.toggleTierChoice(this.legendaryChosen, {spendOnChoose: true});
  }

  /** Conversion réussite normale → succès héroïque : choisir DÉPENSE 1 PH ; revenir en arrière la rembourse. */
  protected toggleHeroicUpgrade(): void {
    this.toggleTierChoice(this.heroicUpgradeChosen, {spendOnChoose: true});
  }

  private toggleTierChoice(chosen: WritableSignal<boolean>, {spendOnChoose}: {spendOnChoose: boolean}): void {
    const wasChosen = chosen();
    const nextChosen = !wasChosen;
    if (spendOnChoose && nextChosen && this.heroisme() <= 0) {
      return;
    }

    const sign = spendOnChoose ? -1 : 1;
    const delta = nextChosen ? sign : -sign;
    chosen.set(nextChosen);
    applyHeroismeDelta(this.herosService, this.snackBar, this.data().herosId, this.heroisme, delta, () =>
      chosen.set(wasChosen),
    );
  }
}
```

- [ ] **Step 3: Réécrire le template**

Remplacer tout le contenu de `action-roll-panel.html` par :

```html
<div class="ard-shell">
  <app-dice-box-host class="ard-dice-layer" [scale]="4" [theme]="'wooden-red'" [themeColor]="'#ef4444'" />

  <div class="ard-fg" (click)="dismissDice()">
    <div class="ard-row">
      <span class="ard-row-label" id="ard-attr-label">Attribut</span>
      <mat-button-toggle-group
        class="ard-toggle"
        aria-labelledby="ard-attr-label"
        [value]="attribute()"
        [hideSingleSelectionIndicator]="true"
        (change)="setAttribute($event)"
      >
        @for (attr of attributes; track attr) {
          <mat-button-toggle [value]="attr">{{ attributeLabels[attr] }} {{ signed(data()[attr]) }}</mat-button-toggle>
        }
      </mat-button-toggle-group>
    </div>

    @if (carrieres().length) {
      <div class="ard-row">
        <span class="ard-row-label" id="ard-carriere-label">Carrière</span>
        <mat-button-toggle-group
          class="ard-toggle"
          aria-labelledby="ard-carriere-label"
          [value]="carriere()?.label ?? 'aucune'"
          [hideSingleSelectionIndicator]="true"
          (change)="setCarriere($event)"
        >
          <mat-button-toggle value="aucune">Aucune</mat-button-toggle>
          @for (c of carrieres(); track c.label) {
            <mat-button-toggle [value]="c.label">{{ c.label }} {{ signed(c.value) }}</mat-button-toggle>
          }
        </mat-button-toggle-group>
      </div>
    }

    <div class="ard-row">
      <span class="ard-row-label" id="ard-diff-label">
        Difficulté · <b>{{ difficulty().label }}</b>
      </span>
      <mat-button-toggle-group
        class="ard-toggle ard-toggle--scale"
        aria-labelledby="ard-diff-label"
        [value]="difficulty().label"
        [hideSingleSelectionIndicator]="true"
        (change)="setDifficulty($event)"
      >
        @for (d of difficulties; track d.label) {
          <mat-button-toggle [value]="d.label" [aria-label]="d.label + ' ' + signed(d.modifier)" [matTooltip]="d.label">
            {{ signed(d.modifier) }}
          </mat-button-toggle>
        }
      </mat-button-toggle-group>
    </div>

    <div class="ard-row">
      <span class="ard-row-label">Dés et ajustements</span>
      <div class="ard-adjust">
        @for (t of avantageTraits(); track t.label) {
          <button
            type="button"
            class="ard-trait-chip ard-trait-chip--avantage"
            [class.ard-trait-chip--selected]="isTraitSelected(t.label)"
            [attr.aria-pressed]="isTraitSelected(t.label)"
            [matTooltip]="t.domaine ?? ''"
            (click)="toggleDiceTrait(t.label)"
          >
            Dé bonus · {{ t.label }}
          </button>
        }
        @for (t of desavantageTraits(); track t.label) {
          <button
            type="button"
            class="ard-trait-chip ard-trait-chip--desavantage"
            [class.ard-trait-chip--selected]="isTraitSelected(t.label)"
            [attr.aria-pressed]="isTraitSelected(t.label)"
            [matTooltip]="t.domaine ?? ''"
            (click)="toggleDiceTrait(t.label)"
          >
            Dé malus · {{ t.label }}
          </button>
        }
        <div class="ard-stepper">
          <button type="button" aria-label="Diminuer le modificateur" (click)="incrementModifier(-1)">−</button>
          <span>{{ signed(modifier()) }}</span>
          <button type="button" aria-label="Augmenter le modificateur" (click)="incrementModifier(1)">+</button>
        </div>
        @if (equipmentModifier() !== 0) {
          <span class="ard-equip-chip">Équipement {{ signed(equipmentModifier()) }}</span>
        }
      </div>
      @if (diceCountLabel(); as label) {
        <span class="ard-trait-summary">{{ label }}</span>
      }
    </div>

    <div class="ard-ledger-formula">
      <span>{{ formula() }}</span>
      <span class="ard-heroisme-badge" [matTooltip]="'Points d’héroïsme'">
        <mat-icon>military_tech</mat-icon>
        {{ heroisme() }}
      </span>
    </div>

    <div class="ard-result-row">
      <div
        class="ard-ticket"
        [class.ard-ticket--reussite]="tone() === 'reussite'"
        [class.ard-ticket--echec]="tone() === 'echec'"
        [class.ard-ticket--heroique]="tone() === 'heroique'"
      >
        <div class="ard-ticket-total">{{ total() ?? '—' }}</div>
        <p class="ard-ticket-label">{{ dice() ? resultLabel() : 'En attente' }}</p>
        @if (manualEntry()) {
          <span class="ard-manual-badge">Saisie manuelle</span>
        }
      </div>

      <button type="button" class="ard-reroll" [disabled]="rolling()" (click)="roll()">
        <mat-icon>casino</mat-icon>
        {{ dice() ? 'Relancer' : rollButtonLabel() }}
      </button>
    </div>

    <div class="ard-manual">
      <span class="ard-manual-hint">ou table&nbsp;:</span>
      <input
        id="ard-manual-total"
        type="number"
        min="2"
        max="12"
        step="1"
        placeholder="2-12"
        aria-label="Total des deux dés lancés à table"
        [value]="manualTotal() ?? ''"
        (input)="onManualTotalInput($any($event.target).value)"
        (keydown.enter)="submitManualTotal()"
      />
      <button
        type="button"
        class="ard-manual-confirm"
        aria-label="Valider le total saisi"
        [disabled]="!manualTotalValid()"
        (click)="submitManualTotal()"
      >
        <mat-icon>check</mat-icon>
      </button>
    </div>

    @if (isFailure()) {
      <button
        type="button"
        class="ard-divine-favor"
        [disabled]="rolling() || heroisme() <= 0"
        [matTooltip]="'Relance tous les dés, conserve le second résultat (02-actions-combat.md)'"
        (click)="rollWithDivineFavor()"
      >
        <mat-icon>auto_awesome</mat-icon>
        Faveur divine (−1 PH)
      </button>
    }

    @if (isNatural2()) {
      <button type="button" class="ard-tier-toggle ard-tier-toggle--critique" [class.active]="critiqueChosen()" (click)="toggleCritique()">
        <mat-icon>{{ critiqueChosen() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
        Échec critique (+1 PH)
      </button>
    } @else if (isNatural12()) {
      <button
        type="button"
        class="ard-tier-toggle ard-tier-toggle--upgrade"
        [class.active]="legendaryChosen()"
        [disabled]="!legendaryChosen() && heroisme() <= 0"
        (click)="toggleLegendaire()"
      >
        <mat-icon>{{ legendaryChosen() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
        Succès légendaire (−1 PH)
      </button>
    } @else if (canUpgradeToHeroique()) {
      <button
        type="button"
        class="ard-tier-toggle ard-tier-toggle--upgrade"
        [class.active]="heroicUpgradeChosen()"
        [disabled]="!heroicUpgradeChosen() && heroisme() <= 0"
        (click)="toggleHeroicUpgrade()"
      >
        <mat-icon>{{ heroicUpgradeChosen() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
        Convertir en succès héroïque (−1 PH)
      </button>
    }
  </div>
</div>
```

- [ ] **Step 4: Adapter la feuille de style**

Dans `action-roll-panel.scss` :

1. Corriger l'import en tête (le dossier a changé de nom, pas de profondeur) : la ligne `@use '../../roll-dialog-shared' as shared;` reste valide, ne pas la modifier.

2. **Supprimer** les blocs de règles suivants, avec leurs commentaires : `.ard-body`, `.ard-steps`, `.ard-step`, `.ard-step-head`, `.ard-step-num`, `.ard-step-title`, `.ard-step-hint`, `.ard-substep`, `.ard-substep-label`, `.ard-diff-rail`, `.ard-ledger`, `.ard-ledger-title`, `.ard-ledger-line`, `.ard-die`, `.ard-toggle-stack`, `.ard-modifier-row`.

3. **Remplacer** les blocs `:host`, `.ard-shell` et `.ard-fg` par :

```scss
// Embarqué dans la fiche du jeton (`bol-token-inspector`), qui scrolle elle-même : ce composant
// prend la hauteur de son contenu, les dés roulent sur toute sa surface.
:host {
  display: block;
}

.ard-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--dw-color-legendary) 35%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--dw-color-legendary) 6%, var(--dw-surface-0) 94%);
}

.ard-fg {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem 1rem;
}
```

4. **Remplacer** le bloc `.ard-ledger-formula` par :

```scss
// Formule en clair + rappel de l'héroïsme disponible, sur une même ligne.
.ard-ledger-formula {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px dashed color-mix(in srgb, var(--dw-border) 80%, transparent);
  font-family: 'Muse Display Harmony', serif;
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
  color: var(--dw-color-legendary);
}
```

5. Dans le bloc `.ard-result-row`, supprimer `margin-top: 0.65rem;` (l'espacement vient du `gap` de `.ard-fg`). Faire de même pour `margin-top` de `.ard-manual` et `margin: 0.6rem 0 0;` de `.ard-divine-favor` (le remplacer par `margin: 0;`).

6. **Ajouter** à la fin du fichier :

```scss
// Rangée compacte : un libellé au-dessus de son contrôle. Remplace les trois étapes numérotées.
.ard-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ard-row-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--dw-surface-500);

  b {
    color: var(--dw-color-legendary);
  }
}

// Réglette de difficulté : huit segments d'un seul tenant, seul le modificateur est écrit dans la
// case (le libellé complet est dans l'infobulle, l'aria-label et le titre de la rangée).
.ard-toggle--scale.mat-button-toggle-group .mat-button-toggle-label-content {
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.ard-adjust {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}
```

- [ ] **Step 5: Rebrancher temporairement l'ancien panneau à onglets**

`hero-action-panel` est supprimé à la tâche 7 ; d'ici là il doit compiler avec le nouveau composant.

Dans `hero-action-panel.ts` :
- remplacer l'import `ActionRollDialogComponent` par `import {ActionRollPanelComponent} from '../action-roll-panel/action-roll-panel';` ;
- dans `imports` du décorateur, remplacer `ActionRollDialogComponent` par `ActionRollPanelComponent` ;
- ajouter dans la classe :

```ts
  protected readonly heroisme = signal(0);
```

- et compléter `ngOnInit` :

```ts
  ngOnInit(): void {
    this.activeTab.set(this.initialTab());
    this.heroisme.set(this.data().actionRoll.heroisme);
  }
```

Dans `hero-action-panel.html`, remplacer `<bol-action-roll-dialog [data]="data().actionRoll" />` par :

```html
      <bol-action-roll-panel [data]="data().actionRoll" [(heroisme)]="heroisme" />
```

Dans `hero-action-panel.scss`, remplacer le sélecteur `.hap-body bol-action-roll-dialog` par `.hap-body bol-action-roll-panel`, et ajouter `overflow-y: auto;` au bloc `.hap-body`.

- [ ] **Step 6: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tests verts.

- [ ] **Step 7: Commit**

```bash
git add -A front/src/app/bol/session/play
git commit -m "feat(jet): jet d'action en une seule surface (bol-action-roll-panel)"
```

---

### Task 4: Ressources du héros (`bol-hero-resources`)

**Files:**
- Create: `front/src/app/bol/session/value-tracker.ts`
- Create: `front/src/app/bol/session/value-tracker.spec.ts`
- Create: `front/src/app/bol/session/play/hero-resources/hero-resources.ts`
- Modify: `front/src/app/bol/session/play/hero-statblock-dialog/hero-statblock-dialog.ts`
- Modify: `front/src/app/bol/session/play/hero-statblock-dialog/hero-statblock-dialog.html`
- Modify: `front/src/app/bol/session/play/hero-statblock-dialog/hero-statblock-dialog.scss`

**Interfaces:**
- Produces:
  - `class ValueTracker` : `constructor(initial?: number)`, `get value(): number`, `reset(value: number): void`, `take(next: number): number` (renvoie le delta et mémorise `next` tout de suite).
  - `HeroResourcesComponent`, sélecteur `bol-hero-resources` : `data = input.required<HeroResourcesData>()`, `heroisme = model.required<number>()`, `changed = output<void>()`.
  - `interface HeroResourcesData { sessionId: string; herosId: string; pivotId: number; heroNom: string; vitaliteCourante: number; vitaliteMax: number }` — `HeroStatblockDialogData` en est un sur-ensemble structurel et peut être passé tel quel.

- [ ] **Step 1: Écrire le test qui échoue (Review Focus 1)**

Créer `front/src/app/bol/session/value-tracker.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {ValueTracker} from './value-tracker';

describe('ValueTracker', () => {
  it('returns the delta from the initial value', () => {
    const tracker = new ValueTracker(9);
    expect(tracker.take(8)).toBe(-1);
  });

  it('counts each rapid step once, even before the server has answered', () => {
    const tracker = new ValueTracker(9);
    expect(tracker.take(8)).toBe(-1);
    expect(tracker.take(7)).toBe(-1);
    expect(tracker.value).toBe(7);
  });

  it('returns 0 when the value has not changed', () => {
    const tracker = new ValueTracker(5);
    expect(tracker.take(5)).toBe(0);
  });

  it('starts again from the value given to reset', () => {
    const tracker = new ValueTracker(9);
    tracker.take(7);
    tracker.reset(9);
    expect(tracker.take(10)).toBe(1);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd front && npx ng test --watch=false --include "**/value-tracker.spec.ts"`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Écrire `ValueTracker`**

Créer `front/src/app/bol/session/value-tracker.ts` :

```ts
/** Suit la dernière valeur envoyée au serveur pour un compteur piloté par stepper (vitalité) et
 * calcule le delta du prochain envoi. `take` mémorise la nouvelle valeur immédiatement, sans attendre
 * la réponse : deux clics rapides envoient deux deltas de 1, pas 1 puis 2. */
export class ValueTracker {
  private last: number;

  constructor(initial = 0) {
    this.last = initial;
  }

  get value(): number {
    return this.last;
  }

  reset(value: number): void {
    this.last = value;
  }

  take(next: number): number {
    const delta = next - this.last;
    this.last = next;
    return delta;
  }
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd front && npx ng test --watch=false --include "**/value-tracker.spec.ts"`
Expected: PASS.

- [ ] **Step 5: Créer `bol-hero-resources`**

Créer `front/src/app/bol/session/play/hero-resources/hero-resources.ts` :

```ts
import {ChangeDetectionStrategy, Component, effect, inject, input, model, OnInit, output, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {ValueTracker} from '../../value-tracker';
import {maybePromptDefierLaMort} from '../defier-la-mort-dialog/defier-la-mort.util';

export interface HeroResourcesData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
}

/** Vitalité de session et héroïsme d'un héros, ajustables par stepper et persistés à chaque pas.
 * Utilisé en tête de la fiche du jeton (`bol-token-inspector`) et dans l'en-tête du statbloc héros
 * (`bol-hero-statblock-dialog`). L'héroïsme est un `model` : le parent peut le partager avec le jet
 * d'action, qui en dépense. */
@Component({
  selector: 'bol-hero-resources',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  template: `
    <div class="hrs-field">
      <span class="hrs-label">Vitalité ({{ vitalite() }} / {{ data().vitaliteMax }})</span>
      <dw-value-stepper [formControl]="vitaliteControl" [min]="-20" [max]="data().vitaliteMax" [ariaLabel]="'Vitalité'" />
    </div>
    <div class="hrs-field">
      <span class="hrs-label">Héroïsme ({{ heroisme() }})</span>
      <dw-value-stepper [formControl]="heroismeControl" [min]="0" [ariaLabel]="'Héroïsme'" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem;
    }

    .hrs-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }

    .hrs-label {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--dw-surface-500);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroResourcesComponent implements OnInit {
  readonly data = input.required<HeroResourcesData>();
  readonly heroisme = model.required<number>();
  /** Une valeur a été persistée : le parent recharge la session. */
  readonly changed = output<void>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  protected readonly heroismeControl = new FormControl(0, {nonNullable: true});
  /** Miroir en signal de la vitalité affichée dans le libellé (un `FormControl.value` lu dans un
   * template OnPush ne se rafraîchit pas après un `setValue` venu d'un callback asynchrone). */
  protected readonly vitalite = signal(0);

  private readonly vitaliteTracker = new ValueTracker();

  constructor() {
    // L'héroïsme peut changer hors de ce composant (dépense dans le jet d'action) : le stepper suit.
    effect(() => {
      const heroisme = this.heroisme();
      if (heroisme !== this.heroismeControl.value) {
        this.heroismeControl.setValue(heroisme, {emitEvent: false});
      }
    });

    this.vitaliteControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onVitaliteChange(value));
    this.heroismeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onHeroismeChange(value));
  }

  // Valeurs initiales posées ici (pas en initialiseur de champ) : un input required n'a pas encore
  // de valeur à ce moment-là (NG8118).
  ngOnInit(): void {
    this.setVitalite(this.data().vitaliteCourante);
  }

  private setVitalite(value: number): void {
    this.vitaliteTracker.reset(value);
    this.vitalite.set(value);
    this.vitaliteControl.setValue(value, {emitEvent: false});
  }

  private onVitaliteChange(value: number): void {
    const previous = this.vitaliteTracker.value;
    const delta = this.vitaliteTracker.take(value);
    if (delta === 0) {
      return;
    }

    this.vitalite.set(value);
    const data = this.data();
    this.fightSessionService.applyDamage(data.sessionId, 'hero', data.pivotId, delta).subscribe({
      next: () => {
        this.changed.emit();

        if (value < 0) {
          maybePromptDefierLaMort({
            dialog: this.dialog,
            fightSessionService: this.fightSessionService,
            herosService: this.herosService,
            sessionId: data.sessionId,
            herosId: data.herosId,
            pivotId: data.pivotId,
            heroNom: data.heroNom,
            vitaliteCourante: value,
            heroisme: this.heroisme(),
            onApplied: () => {
              if (value >= -5) {
                this.setVitalite(0);
              }
              this.heroisme.update((h) => h - 1);
            },
          });
        }
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.setVitalite(previous);
      },
    });
  }

  private onHeroismeChange(value: number): void {
    const previous = this.heroisme();
    const delta = value - previous;
    if (delta === 0) {
      return;
    }

    this.heroisme.set(value);
    this.herosService.adjustHeroisme(this.data().herosId, delta).subscribe({
      next: () => this.changed.emit(),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
          duration: 5000,
        });
        this.heroisme.set(previous);
      },
    });
  }
}
```

- [ ] **Step 6: Faire utiliser le composant par le statbloc héros**

Dans `hero-statblock-dialog.ts` :
- retirer des imports : `ChangeDetectorRef`, `FormControl`, `ReactiveFormsModule`, `MatDialog`, `DwValueStepperComponent`, `BolFightSessionService`, `maybePromptDefierLaMort` ;
- ajouter : `import {HeroResourcesComponent} from '../hero-resources/hero-resources';` ;
- dans `imports` du décorateur : retirer `ReactiveFormsModule` et `DwValueStepperComponent`, ajouter `HeroResourcesComponent` ;
- dans la classe, supprimer `fightSessionService`, `dialog`, `changeDetectorRef`, `vitaliteControl`, `heroismeControl`, `lastVitalite`, `lastHeroisme`, `onVitaliteChange`, `onHeroismeChange` ;
- ajouter le champ :

```ts
  protected readonly heroisme = signal(0);
```

- remplacer `ngOnInit` par :

```ts
  ngOnInit(): void {
    const data = this.data();
    this.heroisme.set(data.heroisme);
    this.armures.set(
      data.armures
        .filter((entry): entry is BolHerosArmureModel & {armure: BolArmureModel} => Boolean(entry.armure))
        .map((entry) => ({id: entry.armure_id, equipee: entry.equipee, armure: entry.armure})),
    );
  }
```

`herosService`, `snackBar`, `armures`, `armureEntries` et `toggleArmureEquipped` restent inchangés.

Dans `hero-statblock-dialog.html`, remplacer le bloc `<div statblockHeaderExtra class="hsd-header-steppers">…</div>` (les deux `hsd-stepper-field` compris) par :

```html
    <bol-hero-resources
      statblockHeaderExtra
      class="hsd-header-steppers"
      [data]="data()"
      [(heroisme)]="heroisme"
      (changed)="changed.emit()"
    />
```

Dans `hero-statblock-dialog.scss`, remplacer les blocs `.hsd-header-steppers` et `.hsd-stepper-field` par :

```scss
// Projeté dans l'en-tête de `bol-statblock` (slot `[statblockHeaderExtra]`), à droite du nom. La
// mise en page interne des steppers appartient à `bol-hero-resources`.
.hsd-header-steppers {
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;
}
```

- [ ] **Step 7: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tests verts.

- [ ] **Step 8: Commit**

```bash
git add -A front/src/app/bol/session
git commit -m "refactor(session): extraire les ressources du héros (bol-hero-resources)"
```

---

### Task 5: Réserve (`bol-reserve`)

**Files:**
- Create: `front/src/app/bol/session/play/reserve/reserve.util.ts`
- Create: `front/src/app/bol/session/play/reserve/reserve.util.spec.ts`
- Create: `front/src/app/bol/session/play/reserve/reserve.ts`
- Create: `front/src/app/bol/session/play/reserve/reserve.html`
- Create: `front/src/app/bol/session/play/reserve/reserve.scss`

**Interfaces:**
- Consumes: `CombatSelectionService.catalog` / `.loading` / `.loadCatalog()`, `CombatCatalogEntry`, `CombatantKind` (`bol/services/combat-selection.service.ts`) ; `BolFightSessionService.addCombatant(sessionId, {kind, sourceId, camp})` ; `resolveAddCombatantCamp(kind, 'adversaires')` (`add-combatant-dialog.ts`).
- Produces:
  - `RESERVE_TABS: readonly ReserveTab[]`, `reserveTab(kind): ReserveTab`, `filterReserve(catalog, kind, query): CombatCatalogEntry[]`, `isOnTable(entry, heroIds, pnjIds): boolean`
  - `ReserveComponent`, sélecteur `bol-reserve` : `sessionId = input.required<string>()`, `existingHeroIds = input.required<ReadonlySet<string>>()`, `existingPnjIds = input.required<ReadonlySet<string>>()`, `placed = output<void>()`.

- [ ] **Step 1: Écrire le test qui échoue (Review Focus 2)**

Créer `front/src/app/bol/session/play/reserve/reserve.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {CombatCatalogEntry, CombatantKind} from '../../../services/combat-selection.service';
import {filterReserve, isOnTable, RESERVE_TABS, reserveTab} from './reserve.util';

function entry(kind: CombatantKind, sourceId: string, nom: string): CombatCatalogEntry {
  return {catalogId: `${kind}:${sourceId}`, kind, sourceId, nom, vitalite: 10, avatar: ''} as CombatCatalogEntry;
}

const CATALOG: readonly CombatCatalogEntry[] = [
  entry('pnj', 'p2', 'Surdral Prados'),
  entry('pnj', 'p1', 'Prêtre de Shazzadion'),
  entry('hero', 'h1', 'Kalena'),
  entry('creature', 'c1', 'Hippocampe'),
];

describe('filterReserve', () => {
  it('keeps only the entries of the requested kind, sorted by name', () => {
    expect(filterReserve(CATALOG, 'pnj', '').map((e) => e.nom)).toEqual(['Prêtre de Shazzadion', 'Surdral Prados']);
  });

  it('finds an accented name from an unaccented, lower-case query', () => {
    expect(filterReserve(CATALOG, 'pnj', 'pretre').map((e) => e.nom)).toEqual(['Prêtre de Shazzadion']);
  });

  it('ignores surrounding spaces in the query', () => {
    expect(filterReserve(CATALOG, 'hero', '  kal ').map((e) => e.nom)).toEqual(['Kalena']);
  });

  it('returns nothing when no name matches', () => {
    expect(filterReserve(CATALOG, 'creature', 'dragon')).toEqual([]);
  });
});

describe('isOnTable', () => {
  const heroIds = new Set(['h1']);
  const pnjIds = new Set(['p1']);

  it('is true for a hero or a PNJ already in the session', () => {
    expect(isOnTable(entry('hero', 'h1', 'Kalena'), heroIds, pnjIds)).toBe(true);
    expect(isOnTable(entry('pnj', 'p1', 'Prêtre'), heroIds, pnjIds)).toBe(true);
  });

  it('is false for a hero or a PNJ not yet in the session', () => {
    expect(isOnTable(entry('hero', 'h2', 'Rork'), heroIds, pnjIds)).toBe(false);
    expect(isOnTable(entry('pnj', 'p2', 'Surdral'), heroIds, pnjIds)).toBe(false);
  });

  it('is always false for creatures and demons, which can be placed several times', () => {
    expect(isOnTable(entry('creature', 'h1', 'Hippocampe'), heroIds, pnjIds)).toBe(false);
    expect(isOnTable(entry('demon', 'p1', 'Démon'), heroIds, pnjIds)).toBe(false);
  });

  it('compares ids as strings (the API mixes integer and UUID ids)', () => {
    const numeric = {...entry('hero', '7', 'Thaïs'), sourceId: 7 as unknown as string};
    expect(isOnTable(numeric, new Set(['7']), new Set())).toBe(true);
  });
});

describe('RESERVE_TABS', () => {
  it('lists the four kinds in display order', () => {
    expect(RESERVE_TABS.map((t) => t.kind)).toEqual(['hero', 'pnj', 'creature', 'demon']);
  });

  it('resolves a tab from its kind', () => {
    expect(reserveTab('demon').createLink).toBe('/create/demon');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd front && npx ng test --watch=false --include "**/reserve.util.spec.ts"`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Écrire l'utilitaire**

Créer `front/src/app/bol/session/play/reserve/reserve.util.ts` :

```ts
import {CombatCatalogEntry, CombatantKind} from '../../../services/combat-selection.service';

export interface ReserveTab {
  readonly kind: CombatantKind;
  readonly label: string;
  readonly createLabel: string;
  readonly createLink: string;
  readonly libraryLink: string;
}

/** Onglets de la réserve, dans l'ordre d'affichage. Une donnée (pas du template) pour qu'un onglet
 * « Scènes » s'ajoute plus tard sans refonte. */
export const RESERVE_TABS: readonly ReserveTab[] = [
  {kind: 'hero', label: 'Héros', createLabel: 'Créer un héros', createLink: '/create/hero', libraryLink: '/library/heroes'},
  {kind: 'pnj', label: 'PNJ', createLabel: 'Créer un PNJ', createLink: '/create/pnj', libraryLink: '/library/pnjs'},
  {
    kind: 'creature',
    label: 'Créatures',
    createLabel: 'Créer une créature',
    createLink: '/create/creature',
    libraryLink: '/library/creatures',
  },
  {kind: 'demon', label: 'Démons', createLabel: 'Créer un démon', createLink: '/create/demon', libraryLink: '/library/demons'},
];

export function reserveTab(kind: CombatantKind): ReserveTab {
  return RESERVE_TABS.find((tab) => tab.kind === kind) ?? RESERVE_TABS[0];
}

/** Minuscules sans diacritiques : « Prêtre » et « pretre » se valent pour la recherche. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase()
    .trim();
}

/** Entrées du catalogue pour un onglet, filtrées par nom et triées par ordre alphabétique. */
export function filterReserve(
  catalog: readonly CombatCatalogEntry[],
  kind: CombatantKind,
  query: string,
): CombatCatalogEntry[] {
  const term = normalize(query);
  return catalog
    .filter((entry) => entry.kind === kind && (!term || normalize(entry.nom).includes(term)))
    .sort((left, right) => left.nom.localeCompare(right.nom, 'fr'));
}

/** Un héros ou un PNJ ne figure qu'une fois dans une session ; créatures et démons sont des gabarits
 * ré-instanciables, jamais « déjà à table ». */
export function isOnTable(
  entry: CombatCatalogEntry,
  heroIds: ReadonlySet<string>,
  pnjIds: ReadonlySet<string>,
): boolean {
  const sourceId = String(entry.sourceId);
  if (entry.kind === 'hero') {
    return heroIds.has(sourceId);
  }
  if (entry.kind === 'pnj') {
    return pnjIds.has(sourceId);
  }
  return false;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd front && npx ng test --watch=false --include "**/reserve.util.spec.ts"`
Expected: PASS.

- [ ] **Step 5: Écrire le composant**

Créer `front/src/app/bol/session/play/reserve/reserve.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBar} from '@angular/material/snack-bar';
import {RouterLink} from '@angular/router';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {CombatCatalogEntry, CombatantKind, CombatSelectionService} from '../../../services/combat-selection.service';
import {resolveAddCombatantCamp} from '../add-combatant-dialog/add-combatant-dialog';
import {filterReserve, isOnTable, RESERVE_TABS, reserveTab} from './reserve.util';

interface ReserveRow {
  readonly entry: CombatCatalogEntry;
  readonly onTable: boolean;
}

/** Réserve de la table (mode libre) : les quatre bibliothèques en onglets, avec recherche. « Poser »
 * ajoute le personnage à la session ; la page recharge la session sur `placed`. */
@Component({
  selector: 'bol-reserve',
  imports: [RouterLink, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './reserve.html',
  styleUrl: './reserve.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReserveComponent {
  private readonly selection = inject(CombatSelectionService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  /** Ids source (heros_id / pnj_id) déjà présents dans la session. */
  readonly existingHeroIds = input.required<ReadonlySet<string>>();
  readonly existingPnjIds = input.required<ReadonlySet<string>>();
  readonly placed = output<void>();

  protected readonly tabs = RESERVE_TABS;
  protected readonly activeKind = signal<CombatantKind>('hero');
  protected readonly activeTab = computed(() => reserveTab(this.activeKind()));
  protected readonly query = signal('');
  protected readonly loading = this.selection.loading;
  /** Entrée en cours de pose : désactive tous les boutons « Poser » le temps de la requête. */
  protected readonly pendingCatalogId = signal<string | null>(null);

  protected readonly rows = computed<readonly ReserveRow[]>(() =>
    filterReserve(this.selection.catalog(), this.activeKind(), this.query()).map((entry) => ({
      entry,
      onTable: isOnTable(entry, this.existingHeroIds(), this.existingPnjIds()),
    })),
  );

  /** État de navigation des liens « Créer » / « Gérer » : revenir sur cette table après coup. */
  protected readonly navState = computed(() => ({returnUrl: `/session/${this.sessionId()}/play`}));

  constructor() {
    this.selection.loadCatalog();
  }

  protected setKind(change: MatButtonToggleChange): void {
    this.activeKind.set(change.value as CombatantKind);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected place(entry: CombatCatalogEntry): void {
    if (this.pendingCatalogId()) {
      return;
    }

    this.pendingCatalogId.set(entry.catalogId);
    this.fightSessionService
      .addCombatant(this.sessionId(), {
        kind: entry.kind,
        sourceId: entry.sourceId,
        camp: resolveAddCombatantCamp(entry.kind, 'adversaires'),
      })
      .subscribe({
        next: () => {
          this.pendingCatalogId.set(null);
          this.snackBar.open(`${entry.nom} posé sur la table.`, undefined, {duration: 2000});
          this.placed.emit();
        },
        error: (error: unknown) => {
          this.pendingCatalogId.set(null);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de poser ce personnage.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
  }
}
```

Créer `front/src/app/bol/session/play/reserve/reserve.html` :

```html
<div class="rsv-shell">
  <h2 class="rsv-title">Réserve</h2>

  <mat-button-toggle-group
    class="rsv-tabs"
    aria-label="Type de personnage"
    [value]="activeKind()"
    [hideSingleSelectionIndicator]="true"
    (change)="setKind($event)"
  >
    @for (tab of tabs; track tab.kind) {
      <mat-button-toggle [value]="tab.kind">{{ tab.label }}</mat-button-toggle>
    }
  </mat-button-toggle-group>

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

  <ul class="rsv-list">
    @for (row of rows(); track row.entry.catalogId) {
      <li class="rsv-row">
        <span [class]="'rsv-dot rsv-dot--' + row.entry.kind"></span>
        <span class="rsv-name">{{ row.entry.nom }}</span>
        @if (row.onTable) {
          <span class="rsv-state">à table</span>
        } @else {
          <button
            mat-stroked-button
            size="small"
            type="button"
            [disabled]="pendingCatalogId() !== null"
            [attr.aria-label]="'Poser ' + row.entry.nom + ' sur la table'"
            (click)="place(row.entry)"
          >
            Poser
          </button>
        }
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

  <div class="rsv-footer">
    <a mat-flat-button size="small" [routerLink]="activeTab().createLink" [state]="navState()">
      <mat-icon>add</mat-icon> {{ activeTab().createLabel }}
    </a>
    <a mat-stroked-button size="small" [routerLink]="activeTab().libraryLink" [state]="navState()">
      Gérer la bibliothèque
    </a>
  </div>
</div>
```

Créer `front/src/app/bol/session/play/reserve/reserve.scss` :

```scss
:host {
  display: block;
  height: 100%;
}

.rsv-shell {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  height: 100%;
  padding: 0.8rem 0.7rem;
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
  display: flex;
  flex-shrink: 0;

  .mat-button-toggle {
    flex: 1 1 0;
    min-width: 0;
  }
}

.rsv-search {
  flex-shrink: 0;
}

.rsv-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent;
}

.rsv-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.4rem;
  padding: 0.2rem 0.1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--dw-border) 60%, transparent);
}

.rsv-dot {
  flex-shrink: 0;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
}

.rsv-dot--hero { background: var(--dw-color-reussite); }
.rsv-dot--pnj { background: var(--dw-color-pnj); }
.rsv-dot--creature { background: var(--dw-color-creature); }
.rsv-dot--demon { background: var(--dw-color-demon); }

.rsv-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88rem;
  color: var(--dw-surface-700);
}

.rsv-state {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--dw-surface-500);
}

.rsv-empty {
  padding: 1rem 0.2rem;
  font-size: 0.85rem;
  color: var(--dw-surface-500);
}

.rsv-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
```

- [ ] **Step 6: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi (le composant n'est pas encore utilisé, il doit seulement compiler), tests verts.

- [ ] **Step 7: Commit**

```bash
git add front/src/app/bol/session/play/reserve
git commit -m "feat(session): réserve de la table (bol-reserve)"
```

---

### Task 6: Fiche du jeton (`bol-token-inspector`)

**Files:**
- Create: `front/src/app/bol/session/play/token-inspector/token-inspector.ts`
- Create: `front/src/app/bol/session/play/token-inspector/token-inspector.html`
- Create: `front/src/app/bol/session/play/token-inspector/token-inspector.scss`

**Interfaces:**
- Consumes: `ActionRollPanelComponent` (tâche 3), `HeroResourcesComponent` + `HeroResourcesData` (tâche 4), `ValueTracker` (tâche 4), `LastRoll` + `ActionRollData` (tâche 2), `PlayToken` (`combat-play.util.ts`), `BolStatblockComponent` + `BolStatblockData` (`bol/shared/statblock/bol-statblock.component.ts`), `BolFightSessionService.applyDamage(sessionId, kind, pivotId, delta, instanceIndex)`.
- Produces: `TokenInspectorComponent`, sélecteur `bol-token-inspector` :
  - `token = input.required<PlayToken>()`
  - `sessionId = input.required<string>()`
  - `hero = input<TokenInspectorHeroData | null>(null)` — données du héros, `null` tant qu'elles chargent
  - `statblock = input<BolStatblockData | null>(null)` — statbloc d'un PNJ / créature / démon
  - `returnUrl = input<string | null>(null)`
  - sorties `closed`, `changed` (`void`), `rolled` (`LastRoll`), `removeRequested`, `fullSheetRequested` (`PlayToken`)
  - `interface TokenInspectorHeroData { readonly resources: HeroResourcesData; readonly actionRoll: ActionRollData }`

- [ ] **Step 1: Écrire le composant**

Créer `front/src/app/bol/session/play/token-inspector/token-inspector.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolStatblockComponent, BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {ActionRollData, LastRoll} from '../../action-roll.util';
import {PlayToken} from '../../combat-play.util';
import {ValueTracker} from '../../value-tracker';
import {ActionRollPanelComponent} from '../action-roll-panel/action-roll-panel';
import {HeroResourcesComponent, HeroResourcesData} from '../hero-resources/hero-resources';

export interface TokenInspectorHeroData {
  readonly resources: HeroResourcesData;
  readonly actionRoll: ActionRollData;
}

const KIND_LABELS: Record<PlayToken['kind'], string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Fiche du jeton sélectionné sur la table (mode libre). Héros : ressources, jet d'action, accès à la
 * fiche complète. PNJ / créature / démon : vitalité, statbloc, retrait de la table. Ne recharge rien
 * elle-même : toute modification remonte à `session-play-page` par événement. */
@Component({
  selector: 'bol-token-inspector',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    DwValueStepperComponent,
    BolStatblockComponent,
    ActionRollPanelComponent,
    HeroResourcesComponent,
  ],
  templateUrl: './token-inspector.html',
  styleUrl: './token-inspector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenInspectorComponent {
  readonly token = input.required<PlayToken>();
  readonly sessionId = input.required<string>();
  readonly hero = input<TokenInspectorHeroData | null>(null);
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);

  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<PlayToken>();
  readonly fullSheetRequested = output<PlayToken>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  /** Héroïsme vivant du héros affiché, partagé entre les ressources et le jet d'action. Repart de la
   * valeur chargée à chaque nouveau héros. */
  protected readonly heroisme = linkedSignal(() => this.hero()?.actionRoll.heroisme ?? 0);

  protected readonly subtitle = computed(() => {
    const hero = this.hero();
    if (this.token().kind === 'hero' && hero) {
      const carrieres = hero.actionRoll.carrieres.map((c) => `${c.label} ${c.value}`).join(' · ');
      return carrieres || KIND_LABELS.hero;
    }
    return KIND_LABELS[this.token().kind];
  });

  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  private readonly vitaliteTracker = new ValueTracker();

  constructor() {
    // La vitalité d'un non-héros vient du snapshot de session : le stepper suit chaque rechargement
    // (et chaque changement de jeton, la fiche étant réutilisée d'un jeton à l'autre).
    effect(() => {
      const vitalite = this.token().vitaliteCourante ?? 0;
      this.vitaliteTracker.reset(vitalite);
      if (vitalite !== this.vitaliteControl.value) {
        this.vitaliteControl.setValue(vitalite, {emitEvent: false});
      }
    });

    this.vitaliteControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onVitaliteChange(value));
  }

  private onVitaliteChange(value: number): void {
    const previous = this.vitaliteTracker.value;
    const delta = this.vitaliteTracker.take(value);
    if (delta === 0) {
      return;
    }

    const token = this.token();
    this.fightSessionService
      .applyDamage(this.sessionId(), token.kind, token.pivotId, delta, token.instanceIndex)
      .subscribe({
        next: () => this.changed.emit(),
        error: (error: unknown) => {
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
            duration: 5000,
          });
          this.vitaliteTracker.reset(previous);
          this.vitaliteControl.setValue(previous, {emitEvent: false});
        },
      });
  }
}
```

Créer `front/src/app/bol/session/play/token-inspector/token-inspector.html` :

```html
<div class="tki-shell">
  <header class="tki-header">
    <div class="tki-title">
      <h2 [class]="'tki-name tki-name--' + token().kind">{{ token().nom }}</h2>
      <p class="tki-sub">{{ subtitle() }}</p>
    </div>
    <button mat-icon-button type="button" aria-label="Fermer la fiche" (click)="closed.emit()">
      <mat-icon>close</mat-icon>
    </button>
  </header>

  <div class="tki-body">
    @if (token().kind === 'hero') {
      @if (hero(); as h) {
        <bol-hero-resources [data]="h.resources" [(heroisme)]="heroisme" (changed)="changed.emit()" />
        <bol-action-roll-panel [data]="h.actionRoll" [(heroisme)]="heroisme" (rolled)="rolled.emit($event)" />
        <button mat-stroked-button type="button" (click)="fullSheetRequested.emit(token())">
          <mat-icon>badge</mat-icon> Fiche complète
        </button>
      } @else {
        <p class="tki-loading">Chargement de la fiche…</p>
      }
    } @else {
      @if (token().vitaliteMax !== null) {
        <div class="tki-vitalite">
          <span class="tki-vitalite-label">Vitalité ({{ token().vitaliteCourante }} / {{ token().vitaliteMax }})</span>
          <dw-value-stepper
            [formControl]="vitaliteControl"
            [min]="0"
            [max]="token().vitaliteMax ?? undefined"
            [ariaLabel]="'Vitalité de ' + token().nom"
          />
        </div>
      }

      @if (statblock(); as sb) {
        <bol-statblock [data]="sb" [imageSrc]="token().avatar" [returnUrl]="returnUrl()" />
      }

      <button mat-stroked-button type="button" class="tki-remove" (click)="removeRequested.emit(token())">
        <mat-icon>person_remove</mat-icon> Retirer de la table
      </button>
    }
  </div>
</div>
```

Créer `front/src/app/bol/session/play/token-inspector/token-inspector.scss` :

```scss
:host {
  display: block;
  height: 100%;
}

.tki-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, var(--dw-surface-50) 0%, var(--dw-surface-0) 100%);
}

.tki-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.6rem 0.6rem 1rem;
  border-bottom: 1px solid var(--dw-border);
}

.tki-title {
  min-width: 0;
}

.tki-name {
  margin: 0;
  font-family: 'Muse Display Harmony', 'Muse Sans', serif;
  font-size: 1.2rem;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tki-name--hero { color: var(--dw-color-reussite); }
.tki-name--pnj { color: var(--dw-color-pnj); }
.tki-name--creature { color: var(--dw-color-creature); }
.tki-name--demon { color: var(--dw-color-demon); }

.tki-sub {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--dw-surface-500);
}

.tki-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.9rem 1rem 1.1rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent;
}

.tki-loading {
  margin: 0;
  font-size: 0.88rem;
  color: var(--dw-surface-500);
}

.tki-vitalite {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tki-vitalite-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

.tki-remove {
  align-self: flex-start;
  color: var(--dw-color-danger-muted);
  border-color: var(--dw-border-remove);
}
```

- [ ] **Step 2: Valider**

Run: `cd front && npm run build`
Expected: build réussi (le composant compile, il est branché à la tâche 7).

- [ ] **Step 3: Commit**

```bash
git add front/src/app/bol/session/play/token-inspector
git commit -m "feat(session): fiche du jeton (bol-token-inspector)"
```

---

### Task 7: La table en trois zones

**Files:**
- Create: `front/src/app/bol/session/play/table-state.util.ts`
- Create: `front/src/app/bol/session/play/table-state.util.spec.ts`
- Modify: `front/src/app/bol/session/play/battlemap/battlemap.ts`
- Modify: `front/src/app/bol/session/play/battlemap/battlemap.scss`
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html`
- Modify: `front/src/app/bol/session/play/session-play-page.scss`
- Delete: `front/src/app/bol/session/play/hero-action-panel/` (dossier entier)

**Interfaces:**
- Consumes: `ReserveComponent` (tâche 5), `TokenInspectorComponent` + `TokenInspectorHeroData` (tâche 6), `LastRoll` (tâche 2).
- Produces:
  - `table-state.util.ts` : `RESERVE_PANEL_KEY`, `browserStorage(): Storage | null`, `readPanelOpen(storage, key, fallback): boolean`, `writePanelOpen(storage, key, open): void`, `findSelectedToken(tokens, key, mode): PlayToken | null`
  - `BattlemapComponent` gagne `selectedKey = input<string | null>(null)` et `tokenSelected = output<PlayToken>()`.

- [ ] **Step 1: Écrire le test qui échoue (Review Focus 3 et 4)**

Créer `front/src/app/bol/session/play/table-state.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {PlayToken} from '../combat-play.util';
import {findSelectedToken, readPanelOpen, writePanelOpen} from './table-state.util';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as Storage;
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
} as unknown as Storage;

describe('readPanelOpen', () => {
  it('returns the stored value', () => {
    expect(readPanelOpen(fakeStorage({k: '0'}), 'k', true)).toBe(false);
    expect(readPanelOpen(fakeStorage({k: '1'}), 'k', false)).toBe(true);
  });

  it('falls back when nothing is stored', () => {
    expect(readPanelOpen(fakeStorage(), 'k', true)).toBe(true);
  });

  it('falls back on a corrupted value', () => {
    expect(readPanelOpen(fakeStorage({k: 'banana'}), 'k', true)).toBe(true);
  });

  it('falls back when storage is unavailable or throws', () => {
    expect(readPanelOpen(null, 'k', true)).toBe(true);
    expect(readPanelOpen(throwingStorage, 'k', true)).toBe(true);
  });
});

describe('writePanelOpen', () => {
  it('stores a value readPanelOpen reads back', () => {
    const storage = fakeStorage();
    writePanelOpen(storage, 'k', false);
    expect(readPanelOpen(storage, 'k', true)).toBe(false);
  });

  it('does not throw when storage is unavailable or throws', () => {
    expect(() => writePanelOpen(null, 'k', true)).not.toThrow();
    expect(() => writePanelOpen(throwingStorage, 'k', true)).not.toThrow();
  });
});

describe('findSelectedToken', () => {
  const tokens = [{key: 'hero-1'}, {key: 'pnj-2'}] as PlayToken[];

  it('returns the token matching the selected key in free mode', () => {
    expect(findSelectedToken(tokens, 'pnj-2', 'libre')?.key).toBe('pnj-2');
  });

  it('returns null when the selected token is no longer on the table', () => {
    expect(findSelectedToken(tokens, 'creature-9-0', 'libre')).toBeNull();
  });

  it('returns null in combat mode, where the inspector is not shown', () => {
    expect(findSelectedToken(tokens, 'hero-1', 'combat')).toBeNull();
  });

  it('returns null when nothing is selected', () => {
    expect(findSelectedToken(tokens, null, 'libre')).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd front && npx ng test --watch=false --include "**/table-state.util.spec.ts"`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Écrire l'utilitaire**

Créer `front/src/app/bol/session/play/table-state.util.ts` :

```ts
import {PlayToken} from '../combat-play.util';

export const RESERVE_PANEL_KEY = 'diceway-table-reserve-open';

/** `localStorage`, ou `null` s'il est inaccessible (navigation privée, stockage bloqué). */
export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** État ouvert/replié d'un panneau de la table, mémorisé entre deux visites. Toute valeur absente,
 * illisible ou inattendue retombe sur `fallback`. */
export function readPanelOpen(storage: Storage | null, key: string, fallback: boolean): boolean {
  try {
    const raw = storage?.getItem(key);
    if (raw === '1') {
      return true;
    }
    if (raw === '0') {
      return false;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writePanelOpen(storage: Storage | null, key: string, open: boolean): void {
  try {
    storage?.setItem(key, open ? '1' : '0');
  } catch {
    // Préférence d'affichage : la perdre n'empêche pas de jouer.
  }
}

/** Jeton affiché dans la fiche : celui dont la clé est sélectionnée, en mode libre uniquement. `null`
 * dès qu'il n'est plus sur la table (retiré) ou que la session passe en combat. */
export function findSelectedToken(
  tokens: readonly PlayToken[],
  key: string | null,
  mode: 'libre' | 'combat',
): PlayToken | null {
  if (mode !== 'libre' || !key) {
    return null;
  }
  return tokens.find((token) => token.key === key) ?? null;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd front && npx ng test --watch=false --include "**/table-state.util.spec.ts"`
Expected: PASS.

- [ ] **Step 5: Sélection d'un jeton sur la battlemap**

Dans `front/src/app/bol/session/play/battlemap/battlemap.ts` :

Après la ligne `readonly activeKey = input<string | null>(null);`, ajouter :

```ts
  /** Jeton sélectionné (fiche du jeton ouverte, mode libre) — anneau doré. */
  readonly selectedKey = input<string | null>(null);
```

Après `readonly statblockRequested = output<PlayToken>();`, ajouter :

```ts
  /** Clic simple sur un jeton hors mode ciblage. */
  readonly tokenSelected = output<PlayToken>();
```

Dans `onTokenClick`, remplacer :

```ts
    const sourceKey = this.attackSourceKey();
    if (!sourceKey) {
      return;
    }
```

par :

```ts
    const sourceKey = this.attackSourceKey();
    if (!sourceKey) {
      this.tokenSelected.emit(token);
      return;
    }
```

Dans `tokenClass`, remplacer la ligne `return` par :

```ts
    const selected = token.key === this.selectedKey() ? ' cp-token--selected' : '';
    return `cp-token cp-token--${token.kind}${active}${selected}${isSource}${isTargetable}${targeting}`;
```

Dans `front/src/app/bol/session/play/battlemap/battlemap.scss`, juste après le bloc `.cp-token--active .cp-token-portrait { … }`, ajouter :

```scss
.cp-token--selected .cp-token-portrait {
  box-shadow: 0 0 0 3px var(--dw-surface-0), 0 0 0 5px var(--dw-color-legendary);
}
```

- [ ] **Step 6: Réécrire le template de la page**

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
      [titre]="session()?.titre ?? null"
      [legendaryActive]="b.legendaryActive"
      (startCombat)="openStartCombatDialog()"
      (endCombat)="askEndCombat()"
      (addHero)="openAddCombatantDialog()"
    />

    @if (mode() === 'combat') {
      <bol-initiative-rail
        [tokens]="orderedTokens()"
        [activeKey]="activeKey()"
        (reordered)="onRailReordered($event)"
        (addCombatant)="openAddCombatantDialog()"
        (removeCombatant)="askRemoveCombatant($event)"
      />
    }

    <div class="spp-table">
      @if (mode() === 'libre') {
        @if (sessionId(); as sid) {
          @if (reserveOpen()) {
            <aside id="spp-reserve" class="spp-reserve" aria-label="Réserve">
              <bol-reserve
                [sessionId]="sid"
                [existingHeroIds]="existingHeroIds()"
                [existingPnjIds]="existingPnjIds()"
                (placed)="reloadSession()"
              />
            </aside>
          }
          <button
            type="button"
            class="spp-reserve-toggle"
            aria-controls="spp-reserve"
            [attr.aria-expanded]="reserveOpen()"
            [attr.aria-label]="reserveOpen() ? 'Replier la réserve' : 'Déplier la réserve'"
            (click)="toggleReserve()"
          >
            <mat-icon>{{ reserveOpen() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
          </button>
        }
      }

      <div class="spp-center">
        <bol-battlemap
          [mode]="mode()"
          [heroTokens]="heroTokens()"
          [adversaireTokens]="adversaireTokens()"
          [activeKey]="mode() === 'combat' ? activeKey() : null"
          [selectedKey]="selectedToken()?.key ?? null"
          [tokenPositions]="tokenPositions()"
          (attackRequested)="onAttackRequested($event)"
          (tokenSelected)="onTokenSelected($event)"
          (statblockRequested)="openStatblockFor($event)"
          (actionRollRequested)="onTokenSelected($event)"
          (positionChanged)="onPositionChanged($event)"
        />

        <div class="spp-last-roll" aria-live="polite" [class.spp-last-roll--empty]="!lastRoll()">
          @if (lastRoll(); as roll) {
            <span class="spp-last-roll-label">Dernier jet</span>
            <span class="spp-last-roll-formula">{{ roll.nom }} · {{ roll.formula }} → {{ roll.total }}</span>
            <strong [class]="'spp-last-roll-result spp-last-roll-result--' + roll.tone">{{ roll.label }}</strong>
          }
        </div>
      </div>

      @if (selectedToken(); as token) {
        @if (sessionId(); as sid) {
          <aside class="spp-inspector" aria-label="Fiche du jeton">
            <bol-token-inspector
              [token]="token"
              [sessionId]="sid"
              [hero]="inspectorHero()"
              [statblock]="inspectorStatblock()"
              [returnUrl]="returnUrl()"
              (closed)="closeInspector()"
              (changed)="reloadSession()"
              (rolled)="lastRoll.set($event)"
              (removeRequested)="askRemoveCombatant($event)"
              (fullSheetRequested)="openFullSheet($event)"
            />
          </aside>
        }
      }
    </div>
  </div>
}
```

(`(addHero)` reste branché jusqu'à la tâche 8, qui retire ce bouton de l'en-tête.)

- [ ] **Step 7: Mettre à jour la classe de la page**

Dans `session-play-page.ts` :

**Imports.** Retirer :

```ts
import {HeroActionPanelComponent, HeroActionPanelData, HeroActionPanelTab} from './hero-action-panel/hero-action-panel';
```

Remplacer `import {ActionRollDiceTrait} from '../action-roll.util';` par :

```ts
import {ActionRollDiceTrait, LastRoll} from '../action-roll.util';
```

Remplacer `import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';` par :

```ts
import {BolStatblockComponent, BolStatblockData} from '../../shared/statblock/bol-statblock.component';
```

Ajouter :

```ts
import {MatIconModule} from '@angular/material/icon';
import {ReserveComponent} from './reserve/reserve';
import {
  browserStorage,
  findSelectedToken,
  readPanelOpen,
  RESERVE_PANEL_KEY,
  writePanelOpen,
} from './table-state.util';
import {TokenInspectorComponent, TokenInspectorHeroData} from './token-inspector/token-inspector';
```

**Décorateur.** Remplacer `imports` et `host` par :

```ts
  imports: [
    RouterLink,
    MatIconModule,
    SessionHeaderComponent,
    InitiativeRailComponent,
    BattlemapComponent,
    ReserveComponent,
    TokenInspectorComponent,
  ],
```

```ts
  host: {
    '(document:keydown.escape)': 'closeInspector()',
  },
```

Remplacer aussi le commentaire de classe par :

```ts
/**
 * La table : page d'accueil d'une session. Orchestre le chargement/la persistance de la session et
 * l'ouverture des dialogs — l'affichage est délégué à `bol-session-header`, `bol-reserve` (poser des
 * personnages, mode libre), `bol-battlemap` (jetons), `bol-token-inspector` (fiche du jeton, mode
 * libre) et `bol-initiative-rail` (mode combat).
 */
```

**Nouveaux membres.** Après la déclaration de `activeKey`, ajouter :

```ts
  protected readonly sessionId = computed(() => this.session()?.id ?? null);

  /** Page à laquelle revenir depuis un formulaire ou une bibliothèque ouverts depuis la table. */
  protected readonly returnUrl = computed(() => {
    const id = this.sessionId();
    return id ? `/session/${id}/play` : null;
  });

  protected readonly existingHeroIds = computed<ReadonlySet<string>>(
    () => new Set((this.session()?.heros ?? []).map((h) => String(h.heros_id))),
  );
  protected readonly existingPnjIds = computed<ReadonlySet<string>>(
    () =>
      new Set(
        (this.session()?.pnjs ?? [])
          .map((p) => p.pnj_id)
          .filter((pnjId): pnjId is string => !!pnjId)
          .map(String),
      ),
  );

  protected readonly reserveOpen = signal(readPanelOpen(browserStorage(), RESERVE_PANEL_KEY, true));

  /** Clé du jeton dont la fiche est ouverte (mode libre). */
  private readonly selectedKey = signal<string | null>(null);
  protected readonly selectedToken = computed(() =>
    findSelectedToken(this.board()?.tokens ?? [], this.selectedKey(), this.mode()),
  );
  /** Données de la fiche, chargées à la sélection — `null` pendant le chargement. */
  protected readonly inspectorHero = signal<TokenInspectorHeroData | null>(null);
  protected readonly inspectorStatblock = signal<BolStatblockData | null>(null);

  protected readonly lastRoll = signal<LastRoll | null>(null);
```

**`openAddCombatantDialog`.** Remplacer son corps par (le dialogue ne sert plus qu'en combat, et les ensembles d'ids sont maintenant des `computed`) :

```ts
  protected openAddCombatantDialog(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId,
          existingHeroIds: this.existingHeroIds(),
          existingPnjIds: this.existingPnjIds(),
          lockKind: this.mode() === 'libre' ? 'hero' : undefined,
        },
      })
      .afterClosed()
      .subscribe((didAdd: boolean | undefined) => {
        if (didAdd) {
          this.loadSession(sessionId);
        }
      });
  }
```

**`askRemoveCombatant`.** Remplacer le message et le succès :

```ts
        message: `Voulez-vous retirer « ${token.nom} » de la table ?`,
```

```ts
        next: () => {
          if (this.selectedKey() === token.key) {
            this.selectedKey.set(null);
          }
          this.loadSession(sessionId);
        },
```

**`openStatblockFor`.** Remplacer le début de la méthode, de sa signature jusqu'au `switch` exclu, par :

```ts
  /** Bouton « carte » ou double-clic sur un jeton. Mode libre : sélectionne le jeton (fiche du jeton).
   * Mode combat : dialog de statbloc dédié, comme avant. */
  protected openStatblockFor(token: PlayToken): void {
    if (this.mode() === 'libre') {
      this.onTokenSelected(token);
      return;
    }

    const sourceId = token.combat.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    /** Lien "Modifier la fiche" (bol-statblock) : revenir sur cette table après édition. */
    const returnUrl = `/session/${sessionId}/play`;
```

Dans ce `switch`, remplacer tout le `case 'hero': { … }` par :

```ts
      case 'hero':
        this.openHeroPopup(token, sourceId, sessionId);
        break;
```

**Bloc à supprimer.** Supprimer, de leur commentaire jusqu'à leur fin : `heroActionPanelData`, `heroActionPanelTab`, `onActionRoll`, `openHeroActionPanel`, `closeHeroActionPanel`, `onHeroActionPanelChanged`. Conserver `buildHeroStatblockData`.

**Bloc à ajouter** à la place :

```ts
  protected toggleReserve(): void {
    const next = !this.reserveOpen();
    this.reserveOpen.set(next);
    writePanelOpen(browserStorage(), RESERVE_PANEL_KEY, next);
  }

  /** Clic sur un jeton : ouvre sa fiche (mode libre). Recliquer le même jeton ne recharge rien, pour
   * ne pas perdre un jet en cours. */
  protected onTokenSelected(token: PlayToken): void {
    if (this.mode() !== 'libre' || this.selectedKey() === token.key) {
      return;
    }

    this.selectedKey.set(token.key);
    this.loadInspector(token);
  }

  protected closeInspector(): void {
    this.selectedKey.set(null);
  }

  protected reloadSession(): void {
    const sessionId = this.sessionId();
    if (sessionId) {
      this.loadSession(sessionId);
    }
  }

  /** Charge les données de la fiche du jeton. Chaque réponse est ignorée si un autre jeton a été
   * sélectionné entre-temps (réponses arrivées dans le désordre). */
  private loadInspector(token: PlayToken): void {
    this.inspectorHero.set(null);
    this.inspectorStatblock.set(null);

    const sourceId = token.combat.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    const stillSelected = (): boolean => this.selectedKey() === token.key;

    switch (token.kind) {
      case 'hero':
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (stillSelected()) {
              this.inspectorHero.set(this.buildInspectorHero(token, hero, sourceId, sessionId));
            }
          });
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) => {
            if (stillSelected()) {
              this.inspectorStatblock.set(pnjStatblockData(pnj));
            }
          });
        break;
      case 'creature':
        this.creaturesService
          .creature(sourceId)
          .pipe(take(1))
          .subscribe((creature) => {
            if (stillSelected()) {
              this.inspectorStatblock.set(creatureStatblockData(creature));
            }
          });
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) => {
            if (stillSelected()) {
              this.inspectorStatblock.set(demonStatblockData(demon));
            }
          });
        break;
    }
  }

  private buildInspectorHero(
    token: PlayToken,
    hero: BolHerosModel,
    herosId: string,
    sessionId: string,
  ): TokenInspectorHeroData {
    return {
      resources: {
        sessionId,
        herosId,
        pivotId: token.pivotId,
        heroNom: token.nom,
        vitaliteCourante: token.vitaliteCourante ?? hero.ressources.vitalite,
        vitaliteMax: hero.ressources.vitalite,
      },
      actionRoll: {
        heroNom: token.nom,
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

  /** « Fiche complète » depuis la fiche du jeton : statbloc du héros en dialog. À la fermeture, si
   * quelque chose a changé (vitalité, héroïsme, équipement), la session et la fiche sont rechargées. */
  protected openFullSheet(token: PlayToken): void {
    const sourceId = token.combat.sourceId;
    const sessionId = this.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    this.openHeroPopup(token, sourceId, sessionId, () => this.loadInspector(token));
  }

  private openHeroPopup(token: PlayToken, herosId: string, sessionId: string, onChanged?: () => void): void {
    const returnUrl = `/session/${sessionId}/play`;
    this.herosService
      .heros(herosId)
      .pipe(take(1))
      .subscribe((hero) => {
        this.dialog
          .open(HeroStatblockPopupComponent, {
            maxWidth: 'min(900px, 94vw)',
            panelClass: 'dw-statblock-dialog',
            position: {top: '10vh'},
            data: this.buildHeroStatblockData(token, hero, herosId, sessionId, returnUrl),
          })
          .afterClosed()
          .subscribe((changed: boolean | undefined) => {
            if (changed) {
              this.loadSession(sessionId);
              onChanged?.();
            }
          });
      });
  }
```

Dans le constructeur et `loadSession`, remplacer les deux messages d'erreur `'Combat introuvable.'` et `'Impossible de charger ce combat.'` par `'Session introuvable.'` et `'Impossible de charger cette session.'`.

- [ ] **Step 8: Mettre à jour la feuille de style de la page**

Dans `session-play-page.scss`, supprimer le bloc `.spp-hero-action-panel` (commentaire compris) et le bloc `@keyframes spp-panel-slide-in`, puis ajouter à la fin :

```scss
// Trois zones : réserve (repliable, mode libre) · carte · fiche du jeton (ouverte à la sélection).
.spp-table {
  flex: 1;
  min-height: 0;
  display: flex;
}

.spp-reserve {
  flex: 0 0 17rem;
  min-width: 0;
  border-right: 1px solid var(--dw-border);
  background: var(--dw-surface-0);
}

.spp-reserve-toggle {
  flex: 0 0 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-right: 1px solid var(--dw-border);
  background: var(--dw-surface-50);
  color: var(--dw-surface-500);
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

.spp-center {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.spp-inspector {
  flex: 0 0 min(25rem, 40vw);
  min-width: 0;
  border-left: 1px solid var(--dw-border);
}

// Bandeau d'une ligne sous la carte. Toujours présent dans le DOM (région aria-live), sans hauteur
// tant qu'aucun jet n'a été lancé.
.spp-last-roll {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--dw-border);
  background: var(--dw-surface-0);
  font-size: 0.85rem;
  color: var(--dw-surface-600);
}

.spp-last-roll--empty {
  padding: 0;
  border-top: none;
}

.spp-last-roll-label {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

.spp-last-roll-formula {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.spp-last-roll-result--reussite { color: var(--dw-color-reussite); }
.spp-last-roll-result--echec { color: var(--dw-color-echec); }
.spp-last-roll-result--heroique { color: var(--dw-color-legendary); }
```

- [ ] **Step 9: Supprimer l'ancien panneau à onglets**

```bash
git rm -r front/src/app/bol/session/play/hero-action-panel
```

Dans `front/src/app/bol/session/play/hero-statblock-dialog/hero-statblock-dialog.ts` et `hero-statblock-popup/hero-statblock-popup.ts`, les commentaires mentionnent `bol-hero-action-panel` : remplacer ces mentions par `bol-token-inspector` (commentaires uniquement, aucun code).

Vérifier qu'il ne reste aucune référence :

Run: `grep -rn "hero-action-panel\|HeroActionPanel\|action-roll-dialog\|ActionRollDialog" front/src/app --include=*.ts --include=*.html --include=*.scss`
Expected: uniquement des commentaires dans `attack-roll-dialog.ts`, `attack-roll-dialog.scss` et `start-combat-dialog.scss` (ne pas les modifier), aucun import.

- [ ] **Step 10: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tests verts.

- [ ] **Step 11: Commit**

```bash
git add -A front/src/app/bol/session
git commit -m "feat(session): table en trois zones (réserve, carte, fiche du jeton)"
```

---

### Task 8: Menu compte et barre du haut

**Files:**
- Create: `front/src/app/bol/shared/account-menu/account-menu.ts`
- Modify: `front/src/app/bol/session/play/session-header/session-header.ts`
- Modify: `front/src/app/bol/session/play/session-header/session-header.html`
- Modify: `front/src/app/bol/session/play/session-header/session-header.scss`
- Modify: `front/src/app/bol/session/play/session-play-page.html`

**Interfaces:**
- Consumes: `AuthService.logout()` et `AuthService.user()` (`front/src/app/core/auth/auth.service.ts`).
- Produces: `AccountMenuComponent`, sélecteur `bol-account-menu`, sans entrée ni sortie. `SessionHeaderComponent` perd la sortie `addHero`.

- [ ] **Step 1: Créer le menu compte**

Créer `front/src/app/bol/shared/account-menu/account-menu.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';

interface AccountMenuLink {
  readonly label: string;
  readonly icon: string;
  readonly link: string;
}

const SESSION_LINKS: readonly AccountMenuLink[] = [
  {label: 'Changer de session', icon: 'swap_horiz', link: '/library/sessions'},
  {label: 'Nouvelle session', icon: 'add', link: '/session/new'},
];

const LIBRARY_LINKS: readonly AccountMenuLink[] = [
  {label: 'Héros', icon: 'person', link: '/library/heroes'},
  {label: 'PNJ', icon: 'group', link: '/library/pnjs'},
  {label: 'Créatures', icon: 'pets', link: '/library/creatures'},
  {label: 'Démons', icon: 'bolt', link: '/library/demons'},
  {label: 'Intendance', icon: 'work', link: '/intendance'},
];

/** Menu compte de la table et du seuil : tout ce qui n'est pas la partie en cours (autre session,
 * bibliothèques, déconnexion). Remplace les cartes du dashboard supprimé. */
@Component({
  selector: 'bol-account-menu',
  imports: [RouterLink, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  template: `
    <button mat-icon-button type="button" [matMenuTriggerFor]="menu" [attr.aria-label]="'Menu de ' + userName()">
      <mat-icon>account_circle</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      @for (item of sessionLinks; track item.link) {
        <a mat-menu-item [routerLink]="item.link">
          <mat-icon>{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
      <mat-divider />
      @for (item of libraryLinks; track item.link) {
        <a mat-menu-item [routerLink]="item.link">
          <mat-icon>{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
      <mat-divider />
      <button mat-menu-item type="button" (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Déconnexion</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenuComponent {
  private readonly authService = inject(AuthService);

  protected readonly sessionLinks = SESSION_LINKS;
  protected readonly libraryLinks = LIBRARY_LINKS;
  protected readonly userName = computed(() => this.authService.user()?.name ?? 'mon compte');

  protected logout(): void {
    this.authService.logout();
  }
}
```

- [ ] **Step 2: Simplifier l'en-tête de session**

Remplacer tout le contenu de `session-header.ts` par :

```ts
import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {AccountMenuComponent} from '../../../shared/account-menu/account-menu';

/** Barre du haut de la table : titre de la session, action de combat, menu compte, et bannière de
 * succès légendaire — ce qui reste visible en permanence, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [MatIconModule, AccountMenuComponent],
  templateUrl: './session-header.html',
  styleUrl: './session-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionHeaderComponent {
  readonly mode = input.required<'libre' | 'combat'>();
  readonly titre = input<string | null>(null);
  /** Succès légendaire obtenu cette rencontre (`PlayBoard.legendaryActive`) — bannière visible uniquement en combat. */
  readonly legendaryActive = input(false);

  readonly startCombat = output<void>();
  readonly endCombat = output<void>();
}
```

Remplacer tout le contenu de `session-header.html` par :

```html
<header class="cp-header">
  <div class="cp-header-title">
    <span class="cp-eyebrow">{{ mode() === 'combat' ? 'Combat' : 'Session' }}</span>
    <h1>{{ titre() || (mode() === 'combat' ? 'Combat en cours' : 'Session en cours') }}</h1>
  </div>

  <div class="cp-header-actions">
    @if (mode() === 'libre') {
      <button type="button" class="cp-header-action cp-header-action--gold" (click)="startCombat.emit()">
        <mat-icon>shield</mat-icon>
        Démarrer un combat
      </button>
    } @else {
      <button type="button" class="cp-header-action cp-header-action--gold" (click)="endCombat.emit()">
        <mat-icon>flag</mat-icon>
        Terminer le combat
      </button>
    }
    <bol-account-menu />
  </div>
</header>

@if (mode() === 'combat' && legendaryActive()) {
  <div class="cp-banner">
    <mat-icon>military_tech</mat-icon>
    Succès légendaire obtenu — +1 à ses jets d'attaque pour toute la rencontre, coriaces et piétailles adverses bloqués au round 1.
  </div>
}
```

Dans `session-header.scss` :
- supprimer les blocs `.cp-back`, `.cp-header-libraries`, `.cp-header-lib-btn`, `.cp-header-action--green` ;
- dans `.cp-header`, remplacer `padding: 1.3rem 1.3rem;` par `padding: 0.7rem 1.1rem;` (barre plus basse : la carte gagne la hauteur) ;
- dans `.cp-header-title h1`, remplacer `font-size: 1.5rem;` par `font-size: 1.2rem;`.

- [ ] **Step 3: Retirer `(addHero)` de la page**

Dans `session-play-page.html`, supprimer la ligne `(addHero)="openAddCombatantDialog()"` de `<bol-session-header>`.

Dans `session-play-page.ts`, méthode `openAddCombatantDialog` : le dialogue n'est plus ouvert qu'en combat (ruban d'initiative). Remplacer `lockKind: this.mode() === 'libre' ? 'hero' : undefined,` par rien (supprimer la ligne).

- [ ] **Step 4: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tests verts.

- [ ] **Step 5: Commit**

```bash
git add -A front/src/app/bol
git commit -m "feat(session): barre du haut simplifiée et menu compte"
```

---

### Task 9: `/` mène à la table, sinon au seuil

**Files:**
- Create: `front/src/app/bol/session/home-redirect.guard.ts`
- Create: `front/src/app/bol/session/home-redirect.guard.spec.ts`
- Modify: `front/src/app/app.routes.ts:6-12`
- Modify: `front/src/app/bol/session/new/session-new-page.ts`
- Modify: `front/src/app/bol/session/new/session-new-page.html`

**Interfaces:**
- Consumes: `BolFightSessionService.fightSessions()` (triées par date décroissante côté backend), `AccountMenuComponent` (tâche 8).
- Produces: `openSessionId(sessions: readonly BolFightSessionModel[]): string | null`, `homeRedirectGuard: CanActivateFn`.

- [ ] **Step 1: Écrire le test qui échoue (Review Focus 5)**

Créer `front/src/app/bol/session/home-redirect.guard.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {BolFightSessionModel} from '../models/bol-fight-session.model';
import {openSessionId} from './home-redirect.guard';

function session(id: string | null, statut: BolFightSessionModel['statut']): BolFightSessionModel {
  return {id, titre: null, statut};
}

describe('openSessionId', () => {
  it('returns null when there is no session at all', () => {
    expect(openSessionId([])).toBeNull();
  });

  it('returns the first open session, the list being sorted most recent first', () => {
    expect(openSessionId([session('b', 'libre'), session('a', 'combat')])).toBe('b');
  });

  it('treats a session in combat as open', () => {
    expect(openSessionId([session('a', 'combat')])).toBe('a');
  });

  it('skips closed sessions', () => {
    expect(openSessionId([session('z', 'terminee'), session('a', 'libre')])).toBe('a');
    expect(openSessionId([session('z', 'terminee')])).toBeNull();
  });

  it('skips an open session without an id instead of redirecting to /session/null/play', () => {
    expect(openSessionId([session(null, 'libre')])).toBeNull();
    expect(openSessionId([session(null, 'libre'), session('a', 'libre')])).toBe('a');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd front && npx ng test --watch=false --include "**/home-redirect.guard.spec.ts"`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Écrire le guard**

Créer `front/src/app/bol/session/home-redirect.guard.ts` :

```ts
import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {BolFightSessionModel} from '../models/bol-fight-session.model';
import {BolFightSessionService} from '../services/bol-fight-session.service';

/** Id de la session ouverte (`libre` ou `combat`) la plus récente — la liste est déjà triée par date
 * décroissante côté backend. `null` s'il n'y en a aucune. */
export function openSessionId(sessions: readonly BolFightSessionModel[]): string | null {
  const open = sessions.find((s) => (s.statut === 'libre' || s.statut === 'combat') && !!s.id);
  return open?.id ?? null;
}

/** Garde de la route `/` : la table est la page d'accueil. S'il existe une session ouverte, on y va
 * directement ; sinon la route s'active et affiche le seuil. Une erreur de chargement laisse passer
 * (le seuil vaut mieux qu'un écran bloqué). */
export const homeRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);

  return inject(BolFightSessionService)
    .fightSessions()
    .pipe(
      map((sessions) => {
        const id = openSessionId(sessions);
        return id ? router.createUrlTree(['/session', id, 'play']) : true;
      }),
      catchError(() => of(true)),
    );
};
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd front && npx ng test --watch=false --include "**/home-redirect.guard.spec.ts"`
Expected: PASS.

- [ ] **Step 5: Brancher la route `/`**

Dans `front/src/app/app.routes.ts`, ajouter l'import :

```ts
import {homeRedirectGuard} from './bol/session/home-redirect.guard';
```

et remplacer la première route :

```ts
  {
    path: '',
    loadComponent: () =>
      import('./bol/workspace/workspace-page').then((module) => module.WorkspacePageComponent),
    canActivate: [authGuard],
  },
```

par :

```ts
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./bol/session/new/session-new-page').then((module) => module.SessionNewPageComponent),
    canActivate: [authGuard, homeRedirectGuard],
  },
```

La route `session/new` reste telle quelle : c'est l'accès direct au seuil, sans redirection, pour ouvrir une nouvelle session alors qu'une autre est en cours.

- [ ] **Step 6: Transformer la page « nouvelle session » en seuil**

Dans `session-new-page.ts` :
- ajouter `import {AccountMenuComponent} from '../../shared/account-menu/account-menu';` ;
- dans `imports` du décorateur, ajouter `AccountMenuComponent` ;
- remplacer le commentaire de classe par :

```ts
/** Seuil : affiché sur `/` quand aucune session n'est ouverte, et sur `/session/new`. Le MJ choisit
 * les héros présents et ouvre la table (session en mode libre). */
```

Remplacer tout le contenu de `session-new-page.html` par :

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
            <p class="snp-eyebrow">Diceway · Barbarians of Lemuria</p>
            <h1 class="snp-title">Qui est à table ce soir ?</h1>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button mat-flat-button type="button" [disabled]="!canLaunch() || launching()" (click)="launchSession()">
            <mat-icon>play_arrow</mat-icon> Ouvrir la table
          </button>
          <bol-account-menu />
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
        <p class="snp-empty">Aucun héros pour l'instant. Ajoute ceux qui jouent ce soir, puis ouvre la table.</p>
      }

      <button type="button" class="snp-add-tile" (click)="openPicker()">
        <mat-icon>add</mat-icon> Ajouter un héros
      </button>

      <div class="flex flex-wrap gap-2">
        <a mat-stroked-button size="small" routerLink="/create/hero" [state]="createHeroState">
          <mat-icon>person_add</mat-icon> Créer un héros
        </a>
        <a mat-stroked-button size="small" routerLink="/library/sessions">
          <mat-icon>history</mat-icon> Mes sessions
        </a>
      </div>
    </div>
  </div>
</section>
```

Dans `session-new-page.ts`, ajouter dans la classe :

```ts
  /** Revenir sur le seuil après la création d'un héros (et non sur `/`, qui redirigerait vers une
   * session ouverte s'il en existe une). */
  protected readonly createHeroState = {returnUrl: '/session/new'};
```

- [ ] **Step 7: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tests verts. (Le dossier `workspace/` n'est plus référencé par les routes ; il est supprimé à la tâche 10.)

- [ ] **Step 8: Commit**

```bash
git add -A front/src/app
git commit -m "feat(accueil): / mène à la session ouverte, sinon au seuil"
```

---

### Task 10: Suppression du dashboard

**Files:**
- Delete: `front/src/app/bol/workspace/` (dossier entier)
- Delete: `front/src/app/bol/services/bol-dashboard.service.ts`
- Delete: `front/src/app/bol/models/bol-dashboard.model.ts`
- Modify: `front/src/app/bol/hero/library/hero-library-page.html:43`
- Modify: `front/src/app/bol/creature/library/creature-library-page.html:30`
- Modify: `front/src/app/bol/demon/library/demon-library-page.html:31`
- Modify: `front/src/app/bol/pnj/library/pnj-library-page.html:35`
- Modify: `front/src/app/bol/session/library/session-library-page.html:23`
- Modify: `front/src/app/bol/intendance/intendance-page.html:43`
- Modify: `CLAUDE.md` (section « Library pages »)

**Interfaces:**
- Consumes: la route `/` de la tâche 9 (plus aucune référence à `WorkspacePageComponent`).

- [ ] **Step 1: Vérifier que rien d'autre n'utilise ces fichiers**

Run: `grep -rn "workspace/\|BolDashboardService\|bol-dashboard" front/src/app --include=*.ts --include=*.html | grep -v "^front/src/app/bol/workspace/\|bol-dashboard\.\(service\|model\)\.ts"`
Expected: aucune ligne.

- [ ] **Step 2: Supprimer**

```bash
git rm -r front/src/app/bol/workspace
git rm front/src/app/bol/services/bol-dashboard.service.ts front/src/app/bol/models/bol-dashboard.model.ts
```

`bol-scenario.service.ts` et `bol-scenario.model.ts` ne sont plus utilisés par aucune page : **les conserver**, le chantier « Scènes » s'en servira. La route backend `bol/dashboard/count` n'est pas touchée.

- [ ] **Step 3: Renommer le bouton de retour**

Dans les six fichiers HTML listés ci-dessus, remplacer chaque occurrence du texte `Retour au dashboard` par `Retour à la table`.

Run: `grep -rln "Retour au dashboard" front/src/app | xargs sed -i 's/Retour au dashboard/Retour à la table/g'`

Puis vérifier :

Run: `grep -rn "dashboard" -i front/src/app --include=*.html`
Expected: aucune ligne.

Les commentaires TypeScript qui disent « plutôt qu'au dashboard » (`hero-library-page.ts`, `creature-library-page.ts`, `demon-library-page.ts`, `pnj-library-page.ts`, `core/return-url.util.ts`) : remplacer « dashboard » par « table » dans ces commentaires.

- [ ] **Step 4: Mettre à jour `CLAUDE.md`**

Dans la section « Library pages », remplacer :

```
right side — `<button mat-stroked-button size="small" routerLink="/"><mat-icon>arrow_back</mat-icon> Retour au dashboard</button>`.
```

par :

```
right side — `<button mat-stroked-button size="small" routerLink="/"><mat-icon>arrow_back</mat-icon> Retour à la table</button>` (`/` redirige vers la session ouverte, ou affiche le seuil s'il n'y en a pas).
```

- [ ] **Step 5: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tests verts.

- [ ] **Step 6: Commit**

```bash
git add -A front/src/app CLAUDE.md
git commit -m "chore: supprimer le dashboard, la table est la page d'accueil"
```

---

### Task 11: Vérification de bout en bout

**Files:** aucun fichier créé ; corrections éventuelles dans les fichiers des tâches précédentes.

**Interfaces:**
- Consumes: l'application complète. Utiliser le skill `run` (serveur de dev + Playwright, utilisateur de test `claude-test@example.com`).

- [ ] **Step 1: Lancer l'application**

Invoquer le skill `run`. Backend sur le port 8080, front sur 4200.

- [ ] **Step 2: Parcours « aucune session »**

Supprimer les sessions de l'utilisateur de test depuis `/library/sessions`, puis ouvrir `/`.
Expected: le seuil s'affiche (« Qui est à table ce soir ? »), sans redirection. « Ouvrir la table » est désactivé tant qu'aucun héros n'est choisi.

- [ ] **Step 3: Parcours « ouvrir la table »**

Ajouter deux héros, cliquer « Ouvrir la table ».
Expected: navigation vers `/session/<id>/play`. Réserve dépliée à gauche, onglet Héros, les deux héros marqués « à table ». Aucune fiche à droite. Recharger `/` redirige vers cette session.

- [ ] **Step 4: Parcours « poser des personnages »**

Dans la réserve : onglet PNJ, poser un PNJ ; onglet Créatures, poser deux fois la même créature ; chercher un nom accentué sans accent.
Expected: le PNJ apparaît sur la carte et passe « à table » ; la créature apparaît autant de fois que posée et garde son bouton « Poser » ; la recherche trouve l'entrée.

- [ ] **Step 5: Parcours « jet d'action »**

Cliquer un héros. Régler Agilité, une carrière, difficulté Ardue, lancer.
Expected: la fiche s'ouvre à droite, anneau doré sur le jeton. La difficulté affiche « Moyenne » avant réglage. La formule liste les termes non nuls et finit par `≥ 9`. Après le lancer, le bandeau « Dernier jet » sous la carte reprend nom, formule, total et résultat. Dépenser un point d'héroïsme (Faveur divine sur un échec) fait baisser aussi le stepper Héroïsme du haut de la fiche.

- [ ] **Step 6: Parcours « vitalité et retrait »**

Sur le héros : cliquer trois fois vite sur « − » de la vitalité. Sur une créature : baisser sa vitalité, puis « Retirer de la table ».
Expected: la vitalité du héros a baissé de 3 exactement (barre du jeton à jour après rechargement). La créature disparaît de la carte et la fiche se ferme.

- [ ] **Step 7: Parcours « combat »**

Poser un PNJ, « Démarrer un combat », aller au bout du dialogue, puis « Terminer le combat ».
Expected: en combat, la réserve et la fiche du jeton disparaissent, le ruban d'initiative et le menu d'attaque fonctionnent comme avant. Après la fin du combat, le PNJ est toujours sur la table.

- [ ] **Step 8: Largeur et repli**

Viewport 1280×800. Replier la réserve, recharger la page.
Expected: la réserve reste repliée après rechargement. Avec réserve et fiche ouvertes, la carte reste utilisable (défilement horizontal interne de la carte toléré, pas de défilement de la page).

- [ ] **Step 9: Accessibilité**

Au clavier : Tab jusqu'au bouton de repli de la réserve (Entrée le bascule), jusqu'aux onglets de la réserve (flèches), jusqu'à un bouton « Poser ». Échap ferme la fiche du jeton. Vérifier dans la console qu'aucune erreur Angular n'apparaît et, avec l'outil d'audit du navigateur (Lighthouse → Accessibilité, ou extension axe), qu'aucune erreur n'est signalée sur la table et sur le seuil.

- [ ] **Step 10: Suites de tests complètes**

Run: `cd front && npm run build && npx ng test --watch=false`
Run: `cd backend && php artisan test`
Expected: tout passe.

- [ ] **Step 11: Commit des corrections éventuelles**

```bash
git add -A
git commit -m "fix(session): corrections issues de la vérification de bout en bout"
```
