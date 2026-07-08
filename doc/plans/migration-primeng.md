# Migration PrimeNG → Angular Material

> Rédigé le 2026-07-03, mis à jour le 2026-07-06 (5). Objectif : supprimer la dépendance PrimeNG (passage en payant) au profit d'Angular Material + SCSS natif. PrimeIcons (`primeicons/primeicons.css`) est conservé pour les icônes — seuls les **composants** PrimeNG sont retirés.

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

**Icônes** : PrimeIcons (`pi pi-*`) remplacés par `<mat-icon>nom</mat-icon>` (Material Symbols). Les icônes dans les données TS (dynamiques) utilisent directement le nom Material (`'explore'`, `'add'`, etc.). Mapping de référence dans le script Python de session. Les fichiers non encore migrés conservent leurs `icon="pi pi-*"` sur `<p-button>` — ils seront traités à la migration.

---

## Composants shared créés pendant la migration

| Composant | Sélecteur | Rôle |
|---|---|---|
| `DwTagComponent` | `<dw-tag>` | Pastille de compteur / label neutre |
| `DwBadgeComponent` | `<dw-badge color="amber|sky|rose|emerald|neutral">` | Badge coloré (type, statut) |
| `DwConfirmDialogComponent` | via `MatDialog.open()` | Boîte de confirmation destructive |
| `DwLibraryHeaderComponent` | `<dw-library-header title kicker description color>` | Carte en-tête des pages bibliothèque (eyebrow + h1 + tags + actions) — slots `[dwHeaderTags]` et `[dwHeaderActions]` |
| `DwLibraryToolbarComponent` | `<dw-library-toolbar placeholder checkboxLabel [(searchTerm)] [(checked)] (cleared)>` | Barre de filtres des pages bibliothèque — slots `[dwToolbarFilter]` (select optionnel) et `[dwToolbarCount]` |

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
| `bol/hero-library/hero-library-page` | `DwLibraryHeaderComponent` (emerald) + `DwLibraryToolbarComponent` (checkbox "En cours de création") |
| `bol/pnj-library/pnj-library-page` | `DwLibraryHeaderComponent` (emerald) + `DwLibraryToolbarComponent` (+ select type via `[dwToolbarFilter]`) |
| `bol/creature-library/creature-library-page` | `DwLibraryHeaderComponent` (amber) + `DwLibraryToolbarComponent` (+ select taille) |
| `bol/demon-library/demon-library-page` | `DwLibraryHeaderComponent` (rose) + `DwLibraryToolbarComponent` (+ select catégorie, thème zinc via `--dw-lt-border`) |
| `bol/intendance/intendance-page` | mat-card x2, layout grille 2 col |
| `bol/weapon-library/weapon-library-page` | `DwLibraryHeaderComponent` (amber) + `DwLibraryToolbarComponent`, formulaire inline create/edit |
| `bol/armor-library/armor-library-page` | `DwLibraryHeaderComponent` (sky) + `DwLibraryToolbarComponent`, formulaire inline create/edit |
| `bol/workspace/workspace-page` | — |
| `bol/workspace/workspace-header` | mat-card + background-image via classe locale (pas de `::ng-deep`), dw-tag x3, mat-stroked-button |
| `bol/workspace/workspace-metrics` | mat-card + SCSS local (background, hover lift), routerLink conditionnel via `null`, template simplifié (plus de duplication) |
| `bol/workspace/workspace-quick-actions` | mat-card + backdrop-filter, `WorkspaceActionCardComponent` extrait (composant local), icônes Material dans les données |
| `shared/picture/picture` | `MatDialogRef` + `MAT_DIALOG_DATA` (titre passé par l'appelant), `MatButtonModule` + `MatIconModule`, `mat-dialog-title/content/actions` ; 5 appelants migré vers `MatDialog.open()` + `afterClosed()` |
| `bol/creation-placeholder/creation-placeholder-page` | mat-card, dw-tag x2, mat-stroked-button/mat-flat-button, icônes Material dans les données (`explore`, `account_tree`, `shield`, `settings`, `manage_accounts`, `event`) |
| `bol/creature-form/creature-form-page` | mat-card, mat-form-field (input, select, textarea), mat-button, dw-tag ; `compareWith` pour le select taille (coercition string/number) |
| `bol/demon-form/demon-form-page` | mat-card, mat-form-field (input, select, textarea), mat-button, dw-tag ; thème zinc/rose conservé avec inline classes ; `compareWith` pour le select catégorie |
| `bol/pnj-form/pnj-form-page` | mat-card, mat-form-field (input, select, textarea), mat-button, dw-tag, dw-badge (traits A/D) ; mat-icon-button pour supprimer ; `compareWith` sur tous les selects sauf type (string) |
| `bol/hero-form/hero-form-page` | mat-card, mat-form-field (input, select, textarea, number), mat-button, dw-tag, dw-badge (traits A/D) ; mat-icon-button pour supprimer ; `compareWith` sur tous les selects ; confirmpopup → `DwConfirmDialogComponent` |
| `bol/hero-advanced/attributs/attributs.component` | mat-form-field + `matInput type="number"` (vigueur/agilité/esprit/aura), `[formControl]` direct (pas de formGroup) |
| `bol/hero-advanced/combat/combat.component` | mat-form-field + `matInput type="number"` (initiative/mêlée/tir/défense) |
| `bol/hero-advanced/origines/region/trait-row/trait-row.component` | popover → `mat-menu` (avantage/désavantage), déclenché via `[matMenuTriggerFor]` |
| `bol/hero-advanced/traits/trait/trait.component` | popover → `mat-menu`, tooltip → `matTooltip`, icônes `pi-map-marker`/`pi-hammer` → `mat-icon` (`place`/`construction`, redimensionnées en `!h-3 !w-3 !text-xs !leading-3` pour l'usage inline 12px) |
| `bol/hero-advanced/armes/armes.component` | select (avec sous-libellé dégâts) → mat-select + mat-option, `p-message` → `<p>` classes amber, confirm → `DwConfirmDialogComponent` via `MatDialog` ; `selectedArmeId` FormControl + `selectedArme` computed (remplace le signal objet) |
| `bol/hero-advanced/armures/armures.component` | idem armes (select protection, confirm → MatDialog) |
| `bol/hero-advanced/langues/langues.component` | select simple, confirm → MatDialog ; callback `.find()` typé explicitement (`langueList` vient d'un service `Observable<any>`, sinon TS7006 implicit any) |
| `bol/hero-advanced/traits/traits.component` | 2 mat-select (type A/D via `contextTypeCtrl`, trait via `selectedTraitId` + `mat-select-trigger` pour l'affichage riche icône/label), `$any(trait)` pour l'accès aux champs `avantage`/`desavantage`/`region_id`/`detail` (union de types), confirm → MatDialog |
| `bol/hero-advanced/carrieres/carrieres.component` | 2 mat-select (carrière + désavantage de carrière), `matInput type="number"` par ligne (rang), confirm → MatDialog |
| `bol/hero-advanced/origines/region/region.component` | dialog région : `DynamicDialogConfig/Ref` (PrimeNG) → `MAT_DIALOG_DATA` + `MatDialogRef` typé (`HeroAdvancedRegionDialogData`/`Result`), `mat-dialog-title/content/actions`, p-tag cliquables → `<dw-tag>` + binding de classe, p-scrollpanel → `overflow-y-auto` natif, p-message → `<p>` (sky/amber/slate selon severity) |
| `bol/hero-advanced/origines/origines.component` | ouverture du dialog région via `MatDialog.open()` (au lieu de `DialogService`), mat-form-field (joueur/nom/commentaire), mat-icon `image` pour l'avatar |
| `bol/hero-advanced/hero-advanced-page` | orchestrateur : mat-card x2, confirmpopup → `DwConfirmDialogComponent` via MatDialog, p-table (modificateurs post-activation) → `<table>` natif + `@for`, `ConfirmationService`/`DialogService` retirés des providers (plus nécessaires, tout passe par `MatDialog` global) — **`hero-advanced` est intégralement migré** |

---

### 🔴 Reste à migrer

Classé par complexité estimée (TS + HTML lignes combinées).

#### Niveau 1 — Léger (< 150 lignes)

| Fichier | PrimeNG restant | Lignes |
|---|---|---|
| ~~`bol/workspace/workspace-header`~~ | ~~button, card, tag~~ | ~~migré~~ |
| ~~`bol/workspace/workspace-metrics`~~ | ~~card~~ | ~~migré~~ |
| ~~`bol/workspace/workspace-quick-actions`~~ | ~~button, card~~ | ~~migré~~ |
| ~~`bol/creation-placeholder/creation-placeholder-page`~~ | ~~button, card, tag~~ | ~~migré~~ |
| ~~`bol/hero-advanced/attributs/attributs.component`~~ | ~~iftalabel, inputnumber~~ | ~~migré~~ |
| ~~`bol/hero-advanced/combat/combat.component`~~ | ~~iftalabel, inputnumber~~ | ~~migré~~ |
| ~~`bol/hero-advanced/origines/region/trait-row/trait-row.component`~~ | ~~popover~~ | ~~migré~~ |
| ~~`bol/hero-advanced/traits/trait/trait.component`~~ | ~~popover, tooltip~~ | ~~migré~~ |
| ~~`shared/picture/picture`~~ | ~~button, dynamicdialog~~ | ~~migré~~ |

#### Niveau 2 — Moyen (150–400 lignes)

| Fichier | PrimeNG restant | Lignes | Particularités |
|---|---|---|---|
| `bol/scenario-library/scenario-library-page` | button, card, iconfield, inputtext, tag, confirmdialog | ~230 | confirmdialog → MatDialog |
| ~~`bol/hero-advanced/armes/armes.component`~~ | ~~api, button, iftalabel, message, select, tooltip~~ | ~~migré~~ |
| ~~`bol/hero-advanced/armures/armures.component`~~ | ~~api, button, iftalabel, select, tooltip~~ | ~~migré~~ |
| ~~`bol/hero-advanced/langues/langues.component`~~ | ~~api, button, iftalabel, select, tooltip~~ | ~~migré~~ |
| ~~`bol/hero-advanced/traits/traits.component`~~ | ~~button, iftalabel, select, api~~ | ~~migré~~ |
| ~~`bol/hero-advanced/origines/origines.component`~~ | ~~dynamicdialog, button, iftalabel, inputtext, textarea~~ | ~~migré~~ |
| ~~`bol/hero-advanced/origines/region/region.component`~~ | ~~dynamicdialog, button, card, message, scrollpanel, tag~~ | ~~migré~~ |
| `bol/session-live/bol-combat-panel/bol-combat-grid/bol-combat-grid` | button, message, select | ~90 | grille de combat |
| `bol/session-live/bol-combat-panel/bol-roll-phase/rp-card/rp-card` | checkbox, inputnumber | ~210 | carte phase de jet |

#### Niveau 3 — Lourd (400+ lignes ou logique complexe)

| Fichier | PrimeNG restant | Lignes | Particularités |
|---|---|---|---|
| ~~`bol/hero-advanced/carrieres/carrieres.component`~~ | ~~api, button, iftalabel, inputnumber, select, tooltip~~ | ~~migré~~ | ~~gestion des 4 carrières BoL~~ |
| ~~`bol/hero-advanced/hero-advanced-page`~~ | ~~button, card, confirmpopup, dynamicdialog, iftalabel, inputtext, table~~ | ~~migré~~ | ~~page maître héros avancé, orchestrateur — `hero-advanced` est intégralement migré~~ |
| `bol/session-live/bol-combat-panel/bol-combat-grid/combat-card/combat-card` | button, popover, tooltip | ~400 | carte combattant, popover → mat-menu |
| `bol/session-live/bol-combat-panel/bol-combatant-picker` | button, card, iconfield, inputtext, selectbutton, tooltip | ~475 | sélection combattants, selectbutton → mat-button-toggle |
| `bol/session-live/session-live-page` | button, card, message, tag | ~385 | page session live |
| `bol/session-live/bol-combat-panel/bol-combat-panel` | button, card, checkbox, dialog | ~700 | panneau combat principal, p-dialog → MatDialog |
| ~~`bol/creature-form/creature-form-page`~~ | ~~button, card, dynamicdialog, ...~~ | ~~migré~~ | ~~formulaire créature~~ |
| ~~`bol/demon-form/demon-form-page`~~ | ~~button, card, dynamicdialog, ...~~ | ~~migré~~ | ~~formulaire démon~~ |
| `bol/scenario-form/scenario-form-page` | button, card, iftalabel, inputtext, select, tag, textarea | ~935 | formulaire scénario |
| ~~`bol/pnj-form/pnj-form-page`~~ | ~~button, card, dynamicdialog, ...~~ | ~~migré~~ | ~~formulaire PNJ~~ |
| ~~`bol/hero-form/hero-form-page`~~ | ~~api, button, card, confirmpopup, dynamicdialog, iftalabel, inputnumber, inputtext, select, tag, textarea~~ | ~~migré~~ | ~~confirmpopup → DwConfirmDialogComponent via MatDialog~~ |
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
