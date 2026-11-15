# Bibliothèques en tuiles — conception

Date : 2026-11-13. Statut : réalisé le 2026-11-13 ; la page et les filtres repris le 2026-11-15 (un en-tête sur toute la largeur, une
barre de filtres sur une ligne, plus de tri : voir « La page, les filtres et le compte »). Le plan d'implémentation, entièrement réalisé,
est supprimé le 2026-11-15 : il reste dans l'historique git. Ce qui fait foi aujourd'hui : le paragraphe « Library in tiles » de
`CLAUDE.md`.

## Pourquoi

Les bibliothèques des créatures, des démons, des PNJ et des héros sont des tableaux : une ligne par fiche, une colonne par
caractéristique (taille, rang, vitalité, attaque, défense, dégâts, protection, carrières, source…). Il y a trop d'informations à l'écran.
Les tuiles de la table (« En face », « La compagnie », `play/theatre/situation`) montrent l'essentiel : le portrait, le nom, le rang, la
sorte, la vitalité. Les portraits sont maintenant presque tous faits : les bibliothèques passent aux tuiles, le détail reste dans le statbloc.

## Objectifs

- Les quatre bibliothèques montrent leurs fiches en tuiles, dans le style de celles de la table : le portrait couvre la tuile, un dégradé
  sombre vers le bas porte le nom et le reste, le cœur de vitalité en bas à droite.
- Une seule apparence de tuile pour la table et les bibliothèques.
- On garde tout ce qui sert à trouver une fiche : la recherche, les filtres (source, scénario, rang, taille, catégorie, région ; statut et
  région des héros), « Effacer les filtres ». Le tri, gardé le 2026-11-13, est retiré le 2026-11-15 : les fiches sont rangées par nom.

## Hors périmètre

- Pas de bascule lignes / tuiles : le tableau disparaît.
- Rien ne change sur le statbloc et les formulaires. (Les filtres et l'en-tête de page, laissés tels quels le 2026-11-13, sont repris le
  2026-11-15.)
- Les armes et les armures gardent leur tableau (pas de portrait).

## Ce qui ferait rater le projet

- Une tuile chargée de chiffres : on reviendrait au problème du tableau.
- Perdre une action : ouvrir le statbloc, modifier, supprimer, l'édition avancée d'un héros en cours.
- Une tuile de bibliothèque qui ne ressemble plus à celle de la table.

## Approches

1. **Les tuiles remplacent le tableau** sur les quatre pages ; le tri passe dans une liste « Trier par » (retirée le 2026-11-15).
   **Retenue** par Lionel : « le tableau, y'a trop d'infos ».
2. Une bascule lignes / tuiles, mémorisée dans le navigateur : deux présentations à entretenir par page. Écartée.
3. Tuiles pour les créatures, démons et PNJ, tableau pour les héros : moins homogène. Écartée.

## La tuile

Le contenu, décidé avec Lionel : « juste les principales, comme sur la table ».

| Bibliothèque | Sous le nom | Cœur | En plus |
| --- | --- | --- | --- |
| Créatures | rang (pastille), icône de la sorte | vitalité | — |
| Démons | rang, icône de la sorte | vitalité | — |
| PNJ | rang, icône de la sorte | vitalité | — |
| Héros | joueur | vitalité, dans le pied | écusson d'héroïsme dans le pied ; « En cours » si le héros n'est pas actif |

Propositions (à corriger à la lecture) :

- **Source** : une petite pastille « Mes fiches » en haut à gauche sur les fiches du compte ; rien sur celles du catalogue (le filtre
  « Source » suffit à les séparer). Les scénarios d'une fiche ne sont pas sur la tuile : le filtre « Scénario » les trouve.
- **Clic** sur la tuile : le statbloc, comme le clic sur le nom aujourd'hui. Toute la tuile est le bouton (comme à la table).
- **Modifier, Supprimer** (et « Édition avancée » d'un héros en cours) : un menu `⋯` en haut à droite de la tuile, seulement sur les fiches
  du compte. Bouton icône rond, `mat-menu`, au-dessus de la zone de clic du portrait.
- **Sans portrait** : l'initiale sur le fond bronze, comme à la table.
- **Taille** : celle des tuiles « En face » (portrait de 6,75 rem, environ 165 px de haut). Sur l'écran de référence (1440 × 704), la
  grille, sur toute la largeur sous la barre des filtres, tient 6 à 7 tuiles par rangée ; elle défile seule, l'en-tête et la barre
  restent en place.

```
┌────────────┐ ┌────────────┐ ┌────────────┐
│MES FICHES ⋯│ │            │ │            │
│ [portrait] │ │            │ │            │
│ Loup géant │ │ Andrak     │ │ Hyène      │
│ CORIACE 🐾 ♥│ │ RIVAL 🐾  ♥│ │ PIÉT. 🐾  ♥│
└────────────┘ └────────────┘ └────────────┘
```

## La page, les filtres et le compte

Le 2026-11-13, une liste « Trier par » remplaçait les en-têtes de colonnes, les filtres restaient dans une colonne à gauche et le compte
passait dans la barre d'outils. Repris le 2026-11-15, après plusieurs séries de maquettes (planches « BL » puis « BF » de l'artefact
Design ; Lionel retient « BF-1, une ligne ») et le retrait du tri (« on peut retirer le tri », « dans les librairies ») :

- **La page tient dans l'écran** (`dw-lr-page`, `dw-lr-cadre`) : l'en-tête et la barre restent en place, seule la grille défile, dans son
  cadre. L'illustration est un fond fixe qui couvre l'écran (`bol-library-fond`).
- **L'en-tête**, sur toute la largeur (`header.dw-lr-entete`) : le titre et le total à gauche (« 84 PNJ ») ; à droite, créer et les deux
  bibliothèques voisines en contour, puis le retour en or, le dernier, à la même place que sur les autres écrans.
- **La barre**, sur une ligne (`bol-library-barre`) : la recherche, qui prend la place qui reste ; la source côte à côte
  (`bol-library-segments` : « Tous · Catalogue · Mes fiches », chacun avec son nombre ; le statut des héros de même) ; puis chaque autre
  filtre en liste (`bol-library-facette`) : un bouton qui dit son titre, ou sa valeur bordée d'or une fois choisie — pas de rappel
  ailleurs, pas de pastilles ; sa liste commence par « Tous… » avec le total, chaque option avec son nombre, une recherche au-delà de huit
  options (dix scénarios, une vingtaine de régions) ; un clic choisit et referme, un clic sur l'option choisie la retire. Ordre : la
  source, le scénario (absent tant qu'aucun scénario importé ne cite de fiche), puis le rang et le filtre propre à la page (taille,
  catégorie, région). Au bout : le compte (« 31 sur 84 PNJ ») et un bouton rond « Effacer les filtres » (infobulle), visible dès qu'un
  filtre est posé.
- **Pas de tri** : les fiches sont rangées par nom.
- Deux étapes intermédiaires, écartées depuis : tout dans la colonne de gauche, la recherche et les filtres, le rappel des filtres posés
  en pastilles au-dessus des tuiles (« BL-3 ») ; puis, le 2026-11-15, un bouton « Filtres » ouvrant un panneau, les filtres posés en
  pastilles (« BF-3 »).

## Construction (choix de Claude)

- **Un composant de tuile partagé** dans `bol/shared/` (présentation seule : portrait, nom, ligne du dessous, cœur, pied de héros, et
  des emplacements projetés pour les coins : `×n`, point d'attitude, `⋯`, « Mes fiches »). La table (`situation`) l'adopte à son tour, pour
  garder une seule apparence ; ses comportements propres (glisser d'un camp à l'autre, popover de la vitalité d'un groupe, Ctrl + clic)
  restent dans `situation`.
- `BolLibraryRowsPageBase` range les fiches par nom (`trierLes`, sur `nomDe`) ; ce qui ne servait qu'aux en-têtes (`colonnes`,
  `aria-sort`) disparaît, et le tri lui-même le 2026-11-15. `BolFichesPageBase` porte les filtres partagés (source, scénario, rang). `bol-library-entete` est supprimé, ainsi que les styles du tableau dans
  `styles/_library-rows.scss` (`dw-lr-table`, `dw-lr-nom`, `dw-lr-portrait`, `dw-lr-actions`…) ; les filtres gardent les leurs.
- Une grille CSS (`repeat(auto-fill, minmax(…, 1fr))`) sous la barre des filtres, qui défile verticalement.
- Accessibilité : la grille est une liste (`ul`/`li`) ; chaque tuile a un nom accessible (« Loup géant, voir son statbloc ») ; le menu `⋯`
  dit de quelle fiche il s'agit ; chaque filtre en liste dit son titre et sa valeur (« Rang : Coriace »), la source est un groupe de
  bascules (`aria-pressed`).
- Tests : les specs des quatre pages qui lisent des lignes de tableau passent aux tuiles ; la spec de `situation` reste verte.
- CLAUDE.md : le paragraphe « Library in tiles » décrit les tuiles, la page et la barre.

## Laissé au constructeur

Les noms des classes et du composant, la largeur minimale d'une tuile dans la grille.
