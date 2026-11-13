# Bibliothèques en tuiles — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les bibliothèques des créatures, démons, PNJ et héros montrent leurs fiches en tuiles (portrait, nom, rang, sorte, cœur), comme la table, au lieu d'un tableau.

**Architecture:** Une tuile partagée : ses styles globaux `dw-tuile*` (`front/src/styles/_tuile.scss`) et un composant de présentation `bol-tuile` (`bol/shared/tuile/`) avec des emplacements projetés. Le tri des bibliothèques passe des en-têtes de colonnes à une liste « Trier par » (`bol-library-tri`). La table (`situation`) prend les mêmes styles.

**Tech Stack:** Angular 22 (signals, standalone, OnPush), Angular Material (`mat-select`, `mat-menu`), SCSS (`forge` mixins), Vitest.

**Spec:** `doc/bol/plans/2026-11-13-bibliotheques-en-tuiles-design.md`

## Global Constraints

- Conventions de `CLAUDE.md` (Angular conventions, Styling, Button shapes, Models, Accessibility) : `input()`/`output()`, OnPush, pas de `ngClass`, types exportés dans `models/`, une seule classe custom par élément (pas de Tailwind mêlé).
- Boutons icônes (`⋯`, sens du tri) : ronds (`mat-icon-button`). Inverser le sens est une action, pas une bascule : pas d'`aria-pressed`, un `aria-label` qui dit le sens actuel.
- Écran de référence 1440 × 704 : la page ne défile pas en largeur ; la liste de tuiles défile dans la carte de contenu.
- Vérifier chaque tâche par `npm run build`, `npm run lint`, et les specs touchées (`npm test -- --include <spec>`), depuis `front/`.
- Pas de commit : Lionel commite lui-même.

## Review Focus

- Une fiche sans portrait (`image` null ou en erreur) : l'initiale sur fond bronze, pas d'image cassée — test dans la Task 1.
- Une fiche du catalogue : ni pastille « Mes fiches », ni menu `⋯` — test dans la Task 3.
- Un héros en cours de création : « En cours » visible et « Édition avancée » dans son menu — test dans la Task 5.
- Aucune fiche après filtrage : un message « Aucune … ne correspond à ces filtres. » à la place de la grille — test dans la Task 3.
- Un nom très long : coupé avec « … », le nom complet dans le nom accessible du bouton — vérifié à la capture de la Task 7.

---

### Task 1: La tuile partagée

**Files:**
- Create: `front/src/styles/_tuile.scss` (importé dans `front/src/styles.scss` à côté de `_library-rows`)
- Create: `front/src/app/bol/shared/tuile/tuile.ts`, `tuile.spec.ts`

**Interfaces:**
- Produces: composant `TuileComponent`, sélecteur `bol-tuile`.
  - Inputs : `nom = input.required<string>()`, `image = input<string | null>(null)`, `label = input.required<string>()` (nom accessible du portrait), `vitalite = input<number | null>(null)` (null : pas de cœur), `heroisme = input<number | null>(null)` (non null : pied de héros, écusson + cœur), `pressed = input<boolean | null>(null)` (`aria-pressed` du portrait).
  - Output : `ouvrir = output<MouseEvent>()` au clic sur le portrait.
  - Emplacements projetés : `[bolTuileCoin]` (en haut à gauche : « Mes fiches », `×n`), `[bolTuileMenu]` (en haut à droite, au-dessus de la zone de clic), `[bolTuileTete]` (après le nom : le point d'attitude), `[bolTuileSous]` (la ligne sous le nom), `[bolTuileVie]` (remplace le cœur par défaut : le cœur de groupe de la table), `[bolTuilePied]` (avant l'écusson dans le pied : le dé d'un héros).
  - Classes globales posées par le gabarit : `dw-tuile`, `dw-tuile--heros` (quand `heroisme` non null), `dw-tuile__portrait`, `dw-tuile__initiale`, `dw-tuile__texte`, `dw-tuile__nom`, `dw-tuile__sous`, `dw-tuile__vies`, `dw-tuile__coeur`, `dw-tuile__pied`, `dw-tuile__ecusson`, `dw-tuile__coin`, `dw-tuile__menu` ; classes utilitaires pour le contenu projeté : `dw-tuile-rang` (+ `--R`, `--C`, `--P`), `dw-tuile-sorte`, `dw-tuile-marque` (pastille « Mes fiches », « En cours »).
- Variables CSS : `--dw-tuile-image` (hauteur du portrait, 6,75 rem par défaut), `--dw-tuile-c` (couleur du liseré).

- [ ] **Step 1: Écrire `tuile.spec.ts`** — `it('montre le portrait, le nom et la vitalité')` (image `/a.webp` → `img[src="/a.webp"]`, `.dw-tuile__nom` = « Loup géant », `.dw-tuile__coeur b` = « 7 », `button.dw-tuile__portrait[aria-label="Loup géant, voir son statbloc"]`) ; `it('sans portrait, montre l’initiale')` (image null → pas d'`img`, `.dw-tuile__initiale` = « L » ; et une image en erreur → l'initiale) ; `it('un héros a son pied : écusson et cœur')` (heroisme 3 → `.dw-tuile--heros`, `.dw-tuile__ecusson b` = « 3 », le cœur dans `.dw-tuile__pied`) ; `it('émet ouvrir au clic sur le portrait')` ; `it('projette coin, menu et ligne du dessous')` (hôte de test avec `<span bolTuileCoin>Mes fiches</span>` etc.).
- [ ] **Step 2: Lancer la spec — elle échoue** (`npm test -- --include src/app/bol/shared/tuile/tuile.spec.ts` : composant introuvable).
- [ ] **Step 3: Écrire `tuile.ts` et `_tuile.scss`** — styles repris de `play/theatre/situation.scss` tels qu'ils sont aujourd'hui (tuile isolée, image en `z-index: -2` couvrant la tuile, voile `::before` en `z-index: -1` avec `--sit-voile-debut`/`--sit-voile-plein` renommés `--dw-tuile-voile-debut`/`--dw-tuile-voile-plein`, zone de clic `::after`, cœur réduit en bas à droite à 1,8 × 1,6 rem via `forge.coeur`, ligne du dessous qui laisse 2 rem au cœur, pied de héros 2 rem avec son voile propre, nom remonté, ombre du nom). Le cœur d'un héros garde 2,35 × 2,1 rem. Encapsulation : styles globaux (le composant n'a pas de `styleUrl`), sélecteurs sous `.dw-tuile`.
- [ ] **Step 4: Spec verte, build et lint verts.**

### Task 2: Le tri en liste, sans en-têtes de colonnes

**Files:**
- Modify: `front/src/app/bol/shared/library/library-rows-page.base.ts`, `front/src/app/bol/shared/models/library-rows.model.ts`
- Create: `front/src/app/bol/shared/library/library-tri/library-tri.ts`, `library-tri.spec.ts`
- Delete: `front/src/app/bol/shared/library/library-entete/` (à la Task 5, quand plus aucune page ne l'importe)

**Interfaces:**
- Produces (modèle) : `LibraryTriOption<TTri extends string> { readonly cle: TTri; readonly label: string; }` ; `LibraryColonne` et `LibraryColonneVue` supprimés à la Task 5.
- Produces (base) : `protected abstract readonly optionsDeTri: readonly LibraryTriOption<TTri>[]` ; `protected readonly tri` inchangé ; `protected trierPar(cle: string): void` (même clé : rien ne change ; autre clé : croissant) ; `protected inverserLeSens(): void` ; `trierLes` inchangé. `colonnes`, `colonnesDefinies`, `trier` restent jusqu'à la Task 5 (les pages migrent une à une), puis disparaissent.
- Produces (composant) : `bol-library-tri`, inputs `options = input.required<readonly LibraryTriOption<string>[]>()`, `tri = input.required<LibraryTri<string>>()` ; outputs `cle = output<string>()`, `inverser = output<void>()`. Rendu : `mat-form-field.dw-lr-select-barre` avec `mat-select` (`aria-label="Trier par"`, `panelClass="dw-lr-select-panel"`, `[panelWidth]="null"`, chaque option « Trier par : Nom »… ou libellé court au choix), puis un `button mat-icon-button` (`arrow_upward`/`arrow_downward`, `aria-label` « Ordre croissant, inverser » / « Ordre décroissant, inverser »).

- [ ] **Step 1: `library-tri.spec.ts`** — `it('choisit la clé du tri')` (sélectionner « Vitalité » émet `cle` = `'vitalite'`) ; `it('inverse le sens')` (clic sur le bouton émet `inverser` ; avec `croissant: false`, l'icône est `arrow_downward`).
- [ ] **Step 2: Spec rouge, puis écrire le composant et les ajouts de la base, spec verte.**

### Task 3: Le bestiaire en tuiles (page de référence)

**Files:**
- Modify: `front/src/app/bol/creature/library/creature-library-page.html`, `.ts`, `.spec.ts`
- Modify: `front/src/styles/_library-rows.scss` (la grille : `.dw-lr-grille`, `ul` en `grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr))`, défilement vertical dans `.dw-lr-liste` ; `.dw-lr-vide` gardé)

**Interfaces:**
- Consumes: `bol-tuile` (Task 1), `bol-library-tri`, `optionsDeTri`, `trierPar`, `inverserLeSens` (Task 2).
- Options de tri des créatures : Nom (`nom`), Rang (`type`), Vitalité (`vitalite`), Taille (`taille`). `attaque` et `defense` sortent de `Tri`.
- Le compte des fiches gardées : `<dw-tag dwToolbarCount>` « n créatures » dans la barre, avant « Effacer les filtres ».
- Une tuile : `label` = `nom + ', voir son statbloc'`, `(ouvrir)` → `openStatblock`, `vitalite` = `creature.vitalite`, ligne du dessous = pastille de rang (`dw-tuile-rang dw-tuile-rang--{R|C|P}`) + icône `pets` (`dw-tuile-sorte`, `role="img"`, `aria-label="Créature"`), coin = `<span class="dw-tuile-marque">Mes fiches</span>` si `mienne`, menu = `⋯` (`mat-icon-button`, `aria-label="Actions de <nom>"`, `matMenuTriggerFor`) avec « Modifier » (lien `/create/creature/<id>`, `state: {returnUrl: '/library/creatures'}`) et « Supprimer » (`askDelete`), si `mienne`.

- [ ] **Step 1: Réécrire les tests de la spec qui lisent le tableau** — `ligne(nom)` devient `tuile(nom)` (le `li` dont `.dw-tuile__nom` vaut `nom`) ; « liste toutes les créatures en tuiles, par nom, avec leur rang » (rang lu dans `.dw-tuile-rang`) ; « les fiches du compte ont la pastille et le menu, pas celles du catalogue » (`tuile('Momie royale')` a `.dw-tuile-marque` et `button[aria-label="Actions de Momie royale"]` ; ouvrir le menu montre « Modifier » vers `/create/creature/Momie%20royale` et « Supprimer » ; `tuile('Andrak')` n'a ni l'un ni l'autre) ; le tri : choisir « Rang » puis « Vitalité » dans `mat-select[aria-label="Trier par"]`, l'ordre des noms change, le bouton de sens l'inverse ; « Aucune créature ne correspond à ces filtres. » quand la recherche ne trouve rien. Les tests des filtres restent tels quels.
- [ ] **Step 2: Spec rouge ; réécrire la page ; spec verte, build et lint verts.**

### Task 4: Démons et PNJ en tuiles

**Files:**
- Modify: `front/src/app/bol/demon/library/demon-library-page.{html,ts,spec.ts}`, `front/src/app/bol/pnj/library/pnj-library-page.{html,ts,spec.ts}`

**Interfaces:**
- Consumes: comme la Task 3, page par page.
- Démons : options Nom, Rang, Vitalité, Catégorie ; icône `bolt`, `aria-label="Démon"` ; menu Modifier (`/create/demon/<id>`) / Supprimer.
- PNJ : options Nom, Rang, Vitalité, Région ; icône `person`, `aria-label="PNJ"` ; menu Modifier (`/create/pnj/<id>`) / Supprimer.

- [ ] **Step 1: Adapter les deux specs comme celle du bestiaire** (tuiles, pastille et menu des fiches du compte, tri par la liste).
- [ ] **Step 2: Specs rouges ; réécrire les deux pages ; specs vertes, build et lint verts.**

### Task 5: Les héros en tuiles, et la fin du tableau

**Files:**
- Modify: `front/src/app/bol/hero/library/hero-library-page.{html,ts,spec.ts}`
- Modify: `front/src/app/bol/shared/library/library-rows-page.base.ts`, `front/src/app/bol/shared/models/library-rows.model.ts` (retirer `colonnes`, `colonnesDefinies`, `trier`, `LibraryColonne`, `LibraryColonneVue`)
- Delete: `front/src/app/bol/shared/library/library-entete/`
- Modify: `front/src/styles/_library-rows.scss` (retirer `.dw-lr-cadre`, `.dw-lr-table`, `.dw-lr-num`, `.dw-lr-tri`, `.dw-lr-nom`, `.dw-lr-portrait`, `.dw-lr-nom-texte`, `.dw-lr-rang*`, `.dw-lr-source`, `.dw-lr-provenance*`, `.dw-lr-scenario`, `abbr[title]`, `.dw-lr-texte-long`, `.dw-lr-statut*`, `.dw-lr-actions` ; garder filtres, `.dw-lr-point`, `.dw-lr-select-*`, `.dw-lr-effacer`, `.dw-lr-liste`, `.dw-lr-vide`)

**Interfaces:**
- Héros : `vitalite` = `hero.ressources.vitalite`, `heroisme` = `hero.ressources.heroisme` (pied de héros) ; ligne du dessous = le joueur (`hero.origines.joueur`, sinon rien) ; coin = `<span class="dw-tuile-marque">En cours</span>` si `!hero.active` ; menu (tous les héros sont du compte) : Modifier (`/create/hero/<id>`), « Édition avancée » (`/create/hero-advanced/<id>`) si `!hero.active`, Supprimer. Options de tri : Nom, Joueur, Région, Statut, Vitalité, Héroïsme.

- [ ] **Step 1: Adapter la spec des héros** (tuile, joueur, « En cours » et « Édition avancée » pour un héros en cours, pas pour un actif, tri par la liste).
- [ ] **Step 2: Spec rouge ; réécrire la page ; retirer l'ancien tri et l'en-tête ; specs des quatre pages vertes, build et lint verts (`grep -r "dw-lr-table\|bol-library-entete\|LibraryColonne" front/src` ne trouve plus rien).**

### Task 6: La table prend la tuile partagée

**Files:**
- Modify: `front/src/app/bol/session/play/theatre/situation.html`, `situation.scss`, `situation.spec.ts` si ses sélecteurs changent

**Interfaces:**
- Consumes: `bol-tuile` (Task 1). La table garde chez elle : le glisser (`cdkDrag`, `bolStageDrag`), le paquet (`sit-carte--groupe`), la sélection (`pressed`, Ctrl + clic via `(ouvrir)` qui reçoit le `MouseEvent`), « tombé » (gris), le liseré d'attitude (`--dw-tuile-c`), le point d'attitude (`[bolTuileTete]`), le cœur de groupe et son popover (`[bolTuileVie]`), le dé d'un héros (`[bolTuilePied]`), `×n` (`[bolTuileCoin]`), la vilénie dans la ligne du dessous, la hauteur commune héros/alliés de la compagnie.

- [ ] **Step 1: Remplacer le gabarit `#tuile` par `bol-tuile` et ses emplacements ; retirer de `situation.scss` ce que `_tuile.scss` porte désormais.**
- [ ] **Step 2: `situation.spec.ts` verte (7 tests) ; capture 1440 × 704 de la table avec 5 tuiles en face et une compagnie (héros + allié), rendu identique à celui du 2026-11-13.**

### Task 7: Vérification d'ensemble et documentation

**Files:**
- Modify: `CLAUDE.md` (paragraphe « Library in rows » : tuiles `bol-tuile`, liste « Trier par » `bol-library-tri`, compte dans la barre, menu `⋯` sur les fiches du compte ; plus de tableau ni de `bol-library-entete`)
- Modify: `doc/bol/plans/2026-11-13-bibliotheques-en-tuiles-design.md` (statut : réalisé)

- [ ] **Step 1: `npm run build`, `npm run lint`, `npm test` verts.**
- [ ] **Step 2: Captures 1440 × 704 des quatre bibliothèques (serveur de test sur le port 4400, compte de test) : 6 tuiles par rangée, pas de défilement de page en largeur, un nom long coupé, une fiche sans portrait.**
