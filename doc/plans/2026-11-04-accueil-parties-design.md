# L'accueil par parties — conception

Date : 2026-11-04. Maquette retenue : option A, la compagnie d'abord (son nom en grand, le scénario en sous-titre, les pastilles de ses chapitres, ses héros, « Reprendre » et son chapitre).

## Pourquoi

Lionel mène plusieurs compagnies, parfois sur le même scénario. L'accueil actuel est construit autour d'une seule « table ouverte » et
d'une progression par compte : ouvrir une table oblige à clore l'autre, et clore une table marquait son chapitre joué pour tout le
compte. Passer d'une compagnie à l'autre devenait déstabilisant (« clore » une partie qu'on n'a pas finie) et la progression d'une
compagnie se mélangeait à celle d'une autre.

En arrivant, il choisit la partie que la table est en train de jouer. Une nouvelle partie se prépare en amont : on la crée, on lui donne
un nom de compagnie et un scénario.

> **Mise à jour du 2026-11-04 : la compagnie est une fiche.** « Nouvelle compagnie » (en haut à droite) ne demande qu'un nom et des héros ;
> « + Partie » associe une compagnie à un scénario. Une compagnie joue plusieurs scénarios, chacun une fois ; la modifier vaut pour ses
> prochaines parties. Là où ce document décrit « Nouvelle partie » avec le nom et les héros, cette mise à jour l'emporte. Voir `CLAUDE.md`.

## Vocabulaire

- **Partie** : une table (`BolFightSession`) vue depuis l'accueil, c'est-à-dire une compagnie (son nom, `titre`) qui joue un scénario.
  « Table » reste le mot de l'écran de jeu. « Partie improvisée » : une partie sans scénario.
- **Scénario** › **Chapitre** › **Scène** : inchangé (`BolSaga` › `BolScenario` › `BolScene`). Un chapitre sans saga (one shot) est son
  propre scénario d'un seul chapitre.
- À mettre à jour dans `CLAUDE.md` (section Vocabulary).

## Objectifs

1. L'accueil montre en tête la **dernière partie jouée**, et en dessous **une carte par partie** (option A).
2. On passe d'une partie à l'autre **sans rien clore** : plus d'étape « clore », plus de règle « une seule table ouverte ».
3. La **progression est par partie** : chaque carte marque les chapitres de son scénario joués, en cours, à jouer **pour cette table**.
4. Une partie **reste** tant qu'on ne l'a pas supprimée explicitement.
5. Une partie est **liée à un scénario** : elle ne passe jamais d'elle-même sur un autre scénario.

## Hors objectifs

- Pas de reprise automatique sur un autre scénario. Une compagnie qui enchaîne sur un autre scénario, c'est une nouvelle partie (on y
  reprend ses héros à la main).
- Pas d'archivage, pas de statut « terminée » : une partie finie garde sa carte (« Scénario terminé ») jusqu'à sa suppression.
- Pas de nouvelle page catalogue des scénarios : on choisit le scénario en créant la partie.

## Anti-objectifs (ce qui serait un échec même si ça marche)

- Un geste qui ferme, clôt ou met de côté une partie quand on passe à une autre.
- Un chapitre coché « joué » sur une carte parce qu'une **autre** compagnie l'a joué.
- Un champ pré-rempli avec le nom ou les héros d'une autre compagnie dans « Nouvelle partie ».

## L'accueil

### Le bandeau (en tête)

La dernière partie jouée (voir « Dernière jouée » plus bas) : surtitre « Dernière partie jouée », nom de la compagnie, fil
« Scénario › Chapitre · Scène n sur m », scène en cours, barre des scènes du chapitre, héros, bouton **« Reprendre »**. Plus de bouton
« Clore la table ». Sans aucune partie : « Aucune partie » et le bouton « Nouvelle partie ».

La barre compacte (`dw-compact-bar`) suit : « Reprendre » la dernière partie, « Nouvelle partie ».

### La rangée « Parties »

Remplace la rangée « Scénarios » (même carrousel horizontal). Une carte par partie, de la plus récemment jouée à la plus ancienne, puis
une carte **« + Nouvelle partie »** en dernier.

Chaque carte (option A) :
- étiquette « dernière jouée » sur la première ;
- **nom de la compagnie** en grand (« Table sans nom » pour une ancienne partie sans nom) ;
- **nom du scénario** en sous-titre (nom de la saga ; pour un one shot, le nom du chapitre ; « Partie improvisée » sans scénario) ;
- la **teinte** du scénario (même calcul qu'aujourd'hui, `teinteDeSaga`) ;
- les **pastilles des chapitres** du scénario (« Intro », 1, 2…) avec l'état **pour cette partie** : joué, en cours, à jouer. Pas de
  pastilles pour une partie improvisée ni pour un one shot ;
- les **héros** de la partie (noms, camp des héros, héros du compte) ;
- le bouton **« Reprendre »** avec le chapitre en cours (« 2. De sable et d'eau ») ; « Scénario terminé » à la place du chapitre quand
  tous les chapitres sont joués ;
- un menu (icône, `mat-menu`) avec :
  - **« Changer de chapitre »** : sous-menu des chapitres de son scénario (le courant coché, les joués marqués « joué ») ; choisir un
    chapitre appelle `PATCH …/scenario` et l'accueil se relit. Pour une partie improvisée : « Choisir un scénario », sous-menu des
    scénarios puis de leurs chapitres, une seule fois (ensuite la partie est liée à ce scénario) ;
  - **« Supprimer la partie »**, après confirmation (`dw-confirm-dialog`), irréversible.

Chaque pastille donne le nom de son chapitre en bulle, au survol. Pas de légende.

Seul le bloc « Reprendre » mène à la table (`/session/:id/play`).

## Progression d'une partie

Pour une partie dont le chapitre courant est C, dans le scénario S :
- **en cours** : C ;
- **joué** : un chapitre de S que **cette table** a quitté pour un autre chapitre (`chapitres_quittes`), ou dont **toutes** les scènes
  (au moins une) sont dans les `scenes_jouees` de **cette table** ;
- **à jouer** : le reste ;
- **scénario terminé** : tous les chapitres de S joués (C compris, par ses scènes).

Clore n'existe plus, donc ne compte pas. Passer en scène improvisée ne change pas le chapitre.

`chapitres_quittes` est déjà alimenté par `BolFightSession::booted()` (`updating`, changement de `scenario_id` d'un chapitre vers un
autre). Le calcul global par compte (`scenariosJoues`, `scenarios_joues`, `scenario_recent_id`) disparaît.

## Une partie reste sur son scénario

- « Changer de chapitre » (menu de la carte) ne propose **que les chapitres du scénario de la partie**. Une partie improvisée peut
  recevoir un scénario une fois (choix libre) ; ensuite elle y reste.
- Charger ou enregistrer à la table une scène d'un chapitre **d'un autre scénario** ne change pas le chapitre de la partie (le serveur
  ne touche `scenario_id` que si le chapitre de la scène est dans le même scénario, ou si la partie n'en a pas encore). La liste des
  scènes à la table montre d'abord celles du scénario de la partie (filtre par défaut sur lui), les autres restant accessibles.
- `changerChapitre` (serveur) refuse (422) un chapitre d'un autre scénario quand la partie en a déjà un.

## « Nouvelle partie »

Le dialogue actuel (`open-table-dialog`), allégé :
1. **Nom de la compagnie** — obligatoire, vide au départ (déjà fait).
2. **Le scénario** — choix parmi les scénarios du compte (sagas et one shots), ou « Partie improvisée ». Puis le **chapitre de départ**,
   par défaut le premier (l'introduction si elle existe), modifiable.
3. **Les héros** — aucun d'office (déjà fait).
4. **« Créer la partie »** mène à la table.

Disparaissent : le bandeau « Une table est déjà ouverte », l'étape de confirmation « Clore … ? », le lien « Reprendre plutôt cette
table », et tout le mode « reprise » du dialogue (`OpenTableData.reprise`, `changerChapitre` depuis le dialogue) : changer de chapitre
se fait depuis le menu de la carte, reprendre depuis la carte ou le bandeau.

Depuis une carte « Commencer » d'un ancien scénario (la rangée Scénarios disparaît) : plus d'entrée ; `/session/new?scenario=` ouvre le
dialogue sur ce chapitre (garder ce paramètre, utilisé par le retour de « Créer un héros »).

## Dernière jouée

Une colonne `bol_fight_session.jouee_le` (timestamp) : posée à la création, et **à chaque fois qu'on entre à la table** (l'écran de jeu
appelle `PATCH /api/bol/fight-session/{id}/jouer` au chargement ; c'est l'actuel `reopen`, renommé et sans effet sur les autres tables).
Le bandeau et l'ordre des cartes suivent `jouee_le` desc. `updated_at` n'est plus utilisé pour ça (un renommage ou une écriture
d'état ne doit pas faire remonter une partie).

## Clore disparaît

- Front : `CloseTableService`, le bouton « Clore la table » du bandeau, l'entrée « Clore la table » du menu compte à la table
  (`account-menu`, `session-header`), la confirmation de « Mes tables ».
- Back : `PATCH …/close` et `closeSession` ; `reopenSession` devient `jouer` (pose `jouee_le`, ne clôt rien).
- `statut` ne garde que `libre` et `combat`. Migration : `terminee` → `libre`. Le type front `BolFightSessionStatut` perd `terminee`.
- La migration `2026_11_04_100000_add_chapitres_quittes` étant déjà poussée, elle ne change pas : `2026_11_04_100000_parties` ajoute `jouee_le`,
  passe `terminee` à `libre` et efface ce que la clôture avait marqué joué sur ces tables.

## « Mes tables »

Garde la liste (recherche, suppression) sous le nom **« Mes parties »**, sans l'étiquette « Close » ; « Reprendre » y mène simplement à la
table. Lien depuis l'accueil inchangé.

## API de l'accueil (`GET /api/bol/accueil`)

Remplace `table`, `scenarios_joues`, `scenario_recent_id`, `compagnie` par :

```
derniere: <id de la partie la plus récemment jouée> | null
parties: [{
  id, titre, statut, jouee_le,
  scenario_id,                 // le chapitre courant (null : improvisée)
  scene_id,
  scenes: [{id, titre}],       // scènes du chapitre courant, dans l'ordre (pour le bandeau)
  scenes_jouees: [id],         // celles de ces scènes passées sur cette table
  chapitres_joues: [id],       // calculés comme ci-dessus, pour cette table
  heros: [{id, nom, avatar}],  // héros du compte, camp des héros, dans l'ordre
}]
scenarios: inchangé (le front en tire la saga, l'ordre et la teinte)
comptes: inchangé (`sessions` compte les parties)
```

Le front garde le calcul de présentation (`accueil.util.ts`) : saga d'un chapitre, pastilles, libellés.

## Contraintes

- Conventions `CLAUDE.md` (Angular : signals, OnPush, Signal Forms, Material ; modèles dans `models/` ; back : services, policies,
  `accessibleTo`). Vocabulaire UI ci-dessus.
- Pas de prod : la migration n'a pas à être réversible au-delà de l'usage local (`down` fait au mieux).
- Deux postes : la migration s'applique sur chacun (`docker exec diceway php artisan migrate`), noter l'étape dans `CLAUDE.md`.
- Tests : back `php artisan test`, front `npm test`, `npm run build`, `npm run lint`. Les e2e `front/scripts/e2e-*.mjs` créent des
  tables par l'API : à garder verts.

## Laissé au constructeur

- Mise en page fine des cartes et du bandeau, dans la forge (`forge.plate` etc.), à partir de la maquette A.
- Découpage du code de l'accueil (`accueil.util.ts` est à refaire en grande partie).
- Libellés secondaires, tant qu'ils suivent le vocabulaire.

## Choix faits par Claude (à vérifier)

- Une partie commence au premier chapitre de son scénario, modifiable à la création.
- Le catalogue des scénarios quitte l'accueil ; on le parcourt dans « Nouvelle partie ».
- Supprimer une partie et changer son chapitre se font depuis le menu de sa carte (supprimer aussi depuis « Mes parties ») ; le
  dialogue n'a plus de mode « reprise ».
- Une partie improvisée peut recevoir un scénario une fois, puis y reste.
- « Mes tables » devient « Mes parties » et reste.
- Une scène d'un autre scénario chargée à la table ne déplace pas la partie.
- « Dernière jouée » = dernière entrée à la table (`jouee_le`), pas la dernière écriture.
- Ce que l'accueil appelait « La dernière compagnie » (héros de la dernière table sans table ouverte) disparaît : chaque carte montre
  ses héros.
