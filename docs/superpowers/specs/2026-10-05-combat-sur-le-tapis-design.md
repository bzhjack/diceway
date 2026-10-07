# Le combat sur le Tapis

Date : 2026-10-05
Statut : validé, plan d'implémentation dans `docs/superpowers/plans/2026-10-05-combat-sur-le-tapis.md`
Dossier de réflexion (maquette A, « Le Tapis ») : https://claude.ai/artifact/KSvCVgr2U16WdLNfoU4few
Chantier précédent : `2026-10-05-tapis-hors-combat-design.md`

## Contexte

En mode libre, la table est un tapis de cartes sur deux rangs. En mode combat,
elle affiche encore l'ancien battlefield à jetons : ruban d'initiative, menu
d'attaque sur le jeton, ciblage par clic, puis dialogue d'attaque.

Ce combat est riche côté règles (ordre par paliers, armes, postures, bouclier,
succès héroïque et légendaire, faveur divine, dégâts, protection), mais :

- il se joue sur des jetons qui ne montrent rien, que le retour du MJ a écartés ;
- l'application ne suit ni les tours ni les rounds : « celui qui joue » est le
  premier du ruban, que le MJ réordonne à la main ;
- la défense totale est un pense-bête local, perdu au rechargement.

## Objectif

Jouer le combat sur le tapis : deux camps face à face, une carte active, on
désigne sa cible, on résout. L'application suit le round et qui a joué. Les
règles de Barbarians of Lemuria restent celles déjà codées ; Hearthstone ne
prête que la forme.

## Hors périmètre

- Réécrire la résolution d'une attaque : le dialogue d'attaque existant
  (`attack-roll-dialog`) est réutilisé tel quel.
- Le démarrage du combat (`start-combat-dialog` : adversaires, jets de réaction,
  embuscade) et sa fin (confirmation, récupération post-combat) : inchangés.
- Automatiser les adversaires : c'est le MJ qui joue leurs cartes.
- Compter les attaques restantes d'un lot ou d'un combat à deux armes.
- Retirer de la base les colonnes et routes de positions de jetons : elles
  restent, inutilisées.
- Le jet d'action pour les PNJ, créatures et démons.

## Décisions de conception

- **Un seul écran pour les deux modes.** `bol-tapis` sert en mode libre et en
  mode combat ; le combat y ajoute une bande d'ordre, une barre d'action et des
  états sur les cartes.
- **L'ordre de jeu est celui de BoL**, par paliers (`buildInitiativeOrderFrom`),
  pas camp par camp. Il porte sur les **cartes** : un lot joue comme une seule
  carte.
- **Le tour de jeu est suivi et gardé en base** : round courant, cartes qui ont
  joué, cartes en défense totale.
- **Le calcul du tour est une fonction pure** ; la page ne fait que l'appeler et
  persister son résultat.
- **Le MJ garde la main** : il peut réordonner, rendre la main à une carte,
  passer un tour. L'application propose, elle n'interdit pas.

## L'écran en mode combat

De haut en bas :

1. la barre du haut, inchangée (« Terminer le combat », bannière de succès
   légendaire) ;
2. la **bande d'ordre** ;
3. le tapis : rang des adversaires, **barre d'action**, rang des héros et
   alliés.

La réserve n'est pas affichée en combat.

### La bande d'ordre

Nouveau composant `bol-turn-order`, à la place de `bol-initiative-rail`.

- À gauche : « Round N ».
- Les cartes dans l'ordre de jeu, sous forme de puces (nom, couleur du type).
  La carte active est en or ; celles qui ont joué ce round sont estompées ;
  celles qui sont sautées (hors combat, ou bloquées au round 1) sont barrées.
- Les puces se réordonnent par glisser-déposer, comme le ruban actuel ; l'ordre
  manuel est persisté par la route existante.
- Une puce estompée porte un bouton « Rendre la main » : la carte redevient
  jouable ce round.
- À droite : « Ajouter », qui ouvre le dialogue d'ajout de combattant existant.

Le libellé des rangs change en combat : « Adversaires » en haut, « Héros et
alliés » en bas.

### La barre d'action

Elle occupe la place du bandeau « Dernier jet », entre les deux rangs, et
concerne la carte active.

- Le nom de la carte active.
- **Arme** : pour un héros, ses armes puis « Mains nues » et « Arme
  improvisée » ; la première est choisie par défaut. Pour un PNJ, une créature
  ou un démon, pas de choix : ses dégâts snapshotés.
- **Posture** : les options de combat existantes (aucune, offensive, intrépide,
  défensive, défaut de l'armure, et les deux postures à deux armes quand elles
  sont jouables), avec le choix de l'arme secondaire quand il le faut. Mêmes
  règles de filtrage qu'aujourd'hui (`filterAttackMenuCombatOptions`,
  `filterVisiblePostures`, `dualStrikeDegats`).
- Une consigne : « Clique une carte adverse pour attaquer. »
- **Défense totale** : met la carte en défense totale et termine son tour.
- **Fin du tour** : passe à la carte suivante.

Quand aucune carte ne peut jouer (tout le monde est hors combat ou a joué et le
round ne peut pas avancer), la barre affiche « Plus personne ne peut jouer. »
et seule l'action « Terminer le combat » de la barre du haut reste utile.

### Les cartes en combat

La face d'une carte garde sa structure. S'y ajoutent :

- **Active** : soulevée, cerclée d'or.
- **Désignable** : les cartes du camp opposé à la carte active, qui ne sont pas
  hors combat, ont un liseré rouge au survol et au focus ; leur libellé
  accessible devient « Attaquer … ».
- **A joué** : estompée jusqu'au round suivant.
- **Défense totale** : un marqueur « bouclier » sur la face.
- **Hors combat** : grisée, non désignable, sautée dans l'ordre.
- **Bloquée au round 1** : un marqueur « cadenas », comme sur les jetons
  aujourd'hui.

Un clic sur une carte désignable lance l'attaque. Un clic sur toute autre carte
la déplie. Chaque face porte en plus, en combat, un petit bouton « déplier » :
c'est lui qui déplie une carte désignable.

La carte dépliée est la même qu'en mode libre, sans le jet d'action ni le
changement de camp. Elle gagne, en combat, une action « Attaquer cette carte »
quand elle n'est pas la carte active : c'est le moyen d'attaquer une carte de
son propre camp, ce que l'écran actuel permet.

## Le tour de jeu

### État

Trois informations, gardées dans la session :

- `round` : entier, à partir de 1 ;
- `joues` : clés des cartes qui ont joué ce round ;
- `defense_totale` : clés des cartes en défense totale.

### Carte active

La carte active est la première de l'ordre de jeu qui n'est ni dans `joues`,
ni hors combat, ni bloquée ce round.

- **Hors combat** : un héros dont la vitalité de session est négative ; un PNJ,
  une créature ou un démon dont la vitalité est à 0, ou dont tous les
  exemplaires sont à 0 pour un lot.
- **Bloquée au round 1** : la règle existante (`lockedRound1`), appliquée
  seulement quand `round` vaut 1.

### Fin du tour

« Fin du tour » ajoute la carte active à `joues`. S'il ne reste plus aucune
carte jouable ce round, le round suivant commence : `round + 1`, `joues` vidé.
Si le round suivant n'a lui non plus aucune carte jouable (tout le monde est
hors combat), le round n'avance pas.

### Défense totale

« Défense totale » ajoute la carte active à `defense_totale`, puis termine son
tour. Le marqueur tombe au moment où cette carte redevient active.

Quand une carte en défense totale est prise pour cible, sa défense est
augmentée de 2 dans le dialogue d'attaque, automatiquement.

### Cartes qui arrivent ou partent

- Une carte ajoutée en cours de round n'est pas dans `joues` : elle jouera ce
  round, à sa place dans l'ordre.
- Une carte retirée disparaît de l'ordre ; sa clé éventuellement restée dans
  `joues` ou `defense_totale` est ignorée.

### Rendre la main

« Rendre la main » retire une carte de `joues`.

## Attaquer

1. La carte active est soulevée ; ses armes et postures sont dans la barre
   d'action.
2. Le MJ clique une carte désignable (ou « Attaquer cette carte » sur une carte
   dépliée).
3. Le dialogue d'attaque existant s'ouvre, prérempli : caractéristiques de
   l'attaquant et de la cible, dégâts de l'arme choisie, posture, bonus de
   succès légendaire, défense totale de la cible.
4. À la validation, les dégâts sont appliqués à la cible, la session est
   rechargée, et le « défier la mort » existant se déclenche pour un héros
   tombé en vitalité négative.
5. La carte reste active jusqu'à « Fin du tour ».

### Lots

- **Lot attaquant** : il attaque avec ses caractéristiques snapshotées, comme
  une carte simple.
- **Lot pris pour cible** : les dégâts vont au premier exemplaire dont la
  vitalité est supérieure à 0. Le dialogue le nomme (« Hippocampe #2 »).

### Caractéristiques

Elles sont résolues comme aujourd'hui (`resolveAttackStats`) : en direct pour
un héros, depuis le snapshot de session pour les autres. La fonction n'est pas
modifiée : elle continue de prendre un jeton (`PlayToken`), et la page retrouve
le jeton qui correspond à une carte (et à l'exemplaire visé, pour un lot).

## Backend

### État du combat

- Migration : colonne `etat_combat` (json, nullable) sur `bol_fight_session`.
- Forme : `{"round": 1, "joues": [], "defense_totale": []}`.
- `PATCH /bol/fight-session/{id}/etat-combat`, corps
  `{round, joues, defense_totale}` : `round` entier ≥ 1, les deux autres des
  tableaux de chaînes. 404 si la session n'appartient pas à l'utilisateur.
  Réponse : la session.
- `startCombat` initialise `etat_combat` à `{round: 1, joues: [],
  defense_totale: []}`.
- `endCombat` remet `etat_combat` à `null`.
- Une session en combat sans `etat_combat` (combat démarré avant ce chantier)
  est lue comme `{round: 1, joues: [], defense_totale: []}`.

### Ordre manuel

`ordre_manuel` contient aujourd'hui des clés de jeton (`creature-12-0`). Il
contiendra des clés de carte (`creature-12`). Aucune migration : une clé qui ne
correspond à aucune carte est ignorée, et les cartes absentes de l'ordre manuel
se rangent à la suite, comme aujourd'hui. `endCombat` vide déjà `ordre_manuel`.

## Frontend

### Fichiers

- `session/play/tapis/combat-turn.util.ts` — fonctions pures :
  - `orderCards(cards, initiative, manualOrder)` → les cartes dans l'ordre de
    jeu, avec leur palier et leur blocage au round 1 ;
  - `isOut(card)` ;
  - `turnState(ordered, etat)` → carte active, statut de chaque carte (active,
    a joué, sautée, à venir), round ;
  - `endTurn(ordered, etat)`, `giveBackTurn(etat, key)`,
    `totalDefense(ordered, etat)` → nouvel état ;
  - `targetableKeys(cards, activeKey)` ;
  - `firstStandingInstance(card)` → index de l'exemplaire visé dans un lot ;
  - `normalizeEtat(raw)` → état valide à partir de ce que renvoie l'API.
- `session/play/tapis/turn-order.ts` — composant `bol-turn-order`.
- `session/play/tapis/action-bar.ts` — composant `bol-action-bar` : armes,
  posture, défense totale, fin du tour. Reprend la logique de choix de
  `attack-menu`, dont les fonctions pures sont conservées et déplacées dans
  `session/attack-options.util.ts`.
- `bol-character-card` : entrées d'état de combat (active, désignable, a joué,
  défense totale, hors combat, bloquée) et bouton « déplier ».
- `bol-expanded-card` : entrée `mode` ; en combat, pas de jet d'action ni de
  changement de camp, et l'action « Attaquer cette carte ».
- `bol-tapis` : entrée `mode` et l'état de combat ; affiche la barre d'action à
  la place du « Dernier jet » en combat ; émet `attackRequested`.

### Page

`session-play-page` en mode combat :

- affiche `bol-turn-order` et `bol-tapis` à la place du ruban et du battlefield ;
- calcule l'ordre et l'état du tour par les fonctions pures ;
- persiste l'état du combat à chaque fin de tour, défense totale ou main
  rendue ; en cas d'échec, l'état affiché revient à celui de la base et un
  message le dit ;
- ouvre le dialogue d'attaque avec les données de la carte active, de la cible,
  de l'arme et de la posture choisies.

### Suppressions

- `bol-battlemap` et son `token-layout.util`.
- `bol-initiative-rail`.
- `bol-attack-menu` (ses fonctions pures sont déplacées, pas supprimées).
- Dans la page : les positions de jetons, l'ordre des jetons.
- `canTarget` dans `combat-play.util.ts`. `buildPlayBoard` et `PlayToken` sont
  conservés : ils donnent l'ordre d'initiative et les stats de combat, et
  servent aussi à la page des sessions.

## Accessibilité

- La bande d'ordre est une liste ; la carte active porte `aria-current`.
- Le libellé accessible d'une carte dit son état : « à elle de jouer », « a
  joué », « hors combat », « en défense totale ».
- Une carte désignable s'annonce « Attaquer Prêtre de Shazzadion, … ».
- Le changement de carte active et de round est annoncé dans une région
  `aria-live="polite"`.
- Tout le combat se joue au clavier : Tab jusqu'à une cible, Entrée pour
  attaquer ; « Fin du tour » est atteignable et a un raccourci clavier, `F`,
  ignoré dans un champ de saisie ou quand un dialogue est ouvert.
- Contraste WCAG AA ; AXE sans erreur sur le tapis en combat.

## Tests

Le dépôt ne teste que des fonctions pures ; ce chantier suit cette pratique.

- **Vitest** :
  - `orderCards` : paliers, ordre manuel, clés inconnues ignorées, cartes
    absentes de l'ordre manuel rangées à la suite ;
  - `isOut` : héros à vitalité négative, à 0, non-héros à 0, lot partiellement
    et totalement tombé ;
  - `turnState` : carte active, cartes sautées au round 1, plus après ;
  - `endTurn` : passage de tour, changement de round, round qui n'avance pas
    quand plus personne ne peut jouer ;
  - `totalDefense` : marqueur posé puis retiré au tour suivant de la carte ;
  - `giveBackTurn` ;
  - `targetableKeys` : camp opposé, hors combat exclus, carte active exclue ;
  - `firstStandingInstance` ;
  - `normalizeEtat` : état absent, incomplet, mal formé ;
  - les fonctions déplacées de `attack-menu` gardent leurs tests.
- **PHPUnit (sans base)** : validation et normalisation de l'état du combat
  (fonction pure).
- **Navigateur** (skill `run`) : un combat de deux rounds avec un héros, un
  allié, un adversaire simple et un lot ; une attaque qui touche et blesse le
  bon exemplaire ; une défense totale et son +2 ; un rechargement en plein
  round ; une carte hors combat sautée ; rendre la main ; fin du combat et
  retour au mode libre.
- `npm run build`, `npm test`, `php artisan test`.
