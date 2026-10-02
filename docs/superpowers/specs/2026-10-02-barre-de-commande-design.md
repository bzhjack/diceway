# Barre de commande — accélérateur clavier de la table

Date : 2026-10-02
Statut : design validé en conversation, en attente de relecture de cette spec
Chantiers précédents : `2026-10-02-poste-de-table-design.md`, `2026-10-02-scenes-design.md`

## Contexte

Le poste de table donne trois moyens d'agir : la réserve (poser des
personnages, gérer les scènes), la carte (sélectionner, déplacer) et la fiche
du jeton. Chaque geste demande d'aller dans le bon panneau, le bon onglet, puis
de chercher. Pour un MJ qui sait ce qu'il veut, c'est plus long que de le taper.

## Objectif

Une entrée unique, ouverte au clavier, pour trouver un personnage ou une scène
et agir dessus en quelques touches. La barre de commande est un raccourci : tout
ce qu'elle fait reste faisable à la souris par les panneaux existants. Elle
n'ajoute aucune fonction.

## Hors périmètre

- Lancer un jet en langage naturel (« jet Kalena agilité ardue »). Sélectionner
  un héros ouvre déjà sa fiche avec le jet.
- Les attaques et le ciblage en combat.
- La barre de commande en dehors de la table (seuil, bibliothèques,
  formulaires).
- Tout changement backend.

## Décisions de conception

- **La barre ne parle à aucun service.** Elle affiche des résultats et renvoie
  à la page la commande choisie ; la page l'exécute avec le code existant. La
  barre se teste donc sans réseau.
- **Recherche, classement et lecture de la quantité sont des fonctions pures.**
- **Un seul chemin de code par action.** Charger une scène et enregistrer la
  table sont extraits de `bol-scene-list` dans un service partagé, utilisé par
  l'onglet Scènes et par la barre.
- **La barre se ferme après chaque exécution.**

## Ouverture

- Touches `/` et `Ctrl+K` (`Cmd+K` sur macOS) sur la page de la table.
- `/` est ignorée quand le focus est dans un champ de saisie (`input`,
  `textarea`, `select`, élément `contenteditable`) ou qu'un dialogue est déjà
  ouvert. `Ctrl+K` fonctionne aussi depuis un champ, sauf si un dialogue est
  ouvert.
- Un bouton icône « loupe » dans la barre du haut, à gauche du bouton de
  combat, libellé « Rechercher ou lancer une action ( / ) ».
- La barre est un `MatDialog` placé en haut de l'écran (largeur 560 px au plus),
  avec piège de focus et restauration du focus à la fermeture.

## Résultats

La barre affiche au plus 12 résultats, répartis en quatre groupes, dans cet
ordre. Un groupe sans résultat n'est pas affiché.

| Groupe | Contenu | Entrée | Modes |
|---|---|---|---|
| Sur la table | Jetons dont le nom correspond | Sélectionne le jeton (ouvre sa fiche) | libre |
| Poser | Fiches de la bibliothèque : héros, PNJ, créatures, démons. Un héros ou un PNJ déjà à table n'y figure pas | Pose le personnage | libre |
| Scènes | Scènes de l'utilisateur, avec le titre de leur scénario | Charge la scène | libre |
| Actions | Liste fixe, voir ci-dessous | Exécute l'action | selon l'action |

Chaque résultat montre une pastille de type (couleurs existantes), son nom, et
à droite une précision : type et rang, scénario, ou l'effet d'Entrée.

### Actions

| Action | Modes | Effet |
|---|---|---|
| Démarrer un combat | libre | Ouvre le dialogue de démarrage existant |
| Terminer le combat | combat | Ouvre la confirmation existante |
| Enregistrer la table comme scène | libre | Demande un titre ; la scène est rangée dans le scénario de la scène courante, sinon dans « Sans scénario » |
| Replier la réserve / Déplier la réserve | libre | Bascule l'état, mémorisé comme aujourd'hui |
| Créer un héros / un PNJ / une créature / un démon | les deux | Ouvre le formulaire, retour à la table après enregistrement |
| Changer de session | les deux | `/library/sessions` |
| Nouvelle session | les deux | `/session/new` |
| Intendance | les deux | `/intendance` |

### Recherche et classement

- Sans texte saisi : seules les actions sont affichées.
- Avec du texte : comparaison sans accents ni majuscules, sur le nom (et sur le
  libellé pour les actions).
- Dans chaque groupe, les noms qui **commencent** par le texte passent avant
  ceux qui le **contiennent** seulement ; à égalité, ordre alphabétique.
- Limite par groupe : 5 pour « Sur la table », « Poser » et « Scènes », puis les
  actions jusqu'à atteindre 12 résultats au total.
- Aucun résultat : « Rien ne correspond à “…”. »

### Quantité

Un nombre entier en tête de saisie, suivi d'un espace, fixe la quantité à
poser : « 3 loup » propose de poser trois loups.

- Valeurs de 1 à 20 ; au-delà, la quantité est ramenée à 20.
- La quantité ne s'applique qu'aux créatures et aux démons : avec une quantité
  supérieure à 1, les héros et PNJ sont retirés du groupe « Poser », et les
  groupes « Sur la table », « Scènes » et « Actions » ne sont pas affichés.
- Le résultat affiche « poser ×3 ». Un seul appel d'ajout est fait, avec
  `qty: 3` : le lot est numéroté #1 à #3 sur la carte, comme tout lot.
- Un nombre seul (« 3 ») sans texte ne donne aucun résultat.

## Clavier

- Flèches haut et bas : résultat précédent ou suivant, avec retour au début
  après le dernier. Le premier résultat est actif à chaque nouvelle saisie.
- Entrée : exécute le résultat actif. Sans résultat, ne fait rien.
- Échap : ferme sans rien faire.
- Clic sur un résultat : l'exécute.

## Accessibilité

- Le champ a `role="combobox"`, `aria-expanded`, `aria-controls` vers la liste,
  et `aria-activedescendant` vers le résultat actif.
- La liste a `role="listbox"` ; chaque groupe est un `role="group"` avec son
  libellé ; chaque résultat est un `role="option"` avec `aria-selected`.
- Le résultat actif reste visible (défilement automatique de la liste).
- Le nombre de résultats est annoncé dans une région `aria-live="polite"`.
- Contraste WCAG AA sur les tokens existants ; AXE sans erreur, barre ouverte.

## Architecture

### Fichiers

- `session/play/command-palette/command-palette.util.ts` — fonctions pures :
  - `parseQuery(raw)` → `{quantity, term}` ;
  - `buildResults(input)` → groupes de résultats, à partir du texte, du mode,
    des jetons, du catalogue, des ids déjà à table, des scènes et de l'état de
    la réserve ;
  - `nextIndex(current, count, delta)` pour la navigation au clavier.
- `session/play/command-palette/command-palette.ts` — composant
  `bol-command-palette`, ouvert en `MatDialog`. Reçoit ses données par
  `MAT_DIALOG_DATA`, se ferme avec la commande choisie ou `undefined`.
- `session/play/command-palette/shortcut.util.ts` — fonction pure
  `isPaletteShortcut(event, target)` : dit si un événement clavier doit ouvrir
  la barre.
- `session/scene-actions.service.ts` — service `SceneActionsService`
  (`providedIn: 'root'`) : `load(sessionId, scene, nonHeroCount)` et
  `saveTable(sessionId, scenarioId)`. Reprend à l'identique la logique
  aujourd'hui dans `bol-scene-list` (dialogue « Remplacer ou Ajouter »,
  dialogue de titre, messages). `bol-scene-list` l'utilise à la place de son
  code actuel.

### Commande renvoyée à la page

Union discriminée `PaletteCommand` :

- `{type: 'select', key}` — clé du jeton ;
- `{type: 'place', kind, sourceId, nom, qty}` ;
- `{type: 'loadScene', scene}` ;
- `{type: 'action', id}` — `id` parmi `startCombat`, `endCombat`, `saveScene`,
  `toggleReserve`, `createHero`, `createPnj`, `createCreature`, `createDemon`,
  `sessions`, `newSession`, `intendance`.

### Page

`session-play-page` :

- écoute `keydown` au niveau du document (objet `host`) et ouvre la barre quand
  `isPaletteShortcut` le dit et qu'aucun dialogue n'est ouvert ;
- charge les scènes (`BolSceneService.scenes()`) à l'ouverture de la barre, et
  le catalogue s'il n'est pas déjà chargé ; la barre s'ouvre tout de suite et
  ses résultats se complètent à l'arrivée des données ;
- exécute la commande : sélection par `onTokenSelected`, pose par
  `BolFightSessionService.addCombatant` (avec `qty`), scène et enregistrement
  par `SceneActionsService`, actions par les méthodes existantes et le routeur.

Une pose depuis la barre recharge la session, comme une pose depuis la réserve.
Une erreur (doublon, réseau) s'affiche en snackbar avec le message de l'API.

## Tests

Le dépôt ne teste que des fonctions pures ; ce chantier suit cette pratique.

- **Vitest** :
  - `parseQuery` : quantité absente, présente, hors bornes, nombre seul, nombre
    collé au texte (« 3loups » n'est pas une quantité) ;
  - `buildResults` : groupes et ordre, classement « commence par » avant
    « contient », accents, limites par groupe et total, héros et PNJ déjà à
    table exclus, filtrage par mode, effet de la quantité, saisie vide ;
  - `nextIndex` : bouclage, liste vide ;
  - `isPaletteShortcut` : `/` hors champ, `/` dans un champ, `Ctrl+K`, `Cmd+K`,
    autres touches.
- **Navigateur** (skill `run`) : ouvrir par `/`, poser un PNJ au clavier, poser
  un lot de trois créatures, sélectionner un jeton, charger une scène, replier
  la réserve, `/` tapée dans la recherche de la réserve n'ouvre pas la barre,
  barre en mode combat.
- `npm run build`.
