# Généralisation de la page de combat en page de session

Date : 2026-08-28
Statut : validé, en attente de plan d'implémentation

## Contexte

Diceway a une page de combat (`combat-play-page`) avec une grille de jetons, un
ruban d'initiative réordonnable, et un menu d'attaque par jeton, alimentée par
le modèle `BolFightSession` (héros/créatures/démons/pnjs avec camp, vitalité,
etc.). Cette interface fonctionne bien mais n'existe qu'au sens strict du
combat : elle se crée via `combat/new` (sélection des héros + adversaires +
camps) et ne sert qu'à cet usage.

## Objectif

Généraliser cette page en **page de session** : le MJ ouvre une session en
début de soirée avec les héros présents (mode `libre`, pas d'adversaires), et
peut à tout moment démarrer un combat depuis un menu (la page passe en mode
`combat`, avec le ruban d'initiative et le menu d'attaque habituels). En mode
`libre`, cliquer sur l'avatar d'un héros ouvre un menu d'action générique
(jet de compétence, ajustement rapide de stats, accès à la fiche) plutôt que
le menu d'attaque.

## Décisions de conception

- **Un seul modèle, pas de duplication** : `BolFightSession` est généralisé
  (nouveau sens du champ `statut`) plutôt que remplacé par un nouveau concept
  de session qui l'engloberait. Les tables/modèles `bol_fight_session*` et
  `BolFightSession*` ne sont **pas renommés** — le renommage mécanique
  n'apporte rien de fonctionnel et risquerait de casser le combat existant.
  Seul le vocabulaire exposé (routes front, libellés UI) devient "session".
- **Participants en mode libre** : héros uniquement. PNJ/créatures/démons
  n'apparaissent qu'au moment où un combat démarre (comme aujourd'hui).
- **Cycle de vie** : une session par soirée, créée à la volée depuis le
  dashboard, reprenable tant qu'elle n'est pas terminée. Terminer un combat
  ramène la session en mode `libre` (les héros restent, les adversaires sont
  retirés) — ça ne clôt pas la session.
- **Héroïsme vs vitalité** : la vitalité reste un compteur *scoped* à la
  session (pivot `BolFightSessionHeros.vitalite_courante`, comme aujourd'hui).
  L'héroïsme est une ressource du héros qui doit rester correcte même hors
  session — son ajustement écrit directement sur `BolHeros.ressources.heroisme`.

## Backend

### Machine à états de `BolFightSession.statut`

Le champ `statut` (actuellement `'preparation'`, valeur jamais exploitée)
devient : `'libre' | 'combat' | 'terminee'`.

- `libre` : seuls des `BolFightSessionHeros` existent ; `camp` non pertinent.
- `combat` : comportement actuel inchangé (camps, initiative, adversaires,
  attaques).
- `terminee` : hors scope de cette itération (pas de flux de clôture demandé
  pour l'instant — le champ existe pour une évolution future).

Transition `combat → libre` (fin de combat) : suppression des pivots
`BolFightSessionCreature`/`BolFightSessionDemon`/`BolFightSessionPnj` de la
session ; les `BolFightSessionHeros` restent.

### Endpoints

- `POST /bol/fight-session/create` : accepte déjà un payload avec `heros[]`
  sans adversaires. Si `pnjs`/`creatures`/`demons` sont vides, forcer
  `statut = 'libre'` (au lieu du choix de camps actuel dans
  `combat-select-page`).
- `PATCH /bol/fight-session/{id}/start-combat` (nouveau) : bascule
  `libre → combat`, réutilise la logique d'ajout de combattants existante
  (`addCombatant`) pour poser les adversaires initiaux et le flux de jet
  d'initiative.
- `PATCH /bol/fight-session/{id}/end-combat` (nouveau) : bascule
  `combat → libre`, supprime les pivots non-héros.
- `PATCH /bol/heros/{id}/heroisme` (nouveau) : ajuste
  `BolHeros.ressources.heroisme` (delta ou valeur absolue) — endpoint léger
  dédié plutôt que de passer par `heros/update/advanced` qui exige tout le
  payload de la fiche.

### Migration de données

Les fight-sessions déjà en base ont `statut = 'preparation'`. Une migration de
données les bascule : `'combat'` si elles ont des adversaires (au moins un
pivot creature/demon/pnj), `'libre'` sinon.

## Frontend

### Routes (renommage d'usage, pas de code dupliqué)

| Actuel | Nouveau |
|---|---|
| `combat/new` | `session/new` |
| `combat/:id/play` | `session/:id/play` |
| `library/combats` | `library/sessions` |

Les fichiers/dossiers `bol/combat/*` sont déplacés vers `bol/session/*`. Les
utilitaires purs (`combat-play.util.ts`, `combat-attack.util.ts`,
`initiative.util.ts`, `combat-statblock.util.ts`) sont déplacés tels quels,
sans réécriture.

### `session-new-page` (ex `combat-select-page`)

Simplifiée pour le cas courant : sélection des héros présents, sans camp ni
adversaires. Le flux "ajouter des adversaires + définir les camps" actuel est
déplacé dans le dialogue "Démarrer un combat" (réutilise
`combatant-picker-dialog` tel quel).

### `session-play-page` (ex `combat-play-page`)

- Header : icône de menu (`mat-menu`, pattern `add-menu`) avec :
  - *Démarrer un combat* (si `statut === 'libre'`) → ouvre
    `combatant-picker-dialog`, appelle `start-combat`.
  - *Terminer le combat* (si `statut === 'combat'`) → confirme puis appelle
    `end-combat`.
  - *Ajouter un héros à la session* (les deux modes).
- Ruban d'initiative (`cp-rail`) et drag-drop d'ordre : affichés uniquement en
  mode `combat`. En mode `libre`, seuls les jetons héros restent sur la carte,
  sans camps/zones adverses.
- Clic sur un jeton :
  - Mode `combat` : menu actuel (`bol-attack-menu`), inchangé.
  - Mode `libre` : nouveau `bol-hero-action-menu` (voir plus bas).
  - Double-clic : ouverture directe du statblock, inchangée dans les deux modes.

### `bol-hero-action-menu` (nouveau, mode libre uniquement)

Popover ancré sur le jeton, même pattern que `attack-menu`, trois entrées :

1. **Jet de compétence** → `SkillCheckDialogComponent` (nouveau), calqué sur
   `initiative-roll-dialog` (dés 3D via `DiceBoxHostComponent`, mêmes paliers
   de résultat échec/réussite/héroïque/légendaire) :
   - Attribut (Agilité / Vigueur / Esprit), pré-rempli avec les valeurs du héros.
   - Difficulté sélectionnable (6 facile / 9 normal / 12 difficile) +
     modificateur libre.
   - Jet ponctuel, non persisté (comme le jet d'initiative).
2. **Ajuster les stats** → panneau inline avec `dw-value-stepper` :
   - Vitalité courante → `PATCH .../combatant/heros/{pivotId}/damage`
     (endpoint `applyDamage` existant, réutilisé tel quel).
   - Héroïsme → nouvel endpoint `PATCH /bol/heros/{id}/heroisme`.
3. **Voir la fiche** → réutilise `openStatblockDialog` (même fonction que le
   double-clic).

### Dashboard (`workspace-quick-actions`)

Nouvelle carte :
- Si une session `libre`/`combat` existe pour l'utilisateur → "Reprendre la
  session" → `session/:id/play`.
- Sinon → "Nouvelle session" → `session/new`.

## Hors scope (itérations futures)

- PNJ/créatures présents en mode libre (roleplay/dialogue).
- Historique/journal des jets de compétence.
- Session liée à un scénario (`BolScenario`).
- Flux de clôture explicite de session (`statut = 'terminee'`).

## Tests

- Backend (PHPUnit) : transitions `start-combat`/`end-combat` (suppression
  des pivots non-héros à la fin), endpoint héroïsme, migration de données des
  statuts existants.
- Frontend (Vitest) : `session-play-page` dans les deux modes (rail
  masqué/affiché, menu contextuel correct), `SkillCheckDialogComponent`
  (seuils/résultats).
- Vérification manuelle (skill `run`) : créer une session libre → jets de
  compétence → ajuster vitalité/héroïsme → démarrer un combat → terminer le
  combat → vérifier le retour en mode libre avec les héros intacts.

## Risques

- Renommage des routes front (`combat/*` → `session/*`) : pas de
  redirection nécessaire (app en développement actif, pas d'utilisateurs
  externes) mais vérifier qu'aucun lien codé en dur vers `/combat/...` ne
  subsiste ailleurs dans l'app.
