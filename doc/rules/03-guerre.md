# Guerre terrestre et navale

Pages source principales: p. 67-81

## Guerre terrestre

### Marche et logistique

Repere de deplacement:

- Infanterie entrainee sur route: `4 km/h`
- Infanterie entrainee hors route: `1,5 km/h`
- Grande armee avec bagages: `18 a 22 km/jour`
- Marche forcee sur quelques jours: `30+ km/jour`
- Petites forces ou troupes montes: environ le double, voire plus sur courte duree

### Valeur d'armee

Principe:

- Pour chaque categorie, seul le camp avantage gagne le bonus correspondant.
- Exception `commandement`: les deux camps ajoutent le rang de `soldat` de leur commandant.

| Categorie | Bonus |
| --- | --- |
| Entrainement legerement superieur | `+1` |
| Entrainement nettement superieur | `+2` |
| Taille moderement superieure | `+1` |
| Taille nettement superieure | `+2` |
| Superiorite numerique ecrasante | `+4` |
| Terrain favorable | `+1` |
| Terrain tres favorable | `+2` |
| Terrain ecrasant | `+4` |
| Equipement ou ravitaillement meilleurs | `+1` |
| Equipement ou ravitaillement nettement meilleurs | `+2` |
| Armee de Satarla avec nefs volantes | `+2` supplementaires possibles |
| Soutien d'un sorcier de 2e cercle | `+2` |
| Soutien d'un sorcier de 3e cercle | `+4` |
| Commandement | ajouter le rang de `soldat` du chef |

### Jet de bataille

Chaque round de bataille:

`2d6 + valeur de l'armee des heros - valeur de l'armee ennemie - 7`

Interpretation:

- Le resultat, meme negatif, correspond aux points de victoire gagnes ou perdus ce round.
- La bataille commence a `0`.
- A `+10`: victoire.
- A `-10`: defaite, mais le systeme recommande souvent de laisser aux heros une derniere action decisive.

### Actions heroques influencant la bataille

Valeurs indicatives relevees:

| Action | Effet sur la bataille |
| --- | --- |
| Porter un message cle | `+2 PV` |
| Capturer une cible majeure | `+2 a +3 PV` |
| Detruire un pont, un engin ou un objectif cle | `+2 PV` |
| Neutraliser la sorcellerie ennemie | annule le bonus de sorcellerie adverse |
| Sauvetage critique | `+2 a +3 PV` |
| Prendre une position cle | `+1 a +3 PV` |
| Rallier les troupes | jet base sur `aura` et carrieres utiles; donne un de bonus au prochain jet de bataille |
| Amener des renforts | peut changer la categorie de taille d'armee |
| Tenir une position 3 rounds de combat | `+1 PV`, reproductible d'un round de bataille a l'autre |
| Tuer une cible majeure | `+1 ou +2 PV` |
| Voler des informations critiques | `+2 PV` |

## Combat naval

### Jet de reaction du capitaine

Formule:

`2d6 + esprit + initiative - esprit du rival ennemi si pertinent`

Seuil:

- `9+`

Effets:

| Resultat | Effet |
| --- | --- |
| Echec critique | Dernier de tout l'affrontement, et pas d'action au 1er round. |
| Echec | Agit apres l'adversaire. |
| Reussite | Agit avant l'adversaire. |
| Succes heroique | Agit avant et beneficie d'un round libre initial. |
| Succes legendaire | Comme heroique, et `+1` a toutes les attaques pendant la rencontre. |

### Bandes de portee navales

| Bande | Modificateur indicatif |
| --- | --- |
| Hors de vue | combat impossible |
| Maximale | `-8` |
| Extreme | `-6` |
| Tres longue | `-4` |
| Longue | `-2` |
| Moyenne | `-1` |
| Courte | `0` |
| Bout portant | `+1` |

Usages typiques:

- `Maximale`: tirs indirects lourds
- `Moyenne`: eperonnage
- `Courte`: grappins, bris de rames
- `Bout portant`: abordage, desengagement

### Sequence d'un round naval

1. Manoeuvres
2. Attaques
3. Reparation / extinction / assistance a l'equipage

### Ressources de navire

Principes:

- Environ `1 ressource` par tranche de `20` membres d'equipage, arrondie selon le profil.
- Les ressources peuvent etre reparties entre manoeuvres, attaques, defenses et reparations.
- Bonus maximal sur une action: `+3`, sauf abordage qui n'a pas cette limite.
- On peut aussi affecter des ressources a la defense du navire pour imposer un malus aux attaques recues ce round.

### Jet de manoeuvre

Formule:

`2d6 + carriere pertinente + ressources allouees +/- modificateurs`

Seuil:

- `9+`

### Manoeuvres principales

#### Fuite / rapprochement

- Si un camp fuit et l'autre ne poursuit pas: `+1` bande de distance automatiquement.
- Si les deux approchent: `-2` bandes.
- Si l'un fuit et l'autre poursuit: les deux camps jettent. A resultats egaux, la distance ne change pas.
- 1 reussite contre 1 echec: `1` bande de difference.
- Succes heroique: `2` bandes.
- Succes legendaire: `3` bandes.
- A `hors de vue`, la fuite reussit.

#### Briser les rames

- Se tente a `courte` ou `bout portant`.
- En cas de succes: `d6` degats de coque.
- Options heroiques:
- `+6` degats de coque
- tir ou choc precis: de de malus sur une action navale choisie de la cible
- massacre de l'equipage: meme valeur appliquee aux pertes d'equipage
- navire en panne: perd son action au prochain round

#### Eperonnage

- Se tente a `moyenne` ou `courte`.
- En cas de succes, les degats utilisent la valeur d'eperonnage du navire.
- Les navires restent coinces ensuite, jusqu'au desengagement.

#### Grappins

- Se tentent a `courte` ou `bout portant`.
- En cas de succes, la cible est immobilisee jusqu'au desengagement.
- Option heroique: la cible perd sa prochaine action ou l'abordage gagne 1 de bonus.

#### Desengagement

- Sert a separer des navires bloques par grappins ou eperonnage.

### Attaques navales

Formule generale:

`2d6 + carriere pertinente + ressources allouees - defense cible +/- modificateurs de portee`

Seuil:

- `9+`

#### Abordage

- Possible seulement si les navires sont coinces par grappins ou eperonnage.
- Pas de plafond de ressources allouees.
- Degats: `d6` pertes d'equipage.
- Option heroique: `+6` pertes d'equipage, ou la cible perd sa prochaine action.

#### Catapulte

- Portee maximale: `extreme`
- Projectile de pierre: `d6` degats de coque et `d3` pertes d'equipage
- Pot incendiaire: `d3` degats de coque et `d3` pertes d'equipage

#### Crache-feu

- Portee maximale: `longue`
- Degats: `d6` coque et `d6` equipage
- Options heroiques:
- `+6` coque
- `+6` equipage
- tir precis: de de malus sur une action choisie
- navire en panne

#### Projectiles

- Portee maximale: `longue`
- Degats: `d6` pertes d'equipage
- Options heroiques:
- `+6` equipage
- tir precis imposant un de malus a une action navale choisie

### Reparations et assistance

Formule:

`2d6 + carriere pertinente + ressources allouees`

Seuil:

- `9+`

Effets:

- Recuperer `d6` coque
- ou recuperer `d6` equipage
- ou eteindre un incendie

Succes ameliores:

- Succes heroique: 2 actions de reparation
- Succes legendaire: 3 actions de reparation

Feu:

- Un incendie continue de round en round tant qu'il n'est pas eteint.

Destruction:

- Coque a `0`: navire coule.
- Equipage a `0`: plus personne n'est operationnel a bord.

### Profils de navires releves

| Navire | Equipage | Coque | Ressources | Eperonnage / armement |
| --- | --- | --- | --- | --- |
| Petit navire a voiles | 4 | 4 | 0 | `d6M` |
| Grand navire a voiles | 20 | 8 | `+1` | `d6M`, catapulte |
| Petite galere de guerre / marchande | 24 | 14 | `+1` | `d6 x2`, catapulte |
| Galere de guerre | 35 | 30 | `+2` | `d6 x3`, catapulte |
| Grande galere de guerre | 55 | 50 | `+3` | `d6 x4`, catapulte ou crache-feu |
| Galere amirale | 110 | 65 | `+5` | `d6 x5`, catapulte ou crache-feu |
| La Gloire de Parsool | 220 | 80 | `+11` | `d6 x6`, catapulte et crache-feu |
| Nef volante | 3 | 6 | `0 ou +1` | `d6`, parfois arbalete lourde |

Notes:

- Les grandes galeres gagnent des ressources supplementaires d'abordage avec soldats embarques.
- Les grandes batailles navales peuvent etre traitees avec les regles de guerre terrestre en remplacant `soldat` par `marin` ou `pirate`.
