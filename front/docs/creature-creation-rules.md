# Regles de creation de creatures BOL

Ce document sert de reference locale pour le projet `front`.
Il resume les regles de creation de creatures visibles dans le livre de base et les implications utiles pour les ecrans `creature-create`.

Source principale :
- `Pdf BoL Mythic Livre de base VF 1.3.pdf`
- Chapitre 5 `Bestiaire de la Lemurie`
- section `Table des creatures`

Usage conseille :
- Quand on demande de "se recaler sur les regles de creation des creatures", relire ce fichier avant d'editer le code.
- Si ce fichier contredit l'implementation courante, la regle du livre prime sauf decision explicite du projet.

## Resume court

1. Base de creation :
- une creature se construit d'abord a partir de sa `taille`
- la table donne une base pour :
  - `degats`
  - `vitalite`
  - `vigueur`
  - `deplacement`
  - `ordre de reaction`
- cette base peut ensuite etre ajustee par le MJ

2. Attributs et combat :
- les creatures ont des attributs sauf `aura`
- elles ont aussi des aptitudes de combat
- leurs valeurs de combat incluent deja les modificateurs naturels de la creature

3. Regle importante de resolution :
- ne pas ajouter `agilite` aux jets d'attaque d'une creature
- ne pas ajouter `vigueur` aux jets de degats d'une creature
- ces bonus sont deja integres dans le profil

4. Capacites speciales :
- une creature peut recevoir des `avantages` et `desavantages`
- ils fonctionnent comme ceux des heros
- certaines creatures ont des capacites plus specifiques decrites directement dans leur profil

5. Protection :
- la protection d'une creature fonctionne comme une armure
- elle peut etre jouee en valeur variable ou en valeur fixe
- la valeur fixe entre parentheses est la reference la plus simple

## Table de base par taille

Reference :
- chapitre 5, `Table des creatures`, p. 109

Lecture projet :
- dans `front`, cette table correspond au referentiel `tailles`
- le choix de taille doit donc pre-remplir au minimum `vigueur`, `vitalite` et `degats`
- il est logique de laisser ensuite un ajustement manuel pour creer une version plus faible ou plus forte

Table extraite du livre :

| Taille | Ordre de reaction | Degats | Vitalite | Vigueur |
| --- | --- | --- | --- | --- |
| Minuscule | pietaille | `1` | `1` | `-3` |
| Tres petite | pietaille | `d3` | `2` | `-2` |
| Petite | coriace | `d6M` | `5` | `-1` |
| Moyenne | coriace | `d6` | `10` | `0` |
| Grande | rival | `d6B` | `20` | `4` |
| Tres grande | rival | `d6B` | `30` | `6` |
| Enorme | rival | `d6 x 2` | `40` | `8` |
| Massive | rival | `d6B x 2` | `50` | `10` |
| Colossale | rival | `d6B x 2` | `60` | `12` |
| Gigantesque | rival | `d6 x 3` | `70` | `14` |
| Immense | rival | `d6B x 3` | `85` | `16` |
| Monstrueuse | rival | `d6 x 4` | `100` | `18` |

Notes :
- `d6M` = lancer `2d6` et garder le moins bon
- `d6B` = lancer `2d6` et garder le meilleur
- les multiplicateurs `x2`, `x3`, `x4` s'appliquent au resultat du de

## Degats

Reference :
- chapitre 5, section `Attaques et degats`

Regles :
- en general, une creature fait `1` attaque par round
- les degats donnes representent l'effet global de l'attaque naturelle
- une creature particulierement feroce, puissante ou multi-attaques peut infliger les degats d'une taille superieure
- une creature particulierement placide peut infliger les degats d'une ou deux tailles inferieures
- la `vigueur` de la creature est deja comprise dans ses degats

Implication projet :
- dans le formulaire rapide, `degats` doit etre initialise par la taille
- si on modifie `vigueur`, cela ne doit pas recalculer automatiquement `degats` sans decision explicite, car le livre parle d'une base MJ et pas d'une formule stricte de re-synchronisation

## Protection

Reference :
- chapitre 5, section `Protection`

Regles :
- la protection d'une creature annule des degats comme une armure
- le MJ peut lancer le de de protection
- ou utiliser directement la valeur fixe entre parentheses

Implication projet :
- le champ `protection` du formulaire peut rester libre
- il n'existe pas dans la table de taille une formule unique obligatoire pour toutes les creatures

## Ordre de reaction et categorie tactique

Reference :
- chapitre 5, encadre sous la table des creatures

Regles :
- `minuscule` et `tres petite` = `pietaille`
- `petite` et `moyenne` = `coriace` avec `+0` initiative
- `grande` ou plus = `rival` avec `+0` initiative

Implication projet :
- si on expose un jour `ordre de reaction` ou un type tactique dans l'UI, il devrait etre derive de la taille par defaut

## Capacites speciales communes

Reference :
- chapitre 5, section `Capacites speciales`

Avantages cites dans le livre :
- `Attaque feroce` : de bonus aux jets d'attaque
- `Attaques multiples` : deux types d'attaque distincts
- `Attaque speciale` : mode d'attaque inhabituel
- `Attaque venimeuse` : effets de venin decrits dans le profil
- `Camouflage` : de bonus pour se cacher
- `Predateur` : de bonus pour pister une proie

Desavantages cites dans le livre :
- `Attaque timide` : de malus aux jets d'attaque
- `Deficience` : de malus si la creature doit utiliser un sens deficient

Implication projet :
- la liste backend des `capacites` devrait rester la source de verite
- les details textuels saisis dans `front` servent a preciser les exceptions et effets specifiques

## Ce qui semble regle par le livre vs libre MJ

Clairement regle :
- base par `taille`
- conventions de `degats`
- fait que `attaque` et `degats` incluent deja les modificateurs naturels
- categorie tactique par `taille`

Plutot laisse au MJ :
- ajuster un profil pour le rendre plus fort ou plus faible
- choisir la `protection`
- ajouter des capacites speciales
- choisir la description exacte des attaques

## Etat actuel recommande pour `front`

Pour la page `creature-create` actuelle :
- `taille` doit pre-remplir `vigueur`, `vitalite`, `degats`
- `attaque`, `defense`, `protection` et les `capacites` peuvent rester editables librement
- ne pas recalculer automatiquement les jets comme si on devait ajouter `agilite` ou `vigueur` a part

## References utiles du livre

- p. 108 : presentation generale des creatures
- p. 109 : `Table des creatures`
- p. 109 : `Capacites speciales`

## Regle de priorite projet

Si une future implementation force une formule trop rigide pour les creatures, garder en tete que le livre presente surtout une `base de creation MJ`, pas un systeme totalement ferme comme la creation de heros.
