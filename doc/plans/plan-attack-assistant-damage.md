# Plan — Sélection d'arme et gestion des dégâts dans l'assistant d'attaque

## Contexte MJ

En session live, le MJ jongle avec plusieurs participants. Le panneau d'attaque doit aller vite : sélectionner l'arme, lancer les dés physiques, saisir les résultats, voir les dégâts nets, cliquer "Appliquer". Chaque étape superflue casse le rythme de la table.

Problème actuel : l'arme n'est pas sélectionnée avant le jet — le type d'attaque (mêlée/tir) n'est donc pas automatiquement lié à l'arme. Après le toucher, la liste des armes s'affiche en lecture seule, sans calcul de dégâts. La vigueur de l'attaquant est absente de `InitiativeSlot`.

---

## Priorité 1 — Ajouter `vigueur` dans `InitiativeSlot`

`InitiativeSlot` contient déjà `agilite`, `esprit`, `initiative`, `melee`, `tir`, `defense`. Il manque `vigueur`, indispensable au bonus de dégâts.

### Changements

**`bol-combat-panel.ts`** — interface `InitiativeSlot` :
```typescript
readonly vigueur: number | null;
```

**`bol-session-live-page.ts`** (ou là où les slots sont construits) — mapper `vigueur` depuis le héros/PNJ/créature/démon.

> Règle BoL : bonus de vigueur sur les dégâts mêlée = vigueur entier. Sur les dégâts à distance (tir) = vigueur / 2 arrondi à l'inférieur. Mains nues = vigueur / 2.

---

## Priorité 2 — Sélection de l'arme AVANT le jet d'attaque

La sélection de l'arme doit se faire en haut du dialogue, **avant** de choisir la cible et avant de saisir le dé. Elle pilote :
- le type d'attaque (mêlée / tir) → remplace le SelectButton manuel si une seule arme est disponible
- la catégorie de dégâts (d3 / d6M / d6 / d6B)
- le bonus de vigueur applicable (entier ou /2)

### Modèle arme enrichi

```typescript
interface ArmeSlot {
  nom: string;
  degats: string | null;     // ex. "d6" — label affiché
  type: 'M' | 'T' | null;
  portee: string | null;
  notes: string | null;
  categorie: 'nue' | 'legere' | 'moyenne' | 'lourde' | null; // nouveau
}
```

La catégorie est mappée depuis la BDD (via `BolArme.categorie` ou un champ équivalent) au moment de la construction du slot. Elle pilote le calcul côté front sans avoir besoin de parser la chaîne `degats`.

Si `categorie` est null (créature/démon avec `degats` libre) → afficher le champ libre tel quel, pas de calcul automatique.

### Signal `selectedArme`

```typescript
protected readonly selectedArme = signal<ArmeSlot | null>(null);
```

Afficher les armes sous forme de **boutons** (pas un select) pour aller vite :

```html
<div class="atk-weapons">
  @for (arme of attacker().armesList; track arme.nom) {
    <button
      class="atk-weapon-btn"
      [class.atk-weapon-btn--active]="selectedArme()?.nom === arme.nom"
      (click)="selectArme(arme)"
    >
      {{ arme.nom }}
      <span class="atk-weapon-btn__degats">{{ arme.degats }}</span>
    </button>
  }
  <button
    class="atk-weapon-btn"
    [class.atk-weapon-btn--active]="selectedArme() === MAINS_NUES"
    (click)="selectArme(MAINS_NUES)"
  >Mains nues <span class="atk-weapon-btn__degats">d3</span></button>
</div>
```

`selectArme()` met à jour `selectedArme` et force `attackType` en fonction de `arme.type` :
```typescript
protected selectArme(arme: ArmeSlot): void {
  this.selectedArme.set(arme);
  if (arme.type === 'T') this.attackType.set('tir');
  else this.attackType.set('melee');
}
```

Le SelectButton mêlée/tir manuel reste affiché seulement si `attacker().armesList.length === 0` (fallback PNJ sans armes listées).

---

## Priorité 3 — Section dégâts interactive après un toucher

Visible uniquement quand `isHit()` est `true`.

### 3a. Calcul du bonus de vigueur

```typescript
protected readonly vigBonus = computed(() => {
  const vigueur = this.attacker().vigueur ?? 0;
  const arme = this.selectedArme();
  const type = this.attackType();
  if (!arme || arme.categorie === 'nue') return Math.floor(vigueur / 2);
  return type === 'tir' ? Math.floor(vigueur / 2) : vigueur;
});
```

### 3b. Label dé de dégâts

```typescript
protected readonly damageDiceLabel = computed(() => {
  const arme = this.selectedArme();
  if (!arme) return '—';
  switch (arme.categorie) {
    case 'nue':     return 'd3';
    case 'legere':  return '2d6 garder le moins bon (d6M)';
    case 'moyenne': return '1d6';
    case 'lourde':  return '2d6 garder le meilleur (d6B)';
    default:        return arme.degats ?? '—'; // champ libre
  }
});
```

### 3c. Signals dégâts

```typescript
protected readonly damageRoll = signal<number | null>(null);  // résultat dé(s) saisi
protected readonly doubleAttaque = signal(false); // option combat à deux armes double frappe
```

### 3d. Protection d'armure

La protection totale de la cible = somme des valeurs fixes de ses armures.

> Règle BoL : chaque armure a une valeur fixe (Légère=1, Moyenne=2, Lourde=3, Casque=+1) + une partie variable optionnelle (d6−3 / d6−2 / d6−1). En pratique de table, le MJ utilise souvent la valeur fixe uniquement — le dé variable est optionnel.

```typescript
protected readonly targetArmorFixed = computed(() => {
  // Somme des protections fixes (issues du champ `malus` ou d'un champ `protection_fixe`)
  // Cf. mapping à établir dans le backend/service
  return this.target()?.armures.reduce((sum, a) => sum + (a.protectionFixe ?? 0), 0) ?? 0;
});

protected readonly armorRoll = signal<number | null>(null);  // dé variable saisi (optionnel)
protected readonly defautArmure = computed(
  () => this.selectedCombatOption()?.slug === 'defaut-armure'
);
```

### 3e. Total dégâts nets

```typescript
protected readonly totalDamage = computed(() => {
  const roll = this.damageRoll();
  if (roll === null) return null;

  // Modificateurs dégâts
  let base = roll + this.vigBonus();

  // Coup dévastateur (option héroïque) +6
  const isDevastateur = [this.heroicOptionSlug1(), this.heroicOptionSlug2()]
    .some((s) => s === 'coup-devastateur');
  if (isDevastateur) base += 6;

  // Armure
  const armor = this.defautArmure()
    ? 0
    : this.targetArmorFixed() + (this.armorRoll() ?? 0);

  return Math.max(0, base - armor);
});
```

### 3f. Template section dégâts

```html
@if (isHit()) {
  <div class="atk-damage-section">

    <!-- Dé de dégâts -->
    <div class="atk-row">
      <span class="atk-label">Dégâts ({{ damageDiceLabel() }})</span>
      <div class="atk-damage-input">
        <p-inputNumber [(ngModel)]="damageRoll" [min]="1" [max]="20" placeholder="—" />
        <span class="atk-damage-input__vig">+ {{ vigBonus() }} vigueur</span>
      </div>
    </div>

    <!-- Armure cible -->
    @if (!defautArmure() && target()?.armures.length) {
      <div class="atk-row">
        <span class="atk-label">Armure {{ target()!.nom }}</span>
        <div class="atk-armor">
          <span class="atk-armor__fixed">{{ targetArmorFixed() }} fixe</span>
          <p-inputNumber
            [ngModel]="armorRoll()"
            (ngModelChange)="armorRoll.set($event)"
            [min]="0" [max]="6"
            placeholder="+ dé ?"
            [inputStyle]="{'width':'4.5rem'}"
          />
        </div>
      </div>
    }

    <!-- Résultat net -->
    @if (totalDamage() !== null) {
      <div class="atk-damage-result">
        <span class="atk-damage-result__label">Dégâts nets</span>
        <span class="atk-damage-result__value">{{ totalDamage() }}</span>
      </div>
      <p-button
        label="Appliquer les dégâts"
        icon="pi pi-heart-break"
        severity="danger"
        size="small"
        (onClick)="applyDamage()"
      />
    }

  </div>
}
```

### 3g. Output `hpChange`

```typescript
readonly hpChange = output<{slotId: string; delta: number}>();

protected applyDamage(): void {
  const t = this.target();
  const dmg = this.totalDamage();
  if (!t || dmg === null) return;
  this.hpChange.emit({slotId: t.id, delta: -dmg});
}
```

Le parent (`bol-combat-panel`) met à jour `vitaliteCourante` du slot correspondant.

---

## Priorité 4 — Attaques dévastatrices (pouvoir)

Le pouvoir `degats_superieurs` monte les dégâts d'une catégorie. Ce n'est pas +6, c'est une catégorie supérieure de dé.

```typescript
protected readonly effectiveDamageCategorie = computed(() => {
  const arme = this.selectedArme();
  const hasDevastatrices = this.attackerHasDevastatrices();
  const doubleFrappe = this.doubleAttaque();
  // Résoudre la catégorie effective
  const ORDER = ['nue', 'legere', 'moyenne', 'lourde'] as const;
  let idx = ORDER.indexOf(arme?.categorie ?? 'nue');
  if (doubleFrappe && idx < 3) idx++;       // double frappe +1 catégorie
  if (hasDevastatrices && idx < 3) idx++;   // pouvoir +1 catégorie
  return ORDER[Math.min(idx, 3)];
});
```

`damageDiceLabel` et `vigBonus` utilisent `effectiveDamageCategorie` plutôt que `selectedArme().categorie` directement.

---

## Priorité 5 — Reset et cohérence

À `close()`, réinitialiser les nouveaux signals :
```typescript
this.selectedArme.set(null);
this.damageRoll.set(null);
this.armorRoll.set(null);
this.doubleAttaque.set(false);
```

Quand la cible change, réinitialiser `armorRoll` (la cible a potentiellement une armure différente).

---

## Ordre d'implémentation suggéré

| Étape | Quoi | Impact |
|-------|------|--------|
| 1 | Ajouter `vigueur` dans `InitiativeSlot` + mapping | Backend/service |
| 2 | Ajouter `categorie` dans `ArmeSlot` + mapping | Backend/service |
| 3 | Sélection d'arme (boutons, signal, force attackType) | Assistant .ts + .html |
| 4 | Section dégâts interactive (damageRoll, armor, total) | Assistant .ts + .html |
| 5 | Output `hpChange` + parent panel | Panel .ts |
| 6 | Catégorie effective (dévastatrices + double frappe) | Assistant .ts |

---

## Points à trancher avec le MJ (toi)

1. **Dé variable armure** : est-ce qu'on propose toujours l'input "dé armure" ou seulement si la cible a une armure avec partie variable ?
2. **Double frappe** : est-ce qu'on ajoute une case à cocher dans la section dégâts ou on détecte automatiquement depuis l'option de combat "combat à deux armes" ?
3. **Fallback PNJ sans catégorie** : si un démon ou PNJ n'a que le champ libre `degats`, on affiche juste ce texte sans calcul automatique (le MJ saisit les dégâts bruts directement) — ok ?
