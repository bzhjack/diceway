# Combat : ce qui reste à faire

Les règles du livre que l'application ne gère pas encore en combat, revues le 2026-10-31. Ce qui est fait (audit des calculs, horde de piétaille, points de vilenie) est dans l'historique git de ce fichier, et le comportement actuel dans `doc/plans/2026-10-13-combat-etat-des-lieux.md`.

Sources des règles : `doc/rules/02-actions-combat.md`, `04-pnj-creatures-demons.md`, `05-alchimie-foi-sorcellerie.md` (vérifiables dans `doc/pdf-text/`).

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## Synthèse

| # | Sujet | État | Effort | Lot |
| --- | --- | --- | --- | --- |
| 12 | Avantages et pouvoirs des créatures et démons | En partie : dés d'attaque et attaques multiples faits | L | 3 |
| 13 | Horde de piétaille | Reste piétaille contre piétaille | S | 3 |
| 14 | Points de vilenie des rivaux | Reste « Fuite opportune » | S | 3 |
| 15 | Sorcellerie en combat | Règle absente | L | 4 |
| 16 | Foi en combat | Règle absente | S | 4 |
| 17 | Petites limites de l'assistant | Confort | S à M | au fil de l'eau |

## Lot 3 : le bestiaire

### 12. Avantages et pouvoirs des créatures et démons

- **Fait** : « Attaque féroce », « Attaque timide » et « Armes améliorées » donnent leur dé à chaque attaque (`attackDiceAbilities`, `combat-play.util.ts`) ; « Attaques dévastatrices » monte les dégâts d'une catégorie (`demonDegats`) ; « Autre attaque » enchaîne un nouveau jet pour qui frappe plusieurs fois par round (sans limite au nombre d'attaques du profil).
- **Reste** (règles dans `04-pnj-creatures-demons.md`) :

  | Capacité | Effet en combat | Proposition |
  | --- | --- | --- |
  | Régénération (démon) | +1 vitalité par round ; se débarrasse d'un coup précis au bout de 2 rounds | +1 au passage de round |
  | Intangible (démon) | Blessé seulement par sorcellerie ou alchimie | Rappel sur la carte de la cible |
  | Poison (démon) | Jet de vigueur Difficile (−2) pour éviter la paralysie | Rappel du jet, effet « paralysé » posé à la main |
  | Vulnérabilité (démon) | Double dégâts d'un élément | Rappel sur la carte, case « dégâts doublés » |
  | Morts-vivants | « Force vitale » au lieu de vitalité | Libellé « Force vitale » |

- Les pouvoirs à prévenir (`avertissement_combat` : Poison, Intangible) ne s'affichent pas encore sur la carte de l'attaquant ou de la cible.

### 13. Horde de piétaille

- **Fait** : l'attaque en groupe contre un héros (`hordeMates`, `endTurn` dans `combat-turn.util.ts`).
- **Reste** : piétaille contre piétaille (le camp le plus nombreux tue d6M adversaires, qui lui infligent d3 pertes), sans jet d'attaque.

### 14. Points de vilenie des rivaux

- **Fait** : le compteur de vilenie sur la carte d'un rival, ses dépenses à l'attaque, la parade in extremis et « Bouclier humain ».
- **Reste** : « Fuite opportune ».

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

### 16. Foi en combat

- **Règle** : 1 point de foi donne un dé de bonus ou impose un dé de malus à un être visible, sans jet.
- **Aujourd'hui** : le dé du MJ permet de le simuler, sans décompter la foi.
- **Proposition** : pour un prêtre ou un druide, des puces « Dé de foi » qui posent le dé et décomptent un point de foi.
- **Prérequis** : vérifier que la réserve de foi est suivie sur la fiche du héros.

## 17. Petites limites de l'assistant

- Carnage pris deux fois : si la première attaque rate, rappeler la seconde.
- Renversement et désarmement : vérifier la taille de la cible et l'arme tenue, au moins par un rappel.
- Effet libre (valeur et durée au choix) dans « + Effet ».
- Retirer une carte en cours de combat (l'événement `carte-retiree` existe déjà).
- Massacrer la piétaille : retirer les cartes depuis l'assistant.
- Script navigateur rejouable pour l'héroïsme en combat.
- « Perd sa prochaine action » (juste une égratignure) est un rappel : le tour n'est pas sauté d'office.
- Parade in extremis : le bouclier est choisi quand il y en a un ; le MJ retire l'effet si le joueur sacrifie plutôt son arme.
- Un héros qui a sombré, puis est soigné et retombe à 0 dans le même combat, n'a plus la question « Reprendre ses esprits ».
- Un héros stabilisé, soigné puis de nouveau mourant dans le même combat ne perd plus de vitalité.
- Un héros assommé (bagarre) garde la trace « assommé » jusqu'à la fin du combat, même relevé puis remis à 0 par une arme.
- Carrière en feinte : héros seulement, pas les PNJ rivaux.
- Secours : seuls les héros secourent ; pas de dé de bonus ou de malus sur le jet ; un soigneur soigne tous les blessés cochés, sans limite ni jet quotidien de doublement.

## Questions à trancher

1. **Sorcellerie** (point 15) : faut-il un catalogue de sorts, ou une saisie libre (cercle, difficulté, coût) au moment du jet ?

## Hors périmètre

- **Guerre terrestre et navale** (`03-guerre.md`) : un autre système (valeur d'armée, jets de bataille, manœuvres navales), à traiter comme un module à part.
- **Déplacement sur quadrillage** : le livre le laisse facultatif et abstrait ; un jet d'agilité via le jet d'action suffit.
- **Fabrication alchimique** : hors combat ; l'usage d'une préparation en combat se traite comme un effet posé à la main.
- **Journal complet des événements et annulation d'un coup**.
