# Poste de table — la session comme page d'accueil

Date : 2026-10-02
Statut : design validé en conversation, en attente de relecture de cette spec
Dossier de réflexion (trois pistes maquettées) : https://claude.ai/artifact/7nbLd4f7krxzhZVQ7VpkWX

## Contexte

Le MJ trouve l'interface trop complexe et le tableau de bord chargé. Constat
relevé dans le code :

- Le dashboard (`bol/workspace/`) empile une carte d'en-tête explicative, une
  rangée de métriques et six ou sept cartes d'action de même poids. « Reprendre
  la session », le geste principal, est une carte parmi les autres.
- L'en-tête de session (`session-header`) porte des raccourcis vers les
  bibliothèques : chacun fait quitter la table.
- En mode `libre`, seuls les héros peuvent être posés sur la carte
  (`lockKind: 'hero'` dans `session-play-page.ts`). PNJ, créatures et démons
  n'arrivent qu'au démarrage d'un combat.
- Le jet d'action (`action-roll-dialog`) est un assistant en trois étapes
  affiché dans un panneau à onglets Fiche / Jet (`hero-action-panel`).

## Objectif

Tout piloter depuis la table (battlemap) : gérer héros, PNJ, créatures et
démons, et lancer les jets d'action, sans navigation et sans perdre de règle.

Ce chantier est le premier de trois. Les deux suivants auront leur propre spec :

1. **Poste de table** (cette spec).
2. **Scènes** : un cinquième onglet de la réserve, scènes optionnelles,
   créables par « enregistrer la table actuelle comme scène ».
3. **Barre de commande** : accélérateur clavier par-dessus le poste de table.

## Hors périmètre

- Le déroulement du combat (initiative, attaques, dégâts, `start-combat-dialog`,
  `attack-menu`, `attack-roll-dialog`) : inchangé, à une exception décrite dans
  « Backend ».
- Les scènes et les scénarios (chantier 2). La réserve doit seulement pouvoir
  accueillir un onglet supplémentaire.
- Le jet d'action pour PNJ, créatures et démons : demande une vérification des
  règles (`doc/rules/`), ajout séparé.
- Le contenu des formulaires et des pages de bibliothèque.

## Décisions de conception

- **La table est la page d'accueil.** Le dashboard est supprimé, pas allégé.
- **Les contenus viennent à la table.** La réserve remplace les bibliothèques
  pour l'usage en partie ; les pages de bibliothèque restent pour la gestion.
- **Formulaires en pages pleines.** Ils sont denses ; on les garde tels quels,
  avec retour direct à la table via le mécanisme `returnUrl` existant
  (`core/return-url.util.ts`).
- **Tous les types sont posables en mode libre.** Le backend l'accepte déjà
  (`addCombatant` ne dépend pas du statut) ; seule la restriction front tombe.
- **Aucune règle retirée du jet d'action.** La logique de calcul est conservée,
  seule la présentation change.
- **Material et primitives existantes** : `MatSidenav`, `dw-value-stepper`,
  `dw-collapsible-row`, `bol-statblock`. Pas de nouveau langage visuel.

## Navigation

### Route `/`

`/` charge un composant d'aiguillage qui lit les sessions
(`BolFightSessionService.fightSessions()`, triées par date décroissante côté
backend) :

- une session `libre` ou `combat` existe → redirection vers
  `/session/:id/play` de la plus récente ;
- sinon → affichage du **seuil**.

### Seuil (remplace `session/new` et le dashboard)

Une page courte, sans carte d'en-tête ni métriques :

- sélection des héros présents (réutilise `CombatSelectionService` et le
  `combatant-picker-dialog` verrouillé sur les héros) ;
- bouton primaire « Ouvrir la table » → crée la session, navigue vers la table ;
- en dessous, la liste des sessions existantes (reprendre, supprimer), reprise
  de `session-library-page`.

`session/new` redirige vers `/`. `library/sessions` est conservée et sert aussi
de cible à « Changer de session ».

### Barre du haut de la table

`session-header` est simplifié :

- gauche : titre de la session (plus de flèche « retour au dashboard ») ;
- droite : « Démarrer un combat » / « Terminer le combat » (inchangé), puis un
  menu compte (`MatMenu`) : Changer de session, Intendance, Déconnexion.
- les raccourcis de bibliothèque et le bouton « Ajouter un héros » sont retirés
  (la réserve les remplace).

### Suppressions

- `bol/workspace/` (page, header, metrics, quick-actions) et
  `bol-dashboard.service.ts` / `bol-dashboard.model.ts` s'ils ne sont plus
  référencés.
- Les boutons « Retour au dashboard » des pages de bibliothèque deviennent
  « Retour à la table » (même cible `/`).

## La table en trois zones

`session-play-page` passe d'un empilement vertical à un `MatSidenavContainer`
à deux tiroirs latéraux en mode `side`, repliables. L'état ouvert/replié de
chaque tiroir est mémorisé dans `localStorage`.

### Réserve (gauche) — nouveau composant `bol-reserve`

- Onglets : Héros / PNJ / Créatures / Démons. La liste d'onglets est une donnée
  (tableau), pour qu'un onglet Scènes s'ajoute au chantier 2 sans refonte.
- Champ de recherche filtrant l'onglet actif par nom.
- Une ligne par entrée : pastille de couleur du type, nom, puis :
  - « à table » si le héros ou le PNJ est déjà dans la session (un héros ou un
    PNJ n'y figure qu'une fois, règle existante) ;
  - sinon un bouton « poser ». Pour créatures et démons, « poser » ajoute un
    exemplaire (`qty = 1`) et peut être répété, ces types étant des gabarits
    ré-instanciables ; le résultat sur la carte est celui que produit
    aujourd'hui l'ajout de combattant, sans changement backend.
- Pied : « Créer un … » (formulaire du type de l'onglet, `returnUrl` = table)
  et « Gérer la bibliothèque » (page de bibliothèque du type).
- Source de données : le catalogue de `CombatSelectionService`
  (`loadCatalog()`), déjà utilisé par `add-combatant-dialog`.
- « Poser » appelle `BolFightSessionService` (ajout de combattant) puis
  recharge la session, comme `add-combatant-dialog` aujourd'hui. Camp par
  défaut inchangé : `heros` pour un héros, `adversaires` sinon.
- Erreur d'ajout (doublon, réseau) : snackbar avec le message de l'API, la
  ligne revient à son état précédent.

`add-combatant-dialog` reste utilisé en mode `combat` (ruban d'initiative). En
mode `libre`, il n'est plus ouvert.

### Carte (centre)

`bol-battlemap` inchangé. Clic sur un jeton = sélection (ouvre la fiche du
jeton), glisser = déplacement. La sélection est un signal `selectedKey` porté
par la page ; le jeton sélectionné reçoit un anneau doré.

### Fiche du jeton (droite) — nouveau composant `bol-token-inspector`

Remplace `hero-action-panel` (onglets Fiche / Jet) et, en mode libre, les
dialogues de statbloc des non-héros.

Contenu pour un **héros** :

1. Nom, carrières.
2. Ressources : vitalité de session et héroïsme, en `dw-value-stepper`
   (mêmes écritures qu'aujourd'hui : pivot de session pour la vitalité,
   `BolHeros.ressources.heroisme` pour l'héroïsme).
3. Jet d'action (voir section suivante).
4. « Fiche complète » : ouvre le statbloc existant (`hero-statblock-dialog`).

Contenu pour un **PNJ, une créature ou un démon** :

1. Nom, rang.
2. Vitalité en stepper (par exemplaire pour un lot `qty > 1`).
3. Statbloc existant (`bol-statblock`) intégré dans le panneau.
4. « Retirer de la table » (avec confirmation `dw-confirm-dialog`).

Aucun jeton sélectionné : le panneau est replié.

En mode `combat`, le comportement actuel des jetons (menu d'attaque, dialogues
de statbloc) n'est pas modifié ; la fiche du jeton ne s'ouvre qu'en mode libre.

### Bandeau « Dernier jet »

Une ligne sous la carte : nom, formule, total, résultat. Alimenté par un signal
de la page mis à jour à chaque jet. Vide tant qu'aucun jet n'a été lancé (le
bandeau n'est pas affiché).

## Jet d'action en une surface

Nouveau composant `bol-action-roll-panel`, affiché dans la fiche du jeton. Il
remplace la présentation en trois étapes de `action-roll-dialog`.

- La logique de calcul existante (attribut, carrière, difficulté, dés
  bonus/malus par trait, modificateur, malus d'équipement, héroïsme) est
  extraite de `action-roll-dialog.ts` dans un fichier utilitaire pur, testé
  seul, puis consommée par le nouveau composant. `action-roll-dialog` est
  supprimé une fois le nouveau composant en place.
- Présentation :
  - attribut : quatre puces (Vigueur, Agilité, Esprit, Aura) avec leur valeur ;
  - carrière : puces « Aucune » + carrières du héros ;
  - difficulté : une réglette unique des huit niveaux, **Moyenne par défaut** ;
  - dés et ajustements : puces de traits (dé bonus / dé malus, domaine en
    infobulle), modificateur ±, malus d'équipement affiché automatiquement ;
  - pied : formule en clair (`2d6 + 2 + 1 − 1 ≥ 9`) et bouton « Lancer ».
- Les dés 3D (`shared/dice-3d`) sont conservés. Le résultat alimente le bandeau
  « Dernier jet ».
- Les options d'héroïsme proposées après le jet restent celles d'aujourd'hui.
- Changer de jeton sélectionné réinitialise la surface (attribut, carrière,
  difficulté, ajustements), comme le fait aujourd'hui la recréation du panneau.

## Backend

Un seul changement, dans `BolFightSessionService::endCombat` :

- aujourd'hui, la fin de combat supprime tous les pivots créature, démon et PNJ
  de la session ;
- avec des personnages posés en mode libre, cela viderait la table. La fin de
  combat **ne supprime plus aucun pivot**. Elle remet `statut = 'libre'`,
  `ordre_manuel = null` et `initiative_resultat = null` sur les héros, comme
  aujourd'hui. Le MJ retire les vaincus à la main depuis la fiche du jeton.

Conséquence côté front : le message de confirmation de fin de combat ne doit
plus annoncer le retrait des adversaires.

Aucun nouvel endpoint, aucune migration.

## Accessibilité

- Tiroirs : boutons de repli avec `aria-expanded` et libellé explicite.
- Onglets de la réserve : `MatTabNav` ou `MatButtonToggleGroup`, navigables au
  clavier ; la liste est un `role="list"`.
- Puces du jet : boutons avec `aria-pressed` ; la réglette de difficulté est un
  groupe radio.
- Le résultat du jet est annoncé via une région `aria-live="polite"` (le
  bandeau « Dernier jet »).
- Contraste WCAG AA sur les tokens existants ; AXE sans erreur sur la table.

## Tests

- **Vitest** :
  - utilitaire de calcul du jet : formule, valeurs par défaut, dés bonus/malus,
    malus d'équipement (reprend et étend `action-roll-dialog.spec.ts`) ;
  - `bol-reserve` : filtre par onglet et par recherche, état « à table » pour
    héros et PNJ déjà présents, émission de la pose ;
  - aiguillage de `/` : session ouverte → redirection, sinon seuil.
- **PHPUnit** : test de `endCombat` (les pivots non-héros sont conservés, le
  statut repasse à `libre`). Il n'existe pas encore de test de fight-session ;
  ce sera le premier.
- **Visuel** (skill `run`, Playwright, utilisateur de test) : table avec les
  deux tiroirs ouverts, repliés, et à largeur 1280 px.
- `npm run build` côté front pour valider.
