# Regles de creation de heros BOL

Ce document sert de reference locale pour le projet `front`.
Il resume les regles de creation de heros a respecter dans l'UI, en priorite pour l'editeur avance.

Source principale :
- `Pdf BoL Mythic Livre de base VF 1.3.pdf`
- Chapitre 2 `Creer un heros`
- Mise a jour Mythic+ (`doc/pdf-text/07-maj-mythic-plus.txt`) : prime sur le livre de base la ou elle change une regle (voir `Ajouts Mythic+`)

Usage conseille :
- Quand on demande de "se recaler sur les regles de creation", relire ce fichier avant d'editer le code.
- Si ce fichier contredit l'implementation courante, la regle du livre prime sauf decision explicite du projet.

## Resume court

1. Attributs :
- 4 points a repartir entre `vigueur`, `agilite`, `esprit`, `aura`
- maximum `3` a la creation pour les points repartis ; un avantage d'attribut ajoute `+1` par-dessus, d'ou un depart a `4` : `Savant` (esprit), `Agilite de l'homme-oiseau`, `Vigueur ceruleenne`, Mythic+ `Prestance` (aura), voir `Attributs`
- on peut descendre une seule valeur a `-1` pour gagner `+1` point a repartir

2. Aptitudes de combat :
- 4 points a repartir entre `initiative`, `melee`, `tir`, `defense` (`2` avec le desavantage `Non-combattant`, p. 45)
- maximum `3` a la creation
- on peut descendre une seule aptitude a `-1` pour gagner `+1` point a repartir

3. Carrieres :
- choisir `4` carrieres
- repartir `4` points entre elles (`6` avec le desavantage `Non-combattant`, p. 45)
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
- une seule baisse a `-1`, avec l'accord du MJ (p. 13 ; aucun accord requis pour une aptitude de combat, p. 15)
- pas de valeur > `3` a la creation pour les points repartis ; le bonus d'un avantage d'attribut s'ajoute ensuite (`Savant`, `Agilite de l'homme-oiseau`, `Vigueur ceruleenne` p. 40/43, Mythic+ `Prestance` ci-dessous), d'ou un depart a `4`

Mythic+ :
- `Prestance` : `+1` a l'`aura`
- score maximum en `aura` : `6` au lieu de `5`
- score de depart maximum en `aura` : `4` au lieu de `3`

Impacts utiles :
- `vitalite = 10 + vigueur`
- les degats de melee utilisent `vigueur`
- les degats de tir utilisent `vigueur / 2`, arrondi a l'inferieur
- avec `vigueur < 0` : pas d'armure lourde (p. 52), pas d'arme lourde `d6B` (p. 63) ; le materiel de depart (armes, armure) se choisit avec l'accord du MJ (etape 8, p. 54) ; dans le front, un avertissement (non bloquant) sur les panneaux Armes et Armures (`armureLourdeInterdite`, `create.validators.ts`)

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
- sauf `illetre`, le heros lit et ecrit les langues qu'il parle, a condition qu'elles aient une forme ecrite (aucune pour l'`argot des mers`, le `ceruleen`, le `grooth`)
- exception : le `demonique` demande un apprentissage separe oral / ecrit
- `illetre` : ne sait ni lire ni ecrire (p. 44) et ne peut pas choisir une carriere exigeant d'etre lettre : `Scribe`, `Medecin`, `Alchimiste`, `Pretre`, etc. (p. 47, liste non exhaustive) ; dans le front, un warning de carriere pour `Scribe`, `Medecin`, `Pretre`, `Alchimiste` et `Sorcier` (`CARRIERES_LETTREES`, `bol-rules.constants.ts` ; `carrieresLettreesPourIllettre`)

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

## Ajouts Mythic+

Reference :
- `doc/pdf-text/07-maj-mythic-plus.txt`

Avantages et desavantage :
- `Prestance` : `+1 aura`, plafond d'aura releve (voir `Attributs`)
- `Maitre artisan` : exige la carriere `Forgeron`
- `Envoutant` : exige la carriere `Tentatrice`
- `Mefiance envers les inconnus` (desavantage) : a interpreter en jeu, sans effet chiffre

Armes regionales :
- l'arc de guerre de Tyrus, la fronde de l'Axos, la hache d'abordage de Parsool, le khastok, le kriss et l'epee valgardienne sont des armes regionales
- `Arme favorite` : seul un heros de meme origine regionale que l'arme peut la choisir

## Heroisme

Reference :
- chapitre 2, section `Points d'heroisme`

Regles :
- valeur initiale normale : `5`
- peut descendre a `4` ou `3` si on compense des avantages supplementaires
- puis `+1` avec `Marque par les dieux`, `-1` avec `Maudit` (voir `Ressources derivees`)

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
- `vitalite = 10 + vigueur` (bonus de `Vigueur ceruleenne` compris), `+2` avec `Dur a cuire`, `-2` avec `Chetif`
- `heroisme = 5 - cout_eventuel_des_avantages`, `+1` avec `Marque par les dieux`, `-1` avec `Maudit`
- `pouvoir = 10 + rang de Sorcier`, `+2` avec `Pouvoir du Neant`
- `foi` : reserve maximale = rang de `Pretre` ou `Druide` (1 point par heure de devotion, p. 146)
- `creation` : points de creation = rang d'`Alchimiste` entre deux aventures (5 au plus, non cumulables) ; au depart, seulement si le MJ l'autorise, pour une preparation complete (p. 139)

Convention projet actuelle pour l'editeur avance :
- le bloc `Ressources` est `readonly / calcule`
- si l'utilisateur veut un ajustement manuel libre, il passe par l'ecran de creation/modification rapide

## Contraintes regionales de carrieres

Ces regles sont explicites dans le livre et doivent etre controlees au minimum par warning.

Regles actuellement identifiees :
- `Desert de Beshaar` : premiere carriere = `Barbare`
- `Iles du Crane` : une carriere doit etre `Marin (matelot/pirate)`
- `Montagnes de l'Axos` : premiere carriere = `Barbare`
- `Valgard` : une carriere doit etre `Barbare`
- `Satarla` : pas de `Mendiant` au depart (p. 21)
- `Pilote des airs` : reserve aux Satarlans (p. 21) ; dans le front, `CARRIERES_RESERVEES` (`bol-rules.constants.ts`)

Cas particulier céruleen / `Plaines de Klaar` :
- premiere carriere = `Barbare`
- la deuxieme carriere est en pratique souvent `Marchand`
- carrieres interdites :
  - `Alchimiste`
  - `Medecin`
  - `Scribe`
  - `Sorcier`
- source : p. 21 ; la p. 91 (options raciales) ne cite que `Alchimiste` et `Sorcier` : on garde les 4 de la p. 21 (choix du 2026-11-02)

Points a garder en tete :
- `Parsool` : un personnage y prendra souvent `Marin`, mais le texte est moins strict
- `Zalut` : certaines carrieres sont tres attendues, mais pas strictement exclusives dans le texte
- `Malakut` : « de fortes chances » que la premiere carriere soit `Voleur` (p. 19)
- `Oomis` : le heros prendra « souvent » `Marchand` en premiere carriere (p. 21)
- `Tyrus` : les sorciers y sont proscrits (p. 22, 37) ; le livre n'en fait pas une regle de creation et ne dit pas si un heros de Tyrus peut etre `Sorcier` : a trancher, au plus un warning

## Races jouables (p. 90-95)

Avec l'accord du MJ ; non modelisees dans l'app (voir `doc/rules/01-creation-heros.md`).

Regles :
- chaque race a sa propre liste d'avantages et de desavantages ; a la creation, on ne choisit que dans cette liste, la liste generale ne s'ouvre qu'en depensant des points d'experience (p. 90)
- `kalukan` : 1re carriere `Esclave`, 2e `Garde` (soldat) ou `Ouvrier` ; ni `Menestrel`, ni `Marchand`, ni `Courtisan` ; desavantage `muet` automatique (p. 93)
- `grooth` : carrieres de depart limitees a `Barbare`, `Dresseur`, `Esclavagiste`, `Gladiateur`, `Chasseur`, `Guerrier`, `Chaman` (pretre), `Esclave`, `Ouvrier` ; desavantage `illetre` automatique (p. 91)
- `ceruleen` : carrieres interdites, voir `Contraintes regionales de carrieres`

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
- p. 90-95 : races jouables

## Regle de priorite projet

Si on doit arbitrer entre :
- simplification UI
- implementation existante
- regle du livre

Alors l'ordre par defaut est :
1. regle du livre
2. decision explicite du projet
3. implementation existante
