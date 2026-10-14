# Combat : ce qui reste à faire

Date : 2026-10-14. Étude des écarts entre les règles du livre et la gestion du combat dans l'application.

Sources :
- Règles : `doc/rules/02-actions-combat.md`, `04-pnj-creatures-demons.md`, `05-alchimie-foi-sorcellerie.md` (vérifiables dans `doc/pdf-text/`).
- État de l'application : `doc/plans/2026-10-13-combat-etat-des-lieux.md`, et le code de `front/src/app/bol/session/`.

Chaque point donne la règle, ce que fait l'application aujourd'hui, une proposition et un effort estimé : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## Synthèse

| # | Sujet | Nature | Effort | Lot |
| --- | --- | --- | --- | --- |
| 1 | Dégâts à mains nues : vigueur/2 | Écart avec la règle — **fait le 2026-10-14** | S | 1 |
| 2 | Héros à 0 de vitalité : hors de combat | Écart avec la règle | M | 1 |
| 3 | Mourant : −1 vitalité par round | Règle absente | S | 1 |
| 4 | Arme lourde interdite sous 0 de vigueur | Règle absente | S | 1 |
| 5 | Fin du tour sans appliquer le coup | Limite connue | S | 1 |
| 6 | Portée des armes à distance | Règle absente | M | 2 |
| 7 | Modificateur libre, bonus de carrière, feinte | Règle absente | M | 2 |
| 8 | Carrière utile au jet de réaction | Règle absente | S | 2 |
| 9 | Héroïsme du défenseur, interrompre | Règle absente | M | 2 |
| 10 | Secourir un mourant, soins | Règle absente | M | 2 |
| 11 | Bagarre à mains nues | Règle absente | M | 2 |
| 12 | Avantages et pouvoirs des créatures et démons | Règle absente | L | 3 |
| 13 | Horde de piétaille | Règle absente | M | 3 |
| 14 | Points de vilenie des rivaux | Règle absente | M | 3 |
| 15 | Sorcellerie en combat | Règle absente | L | 4 |
| 16 | Foi en combat | Règle absente | S | 4 |
| 17 | Petites limites de l'assistant | Confort | S à M | au fil de l'eau |

Les lots sont un ordre proposé : d'abord corriger ce qui donne un résultat faux, puis ce qui sert à chaque combat, puis le bestiaire, puis la magie.

## Lot 1 : corriger ce qui est faux

### 1. Dégâts à mains nues : vigueur/2

- **Règle** (table des dégâts) : mains nues `d3 + vigueur/2` arrondi à l'inférieur, en mêlée comme ailleurs.
- **Aujourd'hui** : l'assistant ajoute la vigueur entière en mêlée (`vigueurBonus` ne regarde que mêlée ou tir, pas l'arme).
- **Proposition** : `vigueurBonus` reçoit l'arme choisie ; les mains nues divisent toujours par deux. Test unitaire sur le cas.
- **Effort** : S.
- **Fait le 2026-10-14** : `vigueurBonus(stats, useTir, unarmed)` ; la tuile Vigueur de l'attaquant et l'addition des dégâts suivent l'arme choisie.

### 2. Héros à 0 de vitalité : hors de combat

- **Règle** (« Blessures, inconscience et mort ») : à 0, le personnage est hors de combat et s'effondre. Au round suivant, il sombre dans l'inconscience (et remonte à vitalité/2 à la fin du combat), ou dépense 1 PH pour reprendre ses esprits (et remonte aussi à vitalité/2).
- **Aujourd'hui** : un héros n'est hors combat qu'en vitalité négative (`isOut`) ; à 0, il continue de jouer.
- **Proposition** :
  - à 0, le héros est sauté dans l'ordre d'action, comme les autres ;
  - au début du round suivant, un dialogue lui propose « Reprendre ses esprits (−1 PH) » : il revient à vitalité/2 et rejoue ;
  - sinon il reste inconscient jusqu'à la fin du combat, et la récupération post-combat le remonte à vitalité/2 (à vérifier contre la règle de récupération actuelle, qui rend la moitié des points perdus).
- **Effort** : M.

### 3. Mourant : −1 vitalité par round

- **Règle** : sous 0, le personnage est dans le coma et perd 1 vitalité par round, jusqu'à être soigné, mort (−6) ou sauvé par « Défier la mort ».
- **Aujourd'hui** : rien ne se passe d'un round à l'autre ; « Défier la mort » n'est proposé que quand un coup fait franchir un seuil.
- **Proposition** : au passage au round suivant, chaque héros mourant non stabilisé perd 1 vitalité, avec une annonce dans la frise. S'il franchit −5, « Défier la mort » est proposé. Un effet « stabilisé » (durée : combat) arrête la perte ; il est posé par « Défier la mort » au-delà de −5, ou par les soins (point 10).
- **Effort** : S, si le point 10 vient plus tard (l'effet se pose alors à la main).

### 4. Arme lourde interdite sous 0 de vigueur

- **Règle** (« Dégâts ») : un personnage ayant moins de 0 en vigueur ne peut pas manier les armes lourdes.
- **Aujourd'hui** : l'assistant propose toutes les armes équipées.
- **Proposition** : griser les armes lourdes (`d6B`) dans « Avec quoi ? » pour un héros à vigueur négative, avec l'explication en infobulle.
- **Effort** : S.

### 5. Fin du tour sans appliquer le coup

- **Constat** (état des lieux, § 8) : « Fin du tour » dans l'en-tête ou la touche F, alors qu'un coup qui touche n'est pas appliqué, perd ses dégâts et les effets de ses options héroïques.
- **Proposition** : si un coup touché attend d'être appliqué, demander « Appliquer les dégâts avant de finir le tour ? » (Appliquer et finir / Finir sans appliquer / Annuler).
- **Effort** : S.

## Lot 2 : ce qui sert à chaque combat

### 6. Portée des armes à distance

- **Règle** (« Portée des armes à distance ») : bout portant +1, courte 0, moyenne −1, longue −2, très longue −4, extrême −6, maximale −8. Chaque facteur au-delà de la portée de base de l'arme ajoute un cran de difficulté.
- **Aujourd'hui** : on choisit mêlée ou tir, sans portée.
- **Proposition** : en tir, une échelle de portée dans « Avec quoi ? », réglée par défaut sur « courte », avec la portée de base de l'arme rappelée (elle est déjà dans le catalogue). Le modificateur entre dans l'addition comme un terme « portée ».
- **Effort** : M.

### 7. Modificateur libre, bonus de carrière, feinte

- **Règle** (« Carrières et combat ») : dans une situation exceptionnelle, le MJ peut autoriser une carrière à ajouter son rang au jet d'attaque **ou** aux dégâts, jamais les deux, si le joueur décrit une manœuvre ou une feinte. Une même feinte ne marche pas deux fois contre le même adversaire.
- **Aujourd'hui** :
  - pas de modificateur libre sur le jet d'attaque (il existe sur le jet d'action du héros) ;
  - pas de bonus de carrière ;
  - la feinte n'est suivie qu'à la main.
- **Proposition** :
  - un modificateur libre (−/+) dans la carte « Comment ? », comme sur le jet d'action ;
  - « Une carrière aide » : choix de la carrière (avec son rang) et de sa cible, attaque ou dégâts ;
  - quand ce bonus est utilisé, une trace « feinte déjà tentée » est posée sur la cible, limitée à cet attaquant (le registre sait déjà limiter un effet à un adversaire). La puce avertit si on retente.
- **Effort** : M.

### 8. Carrière utile au jet de réaction

- **Règle** (« Modificateurs au jet de réaction ») : le MJ peut accorder le rang d'une carrière utile.
- **Aujourd'hui** : le dialogue « Démarrer le combat » gère l'embuscade et l'initiative ennemie, pas les carrières.
- **Proposition** : sur la carte de chaque héros, un menu « + carrière » qui ajoute son rang au jet.
- **Effort** : S.

### 9. Héroïsme du défenseur, interrompre

- **Règles** (« Points d'héroïsme ») :
  - **Parade in extremis** : annuler les dégâts d'une attaque ; le bouclier ou l'arme interposé est brisé.
  - **Juste une égratignure** : perdre sa prochaine action et lancer 1d6 pour récupérer autant de vitalité, sans dépasser les dégâts tout juste reçus.
  - **Interrompre une action** : après avoir retardé la sienne, dépenser 1 PH pour couper l'action d'un autre.
- **Aujourd'hui** : seul « Défier la mort » est proposé ; « perd sa prochaine action » existe dans « + Effet » ; « Retarder » existe, sans interruption.
- **Proposition** :
  - quand des dégâts sont sur le point d'être appliqués à un héros, deux boutons à côté de « Appliquer » : « Parade in extremis −1 » (dégâts à 0, arme ou bouclier marqué brisé) et « Juste une égratignure −1 » (1d6 rendu, plafonné, et l'effet « perd sa prochaine action » posé) ;
  - pour un héros qui a retardé, un bouton « Interrompre −1 » dans la frise, qui le rend actif tout de suite.
- **Effort** : M.

### 10. Secourir un mourant, soins

- **Règles** (« Secourir un mourant », « Récupération ») :
  - stabiliser : jet d'esprit + carrière de soins, difficulté Moyenne, aggravée d'un cran par point de vitalité négatif ;
  - soins médicaux : récupération immédiate du rang du soigneur.
- **Aujourd'hui** : la récupération post-combat rend la moitié des points perdus aux héros à 0 ou plus ; rien pour stabiliser ni soigner.
- **Proposition** :
  - sur la carte d'un héros mourant, « Secourir » ouvre le jet d'action du soigneur choisi, avec la difficulté préremplie ; une réussite pose l'effet « stabilisé » (point 3) ;
  - après le combat, « Soigner » rend le rang du soigneur.
- **Effort** : M.

### 11. Bagarre à mains nues

- **Règles** : le MJ peut autoriser la vigueur à la place de l'agilité pour l'attaque ; un personnage mis à 0 par une bagarre à mains nues perd simplement connaissance (ni coma ni perte de vitalité) et récupère tout après un court repos.
- **Aujourd'hui** : rien de cela.
- **Proposition** : avec les mains nues, une case « Bagarre » qui prend la vigueur à la place de l'agilité, et marque les dégâts comme « de bagarre ». Une cible mise à 0 par la bagarre est seulement assommée : pas de « Défier la mort », et récupération totale après le combat.
- **Effort** : M.

## Lot 3 : le bestiaire

### 12. Avantages et pouvoirs des créatures et démons

- **Règles** (`04-pnj-creatures-demons.md`) :

  | Capacité | Effet en combat |
  | --- | --- |
  | Attaque féroce (créature), Armes améliorées (démon) | Dé de bonus à l'attaque |
  | Attaque timide | Dé de malus à l'attaque |
  | Attaques multiples | Plusieurs jets d'attaque distincts |
  | Attaques dévastatrices (démon) | Dégâts d'une catégorie au-dessus |
  | Régénération (démon) | +1 vitalité par round ; se débarrasse d'un coup précis au bout de 2 rounds |
  | Intangible (démon) | Blessé seulement par sorcellerie ou alchimie |
  | Poison (démon) | Jet de vigueur Difficile (−2) pour éviter la paralysie |
  | Vulnérabilité (démon) | Double dégâts d'un élément |
  | Morts-vivants | « Force vitale » au lieu de vitalité (même mécanique) |

- **Aujourd'hui** : l'assistant prend l'attaque, les dégâts, la défense et la protection du profil, sans ses capacités.
- **Proposition** :
  - dé de bonus ou de malus posé d'office selon la capacité, retirable comme le dé du MJ ;
  - attaques multiples : après un coup, « Attaque suivante » sans finir le tour, jusqu'au nombre d'attaques du profil ;
  - régénération : +1 au passage de round ;
  - intangible et vulnérabilité : rappel sur la carte de la cible, avec une case « dégâts doublés » ;
  - poison : rappel du jet à faire, et effet « paralysé » posé à la main ;
  - libellé « Force vitale » pour les morts-vivants.
- **Prérequis** : vérifier comment ces capacités sont stockées en base pour les créatures et les démons (champs structurés ou texte libre).
- **Effort** : L.

### 13. Horde de piétaille

- **Règle** : la piétaille attaque en groupe, avec un seul jet, +1 par piétaille engagée ; si la horde touche, dégâts d6M. Piétaille contre piétaille : le groupe le plus nombreux inflige d6M pertes, le plus faible riposte à d3.
- **Aujourd'hui** : chaque piétaille est une carte qui joue seule (une ligne = une carte, décision du 2026-10-07).
- **Proposition** : quand plusieurs piétailles visent la même cible, l'assistant propose « Attaque de horde » : un seul jet, +1 par piétaille engagée (à cocher dans la frise), dégâts d6M, et toutes les cartes engagées passent leur tour.
- **Effort** : M.

### 14. Points de vilenie des rivaux

- **Règle** : les rivaux ont des points de vilenie, équivalents des points d'héroïsme, plus « Bouclier humain » (une piétaille proche encaisse un coup, comme une parade in extremis) et « Fuite opportune ».
- **Aujourd'hui** : rien ; les options d'héroïsme sont réservées aux héros.
- **Proposition** : un compteur de vilenie sur la carte d'un rival, rempli depuis son profil ; les boutons d'héroïsme de l'assistant deviennent ceux de la vilenie quand un rival attaque ; « Bouclier humain » est proposé quand un rival va encaisser des dégâts et qu'une piétaille de son camp est sur la table.
- **Prérequis** : vérifier que le profil PNJ stocke les points de vilenie, sinon ajouter le champ.
- **Effort** : M.

## Lot 4 : la magie en combat

### 15. Sorcellerie en combat

- **Règle** (`05-alchimie-foi-sorcellerie.md`) :
  - jet de sort : `2d6 + esprit + sorcier ± difficulté` ;
  - coût en points de pouvoir selon le cercle, plus 1 à 3 points selon l'armure portée ;
  - un sort du 1er cercle qui blesse inflige d6 par défaut ;
  - un sort qui influence l'esprit subit en plus l'esprit de la cible en malus.
- **Aujourd'hui** : pas de jet de sort ni de réserve de pouvoir suivie en combat.
- **Proposition** :
  - une action « Lancer un sort » dans l'assistant, à côté de l'attaque : cercle, difficulté, coût calculé avec le surcoût d'armure, réserve de pouvoir décomptée ;
  - pour un sort blessant, on enchaîne sur un jet de dégâts sans protection d'armure ni vigueur (à confirmer dans le livre).
- **Effort** : L.

### 16. Foi en combat

- **Règle** : 1 point de foi donne un dé de bonus ou impose un dé de malus à un être visible, sans jet.
- **Aujourd'hui** : le dé du MJ permet de le simuler, sans décompter la foi.
- **Proposition** : pour un prêtre ou un druide, des puces « Dé de foi » qui posent le dé et décomptent un point de foi.
- **Prérequis** : vérifier que la réserve de foi est suivie sur la fiche du héros.
- **Effort** : S.

## Petites limites de l'assistant (17)

Reprises de l'état des lieux, § 8 :
- Carnage pris deux fois : si la première attaque rate, rappeler la seconde.
- Renversement et désarmement : vérifier la taille de la cible et l'arme tenue, au moins par un rappel.
- Effet libre (valeur et durée au choix) dans « + Effet ».
- Retirer une carte en cours de combat (l'événement `carte-retiree` existe déjà).
- Massacrer la piétaille : retirer les cartes depuis l'assistant.
- Script navigateur rejouable pour l'héroïsme en combat.

## Hors périmètre

- **Guerre terrestre et navale** (`03-guerre.md`) : un autre système (valeur d'armée, jets de bataille, manœuvres navales), à traiter comme un module à part.
- **Déplacement sur quadrillage** : le livre le laisse facultatif et abstrait ; un jet d'agilité via le jet d'action suffit.
- **Fabrication alchimique** : hors combat ; l'usage d'une préparation en combat se traite comme un effet posé à la main.
- **Journal complet des événements et annulation d'un coup** : déjà écartés dans le spec du registre d'effets.

## Questions à trancher avant de commencer

1. **Héros à 0** (point 2) : faut-il ajouter un état « inconscient » visible sur la carte, ou suffit-il de le sauter dans l'ordre d'action ?
2. **Horde** (point 13) : grouper les piétailles dans la frise, ou seulement le temps de l'attaque ?
3. **Sorcellerie** (point 15) : faut-il un catalogue de sorts, ou une saisie libre (cercle, difficulté, coût) au moment du jet ?
