# Regles de creation de demons BOL

Ce document sert de reference locale pour le projet `front`.
Il resume les regles de creation de demons visibles dans le livre de base et les implications utiles pour les ecrans `demon-create`.

Source principale :
- `Pdf BoL Mythic Livre de base VF 1.3.pdf`
- Chapitre 5 `Les Demons`
- section `Pouvoirs demoniaques`
- table de creation des demons

Usage conseille :
- Quand on demande de "se recaler sur les regles de creation des demons", relire ce fichier avant d'editer le code.
- Si ce fichier contredit l'implementation courante, la regle du livre prime sauf decision explicite du projet.

## Resume court

1. Les demons n'ont pas de carrieres.

2. Ils se repartissent en `3` categories :
- `demon mineur`
- `demon inferieur`
- `demon majeur`

3. La categorie fixe la base :
- points d'attributs
- points d'aptitudes de combat
- nombre de pouvoirs demoniaques
- vitalite de base
- degats de base
- ordre de reaction

4. Les demons peuvent avoir n'importe quelle taille ou apparence.

5. Les pouvoirs demoniaques remplacent la logique de carrieres.

## Table de base par categorie

Reference :
- chapitre 5, table de creation des demons, p. 130

Lecture projet :
- dans `front`, cette table correspond au referentiel `categories`
- le choix de categorie doit donc pre-remplir au minimum `vitalite` et `degats`
- la page peut aussi s'appuyer sur cette categorie pour controler le nombre de pouvoirs choisis

| Categorie | Ordre de reaction | Attributs | Combat | Pouvoirs | Vitalite de base | Degats |
| --- | --- | --- | --- | --- | --- | --- |
| Demon mineur | pietaille | `2 points` | `2 points` | `1` | `10` | `d6M` |
| Demon inferieur | coriace | `6 points` max `4` dans un attribut | `6 points` max `4` dans une aptitude | `2` | `20` | `d6` |
| Demon majeur | rival | `12 points` max `6` dans un attribut | `12 points` max `6` dans une aptitude | `4` | `30` | `d6B` |

Formules detaillees donnees dans le texte :
- demon mineur :
  - `vitalite = 10 + vigueur`
  - `degats = d6M + vigueur`
- demon inferieur :
  - `vitalite = 20 + vigueur`
  - `degats = d6 + vigueur`
- demon majeur :
  - `vitalite = 30 + vigueur`
  - `degats = d6B + vigueur`

## Attributs

Reference :
- chapitre 5, `Les Demons`

Regles :
- demon mineur : `2` points a repartir
- demon inferieur : `6` points a repartir, max `4` dans un attribut
- demon majeur : `12` points a repartir, max `6` dans un attribut

Regle speciale :
- il est possible de diminuer un ou deux attributs en dessous de `0`
- minimum `-2`
- les points recuperes peuvent etre reaffectes aux autres attributs

Implication projet :
- si on veut un jour verrouiller le formulaire demon sur les regles du livre, il faut un validateur different selon la categorie
- la page rapide actuelle reste plus libre que le livre

## Aptitudes de combat

Reference :
- chapitre 5, `Les Demons`

Regles :
- demon mineur : `2` points
- demon inferieur : `6` points, max `4` dans une aptitude
- demon majeur : `12` points, max `6` dans une aptitude

Champs utilises dans `front` :
- `melee`
- `tir`
- `defense`

Point d'attention :
- le livre parle d'`aptitudes de combat`, mais la page `front` ne modelise pas explicitement une somme ou un plafond selon la categorie

## Vitalite et degats

Reference :
- chapitre 5, `Les Demons`

Regles :
- la base depend de la categorie
- `vigueur` s'ajoute ensuite a la vitalite et aux degats

Implication projet :
- contrairement aux creatures, ici le texte donne une vraie formule
- si l'utilisateur change `vigueur`, une version strictement conforme devrait recalculer `vitalite` et `degats`
- aujourd'hui, la page rapide pre-remplit surtout depuis la categorie puis laisse l'edition libre

## Pouvoirs demoniaques

Reference :
- chapitre 5, `Pouvoirs demoniaques`

Nombre de pouvoirs :
- demon mineur : `1`
- demon inferieur : `2`
- demon majeur : `4`

Pouvoirs cites dans le livre :
- `Armes ameliorees` : de bonus a tous les jets d'attaque
- `Armure` : protection `d6-2 (2)`
- `Attaques devastatrices` : degats d'une categorie superieure sur la table des creatures
- `Chair malleable` : deformation, infiltration, difficile a entraver
- `Cuirasse` : protection `d6 (4)`, compte pour `2` pouvoirs
- `Faculte de parole`
- `Forme humaine`
- `Intangible`
- `Poison`
- `Regeneration`
- `Savoir special` : une carriere au rang `6`
- `Seducteur`
- `Sorcellerie` : points de pouvoir selon la categorie
- `Telepathie`
- `Vulnerabilite` : donne un pouvoir supplementaire en echange d'une faiblesse
- `Progeniture`

Implications projet importantes :
- le nombre de pouvoirs devrait etre borne par la categorie
- `Cuirasse` vaut `2` pouvoirs, donc une simple liste `1 entree = 1 slot` n'est pas completement fidele
- `Vulnerabilite` donne un pouvoir supplementaire, donc elle modifie aussi le budget
- certains pouvoirs changent des ressources ou des regles de jeu, pas seulement un texte descriptif

## Taille et apparence

Reference :
- chapitre 5, `Les Demons`

Regles :
- les demons peuvent avoir n'importe quelle `taille`
- ils peuvent avoir n'importe quelle `apparence`

Implication projet :
- la categorie demoniaque n'impose pas la taille visuelle
- la page rapide n'a pas besoin d'un select `taille` pour rester compatible avec le livre

## Invocation et controle

Reference :
- chapitre 5 `Invoquer des demons`

Regles utiles a conserver en tete :
- invoquer :
  - demon mineur = sort du premier cercle
  - demon inferieur = sort du deuxieme cercle
  - demon majeur = sort du troisieme cercle
- ensuite il faut :
  - soit `lier` le demon avec un autre sort
  - soit passer un `pacte`
- sinon le demon est hors de controle

Remarque projet :
- ce n'est pas une regle de construction du profil brut
- mais c'est utile si on ajoute plus tard du contexte narratif ou des fiches d'invocation

## Etat actuel recommande pour `front`

Pour la page `demon-create` actuelle :
- `categorie` doit pre-remplir au minimum `vitalite` et `degats`
- il serait pertinent de rajouter plus tard :
  - un warning sur le nombre de pouvoirs selon la categorie
  - une gestion speciale de `Cuirasse`
  - une gestion speciale de `Vulnerabilite`
- le reste peut rester editable librement tant qu'on assume une version `rapide` plutot que `strictement reglee`

## References utiles du livre

- p. 128-130 : categories de demons et pouvoirs demoniaques
- p. 130 : table de creation des demons

## Regle de priorite projet

Si une future implementation veut devenir strictement conforme au livre, les points les plus importants a ajouter seront :
- validation du budget d'attributs selon la categorie
- validation du budget de combat selon la categorie
- validation du nombre reel de pouvoirs en tenant compte de `Cuirasse` et `Vulnerabilite`
- recalcul derive `vitalite / degats` a partir de `vigueur`
