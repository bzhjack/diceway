# Migration PrimeNG → Angular Material

> Rédigé le 2026-07-03. Objectif : supprimer la dépendance PrimeNG (passage en payant) au profit d'Angular Material + SCSS natif. PrimeIcons (`primeicons/primeicons.css`) est conservé pour les icônes — seuls les **composants** PrimeNG sont retirés.

---

## Conventions de migration

| PrimeNG | Remplacement |
|---|---|
| `p-card` | `mat-card appearance="outlined"` |
| `p-button` | `mat-flat-button` / `mat-stroked-button` / `mat-icon-button` |
| `p-tag` | `<dw-tag>` (composant maison) |
| `p-table` | `<table>` natif + `@for` |
| `p-select` | `mat-select` + `mat-option` (sentinel `''` pour "tous") |
| `p-checkbox` | `mat-checkbox` |
| `p-iconfield` / `p-inputicon` / `pInputText` | `mat-form-field` + `matPrefix` + `matInput` |
| `p-iftalabel` | `mat-form-field` (floatLabel globally `'always'`) |
| `p-confirmpopup` / `ConfirmationService` | `MatDialog.open(DwConfirmDialogComponent)` |
| `p-dynamicdialog` / `DialogService` | `MatDialog.open(...)` |
| `p-dialog` | `MatDialog.open(...)` |
| `p-popover` | `mat-menu` ou `matTooltip` |
| `p-inputnumber` | `matInput` + `type="number"` |
| `p-textarea` / `pTextarea` | `textarea matInput` |
| `p-selectbutton` | `mat-button-toggle-group` |
| `p-message` | `<p>` avec classe Tailwind (`text-rose-300`, `text-amber-300`) |
| `p-scrollpanel` | `overflow-y: auto` natif |
| `rowGroupMode="subheader"` | méthode `showGroupHeader(index)` + `@if` |

**Règle apostrophes** : délimiteur `'` (U+0027 ASCII), apostrophe française `'` (U+2019) à l'intérieur des strings — ne jamais mélanger les deux.

---

## État des lieux

### ✅ Pages / composants migrés

| Fichier | Notes |
|---|---|
| `auth/pages/login-page` | SCSS natif (plan précédent) |
| `auth/pages/register-page` | — |
| `auth/pages/forgotten-page` | — |
| `auth/pages/reset-page` | — |
| `auth/pages/*` (5 autres) | — |
| `bol/hero-library/hero-library-page` | mat-card, mat-icon-button (`edit`, `settings`, `delete`) |
| `bol/pnj-library/pnj-library-page` | table native, mat-menu pour détails traits, groupement par type |
| `bol/creature-library/creature-library-page` | dialog statblock via `panelClass: 'creature-statblock-dialog'` |
| `bol/demon-library/demon-library-page` | thème zinc, groupement par catégorie |
| `bol/intendance/intendance-page` | mat-card x2, layout grille 2 col |
| `bol/weapon-library/weapon-library-page` | formulaire inline create/edit, mat-select type M/T |
| `bol/armor-library/armor-library-page` | formulaire inline create/edit, accent sky |
| `bol/workspace/workspace-page` | — |

---

### 🔴 Reste à migrer

Classé par complexité estimée (TS + HTML lignes combinées).

#### Niveau 1 — Léger (< 150 lignes)

| Fichier | PrimeNG restant | Lignes |
|---|---|---|
| `bol/workspace/workspace-header` | button, card, tag | ~60 |
| `bol/workspace/workspace-metrics` | card | ~70 |
| `bol/workspace/workspace-quick-actions` | button, card | ~130 |
| `bol/creation-placeholder/creation-placeholder-page` | button, card, tag | ~130 |
| `bol/hero-advanced/attributs/attributs.component` | iftalabel, inputnumber | ~180 |
| `bol/hero-advanced/combat/combat.component` | iftalabel, inputnumber | ~190 |
| `bol/hero-advanced/origines/region/trait-row/trait-row.component` | popover | ~90 |
| `bol/hero-advanced/traits/trait/trait.component` | popover, tooltip | ~120 |
| `shared/picture/picture` | button, dynamicdialog | ~150 |

#### Niveau 2 — Moyen (150–400 lignes)

| Fichier | PrimeNG restant | Lignes | Particularités |
|---|---|---|---|
| `bol/scenario-library/scenario-library-page` | button, card, iconfield, inputtext, tag, confirmdialog | ~230 | confirmdialog → MatDialog |
| `bol/hero-advanced/armes/armes.component` | api, button, iftalabel, message, select, tooltip | ~230 | sélecteur armes du héros |
| `bol/hero-advanced/armures/armures.component` | api, button, iftalabel, select, tooltip | ~220 | sélecteur armures du héros |
| `bol/hero-advanced/langues/langues.component` | api, button, iftalabel, select, tooltip | ~285 | sélecteur langues du héros |
| `bol/hero-advanced/traits/traits.component` | button, iftalabel, select, api | ~345 | gestion avantages/désavantages |
| `bol/hero-advanced/origines/origines.component` | dynamicdialog, button, iftalabel, inputtext, textarea | ~305 | ouvre dialog région |
| `bol/hero-advanced/origines/region/region.component` | dynamicdialog, button, card, message, scrollpanel, tag | ~170 | contenu du dialog région |
| `bol/session-live/bol-combat-panel/bol-combat-grid/bol-combat-grid` | button, message, select | ~90 | grille de combat |
| `bol/session-live/bol-combat-panel/bol-roll-phase/rp-card/rp-card` | checkbox, inputnumber | ~210 | carte phase de jet |

#### Niveau 3 — Lourd (400+ lignes ou logique complexe)

| Fichier | PrimeNG restant | Lignes | Particularités |
|---|---|---|---|
| `bol/hero-advanced/carrieres/carrieres.component` | api, button, iftalabel, inputnumber, select, tooltip | ~405 | gestion des 4 carrières BoL |
| `bol/hero-advanced/hero-advanced-page` | button, card, confirmpopup, dynamicdialog, iftalabel, inputtext, table | ~620 | page maître héros avancé, orchestrateur |
| `bol/session-live/bol-combat-panel/bol-combat-grid/combat-card/combat-card` | button, popover, tooltip | ~400 | carte combattant, popover → mat-menu |
| `bol/session-live/bol-combat-panel/bol-combatant-picker` | button, card, iconfield, inputtext, selectbutton, tooltip | ~475 | sélection combattants, selectbutton → mat-button-toggle |
| `bol/session-live/session-live-page` | button, card, message, tag | ~385 | page session live |
| `bol/session-live/bol-combat-panel/bol-combat-panel` | button, card, checkbox, dialog | ~700 | panneau combat principal, p-dialog → MatDialog |
| `bol/creature-form/creature-form-page` | button, card, dynamicdialog, iftalabel, inputnumber, inputtext, select, tag, textarea | ~750 | formulaire créature |
| `bol/demon-form/demon-form-page` | button, card, dynamicdialog, iftalabel, inputnumber, inputtext, select, tag, textarea | ~750 | formulaire démon |
| `bol/scenario-form/scenario-form-page` | button, card, iftalabel, inputtext, select, tag, textarea | ~935 | formulaire scénario |
| `bol/pnj-form/pnj-form-page` | button, card, dynamicdialog, iftalabel, inputnumber, inputtext, select, tag, textarea | ~1285 | formulaire PNJ (le plus gros) |
| `bol/hero-form/hero-form-page` | api, button, card, confirmpopup, dynamicdialog, iftalabel, inputnumber, inputtext, select, tag, textarea | ~1475 | formulaire héros (le plus complexe) |
| `bol/session-live/bol-combat-panel/bol-attack-assistant` | button, dialog, selectbutton, select, inputnumber | ~1180 | assistant d'attaque (selectbutton → mat-button-toggle, dialog → MatDialog) |

---

## Points d'attention techniques

### `p-inputnumber` → `matInput type="number"`
- PrimeNG InputNumber gère les incrément/décrément via boutons et des min/max/step. Avec `matInput`, utiliser `type="number"` + attributs HTML natifs `min`, `max`, `step`.
- Pour les valeurs nullables (attributs BoL à 0), s'assurer que la conversion string→number est explicite dans le formulaire réactif.

### `p-popover` → `mat-menu` (ou `matTooltip`)
- Les `p-popover` dans `trait-row`, `trait.component`, `combat-card` affichent du contenu riche (description de trait, détail de combattant). Utiliser `mat-menu` pour les cas avec du contenu HTML, `matTooltip` pour du texte simple.

### `p-selectbutton` → `mat-button-toggle-group`
- Utilisé dans `bol-attack-assistant` et `bol-combatant-picker`. Remplacer par `<mat-button-toggle-group>` + `<mat-button-toggle>`.

### `p-dynamicdialog` / `DialogService` → `MatDialog`
- Pattern déjà établi (`DwConfirmDialogComponent`, `CreatureStatblockDialogContent`). Pour les dialogs de contenu complexe (formulaire région dans origines), créer un composant dialog inline ou séparé et l'ouvrir via `MatDialog.open()`.

### `hero-advanced-page` et ses sous-composants
- La page orchestre ~10 sous-composants (attributs, carrieres, traits, langues, armes, armures, origines, combat, ressources). Migrer de préférence les sous-composants feuilles en premier, puis la page maître.

### `hero-form-page` et `pnj-form-page`
- Les deux plus grands fichiers. Contiennent des `FormArray`, des `DynamicDialog` pour la sélection d'armes/armures/traits, et une logique de validation poussée. À traiter en dernier.

---

## Ordre de migration recommandé

1. **Workspace** (header + metrics + quick-actions) — 3 petits fichiers, gains immédiats sur le dashboard
2. **creation-placeholder** — trivial
3. **shared/picture** — partagé, impact transverse
4. **scenario-library** — pattern déjà connu (liste + confirmdialog)
5. **hero-advanced** sous-composants feuilles : `attributs`, `combat`, `trait-row`, `trait`
6. **hero-advanced** sous-composants métier : `armes`, `armures`, `langues`, `traits`, `carrieres`
7. **hero-advanced** dialogs : `origines`, `region`
8. **hero-advanced-page** (orchestrateur, après les enfants)
9. **session-live** : `bol-combat-grid`, `rp-card`, `combat-card`, `bol-combatant-picker`, `session-live-page`, `bol-combat-panel`, `bol-attack-assistant`
10. **Formulaires** : `scenario-form`, `creature-form`, `demon-form`, `pnj-form`, `hero-form`
