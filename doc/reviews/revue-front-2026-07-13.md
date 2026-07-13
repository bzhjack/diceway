# Revue de code front — factorisation & améliorations

_Date : 2026-07-13 — Périmètre : `front/src/app` (127 fichiers TS)_

## Synthèse

Le code est globalement propre et cohérent (signals, OnPush, `inject()`, standalone). Le principal
problème est la **duplication massive entre les 4 familles d'entités** (hero / pnj / creature / demon) :
les form-pages, library-pages, add-menus et dialogs statblock sont des copies quasi identiques les unes
des autres. On peut supprimer environ **1 500 à 2 000 lignes** en factorisant. Viennent ensuite des
incohérences de typage dans les services, trois implémentations différentes d'extraction d'erreur API,
et une couverture de tests quasi nulle (2 fichiers spec).

---

## 1. Factorisation — fort impact

### 1.1 Les 4 form-pages partagent ~70 % de leur code ⭐ priorité n°1

`hero-form-page.ts` (877 l.), `pnj-form-page.ts` (763 l.), `demon-form-page.ts` (460 l.),
`creature-form-page.ts` (455 l.) dupliquent à l'identique :

| Bloc dupliqué | Présent dans |
|---|---|
| `readReturnUrl()` / `navigateBack()` / `returnUrl` signal | les 4 + `hero-advanced-page.ts` |
| `extractErrorMessage()` | les 4 + `hero-advanced-page.ts` |
| `controlValueSignal()` (helper `toSignal` + `startWith`) | les 4 |
| `formDirty` (pipe `PristineChangeEvent`) + `canLeave()` + dialog "modifications non enregistrées" | les 4 |
| `onSaveShortcut()` + host binding `keydown.control.s` | les 4 |
| `pickAvatar()` (ouverture `PictureComponent`, seul le titre change) | les 4 |
| Effet de chargement par route param (`routeParamMap` → `editMode` / `pageTitle` / `submitLabel` / `loadingX`) | les 4 |
| Séquence de save (`pending` guard → `markAllAsTouched` → `finalize` → `markAsPristine` → `navigateBack`) | les 4 |
| `onError(controlName)` | les 4 (+ `arme-library-page.ts`) |
| `compareById` | hero, demon, creature |

**Hero vs PNJ en particulier** : les blocs `selectedXDraft` / `filteredX` / `selectedX` (armes,
armures, carrières, langues, traits), `addXEntry()`, `removeItem()`, `hydrateForm()` (boucles
FormArray), `syncSelectionArrays()`, `traitSource()` / `traitIcon()` / `traitDetails()` sont
copiés-collés à ~95 % (~400 lignes identiques). Idem pour les templates (162 vs 148 lignes,
diff quasi nul une fois les noms substitués).

**Pistes concrètes :**

1. **Classe de base abstraite** `EntityFormPage<T>` (ou un ensemble de fonctions de composition
   dans `bol/shared/form/`) portant : `returnUrl`, `navigateBack`, `extractErrorMessage`,
   `controlValueSignal`, `formDirty`/`canLeave`, `onSaveShortcut`, `pickAvatar(title)`, `onError`,
   l'effet de chargement (paramétré par `(id) => Observable<T>` et `hydrate(T)`), et la séquence
   `submit()` (paramétrée par `buildPayload()` et `create$/update$`). Chaque page ne garderait que :
   la définition du form, `hydrateForm`, `buildPayload` et ses `STAT_GROUPS`.
2. **Factory de sélection FormArray** : une fonction générique
   `selectionEntries<TModel, TEntry>(array: FormArray, list: Signal<TModel[]|undefined>, toEntry)`
   qui produit le triplet `draft` (toSignal) / `filtered` (computed) / `selected` (computed).
   Cela remplace 6 blocs × 2 pages dans hero/pnj.
3. **Déplacer `traitSource`/`traitIcon`/`traitDetails`** dans `bol/shared/trait/` (à côté de
   `trait-icon.ts`) — dupliqués mot pour mot dans hero et pnj form-pages.
4. Les interfaces `HeroSimpleDraft`/`PnjSimpleDraft`, `HeroCarriereDraft`/`PnjCarriereDraft`,
   `HeroTraitDraft`/`PnjTraitDraft`, `DemonPouvoirDraft`/`CreatureCapaciteDraft` sont identiques
   deux à deux → un seul jeu de types partagés (`EntityRefDraft`, `RankedRefDraft`, `TraitDraft`,
   `DetailedRefDraft`).
5. L'effet "défauts depuis la catégorie/taille" (`hydratedCategorieId` dans demon,
   `hydratedTailleId` dans creature) est le même mécanisme → helper commun
   `applyDefaultsFrom(selected, patch, skipOnceId)`.

### 1.2 Les 4 library-pages (hero/pnj/creature/demon) sont des clones

`creature-library-page.ts` et `demon-library-page.ts` : **146 lignes chacun, diff nul hors
substitution de noms**. `hero-library-page.ts` et `pnj-library-page.ts` très proches aussi.
Dupliqués : `refreshTrigger` + `toSignal(switchMap(...))`, filtre recherche multi-champs +
tri "mes créations d'abord", `askDelete` + dialog de confirmation, `openStatblock`, `clearFilters`,
computed `xCount`/`totalXCount`.

**Pistes :**

- Helper `refreshableResource<T>(load: () => Observable<T[]>)` retournant `{data, refresh()}` —
  remplace le trio `refreshTrigger`/`toSignal`/`switchMap` dans 6 pages (aussi arme/armure).
- Utilitaire de recherche `matchesTerm(term, ...values)` (le bloc
  `term.trim().toLocaleLowerCase()` + `.some(...includes)` apparaît dans 6+ pages).
- Utilitaire `confirmDelete(dialog, {title, message}): Observable<boolean>` — le pattern
  `dialog.open(DwConfirmDialogComponent).afterClosed()` apparaît **10+ fois** avec la même forme.
- Les 4 composants dialog `XStatblockDialogContent` (hero/pnj/creature/demon library) sont
  identiques → soit un composant générique avec `ng-content`/`NgComponentOutlet`, soit une
  fonction `openStatblockDialog(dialog, component, data)`.

### 1.3 arme-library vs armure-library : mêmes 250 lignes

`arme-library-page.ts` (274 l.) et `armure-library-page.ts` (249 l.) partagent tout le squelette
"catalogue éditable" : `formVisible`/`editingId`/`submitting`, `startCreate`/`startEdit`/`cancelForm`,
`submitForm` (payload + create/update), `askDelete`, `resolveErrorMessage`, `nullableTrimmed`,
compteurs. → même approche : classe de base `CatalogLibraryPage<T>` ou composition, chaque page
ne gardant que la définition du form et le mapping payload.

### 1.4 Add-menus : 7 composants pour un seul besoin

`arme-add-menu`, `armure-add-menu`, `langue-add-menu` sont **byte-identiques** hors type du
modèle (45 l. chacun) ; `carriere`, `pouvoir`, `capacite`, `trait` n'ajoutent qu'un champ detail
ou un type. Un composant générique `bol-add-menu` avec `items = input<readonly {id, label}[]>`
(+ template d'option projeté si besoin) remplacerait l'essentiel des 7 dossiers.
Les paires `x-list.component` méritent le même examen.

### 1.5 Fonctions image des cards

`heroImage`, `pnjImage`, `creatureImage`, `demonImage` et `heroLanguagesText`/`pnjLanguagesText`,
`heroBadge`/`pnjBadge` sont des quasi-doublons → regrouper dans `bol/shared/entity-card/` (qui
existe déjà) une fonction `entityImage(avatar, fallback)` et les helpers langues/badge communs.

---

## 2. Services & état

### 2.1 Trois implémentations d'extraction d'erreur API

- `extractApiErrors()` dans `core/auth/auth-form.utils.ts` (la plus complète, gère `errors{}`) ;
- `extractErrorMessage()` copié dans 5 pages de formulaire ;
- `resolveErrorMessage()` dans arme/armure library (via `HttpErrorResponse`).

→ Garder **une seule** implémentation dans `core/` (basée sur `HttpErrorResponse`), avec le
fallback en paramètre. `auth-form.utils.ts` n'a d'ailleurs rien de spécifique à l'auth.

### 2.2 `BolHerosService` (192 l.) — service fourre-tout et types faibles

- **22 méthodes retournent `Observable<any>`** alors que le type est connu (il est même écrit dans
  le `http.get<...>` !). Ex. `carrieres(): Observable<any>` mais
  `this.http.get<BolHerosCarriereModel[]>`. Corriger les signatures est mécanique et sans risque.
- Le service mélange 6 responsabilités (régions, traits, carrières, armes, armures, langues,
  héros, PNJ) — à découper au minimum en `BolCatalogService` (référentiels) / `BolHerosService` /
  `BolPnjService`, conformément à la règle "single responsibility per service" du CLAUDE.md.
- Il mélange **état et accès HTTP** : `_heroesList` + `loadHeroes()` vivent dans le service HTTP
  alors qu'il existe des state-services pour ça. `loadHeroes()` + `heroes()` font le même appel.
- `constructor(private http: HttpClient)` → convention du projet = `inject()`. Idem
  `bol-creatures.service.ts`, `bol-demons.service.ts`.
- Les casts `<BolHerosTraitsModel>trait` dans les `post()` sont inutiles.
- URL : `${environment.apiBase}/api/...` répété 59 fois, tantôt en template literal, tantôt en
  concaténation `+ id`. → constante/helper `apiUrl('bol/heros', id)` ou interceptor de base URL.

### 2.3 `BolHerosStateService` (211 l.)

- **7 des 8 usages de `any` du front sont ici** : `modifiers: any[]`, `setWarnTraits(traits: any)`,
  etc. Les signaux `warnTraits = signal([])` sont inférés `never[]`. Définir
  `interface Warn {step: string; warn: string}` (il existe déjà implicitement dans
  `carrieres.component.ts`) et typer signaux + setters.
- Les **six** `warnX = signal([])` + `setWarnX()` + `clearWarnings()` peuvent devenir un seul
  `warnings = signal<Record<WarnSection, Warn[]>>({...})` avec `setWarnings(section, list)` —
  supprime 40 lignes et le `warnCount` se réduit à un `computed` sur `Object.values`.
- `effect(() => this.currentHeros())` dans le constructeur ne fait rien → à supprimer.
- Typos exposées dans l'API du service : `carriereDesavangeCount`, `setwarnCarrieres`.
- **IDs magiques** (33 = Non-combattant, 30/44, 1 = Alchimiste, 24 = Sorcier, 21 = Prêtre)
  éparpillés ici et dans `carrieres.component.ts` → regrouper dans un
  `bol-rules.constants.ts` avec des noms (`CARRIERE_SORCIER = 24`, …).
- Les `toSignal(this.#bhs.langues())` déclenchent **7 requêtes HTTP à l'injection du service**
  (root) et ne sont jamais rafraîchis ni partagés en cas d'erreur. A minima ajouter
  `shareReplay(1)` côté service ; idéalement passer par des resources rafraîchissables communes
  (cf. 1.2).
- `traitsModifiers` utilise `.map()` pour itérer (sans retour) → `forEach`, et
  `?.filter(...)?.find(...)` peut se réduire à un seul `find`.

### 2.4 Coercition `Number()` partout — symptôme d'un problème de bord

242 occurrences de `Number(...)`, dont 65 dans le seul `hero-form-page.ts`, presque toutes pour
comparer des ids (`Number(a.id) === Number(b.id)`). La vraie cause : l'API Laravel renvoie des
ids tantôt string tantôt number, et les modèles TS ne le disent pas. **Normaliser une fois à la
frontière** (un `map()` dans les services qui convertit les ids) puis supprimer les coercitions
dans les computed/comparaisons. À défaut, un helper `sameId(a, b)` et
`toIdSet(list)` réduirait déjà beaucoup le bruit.

---

## 3. Robustesse

- **Suppressions sans gestion d'erreur** : `deleteCreature`, `deleteDemon`, `deleteHero`,
  `deletePnj` → `subscribe({next})` seul ; si l'API échoue, aucune feedback utilisateur.
  Idem `loadHeroes()`. Ajouter au minimum un message d'erreur (le futur helper commun
  d'erreur + un snackbar/`DwErrorMessage`).
- `arme-library-page.ts:181` : `submitForm` ne passe pas par `finalize` (contrairement aux
  form-pages) — le `submitting.set(false)` est dupliqué dans `next` et `error`.
- `pnj-form-page.ts` : contrairement au héros, pas de bouton/flux d'activation — OK, mais le
  champ `foi`/`pouvoir`/`creation` existent dans le form sans être dans `PNJ_STAT_GROUPS` ;
  vérifier qu'ils sont bien éditables quelque part ou les retirer du form.

## 4. Cohérence / conventions

- `login-page.ts` (et probablement register/reset/resend) utilise `ChangeDetectorRef` +
  propriétés mutables `pending`/`messages` au lieu de signals — seul endroit du front dans ce
  style. Migrer vers `signal()` supprime le `cdr` et aligne avec le reste.
- Deux patterns de chargement de listes coexistent : `refreshTrigger + toSignal(switchMap)`
  (creature/demon/arme/armure) vs signal dans le service + `loadHeroes()` (hero/pnj).
  En choisir un (le premier, factorisé — cf. 1.2).
- `PNJ_TYPE_LABELS` et `PNJ_TYPE_OPTIONS` encodent deux fois le même mapping → dériver
  `OPTIONS` de `LABELS`. `weaponTypeLabel()` dans arme-library ré-encode aussi le mapping de
  `weaponTypeOptions`.
- `picture.ts:19` : dernier `any` restant (`imageChangedEvent`) → typer avec l'event du cropper.
- `FormArray` non typés (`this.formBuilder.array([])`) dans toutes les form-pages ; avec la
  factorisation 1.1, typer `FormArray<FormGroup<...>>` devient rentable.

## 5. Tests

**2 fichiers spec pour 127 fichiers TS** (`app.spec.ts`, `create.validators.spec.ts`).
Les meilleurs candidats à tester (logique pure, sans DOM) :

1. `BolHerosStateService` : `heroismCost`, `traitsModifiers`, `carriereDesavangeCount`,
   budgets E11/E12 — c'est la logique métier BoL la plus sensible du front.
2. Les futurs helpers factorisés (extraction d'erreur, `matchesTerm`, selection factory) —
   la factorisation rend précisément ces tests possibles.
3. `updateWarnings()` de `carrieres.component.ts` (règles région/carrières).

## Ordre d'attaque suggéré

| # | Chantier | Effort | Gain |
|---|---|---|---|
| 1 | ✅ ~~Helper d'erreur API unique + gestion d'erreur des deletes~~ (fait le 2026-07-13) | S | robustesse immédiate |
| 2 | Typage services (`Observable<any>` → types réels) + `any` du state service | S | sécurité de type, mécanique |
| 3 | Factorisation form-pages (base + selection factory + trait utils) | L | −800 à −1000 lignes |
| 4 | Factorisation library-pages (`refreshableResource`, `confirmDelete`, recherche, statblock dialog) | M | −400 lignes |
| 5 | Add-menu générique | M | −6 dossiers de composants |
| 6 | Normalisation des ids à la frontière API (suppression des `Number()`) | M | lisibilité globale |
| 7 | Découpage `BolHerosService` + constantes de règles BoL nommées | M | maintenabilité |
| 8 | Tests sur la logique métier state service | M | filet de sécurité |

> Conseil d'exécution : faire 3 et 4 **avant** d'ajouter la prochaine entité ou page — chaque
> nouvelle entité copie aujourd'hui ~600 lignes de boilerplate.
