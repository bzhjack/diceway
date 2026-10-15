# Combat : erreurs à corriger et ce qui reste à faire

Date : 2026-10-14. Deux études réunies :
- **l'audit** des calculs qui existent déjà, confrontés aux règles et aux données en base (lot 0, points A1 à A10) ;
- **ce qui manque** : les règles du livre que l'application ne gère pas encore (lots 1 à 4, points 1 à 17).

Sources :
- Règles : `doc/rules/02-actions-combat.md`, `04-pnj-creatures-demons.md`, `05-alchimie-foi-sorcellerie.md` (vérifiables dans `doc/pdf-text/`).
- État de l'application : `doc/plans/2026-10-13-combat-etat-des-lieux.md`, le code de `front/src/app/bol/session/`, et les données en base (bestiaire, démons, armures, options de combat).

Chaque point donne la règle, ce que fait l'application aujourd'hui, une proposition et un effort estimé : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## Synthèse

| # | Sujet | Nature | Effort | Lot |
| --- | --- | --- | --- | --- |
| A1 | Multiplicateur des dégâts de créature (×2, ×3, ×4) ignoré | **Fait le 2026-10-14** | M | 0 |
| A2 | Dégâts fixes de créature (« 0 », « 1 ») lus comme un d6 | **Fait le 2026-10-14** | avec A1 | 0 |
| A3 | Modificateur des dégâts de créature (« d6-2 ») ignoré | **Fait le 2026-10-14** | avec A1 | 0 |
| A4 | Dégâts « spécial » lus comme un d6 | **Fait le 2026-10-14** | avec A1 | 0 |
| A5 | Protection des démons (Armure, Cuirasse) ignorée | **Fait le 2026-10-14** | S | 0 |
| A6 | « Attaques dévastatrices » des démons sans effet | **Fait le 2026-10-14** (à la table) | S | 0 |
| A7 | Héros à 0 de vitalité toujours en jeu | **Fait le 2026-10-14** (point 2) | M | 1 |
| A8 | Double 6 « de justesse » au jet de réaction | **Fait le 2026-10-14** | S | 0 |
| A9 | Bouclier gardé contre une attaque surprise | **Fait le 2026-10-14** | S | 0 |
| A10 | PNJ sans arme : d3 au lieu de 1 | **Fait le 2026-10-14** | S | 0 |
| 1 | Dégâts à mains nues : vigueur/2 | **Fait le 2026-10-14** | S | 1 |
| 2 | Héros à 0 de vitalité : hors de combat | **Fait le 2026-10-14** | M | 1 |
| 3 | Mourant : −1 vitalité par round | **Fait le 2026-10-15** | S | 1 |
| 4 | Arme lourde interdite sous 0 de vigueur | **Fait le 2026-10-15** | S | 1 |
| 5 | Fin du tour sans appliquer le coup | **Fait le 2026-10-15** | S | 1 |
| 6 | Portée des armes à distance | Règle absente | M | 2 |
| 7 | Modificateur libre, bonus de carrière, feinte | Règle absente | M | 2 |
| 8 | Carrière utile au jet de réaction | Règle absente | S | 2 |
| 9 | Héroïsme du défenseur, interrompre | Règle absente | M | 2 |
| 10 | Secourir un mourant, soins | **Fait le 2026-10-15** | M | 2 |
| 11 | Bagarre à mains nues | Règle absente | M | 2 |
| 12 | Avantages et pouvoirs des créatures et démons | Règle absente | L | 3 |
| 13 | Horde de piétaille | Règle absente | M | 3 |
| 14 | Points de vilenie des rivaux | Règle absente | M | 3 |
| 15 | Sorcellerie en combat | Règle absente | L | 4 |
| 16 | Foi en combat | Règle absente | S | 4 |
| 17 | Petites limites de l'assistant | Confort | S à M | au fil de l'eau |
| — | Vigueur ajoutée aux dégâts des créatures | **Corrigé le 2026-10-14** | — | — |

Les lots sont un ordre proposé : d'abord corriger les calculs faux (lot 0), puis compléter ce qui est faux par omission (lot 1), puis ce qui sert à chaque combat, puis le bestiaire, puis la magie.

## Lot 0 : erreurs dans ce qui existe

**Lot 0 fait le 2026-10-14** (A7 avec le point 2 du lot 1). Vérifié à l'écran sur Dinohyus (`d6x2`), Ganuc (`1`), Kyphus (`d6-2`), Xolth (`spécial`) et un démarrage avec « Héros surpris » ; les autres corrections sont couvertes par des tests unitaires.

### A1. Multiplicateur des dégâts de créature ignoré

- **Règle** (livre p. 108, bestiaire, `doc/pdf-text/04-bestiaire-pnj-p108-135.txt` l. 30) : « Si le dé de dégâts est suivi d'un x2, x3 ou x4, cela signifie que vous multipliez le résultat du dé par le chiffre indiqué. »
- **En base** : `d6x2`, `d6Bx2`, `d6x3`, `d6Bx3`, `d6Bx4` (Dinohyus, Deodarg, Drakk, Elasmotherium, Eldaphon, Jemadar, Kalathorn, Ours des cavernes, Poad, Sardolith, Scorpion-araignée géant, Banth, Zathog, Béhémathon, Chark).
- **Aujourd'hui** : `damageDie` ne lit que le type de dé (`d6`, `d6B`) ; le multiplicateur est perdu. Un Béhémathon (`d6Bx4`) fait 1 à 6 dégâts au lieu de 4 à 24.
- **Correction** : lire la chaîne de dégâts en entier (dé, multiplicateur, modificateur, ou valeur fixe), multiplier le résultat du dé avant de retirer la protection, et l'afficher dans l'addition (« 5 ×2 »). La fourchette annoncée avant le jet doit suivre.
- **Où** : `combat-resolution.util.ts` (`damageDie`, `rawDamage`, `damageRange`), `turn-assistant.ts` (addition des dégâts, saisie du dé).
- **Fait** : `parseDamage` lit la chaîne entière (dé, multiplicateur, modificateur, valeur fixe, ou `null` pour « spécial ») et `scaleDamage` applique multiplicateur puis modificateur ; l'addition des dégâts montre « ×2 taille » et la fourchette suit. Testé sur tous les formats présents en base.

### A2. Dégâts fixes lus comme un d6

- **Règle** : la piétaille et les très petites créatures font des dégâts fixes (table des tailles : minuscule `1`) ; certaines créatures n'en font pas (`0`).
- **En base** : Fangeux `0`, Ganuc `1`, Jit `1`, et une créature d'utilisateur à `1`.
- **Aujourd'hui** : `damageDie` ne trouve ni `d3`, ni `m`, ni `b`, et renvoie `d6` : l'assistant demande un d6.
- **Correction** : une valeur fixe n'a pas de jet ; la case des dégâts est préremplie (et la protection s'applique normalement).
- **Fait** : pas de case de dé ; les dégâts (« 1 fixes ») sont connus dès que le coup touche, et le bouton « Appliquer » est prêt.

### A3. Modificateur des dégâts de créature ignoré

- **En base** : Kyphus `d6-2`.
- **Aujourd'hui** : lu comme un `d6`, le −2 est perdu.
- **Correction** : comprise dans la lecture de A1 (terme « −2 » dans l'addition).
- **Fait** : terme « −2 profil » dans l'addition.

### A4. Dégâts « spécial »

- **En base** : Xolth `spécial` (attaque décrite dans son profil).
- **Aujourd'hui** : lu comme un `d6`, sans avertissement.
- **Correction** : pas de dé proposé ; un rappel « dégâts spéciaux : voir la fiche » et une saisie libre du total.
- **Fait** : pas de bouton de dé ; « spécial : voir la fiche, et tape le total », et la case accepte un total jusqu'à 99.

### A5. Protection des démons ignorée

- **Règle** (`04-pnj-creatures-demons.md`, pouvoirs démoniaques) : Armure donne une protection `d6-2 (2)` ; Cuirasse, `d6 (4)`.
- **En base** : desckard a le pouvoir Armure.
- **Aujourd'hui** : la protection d'un démon à la table est toujours vide (`combat-play.util.ts`, `protection: null` pour les démons) ; ses pouvoirs ne sont pas lus. Un démon cuirassé encaisse tout.
- **Correction** : déduire la protection des pouvoirs du démon (Cuirasse prime sur Armure), côté backend dans l'instantané de la table ou côté front à la résolution des statistiques.
- **Fait** : `demonProtection` (`combat-play.util.ts`) déduit la protection des pouvoirs du démon à la table ; elle sert au jet de dégâts comme une armure (valeur fixe, ou dé de protection).

### A6. « Attaques dévastatrices » des démons sans effet

- **Règle** : les dégâts passent à la catégorie de taille supérieure.
- **Aujourd'hui** : les dégâts d'un démon viennent de sa catégorie (formulaire du démon) et ne sont jamais montés d'un cran ; le pouvoir n'est lu nulle part. Vul'mazzanlu (`d6B`) est peut-être déjà ajusté à la main, desckard probablement pas.
- **Correction** : soit monter les dégâts automatiquement quand le pouvoir est pris (dans le formulaire du démon, avec un rappel), soit à la table. À trancher : le formulaire est le plus simple, et le statbloc montre alors la bonne valeur. Les autres pouvoirs et avantages (dé de bonus, régénération…) sont au point 12.
- **Fait, à la table** : `demonDegats` monte d'une catégorie les dégâts restés ceux de la catégorie du démon (mineur d6M → d6, inférieur d6 → d6B, majeur d6B → d6x2) ; des dégâts déjà relevés à la main ne sont pas montés deux fois. Le formulaire et le statbloc du démon montrent toujours les dégâts saisis.

### A7. Héros à 0 de vitalité toujours en jeu

- **Règle** (« Blessures, inconscience et mort ») : à 0, hors de combat, pour tout personnage.
- **Aujourd'hui** : `isOut` ne sort un héros qu'en négatif (`combat-turn.util.ts`).
- **Correction** : voir le point 2 (en attente de la question sur l'état « inconscient »).

### A8. Double 6 « de justesse » au jet de réaction

- **Règle** (p. 56, vaut pour tout jet d'action) : un double 6 n'est un succès héroïque que si l'action pouvait réussir sans lui.
- **Aujourd'hui** : appliqué au jet d'action et au jet d'attaque, pas au jet de réaction (`reactionResult` : tout 12 est héroïque, ou légendaire).
- **Cas réel** : un héros sans esprit ni initiative, surpris (−1) face à un rival d'initiative 3 (−3), ne touche 9 qu'avec 12 ; son 12 devrait être une simple réussite.
- **Correction** : même règle que `suggestedActionResult`.
- **Fait** : `reactionResult` donne une simple réussite, et le dialogue ne propose plus le succès légendaire dans ce cas.

### A9. Bouclier contre une attaque surprise

- **Règle** (`doc/resources/armures.md`) : un personnage ne bénéficie de son bouclier que s'il est conscient de l'attaque.
- **Aujourd'hui** : le bouclier compte toujours, même pour des héros pris en embuscade au round 1.
- **Correction** : quand « Héros surpris » est coché au démarrage, poser l'effet « sans bouclier » sur les héros pour le round 1 (le registre le sait déjà pour l'échec critique). Le MJ peut le retirer.
- **Fait** : au démarrage avec « Héros surpris », chaque héros et allié du combat reçoit l'effet « surpris » (sans bouclier) jusqu'à la fin du round 1, retirable à la main. Pas pour un nouveau jet de réaction en cours de combat.

### A10. PNJ sans arme

- **Règle** (piétaille) : dégâts `1`, ou `d3` avec une arme ; à mains nues `1`.
- **Aujourd'hui** : un PNJ sans arme reçoit `d3` par défaut (`combat-attack.util.ts`).
- **Correction** : `1` pour une piétaille sans arme ; à voir pour les coriaces et rivaux (le livre leur donne des dégâts d'arme normaux, donc ils ont une arme).
- **Fait** : une piétaille sans arme frappe pour `1`.

## Lot 1 : compléter ce qui est faux par omission

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
- **Fait le 2026-10-14** :
  - tout personnage est hors de combat à 0 ou moins (`isOut`, `horsCombat` dans `combat-turn.util.ts`) ;
  - la frise éteint son médaillon (grisé, liseré en pointillés) et dit pourquoi dans l'infobulle : « inconscient » à 0, « mourant » de −1 à −5, « mort » à −6 ou moins, « hors de combat » pour les autres ;
  - à chaque nouveau round, un héros resté à 0 choisit entre « Reprendre ses esprits (−1 PH) », qui le remonte à vitalité/2 arrondie au supérieur et le fait rejouer, et « Sombrer », qui pose une trace « inconscient » pour tout le combat (plus de question ensuite) ; sans point d'héroïsme, il sombre d'office, avec un message ;
  - la récupération d'après combat rend bien vitalité/2 à un héros resté à 0 (moitié des points perdus depuis 0).
  - Limite : un héros qui a sombré, puis est soigné et retombe à 0 dans le même combat, n'a plus la question.

### 3. Mourant : −1 vitalité par round

- **Règle** : sous 0, le personnage est dans le coma et perd 1 vitalité par round, jusqu'à être soigné, mort (−6) ou sauvé par « Défier la mort ».
- **Aujourd'hui** : rien ne se passe d'un round à l'autre ; « Défier la mort » n'est proposé que quand un coup fait franchir un seuil.
- **Proposition** : au passage au round suivant, chaque héros mourant non stabilisé perd 1 vitalité, avec une annonce dans la frise. S'il franchit −5, « Défier la mort » est proposé. Un effet « stabilisé » (durée : combat) arrête la perte ; il est posé par « Défier la mort » au-delà de −5, ou par les soins (point 10).
- **Effort** : S, si le point 10 vient plus tard (l'effet se pose alors à la main).
- **Fait le 2026-10-15** :
  - à chaque nouveau round, un héros mourant (−1 à −5), ni stabilisé ni retiré du combat, perd 1 de vitalité (`herosMourants` dans `combat-turn.util.ts`) ;
  - un message l'annonce (« … est mourant : il perd 1 de vitalité (−3) ») avec un bouton « Stabilisé » : pour un héros secouru à la table, le point revient et un effet « stabilisé » (durée : combat) arrête la perte ;
  - celui qui passe de −5 à −6 se voit proposer « Défier la mort » ; « Se stabiliser (−1 PH) » pose le même effet. C'est aussi le cas quand un coup le fait passer sous −5 ;
  - la frise dit « stabilisé » au lieu de « mourant » ou « mort ».
  - Limite : un héros stabilisé, soigné, puis de nouveau mourant dans le même combat, ne perd plus de vitalité (l'effet reste jusqu'à la fin du combat).

### 4. Arme lourde interdite sous 0 de vigueur

- **Règle** (« Dégâts ») : un personnage ayant moins de 0 en vigueur ne peut pas manier les armes lourdes.
- **Aujourd'hui** : l'assistant propose toutes les armes équipées.
- **Proposition** : griser les armes lourdes (`d6B`) dans « Avec quoi ? » pour un héros à vigueur négative, avec l'explication en infobulle.
- **Effort** : S.
- **Fait le 2026-10-15** : les armes `d6B` sont grisées (infobulle « Arme lourde : impossible à manier avec moins de 0 en vigueur ») et ne se choisissent pas, pour un héros comme pour un PNJ ; l'arme proposée par défaut est la première autorisée (`isHeavyWeapon` dans `attack-options.util.ts`).

### 5. Fin du tour sans appliquer le coup

- **Constat** (état des lieux, § 8) : « Fin du tour » dans l'en-tête ou la touche F, alors qu'un coup qui touche n'est pas appliqué, perd ses dégâts et les effets de ses options héroïques.
- **Proposition** : si un coup touché attend d'être appliqué, demander « Appliquer les dégâts avant de finir le tour ? » (Appliquer et finir / Finir sans appliquer / Annuler).
- **Effort** : S.
- **Fait le 2026-10-15** : « Fin du tour » (bouton de la carte « Qui attaque » ou touche F) ouvre « Le coup n'est pas appliqué » quand un coup a touché sans être conclu : « Appliquer N et finir » (ou « Conclure et finir » pour un désarmement), « Finir sans appliquer », « Annuler ». Sans dégâts saisis, seuls les deux derniers sont proposés. Au passage, une fin de tour qui suit un coup conclu attend l'enregistrement des effets du coup au lieu d'être ignorée.

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
- **Fait le 2026-10-15** :
  - « Secourir » apparaît dans la carte « Qui attaque » quand c'est le tour d'un héros et qu'un autre héros est mourant (ni stabilisé, ni retiré). Il ouvre « Secourir un mourant » : le mourant (choix s'il y en a plusieurs), la carrière du secouriste (Médecin, guérisseur ou rebouteux proposé d'office, ou une autre, ou aucune), la formule `2d6 + esprit + carrière + difficulté` avec la difficulté tirée de la vitalité (`rescueDifficulty` dans `rescue.util.ts`), ce qu'il faut aux dés et les chances ;
  - le total se tape, ou les dés se lancent dans le dialogue ; sur un échec, « Faveur divine » relance pour 1 PH ;
  - « Valider et finir le tour » : réussi, le mourant reçoit l'effet « stabilisé » (point 3) ; dans tous les cas le tour du secouriste se termine ;
  - en fin de combat, la boîte « Après combat » (voir ci-dessous) réunit la récupération et les soins médicaux.
  - Au passage : la récupération d'après combat soignait un PNJ allié avec le type « héros » (donc la mauvaise ligne) ; elle utilise maintenant le type de la carte.
  - Limites : seuls les héros secourent (pas les PNJ alliés) ; pas de dé de bonus ou de malus sur le jet de secours ; un soigneur soigne tous les blessés cochés, lui compris, sans limite de nombre ni jet quotidien de doublement.

### 11. Bagarre à mains nues

- **Règles** : le MJ peut autoriser la vigueur à la place de l'agilité pour l'attaque ; un personnage mis à 0 par une bagarre à mains nues perd simplement connaissance (ni coma ni perte de vitalité) et récupère tout après un court repos.
- **Aujourd'hui** : rien de cela.
- **Proposition** : avec les mains nues, une case « Bagarre » qui prend la vigueur à la place de l'agilité, et marque les dégâts comme « de bagarre ». Une cible mise à 0 par la bagarre est seulement assommée : pas de « Défier la mort », et récupération totale après le combat.
- **Effort** : M.
- **En partie fait le 2026-10-15** : la récupération totale (livre p. 65).
  - Chaque coup appliqué à mains nues (celles d'un héros, ou une arme « Mains nues » d'un PNJ) laisse une trace dans le registre (« 3 dégâts à mains nues », durée : combat, sans effet sur les jets) ; `degatsMainsNues` en fait la somme par carte.
  - « Terminer le combat » ouvre la boîte « Après combat », qui remplace la confirmation et « Soins médicaux » : pour chaque blessé du camp des héros, « Repos » rend la moitié des points perdus et la totalité des dégâts à mains nues (rien sous 0), puis « Soins » rend le rang du soigneur choisi (« Personne » possible). Chaque case se décoche ; rien n'est enregistré avant « Terminer le combat », « Annuler » laisse le combat en cours.
  - Reste à faire : la vigueur à la place de l'agilité, et la cible assommée à 0 (pas de coma ni de « Défier la mort »).

## Lot 3 : le bestiaire

### 12. Avantages et pouvoirs des créatures et démons

- **Règles** (`04-pnj-creatures-demons.md`) :

  | Capacité | Effet en combat |
  | --- | --- |
  | Attaque féroce (créature), Armes améliorées (démon) | Dé de bonus à l'attaque |
  | Attaque timide | Dé de malus à l'attaque |
  | Attaques multiples | Plusieurs jets d'attaque distincts |
  | Attaques dévastatrices (démon) | Dégâts d'une catégorie au-dessus — voir A6 |
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

## Vérifié conforme

Ces calculs ont été relus lors de l'audit et correspondent aux règles :

- **Jet d'attaque** : `2d6 + agilité + mêlée (ou tir) − défense`, seuil 9 ; créature : attaque combinée, sans agilité ; double 1 et double 6, y compris le double 6 de justesse.
- **Postures et options** (valeurs en base) : offensive +1/−1, défensive −1/+1, intrépide +2/−2 et bouclier perdu, parade à deux armes −1/+1 contre une attaque, double frappe −1 et dégâts montés d'une catégorie (deux légères → moyenne ; moyenne + légère ou deux moyennes → lourde), défaut de l'armure (malus = protection fixe, armure ignorée).
- **Défense totale** : +2, cumulable avec le bouclier.
- **Boucliers** : petit, −1 à une attaque subie par round ; grand, −1 à toutes (compté dans la défense).
- **Dégâts** : d3 = d6 divisé par deux arrondi au supérieur ; d6M, d6B ; vigueur en mêlée, moitié au tir et à mains nues (arrondie à l'inférieur) ; aucune vigueur pour une créature ; dégâts jamais négatifs.
- **Protection** : valeur fixe de l'armure, +1 avec un casque ; dé de protection au choix du MJ.
- **Agilité et initiative effectives** : malus d'armure et de grand bouclier sur l'agilité, malus du casque sur l'initiative.
- **Jet de réaction** : `2d6 + esprit + initiative`, embuscade +2 ou surpris −1, initiative ennemie la plus haute des coriaces et rivaux ; ordre d'action en huit rangs ; égalités par agilité.
- **Effets du résultat de réaction** : blocage des coriaces et de la piétaille au round 1, +1 aux attaques du seul héros légendaire, échec critique dernier et sans bouclier au round 1.
- **Héroïsme** : faveur divine, échec critique, succès héroïque acheté, légendaire seulement sur un vrai double 6, options héroïques.
- **Défier la mort** : entre −1 et −5, retour à 0 ; sous −5, stabilisation.
- **Récupération après le combat** : moitié des points perdus, arrondie au supérieur, pour les héros à 0 ou plus.
- **Hors combat** : PNJ, créature et démon à 0 ou moins.

## Questions à trancher avant de commencer

1. ~~**Héros à 0** (point 2)~~ : tranché, état « inconscient » visible dans la frise.
2. **Horde** (point 13) : grouper les piétailles dans la frise, ou seulement le temps de l'attaque ?
3. **Sorcellerie** (point 15) : faut-il un catalogue de sorts, ou une saisie libre (cercle, difficulté, coût) au moment du jet ?
4. ~~**Attaques dévastatrices** (A6)~~ : tranché, à la table (voir A6).
