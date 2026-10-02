# Scènes — préparer et charger une distribution sur la table

Date : 2026-10-02
Statut : validé, plan d'implémentation dans `docs/superpowers/plans/2026-10-02-scenes.md`
Chantier précédent : `docs/superpowers/specs/2026-10-02-poste-de-table-design.md`

## Contexte

Le poste de table (chantier 1) permet de poser héros, PNJ, créatures et démons
sur la carte depuis la réserve, un par un. Pour une partie préparée, le MJ
refait ce travail à chaque scène, pendant que les joueurs attendent.

`BolScenario` existe déjà (titre, pitch, routes CRUD) mais aucune page ne s'en
sert. Ses tables de distribution (`bol_scenario_pnj`, `bol_scenario_creature`,
`bol_scenario_demon`, `bol_scenario_pj`) copient les caractéristiques des
personnages ; elles ne sont pas utilisées par ce chantier.

## Objectif

Le MJ enregistre l'état de la table comme une **scène**, puis la recharge en un
geste pendant la partie. Les scènes peuvent être rangées dans un scénario, dans
un ordre choisi. Tout se fait depuis la table, dans un cinquième onglet de la
réserve.

## Hors périmètre

- Les « jets prévus » par scène (le jet d'action n'existe que pour les héros).
- L'édition du pitch du scénario et de ses tables de distribution existantes.
- Le marquage « scène jouée ».
- Le combat : les scènes ne se manipulent qu'en mode `libre` (la réserve n'est
  affichée que dans ce mode).
- Un éditeur de scène séparé : la table sert d'éditeur.

## Décisions de conception

- **Une scène référence la bibliothèque, elle ne copie pas les
  caractéristiques.** La copie se fait au chargement, par le mécanisme déjà
  utilisé quand on pose un personnage (`createPnjRow`, `createCreatureRow`,
  `createDemonRow`). Une fiche modifiée entre-temps est donc chargée à jour.
- **Les héros ne font pas partie d'une scène.** Ils appartiennent à la session ;
  charger une scène ne les touche jamais, ni leur vitalité de session, ni leur
  position.
- **Les scènes sont optionnelles et peuvent exister sans scénario.** Une session
  fonctionne sans scène ; une scène sans scénario est rangée dans « Sans
  scénario ».
- **On crée une scène en enregistrant la table.** Pas de formulaire de
  distribution.
- **Le chargement est une opération serveur unique**, en transaction : la table
  ne peut pas rester à moitié chargée.

## Modèle de données

### Nouvelle table `bol_scene`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid | clé primaire |
| `user_id` | uuid | propriétaire |
| `scenario_id` | uuid, nullable | scénario de rattachement ; `null` = « Sans scénario ». Clé étrangère vers `bol_scenario`, mise à `null` à la suppression du scénario |
| `titre` | string | obligatoire, 120 caractères au plus |
| `ordre` | entier | rang dans son scénario (ou dans « Sans scénario »), à partir de 0 |
| `notes` | text, nullable | notes du MJ |
| `distribution` | json | liste d'entrées, voir ci-dessous |

Modèle `App\Models\Bol\BolScene` (trait `Uuids`, `distribution` casté en
tableau).

### Entrée de distribution

```json
{"kind": "creature", "source_id": "48", "qty": 2, "positions": [{"x": 71.5, "y": 30}, null]}
```

- `kind` : `pnj`, `creature` ou `demon`. Jamais `hero`.
- `source_id` : id de la fiche en bibliothèque, en chaîne.
- `qty` : 1 pour un PNJ ; 1 ou plus pour une créature ou un démon.
- `positions` : une valeur par exemplaire, dans l'ordre ; `{x, y}` en pourcentage
  de la carte, ou `null` si le jeton n'avait jamais été déplacé (il prendra le
  placement par défaut).

### Scène courante de la session

Nouvelle colonne `bol_fight_session.scene_id` (uuid, nullable, clé étrangère
vers `bol_scene`, mise à `null` à la suppression de la scène). La relation
`scene` (avec son `scenario`) est chargée avec la session, pour afficher les
deux titres dans la barre du haut.

## Backend

Logique dans un nouveau service `app/Http/Services/Bol/BolSceneService.php`,
contrôleur `BolSceneController`, routes sous le middleware `sanctum`. Toutes les
opérations vérifient que la scène, la session et le scénario appartiennent à
l'utilisateur ; sinon 404.

### Routes

| Route | Effet |
|---|---|
| `GET /bol/scene` | Scènes de l'utilisateur, avec le titre de leur scénario, triées par scénario puis `ordre` |
| `POST /bol/scene/create` | Corps `{titre, scenario_id?, session_id}`. Crée la scène à partir de la session : distribution et positions lues côté serveur. `ordre` = dernier rang du scénario + 1. La session prend cette scène comme scène courante |
| `POST /bol/scene/update` | Corps `{id, titre?, notes?, scenario_id?}`. Changer de scénario place la scène en dernier rang du scénario d'arrivée |
| `PATCH /bol/scene/ordre` | Corps `{scenario_id, ordre: [ids]}` (`scenario_id` `null` pour « Sans scénario »). Réécrit `ordre` selon la liste ; les ids qui n'appartiennent pas à ce scénario sont ignorés |
| `PATCH /bol/scene/{id}/distribution` | Corps `{session_id}`. Remplace la distribution de la scène par celle de la session |
| `DELETE /bol/scene/delete/{id}` | Supprime la scène |
| `POST /bol/fight-session/{id}/load-scene` | Corps `{scene_id, mode}`, `mode` = `replace` ou `add`. Voir « Chargement » |

Les scénarios utilisent les routes existantes (`GET /bol/scenario`,
`POST /bol/scenario/create` avec un titre seul). Aucune route de scénario n'est
ajoutée.

### Construire une distribution depuis une session

Fonction pure (testable sans base) qui prend les lignes PNJ, créature et démon
d'une session et `positions_jetons`, et renvoie la liste d'entrées :

- une entrée par ligne de session, dans l'ordre PNJ, créatures, démons ;
- une ligne dont la fiche source a été supprimée (`pnj_id`, `creature_id` ou
  `demon_id` nul) est ignorée ;
- les positions sont lues par clé de jeton : `pnj-{id}`, `creature-{id}-{i}`,
  `demon-{id}-{i}` ;
- les héros et leurs positions ne sont pas repris.

Une session sans aucun PNJ, créature ni démon donne une distribution vide : la
scène est créée quand même (une scène de dialogue, avec ses seules notes).

### Chargement

`BolSceneService::loadIntoSession`, en une transaction :

1. Refus (409, message « Terminez le combat avant de charger une scène. ») si la
   session n'est pas en mode `libre`.
2. Mode `replace` : suppression de toutes les lignes PNJ, créature et démon de la
   session, et de leurs entrées dans `positions_jetons`. Les lignes et positions
   des héros sont conservées.
3. Pour chaque entrée de la distribution, création de la ligne par les méthodes
   existantes de `BolFightSessionService` (camp `adversaires`). Sont ignorées,
   et comptées :
   - une entrée dont la fiche source n'existe plus ;
   - en mode `add`, un PNJ déjà présent dans la session (un PNJ n'y figure
     qu'une fois).
4. Écriture des positions des jetons créés dans `positions_jetons`, par clé de
   jeton, pour les exemplaires dont la position enregistrée n'est pas `null`.
5. `scene_id` de la session = la scène chargée.

Réponse : `{session, ignored}` où `session` est la session avec ses relations et
`ignored` le nombre d'entrées ignorées.

Les méthodes `createPnjRow`, `createCreatureRow` et `createDemonRow` de
`BolFightSessionService`, aujourd'hui privées et sans valeur de retour,
deviennent publiques et renvoient la ligne créée (ou `null`), pour que le
chargement connaisse les ids des jetons.

## Frontend

### Onglet « Scènes » de la réserve

`RESERVE_TABS` ne décrit que les quatre types de personnages. La réserve gagne
un cinquième onglet d'une autre nature : son contenu est un nouveau composant
`bol-scene-list` (`session/play/scene-list/`), affiché à la place de la liste de
personnages, de la recherche et du pied « Créer / Gérer ».

Contenu de `bol-scene-list` :

- **Sélecteur de scénario** (`mat-select`) : « Sans scénario » puis les
  scénarios par ordre alphabétique. À l'ouverture, il se place sur le scénario
  de la scène courante de la session, sinon sur « Sans scénario ».
  Bouton « Nouveau scénario » : dialogue avec un champ titre.
- **Liste des scènes** du scénario choisi, dans l'ordre, en
  `dw-collapsible-row`. La scène courante de la session est marquée.
  Réordonnancement par glisser-déposer (CDK) des lignes repliées, persisté par
  `PATCH /bol/scene/ordre`.
  Ligne dépliée :
  - résumé de la distribution (« 2 PNJ · 3 créatures », ou « Aucun personnage ») ;
  - notes du MJ dans un `textarea`, enregistrées à la perte de focus ;
  - actions : **Charger**, **Renommer**, **Mettre à jour avec la table**,
    **Supprimer** (confirmation).
- **Pied** : « Enregistrer la table comme scène » — dialogue avec un champ
  titre ; la scène est créée dans le scénario sélectionné.
- **État vide** : « Aucune scène ici. Pose tes personnages sur la carte, puis
  enregistre la table comme scène. »

« Mettre à jour avec la table » demande confirmation : la distribution
enregistrée est remplacée.

### Charger une scène

- La table ne porte que des héros : chargement direct en mode `replace`.
- La table porte d'autres personnages : dialogue à trois issues, **Remplacer**
  (« Les N personnages présents sont retirés, les héros restent »), **Ajouter**,
  **Annuler**.
- Après chargement : la session est rechargée, la fiche du jeton est fermée, un
  message confirme (« Scène « Le temple de Shazzadion » chargée. »). Si des
  entrées ont été ignorées : « … chargée. 2 personnages ont été ignorés (déjà
  sur la table ou supprimés de la bibliothèque). »
- Erreur serveur : message de l'API en snackbar, la table est inchangée
  (transaction).

### Barre du haut

Quand la session a une scène courante, le titre de la barre devient
« Scénario · Scène » (ou le seul titre de la scène si elle n'a pas de scénario).
Sans scène courante, le titre de la session comme aujourd'hui.

### Services et modèles

- `bol-scene.model.ts` : `BolSceneModel`, `BolSceneEntry`.
- `bol-scene.service.ts` : une méthode par route.
- `BolFightSessionModel` gagne `scene_id` et `scene` (titre, titre du scénario).
- `BolFightSessionService.loadScene(sessionId, sceneId, mode)`.

## Accessibilité

- Le glisser-déposer a une alternative clavier : chaque ligne dépliée propose
  « Monter » et « Descendre ».
- Champs des dialogues libellés ; le `textarea` de notes a un libellé visible.
- Messages de résultat en snackbar (région `aria-live` de Material).
- AXE sans erreur sur la table, onglet Scènes ouvert.

## Tests

Le dépôt ne teste que des fonctions pures et n'a pas d'infrastructure de test
backend avec base de données ; ce chantier suit cette pratique.

- **PHPUnit (sans base)** : construction d'une distribution depuis les lignes
  d'une session (ordre, lots, positions par exemplaire, fiche source supprimée,
  héros exclus) ; table des positions à écrire au chargement.
- **Vitest** : regroupement et tri des scènes par scénario ; résumé de
  distribution ; mode de chargement selon le contenu de la table ; titre de la
  barre du haut ; nouvel ordre après un déplacement.
- **Navigateur** (skill `run`) : enregistrer une table comme scène, la recharger
  en remplacement puis en ajout, vérifier que héros et vitalité sont intacts,
  réordonner, créer un scénario, supprimer une fiche source puis charger.
- `npm run build` et `php artisan test`.
