# Regles de creation de heros BOL

Ce document sert de reference locale pour le projet `front`.
Il resume les regles de creation de heros a respecter dans l'UI, en priorite pour l'editeur avance.

Source principale :
- `Pdf BoL Mythic Livre de base VF 1.3.pdf`
- Chapitre 2 `Creer un heros`

Usage conseille :
- Quand on demande de "se recaler sur les regles de creation", relire ce fichier avant d'editer le code.
- Si ce fichier contredit l'implementation courante, la regle du livre prime sauf decision explicite du projet.

## Resume court

1. Attributs :
- 4 points a repartir entre `vigueur`, `agilite`, `esprit`, `aura`
- maximum `3` a la creation
- on peut descendre une seule valeur a `-1` pour gagner `+1` point a repartir

2. Aptitudes de combat :
- 4 points a repartir entre `initiative`, `melee`, `tir`, `defense`
- maximum `3` a la creation
- on peut descendre une seule aptitude a `-1` pour gagner `+1` point a repartir

3. Carrieres :
- choisir `4` carrieres
- repartir `4` points entre elles
- rang minimum `0`
- rang maximum `3` a la creation

4. Langues :
- un heros parle toujours le `lemurien`
- il parle aussi sa langue natale
- si sa region parle deja le lemurien, il choisit une autre langue en plus
- il gagne ensuite un nombre de langues supplementaires egal a `esprit`
- il gagne encore des langues supplementaires selon le rang d'une carriere pertinente

5. Traits regionaux :
- le 1er avantage est gratuit et doit venir de la region d'origine
- un 2e avantage est possible contre :
  - un desavantage regional
  - ou la perte definitive de `1` point d'heroisme
- un 3e avantage est possible contre :
  - un autre desavantage general
  - ou la perte definitive de `1` autre point d'heroisme

6. Ressources de creation :
- `vitalite = 10 + vigueur`
- `heroisme = 5` au depart
- `pouvoir` depend de `sorcier`
- `foi` depend de `pretre`
- `creation` depend de `alchimiste`

## Details par bloc

## Attributs

Reference :
- chapitre 2, section `Attributs`

Regles :
- somme de creation = `4`
- une seule baisse a `-1`
- pas de valeur > `3` a la creation

Impacts utiles :
- `vitalite = 10 + vigueur`
- les degats de melee utilisent `vigueur`
- les degats de tir utilisent `vigueur / 2`, arrondi a l'inferieur

## Aptitudes de combat

Reference :
- chapitre 2, section `Aptitudes de combat`

Regles :
- somme de creation = `4`
- une seule baisse a `-1`
- pas de valeur > `3` a la creation

Champs :
- `initiative`
- `melee`
- `tir`
- `defense`

## Carrieres

Reference :
- chapitre 2, section `Carrieres heroiques`

Regles generales :
- exactement `4` carrieres
- somme des rangs = `4`
- rang de creation entre `0` et `3`

Regles speciales connues :
- `Alchimiste` : pour chaque rang au-dessus de `2`, prendre `1` desavantage
- `Sorcier` : pour chaque rang au-dessus de `1`, prendre `1` desavantage

## Langues

Reference :
- chapitre 2, section `Langues`
- resume de creation p. 54

Base :
- `lemurien`
- `+ langue natale`
- si la langue natale est deja le `lemurien`, choisir une autre langue

Supplement :
- `+ esprit`
- `+ rang dans une carriere pertinente`

Carrieres pertinentes pour les langues :
- `Alchimiste`
- `Marchand`
- `Medecin`
- `Menestrel`
- `Noble`
- `Pretre`
- `Scribe`
- `Sorcier`

Points particuliers :
- sauf `illetre`, le heros lit et ecrit les langues qu'il parle
- exception : le `demonique` demande un apprentissage separe oral / ecrit

## Traits regionaux

Reference :
- chapitre 2, section `Traits`
- resume de creation p. 54

Structure attendue :
- 1 avantage regional obligatoire et gratuit
- 2e avantage :
  - soit `1` desavantage regional
  - soit `-1 heroisme`
- 3e avantage :
  - soit `1` autre desavantage general
  - soit `-1 heroisme`

Important :
- la creation standard ne doit pas depasser `3` avantages
- les desavantages de carriere ne remplacent pas automatiquement les desavantages de creation regionale

## Heroisme

Reference :
- chapitre 2, section `Points d'heroisme`

Regles :
- valeur initiale normale : `5`
- peut descendre a `4` ou `3` si on compense des avantages supplementaires

Interpretation projet :
- le cout d'heroisme a la creation ne doit pas etre calcule en simple formule globale
- il doit suivre la sequence du livre :
  - 1er avantage gratuit
  - 2e avec desavantage regional ou -1 heroisme
  - 3e avec desavantage general ou -1 heroisme

## Ressources derivees

Reference :
- resume de creation p. 54

Formules de base :
- `vitalite = 10 + vigueur`
- `heroisme = 5 - cout_eventuel_des_avantages`
- `pouvoir` : lie a `Sorcier`
- `foi` : lie a `Pretre`
- `creation` : lie a `Alchimiste`

Convention projet actuelle pour l'editeur avance :
- le bloc `Ressources` est `readonly / calcule`
- si l'utilisateur veut un ajustement manuel libre, il passe par l'ecran de creation/modification rapide

## Contraintes regionales de carrieres

Ces regles sont explicites dans le livre et doivent etre controlees au minimum par warning.

Regles actuellement identifiees :
- `Desert de Beshaar` : premiere carriere = `Barbare`
- `Iles du Crane` : une carriere doit etre `Marin`
- `Montagnes de l'Axos` : premiere carriere = `Barbare`
- `Valgard` : une carriere doit etre `Barbare`

Cas particulier céruleen / `Plaines de Klaar` :
- premiere carriere = `Barbare`
- la deuxieme carriere est en pratique souvent `Marchand`
- carrieres interdites :
  - `Alchimiste`
  - `Medecin`
  - `Scribe`
  - `Sorcier`

Points a garder en tete :
- `Parsool` : un personnage y prendra souvent `Marin`, mais le texte est moins strict
- `Zalut` : certaines carrieres sont tres attendues, mais pas strictement exclusives dans le texte

## Cas speciaux non encore completes partout

Ces points existent dans le livre mais ne sont pas forcement entierement modelises dans `front` :
- branche `Kalukan` pour la `Cote de Feu`
- cas racial `ceruleen`
- distinction lecture / ecriture du `demonique`
- desavantage `illetre`

## References utiles du livre

- p. 12-16 : attributs, aptitudes de combat, traits, vitalite, heroisme
- p. 24+ : carrieres heroiques
- p. 46 : langues
- p. 54 : resume de creation d'un heros

## Regle de priorite projet

Si on doit arbitrer entre :
- simplification UI
- implementation existante
- regle du livre

Alors l'ordre par defaut est :
1. regle du livre
2. decision explicite du projet
3. implementation existante
