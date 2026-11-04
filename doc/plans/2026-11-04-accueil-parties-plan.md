# L'accueil par parties — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** remplacer l'accueil « une table ouverte + scénarios du compte » par « dernière partie jouée + une carte par partie », sans
notion de clôture, avec une progression par partie.

**Architecture:** le back calcule, pour chaque table, ses chapitres joués et ses héros, et expose `parties` + `derniere` sur
`GET /api/bol/accueil` ; `jouee_le` ordonne les parties. Le front transforme ces données en cartes (`accueil.util.ts`) et l'accueil
les affiche ; « Clore » et la règle « une seule table ouverte » disparaissent des deux côtés.

**Tech Stack:** Laravel 13 (PHPUnit, SQLite en mémoire), Angular 22 (signals, Signal Forms, Material, Vitest).

**Spec:** `doc/plans/2026-11-04-accueil-parties-design.md`

## Global Constraints

- Mots visibles : « Partie », « Nouvelle partie », « Dernière partie jouée », « Reprendre », « Partie improvisée », « Table sans nom »,
  « Scénario terminé », « Supprimer la partie », « Changer de chapitre », « Mes parties » ; jamais « session » ni « clore ».
- Conventions `CLAUDE.md` (OnPush, `input()`, contrôle de flux natif, modèles dans `models/`, une seule classe custom par élément, formes
  de boutons, AXE/WCAG AA).
- Lionel commite lui-même : pas de `git commit` dans ce plan ; chaque tâche se termine par ses tests verts.
- Back : tests dans le conteneur (`docker cp backend/tests/. diceway:/var/www/html/tests/` puis
  `docker exec diceway php artisan test --filter=…`). Front : `npx ng test --watch=false --include='<chemin>/*.spec.ts'`.

## Review Focus

1. Une ancienne table `terminee` ou sans nom : elle doit apparaître comme une partie normale (« Table sans nom »), reprenable. → Tâche 1 et 4.
2. Deux tables sur le même scénario : la progression de l'une ne coche rien chez l'autre. → Tâche 4.
3. Un chapitre sans scène et jamais quitté : reste « en cours » / « à jouer », pas « joué ». → Tâche 4.
4. Une scène d'un autre scénario chargée à la table : la partie ne change pas de scénario. → Tâche 2.
5. Aucune partie (compte neuf) : l'accueil propose « Nouvelle partie » sans erreur. → Tâche 6.

---

### Task 1: Données — `jouee_le`, plus de `terminee`

**Files:**
- Create: `backend/database/migrations/2026_11_04_100000_parties_on_bol_fight_session.php` (l'ancienne migration, déjà poussée, ne change pas)
- Modify: `backend/app/Models/Bol/BolFightSession.php`, `backend/app/Http/Services/Bol/BolFightSessionService.php`,
  `backend/app/Http/Controllers/Bol/BolFightSessionController.php`, `backend/routes/api.php`
- Test: `backend/tests/Feature/BolPartieTest.php` (nouveau)

**Interfaces:**
- Produces: colonne `jouee_le` (timestamp nullable, cast `datetime`), `chapitres_quittes` (json) ; `statut` ∈ {`libre`, `combat`} ;
  `PATCH /api/bol/fight-session/{id}/jouer` → session complète (404 si pas du compte) ; `BolFightSessionService::jouer(string $id, string $userId): ?BolFightSession`.
- Supprime : `closeSession`, `reopenSession`, routes `…/close` et `…/reopen`.

- [ ] Migration : ajoute `jouee_le` (timestamp nullable) ; `jouee_le` = `updated_at` pour les tables existantes ; `statut` `terminee` →
  `libre`, `chapitres_quittes` à null sur ces tables. `down` retire `jouee_le`.
- [ ] `createSession` pose `jouee_le = now()`. `jouer()` pose `jouee_le = now()` et ne touche à aucune autre table.
- [ ] `quitterLeCombat` reste (utilisé par la fin de combat) ; supprimer son appel avec `terminee`.
- [ ] Tests `BolPartieTest` : `test_creating_a_table_marks_it_played_now`, `test_jouer_marks_the_table_played_and_leaves_the_others`
  (deux tables `libre`, `jouer` sur l'une : l'autre garde statut et `jouee_le`), `test_jouer_answers_404_for_another_account`,
  `test_close_and_reopen_routes_are_gone` (404 / 405).
- [ ] Retirer de `BolAccueilTest` les tests de réouverture ajoutés le 2026-11-04 (ils passent à la Tâche 4).
- [ ] `php artisan test` vert.

### Task 2: Une partie reste sur son scénario

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolFightSessionService.php` (`changerChapitre`), `backend/app/Http/Services/Bol/BolSceneService.php` (`scenarioDeLaScene`), contrôleur (`changerChapitre` → 422)
- Test: `backend/tests/Feature/BolSessionScenarioTest.php`

**Interfaces:**
- Produces: `BolFightSessionService::memeScenario(?string $chapitreA, ?string $chapitreB): bool` (privé) — vrai si les deux chapitres ont
  la même `saga_id` non nulle, ou sont le même chapitre.
- `changerChapitre` renvoie `false` (le contrôleur répond 422, message « Ce chapitre n'est pas du scénario de la partie. ») quand la
  partie a un chapitre et que le nouveau n'est pas du même scénario, ou quand le nouveau est `null` (une partie liée ne redevient pas
  improvisée).

- [ ] `scenarioDeLaScene(BolScene $scene, BolFightSession $session)` : renvoie `['scenario_id' => …]` seulement si la table n'a pas de
  chapitre, ou si celui de la scène est du même scénario.
- [ ] Tests : `test_moves_the_table_within_its_scenario` (ch1 → ch2 d'une même saga : OK, `chapitres_quittes` = [ch1]),
  `test_refuses_a_chapter_of_another_scenario` (422, chapitre inchangé), `test_refuses_to_improvise_a_bound_partie` (null → 422),
  `test_an_improvised_partie_takes_a_scenario_once`, `test_loading_a_scene_of_another_scenario_keeps_the_partie`
  (chapitre inchangé, `scene_id` = la scène), adapter `test_loading_a_scene_sets_its_scenario` (même saga).
- [ ] `php artisan test` vert.

### Task 4: API de l'accueil par parties

**Files:**
- Modify: `backend/app/Http/Services/Bol/BolAccueilService.php`
- Test: `backend/tests/Feature/BolAccueilTest.php`

**Interfaces:**
- Produces (JSON) : `derniere: string|null`, `parties: [{id, titre, statut, jouee_le (ISO 8601), scenario_id, scene_id, scenes:[{id,titre}],
  scenes_jouees:[id], chapitres_joues:[id], heros:[{id,nom,avatar}]}]` triées par `jouee_le` desc (puis `created_at` desc), `scenarios`
  et `comptes` inchangés. Disparaissent : `table`, `scenarios_joues`, `scenario_recent_id`, `compagnie`.

- [ ] `chapitresJoues(BolFightSession $t, Collection $scenesParChapitre): array` : `chapitres_quittes` de **cette** table ∪ chapitres
  (au moins une scène) dont toutes les scènes sont dans ses `scenes_jouees` ; filtrés aux chapitres du compte.
- [ ] `scenes` / `scenes_jouees` : comme le bandeau actuel, pour **chaque** partie (scènes du chapitre courant).
- [ ] Tests : `test_lists_every_partie_most_recently_played_first`, `test_derniere_is_the_most_recently_played`,
  `test_played_chapters_are_per_partie` (deux tables sur une saga : A a quitté ch1, B rien → A [ch1], B []),
  `test_a_chapter_with_all_its_scenes_played_on_this_table_is_played`, `test_a_chapter_without_scene_never_left_is_not_played`,
  `test_partie_heroes_are_the_accounts_own_on_the_heroes_side`, `test_an_old_table_without_name_is_listed`, `test_hides_other_accounts`.
- [ ] `php artisan test` vert.

### Task 5: Front — modèle et calcul des cartes

**Files:**
- Modify: `front/src/app/bol/models/bol-accueil.model.ts`, `front/src/app/bol/session/models/accueil.model.ts`,
  `front/src/app/bol/session/accueil/accueil.util.ts`, `front/src/app/bol/models/bol-fight-session.model.ts` (statut sans `terminee`)
- Test: `front/src/app/bol/session/accueil/accueil.util.spec.ts`

**Interfaces:**
- Produces : `BolAccueilPartie` (champs de la Tâche 4), `BolAccueilModel {derniere, parties, scenarios, comptes}` ;
  `ChapitreEtat = 'joue' | 'en-cours' | 'a-jouer'` ;
  `AccueilPartie {id, nom, scenario: string, teinte: number, reperes: AccueilRepere[], heros: {id,nom,portrait,initiale}[], reprendre:
  string, termine: boolean, derniere: boolean, scenarioId: string|null, sagaId: string|null}` ;
  `partiesDeLAccueil(data: BolAccueilModel): AccueilPartie[]` ; `bandeauDePartie(partie: BolAccueilPartie, scenarios): AccueilBandeau`
  (l'actuel `tableOuverte` renommé, titre « Table sans nom » sans nom) ; `chapitresDuScenario(scenarioId, scenarios): BolAccueilScenario[]`
  (ordre : intro, numéros, sans numéro alpha) ; `teinteDeScenario(sagaTitre: string|null, scenarios): number` (ordre alphabétique des
  sagas, 1 à 4 ; 0 sans saga).
- Supprime : `accueilSagas`, `sagaResumes`, `suiteDeSaga`, `AccueilSaga*`, `teinteDeSaga`, `tableTitre`.

- [ ] Tests : `nomme la partie par sa compagnie, « Table sans nom » sinon` ; `place le scénario : saga, one shot (nom du chapitre),
  « Partie improvisée »` ; `marque les chapitres de la saga pour cette partie` (joué / en cours / à jouer) ; `pas de pastilles pour un one
  shot ni une improvisée` ; `« Reprendre » nomme le chapitre en cours, « Scénario terminé » quand tout est joué` ; `la première est la
  dernière jouée` ; `deux parties sur la même saga gardent la même teinte`.
- [ ] Tests ciblés verts.

### Task 6: Front — l'accueil

**Files:**
- Modify: `front/src/app/bol/session/accueil/accueil-page.{ts,html,scss,spec.ts}`

**Interfaces:**
- Consumes : Tâche 5 ; `BolFightSessionService.changerChapitre(id, scenarioId)`, `.delete(id)` ; `confirmDialog`.

- [ ] Bandeau « Dernière partie jouée » (`bandeauDePartie` de `derniere`) ; sans partie : « Aucune partie » + « Nouvelle partie ». Plus de
  « Clore », plus de modèle `compagnieTpl` hors bandeau (les héros du bandeau sont ceux de la partie).
- [ ] Rangée « Parties » (carrousel existant) : cartes option A, légende « joué · en cours · à jouer », carte « + Nouvelle partie » en
  dernier ; lien de carte vers `/session/:id/play` ; menu (`mat-menu`, bouton icône `more_vert`, `aria-label` « Actions de <nom> ») :
  « Changer de chapitre » (sous-menu des chapitres du scénario ; partie improvisée : « Choisir un scénario » → scénarios → chapitres),
  « Supprimer la partie » (confirmation, puis relire l'accueil).
- [ ] Bibliothèque : tuile « Parties » (au lieu de « Tables »).
- [ ] Spec : `montre la dernière partie jouée en tête` ; `une carte par partie, puis « Nouvelle partie »` ; `changer de chapitre appelle
  le service et relit l'accueil` ; `supprimer demande confirmation puis relit` ; `sans partie, propose « Nouvelle partie »`.
- [ ] Tests ciblés verts.

### Task 7: Front — « Nouvelle partie »

**Files:**
- Modify: `front/src/app/bol/session/new/open-table-dialog/open-table-dialog.{ts,html,scss,spec.ts}`,
  `front/src/app/bol/session/models/open-table.model.ts`, `front/src/app/bol/session/accueil/accueil-page.ts` (`ouvrirTable`)

**Interfaces:**
- `OpenTableData {scenarioId: string | null; accueil?: BolAccueilModel | null}` (plus de `reprise`).

- [ ] Retirer : mode reprise, bandeau « déjà ouverte », étape de confirmation, `fightSessionService.close`, `effetsCloture`.
- [ ] Titres : surtitre « Nouvelle partie », titre « Qui est à table ? » ; bouton « Créer la partie ».
- [ ] Section « Le scénario » : menu des scénarios (sagas puis one shots) → choisit le **premier** chapitre (`chapitresDuScenario`) ;
  « Chapitre de départ » : menu des chapitres de ce scénario ; « Improviser » : sans scénario.
- [ ] Spec : retirer les tests reprise / clôture ; `choisir un scénario part de son premier chapitre` ; `le chapitre de départ se
  change parmi ceux du scénario` ; `crée la partie avec nom, chapitre, héros` ; garder ceux du nom.
- [ ] Tests ciblés verts.

### Task 8: Front — la table et « Mes parties »

**Files:**
- Modify: `front/src/app/bol/services/bol-fight-session.service.ts` (`jouer`, retirer `close`/`reopen`), `front/src/app/bol/session/play/table/table.store.ts` (appelle `jouer` au chargement),
  `front/src/app/bol/shared/account-menu/account-menu.ts`, `front/src/app/bol/session/play/session-header/session-header.{ts,html}`,
  `front/src/app/bol/session/library/session-library-page.{ts,html,spec.ts}`
- Delete: `front/src/app/bol/shared/close-table/`, `front/src/app/bol/shared/models/close-table.model.ts`

- [ ] `TableStore.loadSession(id)` appelle `jouer(id)` une fois par entrée à la table (pas à `reloadSession`).
- [ ] Menu compte : plus d'entrée « Clore la table » ; `session-header` ne passe plus `table`.
- [ ] « Mes parties » : titre, description, « Reprendre » mène à la table, plus d'étiquette « Close » ni de confirmation.
- [ ] Spec mise à jour ; `npm test` complet vert, `npm run build`, `npm run lint`.

### Task 9: Docs et vérification

- [ ] `CLAUDE.md` : vocabulaire (Partie), section « Chapitres joués » réécrite (par partie, plus de clôture), étape après pull (migrate).
- [ ] Back et front complets verts ; migration appliquée sur ce poste ; capture de l'accueil avec Playwright (port 4400, compte de test).
