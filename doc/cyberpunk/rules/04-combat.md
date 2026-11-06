# Combat

Pages source : p. 167-194 (« Fusillade du vendredi soir »). Texte : `doc/cyberpunk/pdf-text/09-combat-p167-194.txt`.

Abréviations : `SD` seuil de difficulté, `PS` points de santé, `PA` pouvoir d'arrêt (armure), `PDS` points de dégâts structurels (véhicules), `Att/round` attaques par round.

## Initiative et tour

- Un **tour** dure 3 secondes ; un **round** est le temps que chaque participant joue son tour (3 secondes aussi).
- Au début du combat : `Initiative = RÉF + 1d10`. File d'Initiative par ordre décroissant ; les égalités relancent jusqu'à départage. La file reste la même d'un round à l'autre.
- **Un tour = 1 action de mouvement + 1 action.**

## Actions

| Action | Effet |
| --- | --- |
| Action de mouvement | Se déplacer de `MOUV × 2` mètres (ou `MOUV` cases, diagonales comprises ; on ne s'arrête pas entre deux cases). |
| Agripper | Retenir un adversaire, lui prendre un objet qu'il tient, ou se dégager d'une prise. |
| Attaquer | Attaque à distance ou de mêlée. |
| Bouclier humain | « Équiper » comme bouclier un adversaire qu'on agrippe. |
| Courir | Une action de mouvement supplémentaire, seulement si l'action de mouvement du tour est déjà faite. |
| Démarrer un véhicule | Prendre le MOUV du véhicule et passer en tête de la file d'Initiative. |
| Équiper/Lâcher un bouclier | Prend une action. |
| Étrangler | Sur un adversaire agrippé. |
| Lancer | Projeter au sol un adversaire agrippé, ou lancer un objet. |
| Manœuvre en véhicule | Se concentrer sur une manœuvre dangereuse (prend aussi l'action de mouvement). |
| Monter dans un véhicule | Prend une action ; en descendre est du mouvement. |
| Recharger | Recharger tout le chargeur, avec un seul type de munitions (pas de mélange). |
| Retarder son action | Fixer un déclencheur ou un rang de la file d'Initiative, la nature de l'action et sa cible. |
| Se relever | Obligatoire avant toute action de mouvement quand on est au sol. |
| Stabiliser | Soigner une cible (voir `05-blessures-et-soins.md`). |
| Utiliser des actions virtuelles | Agir dans le NET (voir `07-netrunning.md`). |
| Utiliser une compétence | Tâche rapide ; une tâche longue prend plusieurs actions sur plusieurs tours, le jet se fait une fois le temps investi. |
| Utiliser un objet | Manipuler un objet sans compétence. |

Gratuit (pas une action) : dégainer une arme facilement accessible avec une main libre ; lâcher une arme tenue (sauf un bouclier). Ranger une arme sur soi est une action.

### Mouvement divisé et Att/round

- On peut **diviser** son action de mouvement : agir au milieu, puis finir le mouvement.
- Une source à **2 Att/round** permet deux jets d'attaque pour une seule action attaquer, et ces deux attaques peuvent s'intercaler dans le mouvement (bouger, tirer, bouger, tirer, bouger). On peut aussi faire une attaque avec chacune de deux sources à 2 Att/round différentes.
- Une source à **1 Att/round** prend toute l'action attaquer (le mouvement peut encore se diviser avant/après).
- **Jamais plus de deux jets d'attaque par action**, quel que soit le nombre d'armes. Pas d'attaque avec deux armes à 1 Att/round dans la même action.

### Autres mouvements

- Nager, escalader, sauter avec élan : 2 m de mouvement par mètre parcouru (2 cases par case).
- Saut sans élan : moitié de la distance du saut avec élan.

### Viser

- Seulement avec une attaque à 1 Att/round : toute l'action, une seule attaque, **−8** au jet.
- Pas de visée en tir automatique, à la chevrotine, ni (sauf exception) avec un coup spécial d'arts martiaux.

| Zone visée | Effet si l'attaque touche |
| --- | --- |
| Tête | Les dégâts qui traversent l'armure de la tête sont **× 2**. |
| Objet tenu | Si au moins 1 point traverse l'armure : la cible lâche l'objet choisi (il tombe devant elle). |
| Jambe | Si au moins 1 point traverse l'armure : blessure critique **jambe cassée** (s'il reste une jambe non cassée). |

## Combat à distance

`RÉF + compétence d'arme + 1d10` contre :

- le **SD de portée** (tableau ci-dessous), ou
- `DEX + Esquive + 1d10` du défenseur, **seulement s'il a RÉF 8 ou plus** et choisit d'esquiver.

Il faut **dépasser** : l'égalité profite au défenseur.

### Armes à distance (classes)

| Type | Compétence | Dégâts | Chargeur (munition) | Att/round | Mains | Dissim. | Prix | Modes et traits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pistolet moyen | Pistolet | 2d6 | 12 (pistolet M) | 2 | 1 | oui | 50 (Coûteux) | — |
| Pistolet lourd | Pistolet | 3d6 | 8 (pistolet L) | 2 | 1 | oui | 100 (Très coûteux) | — |
| Pistolet très lourd | Pistolet | 4d6 | 8 (pistolet TL) | 1 | 1 | non | 100 (Très coûteux) | — |
| Pistolet-mitrailleur | Pistolet | 2d6 | 30 (pistolet M) | 1 | 1 | oui | 100 (Très coûteux) | tir automatique (3), tir de suppression |
| Pistolet-mitrailleur lourd | Pistolet | 3d6 | 40 (pistolet L) | 1 | 1 | non | 100 (Très coûteux) | tir automatique (3), tir de suppression |
| Fusil à pompe | Armes d'épaule | 5d6 | 4 (slug) | 1 | 2 | non | 500 (Onéreux) | chevrotine |
| Fusil d'assaut | Armes d'épaule | 5d6 | 25 (fusil) | 1 | 2 | non | 500 (Onéreux) | tir automatique (4), tir de suppression |
| Fusil de précision | Armes d'épaule | 5d6 | 4 (fusil) | 1 | 2 | non | 500 (Onéreux) | — |
| Arcs et arbalètes | Tir à l'arc | 4d6 | — (flèche) | 1 | 2 | non | 100 (Très coûteux) | flèches |
| Lance-grenades | Armes lourdes | 6d6 | 2 (grenade) | 1 | 2 | non | 500 (Onéreux) | explosion |
| Lance-roquettes | Armes lourdes | 8d6 | 1 (roquette) | 1 | 2 | non | 500 (Onéreux) | explosion |

Les variantes de qualité, les munitions et les accessoires sont au catalogue du Marché de nuit (p. 340 et suivantes).

### SD d'un seul tir selon la portée

| Type d'arme | 0-6 m | 7-12 m | 13-25 m | 26-50 m | 51-100 m | 101-200 m | 201-400 m | 401-800 m |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pistolets | 13 | 15 | 20 | 25 | 30 | 30 | – | – |
| Pistolets-mitrailleurs | 15 | 13 | 15 | 20 | 25 | 25 | 30 | – |
| Fusils à pompe (slug) | 13 | 15 | 20 | 25 | 30 | 35 | – | – |
| Fusils d'assaut | 17 | 16 | 15 | 13 | 15 | 20 | 25 | 30 |
| Fusils de précision | 30 | 25 | 25 | 20 | 15 | 16 | 17 | 20 |
| Arcs et arbalètes | 15 | 13 | 15 | 17 | 20 | 22 | – | – |
| Lance-grenades | 16 | 15 | 15 | 17 | 20 | 22 | 25 | – |
| Lance-roquettes | 17 | 16 | 15 | 15 | 20 | 20 | 25 | 30 |

`–` : hors de portée.

### Modes de tir et traits spéciaux

**Tir automatique**

- Une action et **10 balles** (impossible s'il en reste moins de 10). Compétence **Tir automatique** à la place de la compétence de l'arme ; table de portée dédiée ; pas de visée.
- Une cible à RÉF 8+ peut esquiver.
- Si ça touche : `2d6 × (résultat du jet − SD)`, le multiplicateur plafonné par la valeur de l'arme (3 pour les pistolets-mitrailleurs, 4 pour les fusils d'assaut). Si les deux dés font 6 : blessure critique. L'armure s'applique ensuite.

| Tir automatique | 0-6 m | 7-12 m | 13-25 m | 26-50 m | 51-100 m |
| --- | --- | --- | --- | --- | --- |
| Pistolets-mitrailleurs | 20 | 17 | 20 | 25 | 30 |
| Fusils d'assaut | 22 | 20 | 17 | 20 | 25 |

Exemple du livre : SD 17, jet de 21 → dépassement de 4 ; `2d6 = 10` → 40 points de dégâts.

**Tir de suppression** : une action et 10 balles. Chaque personnage à pied, à découvert, en ligne de vue et dans un rayon de 25 m fait `VOL + Concentration + 1d10` contre `RÉF + Tir automatique + 1d10` du tireur. En cas d'échec, il doit consacrer sa prochaine action de mouvement à se mettre à couvert (et courir si ça ne suffit pas).

**Chevrotine** (fusil à pompe) : pas de visée. Une attaque `RÉF + Armes d'épaule + 1d10` contre **SD 13** ; si elle réussit, toutes les cibles à 6 m (3 cases) ou moins devant le tireur et en ligne de vue subissent **3d6** (un seul jet de dégâts). Esquivable à RÉF 8+.

**Flèches** : encocher fait partie de l'attaque (jamais d'action recharger) ; les flèches standard se récupèrent.

**Explosion**

- Dégâts à toutes les cibles (terrain compris) dans une zone de **10 m × 10 m** (5 × 5 cases) centrée sur la case visée (un carré de 2 m × 2 m, pas une personne). Un seul jet de dégâts.
- Si le SD est raté, le MJ place le point d'impact dans le carré de 10 × 10 m autour de la cible, et l'explosion se centre sur ce point.
- Esquive à RÉF 8+ : dépasser le jet initial de l'attaquant fait sortir de la zone.
- Pas de dégâts derrière un couvert que l'explosion ne détruit pas ; si elle le détruit, la cible subit tous les dégâts.

## Combat de mêlée

`DEX + compétence de mêlée + 1d10` contre `DEX + Esquive + 1d10` (tout le monde peut esquiver en mêlée). L'égalité profite au défenseur. Portée d'allonge : **2 m**.

- Toutes les attaques de mêlée sont à **2 Att/round**, sauf les armes de mêlée très lourdes.
- Les **armes de mêlée** et les **arts martiaux** ignorent **la moitié de l'armure** du défenseur (arrondie au supérieur). Pas la bagarre.
- Une arme se manie avec le nombre de mains prévu ; avec **COR 8+**, une arme à deux mains peut se manier à une main.

| Type d'arme de mêlée | Exemples | Dégâts | Att/round | Dissim. | Prix |
| --- | --- | --- | --- | --- | --- |
| Légère | couteau de combat, tomahawk | 1d6 | 2 | oui | 50 (Coûteux) |
| Intermédiaire | batte de baseball, pied-de-biche, machette | 2d6 | 2 | non | 50 (Coûteux) |
| Lourde | tuyau de plomb, épée, batte à pointes | 3d6 | 2 | non | 100 (Très coûteux) |
| Très lourde | tronçonneuse, masse, pale d'hélicoptère, naginata | 4d6 | 1 | non | 500 (Onéreux) |

Le nombre de mains dépend de l'arme précise, pas de la classe.

### Bagarre

Compétence **Bagarre** ; dégâts selon le COR. Avec un **cyberbras**, les dégâts de bagarre sont au moins `2d6` (plus si COR 7+). La bagarre n'ignore pas la moitié de l'armure.

| COR | Dégâts (bagarre) |
| --- | --- |
| 4 ou moins | 1d6 |
| 5-6 (ou 4 et moins avec cyberbras) | 2d6 |
| 7-10 | 3d6 |
| 11+ | 4d6 |

**Agripper** (une main libre, occupée pendant toute la prise) : jet opposé `DEX + Bagarre + 1d10` contre une cible à portée d'allonge. Le vainqueur choisit :

- **prendre un objet** tenu par la cible (dans sa main libre), ou
- **retenir** la cible : les deux sont agrippés, **−2 à toutes les actions** pour les deux tant que dure la prise. Le défenseur ne peut plus faire d'action de mouvement, l'attaquant le traîne avec la sienne. Aucun des deux ne peut utiliser d'arme à deux mains.
- L'attaquant lâche la prise quand il veut, sans action ; le défenseur (ou un tiers) doit utiliser son action et gagner un nouveau jet opposé.

**Étrangler** (attaquant d'une prise) : dégâts égaux au **COR**, qui ignorent l'armure sans la perforer. Si les dégâts suffiraient à faire passer une cible à plus de 1 PS sous 0 PS, elle tombe **inconsciente à 1 PS**. Trois rounds d'étranglement d'affilée sur la même cible : inconsciente quels que soient ses PS.

**Lancer**

- Projeter une personne agrippée : dégâts égaux au **COR**, ignorent l'armure sans la perforer ; la prise prend fin, la cible est au sol.
- Lancer un objet : `DEX + Athlétisme + 1d10`, 25 m maximum, SD de la ligne **lance-grenades**. Esquivable à RÉF 8+. Une arme de mêlée lancée fait ses dégâts normaux mais n'ignore plus la moitié de l'armure ; une grenade fait les dégâts du lance-grenades ; une arme improvisée, ce que décide le MJ.

### Arts martiaux

- Compétence **Art martial** (une forme choisie : aïkido, judo, karaté, taekwondo) ; au moins 1 niveau pour attaquer ou faire un coup spécial.
- 2 Att/round ; ignorent la moitié de l'armure ; dégâts selon le COR : `1d6` (COR ≤ 4), `2d6` (5-6), `3d6` (7-10), `4d6` (11+). Pas de bonus de cyberbras.
- Coup spécial : `DEX + Art martial (de la forme) + 1d10` contre `DEX + Esquive + 1d10` ou un SD.

| Forme | Coup spécial | Prérequis | Effet |
| --- | --- | --- | --- |
| Toutes | Rétablissement | — | En se relevant, jet contre SD 13 : réussi, se relever ne coûte pas l'action. |
| Aïkido | Enchaînement de désarmement | Toucher la même cible en bagarre et en arts martiaux ce tour | 1/tour, SD 15 : un objet de la cible passe dans vos mains ou tombe. |
| Aïkido | Projection défensive | Avoir esquivé toutes les attaques de mêlée depuis son dernier tour | 1/tour, une action, SD 15 : lancer (sans agripper, non esquivable) une cible dont on a esquivé l'attaque. |
| Judo | Dégagement | Toucher deux fois en mêlée ce tour une cible qui vous agrippe | 1/tour, SD 15 : vous êtes libéré et la cible subit **bras cassé** (bras au choix). |
| Judo | Prise d'acier | Agripper une cible qui n'a pas déjà subi ce coup | 1/tour, une action, SD 15 : −2 à ses tentatives d'évasion, plus d'attaque à distance jusqu'à la fin de la prise. |
| Karaté | Enchaînement de perforation d'armure | Toucher la même cible avec une arme de mêlée et en arts martiaux ce tour | 1/tour, SD 15 : toute l'armure de la cible est perforée de 2 points de plus. |
| Karaté | Frappe brise-os | VOL 8+ | Remplace les deux attaques : contre une cible, si touché, **côtes cassées** en plus des dégâts. À −8 (visée tête) : **fracture du crâne**. |
| Taekwondo | Coup de pied aérien | MOUV 8+, s'être déjà déplacé d'au moins 4 m ce tour | Action + tout le mouvement restant, cible à 4 m max en ligne droite : dégâts d'arts martiaux au corps, cible au sol (et éjectée d'une moto ou d'un véhicule ouvert). |
| Taekwondo | Frappe de point de pression | VOL 8+ | Remplace les deux attaques : si touché, **vertèbre endommagée**. À −8 (visée tête) : **lésion cérébrale**. |

Une blessure critique déjà subie n'est pas infligée une seconde fois.

## Autres manières de se blesser

- **Chute libre** : 40 m par tour, à la fin du tour. Une tentative pour se rattraper à un rebord : Athlétisme SD 15 (inutile avec une main grappin, un lance-grappin…). À l'impact, à partir de 10 m : `2d6` par tranche de 10 m (encaissés par l'armure du corps) et **jambe cassée** sauf Athlétisme SD 15. Deux cyberjambes évitent dégâts et blessure jusqu'à 30 m. Du haut d'un gratte-ciel sans parachute : mort, sans jet.
- **Électrocution** : `6d6` immédiatement (armure normale), puis à la fin de chaque tour suivant tant qu'on reste au contact.
- **En feu** : dégâts directs aux PS à la fin de chaque tour, jusqu'à utiliser une action pour éteindre ; l'armure n'est pas perforée. Faible (feu de bois) 2 ; forte (essence) 4 ; mortelle (thermite) 6.
- **Exposition aux éléments** : `1d6` directs aux PS à la fin de chaque jour ; pas de guérison naturelle pendant l'exposition, même stabilisé. L'équipement adapté protège.
- **Noyade et asphyxie** : souffle retenu `COR` minutes ; ensuite, au début de chaque tour, dégâts égaux au COR, qui ignorent l'armure sans la perforer. Dans le vide : en plus `1d6` à la fin du tour sur INT, RÉF et DEX (INT à 0 : mort), récupérés dès qu'on respire.
- **Poisons et drogues** : jet de **Résistance à la torture/aux drogues** contre le SD ; en cas d'échec, effet subi (armure non perforée). Drogues de rue : `05-blessures-et-soins.md`.

| Poison | Exemples | SD | Effet |
| --- | --- | --- | --- |
| Faible | belladone, déchets toxiques | 11 | 1d6 directs aux PS |
| Fort | arsenic | 13 | 2d6 directs aux PS |
| Mortel | biotoxines, poison synthétique, venin de poisson-pierre | 15 | 3d6 directs aux PS |

| Drogue (agression) | Exemple | SD | Effet |
| --- | --- | --- | --- |
| Faible | alcool | 11 | ivresse |
| Forte | pentothal de sodium | 13 | sensibilité aux suggestions |
| Mortelle | drogue synthétique | 15 | au choix du concepteur |

- **Radiations** : à faible dose, maladie à long terme (au MJ). Forte dose : chaque tour dans la zone vaut **en feu faible**, impossible à éteindre tant qu'on y reste ; zone très irradiée (réacteur qui fuit) : **en feu mortel**.

## Couvert, boucliers, armure

### Couvert

- On est à couvert si on est **entièrement** derrière quelque chose qui arrête une balle. En ligne de vue de quelqu'un, on n'est pas à couvert pour lui.
- **Pas de couvert partiel** : soit l'élément arrête une balle (il a des PS), soit il ne couvre pas.
- Chaque section de 2 m × 2 m (1 case) d'un couvert a des PS et s'attaque comme un personnage. À 0 PS elle est détruite ; l'excédent de dégâts est perdu (sauf explosion).
- Un couvert épais ne se déplace pas sans COR 10+ ou équipement. L'acier n'est pas endommagé par la bagarre ou les arts martiaux, sauf cyberbras ou COR 10+.

| Matériau | PS épais | PS fin |
| --- | --- | --- |
| Acier | 50 | 25 |
| Pierre | 40 | 20 |
| Verre pare-balles | 30 | 15 |
| Béton | 25 | 10 |
| Bois | 20 | 5 |
| Plâtre/Mousse/Plastique | 15 | 0 (pas de couvert) |

Exemples du livre (p. 183) : arbre, comptoir de bar, mur en rondins 20 ; armoire, porte en bois, table renversée 5 ; bloc moteur, bouche d'incendie, porte de chambre forte 50 ; conteneur, porte de voiture, réfrigérateur 25 ; porte en métal 20 ; gros rocher 40 ; statue 20 ; poteau électrique, terminal de données 25 ; sofa 15 ; vitre de banque 30 ; vitre de parloir 15 ; pare-brise et cloison d'open space : pas de couvert.

### Boucliers

- Équiper ou lâcher : une action ; la main est occupée. Un bouclier avec des PS = être à couvert.
- Attaqué par une cible qu'on voit, on peut interposer le bouclier : pas d'esquive, mais l'attaque à distance peut encore rater ; le bouclier encaisse tous les dégâts sur ses PS. À 0 PS il est détruit (réparable s'il est inorganique).
- **Bouclier balistique** : 10 PS, 100 (Très coûteux). **Cadavre** : PS égaux à son COR de son vivant.
- **Bouclier humain** (attaquant d'une prise, une action, sans autre bouclier) : à couvert, mais ne bloque ni la mêlée ni un tir visant la tête. Il ne peut pas esquiver et subit les tirs normalement. On peut l'attaquer soi-même. Mort, il devient un bouclier de PS = COR. Lâcher un bouclier humain vivant met fin à la prise sans action ; lâcher un cadavre coûte une action.

### Armure

- Deux localisations : **tête** et **corps**. Le PA ne se cumule pas : seule la meilleure pièce d'une localisation compte, mais toutes les pièces de la localisation sont perforées ensemble.
- **Pénalité d'armure** : la pire pénalité parmi les pièces portées s'applique à RÉF, DEX et MOUV, une seule fois même avec tête + corps. Elle peut faire tomber le MOUV à 0.

| Armure | PA | Pénalité | Prix |
| --- | --- | --- | --- |
| Cuir | 4 | aucune | 20 (Ordinaire) |
| Kevlar® | 7 | aucune | 50 (Coûteux) |
| Tenue pare-balles légère | 11 | aucune | 100 (Très coûteux) |
| Combinaison connectée (netrunner, p. 350) | 11 | aucune | 1 000 (Très onéreux) |
| Tenue pare-balles moyenne | 12 | −2 RÉF, DEX, MOUV | 100 (Très coûteux) |
| Tenue pare-balles lourde | 13 | −2 RÉF, DEX, MOUV | 500 (Onéreux) |
| Flak | 15 | −4 RÉF, DEX, MOUV | 500 (Onéreux) |
| Metalgear® | 18 | −4 RÉF, DEX, MOUV | 5 000 (Luxueux) |

## Subir des dégâts

1. L'attaquant lance les dégâts.
2. On soustrait le **PA** de la localisation touchée (le corps, sauf visée de la tête). Le reste est retiré des **PS**. Certaines sources (poison, feu…) ignorent l'armure.
3. Si au moins 1 point a traversé, l'armure de cette localisation est **perforée** : −1 PA jusqu'à réparation.

Exemple du livre : machette 7 dégâts contre tenue pare-balles légère PA 11 → la mêlée compte PA 6 → 1 point traverse ; l'armure passe à PA 10.

### Seuils de blessure

Le nouveau seuil remplace l'effet du précédent.

| Seuil | Condition | Effet | SD de stabilisation |
| --- | --- | --- | --- |
| Blessure légère | PS < maximum | aucun | 10 |
| Blessure grave | PS < moitié du max (arrondie au supérieur) | −2 à toutes les actions | 13 |
| Blessure mortelle | PS < 1 | −4 à toutes les actions, −6 au MOUV (min. 1) ; jet de sauvegarde contre la mort au début de chaque tour ; une blessure critique à chaque dégât d'attaque de mêlée ou à distance ; la pénalité de sauvegarde augmente de 1 | 15 : rend 1 PS, le personnage est inconscient 1 minute |
| Mort | un jet de sauvegarde contre la mort raté | mort | impossible à ramener |

### Jets de sauvegarde contre la mort

- Au début de chaque tour en blessure mortelle : `1d10 + pénalité`. Il faut faire **moins que le COR** ; un **10 naturel** rate toujours. Un seul raté : mort.
- Chaque jet augmente la pénalité de 1 pour les suivants, jusqu'à ce qu'une stabilisation rende 1 PS : la pénalité revient alors à la **pénalité de base** (0, plus 1 par blessure critique grave qui l'augmente).

### Blessures critiques

- Sur un jet de dégâts de mêlée ou à distance, **deux 6 ou plus** : blessure critique. Lancer `2d6` dans la table (tête si la tête était visée, sinon corps), en relançant tant que la cible a déjà la blessure.
- Chaque blessure critique inflige **5 dégâts bonus directement aux PS** (n'abîment pas l'armure, pas de multiplicateur de localisation), **même si les dégâts de l'attaque n'ont pas traversé le PA**.
- « Sauvegarde de base +1 » ci-dessous : la pénalité de base du jet de sauvegarde contre la mort augmente de 1.

**Corps**

| 2d6 | Blessure | Effet | Soins d'urgence | Traitement |
| --- | --- | --- | --- | --- |
| 2 | Bras arraché | Bras perdu, objets lâchés ; sauvegarde de base +1 | — | Chirurgie SD 17 |
| 3 | Main arrachée | Main perdue, objets lâchés ; sauvegarde de base +1 | — | Chirurgie SD 17 |
| 4 | Poumon affaissé | −2 MOUV (min. 1) ; sauvegarde de base +1 | Assistance médicale SD 15 | Chirurgie SD 15 |
| 5 | Côtes cassées | Fin de tour avec plus de 4 m parcourus à pied : 5 dégâts directs à nouveau | Assistance médicale SD 13 | Assistance médicale SD 15 ou Chirurgie SD 13 |
| 6 | Bras cassé | Bras inutilisable, objets lâchés | Assistance médicale SD 13 | Assistance médicale SD 15 ou Chirurgie SD 13 |
| 7 | Plaie avec corps étranger | Fin de tour avec plus de 4 m à pied : 5 dégâts directs à nouveau | Premiers secours ou Assistance médicale SD 13 | les soins d'urgence suffisent |
| 8 | Jambe cassée | −4 MOUV (min. 1) | Assistance médicale SD 13 | Assistance médicale SD 15 ou Chirurgie SD 13 |
| 9 | Muscle déchiré | −2 aux attaques de mêlée | Premiers secours ou Assistance médicale SD 13 | les soins d'urgence suffisent |
| 10 | Vertèbre endommagée | Au prochain tour, pas d'action (mouvement seulement) ; sauvegarde de base +1 | Assistance médicale SD 15 | Chirurgie SD 15 |
| 11 | Doigts écrasés | −4 aux actions avec cette main | Assistance médicale SD 13 | Chirurgie SD 15 |
| 12 | Jambe arrachée | Jambe perdue, −6 MOUV (min. 1), plus d'esquive ; sauvegarde de base +1 | — | Chirurgie SD 17 |

**Tête**

| 2d6 | Blessure | Effet | Soins d'urgence | Traitement |
| --- | --- | --- | --- | --- |
| 2 | Œil crevé | Œil perdu, −4 aux attaques à distance et à la Perception visuelle ; sauvegarde de base +1 | — | Chirurgie SD 17 |
| 3 | Lésion cérébrale | −2 à toutes les actions ; sauvegarde de base +1 | — | Chirurgie SD 17 |
| 4 | Œil endommagé | −2 aux attaques à distance et à la Perception visuelle | Assistance médicale SD 15 | Chirurgie SD 13 |
| 5 | Commotion cérébrale | −2 à toutes les actions | Premiers secours ou Assistance médicale SD 13 | les soins d'urgence suffisent |
| 6 | Mâchoire cassée | −4 aux actions impliquant de parler | Assistance médicale SD 13 | Assistance médicale ou Chirurgie SD 13 |
| 7 | Plaie avec corps étranger | Fin de tour avec plus de 4 m à pied : 5 dégâts directs à nouveau | Premiers secours ou Assistance médicale SD 13 | les soins d'urgence suffisent |
| 8 | Coup du lapin | Sauvegarde de base +1 | Assistance médicale SD 13 | Assistance médicale ou Chirurgie SD 13 |
| 9 | Fracture du crâne | Visée tête : dégâts traversants × 3 au lieu de × 2 ; sauvegarde de base +1 | Assistance médicale SD 15 | Assistance médicale ou Chirurgie SD 15 |
| 10 | Oreille endommagée | Après un tour avec plus de 4 m à pied, pas d'action de mouvement au tour suivant ; −2 Perception auditive | Assistance médicale SD 13 | Chirurgie SD 13 |
| 11 | Trachée écrasée | Ne peut plus parler ; sauvegarde de base +1 | — | Chirurgie SD 15 |
| 12 | Oreille arrachée | Oreille perdue ; comme oreille endommagée, mais −4 Perception auditive ; sauvegarde de base +1 | — | Chirurgie SD 17 |

Soins d'urgence et traitement : `05-blessures-et-soins.md`.

## Combat en véhicule

### Véhicules

| Véhicule | PDS | Places | MOUV (combat) | Vitesse | Prix |
| --- | --- | --- | --- | --- | --- |
| Moto de route | 35 | 2 | 20 | 161 km/h | 20 000 |
| Supermoto | 35 | 2 | 60 | 483 km/h | 100 000 |
| Voiture compacte | 50 | 4 | 20 | 161 km/h | 30 000 |
| Voiture à haute performance | 50 | 4 | 40 | 322 km/h | 50 000 |
| Supervoiture | 50 | 2 | 60 | 483 km/h | 100 000 |
| Jet ski | 35 | 2 | 20 | 97 km/h | 20 000 |
| Hors-bord | 50 | 4 | 20 | 97 km/h | 30 000 |
| Bateau de plaisance | 60 | 2 par pièce | 10 | 24 km/h | 30 000 par pièce sous le pont (2 min.) |
| Yacht | 100 | 4 par pièce | 10 | 24 km/h | 50 000 par pièce (4 min.) |
| Gyrocoptère | 35 | 2 | 20 | 161 km/h | 20 000 |
| Hélicoptère | 60 | 4 | 40 | 322 km/h | 40 000 |
| Aérodyne polyvalent AV-4 | 100 | 6 | 40 | 322 km/h | 50 000 |
| Superaérodyne AV-9 | 60 | 2 | 60 | 483 km/h | 100 000 |
| Aérozep | 100 | 2 par pièce | 20 | 161 km/h | 30 000 par pièce sous le pont (2 min.) |

Tous Super luxueux. Améliorations de véhicules : capacité du Nomade (`03-capacites-de-role.md`).

### Règles

- **PDS** : à 0, le véhicule est détruit (ne bouge plus, n'est plus un couvert) jusqu'à réparation (Aérotech, Maritech, Terratech).
- Un véhicule n'esquive pas ; un occupant visé personnellement esquive comme à pied. Le tir sur un véhicule utilise la table de portée. Le verre ordinaire n'a pas de PS et ne couvre pas (verre pare-balles : amélioration de Nomade).
- **Point faible** : action viser, −8, une seule attaque ; si elle touche, dégâts traversant le PA × 2 (pneus, moteur, réservoir…). En mêlée contre un véhicule à l'arrêt on touche automatiquement ; en mouvement, SD 13 avec le −8.
- **Démarrer / arrêter** : une action. Avec des ports d'interface neurale, on conduit sans les mains ; sinon une main reste au volant, et la lâcher fait perdre le contrôle au début du tour suivant. En démarrant : le conducteur passe **en tête de la file d'Initiative**, son MOUV devient celui du véhicule (ses pénalités de MOUV ne comptent plus), il ne peut plus courir.
- **Conduite de base** : sans jet si `RÉF + compétence de contrôle > 9` (elle se joue comme une action de mouvement) ; sinon chaque tour une action et `RÉF + contrôle + 1d10` contre SD 10, ou perte de contrôle.
- **Manœuvre** (quand le MJ juge qu'on peut perdre le contrôle) : action + action de mouvement, `RÉF + contrôle + 1d10`. Échec : perte de contrôle immédiate.

| Manœuvre | SD |
| --- | --- |
| Embardée, virage brutal, arrêt d'urgence | 13 |
| Demi-tour, saut | 17 |
| Atterrissage (aérien) | 13 |
| Manœuvre acrobatique (aérien) | 17 |

- **Perte de contrôle** : le MJ décide du mouvement de ce tour ; une collision compte comme une charge.
- **Charger** : le véhicule et ce qu'il percute subissent chacun **6d6** ; toutes les personnes impliquées subissent **coup du lapin**. Si le couvert ou l'autre véhicule tombe à 0, on continue le mouvement, sinon on s'arrête. Après un piéton on continue ; s'il lui reste des PS, il peut choisir de s'accrocher au véhicule.
- **Esquiver une charge** à pied : `DEX + Esquive + 1d10` contre **SD 13** (tout le monde peut) ; réussi, on peut choisir de s'accrocher au véhicule.

## Réputation et baston de regard

- La réputation (0 à 10) est attribuée par le MJ pour un acte marquant ; une nouvelle réputation ne remplace l'ancienne que si elle est plus élevée (ou si elle est négative, voir plus bas). La plupart des personnages commencent à **0**.
- Lors d'une première rencontre, l'autre lance `1d10` : s'il fait **moins** que le niveau de réputation, il a entendu parler du personnage.

| Niveau | Qui vous connaît |
| --- | --- |
| 1 | Ceux qui ont assisté à vos actions |
| 2 | Votre entourage immédiat |
| 3 | Collègues et connaissances |
| 4 | Tout le quartier |
| 5 | Votre nom est connu hors de vos quartiers |
| 6 | Votre visage est connu hors de vos quartiers |
| 7 | Un ou deux articles sur vos exploits |
| 8 | Régulièrement en gros titres |
| 9 | Les médias ne ratent jamais une occasion de parler de vous |
| 10 | Connu dans le monde entier |

- Une réputation **négative** (lâcheté, désertion, trahison) peut remplacer une réputation positive ; elle donne un nombre négatif à la baston de regard.
- **Baston de regard** (quand le MJ l'estime) : chacun lance `PRES + réputation + 1d10`. Égalité : rien. Le perdant choisit : **se dégonfler**, ou **−2 à toutes ses actions contre cet adversaire** jusqu'à l'avoir vaincu.
