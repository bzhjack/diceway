# Le Tapis, hors combat — des cartes à la place des jetons

Date : 2026-10-05
Statut : design validé en conversation, en attente de relecture de cette spec
Dossier de réflexion (trois pistes maquettées) : https://claude.ai/artifact/KSvCVgr2U16WdLNfoU4few
Chantiers précédents : poste de table, scènes, barre de commande (specs du 2026-10-02)

## Contexte

Retour d'un MJ après essai du poste de table :

- un jeton ne montre qu'un nom tronqué et une barre de vie ; il faut cliquer pour
  connaître la défense ou les dégâts d'un personnage ;
- Barbarians of Lemuria se joue sans plan ; placer, écarter et enregistrer des
  positions de pions est du travail sans utilité pour la partie.

La piste retenue est « Le Tapis » : deux rangs de cartes face à face, rangées
automatiquement, qui montrent leurs chiffres sur leur face.

## Découpage

Deux chantiers, chacun avec sa spec :

1. **Le Tapis hors combat** (cette spec) : il remplace le battlefield en mode
   `libre`.
2. **Le combat sur le Tapis** : ordre de jeu, désignation de la cible,
   résolution. Il remplacera le battlefield en mode `combat`.

## Objectif

En mode libre, le MJ voit tous les personnages de la scène sous forme de cartes
lisibles d'un coup d'œil, sans rien placer à la main, et agit sur un personnage
en dépliant sa carte.

## Hors périmètre

- **Le mode combat.** Tant que le chantier 2 n'est pas livré, démarrer un combat
  affiche l'écran actuel (battlefield à jetons, ruban d'initiative, menu
  d'attaque), inchangé. Le code du battlefield reste donc en place.
- Le glisser-déposer d'une carte de la réserve vers le tapis : on pose par clic.
- Le jet d'action pour les PNJ, créatures et démons.
- L'illustration des cartes au-delà de l'avatar existant.
- Les positions de jetons : elles continuent d'être enregistrées et restituées
  par les scènes, parce que le mode combat s'en sert encore. Elles seront
  retirées au chantier 2.

## Décisions de conception

- **Aucun placement à la main.** Les cartes se rangent seules, par camp puis par
  ordre d'arrivée.
- **Deux rangs dès le mode libre.** En bas « Héros et alliés » (camp `heros`),
  en haut « Présents dans la scène » (camp `adversaires`). Le camp existe déjà
  sur chaque ligne de session ; il devient visible et modifiable.
- **Une carte par ligne de session.** Un lot de créatures (`qty > 1`) est une
  seule carte, avec une jauge par exemplaire. Deux poses séparées de la même
  créature restent deux cartes : c'est le comportement actuel de l'API.
- **La carte dépliée remplace la fiche du jeton.** Vitalité, héroïsme, jet
  d'action et statbloc vivent dans la carte, dépliée sur place.
- **La réserve passe en bandeau horizontal en bas de l'écran**, comme une main
  de cartes.
- **On réutilise les composants existants** : `bol-hero-resources`,
  `bol-action-roll-panel`, `bol-statblock`, `bol-scene-list`,
  `SceneActionsService`, la barre de commande.

## L'écran en mode libre

De haut en bas :

1. La barre du haut, inchangée.
2. Le tapis : rang du haut, bandeau « Dernier jet », rang du bas.
3. La réserve en bandeau, repliable.

### Les rangs

- **Rang du haut — « Présents dans la scène »** : toutes les cartes de camp
  `adversaires`, dans l'ordre PNJ, créatures, démons, puis par ordre d'arrivée
  (id de ligne croissant).
- **Rang du bas — « Héros et alliés »** : les héros d'abord, puis les cartes non
  héros de camp `heros`, par ordre d'arrivée.
- Un rang trop long passe à la ligne ; le tapis défile verticalement. Pas de
  réduction automatique de la taille des cartes.
- Un rang vide affiche une phrase d'aide : « Personne ici pour l'instant. Pose
  des personnages depuis la réserve. » (haut) ; le rang du bas n'est jamais vide
  dans une session ouverte normalement, mais affiche « Aucun héros à table. »
  le cas échéant.

### La face d'une carte

Toutes les cartes ont la même structure, aux mêmes endroits :

- un liseré de la couleur du type (tokens existants : héros, PNJ, créature,
  démon) ;
- le nom ;
- une étiquette : le rang (« Rival », « Coriace », « Piétaille ») pour un non
  héros de camp `adversaires` ; « Allié » pour un non héros de camp `heros` ;
  « ×N » pour un lot (à la place du rang, qui reste lisible dans la carte
  dépliée) ; rien pour un héros ;
- l'avatar existant, ou l'icône du type si l'image manque ;
- trois chiffres : **Dég.**, **Déf.**, **Vit.** ;
- une barre de vitalité ; pour un lot, une jauge par exemplaire.

Provenance des trois chiffres :

| Type | Dég. | Déf. | Vit. |
|---|---|---|---|
| Héros | dégâts de sa première arme, « — » s'il n'en a pas | `combat.defense_effective` | vitalité de session / vitalité de la fiche |
| PNJ | dégâts de sa première arme snapshotée, « — » sinon | `defense` | `vitalite_courante` / `vitalite_max` |
| Créature | `degats` | `defense` | idem ; pour un lot, le maximum seul (les jauges portent le courant) |
| Démon | `degats` | `defense` | idem |

Une vitalité à la moitié du maximum ou en dessous colore la barre en rouge,
comme aujourd'hui. Un exemplaire à 0 a une jauge éteinte. Un héros en vitalité
négative affiche sa valeur négative.

### La carte dépliée

Cliquer une carte la déplie sur place ; ses voisines s'écartent. Une seule carte
est dépliée à la fois. Recliquer son en-tête, cliquer sa croix ou presser Échap
la replie. Échap ne replie pas la carte si un dialogue est ouvert.

**Héros** :

1. nom, carrières ;
2. vitalité et héroïsme (`bol-hero-resources`) ;
3. jet d'action (`bol-action-roll-panel`) ;
4. « Fiche complète » (dialogue de statbloc existant).

**PNJ, créature, démon** :

1. nom, type, rang ;
2. vitalité en stepper ; pour un lot, un stepper par exemplaire, numérotés
   « #1 », « #2 »… ;
3. statbloc (`bol-statblock`) ;
4. actions : « Passer du côté des héros » ou « Remettre avec les présents »
   (change le camp), et « Retirer de la table » (pour un lot : « Retirer un
   exemplaire », qui retire le dernier, comportement actuel de l'API).

Les données d'un héros (carrières, traits) et le statbloc d'un non héros sont
chargés au dépliage, comme aujourd'hui pour la fiche du jeton ; une réponse
arrivée après qu'une autre carte a été dépliée est ignorée.

### Bandeau « Dernier jet »

Le bandeau existant, placé entre les deux rangs. Il garde sa région
`aria-live`.

### La réserve en bandeau

Le composant `bol-reserve` passe d'une colonne à gauche à un bandeau en bas.

- **À gauche** : le titre, les cinq onglets (Héros, PNJ, Créatures, Démons,
  Scènes) et le bouton de repli. L'état replié reste mémorisé comme aujourd'hui.
- **Onglets de personnages** : le champ de recherche, puis une rangée de cartes
  réduites défilant horizontalement. Cliquer une carte pose le personnage ; un
  héros ou un PNJ déjà à table est estompé et non cliquable. En fin de rangée,
  les liens « Créer » et « Gérer la bibliothèque ».
- **Onglet Scènes** : le sélecteur de scénario, puis les scènes du scénario
  choisi sous forme de puces dans leur ordre. Cliquer une puce charge la scène
  (`SceneActionsService.load`, avec le dialogue « Remplacer ou Ajouter »). La
  scène courante est marquée. Deux boutons : « Enregistrer la table » et
  « Gérer les scènes », qui ouvre `bol-scene-list` dans un dialogue (notes,
  renommer, réordonner, mettre à jour, supprimer, nouveau scénario).

Un non héros posé depuis la réserve arrive dans le rang du haut.

## Backend

### Changer de camp

Nouvelle route `PATCH /bol/fight-session/{id}/combatant/{kind}/{pivotId}/camp`,
corps `{camp}` avec `camp` = `heros` ou `adversaires`.

- `kind` = `pnj`, `creature` ou `demon`. Pour `hero` : 422, un héros reste dans
  le camp des héros.
- 404 si la session n'appartient pas à l'utilisateur ou si la ligne n'existe
  pas dans cette session.
- Réponse : la session avec ses relations.

Logique dans `BolFightSessionService::setCamp`.

### Dégâts des héros dans la session

La session sérialise déjà les attributs, le combat et les ressources de chaque
héros, mais pas ses armes. La relation `heros.heros.armes.arme` est ajoutée au
chargement de la session, pour afficher les dégâts sur la face de la carte.

### Camp dans les scènes

Un allié enregistré dans une scène doit revenir comme allié.

- Une entrée de distribution gagne un champ optionnel `camp` (`heros` ou
  `adversaires`). Absent, il vaut `adversaires` : les scènes déjà enregistrées
  se chargent comme avant.
- `BolSceneDistribution::fromSession` lit le camp de chaque ligne.
- `BolSceneService::loadIntoSession` crée chaque ligne avec le camp de l'entrée.
- En mode `replace`, tous les non héros sont retirés, alliés compris.

## Frontend

### Fichiers

- `session/play/tapis/tapis.util.ts` — fonctions pures :
  - `buildTapisCards(session)` → les cartes, une par ligne de session, avec
    leur face déjà calculée ;
  - `splitRows(cards)` → `{presents, heros}` dans l'ordre d'affichage ;
  - `campActionLabel(card)` → libellé de l'action de changement de camp, ou
    `null` pour un héros.
- `session/play/tapis/character-card.ts` — composant `bol-character-card` :
  la face d'une carte, en taille standard ou réduite. Présentation seule.
- `session/play/tapis/expanded-card.ts` — composant `bol-expanded-card` : la
  carte dépliée. Reprend le rôle de `bol-token-inspector`, qui est supprimé.
- `session/play/tapis/tapis.ts` — composant `bol-tapis` : les deux rangs, le
  bandeau « Dernier jet », la carte dépliée à sa place dans son rang. Ne parle
  à aucun service ; remonte ses événements à la page.
- `session/play/reserve/` — `bol-reserve` remis en page en bandeau ; sa logique
  (onglets, recherche, pose) ne change pas.
- `session/play/reserve/scene-strip.ts` — composant `bol-scene-strip` : le
  contenu de l'onglet Scènes dans le bandeau.

### Identité d'une carte

Clé `{kind}-{pivotId}` (par exemple `creature-12`), sans index d'exemplaire.
La sélection de la page, aujourd'hui une clé de jeton, devient une clé de carte.

### Page

`session-play-page`, en mode libre :

- affiche `bol-tapis` et le bandeau de réserve à la place de la colonne de
  réserve, du battlefield et de la fiche du jeton ;
- porte la clé de la carte dépliée et charge ses données ;
- exécute les événements du tapis : vitalité (par exemplaire pour un lot),
  changement de camp, retrait, jet, fiche complète.

En mode combat, la page affiche le battlefield comme aujourd'hui.

### Barre de commande

Le groupe « Sur la table » liste les cartes au lieu des jetons : un lot y
figure une fois, sous la forme « Hippocampe ×3 ». Entrée déplie la carte.

### Suppressions

- `bol-token-inspector`.
- Dans `bol-battlemap` : l'entrée `selectedKey`, la sortie `tokenSelected` et le
  style du jeton sélectionné, qui ne servaient qu'au mode libre.

## Accessibilité

- Chaque rang est une liste (`role="list"`) avec son libellé ; chaque carte est
  un élément de liste dont la face est un bouton avec `aria-expanded`.
- Le libellé accessible d'une carte dit le nom, le type et les trois chiffres :
  « Prêtre de Shazzadion, PNJ, dégâts d6B, défense 0, vitalité 6 sur 6 ».
- Les jauges d'un lot ont un libellé texte (« exemplaire 2 : 1 sur 5 »).
- À l'ouverture, le focus va dans la carte dépliée ; au repli, il revient sur la
  face de la carte.
- La rangée de la réserve se parcourt au clavier (Tab, puis Entrée pour poser).
- Contraste WCAG AA sur les tokens existants ; AXE sans erreur sur le tapis.

## Tests

Le dépôt ne teste que des fonctions pures, des deux côtés ; ce chantier suit
cette pratique.

- **Vitest** :
  - `buildTapisCards` : face de chaque type, arme absente, lot et ses jauges,
    étiquette (rang, « Allié », « ×N », rien), vitalité négative d'un héros,
    ligne dont la fiche source a disparu ;
  - `splitRows` : répartition par camp, ordre dans chaque rang, héros avant
    alliés ;
  - `campActionLabel` ;
  - résultats « Sur la table » de la barre de commande pour un lot.
- **PHPUnit (sans base)** : `BolSceneDistribution::fromSession` avec le camp ;
  entrée sans camp traitée comme `adversaires`.
- **Navigateur** (skill `run`) : ouvrir une table, poser un PNJ et un lot depuis
  le bandeau, déplier un héros et lancer un jet, déplier un lot et blesser un
  exemplaire, passer un PNJ du côté des héros, enregistrer puis recharger la
  scène et vérifier que l'allié revient allié, replier la réserve, démarrer un
  combat et vérifier que l'écran de combat actuel s'affiche.
- `npm run build`, `npm test`, `php artisan test`.
