# Le combat en session : état des lieux

Date : 2026-10-13, corrigé le 2026-10-31, le 2026-11-02 (mêlée de piétaille, fuite opportune) et le 2026-11-03 (pouvoirs des démons, morts-vivants, petites limites de l'assistant ; foi et sorcellerie, § 6 ter). Ce document décrit le combat tel qu'il fonctionne dans l'application. Il remplace le spec et le plan du registre d'effets (`2026-10-12-registre-effets-combat-design.md` et `-plan.md`), supprimés depuis : l'historique des décisions et le détail des tâches restent dans git.

Règles de référence : `doc/rules/02-actions-combat.md` (livre p. 56 à 66) et `doc/rules/exemples-de-jets.md`.

Principe : l'application assiste le MJ, elle ne le remplace pas. Elle calcule et retient ce qui se calcule, et laisse le MJ corriger à la main.

## 1. Déroulement d'un combat

1. **Démarrer le combat** : une page entière (`session/:id/combat`) recueille le jet de réaction de chaque héros et montre l'ordre d'action qui en découle.
2. **Écran de combat** : la frise donne le round et l'ordre ; dessous, la carte de celui qui joue porte son portrait, sa posture (dont la défense totale), ses armes, et en haut à droite ses actions : Fiche, Effets, Retarder, Secourir (s'il y a un mourant) en icônes, puis Fin du tour. Plus bas, trois colonnes conduisent le coup : la cible, l'attaque, les dégâts.
3. **Fin du tour** : la carte suivante devient active ; quand tout le monde a joué, un nouveau round commence. Si le coup qui a touché n'est pas appliqué, l'application demande d'abord : l'appliquer et finir, finir sans l'appliquer, ou rester sur le tour.
4. **Hors de combat** : tout personnage à 0 de vitalité ou moins ne joue plus ; la frise l'éteint et dit pourquoi (inconscient, mourant, stabilisé, mort, hors de combat, enfui pour un rival qui a pris la fuite, voir § 6, ou retiré, voir ci-dessous). Au début de chaque round :
   - un héros resté à 0 choisit entre reprendre ses esprits pour 1 PH (il remonte à la moitié de sa vitalité) et sombrer jusqu'à la fin du combat ;
   - un héros mourant perd 1 de vitalité, sauf s'il est stabilisé. Le message qui l'annonce porte un bouton « Stabilisé » pour le héros secouru à la table ; celui qui passe sous −5 se voit proposer « Défier la mort ».

   Un héros relevé (sa vitalité repasse au-dessus de 0 : soins, cœur corrigé, reprise de ses esprits) oublie sa chute : les traces « sombré », « stabilisé » et « assommé » tombent (`cartesRelevees`, `sansTracesDeChute`, `CombatWoundsService`). S'il retombe dans le même combat, les règles s'appliquent de nouveau : on lui redemande de reprendre ses esprits, mourant il perd de nouveau 1 point par round, et un coup d'arme ne le laisse plus « assommé ».
4 bis. **Retirer du combat** : sur la carte ouverte (« Fiche », ou un clic sur la carte), le bouton « Retirer du combat » demande confirmation, puis la carte sort du combat (`retirerDuCombat`, dans `exclus`) : elle ne joue plus, ne se vise plus et ne compte plus pour l'issue ; ses effets en cours tombent ; la frise la dit « retirée » ; sa fiche reste sur la table. Si c'était la carte active, la main passe. Une carte laissée hors du combat au démarrage est dite « retirée » elle aussi.
5. **Secourir** : à son tour, un héros ou un PNJ allié peut tenter de stabiliser un héros mourant au lieu d'attaquer (bouton « Secourir » de sa ligne ; livre p. 66 : « un autre héros ou un PNJ ») : jet d'esprit + carrière de soins, difficulté Moyenne aggravée d'un niveau par point de vitalité négatif. Le MJ peut accorder un dé de bonus ou imposer un dé de malus (3d6, deux gardés). Un PNJ n'a pas de faveur divine. Le tour se termine ensuite.
6. **Fin du combat** : dès qu'un camp n'a plus personne debout (hors de combat, retiré du combat ou enfui), une boîte « Victoire » ou « Défaite » s'ouvre (après une éventuelle boîte en cours, comme « Défier la mort »). Elle nomme les héros encore mourants ; « Continuer » laisse le temps de les secourir, « Terminer le combat » ouvre « Après combat ». Elle ne revient que si l'issue change, ou au rechargement de la page.
7. **Terminer le combat** : la boîte « Après combat » (livre p. 65-66) montre, pour chaque blessé du camp des héros, ce qu'il récupère. « Repos » : à 0 ou plus, la moitié des points perdus pendant ce combat, et la totalité des dégâts reçus à mains nues (l'application les retient coup par coup). Le serveur note la vitalité de chacun au démarrage (`etat_combat.depart`) : une blessure d'avant le combat ne se récupère pas ici. « Soins » : si un héros ou un PNJ allié a une carrière de soins (médecin, guérisseur, rebouteux), son rang en vitalité, à chaque blessé coché (le livre ne limite pas le nombre de blessés : interprétation). La boîte rappelle le jet quotidien du livre (p. 66) : les jours suivants, un jet d'action Moyenne du soigneur double la guérison du blessé (2 points par jour au lieu de 1) ; l'application ne suit pas les jours. Le MJ décoche ce qui ne s'applique pas ; « Terminer le combat » enregistre tout et repasse en mode libre.

## 2. Le jet de réaction

Formule : `2d6 + esprit + initiative`, réussite à 9 ou plus. S'y ajoutent l'embuscade (+2, ou −1 si les héros sont surpris), l'initiative ennemie la plus haute (en malus, calculée d'office et corrigeable dans les options) et, si le MJ l'accorde, le rang d'une carrière utile du héros (bouton Modificateurs de sa ligne).

Dés de bonus ou de malus, deux au plus : le trait du héros (Vigilant, Lent à la détente), et le dé du MJ pour ce héros (Modificateurs). La ligne du héros dit d'où ils viennent.

- Une ligne par héros, triées par agilité brute décroissante. On tape le total des dés, ou « Lancer pour tous ».
- Double 1 : case « échec critique » ; double 6 : case « légendaire » (−1 point d'héroïsme).
- L'ordre d'action suit le livre : héros légendaires, héroïques, en réussite, rivaux, coriaces, héros en échec, piétaille, héros en échec critique. À égalité entre héros, l'agilité brute départage.

Ce que le résultat change ensuite :

| Résultat | Effet dans l'application |
| --- | --- |
| Succès héroïque ou légendaire | Coriaces et piétaille sont bloqués au round 1. |
| Succès légendaire | +1 aux jets d'attaque de ce héros, et de lui seul, pour toute la rencontre. |
| Échec critique | Le héros agit en dernier, et perd le bénéfice de son bouclier au round 1. |

## 3. Le jet d'attaque

Formule : `2d6 + bonus d'attaque − défense de la cible + posture + effets en cours`, réussite à 9 ou plus.

- **Bonus d'attaque** : agilité + mêlée (ou tir) ; pour une créature, son attaque combinée.
- **Avant le jet** : l'assistant annonce ce qu'il faut aux dés et les chances de toucher, pour la cible choisie et sur le jeton de chaque adversaire.
- **Saisie** : on tape le total des dés lancés à table, ou on les lance à l'écran.
- **Dé du MJ** (carte « L'attaque ») : un dé de bonus ou de malus (3d6, on garde les deux meilleurs ou les deux moins bons).
- **Capacités d'attaque** : « Attaque féroce » et « Armes améliorées » donnent d'office un dé de bonus, « Attaque timide » un dé de malus ; ils s'annulent avec le dé du MJ.
- **Dés de foi** : ceux qu'un prêtre a donnés ou imposés à l'attaquant (§ 6 ter) s'y ajoutent, et se cumulent avec le dé du MJ.
- **Double 1** : raté, quel que soit le total. **Double 6** : touché, quel que soit le total.
- **Postures** : défensive, offensive, intrépide, combat à deux armes, attaque au défaut de l'armure. Créatures et démons n'en ont pas.
- **Portée** (tir) : de bout portant (+1) à maximale (−8), courte d'office ; la distance de chaque cran vient de la portée de l'arme.
- **Modificateur du MJ** : de −6 à +6, à côté du dé du MJ.
- **Carrière** (manœuvre ou feinte) : le rang d'une carrière du héros, ou du rival (créé comme un héros, livre p. 66 ; `feinteAvecCarrieres`), à l'attaque ou aux dégâts. La feinte est notée sur la cible : retentée par le même attaquant, l'assistant le signale.
- **PNJ** : considérés comme équipés de toutes leurs armes et armures.

## 4. Le jet de dégâts

Formule : `dé de l'arme + vigueur − protection de la cible + effets en cours`, jamais négatif.

- Dés : d3, d6, d6M (le moins bon de deux), d6B (le meilleur de deux).
- À distance et à mains nues, la vigueur compte pour moitié (arrondie à l'inférieur).
- Bagarre à mains nues : la case « Bagarre » fait jouer la vigueur à la place de l'agilité pour l'attaque. Un coup à mains nues ne fait pas passer sous 0 : la cible est assommée, sans coma ni « Défier la mort », et ses dégâts à mains nues reviennent en entier après le combat.
- Avec moins de 0 en vigueur, les armes lourdes (d6B) sont grisées : elles ne se manient pas.
- La protection est la valeur fixe de l'armure portée ; un casque y ajoute +1, seulement avec une armure (livre p. 52), et Peau dure +1, même sans armure (`equippedProtection`, `combat-attack.util.ts`). Un démon tire sa protection de ses pouvoirs : Cuirassé d6 (4), sinon Armure d6-2 (2) (`demonProtection`, `combat-play.util.ts`, noms comparés sans accents). Le MJ peut lancer le dé de protection à la place, ou saisir une valeur.
- « Appliquer » retire les dégâts à la cible. Un héros qui passe sous 0, ou sous −5, se voit proposer « Défier la mort » ; sous −5, il se stabilise et ne perd plus de vitalité.

## 4 bis. Pouvoirs des démons et morts-vivants

Les pouvoirs sont recopiés sur la carte à la table (`pouvoirs-combat.util.ts`, `combat-play.util.ts`) ; leurs noms se comparent sans accents.

- **Régénération** : au début de chaque round, un démon debout reprend 1 de vitalité, sans dépasser son maximum ; la table l'annonce (`regenerationsDuRound`, `CombatWoundsService`). Un coup précis contre lui ne dure que 2 rounds.
- **Intangible** : quand il est la cible, la carte « Les dégâts » prévient que seules la sorcellerie et l'alchimie le blessent ; le MJ décide.
- **Poison** : quand le démon touche une cible de taille moyenne ou moins (héros et PNJ comptent comme moyens), la carte « Les dégâts » rappelle le jet de vigueur Difficile (−2) et propose « Paralysé ».
- **Vulnérabilité** : sa carte montre sa faiblesse (« Vulnérable : feu (dégâts doublés) ») ; quand il est la cible, « Dégâts doublés » double les dégâts du coup.
- **Avertissements** : les pouvoirs marqués « à prévenir » (Poison, Intangible) s'affichent sur sa carte, à côté de son rang.
- **Morts-vivants** (case « Mort-vivant » de la fiche de créature, `bol_creature.mort_vivant`) : leurs cartes disent « Force vitale » ; à 0, la frise dit « détruit ».
- **Cuirassé** et **Armure** donnent leur protection, d6 (4) et d6-2 (2).

## 5. Le registre d'effets

Ce qui dure d'un tour à l'autre est gardé dans `etat_combat.effets` (JSON de la session). Un effet a un porteur, une statistique (`attaque`, `defense`, `degats`, `protection`, `action`), une valeur, un sens (`attaque` : le porteur attaque ; `subie` : il est attaqué) et une durée.

Durées : un nombre d'usages, la fin du round, le début du prochain tour du porteur, la prochaine action du porteur, la fin du combat.

### Effets posés par l'application

| Règle | Effet | Durée |
| --- | --- | --- |
| Petit bouclier | −1 à une attaque subie | Une fois par round |
| Posture défensive | +1 en défense | Jusqu'à son prochain tour |
| Posture offensive | −1 en défense | Jusqu'à son prochain tour |
| Attaque intrépide | −2 en défense, bouclier perdu | Jusqu'à son prochain tour |
| Parade à deux armes | +1 en défense | Une attaque subie, ou jusqu'à son prochain tour |
| Défense totale | +2 en défense | Jusqu'à son prochain tour |
| Coup précis | Dé de malus | Jusqu'à la fin du combat |
| Renversement | Dé de malus | Jusqu'à sa prochaine action |
| Juste une égratignure | Perd sa prochaine action : quand son tour vient, il est sauté d'office (`commencerTour`) ; la frise garde « a perdu son action » | Jusqu'à son prochain tour (la trace) |
| Coup précis sur un démon qui se régénère | Dé de malus | 2 rounds |
| Paralysé (poison d'un démon, bouton « Paralysé » de la carte des dégâts) | La carte ne joue plus, la frise dit « paralysé » | Jusqu'à ce que le MJ retire l'effet |

### Effets posés par le MJ

Le menu « + Effet » propose, pour l'attaquant ou la cible : +1 en défense jusqu'à la fin du round, dé de malus à sa prochaine action, −1 à ses jets d'attaque jusqu'à la fin du round, perd sa prochaine action (son tour sera sauté) — et « effet libre… » : un petit formulaire dans le popover des effets (`effetLibre`, `dureesLibres`) avec un nom (60 caractères), ce qu'il change (attaque, défense, dégâts, protection, ou action : un dé de malus), une valeur de −6 à +6 et une durée (fin du round, son prochain tour, N rounds, fin du combat ; N attaques subies pour la défense, seule à s'user ainsi ; sa prochaine action pour un dé de malus).

### Comportement

- Les effets entrent tout seuls dans l'addition des jets, un terme par effet, avec une croix pour le retirer.
- Un jet fige les effets qu'il a lus : retaper ou relancer garde le même bouclier.
- Une carte qui porte un dé de malus part à 3d6 en gardant les deux moins bons.
- La frise marque les cartes qui portent des effets et les liste en infobulle.
- Les enregistrements se font en file, dans l'ordre. Les actions de tour (fin du tour, défense totale) sont ignorées pendant un enregistrement, pour qu'un double clic ne termine pas deux tours.

## 6. L'héroïsme sur le jet d'attaque

Les usages de l'héroïsme du jet d'action valent pour le jet d'attaque.

- **Dépenser des points** : les héros, et les rivaux avec leur vilenie. Gagner un point (échec critique) : les héros seulement. Le compteur est sur la ligne de l'attaquant.
- **Succès héroïque sur double 6** : les héros et leurs alliés. Pour leurs adversaires, le double 6 touche, sans plus.

| Résultat des dés | Bouton | Effet |
| --- | --- | --- |
| Raté | Faveur divine −1 | La case du total se vide : on tape ou on lance le second jet, qui est gardé. |
| Double 1 | Échec critique +1 | Le héros gagne un point ; la faveur divine n'est plus proposée. |
| Touché | Succès héroïque −1 | Une option de succès héroïque. |
| Double 6 | Succès légendaire −1 | Deux options au lieu d'une. |

- **Côté défenseur** : un héros ou un rival touché peut dépenser 1 point pour une « Parade in extremis » (pas de dégâts ; son bouclier, ou son arme, est brisé : quand il a les deux, un choix « Bouclier » / « Arme » à côté du bouton dit lequel, le bouclier d'office ; `objetsDeParade`), ou, une fois les dégâts appliqués, pour « Juste une égratignure » (d6B rendu, sans dépasser les dégâts du coup, et il perd sa prochaine action : son tour sera sauté). Un rival avec un sbire à ses côtés a aussi « Bouclier humain » : le sbire encaisse le coup.
- **Fuite opportune** (rival, livre p. 133) : sur la carte d'un rival qui a encore de la vilénie (ouverte par « Fiche », ou par la barre de commande `/`, qui trouve aussi les cartes de la table en combat), le bouton « Fuite opportune (−1 vilénie) » demande confirmation, dépense 1 point et le rival quitte le combat : il ne joue plus, ne se vise plus et ne compte plus pour l'issue ; la frise l'éteint, « enfui » ; la table l'annonce. Le bouton reste offert à un rival à 0 ou moins (« il semblait mort »). Sa fiche reste sur la table. L'état garde la fuite (`etat_combat.fuis`, aussi dans `exclus`) : un rechargement ou un nouveau jet de réaction ne le ramène pas.
- **Interrompre** : un héros qui a retardé son action peut, pour 1 PH, agir tout de suite (bouton dans la barre de la frise).
- **Double 6 de justesse** : si seul le double 6 pouvait toucher, le coup touche normalement, sans option gratuite ni légendaire. Il reste convertible en succès héroïque pour 1 point.
- **Pas de légendaire depuis un succès héroïque acheté**, comme le veut le livre.
- **Remboursement** : refaire le jet rend ce que les cases cochées avaient coûté ou rapporté. Changer de cible ou d'arme en cours de jet ne rend rien.

### Options de succès héroïque

Une pour un succès héroïque, deux pour un succès légendaire, la même deux fois si on veut.

| Option | Ce que fait l'application |
| --- | --- |
| Coup dévastateur | +6 aux dégâts par exemplaire. |
| Désarmement | Pas de jet de dégâts ; un bouton conclut le coup. Grisé (avec son infobulle) contre une cible sans arme en main : un héros sans arme équipée, un PNJ sans arme, une créature ou un démon. |
| Coup précis | Dé de malus sur la cible jusqu'à la fin du combat, posé quand le coup est appliqué. |
| Renversement | Dé de malus à la prochaine action de la cible, posé quand le coup est appliqué. Grisé contre une cible plus grande de plus d'une catégorie que l'attaquant (livre p. 59 ; héros, PNJ et démons comptent comme moyens). |
| Carnage | Nouvelle attaque immédiate annoncée ; plus aucune dépense d'héroïsme jusqu'à la fin du tour. Pris deux fois, si la première attaque qu'il donne rate, la ligne des dégâts le dit et propose « Attaque suivante (Carnage) ». |
| Massacrer la piétaille | Seulement contre une piétaille (grisé sinon). « Appliquer » ouvre un dialogue : les dégâts sont le nombre de piétailles mises hors de combat, cochées d'office (la cible, puis les autres piétailles debout de son camp) ; le MJ coche ou décoche, et chacune est mise à 0. |

Les options impossibles restent visibles et focalisables (`aria-disabled`), leur infobulle dit pourquoi (`optionHeroiqueBloquee`).

## 6 ter. La magie en combat

Règles : `doc/rules/05-alchimie-foi-sorcellerie.md` (livre p. 146-157), avec ce que l'application a interprété.

### La foi (livre p. 146)

- **Réserve** : une carte a de la foi quand sa fiche a un rang de prêtre (ou druide) d'au moins 1, ou des points de foi. Ses points sont sous ses chiffres, à côté de l'héroïsme (« Foi », corrigeables à la main). Un héros les dépense sur sa fiche, comme son héroïsme ; un PNJ sur sa ligne de table (`bol_fight_session_pnj.foi_courante`, partie de sa fiche à la pose).
- **Dé de foi** : le bouton rond à côté de ses points ouvre un menu, « Dé de bonus à… » (lui, puis son camp, puis l'autre) ou « Dé de malus à… » (l'autre camp d'abord), parmi les cartes encore en combat et debout (`cartesVisibles`). Le choix pose l'effet `de-foi-bonus` ou `de-foi-malus` sur la carte choisie et dépense 1 point, sans jet.
- **Quand** : sur la ligne de qui joue, et sur la carte de la cible quand c'est elle qui a la foi (un prêtre attaqué impose un dé de malus à son agresseur, comme dans l'exemple du livre).
- **Effet** : le dé entre dans la prochaine action de la carte (jet d'attaque ou de sort), puis tombe à la fin de son tour. Les dés de foi se cumulent entre eux et avec le dé du MJ ; la ligne de l'attaquant dit « Foi : 1 dé de bonus à cette action ».

### La sorcellerie (livre p. 148-157)

- **Qui** : une carte qui a des points de pouvoir (rang de sorcier sur la fiche, ou des points) : ses points sont sous ses chiffres (« Pouvoir »). Comme la foi : sur la fiche d'un héros, sur la ligne d'un PNJ (`pouvoir_courant`).
- **Attaque ou sort** : dans la zone des armes, « Attaque | Sort ». En sort, la zone règle le sort, sans catalogue : la puissance (charme, 1er, 2e, 3e cercle, avec leur coût), la difficulté sur l'échelle du livre (‹ ›, celle du cercle d'office, une autre en pointillé), les conditions d'incantation remplies (la première comprise ; un charme : 1 ou 2 points), « Blesse », « Sur l'esprit ». Le titre donne le coût, surcoût de l'armure compris.
- **Le jet** (« Le sort », à la place de l'attaque) : `2d6 + esprit + sorcier ± difficulté`, moins l'esprit de la cible pour un sort sur l'esprit, plus le modificateur du MJ ; 9 ou plus. Le dé du MJ, les dés de foi et « Magie des Rois-Sorciers » y jouent. Le premier jet (tapé ou lancé) paie le sort ; vider la case le rend. Sans assez de pouvoir, le jet reste fermé. Un charme automatique se lance d'un bouton, sans jet.
- **Verdict** : le sort agit, ou échoue (le pouvoir reste dépensé) ; double 1 et double 6 comme à l'attaque ; pour un héros, faveur divine (relance sans repayer) et échec critique (+1 PH). Une fois lancé, le sort ne se règle plus et l'attaque n'est plus possible.
- **Dégâts** : un sort qui blesse passe à la ligne des dégâts : le dé de sa puissance (1, d6, d6×2, d6×3), sans vigueur ni protection (que le MJ peut saisir), « Dégâts doublés » contre une vulnérabilité ; « Appliquer » comme pour un coup, puis « Fin du tour ». Ni parade in extremis ni bouclier humain contre un sort.
- **Rappels** : sous le verdict, le coût ; au 3e cercle, le point de pouvoir perdu pour toujours (à reporter sur la fiche) ; une cible « Résistant à la magie » (d6 : sur 6, sans effet).
- **Sans cible** : un sort qui ne blesse pas et ne vise pas un esprit (invocation, illusion) se lance sans cible ; son effet se décrit, ou se pose en effet (« + Effet »).

## 7. La mêlée de piétaille

Livre p. 132 : quand de la piétaille affronte de la piétaille, pas de jet d'attaque. Dès que les deux camps ont de la piétaille debout (ni hors de combat, ni exclue ; celle du camp des héros, ce sont leurs suivants), l'en-tête montre « Mêlée de piétaille ».

- Le dialogue donne l'effectif debout de chaque camp et son dé : le plus nombreux tue d6M adversaires, l'autre lui en tue d3 ; à égalité, chacun perd d3. Chaque camp tape son dé lancé à table ou le lance à l'écran (d6M : le moins bon de deux d6).
- L'application propose qui tombe dans chaque camp, les derniers dans l'ordre de jeu, jamais plus que l'effectif debout ; le MJ coche ou décoche. « Appliquer » met chacun à 0 de vitalité (hors de combat) et la table annonce les pertes.
- Une fois par round : l'état retient le round de la dernière mêlée (`etat_combat.melee`) ; le bouton reste grisé, avec une infobulle qui dit pourquoi, jusqu'au round suivant.
- La piétaille garde ses tours pour attaquer les héros en horde.

## 8. Hypothèses prises

Le livre ne tranche pas ces points ; l'application a choisi, et le MJ peut corriger à la main.

- **Durée d'une posture** : jusqu'au début du prochain tour de celui qui l'a prise.
- **Dé de malus du coup précis** : jusqu'à la fin du combat, et sur tous les jets d'attaque de la cible.
- **Échec critique sur une attaque** : seul le point d'héroïsme est accordé ; l'issue défavorable est à poser par le MJ.
- **Égalité entre héros dans l'ordre d'action** : agilité brute, sans le malus d'armure.
- **Mêlée de piétaille à égalité de nombre** : chaque camp perd d3 ; une mêlée par round.
- **Coût de la fuite opportune** : 1 point de vilénie, comme les options des points d'héroïsme.
- **Dé de foi** : il porte sur la prochaine action de la carte, et tombe à la fin de son tour ; les dés de foi se cumulent avec le dé du MJ.
- **Sort raté** : le pouvoir est dépensé quand même (le livre ne dit rien ; l'alchimie perd ses points sur un échec).
- **Dégâts d'un sort** : sans vigueur ni protection (« automatiquement », p. 151) ; d6×2 et d6×3 aux 2e et 3e cercles (le livre ne chiffre que le 1er cercle) ; 1 pour un charme (« Douleur »).
- **Surcoût de l'armure** : ajouté après le coût minimum du cercle.
- **Contre un sort** : ni parade in extremis ni bouclier humain ; un succès héroïque renforce l'effet au choix du MJ.

## 9. Limites connues

Toutes les règles de combat du livre sont gérées ; `doc/plans/2026-11-02-reste-a-faire.md` (section 2) ne garde que le script navigateur rejouable pour l'héroïsme. Les limites qui restent :

- pas d'annonce vocale des effets expirés ;
- pas d'annulation d'un « Retirer du combat » : la carte revient en jeu après le combat, ou par un nouveau jet de réaction ;
- les jours qui suivent le combat ne sont pas suivis : le jet quotidien du soigneur n'est qu'un rappel ;
- la taille d'un démon n'est pas notée : il compte comme moyen pour le renversement ;
- une créature ou un démon compte comme sans arme en main : le désarmement est grisé contre eux, même contre un humanoïde armé ;
- le dé de foi ne se donne que depuis la ligne de qui joue ou la carte de sa cible : un prêtre qui n'est ni l'un ni l'autre attend son tour (ou le MJ pose un dé de malus avec « + Effet » et corrige la foi à la main) ;
- la condition d'incantation « blessures » n'est pas appliquée d'office (le MJ corrige la vitalité du sorcier), ni la perte définitive d'un point de pouvoir au 3e cercle (rappelée seulement) ;
- un sort ne vise que les cartes d'en face : un sort sur un allié (« Peau écailleuse ») se pose en effet à la main ;
- les points de pouvoir et de foi ne reviennent pas tout seuls (midi, minuit, temple) : le MJ corrige la fiche.

## 10. Où c'est dans le code

Tout est sous `front/src/app/bol/session/`, sauf mention contraire.

| Sujet | Fichiers |
| --- | --- |
| Jet de réaction, ordre d'action | `reaction-roll.util.ts`, `initiative.util.ts`, `start-combat/` |
| Calcul de l'attaque et des dégâts, options héroïques | `combat-resolution.util.ts` |
| Statistiques de combat d'une carte | `combat-attack.util.ts` |
| Registre d'effets | `play/tapis/combat-effects.util.ts`, `models/combat-effect.model.ts` |
| Tours et rounds | `play/tapis/combat-turn.util.ts`, `play/etat-saver.ts` |
| Écran de combat | `play/combat-board/`, `play/tapis/turn-order.*`, `play/tapis/turn-assistant*`, `play/tapis/combattant-carte.*`, `play/tapis/effects-list.ts`, `play/end-turn-dialog/`, `play/defier-la-mort-dialog/` |
| Page, enregistrements | `play/session-play-page.ts` |
| Jet d'action du héros | `action-roll.util.ts`, `play/action-roll-panel/` |
| Secours et soins | `rescue.util.ts`, `play/rescue-dialog/`, `play/after-combat-dialog/` |
| Options de succès héroïque possibles, massacre, parade | `play/tapis/options-heroiques.util.ts`, `play/massacre-pietaille-dialog/`, `TurnFlowStore` |
| Retrait du combat, tour sauté, chutes oubliées | `play/tapis/combat-turn.util.ts` (`retirerDuCombat`, `commencerTour`, `cartesRelevees`), `CombatTurnStore.withdraw`, `ExpandedCardStore` (confirmation) |
| Fuite opportune | `play/tapis/fuite-opportune.util.ts`, `CombatTurnStore.flee`, `ExpandedCardStore` (confirmation) |
| Mêlée de piétaille | `play/tapis/melee-pietaille.util.ts`, `play/melee-pietaille-dialog/`, `CombatWoundsService.onPietailleMelee` |
| Foi et sorcellerie : coût, jet, issue, dégâts, réserves | `magie-combat.util.ts`, `models/magie-combat.model.ts`, `play/tapis/de-foi.ts`, `play/tapis/tas-sort*`, `TurnLoadoutStore` (le sort réglé), `TurnAttackStore` (le jet), `TurnFlowStore` (payer, lancer), `CombatStatsStore.onRessourceAdjusted` ; serveur : `BolHerosService::adjustRessource`, `BolFightSessionService::adjustPnjRessource` |
| Validation de l'état côté serveur | `backend/app/Http/Services/Bol/BolCombatState.php` |

Chaque fichier `*.util.ts` a son `*.spec.ts` à côté.
