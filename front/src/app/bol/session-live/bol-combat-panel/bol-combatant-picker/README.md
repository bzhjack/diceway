# `bol-combatant-picker` — sélection des combattants (Direction B)

Composant standalone qui transpose la maquette « Réserve → grille ». Il compose le roster
d'un combat à partir de la réserve du scénario, puis émet un `InitiativeSlot[]` prêt pour
`bol-combat-panel`.

## Emplacement conseillé

```
front/src/app/bol/session-live/bol-combat-panel/bol-combatant-picker/
  ├── bol-combatant-picker.ts
  ├── bol-combatant-picker.html
  └── bol-combatant-picker.scss
```

Les imports relatifs (`../bol-combat-panel`, `../combat.constants`) supposent cet emplacement.

## API

| Membre | Type | Rôle |
| --- | --- | --- |
| `participants` (input, requis) | `InitiativeSlot[]` | Réserve : héros + créatures + démons + PNJ du scénario (déjà construits par `session-live-page`). |
| `confirmed` (output) | `CombatantSelection` | `{ slots: InitiativeSlot[]; reactionModifier: number }` — roster déplié (groupes ×N en exemplaires uniques) + modificateur de situation (+2 / 0 / −1). |
| `cancelled` (output) | `void` | Retour sans lancer. |

Fonctionnalités : recherche, filtre par type (`p-selectbutton`), ajout/retrait réserve↔grille,
quantité par groupe (steppers), situation tactique des héros, compteurs live, malus d'initiative
ennemie calculé (max `initiative` des adversaires inclus).

## Branchement dans `session-live-page`

Aujourd'hui `startCombat()` construit `combatParticipants` (tout le scénario) et passe direct au
panneau. On insère le picker entre les deux.

**`session-live-page.ts`**

```ts
import {BolCombatantPickerComponent, CombatantSelection} from
  './bol-combat-panel/bol-combatant-picker/bol-combatant-picker';

// imports: [..., BolCombatantPickerComponent]

protected readonly pickerMode = signal(false);
protected readonly availablePool = signal<InitiativeSlot[]>([]);
protected readonly reactionModifier = signal(0);

// Renommer l'ancien startCombat() en buildPool() (il retourne le InitiativeSlot[]),
// puis :
protected openPicker(): void {
  const all = this.buildPool();          // = corps de l'ancien startCombat()
  if (!all.length) return;
  this.availablePool.set(all);
  this.pickerMode.set(true);
}

protected onRosterConfirmed(sel: CombatantSelection): void {
  this.combatParticipants.set(sel.slots);
  this.reactionModifier.set(sel.reactionModifier);
  this.pickerMode.set(false);
  this.combatMode.set(true);
}

protected cancelPicker(): void {
  this.pickerMode.set(false);
}
```

**`session-live-page.html`** — le bouton « Lancer un combat » appelle `openPicker()`, puis :

```html
@if (pickerMode()) {
  <app-bol-combatant-picker
    [participants]="availablePool()"
    (confirmed)="onRosterConfirmed($event)"
    (cancelled)="cancelPicker()"
  />
}

@if (combatMode()) {
  <app-bol-combat-panel
    [participants]="combatParticipants()"
    [scenarioId]="scenarioId() ?? null"
    [initialSnapshot]="activeSnapshot()"
    (combatEnded)="stopCombat()"
  />
}
```

## Modificateur de situation (optionnel)

`reactionModifier` (+2 embuscade / 0 / −1 surpris) est émis mais pas encore consommé. Pour
l'appliquer, ajouter un input `reactionModifier` à `bol-combat-panel` → `bol-roll-phase`, et
l'utiliser comme valeur initiale du modificateur de chaque jet de héros. Le malus d'initiative
ennemie est, lui, déjà affiché ici à titre indicatif (il s'additionne au jet de réaction côté MJ).

## Notes d'implémentation

- Les groupes (`type !== 'hero'`) sont dépliés au `confirm()` : un groupe ×N devient N slots
  `id = "<id>__k"`, `nom = "<nom> #k"`, `vitaliteCourante = vitaliteMax`, `etats = []`.
- Les héros gardent `category = null` (ils lanceront leur jet de réaction) ; les adversaires
  conservent leur `category` (rang) snapshot.
- Conventions respectées : standalone, `OnPush`, `input()/output()`, signals + `computed()`,
  `@if/@for`, `[ngModel]`+`(ngModelChange)`, pas de `ngClass`/`ngStyle` (couleurs via `[style.color]`),
  `p-button` paramétré par inputs.

Valider : `npm run build` dans `front/`.
