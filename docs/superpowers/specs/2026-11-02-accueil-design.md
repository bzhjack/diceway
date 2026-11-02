# Accueil : un tableau de bord avant la table

Date : 2026-11-02. Statut : en attente de validation.

## Intention

Aujourd'hui, `/` envoie directement sur la table ouverte la plus récente (`homeRedirectGuard`). Quand aucune table n'est ouverte, elle affiche le seuil « Qui est à table ce soir ? ». Pour choisir un scénario, il faut ouvrir la table puis passer par le menu « On improvise ⌄ » de la frise, qui liste tous les scénarios par ordre alphabétique et sans repère de saga. Les créations et les bibliothèques ne sont accessibles que par le menu du compte.

Lionel veut un accueil qui serve de point de départ : choisir un scénario, créer un héros, un PNJ, une créature ou un démon, et ouvrir les bibliothèques. Il a retenu la disposition « tableau de bord en deux colonnes » parmi trois maquettes.

## Objectifs

1. `/` affiche l'accueil, qu'une table soit ouverte ou non.
2. Les scénarios sont groupés par saga, avec les chapitres dans l'ordre et l'avancement visible.
3. Cliquer sur un chapitre ouvre une **nouvelle table** sur ce scénario.
4. On peut créer chaque type de fiche et ouvrir chaque bibliothèque en un clic.
5. Quand une table est ouverte, on peut la reprendre en un clic.

## Hors périmètre

- Pas de page « bibliothèque des scénarios » : la colonne de gauche de l'accueil en tient lieu.
- Pas d'édition de scénario depuis l'accueil.
- Pas de nouvelle donnée à saisir pour l'avancement : il se déduit de ce que les tables ont déjà enregistré.
- Pas de statistiques ni de fil d'activité : Lionel ne veut rien de plus que les scénarios, les créations et les bibliothèques.

## À éviter

- Ajouter une étape quand on reprend une partie en cours : « Reprendre la table » doit rester à un clic depuis l'accueil.
- Perdre la table ouverte en lançant un chapitre : l'ancienne table reste ouverte.
- Se reposer sur le tri alphabétique des titres pour l'ordre des chapitres.

## Disposition (choisie par Lionel : maquette A)

```
┌──────────────────────────────────────────────────────────────────┐
│ Table ouverte                                                    │
│ Perle du Beshaar — 2. De sable et d'eau     [▶ Reprendre la table]│  ← seulement si une table est ouverte
└──────────────────────────────────────────────────────────────────┘
┌─────────────── Scénarios ───────────────┐ ┌──── Créer ──────────┐
│ ▌Perle du Beshaar                        │ │ Héros    PNJ        │
│   1. Sacrilège… (joué)                   │ │ Créature Démon      │
│   [2. De sable… · en cours]              │ └─────────────────────┘
│   3. Le tombeau… (à suivre)  4  5        │
│ ▌Le Dieu voilé                           │ ┌─ Bibliothèques ─────┐
│   Intro 1 2 3 4 5                        │ │ Sessions  Héros     │
│ ▌Chroniques lémuriennes                  │ │ PNJ       Créatures │
│   La tour d'Ajhaskar  Mariage amer …     │ │ Démons    Armes     │
│ ▌Hors saga                               │ │ Armures             │
│   premier scénario  la perle du Beshaar  │ └─────────────────────┘
└──────────────────────────────────────────┘
```

Les colonnes s'empilent sur un écran étroit : d'abord le bandeau, puis les scénarios, puis Créer, puis Bibliothèques.

## Comportement

### Route `/`

- `/` charge le nouveau composant d'accueil. `homeRedirectGuard` ne s'applique plus à `/`. *Mon choix : supprimer la garde et sa fonction `openSessionId` si plus rien ne s'en sert, sinon garder seulement la fonction.*
- Le seuil reste sur `/session/new`, inchangé à part le scénario présélectionné (voir plus bas).
- Les redirections vers `/` (après la connexion, à la sortie d'un formulaire sans `returnUrl`, garde `publicOnly`) mènent désormais à l'accueil. C'est voulu.

### Bandeau « Table ouverte »

- Il s'affiche si une session est au statut `libre` ou `combat`. On prend la plus récente, avec la même règle que `openSessionId`.
- Le titre affiché est celui de la session s'il existe, sinon celui du scénario de la table, sinon « Table du <date> ». *Mon choix.*
- Le bouton doré « Reprendre la table » est l'action principale de l'écran et mène à `/session/:id/play`.
- Sans table ouverte, pas de bandeau. Un lien « Nouvelle table » (vers `/session/new`, sans scénario) reste disponible dans l'en-tête. *Mon choix.*

### Colonne Scénarios

- **Regroupement par saga.** On se base sur le titre : la partie avant « — » (tiret cadratin entouré d'espaces) donne la saga, et ce qui suit donne le chapitre. Un titre sans « — » va dans le groupe « Hors saga », affiché en dernier.
  - On n'utilise pas `bol_import_ref.saga`, parce que l'import range chaque Chronique lémurienne dans sa propre saga (`cl1-…`), alors qu'elles forment un seul groupe à l'écran.
  - Le regroupement compare les noms sans tenir compte de la casse. Le nom affiché est celui du premier titre rencontré. *Mon choix.*
- **Ordre des chapitres.** D'abord « Introduction… », puis les chapitres numérotés (« 1. », « 2. »…) dans l'ordre des nombres, puis les autres par ordre alphabétique en français.
- **Ordre des sagas.** La saga qui contient la scène jouée le plus récemment vient en premier, les autres suivent par ordre alphabétique. « Hors saga » est toujours en dernier. *Mon choix : la saga en cours se trouve sans chercher.*
- **Avancement : trois états.** *Mon choix.* Une scène entre dans `scenes_jouees` dès qu'elle est chargée sur la table (`BolScenePreparation::played`), et non quand elle est finie. La règle « une scène chargée = chapitre joué » marquerait donc comme joué le chapitre qu'on est en train de jouer. D'où un troisième état :
  - **En cours** : le chapitre dont le scénario est celui de la table ouverte (`scenario_id`, voir plus bas). Au plus un chapitre est dans cet état, et seulement si une table est ouverte.
  - **Joué** : au moins une de ses scènes figure dans `scenes_jouees` d'une des sessions du compte, ouvertes ou terminées, et il n'est pas en cours.
  - **Prochain** : le premier chapitre non joué qui suit le chapitre en cours ou, à défaut, le dernier chapitre joué, dans l'ordre des chapitres. Un chapitre sauté reste non joué et ne devient pas « prochain » à rebours. Une saga où rien n'a été joué n'a pas de chapitre « prochain ».
  - Rendu : un chapitre en cours est bordé d'or et porte le repère « en cours ». Un chapitre joué est atténué, avec le repère « joué ». Le prochain a un liseré doré plus discret et le repère « à suivre ». Les repères sont écrits en texte, ou au moins exposés aux lecteurs d'écran : la couleur ne suffit jamais.
- Chaque chapitre est un lien ou un bouton accessible au clavier, avec un libellé complet (« Ouvrir une nouvelle table : Perle du Beshaar — 2. De sable et d'eau »).
- Sans aucun scénario, le texte indique d'importer un scénario (avec un renvoi vers `doc/scenarios/format-import.md`, écrit en texte simple), et le lien « Nouvelle table » reste disponible.

### Cliquer sur un chapitre (décision de Lionel : « ça ouvre une nouvelle table avec ce scénario »)

1. On va sur `/session/new?scenario=<id>`. *Mon choix : passer par le seuil pour choisir les héros de la soirée.*
2. Le seuil affiche le scénario choisi (un rappel avec son titre et un moyen de le retirer). On peut ajuster les héros. *Mon choix pour la présélection :*
   - Elle a lieu chaque fois que le seuil s'ouvre avec un brouillon vide, qu'on arrive par `?scenario=` ou par « Nouvelle table ».
   - Le brouillon est la sélection gardée dans le navigateur par `CombatSelectionService`. S'il n'est pas vide, on le garde tel quel : jamais d'écrasement ni de fusion.
   - Les héros présélectionnés sont ceux de la session la plus récente du compte, même si c'est la table ouverte en ce moment, puisque ce sont en général les mêmes joueurs. On ne reprend que les héros (type `H`), pas les PNJ, créatures ou démons.
   - Un scénario introuvable ou appartenant à un autre compte dans `?scenario=` est ignoré : le seuil s'ouvre sans scénario.
3. « Ouvrir la table » crée la session **avec ce scénario**. La table s'ouvre avec ce scénario affiché dans la frise, sans scène chargée.
4. L'ancienne table n'est pas modifiée : elle reste ouverte et accessible depuis « Mes sessions ». « Reprendre la table » mène désormais à la nouvelle, puisque c'est la plus récente.

Pour que le scénario survive à un rechargement de la table, la session doit le garder. *Mon choix : ajouter une colonne `scenario_id` nullable sur `bol_fight_session`, avec une clé étrangère vers `bol_scenario` et `nullOnDelete`.*
- La création de session accepte un `scenario_id`. On contrôle qu'il appartient au compte : les scénarios n'ont pas de scope `accessibleTo`, on filtre donc sur `user_id`, et le scénario d'un autre compte est refusé.
- **`scenario_id` est la seule source du scénario affiché par la frise.** *Mon choix.* Aujourd'hui, `SceneStageStore` déduit ce scénario de la scène courante, et `changeScenario` ne change la frise que dans le navigateur quand la table n'a pas d'adversaire. Au rechargement, la frise retombe alors sur l'ancien scénario. Désormais :
  - Choisir un scénario dans le menu de la frise enregistre `scenario_id`, avec ou sans adversaires. « On improvise » le remet à null.
  - Charger ou créer une scène enregistre aussi `scenario_id` (le scénario de cette scène). Cela vaut aussi pour une scène d'un autre scénario.
  - Au chargement de la table, la frise affiche le scénario `scenario_id`. La scène courante ne sert plus à le deviner.
  - La migration remplit `scenario_id` des sessions existantes à partir du scénario de leur `scene_id`, quand il y en a un.
- Le titre « scénario de la table » du bandeau d'accueil et l'état « en cours » des chapitres lisent ce même `scenario_id`.

### Colonne Créer

Quatre tuiles : Héros (`/create/hero`), PNJ (`/create/pnj`), Créature (`/create/creature`) et Démon (`/create/demon`). Elles ouvrent les formulaires existants, sans `returnUrl`. La sortie du formulaire ramène donc à l'accueil.

### Colonne Bibliothèques

Sept tuiles :
- Sessions (`/library/sessions`)
- Héros (`/library/heroes`)
- PNJ (`/library/pnjs`)
- Créatures (`/library/creatures`)
- Démons (`/library/demons`)
- Armes (`/library/weapons`)
- Armures (`/library/armors`)

La page Intendance reste en place.

### Navigation autour

- Dans les bibliothèques sans `returnUrl` (et sur la page Sessions et l'Intendance), le bouton « Retour à la table » devient « Retour à l'accueil » vers `/`. Avec un `returnUrl`, rien ne change (« Retour à la session »). *Mon choix.*
  - Mettre à jour le passage du CLAUDE.md qui décrit ce bouton.
- Le menu du compte gagne une entrée « Accueil » (`/`), en tête, pour revenir à l'accueil depuis la table. *Mon choix.*

## Contraintes

- Angular 22 : composants standalone en `OnPush`, signals, `input()`/`output()`, contrôle de flux natif, Angular Material uniquement. Les types exportés vont dans `models/`.
- Aspect forge : `dw-page`, mixins `styles/forge-mixins`, jetons de `_tokens.scss` (aucune couleur hexadécimale ailleurs), pas de `::ng-deep`. Les fichiers de suppressions du lint ne doivent pas grossir.
- Formes des boutons selon le CLAUDE.md : « Reprendre la table » en or plein, une seule action pleine par zone. Les tuiles sont des cartes, pas des boutons.
- AXE et WCAG AA : les états « joué » et « prochain » ne reposent pas sur la seule couleur.
- Backend : règles de propriété (`accessibleTo`, 404 sur la fiche d'un autre compte), logique dans les services, test PHPUnit sur la création de session avec `scenario_id` (accepté, refusé pour le scénario d'un autre compte, mis à null quand le scénario est supprimé).
- Vérifications : `npm run build`, `npm test`, `npm run lint`, `docker exec diceway php artisan test`. Vérification dans un navigateur sur le port 4400 avec le compte de test.

## Laissé au constructeur

- Le découpage en composants de l'accueil, et l'endroit du code où vivent le regroupement par saga et le calcul d'avancement. Ce calcul doit être une fonction pure, testée unitairement.
- Comment l'accueil obtient les scènes jouées et le scénario de chaque scène : endpoints existants (`/bol/scenario`, scènes, `/bol/fight-session` enrichi de `scenes_jouees`) ou un petit endpoint d'accueil dédié. Il faut éviter le N+1.
- Comment le seuil retrouve les héros de la dernière session.
- Les icônes des tuiles (game-icons déjà enregistrés de préférence) et l'usage éventuel de `assets/dashboard-header.webp` dans l'en-tête.
- Les textes exacts, en français, dans le ton de l'appli.
