# Registre d'effets de combat : plan d'implémentation

> **Pour l'exécutant :** utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** remplacer les tableaux ad hoc de l'état de combat (`defense_totale`, `attaquees`) par un registre d'effets, évalué par des fonctions pures, pour que chaque règle à mémoire (petit bouclier, postures, parade, défense totale, renversement…) s'applique automatiquement et reste retirable à la main.

**Architecture :** un tableau `etat_combat.effets` (JSON) ; deux fonctions pures dans `front/src/app/bol/session/play/tapis/combat-effects.util.ts` (`modificateursPour` rend les puces d'un jet, `appliquerEvenement` fait évoluer les effets) ; le backend valide et convertit l'ancien format ; la page enregistre l'état par une file d'événements.

**Stack :** Angular 22 (signaux, OnPush, Vitest), Laravel 12 (PHPUnit dans le conteneur `diceway`), Playwright (scripts dans `front/scripts/`).

**Spec :** `doc/plans/2026-10-12-registre-effets-combat-design.md`

## Contraintes globales

- Respecter `CLAUDE.md` : composants standalone sans `standalone: true`, `ChangeDetectionStrategy.OnPush`, `input()`/`output()`, pas de `@HostBinding`/`@HostListener`/`ngClass`/`ngStyle`, contrôle de flux natif, types exportés dans un dossier `models/` (`<nom>.model.ts`), Angular Material uniquement, menus par `MatMenuModule` (modèle : `front/src/app/bol/shared/add-menu/`).
- Texte d'interface et commentaires en français, au même style que le code voisin.
- Validation front, depuis `front/` : `npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals`, `npm run build` (aucun avertissement de budget : `turn-assistant.scss` est déjà à ~16 kB, y ajouter peu ou rien), `npm test -- --watch=false`, `npx knip` (doit être muet).
- Validation backend, depuis la racine du dépôt : les tests ne sont **pas** montés dans le conteneur, donc copier le fichier avant de lancer : `docker cp backend/tests/Unit/<Fichier>.php diceway:/var/www/html/tests/Unit/<Fichier>.php` puis `docker exec diceway php artisan test --filter=<Classe>`.
- Test navigateur : lancer son propre `npx ng serve --port 4400` en arrière-plan, noter son pid et ne tuer que ce pid. **Ne jamais toucher au port 4200** (serveur IntelliJ de Lionel). Compte de test : `claude-test@example.com` (voir `project_test_user` dans la mémoire).
- Git : Lionel gère lui-même les branches, merges et worktrees. Les étapes « Point de contrôle » proposent un message de commit ; ne committer que sur son feu vert.
- Pas de `any` ; pas d'exports inutilisés (knip).
- Ne jamais modifier les entités du catalogue (créatures, démons, PNJ semés, `user_id` nul).

## Écarts assumés avec le spec

Le spec reste la référence ; ces cinq points sont des précisions trouvées en lisant le code, à reporter dans le spec (fait en fin de plan) :

1. **Parade** : « +1 en défense contre **une** attaque subie » se modélise par `{type: 'usages', restants: 1, expireAuTour: true}` (l'effet s'éteint aussi au début du prochain tour du porteur). Une durée unique ne suffisait pas.
2. **Échec critique au round 1** : aucun événement n'existe au démarrage du combat. La règle est **dérivée** (palier de réaction `echec_critique` et round 1) au lieu d'être stockée comme effet.
3. **Feinte** : l'application n'a pas d'option « feinte ». Pas de création automatique ; seule la trace manuelle existe.
4. **`carte-retiree`** : l'événement existe dans le noyau, mais retirer une carte ne se fait qu'hors combat aujourd'hui, donc la page ne l'émet pas encore.
5. **Effet libre** du menu « + Effet » : hors de la première version ; le menu propose des modèles.

## Revue : cas que le spec implique sans les nommer

Chaque ligne a son test dans la tâche indiquée.

1. **Double clic sur « Fin du tour »** : un seul tour doit se terminer (Tâche 4, tests de `EtatSaver`).
2. **Ancien état (`defense_totale`, `attaquees`) ou `effets` corrompu ou énorme** : ni plantage ni effet fantôme ; les lignes invalides sont ignorées, au plus 200 effets (Tâches 2 et 3).
3. **Rechargement de la session pendant un jet** : le jet et ses malus restent (Tâche 4, script Playwright).
4. **Carte seule en combat** : elle redevient active juste après sa fin de tour, donc ses effets « jusqu'à son prochain tour » expirent aussitôt (Tâche 3).
5. **Effet ajouté à la main avec valeur absurde ou carte inconnue** : valeur bornée à ±20, effet d'une carte absente ignoré à l'affichage sans erreur (Tâches 2 et 6).

---

## Structure des fichiers

| Fichier | Rôle | Tâche |
| --- | --- | --- |
| `front/src/app/bol/session/models/combat-effect.model.ts` | Types : `CombatEffect`, durées, événements, contexte de jet, puce | 1 |
| `front/src/app/bol/session/play/tapis/combat-effects.util.ts` (+ `.spec.ts`) | `modificateursPour`, `appliquerEvenement`, `effetsDeTour`, normalisation | 1, 3 |
| `backend/app/Http/Services/Bol/BolCombatState.php` (+ test) | Validation de `effets`, conversion de l'ancien format | 2 |
| `backend/app/Http/Controllers/Bol/BolFightSessionController.php` | Règles de validation de la requête | 2 |
| `front/src/app/bol/session/models/combat-turn.model.ts`, `front/src/app/bol/models/bol-fight-session.model.ts` | `EtatCombat` et DTO avec `effets` | 3 |
| `front/src/app/bol/session/play/tapis/combat-turn.util.ts` (+ spec) | Transitions de tour par événements | 3 |
| `front/src/app/bol/session/play/etat-saver.ts` (+ spec) | File d'enregistrement de l'état | 4 |
| `front/src/app/bol/session/play/session-play-page.ts` / `.html` | Branchement de la file, des événements, des effets | 4, 5, 6, 7 |
| `front/src/app/bol/session/play/combat-board/combat-board.*` | Passe `effets` et les sorties à l'assistant | 4, 6 |
| `front/src/app/bol/session/play/tapis/turn-assistant.*` | Puces et totaux issus des effets | 4, 5, 6, 7 |
| `front/src/app/bol/session/combat-resolution.util.ts` (+ spec) | Retrait du paramètre de bouclier | 4 |
| `front/scripts/e2e-petit-bouclier.mjs` | Scénario navigateur du petit bouclier | 4 |
| `front/src/app/bol/session/play/tapis/effects-list.ts` | Bloc « Effets en cours » et menu « + Effet » | 6 |
| `front/src/app/bol/session/play/tapis/turn-order.*`, `models/turn-order.model.ts` | Point d'effets sur la frise | 6 |

---

### Tâche 1 : le noyau (modèle et fonctions pures)

Aucun changement d'écran. Tout est testable sans Angular.

**Fichiers :**
- Créer : `front/src/app/bol/session/models/combat-effect.model.ts`
- Créer : `front/src/app/bol/session/play/tapis/combat-effects.util.ts`
- Tester : `front/src/app/bol/session/play/tapis/combat-effects.util.spec.ts`

**Interfaces :**
- Produit (utilisé par les tâches 2 à 7) :
  - types `EffectStat`, `EffectWhen`, `EffectDuration`, `CombatEffect`, `NewEffect`, `EffectEvent`, `RollContext`, `ModifierTerm`, `TurnChoice` ;
  - `modificateursPour(effets: readonly CombatEffect[], contexte: RollContext): ModifierTerm[]`
  - `sommeModificateurs(termes: readonly ModifierTerm[]): number`
  - `appliquerEvenement(effets: readonly CombatEffect[], evenement: EffectEvent): readonly CombatEffect[]`
  - `effetsDeTour(carte: string, choix: TurnChoice): NewEffect[]`
  - `nextEffectId(effets: readonly CombatEffect[]): string`
  - constantes `POSTURE_DEFENSE`, `BOUCLIER_DEPENSE`, `SANS_BOUCLIER`.

- [ ] **Étape 1 : écrire le modèle**

`front/src/app/bol/session/models/combat-effect.model.ts` :

```ts
/** Ce qu'un effet modifie : le jet d'attaque, la défense, les dégâts, la protection, ou l'action suivante (dé de malus, action perdue). */
export type EffectStat = 'attaque' | 'defense' | 'degats' | 'protection' | 'action';

/** Contre quoi l'effet joue : quand son porteur attaque, ou quand il est attaqué. */
export type EffectWhen = 'attaque' | 'subie';

/** Quand l'effet s'éteint. */
export type EffectDuration =
  /** N attaques subies ; `expireAuTour` l'éteint aussi au début du prochain tour du porteur. */
  | {readonly type: 'usages'; readonly restants: number; readonly expireAuTour?: boolean}
  | {readonly type: 'fin-round'}
  | {readonly type: 'debut-tour-porteur'}
  | {readonly type: 'action-porteur'}
  | {readonly type: 'combat'};

/** Un effet en cours, gardé dans `etat_combat.effets`. Un effet de valeur 0 est une trace (« bouclier dépensé ce round ») : jamais affichée en puce. */
export interface CombatEffect {
  readonly id: string;
  /** D'où il vient : `defense-totale`, `posture-defensive`, `bouclier-depense`… */
  readonly origine: string;
  /** Clé de la carte qui le porte (`{kind}-{pivotId}`). */
  readonly porteur: string;
  readonly stat: EffectStat;
  readonly valeur: number;
  readonly quand: EffectWhen;
  readonly duree: EffectDuration;
  /** Ajouté à la main par le MJ. */
  readonly manuel: boolean;
  /** Limite l'effet à un adversaire précis (clé de carte). */
  readonly cible?: string;
  /** Libellé libre, pour les effets ajoutés à la main. */
  readonly libelle?: string;
}

/** Un effet à créer : l'identifiant est attribué par `appliquerEvenement`. */
export type NewEffect = Omit<CombatEffect, 'id'>;

/** Ce qui fait évoluer le registre. */
export type EffectEvent =
  | {readonly type: 'debut-tour'; readonly carte: string}
  | {readonly type: 'fin-tour'; readonly carte: string; readonly crees: readonly NewEffect[]}
  | {readonly type: 'jet-attaque'; readonly attaquant: string; readonly cible: string}
  | {readonly type: 'nouveau-round'}
  | {readonly type: 'ajout-manuel'; readonly effet: NewEffect}
  | {readonly type: 'retrait-manuel'; readonly id: string}
  | {readonly type: 'carte-retiree'; readonly carte: string};

/** Le jet pour lequel on cherche les modificateurs. `bouclier` : malus du petit bouclier de la cible lu sur sa fiche (0 si aucun). */
export interface RollContext {
  readonly jet: 'attaque' | 'degats';
  readonly attaquant: string;
  readonly cible: string;
  readonly bouclier: number;
}

/** Une puce de jet issue du registre. `effetId` est `null` pour ce qui vient de la fiche (le petit bouclier). */
export interface ModifierTerm {
  readonly effetId: string | null;
  readonly label: string;
  /** Contribution au total du jet, signée. */
  readonly valeur: number;
  readonly tone: 'plus' | 'minus';
}

/** Ce que la carte active a choisi pour son tour et qui dure : la posture (slug du référentiel) et la défense totale. */
export interface TurnChoice {
  readonly posture: string | null;
  readonly defenseTotale: boolean;
}
```

- [ ] **Étape 2 : écrire les tests qui échouent**

`front/src/app/bol/session/play/tapis/combat-effects.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {CombatEffect, RollContext} from '../../models/combat-effect.model';
import {appliquerEvenement, BOUCLIER_DEPENSE, effetsDeTour, modificateursPour, nextEffectId, SANS_BOUCLIER, sommeModificateurs} from './combat-effects.util';

function effet(over: Partial<CombatEffect> = {}): CombatEffect {
  return {id: 'e-1', origine: 'posture-defensive', porteur: 'hero-1', stat: 'defense', valeur: 1, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false, ...over};
}

function ctx(over: Partial<RollContext> = {}): RollContext {
  return {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0, ...over};
}

describe('nextEffectId', () => {
  it('starts at e-1 and follows the highest id', () => {
    expect(nextEffectId([])).toBe('e-1');
    expect(nextEffectId([effet({id: 'e-4'}), effet({id: 'e-2'})])).toBe('e-5');
    expect(nextEffectId([effet({id: 'manuel'})])).toBe('e-1');
  });
});

describe('modificateursPour', () => {
  it('turns a defence bonus of the target into a malus on the attack total', () => {
    const terms = modificateursPour([effet({valeur: 1})], ctx());
    expect(terms).toEqual([{effetId: 'e-1', label: '− 1 posture défensive', valeur: -1, tone: 'minus'}]);
  });

  it('turns a defence malus of the target into a bonus on the attack total', () => {
    const terms = modificateursPour([effet({origine: 'posture-offensive', valeur: -1})], ctx());
    expect(terms).toEqual([{effetId: 'e-1', label: '+ 1 posture offensive', valeur: 1, tone: 'plus'}]);
  });

  it("applies the attacker's own attack effects", () => {
    const own = effet({id: 'e-2', origine: 'x', libelle: 'inspiré', porteur: 'pnj-7', stat: 'attaque', quand: 'attaque', valeur: 1});
    expect(modificateursPour([own], ctx())).toEqual([{effetId: 'e-2', label: '+ 1 inspiré', valeur: 1, tone: 'plus'}]);
  });

  it('ignores effects of other cards, other rolls and traces', () => {
    const effets = [
      effet({id: 'e-1', porteur: 'hero-9'}),
      effet({id: 'e-2', stat: 'protection'}),
      effet({id: 'e-3', origine: BOUCLIER_DEPENSE, valeur: 0}),
    ];
    expect(modificateursPour(effets, ctx())).toEqual([]);
  });

  it('keeps an effect limited to one opponent for that opponent only', () => {
    const limited = effet({cible: 'pnj-7'});
    expect(modificateursPour([limited], ctx())).toHaveLength(1);
    expect(modificateursPour([limited], ctx({attaquant: 'pnj-8'}))).toEqual([]);
  });

  it('reads protection and damage effects for a damage roll', () => {
    const protection = effet({id: 'e-1', origine: 'x', libelle: 'armure bénie', stat: 'protection', valeur: 1});
    const degats = effet({id: 'e-2', origine: 'x', libelle: 'rage', porteur: 'pnj-7', stat: 'degats', quand: 'attaque', valeur: 2});
    expect(modificateursPour([protection, degats], ctx({jet: 'degats'})).map((t) => t.valeur)).toEqual([-1, 2]);
    expect(modificateursPour([protection, degats], ctx())).toEqual([]);
  });

  it("adds the target's small shield from the sheet, but only for an attack roll", () => {
    expect(modificateursPour([], ctx({bouclier: 1}))).toEqual([{effetId: null, label: '− 1 bouclier', valeur: -1, tone: 'minus'}]);
    expect(modificateursPour([], ctx({bouclier: 1, jet: 'degats'}))).toEqual([]);
  });

  it('drops the shield once spent this round, or when the target has lost it', () => {
    const spent = effet({origine: BOUCLIER_DEPENSE, valeur: 0, duree: {type: 'fin-round'}});
    const lost = effet({origine: SANS_BOUCLIER, valeur: 0});
    expect(modificateursPour([spent], ctx({bouclier: 1}))).toEqual([]);
    expect(modificateursPour([lost], ctx({bouclier: 1}))).toEqual([]);
  });

  it('sums the contributions', () => {
    const terms = modificateursPour([effet({valeur: 2, origine: 'defense-totale'})], ctx({bouclier: 1}));
    expect(sommeModificateurs(terms)).toBe(-3);
  });
});

describe('appliquerEvenement', () => {
  it('debut-tour: ends the effects that last until the bearer next turn, for that card only', () => {
    const effets = [effet({id: 'e-1'}), effet({id: 'e-2', porteur: 'pnj-7'}), effet({id: 'e-3', duree: {type: 'combat'}})];
    expect(appliquerEvenement(effets, {type: 'debut-tour', carte: 'hero-1'}).map((e) => e.id)).toEqual(['e-2', 'e-3']);
  });

  it('debut-tour: also ends a parade (one use) that was not used', () => {
    const parade = effet({origine: 'parade', duree: {type: 'usages', restants: 1, expireAuTour: true}});
    expect(appliquerEvenement([parade], {type: 'debut-tour', carte: 'hero-1'})).toEqual([]);
  });

  it('fin-tour: creates the effects of the turn with fresh ids', () => {
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const apres = appliquerEvenement([], {type: 'fin-tour', carte: 'hero-1', crees});
    expect(apres).toEqual([effet({id: 'e-1', origine: 'posture-defensive', valeur: 1})]);
  });

  it('fin-tour: replaces what the card already carried from an earlier turn instead of doubling it', () => {
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const once = appliquerEvenement([], {type: 'fin-tour', carte: 'hero-1', crees});
    const twice = appliquerEvenement(once, {type: 'fin-tour', carte: 'hero-1', crees});
    expect(twice).toHaveLength(1);
  });

  it('fin-tour: ends the one-action effects of the card (renversement)', () => {
    const renverse = effet({origine: 'renversement', stat: 'action', quand: 'attaque', valeur: -1, duree: {type: 'action-porteur'}});
    expect(appliquerEvenement([renverse], {type: 'fin-tour', carte: 'hero-1', crees: []})).toEqual([]);
  });

  it('jet-attaque: spends the shield of the target once, without doubling the trace', () => {
    const once = appliquerEvenement([], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1'});
    expect(once).toEqual([effet({id: 'e-1', origine: BOUCLIER_DEPENSE, valeur: 0, duree: {type: 'fin-round'}})]);
    expect(appliquerEvenement(once, {type: 'jet-attaque', attaquant: 'pnj-8', cible: 'hero-1'})).toHaveLength(1);
  });

  it('jet-attaque: uses up one use of a limited effect of the target, then removes it', () => {
    const parade = effet({origine: 'parade', duree: {type: 'usages', restants: 2}});
    const afterOne = appliquerEvenement([parade], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1'});
    expect(afterOne.find((e) => e.origine === 'parade')?.duree).toEqual({type: 'usages', restants: 1});
    const afterTwo = appliquerEvenement(afterOne, {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1'});
    expect(afterTwo.find((e) => e.origine === 'parade')).toBeUndefined();
  });

  it('jet-attaque: leaves the effects of other targets alone', () => {
    const other = effet({porteur: 'hero-2', duree: {type: 'usages', restants: 1}});
    const apres = appliquerEvenement([other], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1'});
    expect(apres.find((e) => e.id === 'e-1')?.duree).toEqual({type: 'usages', restants: 1});
  });

  it('nouveau-round: ends the end-of-round effects and keeps the others', () => {
    const effets = [effet({id: 'e-1', duree: {type: 'fin-round'}}), effet({id: 'e-2'}), effet({id: 'e-3', duree: {type: 'combat'}})];
    expect(appliquerEvenement(effets, {type: 'nouveau-round'}).map((e) => e.id)).toEqual(['e-2', 'e-3']);
  });

  it('ajout-manuel and retrait-manuel: the GM adds then removes an effect', () => {
    const {id: _id, ...nouveau} = effet({origine: 'main', libelle: 'sol glissant', valeur: -1});
    const added = appliquerEvenement([], {type: 'ajout-manuel', effet: nouveau});
    expect(added).toEqual([{...nouveau, id: 'e-1', manuel: true}]);
    expect(appliquerEvenement(added, {type: 'retrait-manuel', id: 'e-1'})).toEqual([]);
  });

  it('carte-retiree: drops what the card carries and what targets it', () => {
    const effets = [effet({id: 'e-1'}), effet({id: 'e-2', porteur: 'pnj-7', cible: 'hero-1'}), effet({id: 'e-3', porteur: 'pnj-8'})];
    expect(appliquerEvenement(effets, {type: 'carte-retiree', carte: 'hero-1'}).map((e) => e.id)).toEqual(['e-3']);
  });

  it('never mutates its input', () => {
    const effets = Object.freeze([Object.freeze(effet())]);
    expect(() => appliquerEvenement(effets, {type: 'debut-tour', carte: 'hero-1'})).not.toThrow();
    expect(() => appliquerEvenement(effets, {type: 'fin-tour', carte: 'hero-1', crees: effetsDeTour('hero-1', {posture: 'offensive', defenseTotale: true})})).not.toThrow();
  });
});

describe('effetsDeTour', () => {
  it('gives nothing for a turn without a lasting choice', () => {
    expect(effetsDeTour('hero-1', {posture: null, defenseTotale: false})).toEqual([]);
    expect(effetsDeTour('hero-1', {posture: 'none', defenseTotale: false})).toEqual([]);
  });

  it('gives the defence of each posture of the scale', () => {
    const valeur = (posture: string) => effetsDeTour('hero-1', {posture, defenseTotale: false})[0]?.valeur;
    expect([valeur('defensive'), valeur('offensive'), valeur('intrepid')]).toEqual([1, -1, -2]);
  });

  it('makes an intrepid attack lose the shield', () => {
    const origines = effetsDeTour('hero-1', {posture: 'intrepid', defenseTotale: false}).map((e) => e.origine);
    expect(origines).toEqual(['attaque-intrepide', SANS_BOUCLIER]);
  });

  it('gives the parade of a two-weapon fight one use, expiring with the next turn', () => {
    const [parade] = effetsDeTour('hero-1', {posture: 'dual-parry', defenseTotale: false});
    expect(parade).toMatchObject({origine: 'parade', valeur: 1, duree: {type: 'usages', restants: 1, expireAuTour: true}});
  });

  it('gives +2 for a total defence, stacking with a parade', () => {
    const effets = effetsDeTour('hero-1', {posture: 'dual-parry', defenseTotale: true});
    expect(effets.map((e) => [e.origine, e.valeur])).toEqual([['parade', 1], ['defense-totale', 2]]);
  });
});
```

- [ ] **Étape 3 : lancer les tests et vérifier qu'ils échouent**

Depuis `front/` : `npm test -- --watch=false combat-effects`
Attendu : échec (le module `./combat-effects.util` n'existe pas).

- [ ] **Étape 4 : écrire l'implémentation**

`front/src/app/bol/session/play/tapis/combat-effects.util.ts` :

```ts
import {CombatEffect, EffectEvent, EffectStat, ModifierTerm, NewEffect, RollContext, TurnChoice} from '../../models/combat-effect.model';

/** Effet d'une posture sur la défense de son porteur (le bonus d'attaque vient du référentiel de combat). */
export const POSTURE_DEFENSE: Readonly<Record<string, number>> = {defensive: 1, offensive: -1, intrepid: -2, 'dual-parry': 1};

/** Trace : le petit bouclier de la carte a déjà servi ce round. */
export const BOUCLIER_DEPENSE = 'bouclier-depense';
/** Trace : la carte n'a pas le bénéfice de son bouclier (attaque intrépide, échec critique au round 1). */
export const SANS_BOUCLIER = 'sans-bouclier';

const POSTURE_ORIGINE: Readonly<Record<string, string>> = {
  defensive: 'posture-defensive',
  offensive: 'posture-offensive',
  intrepid: 'attaque-intrepide',
  'dual-parry': 'parade',
};

const ORIGINE_LIBELLE: Readonly<Record<string, string>> = {
  'defense-totale': 'défense totale',
  'posture-defensive': 'posture défensive',
  'posture-offensive': 'posture offensive',
  'attaque-intrepide': 'attaque intrépide',
  parade: 'parade',
};

/** Libellé affiché d'un effet : celui saisi à la main, sinon celui de son origine. */
export function libelleEffet(effet: Pick<CombatEffect, 'origine' | 'libelle'>): string {
  return effet.libelle ?? ORIGINE_LIBELLE[effet.origine] ?? effet.origine;
}

function puce(contribution: number, nom: string): string {
  return `${contribution > 0 ? '+' : '−'} ${Math.abs(contribution)} ${nom}`;
}

/** Identifiant suivant : `e-<plus grand numéro + 1>`. */
export function nextEffectId(effets: readonly CombatEffect[]): string {
  const max = effets.reduce((plusGrand, effet) => {
    const numero = Number(effet.id.replace(/^e-/, ''));
    return Number.isInteger(numero) ? Math.max(plusGrand, numero) : plusGrand;
  }, 0);
  return `e-${max + 1}`;
}

function ajouter(effets: readonly CombatEffect[], crees: readonly NewEffect[]): CombatEffect[] {
  const resultat = [...effets];
  for (const cree of crees) {
    resultat.push({...cree, id: nextEffectId(resultat)});
  }
  return resultat;
}

/** Les modificateurs d'un jet, un par puce. Un effet de valeur 0 (une trace) n'en produit pas.
 * Attaque : les effets d'attaque de l'attaquant, la défense de la cible, et le petit bouclier de la fiche s'il n'a pas servi.
 * Dégâts : les effets de dégâts de l'attaquant et la protection de la cible. */
export function modificateursPour(effets: readonly CombatEffect[], contexte: RollContext): ModifierTerm[] {
  const {jet, attaquant, cible} = contexte;
  const statDeLAttaquant: EffectStat = jet === 'attaque' ? 'attaque' : 'degats';
  const statDeLaCible: EffectStat = jet === 'attaque' ? 'defense' : 'protection';
  const termes: ModifierTerm[] = [];

  for (const effet of effets) {
    if (effet.valeur === 0) {
      continue;
    }
    const deLAttaquant = effet.porteur === attaquant && effet.quand === 'attaque' && effet.stat === statDeLAttaquant;
    const subiParLaCible = effet.porteur === cible && effet.quand === 'subie' && effet.stat === statDeLaCible;
    if (!deLAttaquant && !subiParLaCible) {
      continue;
    }
    if (effet.cible !== undefined && effet.cible !== (deLAttaquant ? cible : attaquant)) {
      continue;
    }
    // Un bonus de défense ou de protection de la cible pèse contre l'attaquant.
    const contribution = subiParLaCible ? -effet.valeur : effet.valeur;
    termes.push({effetId: effet.id, label: puce(contribution, libelleEffet(effet)), valeur: contribution, tone: contribution > 0 ? 'plus' : 'minus'});
  }

  const bouclierPerdu = effets.some((effet) => effet.porteur === cible && (effet.origine === BOUCLIER_DEPENSE || effet.origine === SANS_BOUCLIER));
  if (jet === 'attaque' && contexte.bouclier > 0 && !bouclierPerdu) {
    termes.push({effetId: null, label: puce(-contexte.bouclier, 'bouclier'), valeur: -contexte.bouclier, tone: 'minus'});
  }
  return termes;
}

/** Total des contributions des puces. */
export function sommeModificateurs(termes: readonly ModifierTerm[]): number {
  return termes.reduce((somme, terme) => somme + terme.valeur, 0);
}

/** Fait évoluer le registre. Fonction pure : l'entrée n'est jamais modifiée. */
export function appliquerEvenement(effets: readonly CombatEffect[], evenement: EffectEvent): readonly CombatEffect[] {
  switch (evenement.type) {
    case 'debut-tour':
      return effets.filter(
        (effet) =>
          !(effet.porteur === evenement.carte && (effet.duree.type === 'debut-tour-porteur' || (effet.duree.type === 'usages' && effet.duree.expireAuTour === true))),
      );

    case 'fin-tour': {
      // La carte repart de zéro : ce qu'elle portait de son tour précédent et les effets « à sa prochaine action » tombent,
      // puis ceux de ce tour naissent. Un effet recréé remplace le précédent au lieu de s'y ajouter.
      const restants = effets.filter(
        (effet) =>
          !(effet.porteur === evenement.carte && (effet.duree.type === 'debut-tour-porteur' || effet.duree.type === 'action-porteur')) &&
          !evenement.crees.some((cree) => cree.origine === effet.origine && cree.porteur === effet.porteur),
      );
      return ajouter(restants, evenement.crees);
    }

    case 'jet-attaque': {
      const apresUsage = effets.flatMap((effet): CombatEffect[] => {
        if (effet.porteur !== evenement.cible || effet.duree.type !== 'usages') {
          return [effet];
        }
        return effet.duree.restants > 1 ? [{...effet, duree: {...effet.duree, restants: effet.duree.restants - 1}}] : [];
      });
      const dejaDepense = apresUsage.some((effet) => effet.porteur === evenement.cible && effet.origine === BOUCLIER_DEPENSE);
      return dejaDepense
        ? apresUsage
        : ajouter(apresUsage, [{origine: BOUCLIER_DEPENSE, porteur: evenement.cible, stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false}]);
    }

    case 'nouveau-round':
      return effets.filter((effet) => effet.duree.type !== 'fin-round');

    case 'ajout-manuel':
      return ajouter(effets, [{...evenement.effet, manuel: true}]);

    case 'retrait-manuel':
      return effets.filter((effet) => effet.id !== evenement.id);

    case 'carte-retiree':
      return effets.filter((effet) => effet.porteur !== evenement.carte && effet.cible !== evenement.carte);
  }
}

/** Les effets durables que crée la fin du tour d'une carte : posture (défense, parade, perte du bouclier) et défense totale. */
export function effetsDeTour(carte: string, choix: TurnChoice): NewEffect[] {
  const defense = {porteur: carte, stat: 'defense', quand: 'subie', manuel: false} as const;
  const jusquAuTour = {type: 'debut-tour-porteur'} as const;
  const effets: NewEffect[] = [];
  const posture = choix.posture;
  const valeur = posture ? POSTURE_DEFENSE[posture] : undefined;

  if (posture && valeur) {
    effets.push({
      ...defense,
      origine: POSTURE_ORIGINE[posture],
      valeur,
      // La parade ne couvre qu'une attaque subie, et tombe avec le tour de son porteur si elle n'a pas servi.
      duree: posture === 'dual-parry' ? {type: 'usages', restants: 1, expireAuTour: true} : jusquAuTour,
    });
  }
  if (posture === 'intrepid') {
    effets.push({...defense, origine: SANS_BOUCLIER, valeur: 0, duree: jusquAuTour});
  }
  if (choix.defenseTotale) {
    effets.push({...defense, origine: 'defense-totale', valeur: 2, duree: jusquAuTour});
  }
  return effets;
}
```

- [ ] **Étape 5 : lancer les tests et vérifier qu'ils passent**

Depuis `front/` : `npm test -- --watch=false combat-effects`
Attendu : tous les tests de `combat-effects.util.spec.ts` passent.

- [ ] **Étape 6 : vérifications du front**

Depuis `front/` : `npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals`, `npm run build`, `npm test -- --watch=false`, `npx knip`.
Attendu : knip signale peut-être `libelleEffet`, `nextEffectId`, `sommeModificateurs`, `POSTURE_DEFENSE` comme non utilisés hors tests : ils servent aux tâches 3 à 6. Si knip les signale, **continuer** (ils sont consommés dans les tâches suivantes) et ne lancer knip qu'à la fin de la Tâche 4.

- [ ] **Étape 7 : point de contrôle**

Message de commit proposé : `feat(combat): noyau du registre d'effets (types et fonctions pures)`.

---

### Tâche 2 : le backend valide `effets` et convertit l'ancien format

**Fichiers :**
- Modifier : `backend/app/Http/Services/Bol/BolCombatState.php`
- Modifier : `backend/app/Http/Controllers/Bol/BolFightSessionController.php` (méthode `updateCombatState`)
- Modifier : `backend/app/Http/Services/Bol/BolFightSessionService.php` (méthode `updateCombatState`)
- Tester : `backend/tests/Unit/BolCombatStateTest.php`

**Interfaces :**
- Consomme : le format JSON de `CombatEffect` (Tâche 1) :
  `{id, origine, porteur, stat, valeur, quand, duree: {type, restants?, expireAuTour?}, manuel, cible?, libelle?}`.
- Produit : `BolCombatState::normalize($raw)` rend `['round', 'joues', 'effets', 'exclus']` (plus de `defense_totale` ni `attaquees`) ; `BolCombatState::INITIAL` = `['round' => 1, 'joues' => [], 'effets' => [], 'exclus' => []]`.

- [ ] **Étape 1 : réécrire les tests**

Dans `backend/tests/Unit/BolCombatStateTest.php`, remplacer le contenu des tests existants et ajouter ceux des effets. Fichier complet :

```php
<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolCombatState;
use PHPUnit\Framework\TestCase;

class BolCombatStateTest extends TestCase
{
    private function effet(array $over = []): array
    {
        return array_merge([
            'id'       => 'e-1',
            'origine'  => 'posture-defensive',
            'porteur'  => 'hero-1',
            'stat'     => 'defense',
            'valeur'   => 1,
            'quand'    => 'subie',
            'duree'    => ['type' => 'debut-tour-porteur'],
            'manuel'   => false,
        ], $over);
    }

    public function test_a_missing_state_is_round_one_with_nobody_played(): void
    {
        $this->assertSame(['round' => 1, 'joues' => [], 'effets' => [], 'exclus' => []], BolCombatState::normalize(null));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize('n-importe-quoi'));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize([]));
    }

    public function test_keeps_a_valid_state(): void
    {
        $state = ['round' => 3, 'joues' => ['hero-1', 'pnj-7'], 'effets' => [$this->effet()], 'exclus' => ['creature-4']];

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
            'round' => 2,
            'joues' => ['hero-1', 'hero-1', '', 12, null, ['x'], 'pnj-7'],
        ]);

        $this->assertSame(['hero-1', 'pnj-7'], $state['joues']);
    }

    public function test_ignores_unknown_fields(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'joues' => [], 'effets' => [], 'autre' => true]);

        $this->assertSame(['round', 'joues', 'effets', 'exclus'], array_keys($state));
    }

    public function test_keeps_the_excluded_cards_and_drops_invalid_keys(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'exclus' => ['pnj-3', 'pnj-3', '', 5, 'hero-2']]);

        $this->assertSame(['pnj-3', 'hero-2'], $state['exclus']);
    }

    public function test_converts_the_old_format_into_effects(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'joues' => [], 'defense_totale' => ['hero-1'], 'attaquees' => ['pnj-7']]);

        $this->assertSame(
            [
                ['id' => 'e-1', 'origine' => 'defense-totale', 'porteur' => 'hero-1', 'stat' => 'defense', 'valeur' => 2, 'quand' => 'subie', 'duree' => ['type' => 'debut-tour-porteur'], 'manuel' => false],
                ['id' => 'e-2', 'origine' => 'bouclier-depense', 'porteur' => 'pnj-7', 'stat' => 'defense', 'valeur' => 0, 'quand' => 'subie', 'duree' => ['type' => 'fin-round'], 'manuel' => false],
            ],
            $state['effets'],
        );
        $this->assertArrayNotHasKey('defense_totale', $state);
        $this->assertArrayNotHasKey('attaquees', $state);
    }

    public function test_the_old_format_is_ignored_once_effects_exist(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [], 'defense_totale' => ['hero-1']]);

        $this->assertSame([], $state['effets']);
    }

    public function test_drops_invalid_effects_and_keeps_the_valid_ones(): void
    {
        $valid = $this->effet(['id' => 'e-2']);
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [
            'pas-un-tableau',
            $this->effet(['id' => '']),
            $this->effet(['id' => 'e-3', 'stat' => 'magie']),
            $this->effet(['id' => 'e-4', 'valeur' => 99]),
            $this->effet(['id' => 'e-5', 'valeur' => 'beaucoup']),
            $this->effet(['id' => 'e-6', 'quand' => 'jamais']),
            $this->effet(['id' => 'e-7', 'duree' => ['type' => 'a-vie']]),
            $this->effet(['id' => 'e-8', 'duree' => ['type' => 'usages', 'restants' => 0]]),
            $valid,
        ]]);

        $this->assertSame([$valid], $state['effets']);
    }

    public function test_drops_effects_with_a_repeated_id(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [$this->effet(), $this->effet(['origine' => 'autre'])]]);

        $this->assertCount(1, $state['effets']);
    }

    public function test_keeps_at_most_two_hundred_effects(): void
    {
        $many = array_map(fn ($i) => $this->effet(['id' => "e-$i"]), range(1, 500));

        $this->assertCount(200, BolCombatState::normalize(['round' => 1, 'effets' => $many])['effets']);
    }

    public function test_keeps_the_optional_fields_of_a_manual_effect(): void
    {
        $manual = $this->effet([
            'id' => 'e-1', 'manuel' => true, 'cible' => 'pnj-7', 'libelle' => str_repeat('x', 100),
            'duree' => ['type' => 'usages', 'restants' => 2, 'expireAuTour' => true],
        ]);
        $kept = BolCombatState::normalize(['round' => 1, 'effets' => [$manual]])['effets'][0];

        $this->assertSame('pnj-7', $kept['cible']);
        $this->assertSame(60, mb_strlen($kept['libelle']));
        $this->assertSame(['type' => 'usages', 'restants' => 2, 'expireAuTour' => true], $kept['duree']);
        $this->assertTrue($kept['manuel']);
    }
}
```

- [ ] **Étape 2 : lancer et vérifier l'échec**

```bash
docker cp backend/tests/Unit/BolCombatStateTest.php diceway:/var/www/html/tests/Unit/BolCombatStateTest.php
docker exec diceway php artisan test --filter=BolCombatState
```
Attendu : échecs (la classe ne connaît pas `effets`).

- [ ] **Étape 3 : implémenter `BolCombatState`**

Remplacer le contenu de `backend/app/Http/Services/Bol/BolCombatState.php` par :

```php
<?php

namespace App\Http\Services\Bol;

/**
 * État d'un combat en cours, gardé dans `bol_fight_session.etat_combat` : le round, les cartes qui ont joué ce round,
 * les effets en cours (bonus, malus et traces d'usage : posture, défense totale, petit bouclier dépensé…) et les cartes
 * exclues de ce combat (restées sur la table, mais qui n'y participent pas : elles réintègrent la scène à la fin du
 * combat). Les clés de carte sont celles du front (`{kind}-{pivotId}`, ex. `creature-12`). Le backend valide la forme des
 * effets sans connaître les règles. Fonctions pures, sans base.
 */
class BolCombatState
{
    public const INITIAL = ['round' => 1, 'joues' => [], 'effets' => [], 'exclus' => []];

    private const MAX_EFFETS = 200;
    private const STATS = ['attaque', 'defense', 'degats', 'protection', 'action'];
    private const QUAND = ['attaque', 'subie'];
    private const DUREES = ['usages', 'fin-round', 'debut-tour-porteur', 'action-porteur', 'combat'];

    /**
     * État valide à partir de n'importe quelle valeur lue ou reçue : un état absent ou mal formé
     * (combat démarré avant que l'état n'existe) vaut le round 1, personne n'ayant joué. Un état de l'ancien format
     * (`defense_totale`, `attaquees`) est converti en effets.
     *
     * @return array{round: int, joues: array<int, string>, effets: array<int, array<string, mixed>>, exclus: array<int, string>}
     */
    public static function normalize(mixed $raw): array
    {
        if (!is_array($raw)) {
            return self::INITIAL;
        }

        return [
            'round'  => max(1, (int) (is_numeric($raw['round'] ?? null) ? $raw['round'] : 1)),
            'joues'  => self::keys($raw['joues'] ?? null),
            'effets' => array_key_exists('effets', $raw) ? self::effets($raw['effets']) : self::effetsDeLAncienFormat($raw),
            'exclus' => self::keys($raw['exclus'] ?? null),
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

    /** @return array<int, array<string, mixed>> */
    private static function effets(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        $effets = [];
        $ids = [];
        foreach ($raw as $candidat) {
            $effet = self::effet($candidat);
            if ($effet === null || isset($ids[$effet['id']])) {
                continue;
            }
            $ids[$effet['id']] = true;
            $effets[] = $effet;
            if (count($effets) >= self::MAX_EFFETS) {
                break;
            }
        }

        return $effets;
    }

    /** @return array<string, mixed>|null l'effet nettoyé, ou null s'il est invalide */
    private static function effet(mixed $raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }
        foreach (['id', 'origine', 'porteur'] as $champ) {
            if (!is_string($raw[$champ] ?? null) || $raw[$champ] === '') {
                return null;
            }
        }
        $valeur = $raw['valeur'] ?? null;
        if (!is_int($valeur) || $valeur < -20 || $valeur > 20) {
            return null;
        }
        if (!in_array($raw['stat'] ?? null, self::STATS, true) || !in_array($raw['quand'] ?? null, self::QUAND, true)) {
            return null;
        }
        $duree = self::duree($raw['duree'] ?? null);
        if ($duree === null) {
            return null;
        }

        $effet = [
            'id'      => $raw['id'],
            'origine' => $raw['origine'],
            'porteur' => $raw['porteur'],
            'stat'    => $raw['stat'],
            'valeur'  => $valeur,
            'quand'   => $raw['quand'],
            'duree'   => $duree,
            'manuel'  => ($raw['manuel'] ?? false) === true,
        ];
        if (is_string($raw['cible'] ?? null) && $raw['cible'] !== '') {
            $effet['cible'] = $raw['cible'];
        }
        if (is_string($raw['libelle'] ?? null) && $raw['libelle'] !== '') {
            $effet['libelle'] = mb_substr($raw['libelle'], 0, 60);
        }

        return $effet;
    }

    /** @return array<string, mixed>|null */
    private static function duree(mixed $raw): ?array
    {
        if (!is_array($raw) || !in_array($raw['type'] ?? null, self::DUREES, true)) {
            return null;
        }
        if ($raw['type'] !== 'usages') {
            return ['type' => $raw['type']];
        }
        $restants = $raw['restants'] ?? null;
        if (!is_int($restants) || $restants < 1 || $restants > 20) {
            return null;
        }
        $duree = ['type' => 'usages', 'restants' => $restants];
        if (($raw['expireAuTour'] ?? false) === true) {
            $duree['expireAuTour'] = true;
        }

        return $duree;
    }

    /**
     * Effets équivalents à l'ancien état : chaque carte en défense totale reçoit +2 jusqu'à son prochain tour, chaque carte
     * déjà attaquée ce round une trace « bouclier dépensé ».
     *
     * @return array<int, array<string, mixed>>
     */
    private static function effetsDeLAncienFormat(array $raw): array
    {
        $effets = [];
        foreach (self::keys($raw['defense_totale'] ?? null) as $porteur) {
            $effets[] = ['origine' => 'defense-totale', 'porteur' => $porteur, 'stat' => 'defense', 'valeur' => 2, 'quand' => 'subie', 'duree' => ['type' => 'debut-tour-porteur'], 'manuel' => false];
        }
        foreach (self::keys($raw['attaquees'] ?? null) as $porteur) {
            $effets[] = ['origine' => 'bouclier-depense', 'porteur' => $porteur, 'stat' => 'defense', 'valeur' => 0, 'quand' => 'subie', 'duree' => ['type' => 'fin-round'], 'manuel' => false];
        }

        return array_map(fn (array $effet, int $i) => ['id' => 'e-' . ($i + 1)] + $effet, $effets, array_keys($effets));
    }
}
```

- [ ] **Étape 4 : lancer les tests**

```bash
docker exec diceway php artisan test --filter=BolCombatState
```
Attendu : tous passent. Vérifier en particulier `test_converts_the_old_format_into_effects` : l'ordre des clés d'un effet converti est `id, origine, porteur, stat, valeur, quand, duree, manuel`.

- [ ] **Étape 5 : adapter le contrôleur et le service**

Dans `BolFightSessionController::updateCombatState`, remplacer les règles :

```php
        $data = $request->validate([
            'round'            => 'required|integer|min:1',
            'joues'            => 'present|array',
            'joues.*'          => 'string',
            'effets'           => 'sometimes|array|max:200',
            'effets.*'         => 'array',
            'exclus'           => 'sometimes|array',
            'exclus.*'         => 'string',
        ]);
```

Dans `BolFightSessionService::updateCombatState`, remplacer la ligne `$etat['exclus'] ??= …` et ajouter celle des effets :

```php
        // Les cartes exclues sont fixées au démarrage, et les effets ne sont pas réécrits par un état envoyé sans eux.
        $existant = BolCombatState::normalize($session->etat_combat);
        $etat['exclus'] ??= $existant['exclus'];
        $etat['effets'] ??= $existant['effets'];
```

- [ ] **Étape 6 : tester la requête de bout en bout**

```bash
docker exec diceway php artisan tinker --execute='$s=\App\Models\Bol\BolFightSession::where("statut","combat")->first(); echo $s ? json_encode(\App\Http\Services\Bol\BolCombatState::normalize($s->etat_combat)) : "aucun combat en cours";'
```
Attendu : un état au nouveau format (les anciens combats sont convertis à la lecture) ou « aucun combat en cours ».

Puis lancer toute la suite : `docker exec diceway php artisan test`. Attendu : aucun échec nouveau.

- [ ] **Étape 7 : point de contrôle**

Message de commit proposé : `feat(combat): le backend valide les effets et convertit l'ancien état`.

---

### Tâche 3 : l'état du front passe aux effets, les transitions de tour par événements

Comportement identique à aujourd'hui pour la défense totale et le tour : seuls les types changent.

**Fichiers :**
- Modifier : `front/src/app/bol/session/models/combat-turn.model.ts`
- Modifier : `front/src/app/bol/models/bol-fight-session.model.ts`
- Modifier : `front/src/app/bol/session/play/tapis/combat-effects.util.ts` (ajouter `normalizeEffets`, `effetsDeLAncienFormat`)
- Modifier : `front/src/app/bol/session/play/tapis/combat-turn.util.ts`
- Tester : `combat-effects.util.spec.ts`, `combat-turn.util.spec.ts`

**Interfaces :**
- Consomme (tâche 1) : `appliquerEvenement`, `effetsDeTour`, `BOUCLIER_DEPENSE`.
- Produit :
  - `EtatCombat = {round, joues, effets: readonly CombatEffect[], exclus}` (plus de `defense_totale` ni `attaquees`) ;
  - `normalizeEffets(raw: unknown): CombatEffect[]` et `effetsDeLAncienFormat(source: Record<string, unknown>): CombatEffect[]` (dans `combat-effects.util.ts`) ;
  - `endTurn(ordered, etat, crees?: readonly NewEffect[]): EtatCombat` ;
  - `totalDefense(ordered, etat): EtatCombat` (inchangée de l'extérieur) ;
  - `giveBackTurn(etat, key): EtatCombat` (inchangée de l'extérieur).

- [ ] **Étape 1 : écrire les tests de normalisation des effets**

Ajouter à `combat-effects.util.spec.ts` (et importer `normalizeEffets`, `effetsDeLAncienFormat`) :

```ts
describe('normalizeEffets', () => {
  it('keeps valid effects and drops the invalid ones', () => {
    const valide = effet({id: 'e-2'});
    expect(normalizeEffets([valide, 'x', null, {...effet({id: 'e-3'}), stat: 'magie'}, {...effet({id: 'e-4'}), valeur: 99}])).toEqual([valide]);
  });

  it('returns nothing for something that is not a list', () => {
    expect(normalizeEffets('x')).toEqual([]);
    expect(normalizeEffets(undefined)).toEqual([]);
    expect(normalizeEffets({0: effet()})).toEqual([]);
  });

  it('drops a repeated id and keeps at most 200 effects', () => {
    expect(normalizeEffets([effet(), effet({origine: 'autre'})])).toHaveLength(1);
    const beaucoup = Array.from({length: 500}, (_, i) => effet({id: `e-${i + 1}`}));
    expect(normalizeEffets(beaucoup)).toHaveLength(200);
  });

  it('keeps the optional fields, trims the label to 60 characters', () => {
    const manuel = effet({manuel: true, cible: 'pnj-7', libelle: 'x'.repeat(100), duree: {type: 'usages', restants: 2, expireAuTour: true}});
    const [garde] = normalizeEffets([manuel]);
    expect(garde.cible).toBe('pnj-7');
    expect(garde.libelle).toHaveLength(60);
    expect(garde.duree).toEqual({type: 'usages', restants: 2, expireAuTour: true});
  });
});

describe('effetsDeLAncienFormat', () => {
  it('turns the total-defence cards and the attacked cards into effects', () => {
    expect(effetsDeLAncienFormat({defense_totale: ['hero-1', 'hero-1', 4], attaquees: ['pnj-7']})).toEqual([
      effet({id: 'e-1', origine: 'defense-totale', porteur: 'hero-1', valeur: 2}),
      effet({id: 'e-2', origine: BOUCLIER_DEPENSE, porteur: 'pnj-7', valeur: 0, duree: {type: 'fin-round'}}),
    ]);
  });

  it('gives nothing when the old fields are missing or malformed', () => {
    expect(effetsDeLAncienFormat({})).toEqual([]);
    expect(effetsDeLAncienFormat({defense_totale: 'x', attaquees: null})).toEqual([]);
  });
});
```

- [ ] **Étape 2 : lancer et vérifier l'échec**

`npm test -- --watch=false combat-effects` : échec (`normalizeEffets` n'existe pas).

- [ ] **Étape 3 : implémenter la normalisation**

Ajouter à `combat-effects.util.ts` (avec `EffectDuration` importé du modèle) :

```ts
const MAX_EFFETS = 200;
const STATS: readonly string[] = ['attaque', 'defense', 'degats', 'protection', 'action'];
const QUAND: readonly string[] = ['attaque', 'subie'];
const DUREES: readonly string[] = ['usages', 'fin-round', 'debut-tour-porteur', 'action-porteur', 'combat'];

function texte(valeur: unknown): string | null {
  return typeof valeur === 'string' && valeur !== '' ? valeur : null;
}

function duree(raw: unknown): EffectDuration | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  const type = source['type'];
  if (typeof type !== 'string' || !DUREES.includes(type)) {
    return null;
  }
  if (type !== 'usages') {
    return {type} as EffectDuration;
  }
  const restants = source['restants'];
  if (!Number.isInteger(restants) || (restants as number) < 1 || (restants as number) > 20) {
    return null;
  }
  return source['expireAuTour'] === true ? {type: 'usages', restants: restants as number, expireAuTour: true} : {type: 'usages', restants: restants as number};
}

function effetValide(raw: unknown): CombatEffect | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  const id = texte(source['id']);
  const origine = texte(source['origine']);
  const porteur = texte(source['porteur']);
  const valeur = source['valeur'];
  const fin = duree(source['duree']);
  if (!id || !origine || !porteur || !fin) {
    return null;
  }
  if (!Number.isInteger(valeur) || (valeur as number) < -20 || (valeur as number) > 20) {
    return null;
  }
  if (!STATS.includes(source['stat'] as string) || !QUAND.includes(source['quand'] as string)) {
    return null;
  }
  const cible = texte(source['cible']);
  const libelle = texte(source['libelle']);
  return {
    id,
    origine,
    porteur,
    stat: source['stat'] as EffectStat,
    valeur: valeur as number,
    quand: source['quand'] as EffectWhen,
    duree: fin,
    manuel: source['manuel'] === true,
    ...(cible ? {cible} : {}),
    ...(libelle ? {libelle: libelle.slice(0, 60)} : {}),
  };
}

/** Effets valides à partir de ce que renvoie l'API : les lignes invalides ou en double sont ignorées, 200 au plus (mêmes règles que le backend). */
export function normalizeEffets(raw: unknown): CombatEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const vus = new Set<string>();
  const effets: CombatEffect[] = [];
  for (const candidat of raw) {
    const effet = effetValide(candidat);
    if (effet && !vus.has(effet.id)) {
      vus.add(effet.id);
      effets.push(effet);
      if (effets.length >= MAX_EFFETS) {
        break;
      }
    }
  }
  return effets;
}

function clesUniques(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter((cle): cle is string => typeof cle === 'string' && cle !== ''))] : [];
}

/** Effets équivalents à un état de l'ancien format : `defense_totale` (+2 jusqu'au prochain tour) et `attaquees` (bouclier dépensé ce round). */
export function effetsDeLAncienFormat(source: Record<string, unknown>): CombatEffect[] {
  const defense = clesUniques(source['defense_totale']).map<NewEffect>((porteur) => ({origine: 'defense-totale', porteur, stat: 'defense', valeur: 2, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false}));
  const bouclier = clesUniques(source['attaquees']).map<NewEffect>((porteur) => ({origine: BOUCLIER_DEPENSE, porteur, stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false}));
  return [...defense, ...bouclier].map((effet, index) => ({...effet, id: `e-${index + 1}`}));
}
```

Mettre à jour l'import du haut du fichier : `import {CombatEffect, EffectDuration, EffectEvent, EffectStat, EffectWhen, ModifierTerm, NewEffect, RollContext, TurnChoice} from '../../models/combat-effect.model';`

- [ ] **Étape 4 : lancer les tests de normalisation**

`npm test -- --watch=false combat-effects` : attendu, tout passe.

- [ ] **Étape 5 : passer `EtatCombat` aux effets**

`combat-turn.model.ts` : remplacer les champs `defense_totale` et `attaquees` par :

```ts
  /** Effets en cours (postures, défense totale, petit bouclier dépensé…), cf. `combat-effects.util.ts`. */
  readonly effets: readonly CombatEffect[];
```
et ajouter l'import `import {CombatEffect} from './combat-effect.model';`. Mettre à jour le commentaire de tête de l'interface (« les cartes en défense totale » devient « les effets en cours »).

`bol-fight-session.model.ts`, dans `EtatCombatDto` : remplacer `defense_totale: string[];` et `attaquees?: string[];` par `effets?: unknown[];` avec le commentaire `/** Effets en cours, validés par le front (cf. `normalizeEffets`). */`. Garder `exclus?: string[];`.

- [ ] **Étape 6 : adapter les tests de `combat-turn.util.spec.ts`**

Ajouter en haut les imports `CombatEffect` et, après les fonctions d'aide existantes, remplacer l'aide `etat` et ajouter `defended` :

```ts
function defended(key: string, id = 'e-1'): CombatEffect {
  return {id, origine: 'defense-totale', porteur: key, stat: 'defense', valeur: 2, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false};
}

function etat(round: number, joues: string[] = [], effets: CombatEffect[] = []): EtatCombat {
  return {round, joues, effets, exclus: []};
}
```

Puis remplacer, dans le fichier, chaque appel qui passait des clés en défense par des effets :

| Avant | Après |
| --- | --- |
| `normalizeEtat({round: 3, joues: ['hero-1'], defense_totale: ['pnj-7']})` attendu `etat(3, ['hero-1'], ['pnj-7'])` | attendu `etat(3, ['hero-1'], [defended('pnj-7')])` |
| `normalizeEtat({round: 0, joues: [...], defense_totale: 'x'})` attendu `etat(1, ['hero-1'])` | inchangé (le champ est ignoré : `defense_totale: 'x'` donne `effets: []`) |
| `endTurn(order, etat(1, [], ['pnj-7']))` attendu `etat(1, ['hero-1'], [])` | `etat(1, [], [defended('pnj-7')])` ; attendu `etat(1, ['hero-1'])` |
| `totalDefense(...)` attendu `etat(1, ['hero-1'], ['hero-1'])` | attendu `etat(1, ['hero-1'], [defended('hero-1')])` |
| `afterPretre` attendu `etat(2, [], ['pnj-7'])` | attendu `etat(2, [], [defended('pnj-7')])` |
| `endTurn(order, afterPretre)` attendu `etat(2, ['hero-1'], [])` | inchangé en valeur : `etat(2, ['hero-1'])` |
| `stale = etat(2, [], ['pnj-7'])` | `etat(2, [], [defended('pnj-7')])` ; attendu `etat(2, ['pnj-7'])` |
| `excluding` (`defense_totale: [], attaquees: []`) | `({round: 1, joues: [], effets: [], exclus: keys})` |
| Test « forgets who was attacked… » (`attaquees`) | remplacé par le test ci-dessous |
| `normalizeEtat({round: 2, attaquees: [...]}).attaquees` | remplacé par le test d'ancien format ci-dessous |

Remplacer le test « forgets who was attacked when a new round starts, and keeps it within the round » par :

```ts
  it('forgets the shield spent this round when a new round starts, and keeps it within the round', () => {
    const spent: CombatEffect = {id: 'e-1', origine: 'bouclier-depense', porteur: 'pnj-7', stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false};
    const attacked: EtatCombat = {...etat(1), effets: [spent]};

    expect(endTurn(order, attacked).effets).toEqual([spent]);
    expect(endTurn(order, {...attacked, joues: ['hero-1']}).effets).toEqual([]);
  });

  it('applies the creations of the turn: a posture lasts until that card plays again', () => {
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const apres = endTurn(order, etat(1), crees);
    expect(apres.effets.map((e) => [e.origine, e.porteur])).toEqual([['posture-defensive', 'hero-1']]);
    const nextRound = endTurn(order, {...apres, joues: ['hero-1']});
    expect(nextRound.round).toBe(2);
    expect(nextRound.effets).toEqual([]);
  });

  it('expires the effects of a card that is alone and becomes active again right away', () => {
    const alone = ordered(KALENA);
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const apres = endTurn(alone, etat(1), crees);
    expect(apres.round).toBe(2);
    expect(apres.effets).toEqual([]);
  });
```

et à la place du test `normalizeEtat({round: 2, attaquees: ...})`, dans la section `normalizeEtat` :

```ts
  it('converts the old format (defense_totale, attaquees) into effects, and ignores it once effects exist', () => {
    const converted = normalizeEtat({round: 2, defense_totale: ['pnj-7'], attaquees: ['hero-1', 'hero-1']});
    expect(converted.effets.map((e) => [e.id, e.origine, e.porteur])).toEqual([
      ['e-1', 'defense-totale', 'pnj-7'],
      ['e-2', 'bouclier-depense', 'hero-1'],
    ]);
    expect(normalizeEtat({round: 2, effets: [], defense_totale: ['pnj-7']}).effets).toEqual([]);
  });
```

Importer `effetsDeTour` dans le spec : `import {effetsDeTour} from './combat-effects.util';`.

- [ ] **Étape 7 : lancer les tests de tour et vérifier l'échec**

`npm test -- --watch=false combat-turn` : échec (le code utilise encore `defense_totale`).

- [ ] **Étape 8 : adapter `combat-turn.util.ts`**

Remplacer, dans `combat-turn.util.ts` :

1. En tête : `import {appliquerEvenement, effetsDeLAncienFormat, normalizeEffets} from './combat-effects.util';`, `import {NewEffect} from '../../models/combat-effect.model';` et `export const INITIAL_ETAT: EtatCombat = {round: 1, joues: [], effets: [], exclus: []};`
2. Dans `normalizeEtat`, remplacer les lignes `defense_totale` et `attaquees` par :
```ts
    effets: 'effets' in source ? normalizeEffets(source['effets']) : effetsDeLAncienFormat(source),
```
3. Supprimer `liftDefenseOfActive`, puis réécrire `endTurn`, `totalDefense` et `giveBackTurn` :

```ts
/** « Fin du tour » : la carte active a joué, et ses effets durables naissent (`crees`). S'il ne reste personne à jouer ce round, le suivant
 * commence — sauf si personne ne pourrait y jouer non plus (tout le monde est hors combat). La carte qui devient active voit tomber
 * ses effets « jusqu'à son prochain tour ». */
export function endTurn(ordered: readonly OrderedCard[], etat: EtatCombat, crees: readonly NewEffect[] = []): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  const onTable = new Set(ordered.map((entry) => entry.card.key));
  let next: EtatCombat = {
    ...etat,
    joues: [...etat.joues.filter((key) => onTable.has(key)), activeKey],
    effets: appliquerEvenement(etat.effets, {type: 'fin-tour', carte: activeKey, crees}),
  };

  if (turnState(ordered, next).activeKey === null) {
    const nextRound: EtatCombat = {...next, round: etat.round + 1, joues: [], effets: appliquerEvenement(next.effets, {type: 'nouveau-round'})};
    if (turnState(ordered, nextRound).activeKey !== null) {
      next = nextRound;
    }
  }

  const nowActive = turnState(ordered, next).activeKey;
  return nowActive === null ? next : {...next, effets: appliquerEvenement(next.effets, {type: 'debut-tour', carte: nowActive})};
}

/** « Défense totale » : la carte active termine son tour avec +2 en défense, jusqu'à ce qu'elle redevienne active. */
export function totalDefense(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }
  return endTurn(ordered, etat, effetsDeTour(activeKey, {posture: null, defenseTotale: true}));
}

/** « Rendre la main » : une carte qui a joué redevient jouable ce round. Ce que son tour avait fait naître (défense totale, posture) est
 * annulé avec lui — sinon elle pourrait attaquer en gardant le +2. */
export function giveBackTurn(etat: EtatCombat, key: string): EtatCombat {
  if (!etat.joues.includes(key)) {
    return etat;
  }
  return {
    ...etat,
    joues: etat.joues.filter((played) => played !== key),
    effets: etat.effets.filter((effet) => !(effet.porteur === key && effet.duree.type === 'debut-tour-porteur')),
  };
}
```
Ajouter `effetsDeTour` à l'import de `./combat-effects.util`.

- [ ] **Étape 9 : lancer les tests**

`npm test -- --watch=false combat-turn combat-effects` : attendu, tout passe. Si `endTurn … toEqual(etat(…))` échoue sur l'identifiant d'un effet, vérifier que `defended` utilise `'e-1'` et que l'effet est le premier créé.

- [ ] **Étape 10 : adapter la page au nouveau type (compilation seulement)**

`session-play-page.ts` utilise encore `defense_totale` et `attaquees` (lignes autour de 272-298, 767, 818-819). Pour que le projet compile **sans changer le comportement**, remplacer provisoirement :

- dans l'effet de `targetStats` : lire `const effets = this.etat().effets;` et calculer
```ts
const defenseTotale = effets.some((e) => e.origine === 'defense-totale' && e.porteur === target?.key);
const bouclierDepense = effets.some((e) => e.origine === 'bouclier-depense' && e.porteur === target?.key);
```
puis `defense: targetStats.defense + (defenseTotale ? 2 : 0)` et `bouclierMalusUneAttaque: bouclierDepense ? 0 : targetStats.bouclierMalusUneAttaque` (cette lecture directe disparaît à la Tâche 4) ;
- dans `saveEtat` : `{round: next.round, joues: [...next.joues], effets: [...next.effets], exclus: [...next.exclus]}` ;
- dans `onAttackRolled` : remplacer le corps par
```ts
    const etat = this.etat();
    if (!etat.effets.some((e) => e.origine === 'bouclier-depense' && e.porteur === target.key)) {
      this.saveEtat({...etat, effets: appliquerEvenement(etat.effets, {type: 'jet-attaque', attaquant: this.activeCard()?.key ?? '', cible: target.key})});
    }
```
avec `import {appliquerEvenement} from './tapis/combat-effects.util';`.

- [ ] **Étape 11 : vérifications du front**

`npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals`, `npx tsc -p tsconfig.spec.json --noEmit`, `npm run build`, `npm test -- --watch=false`. Attendu : tout passe, comportement inchangé à l'écran.

- [ ] **Étape 12 : point de contrôle**

Message de commit proposé : `feat(combat): l'état du combat porte des effets, transitions de tour par événements`.

---

### Tâche 4 : la file d'enregistrement, les effets dans le jet, la non-régression du bouclier

**Fichiers :**
- Créer : `front/src/app/bol/session/play/etat-saver.ts` et `etat-saver.spec.ts`
- Modifier : `front/src/app/bol/session/play/session-play-page.ts` et `.html`
- Modifier : `front/src/app/bol/session/play/combat-board/combat-board.ts` et `.html`
- Modifier : `front/src/app/bol/session/play/tapis/turn-assistant.ts` et `.html`
- Modifier : `front/src/app/bol/session/combat-resolution.util.ts` et son spec
- Créer : `front/scripts/e2e-petit-bouclier.mjs`

**Interfaces :**
- Consomme : `modificateursPour`, `sommeModificateurs`, `appliquerEvenement` (Tâche 1) ; `EtatCombat.effets` (Tâche 3).
- Produit :
  - `EtatSaver` : `new EtatSaver(read: () => EtatCombat, persist: (etat: EtatCombat) => Observable<unknown>, onError: (error: unknown) => void)` ; `apply(update: (etat: EtatCombat) => EtatCombat, options?: {ignoreIfBusy?: boolean}): void` ;
  - entrée `effets: readonly CombatEffect[]` sur `bol-combat-board` et `bol-turn-assistant` ;
  - `computeAttackTotal(diceSum, attackerBonus, targetDefense, modifier, legendaryBonus, postureModifier)` (le paramètre `shieldMalus` disparaît : le bouclier arrive par `modifier`).

#### 4a. La file d'enregistrement

- [ ] **Étape 1 : écrire les tests de `EtatSaver`**

`front/src/app/bol/session/play/etat-saver.spec.ts` :

```ts
import {Subject} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {EtatCombat} from '../models/combat-turn.model';
import {EtatSaver} from './etat-saver';

const base: EtatCombat = {round: 1, joues: [], effets: [], exclus: []};
const jouer = (key: string) => (etat: EtatCombat): EtatCombat => ({...etat, joues: [...etat.joues, key]});

function setup() {
  let courant = base;
  const saved: EtatCombat[] = [];
  const pending: Subject<void>[] = [];
  const errors: unknown[] = [];
  const saver = new EtatSaver(
    () => courant,
    (etat) => {
      saved.push(etat);
      const done = new Subject<void>();
      pending.push(done);
      return done;
    },
    (error) => errors.push(error),
  );
  // Fin d'un enregistrement : la session rechargée devient l'état courant.
  const finish = (index = pending.length - 1): void => {
    courant = saved[index];
    pending[index].next();
    pending[index].complete();
  };
  return {saver, saved, finish, errors, pending, set: (etat: EtatCombat) => (courant = etat)};
}

describe('EtatSaver', () => {
  it('saves the result of an update', () => {
    const {saver, saved} = setup();
    saver.apply(jouer('hero-1'));
    expect(saved).toEqual([{...base, joues: ['hero-1']}]);
  });

  it('does not save when the update changes nothing', () => {
    const {saver, saved} = setup();
    saver.apply((etat) => etat);
    expect(saved).toEqual([]);
  });

  it('applies queued updates in order, on top of the state that was just saved', () => {
    const {saver, saved, finish} = setup();
    saver.apply(jouer('hero-1'));
    saver.apply(jouer('pnj-7'));
    expect(saved).toHaveLength(1);
    finish();
    expect(saved).toHaveLength(2);
    expect(saved[1].joues).toEqual(['hero-1', 'pnj-7']);
  });

  it('drops an update flagged ignoreIfBusy while a save is running (double click on "Fin du tour")', () => {
    const {saver, saved, finish} = setup();
    saver.apply(jouer('hero-1'), {ignoreIfBusy: true});
    saver.apply(jouer('hero-1'), {ignoreIfBusy: true});
    finish();
    expect(saved).toHaveLength(1);
  });

  it('forgets the queue and reports the error when a save fails, then accepts new updates', () => {
    const {saver, saved, pending, errors} = setup();
    saver.apply(jouer('hero-1'));
    saver.apply(jouer('pnj-7'));
    pending[0].error(new Error('réseau'));
    expect(errors).toHaveLength(1);
    expect(saved).toHaveLength(1);
    saver.apply(jouer('hero-2'));
    expect(saved).toHaveLength(2);
  });
});
```

- [ ] **Étape 2 : lancer et vérifier l'échec** : `npm test -- --watch=false etat-saver` (module absent).

- [ ] **Étape 3 : écrire `etat-saver.ts`**

```ts
import {Observable} from 'rxjs';
import {EtatCombat} from '../models/combat-turn.model';

type EtatUpdate = (etat: EtatCombat) => EtatCombat;

/** Enregistre l'état du combat en série. Les actions de l'utilisateur (`ignoreIfBusy`) sont ignorées pendant un enregistrement : un double clic
 * ne termine pas deux tours. Les mises à jour automatiques (jet fait…) sont mises en file et appliquées dans l'ordre, chacune sur l'état
 * rechargé, pour qu'aucune ne parte d'un état périmé ni ne se perde. */
export class EtatSaver {
  private readonly queue: EtatUpdate[] = [];
  private busy = false;

  constructor(
    private readonly read: () => EtatCombat,
    /** Enregistre puis recharge la session ; complète quand l'état lu par `read` est à jour. */
    private readonly persist: (etat: EtatCombat) => Observable<unknown>,
    private readonly onError: (error: unknown) => void,
  ) {}

  apply(update: EtatUpdate, options: {readonly ignoreIfBusy?: boolean} = {}): void {
    if (this.busy && options.ignoreIfBusy) {
      return;
    }
    this.queue.push(update);
    this.flush();
  }

  private flush(): void {
    if (this.busy || this.queue.length === 0) {
      return;
    }
    const current = this.read();
    const next = this.queue.splice(0).reduce((etat, update) => update(etat), current);
    if (next === current) {
      return;
    }

    this.busy = true;
    this.persist(next).subscribe({
      error: (error: unknown) => {
        this.busy = false;
        this.queue.length = 0;
        this.onError(error);
      },
      complete: () => {
        this.busy = false;
        this.flush();
      },
    });
  }
}
```

- [ ] **Étape 4 : lancer les tests** : `npm test -- --watch=false etat-saver` : attendu, tout passe.

#### 4b. Brancher la file dans la page

- [ ] **Étape 5 : remplacer `saveEtat` par `EtatSaver`**

Dans `session-play-page.ts`, supprimer le champ `savingEtat` et la méthode `saveEtat`, et ajouter :

```ts
  /** Enregistre l'état du combat en série (cf. `EtatSaver`), puis recharge la session : l'affichage suit toujours la base. */
  private readonly etatSaver = new EtatSaver(
    () => this.etat(),
    (next) => {
      const sessionId = this.sessionId();
      if (!sessionId || this.mode() !== 'combat') {
        return EMPTY;
      }
      return this.fightSessionService
        .updateCombatState(sessionId, {round: next.round, joues: [...next.joues], effets: [...next.effets], exclus: [...next.exclus]})
        .pipe(
          switchMap(() => this.fightSessionService.fightSession(sessionId)),
          tap((session) => this.session.set(session)),
          take(1),
        );
    },
    (error) => this.tableError(error, "Impossible d'enregistrer le tour."),
  );

  private saveEtat(update: (etat: EtatCombat) => EtatCombat, options?: {readonly ignoreIfBusy?: boolean}): void {
    this.etatSaver.apply(update, options);
  }
```
(imports : `EMPTY, switchMap, tap, take` depuis `rxjs`, `EtatSaver` depuis `./etat-saver`).

Mettre à jour les appelants :

```ts
  protected onEndTurn(): void {
    this.targetKey.set(null);
    this.saveEtat((etat) => endTurn(this.orderedCards(), etat), {ignoreIfBusy: true});
  }
  protected onTotalDefense(): void {
    this.targetKey.set(null);
    this.saveEtat((etat) => totalDefense(this.orderedCards(), etat), {ignoreIfBusy: true});
  }
  protected onGiveBackTurn(key: string): void {
    this.saveEtat((etat) => giveBackTurn(etat, key), {ignoreIfBusy: true});
  }
```

Et `onAttackRolled` :

```ts
  /** Un jet d'attaque vient d'être fait contre cette cible : le registre le sait (le petit bouclier est dépensé pour ce round). */
  protected onAttackRolled(target: TapisCard): void {
    const attaquant = this.activeCard()?.key;
    if (!attaquant) {
      return;
    }
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'jet-attaque', attaquant, cible: target.key})]}));
  }
```

Toutes les autres utilisations de `saveEtat(` dans la page (`grep -n "saveEtat(" session-play-page.ts`) doivent passer une fonction `(etat) => …`.

- [ ] **Étape 6 : vérifier que la réponse du PATCH et la lecture suivent**

`npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals` : attendu, aucune erreur.

#### 4c. Les effets arrivent dans le jet d'attaque

- [ ] **Étape 7 : retirer le bouclier de `computeAttackTotal`**

Dans `combat-resolution.util.ts`, remplacer `computeAttackTotal` par :

```ts
/** Total du jet d'attaque : 2d6 + bonus attaquant − défense cible + modificateurs (effets en cours : bouclier, postures, défense totale…) +
 * bonus +1 légendaire personnel (si actif pour la rencontre) + modificateur de posture (offensive/intrépide/défensive/défaut de l'armure). */
export function computeAttackTotal(
  diceSum: number,
  attackerBonus: number,
  targetDefense: number,
  modifier: number,
  legendaryBonus: number,
  postureModifier: number,
): number {
  return diceSum + attackerBonus - targetDefense + modifier + legendaryBonus + postureModifier;
}
```
Dans `combat-resolution.util.spec.ts`, retirer l'argument du bouclier de chaque appel à `computeAttackTotal` (`grep -n computeAttackTotal combat-resolution.util.spec.ts`) : l'ancien 5ᵉ argument (le malus de bouclier) disparaît ; s'il valait non nul, le reporter dans le 4ᵉ (`modifier`) avec le signe contraire. Lancer `npm test -- --watch=false combat-resolution`.

- [ ] **Étape 8 : ajouter l'entrée `effets` au tableau de bord et à l'assistant**

`combat-board.ts` : ajouter `readonly effets = input<readonly CombatEffect[]>([]);` et dans `combat-board.html`, passer `[effets]="effets()"` à `<bol-turn-assistant>`. `session-play-page.html` : passer `[effets]="etat().effets"` à `<bol-combat-board>`.

`turn-assistant.ts` : ajouter `readonly effets = input<readonly CombatEffect[]>([]);`.

- [ ] **Étape 9 : calculer les puces d'attaque depuis le registre, figées au premier jet**

Dans `turn-assistant.ts`, remplacer le verrou `shieldLock` / `shield` par un instantané des modificateurs :

```ts
  /** Les modificateurs du registre pour ce jet, tels qu'ils sont au moment où on les lit. */
  private readonly liveTerms = computed<readonly ModifierTerm[]>(() => {
    const t = this.targetStats();
    const target = this.target();
    return target ? modificateursPour(this.effets(), {jet: 'attaque', attaquant: this.card().key, cible: target.key, bouclier: t?.bouclierMalusUneAttaque ?? 0}) : [];
  });

  /** Modificateurs figés au premier jet de cette attaque : la cible est ensuite marquée « attaquée » (son bouclier tombe du registre), mais un
   * jet relancé garde les siens. */
  private readonly frozenTerms = signal<readonly ModifierTerm[] | null>(null);
  protected readonly effectTerms = computed(() => this.frozenTerms() ?? this.liveTerms());
```
Dans `total` : `computeAttackTotal(sum, attackBonus(a, this.isTir()), t.defense, sommeModificateurs(this.effectTerms()), this.legendaryBonus() ? 1 : 0, this.postureModifier())`.

Dans `formulaTerms`, remplacer `add(-t.bouclierMalusUneAttaque, 'bouclier');` par l'ajout des puces du registre :

```ts
    for (const term of this.effectTerms()) {
      terms.push({label: term.label, tone: term.tone});
    }
```
et supprimer l'ancien `add(-t.defense, 'défense')` seulement s'il double : **non, le garder** (la défense de la fiche reste une puce séparée ; le registre n'ajoute que les effets).

Remplacer `markAttacked()` et `shieldLock` :

```ts
  /** Premier jet contre cette cible : fige les modificateurs et signale l'attaque au registre. */
  private markAttacked(): void {
    const target = this.target();
    if (!target || this.frozenTerms() !== null) {
      return;
    }
    this.frozenTerms.set(this.liveTerms());
    this.attackRolled.emit(target);
  }
```
Dans `resetRoll`, remplacer `this.shieldLock.set(null);` par `this.frozenTerms.set(null);`.

Supprimer la lecture de `bouclierMalusUneAttaque` dans la page (l'effet `targetStats` de l'étape 10 de la Tâche 3) : l'effet de la page ne modifie plus `defense` ni `bouclierMalusUneAttaque` ; il fixe simplement `this.targetStats.set(targetStats)`. Retirer `const effets = this.etat().effets;` et ses deux booléens, ainsi que la lecture `defenseTotale`/`attaquees` dans l'effet.

- [ ] **Étape 10 : vérifications du front**

`npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals`, `npx tsc -p tsconfig.spec.json --noEmit`, `npm run build` (sans avertissement de budget), `npm test -- --watch=false`, `npx knip` (doit être muet à partir d'ici : si `POSTURE_DEFENSE` ou `libelleEffet` sont encore signalés, voir Tâche 5 et 6 ; ne pas les supprimer).

#### 4d. Le scénario navigateur

- [ ] **Étape 11 : écrire `front/scripts/e2e-petit-bouclier.mjs`**

Reprendre le style des autres scripts de `front/scripts/` (`ls front/scripts`). Contenu :

```js
// Scénario : un PNJ porte un petit bouclier (−1 à une attaque subie par round). Le −1 pèse sur le premier jet, reste à la relance, et tombe
// pour un second jet contre la même cible dans le même round.
// Lancer son propre `npx ng serve --port 4400` d'abord ; ne jamais utiliser le port 4200 (serveur IntelliJ de Lionel).
import {chromium} from 'playwright';

const base = 'http://localhost:4400';
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: {width: 1700, height: 1000}})).newPage();

await page.goto(base + '/login', {waitUntil: 'domcontentloaded'});
const {id} = await page.evaluate(async () => {
  const json = (r) => r.json();
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email: 'claude-test@example.com', password: 'ClaudeTest123!'})}).then(json);
  const token = login.token ?? login.access_token;
  sessionStorage.setItem('diceway-session', JSON.stringify({token, user: login.user ?? login}));
  const headers = {'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + token};
  const heros = await fetch('/api/bol/heros', {headers}).then(json);
  const list = Array.isArray(heros) ? heros : (heros.data ?? []);
  const session = await fetch('/api/bol/fight-session/create', {method: 'POST', headers, body: JSON.stringify({titre: 'TMP bouclier', heros: [{heroId: list[0].id, camp: 'heros'}]})}).then(json);
  await fetch(`/api/bol/fight-session/${session.id}/combatant`, {method: 'POST', headers, body: JSON.stringify({kind: 'pnj', sourceId: '2', camp: 'adversaires', qty: 1})});
  return {id: session.id};
});

// Le PNJ porte un petit bouclier : −1 à une attaque subie par round.
await page.route(/\/api\/bol\/heros\/[^/?]+$/, async (route) => {
  if (route.request().method() !== 'GET') return route.continue();
  const res = await route.fetch();
  const body = await res.json();
  body.equipement_effectif = {...(body.equipement_effectif ?? {}), bouclier_malus_attaque_subie: 1, bouclier_malus_attaque_subie_portee: 'une'};
  await route.fulfill({response: res, json: body});
});

const fail = (message) => {
  console.error('ÉCHEC :', message);
  process.exitCode = 1;
};
const attackTerms = async () => (await page.locator('.tas-rolls .tas-step').first().locator('.tas-terms').innerText()).replace(/\n/g, ' | ');
const total = async () => page.locator('.tas-rolls .tas-step').first().locator('.tas-ticket-total').innerText();

await page.goto(`${base}/session/${id}/play`, {waitUntil: 'networkidle'});
await page.getByRole('button', {name: /Démarrer un combat/}).click();
await page.waitForTimeout(1500);
const reaction = page.locator('.scd-input--manual').first();
await reaction.fill('10');
await reaction.dispatchEvent('change');
await page.getByRole('button', {name: /Commencer le combat/}).click();
await page.waitForTimeout(2500);
await page.locator('.tas-fighter .tas-target').first().click();
await page.waitForTimeout(800);

const roll = async (value) => {
  await page.locator('.tas-step--roll .tas-manual input').fill(String(value));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000); // laisse l'état s'enregistrer et la session se recharger
};

if (!(await attackTerms()).includes('− 1 bouclier')) fail('le −1 du bouclier manque avant le premier jet');
await roll(11);
if (!(await attackTerms()).includes('− 1 bouclier')) fail('le −1 du bouclier a disparu après le premier jet (rechargement de la session ?)');
if ((await total()).trim() === '—') fail('le jet a été effacé par le rechargement de la session');
await roll(10);
if (!(await attackTerms()).includes('− 1 bouclier')) fail('le −1 du bouclier a disparu à la relance');

// Nouvelle attaque (changement d'arme) contre la même cible, même round : plus de bouclier.
const armes = page.locator('.tas-group[aria-label="Arme"] .tas-chip');
if ((await armes.count()) > 1) {
  await armes.nth(1).click();
  await page.waitForTimeout(1000);
  if ((await attackTerms()).includes('bouclier')) fail('le bouclier pèse encore sur la deuxième attaque du round');
} else {
  console.warn("Une seule arme : la deuxième attaque n'est pas vérifiée.");
}

console.log(process.exitCode ? 'Scénario en échec.' : 'Scénario du petit bouclier : OK.');
await browser.close();
```
Pour nettoyer, après usage : `docker exec diceway php artisan tinker --execute='\App\Models\Bol\BolFightSession::where("titre","TMP bouclier")->get()->each->delete();'`.

- [ ] **Étape 12 : exécuter le scénario**

Lancer `npx ng serve --port 4400` en arrière-plan (noter le pid), attendre `curl localhost:4400`, puis `node scripts/e2e-petit-bouclier.mjs`. Attendu : `Scénario du petit bouclier : OK.` Arrêter **uniquement son pid**, supprimer la session de test.

- [ ] **Étape 13 : point de contrôle**

Message de commit proposé : `feat(combat): file d'enregistrement et effets dans le jet d'attaque ; scénario du petit bouclier`.

---

### Tâche 5 : les postures et la parade s'appliquent en défense

Premier changement de règle visible : une carte qui a choisi une posture porte désormais son bonus ou son malus de défense jusqu'à son prochain tour.

**Fichiers :**
- Modifier : `front/src/app/bol/session/play/session-play-page.ts`
- Modifier : `front/src/app/bol/session/play/tapis/turn-assistant.ts`
- Tester : `combat-turn.util.spec.ts` (déjà couvert en Tâche 3), `combat-effects.util.spec.ts` (déjà couvert en Tâche 1)

**Interfaces :**
- Consomme : `effetsDeTour`, `POSTURE_DEFENSE`, `endTurn(ordered, etat, crees)`.

- [ ] **Étape 1 : écrire le test d'intégration d'un tour complet**

Ajouter à `combat-turn.util.spec.ts` :

```ts
describe('posture et parade sur un tour complet', () => {
  const order = ordered(KALENA, PRETRE);

  it('lets the defender of a posture count its bonus against the next attacker, then drops it on its next turn', () => {
    // Kalena prend la posture défensive et termine son tour : le prêtre l'attaque avec +1 en défense contre lui.
    const apres = endTurn(order, etat(1), effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false}));
    const termes = modificateursPour(apres.effets, {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0});
    expect(termes.map((t) => t.valeur)).toEqual([-1]);

    // Le prêtre termine : nouveau round, Kalena redevient active, sa posture est tombée.
    const round2 = endTurn(order, apres);
    expect(round2.round).toBe(2);
    expect(modificateursPour(round2.effets, {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0})).toEqual([]);
  });

  it('gives the parade for one attack only', () => {
    const apres = endTurn(order, etat(1), effetsDeTour('hero-1', {posture: 'dual-parry', defenseTotale: false}));
    const premier = {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0} as const;
    expect(modificateursPour(apres.effets, premier).map((t) => t.valeur)).toEqual([-1]);
    const apresAttaque = appliquerEvenement(apres.effets, {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1'});
    expect(modificateursPour(apresAttaque, premier)).toEqual([]);
  });

  it('makes an intrepid attacker lose its shield when attacked afterwards', () => {
    const apres = endTurn(order, etat(1), effetsDeTour('hero-1', {posture: 'intrepid', defenseTotale: false}));
    const termes = modificateursPour(apres.effets, {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 1});
    expect(termes.map((t) => t.label)).toEqual(['+ 2 attaque intrépide']);
  });
});
```
Importer `appliquerEvenement` et `modificateursPour` depuis `./combat-effects.util`.

- [ ] **Étape 2 : lancer les tests** : `npm test -- --watch=false combat-turn`. Attendu : passent (la logique existe depuis la Tâche 1).

- [ ] **Étape 3 : créer les effets de posture à la fin du tour**

Dans `session-play-page.ts`, `onEndTurn` :

```ts
  protected onEndTurn(): void {
    const active = this.activeCard();
    const crees = active ? effetsDeTour(active.key, {posture: this.attackChoice()?.posture?.slug ?? null, defenseTotale: false}) : [];
    this.targetKey.set(null);
    this.saveEtat((etat) => endTurn(this.orderedCards(), etat, crees), {ignoreIfBusy: true});
  }
```
(`onTotalDefense` reste tel quel : un tour de défense totale n'a pas de posture d'attaque.)

- [ ] **Étape 4 : une seule table de défense des postures**

Dans `turn-assistant.ts`, supprimer la constante locale `POSTURE_DEFENSE` et importer celle du noyau : `import {modificateursPour, POSTURE_DEFENSE, sommeModificateurs} from './combat-effects.util';`. `scaleEffect` et `effectPills` n'ont pas besoin d'autre changement.

- [ ] **Étape 5 : vérifier à l'écran (manuel)**

Avec `ng serve --port 4400` : deux héros adverses l'un de l'autre ; le premier prend « Posture défensive », termine son tour ; le second attaque le premier : la puce « − 1 posture défensive » doit apparaître dans le jet d'attaque ; au round suivant, quand le premier rejoue, elle disparaît. Noter le résultat observé dans le message de point de contrôle.

- [ ] **Étape 6 : vérifications du front**

`npx tsc … --noUnusedLocals`, `npm run build`, `npm test -- --watch=false`, `npx knip`.

- [ ] **Étape 7 : point de contrôle**

Message de commit proposé : `feat(combat): les postures et la parade pèsent sur la défense jusqu'au prochain tour`.

---

### Tâche 6 : l'affichage des effets

**Fichiers :**
- Créer : `front/src/app/bol/session/play/tapis/effects-list.ts` (composant `bol-effects-list`, gabarit et style intégrés ou fichiers voisins `effects-list.html` / `effects-list.scss`)
- Modifier : `front/src/app/bol/session/models/combat-effect.model.ts` (ajouter `effetId?` aux puces d'assistant), `front/src/app/bol/session/models/action-roll.model.ts` (`RollTerm.effetId?`)
- Modifier : `front/src/app/bol/session/play/tapis/combat-effects.util.ts` (`libelleDuree`, modèles d'effets manuels)
- Modifier : `turn-assistant.ts` / `.html`, `combat-board.*`, `session-play-page.*`, `turn-order.*`, `models/turn-order.model.ts`
- Tester : `combat-effects.util.spec.ts`

**Interfaces :**
- Consomme : `libelleEffet`, `appliquerEvenement` (`ajout-manuel`, `retrait-manuel`).
- Produit :
  - `libelleDuree(duree: EffectDuration): string` ;
  - `EFFETS_MODELES: readonly {id: string; libelle: string; creer(porteur: string): NewEffect}[]` ;
  - sorties `effectRemoved = output<string>()` (assistant, tableau de bord) et `effectAdded = output<NewEffect>()` ;
  - `RollTerm.effetId?: string` (la croix n'apparaît que si présent) ;
  - `TurnOrderEntry.effets: readonly string[]` (descriptions pour l'infobulle de la frise).

- [ ] **Étape 1 : tests de `libelleDuree` et des modèles**

Ajouter à `combat-effects.util.spec.ts` :

```ts
describe('libelleDuree', () => {
  it('says how long an effect lasts, in plain French', () => {
    expect(libelleDuree({type: 'usages', restants: 1})).toBe('1 attaque subie');
    expect(libelleDuree({type: 'usages', restants: 2})).toBe('2 attaques subies');
    expect(libelleDuree({type: 'usages', restants: 1, expireAuTour: true})).toBe('1 attaque subie, ou jusqu’à son prochain tour');
    expect(libelleDuree({type: 'fin-round'})).toBe('jusqu’à la fin du round');
    expect(libelleDuree({type: 'debut-tour-porteur'})).toBe('jusqu’à son prochain tour');
    expect(libelleDuree({type: 'action-porteur'})).toBe('jusqu’à sa prochaine action');
    expect(libelleDuree({type: 'combat'})).toBe('jusqu’à la fin du combat');
  });
});

describe('EFFETS_MODELES', () => {
  it('builds manual effects for a given card, all within the bounds the backend accepts', () => {
    for (const modele of EFFETS_MODELES) {
      const cree = modele.creer('hero-1');
      expect(cree.porteur).toBe('hero-1');
      expect(Math.abs(cree.valeur)).toBeLessThanOrEqual(20);
      expect(cree.manuel).toBe(true);
    }
    expect(EFFETS_MODELES.map((m) => m.id)).toEqual(['defense-round', 'de-malus-action', 'malus-attaque-round', 'action-perdue']);
  });
});
```

- [ ] **Étape 2 : lancer et vérifier l'échec** : `npm test -- --watch=false combat-effects`.

- [ ] **Étape 3 : implémenter `libelleDuree` et `EFFETS_MODELES`**

Ajouter à `combat-effects.util.ts` :

```ts
/** La durée d'un effet en français, pour l'infobulle et le bloc « Effets en cours ». */
export function libelleDuree(duree: EffectDuration): string {
  switch (duree.type) {
    case 'usages': {
      const base = `${duree.restants} ${duree.restants > 1 ? 'attaques subies' : 'attaque subie'}`;
      return duree.expireAuTour ? `${base}, ou jusqu’à son prochain tour` : base;
    }
    case 'fin-round':
      return 'jusqu’à la fin du round';
    case 'debut-tour-porteur':
      return 'jusqu’à son prochain tour';
    case 'action-porteur':
      return 'jusqu’à sa prochaine action';
    case 'combat':
      return 'jusqu’à la fin du combat';
  }
}

/** Les effets que le MJ ajoute à la main depuis le menu « + Effet ». */
export const EFFETS_MODELES: readonly {readonly id: string; readonly libelle: string; readonly creer: (porteur: string) => NewEffect}[] = [
  {
    id: 'defense-round',
    libelle: '+1 en défense jusqu’à la fin du round',
    creer: (porteur) => ({origine: 'manuel', libelle: 'défense', porteur, stat: 'defense', valeur: 1, quand: 'subie', duree: {type: 'fin-round'}, manuel: true}),
  },
  {
    id: 'de-malus-action',
    libelle: 'Dé de malus à sa prochaine action',
    creer: (porteur) => ({origine: 'renversement', libelle: 'dé de malus à la prochaine action', porteur, stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'action-porteur'}, manuel: true}),
  },
  {
    id: 'malus-attaque-round',
    libelle: '−1 à ses jets d’attaque jusqu’à la fin du round',
    creer: (porteur) => ({origine: 'manuel', libelle: 'malus d’attaque', porteur, stat: 'attaque', valeur: -1, quand: 'attaque', duree: {type: 'fin-round'}, manuel: true}),
  },
  {
    id: 'action-perdue',
    libelle: 'Perd sa prochaine action',
    creer: (porteur) => ({origine: 'egratignure', libelle: 'perd sa prochaine action', porteur, stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'action-porteur'}, manuel: true}),
  },
];
```

- [ ] **Étape 4 : lancer les tests** : `npm test -- --watch=false combat-effects` : attendu, passent.

- [ ] **Étape 5 : la croix sur les puces d'un jet**

`action-roll.model.ts`, interface `RollTerm` : ajouter `/** Effet du registre dont la puce vient : sa croix le retire. */ readonly effetId?: string;`.

`turn-assistant.ts` :
- dans `formulaTerms`, la boucle sur `effectTerms()` pousse `{label: term.label, tone: term.tone, ...(term.effetId ? {effetId: term.effetId} : {})}` ;
- ajouter `readonly effectRemoved = output<string>();`.

`turn-assistant.html`, dans la boucle des termes du jet d'attaque, après le `<span class="tas-term" …>` ajouter, pour un terme qui a un `effetId` :

```html
            @if (term.effetId) {
              <button type="button" class="tas-term-remove" [attr.aria-label]="'Retirer l’effet ' + term.label" matTooltip="Retirer cet effet" (click)="effectRemoved.emit(term.effetId)">×</button>
            }
```
Le style de `.tas-term-remove` (bouton carré 1.1 rem, sans bordure, `color: var(--dw-surface-500)`, au survol `var(--dw-color-echec)`) va dans un fichier de style **séparé** ; ne pas grossir `turn-assistant.scss` (budget). Si l'ajout dépasse 16 kB, déplacer d'abord ~1 kB de règles redondantes hors de `turn-assistant.scss` (voir `grep -c` des sélecteurs `.tas-vs`) avant d'ajouter.

- [ ] **Étape 6 : le composant « Effets en cours »**

`front/src/app/bol/session/play/tapis/effects-list.ts` :

```ts
import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {EFFETS_MODELES, libelleDuree, libelleEffet} from './combat-effects.util';

/** Une carte nommée, pour afficher à qui appartient un effet et à qui l'ajouter. */
interface CarteEffets {
  readonly key: string;
  readonly nom: string;
}

/** Un effet prêt à afficher : son texte, sa durée et à qui il est. */
interface EffetAffiche {
  readonly id: string;
  readonly porteur: string;
  readonly texte: string;
  readonly duree: string;
}

@Component({
  selector: 'bol-effects-list',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="efl" aria-label="Effets en cours">
      <header class="efl-head">
        <h3 class="efl-title">Effets en cours</h3>
        <button type="button" mat-stroked-button size="small" [matMenuTriggerFor]="addMenu" [disabled]="cartes().length === 0">
          <mat-icon>add</mat-icon> Effet
        </button>
      </header>

      @for (effet of affiches(); track effet.id) {
        <div class="efl-row">
          <span class="efl-text"><b>{{ effet.porteur }}</b> · {{ effet.texte }} <i>{{ effet.duree }}</i></span>
          <button type="button" class="efl-remove" [attr.aria-label]="'Retirer l’effet ' + effet.texte + ' de ' + effet.porteur" (click)="retire.emit(effet.id)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      } @empty {
        <p class="efl-empty">Aucun effet en cours.</p>
      }

      <mat-menu #addMenu="matMenu">
        @for (carte of cartes(); track carte.key) {
          @for (modele of modeles; track modele.id) {
            <button mat-menu-item type="button" (click)="ajoute.emit(modele.creer(carte.key))">{{ carte.nom }} : {{ modele.libelle }}</button>
          }
        }
      </mat-menu>
    </section>
  `,
  styles: `
    .efl { display: flex; flex-direction: column; gap: 0.35rem; }
    .efl-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .efl-title { margin: 0; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dw-color-legendary); }
    .efl-row { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; padding: 0.2rem 0.4rem; border: 1px solid var(--dw-border); border-radius: 8px; background: var(--dw-surface-50); font-size: 0.78rem; color: var(--dw-surface-800); }
    .efl-text i { color: var(--dw-surface-600); font-style: normal; }
    .efl-remove { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--dw-surface-500); cursor: pointer; }
    .efl-remove:hover { color: var(--dw-color-echec); }
    .efl-remove:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 1px; }
    .efl-remove .mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    .efl-empty { margin: 0; font-size: 0.78rem; color: var(--dw-surface-500); }
  `,
})
export class EffectsListComponent {
  readonly effets = input.required<readonly CombatEffect[]>();
  /** Les deux cartes du duel : attaquant et cible. Une carte absente de cette liste n'affiche pas ses effets. */
  readonly cartes = input.required<readonly CarteEffets[]>();
  readonly retire = output<string>();
  readonly ajoute = output<NewEffect>();

  protected readonly modeles = EFFETS_MODELES;

  protected readonly affiches = computed<readonly EffetAffiche[]>(() => {
    const noms = new Map(this.cartes().map((carte) => [carte.key, carte.nom]));
    return this.effets()
      .filter((effet) => effet.valeur !== 0 && noms.has(effet.porteur))
      .map((effet) => ({
        id: effet.id,
        porteur: noms.get(effet.porteur) ?? effet.porteur,
        texte: `${effet.valeur > 0 ? '+' : '−'} ${Math.abs(effet.valeur)} ${libelleEffet(effet)}`,
        duree: libelleDuree(effet.duree),
      }));
  });
}
```

Remarque sur les conventions du projet : les styles du composant sont intégrés (`styles:`) pour ne pas toucher au budget de `turn-assistant.scss`. Si le projet impose des fichiers séparés pour les composants de plus de quelques lignes, les déplacer dans `effects-list.scss` (chemin relatif au `.ts`).

- [ ] **Étape 7 : brancher le bloc dans l'assistant et remplacer « Effet sur ce tour »**

`turn-assistant.html` : remplacer le bloc `<div class="tas-recap">…</div>` (« Effet sur ce tour ») par :

```html
        <bol-effects-list
          [effets]="effets()"
          [cartes]="duelistes()"
          (retire)="effectRemoved.emit($event)"
          (ajoute)="effectAdded.emit($event)"
        />
        @if (visibleOptions().length > 1) {
          <div class="tas-recap">
            <span class="tas-label">Ce jet</span>
            <div class="tas-pills">
              @for (pill of effectPills(); track pill.label) {
                <span class="tas-pill" [class.tas-pill--plus]="pill.tone === 'plus'" [class.tas-pill--minus]="pill.tone === 'minus'">{{ pill.label }}</span>
              }
            </div>
          </div>
        }
```
(Les postures choisies pour le jet en cours restent affichées ; le bloc décrit ce qui dure.)

`turn-assistant.ts` : importer `EffectsListComponent` dans `imports`, ajouter `readonly effectAdded = output<NewEffect>();` et
```ts
  protected readonly duelistes = computed(() => [
    {key: this.card().key, nom: this.card().nom},
    ...(this.target() ? [{key: this.target()!.key, nom: this.target()!.nom}] : []),
  ]);
```
(écrire sans `!` si le lint du projet l'interdit : lire `this.target()` une seule fois dans une variable.)

`combat-board.ts` / `.html` : relayer `effectRemoved` et `effectAdded` du `bol-turn-assistant` vers deux sorties de même nom. `session-play-page.html` : `(effectRemoved)="onEffectRemoved($event)"`, `(effectAdded)="onEffectAdded($event)"`. `session-play-page.ts` :

```ts
  protected onEffectRemoved(id: string): void {
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'retrait-manuel', id})]}));
  }

  protected onEffectAdded(effet: NewEffect): void {
    this.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'ajout-manuel', effet})]}));
  }
```

- [ ] **Étape 8 : badges sous chaque duelliste**

Dans `turn-assistant.ts`, ajouter deux computed qui rendent, pour la carte active et pour la cible, les effets visibles sous forme de textes (réutiliser `libelleEffet`, `libelleDuree` du noyau) :

```ts
  private badgesDe(key: string | undefined): readonly string[] {
    return key
      ? this.effets()
          .filter((effet) => effet.porteur === key && effet.valeur !== 0)
          .map((effet) => `${effet.valeur > 0 ? '+' : '−'} ${Math.abs(effet.valeur)} ${libelleEffet(effet)} · ${libelleDuree(effet.duree)}`)
      : [];
  }
  protected readonly attackerBadges = computed(() => this.badgesDe(this.card().key));
  protected readonly targetBadges = computed(() => this.badgesDe(this.target()?.key));
```
Dans `turn-assistant.html`, sous le `<div class="tas-tiles">` de chaque bandeau, ajouter :
```html
          @if (attackerBadges().length > 0) {
            <ul class="tas-badges" aria-label="Effets sur l’attaquant">
              @for (badge of attackerBadges(); track badge) {
                <li>{{ badge }}</li>
              }
            </ul>
          }
```
(et l'équivalent avec `targetBadges()` pour la cible, avec `aria-label="Effets sur la cible"`). Les règles `.tas-badges` (liste horizontale, `display: flex; flex-wrap: wrap; gap: 0.25rem; list-style: none; padding: 0; margin: 0;`, `li` en puce discrète) vont dans le style de `effects-list.ts`... **non** : ce sont des éléments de l'assistant. Ajouter ces 6 lignes dans `turn-assistant.scss` après avoir libéré la place (étape 5).

- [ ] **Étape 9 : un point sur la frise**

`turn-order.model.ts`, interface `TurnOrderEntry` : ajouter `/** Descriptions des effets en cours de cette carte, pour l'infobulle de la frise. */ readonly effets: readonly string[];`. `session-play-page.ts`, dans `turnEntries` : `effets: this.etat().effets.filter((e) => e.porteur === card.key && e.valeur !== 0).map((e) => \`${libelleEffet(e)} · ${libelleDuree(e.duree)}\`)`. Mettre à jour les fabriques de `TurnOrderEntry` des specs (`combat-turn.util.spec.ts`, fonction `entry` de `groupByTier`) avec `effets: []`.

`turn-order.html` : ajouter `[class.tor-med--effects]="entry.effets.length > 0"` au bouton, et compléter l'infobulle : `[matTooltip]="entry.nom + (entry.ally ? ' (allié des héros)' : '') + (entry.effets.length ? ' — ' + entry.effets.join(', ') : '') + (entry.status === 'played' ? …)"`. `turn-order.scss` :

```scss
.tor-med--effects::before {
  content: '';
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  z-index: 1;
  width: 0.55rem;
  height: 0.55rem;
  border: 2px solid var(--dw-surface-0);
  border-radius: 50%;
  background: var(--dw-color-legendary);
}
```
(`.tor-med` doit avoir `position: relative` : l'ajouter si absent ; le médaillon allié l'ajoute déjà pour son `::after`.) L'annonce vocale d'un nouveau round : dans `turnAnnouncement`, ne rien changer pour cette version (hors périmètre ; noté dans le spec).

- [ ] **Étape 10 : vérifications du front**

`npx tsc … --noUnusedLocals`, `npx tsc -p tsconfig.spec.json --noEmit`, `npm run build` (surveiller le budget de `turn-assistant.scss`), `npm test -- --watch=false`, `npx knip`.

- [ ] **Étape 11 : vérification à l'écran**

`ng serve --port 4400` : lancer un combat, prendre « Posture défensive », terminer le tour ; vérifier (a) la puce avec croix dans le jet d'attaque de l'adversaire, (b) le badge sous le duelliste, (c) la ligne dans « Effets en cours », (d) le point sur le médaillon de la frise. Cliquer la croix : le total se recalcule. Ajouter un effet par « + Effet » et le retirer. Un effet dont la carte n'est plus l'un des deux duellistes ne s'affiche pas dans le bloc (cas « carte inconnue ») et ne produit aucune erreur de console.

- [ ] **Étape 12 : point de contrôle**

Message de commit proposé : `feat(combat): affichage des effets (croix sur les puces, badges, bloc Effets en cours, frise)`.

---

### Tâche 7 : les dégâts, l'échec critique du round 1 et les effets à action

**Fichiers :**
- Modifier : `turn-assistant.ts` / `.html` (puces de dégâts issues du registre)
- Modifier : `session-play-page.ts` (bouclier perdu au round 1 pour un échec critique)
- Tester : `combat-effects.util.spec.ts`, un test pour la règle du round 1

**Interfaces :**
- Consomme : `modificateursPour` avec `jet: 'degats'`.
- Produit : `bouclierPerduRound1(round: number, tier: InitiativeTierKey | null): boolean` dans `combat-turn.util.ts`.

- [ ] **Étape 1 : écrire le test de la règle du round 1**

Ajouter à `combat-turn.util.spec.ts` :

```ts
describe('bouclierPerduRound1', () => {
  it('removes the shield of a critical failure during the first round only', () => {
    expect(bouclierPerduRound1(1, 'echec_critique')).toBe(true);
    expect(bouclierPerduRound1(2, 'echec_critique')).toBe(false);
    expect(bouclierPerduRound1(1, 'echec')).toBe(false);
    expect(bouclierPerduRound1(1, null)).toBe(false);
  });
});
```
(importer `bouclierPerduRound1` depuis `./combat-turn.util`). Lancer : échec.

- [ ] **Étape 2 : l'implémenter**

Dans `combat-turn.util.ts` :

```ts
/** Règle de réaction : un héros en échec critique ne bénéficie pas de son bouclier en défense pendant le premier round
 * (02-actions-combat.md). Dérivée du palier de réaction et du round, sans effet stocké : aucun événement n'existe au démarrage du combat. */
export function bouclierPerduRound1(round: number, tier: InitiativeTierKey | null): boolean {
  return round === 1 && tier === 'echec_critique';
}
```
`npm test -- --watch=false combat-turn` : passe.

- [ ] **Étape 3 : l'appliquer dans la page**

Dans `session-play-page.ts`, là où `targetStats` est alimenté (effet existant), si `bouclierPerduRound1(this.etat().round, tierDeLaCible)` est vrai, passer `{...targetStats, bouclierMalusUneAttaque: 0}`. Le palier de la cible est dans `this.orderedCards()` (`OrderedCard.tier`) : `const tier = this.orderedCards().find((entry) => entry.card.key === target.key)?.tier ?? null;`. Vérifier en test manuel : un héros en échec critique attaqué au round 1 ne montre pas la puce « bouclier ».

- [ ] **Étape 4 : les puces de dégâts viennent du registre**

Test (à ajouter à `combat-effects.util.spec.ts`, il existe déjà `reads protection and damage effects for a damage roll`) : rien à ajouter. Dans `turn-assistant.ts`, `damageTerms` : après l'ajout de la vigueur et du dévastateur, ajouter :

```ts
    const target = this.target();
    if (target) {
      for (const term of modificateursPour(this.effets(), {jet: 'degats', attaquant: this.card().key, cible: target.key, bouclier: 0})) {
        terms.push({label: term.label, tone: term.tone, ...(term.effetId ? {effetId: term.effetId} : {})});
      }
    }
```
et dans le calcul des dégâts (`damage` / `finalDamage`), ajouter `sommeModificateurs(...)` des mêmes modificateurs au total des dégâts, avec la même convention de signe que pour l'attaque (un bonus de protection de la cible réduit les dégâts). Test unitaire à ajouter dans le spec existant de `finalDamage` si la signature change ; sinon passer le total des modificateurs par le paramètre `protection` : `protection - sommeModificateurs(...)`.

- [ ] **Étape 5 : les effets « à la prochaine action » se voient**

Les effets de `stat: 'action'` (dé de malus, action perdue) n'entrent dans aucun total : ils s'affichent dans le bloc « Effets en cours », en badge sous le duelliste et sur la frise (Tâche 6), et tombent à la fin du tour du porteur (`action-porteur`, Tâche 1). Aucun code de plus. Vérifier à l'écran : « + Effet » → « Dé de malus à sa prochaine action » sur la cible, puis laisser jouer la cible : l'effet disparaît à la fin de son tour.

- [ ] **Étape 6 : vérifications du front**

`npx tsc … --noUnusedLocals`, `npm run build`, `npm test -- --watch=false`, `npx knip`.

- [ ] **Étape 7 : point de contrôle**

Message de commit proposé : `feat(combat): dégâts issus du registre, bouclier perdu au round 1, effets à action`.

---

## Mise à jour du spec

À la fin de la dernière tâche, reporter dans `doc/plans/2026-10-12-registre-effets-combat-design.md` les cinq écarts listés plus haut (parade à usage unique avec `expireAuTour`, échec critique dérivé, feinte sans création automatique, `carte-retiree` sans appelant de page, effet libre reporté) et la décision de la file d'événements : actions de l'utilisateur ignorées pendant un enregistrement, mises à jour automatiques mises en file.

## Suite du 2026-10-13 : héroïsme sur le jet d'attaque

Fait hors des sept tâches, et décrit au § 9 du spec : faveur divine, échec critique, succès héroïque et légendaire sur le jet d'attaque, avec leurs options. Deux conséquences pour ce plan :

- le renversement n'est plus seulement un modèle du menu « + Effet » (tâche 6) : `effetRenversement` et `effetCoupPrecis` (`combat-effects.util.ts`) sont posés par l'assistant quand l'option héroïque est prise ;
- `finalDamage` et `damageRange` prennent un nombre de coups dévastateurs, plus un booléen.

## Auto-relecture du plan

- **Couverture du spec** : registre (T1), validation backend et migration (T2, T3), événements (T1, T3, T4, T5, T7), file d'événements (T4), affichage (T6), tests (chaque tâche + scénario de T4), cinq étapes de livraison (T1 ; T2 + T3 ; T5 ; T6 ; T7, avec T4 comme étape de bascule du bouclier).
- **Types** : `CombatEffect`, `NewEffect`, `EffectEvent`, `RollContext`, `ModifierTerm`, `TurnChoice` définis en T1 et réutilisés tels quels ; `endTurn(ordered, etat, crees?)` défini en T3 et appelé en T4, T5 ; `EtatSaver.apply(update, {ignoreIfBusy})` défini en T4 et appelé en T4 à T6 ; `RollTerm.effetId` ajouté en T6 et consommé en T6 et T7 ; `libelleDuree` et `EFFETS_MODELES` définis en T6 avant usage.
- **Points qui demandent un coup d'œil de l'exécutant** (non ambigus dans le code, mais dépendants de lignes qui bougent) : les numéros de lignes de `session-play-page.ts` ; la place disponible dans le budget de `turn-assistant.scss` (T6) ; la forme exacte de la réponse de `updateCombatState` (T4 recharge la session par `fightSession`, donc indépendant de cette forme).
