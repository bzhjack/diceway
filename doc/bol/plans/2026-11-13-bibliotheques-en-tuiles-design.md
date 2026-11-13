# Bibliothèques en tuiles — conception

Date : 2026-11-13. Statut : à valider.

## Pourquoi

Les bibliothèques des créatures, des démons, des PNJ et des héros sont des tableaux : une ligne par fiche, une colonne par
caractéristique (taille, rang, vitalité, attaque, défense, dégâts, protection, carrières, source…). Il y a trop d'informations à l'écran.
Les tuiles de la table (« En face », « La compagnie », `play/theatre/situation`) montrent l'essentiel : le portrait, le nom, le rang, la
sorte, la vitalité. Les portraits sont maintenant presque tous faits : les bibliothèques passent aux tuiles, le détail reste dans le statbloc.

## Objectifs

- Les quatre bibliothèques montrent leurs fiches en tuiles, dans le style de celles de la table : le portrait couvre la tuile, un dégradé
  sombre vers le bas porte le nom et le reste, le cœur de vitalité en bas à droite.
- Une seule apparence de tuile pour la table et les bibliothèques.
- On garde tout ce qui sert à trouver une fiche : la recherche, les filtres à gauche (source, scénario ; statut des héros), les filtres de la
  barre (rang, taille, catégorie, région), « Effacer les filtres », le tri.

## Hors périmètre

- Pas de bascule lignes / tuiles : le tableau disparaît.
- Rien ne change sur le statbloc, les formulaires, les filtres eux-mêmes, l'en-tête de page et son fond.
- Les armes et les armures gardent leur tableau (pas de portrait).

## Ce qui ferait rater le projet

- Une tuile chargée de chiffres : on reviendrait au problème du tableau.
- Perdre une action : ouvrir le statbloc, modifier, supprimer, l'édition avancée d'un héros en cours.
- Une tuile de bibliothèque qui ne ressemble plus à celle de la table.

## Approches

1. **Les tuiles remplacent le tableau** sur les quatre pages ; le tri passe dans une liste « Trier par ». **Retenue** par Lionel : « le
   tableau, y'a trop d'infos ».
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

- **Source** : une petite pastille « Mes fiches » en haut à gauche sur les fiches du compte ; rien sur celles du catalogue (le filtre de
  gauche suffit à les séparer). Les scénarios d'une fiche ne sont pas sur la tuile : le filtre « Scénario » les trouve.
- **Clic** sur la tuile : le statbloc, comme le clic sur le nom aujourd'hui. Toute la tuile est le bouton (comme à la table).
- **Modifier, Supprimer** (et « Édition avancée » d'un héros en cours) : un menu `⋯` en haut à droite de la tuile, seulement sur les fiches
  du compte. Bouton icône rond, `mat-menu`, au-dessus de la zone de clic du portrait.
- **Sans portrait** : l'initiale sur le fond bronze, comme à la table.
- **Taille** : celle des tuiles « En face » (portrait de 6,75 rem, environ 165 px de haut). Sur l'écran de référence (1440 × 704), la
  carte de contenu, à droite des filtres, tient 6 tuiles par rangée ; la liste défile dans la carte.

```
┌────────────┐ ┌────────────┐ ┌────────────┐
│MES FICHES ⋯│ │            │ │            │
│ [portrait] │ │            │ │            │
│ Loup géant │ │ Andrak     │ │ Hyène      │
│ CORIACE 🐾 ♥│ │ RIVAL 🐾  ♥│ │ PIÉT. 🐾  ♥│
└────────────┘ └────────────┘ └────────────┘
```

## Le tri et le compte

- Plus d'en-têtes de colonnes : une liste « Trier par » dans la barre d'outils, à droite des filtres. Options : Nom, Rang, Vitalité, plus
  celle de la page (Taille pour les créatures, Catégorie pour les démons, Région pour les PNJ ; Joueur et Statut pour les héros). Un bouton
  icône à côté inverse le sens (`aria-pressed`, flèche montante ou descendante). Ordre par défaut : nom croissant, comme aujourd'hui.
- Le nombre de fiches gardées, aujourd'hui dans l'en-tête de la colonne des actions, passe dans la barre (`dw-tag dwToolbarCount`),
  « Effacer les filtres » restant tout à droite quand un filtre est posé.

## Construction (choix de Claude)

- **Un composant de tuile partagé** dans `bol/shared/` (présentation seule : portrait, nom, ligne du dessous, cœur, pied de héros, et
  des emplacements projetés pour les coins : `×n`, point d'attitude, `⋯`, « Mes fiches »). La table (`situation`) l'adopte à son tour, pour
  garder une seule apparence ; ses comportements propres (glisser d'un camp à l'autre, popover de la vitalité d'un groupe, Ctrl + clic)
  restent dans `situation`.
- `BolLibraryRowsPageBase` garde le tri (clé, sens, `trierLes`) ; ce qui ne servait qu'aux en-têtes (`colonnes`, `aria-sort`) disparaît,
  remplacé par la liste des options de tri de la page. `bol-library-entete` est supprimé, ainsi que les styles du tableau dans
  `styles/_library-rows.scss` (`dw-lr-table`, `dw-lr-nom`, `dw-lr-portrait`, `dw-lr-actions`…) ; les filtres gardent les leurs.
- Une grille CSS (`repeat(auto-fill, minmax(…, 1fr))`) dans la carte de contenu, qui défile verticalement.
- Accessibilité : la grille est une liste (`ul`/`li`) ; chaque tuile a un nom accessible (« Loup géant, voir son statbloc ») ; le menu `⋯`
  dit de quelle fiche il s'agit ; la liste de tri a un libellé.
- Tests : les specs des quatre pages qui lisent des lignes de tableau passent aux tuiles ; la spec de `situation` reste verte.
- CLAUDE.md : le paragraphe « Library in rows » décrit les tuiles.

## Laissé au constructeur

Les noms des classes et du composant, la largeur minimale d'une tuile dans la grille, l'endroit exact de la liste de tri dans la barre.
