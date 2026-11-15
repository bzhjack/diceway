# Les jets d'une scène — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une scène porte une liste de jets structurés (attribut, difficulté, enjeu, échec), saisie dans « Préparer la scène », importée avec les scénarios, montrée à la table dans un onglet « Jets » du carnet d'où un jet se lance pour un héros, panneau de jet prérempli ; « En jeu » devient « Mise en scène » ; la Perle du Beshaar est reprise dans ce format.

**Architecture:** Une colonne JSON `bol_scene.jets`, nettoyée par une classe pure `BolSceneJets` (comme `BolScenePreparation::pistes`), écrite par `POST /bol/scene/update` et par l'import. Côté front, le type `BolSceneJet` et un util partagé (libellés, difficultés alignées sur `ACTION_DIFFICULTIES`) ; un onglet de saisie dans `scene-form-page` ; un composant `bol-scene-jets` dans le carnet ; un préréglage (`ActionRollPreset`) que `ExpandedCardStore` passe jusqu'au panneau de jet.

**Tech Stack:** Laravel 13 (PHPUnit, conteneur `diceway`), Angular 22 (signals, Signal Forms, Material), Vitest.

**Spec:** `doc/bol/plans/2026-11-13-jets-de-scene-analyse.md` (section « Décisions » : pas de jets de combat, « réaction » = Esprit, pas de case « fait », reprise de la Perle d'abord, « Mise en scène »).

## Global Constraints

- Attributs d'un jet : `vigueur`, `agilite`, `esprit`, `aura` seulement ; 0, 1 ou 2 par jet. Jamais Mêlée, Tir, Défense, Initiative.
- Difficultés (slug → libellé, modificateur) : `tres-facile` Très facile +2, `facile` Facile +1, `moyenne` Moyenne 0, `ardue` Ardue -1, `difficile` Difficile -2, `tres-difficile` Très difficile -4, `impossible` Impossible -6, `heroique` Héroïque -8. Par défaut `moyenne`.
- Un jet : `titre` (obligatoire, 120 au plus), `attributs`, `difficulte`, puis `enjeu`, `echec`, `reussite`, `carriere`, `quand` (facultatifs, 300 au plus chacun). 20 jets au plus par scène.
- Libellés visibles : « Jets », « Mise en scène » (à la place de « En jeu »), « Lancer pour », « Sans jet ». Le champ `jeu` garde son nom en base, dans l'API et dans l'import.
- Conventions de `CLAUDE.md` (Angular, Styling, Button shapes : attributs en bascules rectangulaires `aria-pressed`, boutons icônes ronds ; Models dans `models/`). Backend : logique dans `app/Http/Services/Bol/`.
- Vérifications : back `docker cp backend/tests/. diceway:/var/www/html/tests/ && docker exec diceway php artisan test --filter <Test>` (la machine hôte n'a pas le pilote SQLite) ; front `npm run build`, `npm run lint`, `npm test -- --include <spec>` depuis `front/`.
- Pas de commit : Lionel commite. L'import réel de la Perle (Task 7) se fait sur le compte bogomit@gmail.com **après accord de Lionel** (il écrase les scènes modifiées dans l'app).

## Review Focus

- Une scène sans jets (`jets` null) : pas d'onglet « Jets » au carnet, un onglet vide à la saisie, et l'enregistrement envoie `jets: null` — tests Tasks 3 et 5.
- Un jet sans attribut (effet automatique) : « Sans jet » et pas de « Lancer pour » — test Task 5.
- Une table sans héros : « Lancer pour » absent — test Task 5.
- Lancer un jet pour le héros dont la carte est déjà ouverte : le préréglage s'applique quand même — test Task 6.
- L'import d'une difficulté au masculin (« ardu ») ou d'un attribut de combat (« melee ») : refusé avec le chemin de l'erreur — test Task 2.

---

### Task 1: Le modèle et la saisie côté serveur

**Files:**
- Create: `backend/database/migrations/2026_11_14_100000_add_jets_to_bol_scene.php` (`json('jets')->nullable()->after('jeu')`)
- Create: `backend/app/Http/Services/Bol/BolSceneJets.php`
- Modify: `backend/app/Models/Bol/BolScene.php` (fillable `jets`, cast `array`, doc), `backend/app/Http/Controllers/Bol/BolSceneController.php` (règles et clés de `update`), `backend/app/Http/Services/Bol/BolSceneService.php` (`jets` dans les champs écrits)
- Test: `backend/tests/Unit/BolSceneJetsTest.php`, `backend/tests/Feature/BolSceneJetsSaisieTest.php`

**Interfaces:**
- Produces: `final class BolSceneJets` avec `ATTRIBUTS` (liste), `DIFFICULTES` (slug → modificateur, dans l'ordre ci-dessus), `JETS_MAX = 20`, `TITRE_MAX = 120`, `TEXTE_MAX = 300`, `TEXTES = ['enjeu', 'echec', 'reussite', 'carriere', 'quand']`, et `public static function nettoyer(?array $jets): ?array` : textes rognés et bornés, vides → `null`, jets sans titre retirés, attributs inconnus retirés, dédoublonnés, deux au plus, difficulté inconnue → `moyenne`, vingt jets au plus ; `null` s'il n'en reste aucun. Chaque jet rendu : `{titre, attributs, difficulte, enjeu, echec, reussite, carriere, quand}` (toutes les clés présentes).
- Produces (API) : `POST /bol/scene/update` accepte `jets` (`sometimes|nullable|array|max:20`, `jets.*.titre` `nullable|string|max:120`, `jets.*.attributs` `nullable|array|max:2`, `jets.*.attributs.*` `in:vigueur,agilite,esprit,aura`, `jets.*.difficulte` `nullable|in:<slugs>`, chaque texte `nullable|string|max:300`) ; la scène renvoyée porte `jets`.

- [ ] **Step 1: Tests unitaires** — `test_un_jet_complet_est_garde_tel_quel`, `test_les_textes_vides_deviennent_null_et_sont_rognes`, `test_un_jet_sans_titre_est_retire`, `test_attributs_inconnus_retires_dedoublonnes_deux_au_plus` (`['esprit','melee','esprit','vigueur','aura']` → `['esprit','vigueur']`), `test_difficulte_inconnue_ou_absente_devient_moyenne`, `test_vingt_jets_au_plus`, `test_aucun_jet_rend_null` (`[]` et `null` → `null`).
- [ ] **Step 2: Tests de saisie** — `test_la_scene_enregistre_ses_jets` (update avec deux jets → `distribution` inchangée, `jets` nettoyés en base et dans la réponse) ; `test_un_attribut_de_combat_est_refuse` (`attributs: ['melee']` → 422) ; `test_une_difficulte_inconnue_est_refusee` (`difficulte: 'ardu'` → 422) ; `test_un_update_sans_jets_les_garde`.
- [ ] **Step 3: Lancer, voir échouer** (classe et colonne absentes).
- [ ] **Step 4: Migration, classe, modèle, contrôleur, service.**
- [ ] **Step 5: Tests verts, puis la suite back complète.**

### Task 2: Les jets dans l'import des scénarios

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolScenarioImportPlan.php` (lecture et vérification de `jets` dans la scène, `'jets' => BolSceneJets::nettoyer(...)` dans `fields`), `doc/bol/scenarios/format-import.md` (bloc `"jets"` et ses règles ; le commentaire de `jeu` devient « Mise en scène : consignes et lieux »)
- Test: `backend/tests/Unit/BolScenarioImportPlanTest.php`

**Interfaces:**
- Consumes: `BolSceneJets` (Task 1).
- Produces: dans le fichier d'import, `"jets": [{"titre", "attributs": [..], "difficulte", "enjeu", "echec", "reussite", "carriere", "quand"}]`, facultatif ; erreurs aux chemins `scenes[i].jets` (« 20 jets au plus »), `scenes[i].jets[j].titre` (obligatoire, 120), `scenes[i].jets[j].attributs[k]` (« attribut inconnu : melee ; vigueur, agilite, esprit ou aura »), `scenes[i].jets[j].attributs` (« deux attributs au plus »), `scenes[i].jets[j].difficulte` (« difficulté inconnue : ardu ; tres-facile, facile, moyenne, ardue, … »), textes (300). L'importeur n'a rien à changer : `jets` passe par `fields`.

- [ ] **Step 1: Tests** — `test_une_scene_importe_ses_jets` (deux jets → `fields['jets']` nettoyés, difficulté absente → `moyenne`) ; `test_une_scene_sans_jets_a_jets_null` ; `test_une_difficulte_au_masculin_est_refusee` (« ardu » → erreur au chemin `scenes[0].jets[0].difficulte`) ; `test_un_attribut_de_combat_est_refuse` (« melee » → `scenes[0].jets[0].attributs[0]`) ; `test_un_jet_sans_titre_est_refuse`.
- [ ] **Step 2: Rouges ; implémenter ; verts ; suite back complète.**

### Task 3: Le modèle front et la saisie dans « Préparer la scène »

**Files:**
- Modify: `front/src/app/bol/models/bol-scene.model.ts` (types ci-dessous ; `jets: BolSceneJet[] | null` sur `BolSceneModel`, `jets?: BolSceneJet[] | null` sur `BolSceneChanges`)
- Create: `front/src/app/bol/shared/scene-jets.util.ts`, `front/src/app/bol/shared/scene-jets.util.spec.ts`
- Modify: `front/src/app/bol/scenario/models/scene-form.model.ts` (`SceneFormValue.jets: JetSaisie[]`, `JetSaisie`, `SceneOnglet` gagne `'jets'`), `scene-form/scene-form.util.ts` (`sceneFormValue`, `sceneChanges`), `scene-form/scene-form-page.{ts,html,scss}`, `scene-form/scene-form.util.spec.ts`, `scene-form/scene-form-page.spec.ts`

**Interfaces:**
- Produces (modèles, `bol-scene.model.ts`) : `type SceneJetAttribut = 'vigueur' | 'agilite' | 'esprit' | 'aura'` ; `type SceneJetDifficulte = 'tres-facile' | 'facile' | 'moyenne' | 'ardue' | 'difficile' | 'tres-difficile' | 'impossible' | 'heroique'` ; `interface BolSceneJet {titre: string; attributs: SceneJetAttribut[]; difficulte: SceneJetDifficulte; enjeu: string | null; echec: string | null; reussite: string | null; carriere: string | null; quand: string | null}`.
- Produces (`scene-jets.util.ts`) : `JET_ATTRIBUTS: readonly {cle: SceneJetAttribut; label: string}[]` (Vigueur, Agilité, Esprit, Aura) ; `JET_DIFFICULTES: readonly {cle: SceneJetDifficulte; label: string; modifier: number}[]` (libellés et modificateurs identiques à `ACTION_DIFFICULTIES`) ; `JETS_MAX = 20` ; `function libelleDifficulte(cle: SceneJetDifficulte): string` (« Ardue −1 », « Moyenne ») ; `function actionDifficultyDu(cle: SceneJetDifficulte): ActionDifficulty` (l'entrée de `ACTION_DIFFICULTIES` de même libellé).
- Produces (formulaire) : `interface JetSaisie {titre: string; attributs: SceneJetAttribut[]; difficulte: SceneJetDifficulte; enjeu: string; echec: string; reussite: string; carriere: string; quand: string}` ; `sceneChanges` rend `jets` rognés, vides → `null`, sans titre retirés, aucun → `null`.
- L'onglet « Jets » (après « À lire aux joueurs », avant « Mise en scène ») : une ligne par jet, `li.sfp-jet` : titre (`mat-form-field`, obligatoire), attributs en bascules (`button.sfp-jet-attribut`, `aria-pressed`, un troisième désactivé tant que deux sont choisis), difficulté (`mat-select`, `aria-label="Difficulté du jet n"`), enjeu, échec ; un `<details>` « Plus » pour réussite, carrière, quand ; boutons ronds « Monter », « Descendre », « Retirer le jet n » ; « Jet » ajoute une ligne (désactivé à 20). Méthodes : `addJet()`, `removeJet(index)`, `deplacerJet(index, delta: -1 | 1)`, `basculerAttribut(index, attribut)`. Le compte des jets dans l'onglet, comme les pistes.
- L'onglet « En jeu » devient « Mise en scène », aide : « Comment jouer la scène : les consignes et les lieux ; les jets ont leur onglet… ».

- [ ] **Step 1: Tests util** — `scene-jets.util.spec.ts` : chaque slug donne le libellé et le modificateur de `ACTION_DIFFICULTIES` ; `libelleDifficulte('ardue') === 'Ardue −1'`, `libelleDifficulte('moyenne') === 'Moyenne'`. `scene-form.util.spec.ts` : `sceneFormValue` d'une scène sans jets → `jets: []` ; `sceneChanges` rogne, met `null` aux textes vides, retire un jet sans titre, rend `jets: null` quand il n'en reste aucun.
- [ ] **Step 2: Tests page** — `scene-form-page.spec.ts` : l'onglet « Mise en scène » existe et plus « En jeu » ; « Jet » ajoute une ligne ; basculer Esprit puis Vigueur, Agilité est alors désactivé ; enregistrer envoie `jets: [{titre: 'Coquillage', attributs: ['vigueur'], difficulte: 'ardue', …}]` à `update`.
- [ ] **Step 3: Rouges ; implémenter ; verts ; build et lint.**

### Task 4: Le préréglage du panneau de jet

**Files:**
- Modify: `front/src/app/bol/session/models/action-roll.model.ts` (`ActionRollPreset`), `front/src/app/bol/session/play/action-roll-panel/action-roll-panel.ts`, `action-roll-panel.spec.ts` (le créer s'il n'existe pas)

**Interfaces:**
- Produces: `interface ActionRollPreset {readonly attributs: readonly ActionAttribute[]; readonly difficulty: ActionDifficulty}` ; `ActionRollPanelComponent.preset = input<ActionRollPreset | null>(null)` : à chaque nouveau préréglage non nul, `attribute` prend celui des `attributs` où le héros a la plus haute valeur (le premier à égalité ; rien si la liste est vide) et `difficulty` prend `preset.difficulty`. Le MJ peut ensuite tout changer à la main.

- [ ] **Step 1: Tests** — `applique l’attribut et la difficulté du préréglage` (`{attributs: ['vigueur'], difficulty: Ardue}` → Vigueur et Ardue sélectionnées) ; `prend le meilleur des deux attributs du héros` (agilité 2, vigueur 1, `['vigueur','agilite']` → Agilité) ; `sans préréglage, garde Agilité et Moyenne`.
- [ ] **Step 2: Rouges ; implémenter (un `effect` sur `preset`) ; verts.**

### Task 5: L'onglet « Jets » du carnet

**Files:**
- Create: `front/src/app/bol/session/play/theatre/scene-jets.ts`, `scene-jets.spec.ts`
- Modify: `front/src/app/bol/session/play/theatre/scene-lecture.{ts,html,scss}` (onglet `jets`, libellé « Mise en scène »), `theatre.{ts,html}`, `front/src/app/bol/session/play/session-play-page.html`, `front/src/app/bol/session/models/theatre.model.ts` (`JetLance`)

**Interfaces:**
- Consumes: `BolSceneJet`, `libelleDifficulte`, `JET_ATTRIBUTS` (Task 3).
- Produces: `bol-scene-jets` : inputs `jets = input.required<readonly BolSceneJet[]>()`, `heros = input<readonly TapisCard[]>([])` ; output `lancer = output<JetLance>()` avec `interface JetLance {readonly jet: BolSceneJet; readonly hero: TapisCard}` (dans `theatre.model.ts`). Rendu : `ul.scj-liste`, un `li` par jet : le titre, les attributs et la difficulté en badges (« Vigueur ou Agilité », « Ardue −1 »), « Sans jet » quand `attributs` est vide ; sous le titre « enjeu · échec : … », puis réussite, carrière, quand s'ils sont écrits ; à droite « Lancer pour » (`mat-stroked-button`, `mat-menu` des héros de `heros`), seulement si le jet a un attribut et qu'il y a au moins un héros.
- `bol-scene-lecture` : onglets dans l'ordre « À lire aux joueurs », « Jets » (si `scene.jets?.length`), « Mise en scène » (si `scene.jeu`), « Secret du MJ » ; nouvel input `heros = input<readonly TapisCard[]>([])`, nouvel output `jetLance = output<JetLance>()`. En grand (dialogue de lecture), sans héros : la liste sans « Lancer pour ».
- `bol-theatre` : passe `heros` (ses cartes de héros, `kind === 'hero'`) au carnet et relaie `jetLance` ; la page le branche sur `expanded.lancerJet($event.hero, $event.jet)` (Task 6).

- [ ] **Step 1: Tests `scene-jets.spec.ts`** — badges « Vigueur », « Ardue −1 » ; « Sans jet » et pas de « Lancer pour » pour un jet sans attribut ; pas de « Lancer pour » sans héros ; ouvrir « Lancer pour », choisir « Grimar » émet `{jet, hero: GRIMAR}`.
- [ ] **Step 2: Test lecture** (`scene-lecture.spec.ts`) — onglets « À lire aux joueurs », « Jets », « Mise en scène » pour une scène avec jets et `jeu` ; pas d'onglet « Jets » si `jets` est null.
- [ ] **Step 3: Rouges ; implémenter ; verts ; build et lint.**

### Task 6: Lancer un jet pour un héros

**Files:**
- Modify: `front/src/app/bol/session/play/table/expanded-card.store.ts`, `front/src/app/bol/session/models/expanded-card-dialog.model.ts`, `front/src/app/bol/session/play/tapis/expanded-card-dialog.ts`, `expanded-card.{ts,html}`, `front/src/app/bol/session/play/session-play-page.html`
- Test: `front/src/app/bol/session/play/table/expanded-card.store.spec.ts` (le créer s'il n'existe pas)

**Interfaces:**
- Consumes: `ActionRollPreset` (Task 4), `actionDifficultyDu` (Task 3), `JetLance` (Task 5).
- Produces: `ExpandedCardStore.lancerJet(card: TapisCard, jet: BolSceneJet): void` : pose `jetPreset` (`{attributs: jet.attributs, difficulty: actionDifficultyDu(jet.difficulte)}`), puis ouvre la carte du héros comme `onCardToggled`, **même si sa carte est déjà ouverte** (le préréglage change alors dans la carte ouverte). `onCardToggled` et `foldCard` remettent `jetPreset` à `null`. `ExpandedCardDialogData.jetPreset: Signal<ActionRollPreset | null>`, passé par la carte au `<bol-action-roll-panel [preset]>`.

- [ ] **Step 1: Tests** — `lancerJet ouvre la carte du héros avec le préréglage` ; `lancerJet sur la carte déjà ouverte change le préréglage` ; `un clic ordinaire sur une carte efface le préréglage`.
- [ ] **Step 2: Rouges ; implémenter ; verts ; suite front complète, build, lint ; capture 1440 × 704 de la table avec une scène à trois jets (onglet « Jets », menu « Lancer pour », panneau ouvert sur Vigueur Ardue).**

### Task 7: La reprise de la Perle du Beshaar

**Files:**
- Create: `doc/bol/scenarios/outils/extraire-jets.py` (lit les `app/*.json` d'une saga, propose `jets`, écrit un rapport `doc/bol/scenarios/<saga>/app/jets-a-relire.md`)
- Modify: `doc/bol/scenarios/la-perle-du-beshaar/app/ch1.json` … `ch5.json` (`jets` ajoutés, phrases devenues jets retirées de `jeu`)

**Interfaces:**
- Consumes: le format d'import (Task 2).
- Le script : une phrase de `jeu` qui cite Vigueur, Agilité, Esprit, Aura ou « réaction » (→ `esprit`) devient un jet proposé ; difficulté normalisée (« Ardu » → `ardue`, « Moyen » → `moyenne`, sans difficulté → `moyenne`, « Difficile (-4) » signalé) ; ignore les phrases de combat (Mêlée, Tir, Défense, « Att + n ») ; signale deux jets enchaînés. Il n'écrit pas les fichiers JSON : il produit le rapport, la relecture décide.

- [ ] **Step 1: Lancer le script sur la Perle ; relire le rapport ; ajouter les `jets` aux cinq fichiers et retirer de `jeu` les phrases reprises (la scène « Les gardiens s'éveillent » doit donner les six lignes de l'analyse, algues en Esprit Ardue).**
- [ ] **Step 2: `bol:import-scenario … --dry-run` des cinq chapitres, dans l'ordre (copie dans le conteneur, voir `CLAUDE.md`) : aucune erreur.**
- [ ] **Step 3: Demander à Lionel l'accord pour l'import réel (il écrase les scènes de la Perle modifiées dans l'app), puis importer `ch1` à `ch5` sur bogomit@gmail.com.**

### Task 8: Documentation

**Files:**
- Modify: `CLAUDE.md` (« Préparer la scène » : l'onglet « Jets » ; le carnet du mode libre : « Jets » et « Mise en scène », « Lancer pour » et le panneau prérempli), `doc/bol/plans/2026-11-13-jets-de-scene-analyse.md` (statut : réalisé pour la Perle), `doc/bol/plans/2026-11-09-reste-a-faire.md` (reprise du Dieu voilé et des Chroniques)

- [ ] **Step 1: Mettre à jour les trois documents ; `npm run build`, `npm run lint`, `npm test` et la suite back verts.**
