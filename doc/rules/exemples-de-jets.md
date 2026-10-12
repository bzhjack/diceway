# Exemples de jets du livre de base

Recensement des exemples chiffrés du livre (Barbarians of Lemuria : Mythic, VF 1.3), pour vérifier que l'application calcule comme le livre.
Chaque exemple donne sa source, ses entrées, le calcul détaillé et le résultat attendu.

- Source : `doc/pdf-text/` (page livre = page PDF − 2 ; la page indiquée est la page livre où commence l'exemple, à ±1 selon la mise en page en colonnes).
- Dés : les faces citées par le livre sont reprises telles quelles. Pour tester l'application, on saisit ces totaux « à table ».
- Seuil de réussite d'un jet d'action, d'attaque ou de réaction : **9**.
- Les exemples sont numérotés pour s'y référer (`A1`, `R1`…). Le champ **Dans l'app** dit où l'écran concerné se trouve.

| Id | Sujet | Source | Résultat attendu | Dans l'app |
| --- | --- | --- | --- | --- |
| A1 | Jet d'action : défoncer une porte | ch. 3, p. 57 (`02-combat` l. 75) | 12, réussite | Fiche du héros, jet d'action |
| A2 | Jet d'action : sauter par-dessus une fosse | ch. 3, p. 57 (l. 96) | 9, réussite | Fiche du héros, jet d'action |
| R1 | Jet de réaction : Krongar et Rork contre des bandits | ch. 3, p. 61 (l. 322) | Krongar 11 réussite, Rork 8 échec | Dialogue « Démarrer le combat » |
| R2 | Succès héroïque puis légendaire | ch. 3, p. 61 (l. 348) | Krongar 13, héroïque, puis légendaire (−1 PH) | Dialogue « Démarrer le combat » |
| T1 | Portée : dague de jet | ch. 3, p. 62 (l. 422) | Bout portant ≤ 3 m (+1), Courte ≤ 6 m (0) | Duel, distance (tir) |
| T2 | Attaque à distance : lance sur un singe des neiges | ch. 3, p. 62 (l. 430) | 9, touche tout juste | Duel, jet d'attaque |
| T3 | Attaque de mêlée simple | ch. 3, p. 62 (l. 451) | 14, touche | Duel, jet d'attaque |
| T4 | Attaque avec dé de bonus (arme favorite) | ch. 3, p. 62 (l. 458) | 9, touche | Duel, jet d'attaque |
| D1 | Dégâts d'un couteau (dé de malus) | ch. 3, p. 63 (l. 498) | 4 dégâts, le voleur meurt | Duel, jet de dégâts |
| D2 | Dégâts d'une hallebarde (dé de bonus) et protection de l'armure | ch. 3, p. 63 (l. 504) | 6 de dégâts, 2 de protection, 4 perdus | Duel, jet de dégâts, dé de protection |
| S1 | Soins : récupération de Krongar | ch. 3, p. 66 (l. 671) | Vitalité 7 → 11, puis 13 en un jour | Fiche du héros, vitalité |
| S2 | Soins : jet de médecin de Sharangara | ch. 3, p. 66 (l. 671) | 10, réussite (récupération doublée) | Jet d'action |
| S3 | Secourir un mourant : Argol stabilise Sharangara | ch. 3, p. 66 (l. 669) | 9 après malus, stabilisée | Jet d'action, difficulté |
| AL1 | Alchimie : répulsif à insectes en auberge | ch. 6, p. 141 (`05-magie` l. 260) | Il faut 8 ou plus aux dés | Jet d'action |
| FO1 | Foi : le druide perturbe un jet de tir (dé de malus) | ch. 6, p. 146 (l. 561) | 4 + agilité + tir : insuffisant, rate | Duel, jet d'attaque |
| SO1 | Sorcellerie : coût d'un sort du premier cercle | ch. 6, p. 151 (l. 791) | 4 points de pouvoir, d6 de dégâts | (hors app, règle de référence) |
| SO2 | Sorcellerie : sort difficile avec malus d'esprit | ch. 6, p. 152 (l. 857) | Coût 7 PP, jet Difficile (−2) − esprit de la cible | (hors app, règle de référence) |
| SO3 | Sorcellerie : sort du troisième cercle | ch. 6, p. 153 (l. 945) | Coût réduit par condition, −1 PP définitif | (hors app, règle de référence) |
| G1 | Guerre : valeur d'armée de Satarla et de Tyrus | ch. 4, p. 69 (`03-guerre` l. 173) | Satarla 8, Tyrus 7, +1 au défenseur | (hors app) |
| G2 | Bataille navale : la Gloire de Parsool | ch. 4, p. 80 (l. 820) | Réaction 11, tir de catapulte 17 (héroïque, puis légendaire) | (hors app) |
| P1 | Piétaille : bandits contre suivants | ch. 5, p. 132 (`04-bestiaire` l. 1396) | Les suivants perdent 2, les bandits 1 | Duel, groupes de piétaille |

Les exemples marqués « hors app » ne correspondent à aucun écran à ce jour. Ils sont conservés pour la suite.

---

## Jets d'action

### A1. Défoncer une porte

Source : ch. 3 « Exemple de jet d'action n° 1 », p. 57.

- **Personnage** : Krongar le Puissant, vigueur 3.
- **Situation** : briser une porte solide. Le MJ décide qu'aucune de ses carrières ne l'aide. Difficulté **Ardue** (−1).
- **Jet** : 2d6 = **10**.
- **Calcul** : 10 + 3 (vigueur) = 13, 13 − 1 (difficulté) = **12**.
- **Résultat** : 12 ≥ 9, **réussite**. « La porte s'ouvre à toute volée. »
- **À vérifier** : attribut Vigueur, carrière « Aucune », difficulté Ardue (−1), total saisi 10 → 12, réussite.

### A2. Sauter par-dessus une fosse

Source : ch. 3 « Exemple de jet d'action n° 2 », p. 57.

- **Personnage** : Krongar, agilité 1, rang 2 dans la carrière de barbare.
- **Situation** : sauter par-dessus la fosse. Le MJ, « d'humeur conciliante », autorise l'ajout du rang de barbare. Difficulté **Moyenne** (0).
- **Jet** : 2d6 = **6**.
- **Calcul** : 6 + 1 (agilité) + 2 (rang de barbare) + 0 = **9**.
- **Résultat** : 9 ≥ 9, **réussite** (de justesse).
- **À vérifier** : attribut Agilité, carrière Barbare (+2), difficulté 0, total saisi 6 → 9, réussite.

---

## Jets de réaction

### R1. Krongar et Rork contre des bandits

Source : ch. 3 « Exemples de jets de réaction », p. 61.

- **Héros** : Krongar (esprit 0, initiative 1), Rork Kozaar (esprit 1, initiative 1).
- **Adversaires** : des bandits (piétaille) menés par un chef coriace (initiative 1). Le malus d'initiative de l'ennemi est donc **−1**.
- **Krongar** : 11 + 0 (esprit) + 1 (initiative) − 1 (initiative ennemie) = **11**, réussite.
- **Rork** : 7 + 1 (esprit) + 1 (initiative) − 1 (initiative ennemie) = **8**, échec.
- **Ordre d'action** : Krongar, puis le chef des bandits (coriace), puis Rork, puis les bandits (piétaille).
- **À vérifier** : dans le dialogue, le malus d'initiative adverse (−1) est appliqué automatiquement, et la frise donne exactement cet ordre.

### R2. Succès héroïque transformé en succès légendaire

Source : ch. 3 « Exemple de succès légendaire », p. 61.

- **Héros** : Krongar (esprit 0, initiative 1) et Rork.
- **Adversaires** : un scorpion-araignée géant (rival), 3 scorpions-araignées (coriaces), 6 jeunes (piétaille). Les héros ne sont pas surpris.
- **Rork** : total de **9** après modificateurs.
- **Krongar** : double 6 = 12, + 0 (esprit) + 1 (initiative) = **13**. Réussite, et **succès héroïque** (double 6). Le livre n'applique pas ici de malus d'initiative ennemie.
- **Suite** : Krongar et Rork agissent un round avant les petits scorpions-araignées. Le joueur de Krongar dépense **1 point d'héroïsme** pour transformer le succès héroïque en **succès légendaire** : bonus de **+1 aux jets d'attaque pour toute la rencontre**.
- **À vérifier** : un 12 naturel propose le succès légendaire (−1 PH), et le bonus +1 d'attaque est pris en compte dans les jets d'attaque du combat.
- **Note** : le malus d'initiative adverse d'un rival (ici le scorpion-araignée géant) n'apparaît pas dans le calcul de Krongar (13 = 12 + 0 + 1). À rapprocher de la règle appliquée par l'application (le plus haut des rivaux et coriaces).

---

## Jets d'attaque

### T1. Facteur de portée d'une dague de jet

Source : ch. 3, p. 62.

- **Arme** : dague de jet, facteur de portée **3 m**.
- **Bout portant** : jusqu'à 3 m, **+1** au jet d'attaque.
- **Courte** : jusqu'à 6 m, **0**, et ainsi de suite (tableau : Moyenne −1, Longue −2, Très longue −4, Extrême −6, Maximale −8).

### T2. Lance jetée sur un singe des neiges

Source : ch. 3, p. 62.

- **Personnage** : Krongar (agilité 1, tir 0).
- **Cible** : singe des neiges, défense 1, à **15 m**.
- **Arme** : lance, facteur de portée **6 m**. 15 m relève du troisième facteur : portée **Moyenne**, soit **−1**.
- **Jet** : 2d6 = **10**.
- **Calcul** : 10 + 1 (agilité) + 0 (tir) − 1 (portée Moyenne) − 1 (défense de la cible) = **9**.
- **Résultat** : 9 ≥ 9, **touche tout juste**.

### T3. Attaque de mêlée simple

Source : ch. 3 « Exemples de jet d'attaque », p. 62.

- **Personnage** : Krongar (agilité 1, mêlée 2), une épée, contre des mercenaires (piétaille).
- **Jet** : 2d6 = **11**.
- **Calcul** : 11 + 1 (agilité) + 2 (mêlée) = **14**. Le livre ne retranche aucune défense (piétaille, défense 0).
- **Résultat** : 14 ≥ 9, **touche**.

### T4. Attaque avec dé de bonus (arme favorite)

Source : ch. 3 « Exemples de jet d'attaque », p. 62.

- **Personnage** : Krongar (agilité 1, mêlée 2), son épée valgardienne (**arme favorite** : dé de bonus).
- **Cible** : le capitaine des mercenaires, rival, **défense 1**.
- **Jet** : 3 dés (2d6 + 1 dé de bonus) = **1, 2, 5**. On garde les deux meilleurs : 5 + 2 = **7**.
- **Calcul** : 7 + 1 (agilité) + 2 (mêlée) − 1 (défense) = **9**.
- **Résultat** : 9 ≥ 9, **touche** le capitaine.
- **À vérifier** : le dé de bonus (arme favorite) lance 3 dés et garde les 2 meilleurs, ce qui donne 7 et non 8.

---

## Jets de dégâts

### D1. Coup de couteau (dé de malus)

Source : ch. 3 « Exemples de jet de dégâts », p. 63.

- **Personnage** : Krongar, vigueur 3, un couteau (**arme légère**, d6M).
- **Cible** : un voleur (piétaille).
- **Jet** : 2 dés = **1 et 5**. On garde le moins bon : **1**.
- **Calcul** : 1 + 3 (vigueur) = **4** points de dégâts. Pas de protection.
- **Résultat** : le voleur est tué.
- **À vérifier** : un d6M lance 2 dés et garde le plus petit ; le détail affiché est « 1 et 5 → 1 retenu (le moins bon) ».

### D2. Hallebarde (dé de bonus) et protection de l'armure

Source : ch. 3 « Exemples de jet de dégâts », p. 63.

- **Attaquant** : un soldat (coriace, vigueur 1), une hallebarde (**arme lourde**, d6B).
- **Cible** : Krongar, armure moyenne (**d6−2**).
- **Dégâts** : 2 dés = **2 et 5**. On garde le meilleur : **5**. 5 + 1 (vigueur du soldat) = **6**.
- **Protection** : Krongar lance le dé de protection de son armure : le dé donne 4, 4 − 2 = **2** points de réduction.
- **Calcul** : 6 − 2 = **4** points de vitalité perdus.
- **À vérifier** : le petit dé de protection du jet de dégâts remplace la valeur fixe ; d6−2 avec un dé à 4 donne 2. La valeur fixe d'une armure moyenne est 2 (entre parenthèses dans la fiche).

---

## Soins et récupération

### S1. Récupération de Krongar

Source : ch. 3, p. 66.

- **Personnage** : Krongar, vitalité 13, subit 6 points de dégâts, donc **7**.
- **Repos après la bataille** : regagne la moitié des dégâts subis, soit **3** (vitalité 10).
- **Soins de Sharangara** (médecin rang 1, qui panse ses blessures) : **+1** immédiat (vitalité 11).
- **Le lendemain** : récupère 1 point par jour (12), puis le jet de S2 double cette récupération.
- **Résultat** : à la fin, vitalité **13**, « totalement remis ».

### S2. Jet de médecin de Sharangara

Source : ch. 3, p. 66.

- **Personnage** : Sharangara d'Oomis, médecin rang 1, esprit 1.
- **Jet** : 2d6 = **8**.
- **Calcul** : 8 + 1 (rang de médecin) + 1 (esprit) = **10**.
- **Difficulté** : Moyenne (+0).
- **Résultat** : 10 ≥ 9, **réussite**. Krongar récupère 2 points ce jour-là (la récupération est doublée).

### S3. Secourir un mourant

Source : ch. 3, p. 66.

- **Situation** : Sharangara (vitalité 10) subit 12 points de dégâts, tombe à −2 (blessée à mort). Au round suivant elle tombe à **−3** (1 point perdu par round dans les négatifs).
- **Personnage** : Argol, alchimiste : jet d'action avec son esprit (+1) et son rang d'alchimiste (+1) : **+2**.
- **Difficulté** : Moyenne en base, mais Sharangara est à −3 : la difficulté augmente de trois niveaux, de Moyenne à **Très difficile** (−4). Net : +2 − 4 = **−2**.
- **Jet** : 2d6 = **11**.
- **Calcul** : 11 − 2 = **9**.
- **Résultat** : 9 ≥ 9, **réussite** : Sharangara est stabilisée.
- **À vérifier** : le niveau de difficulté monte d'un cran par point de vitalité négatif (voir aussi « Défier la mort » : seuils 0 et −5).

---

## Alchimie

### AL1. Répulsif à insectes dans une auberge

Source : ch. 6 « Les Alchimistes », p. 141 (`05-magie` l. 260).

- **Personnage** : Argol Arran, alchimiste 1 (donc 1 point de création), esprit 1.
- **Situation** : préparer un répulsif (préparation courante) avec le matériel d'une auberge. La difficulté monte de Moyenne à **Ardue** (−1).
- **Calcul du modificateur** : +1 (esprit) + 1 (alchimiste) − 1 = **+1**.
- **Seuil** : il faut un total de 9, donc **au moins 8 aux dés**.

---

## Foi

### FO1. Le druide perturbe un jet de tir

Source : ch. 6 « Prêtres et Druides », p. 146 (`05-magie` l. 561).

- **Contexte** : Argandros Drall, druide de Zaggath, dépense **1 point de foi** pour imposer un **dé de malus** à Krongar, qui lance sa lance.
- **Personnage** : Krongar, agilité et tir.
- **Jet** : 3 dés (2d6 + 1 dé de malus) = **1, 6 et 3**. On écarte le plus haut (6), il reste 1 + 3 = **4**.
- **Calcul** : 4 + agilité + tir : « cela ne suffit pas pour toucher » : l'attaque rate.
- **À vérifier** : un dé de malus lance 3 dés et garde les 2 moins bons.

---

## Sorcellerie

Ces exemples décrivent des coûts et des difficultés, pas d'attaque chiffrée. L'application ne les gère pas.

### SO1. Javelot de flammes de Methyn Sarr

Source : ch. 6 « Les Sorciers », p. 151 (`05-magie` l. 791).

- **Sort** : du premier cercle (coût de base 5 points de pouvoir). Conditions remplies : ligne de vue et pratiques ostentatoires, soit une deuxième condition.
- **Coût** : **4 points de pouvoir** (une condition au-delà de la première réduit le coût d'un point).
- **Effet** : d6 points de dégâts **automatiques**.

### SO2. Capturer Krongar

Source : ch. 6 « Les Sorciers », p. 152 (`05-magie` l. 857).

- **Sort** : coût normal 10 points de pouvoir. Conditions : la première, plus **trois supplémentaires** (grimoire, jeûne de 7 jours, sacrifice animal) : coût **7 points de pouvoir**.
- **Jeûne** : 2d6 jours de jeûne, obtenu **7**.
- **Jet de lancement** : difficulté **Difficile** (−2), plus l'esprit de la cible en malus (Krongar : 0).

### SO3. Le volcan de Vulkfind

Source : ch. 6 « Les Sorciers », p. 153 (`05-magie` l. 945).

- **Sort** : du troisième cercle (coût de base 15 points de pouvoir). Première condition « conjonction astrale », plus un « sacrifice rituel » : une condition supplémentaire réduit le coût d'un point.
- **Note** : chaque sort du troisième cercle fait perdre définitivement 1 point de pouvoir.

---

## Guerre

### G1. Valeur d'armée (siège de Satarla)

Source : ch. 4 « La Guerre sur Terre », p. 69 (`03-guerre` l. 173).

- **Tyrus** : entraînement +1, supériorité numérique +4, chef compétent +2 : **7**.
- **Satarla** : terrain +4, nefs volantes +2, chef compétent +2 : **8**.
- **Résultat** : le défenseur a un bonus de **+1** sur ses jets de bataille.

### G2. Bataille navale : la Gloire de Parsool

Source : ch. 4 « La Guerre en Mer », p. 80 (`03-guerre` l. 820).

- **Équipage** : le capitaine (marin 3), un soldat (rang 2) aux armes de tir. 60 soldats (+3 aux actions d'abordage).
- **Réaction** : 8 + 1 (esprit) + 2 (initiative) = **11**, réussite. Une galère pirate a un rival à bord : on soustrait son esprit (3), ce qui donne un échec face à ce navire. La galère du rival fuit : 7 + 2 + 2 = **11**, réussit.
- **Poursuite** : 6 + 3 (rang de marin) + 3 (ressources) = **12**. Les pirates font 6 et 7 : échec. La Gloire se rapproche d'un facteur de portée.
- **Tir de catapulte** : double 6 (12) + 2 (rang de soldat) + 3 (ressources) = 17, − 6 (portée Extrême) : **succès héroïque**, transformé en légendaire (−1 PH).
- **Dégâts** : d6 = 3 (coque 30 → 27), puis d6+6 = 10 (équipage 35 → 25).
- **Tir pirate** : 11, mais −3 de défense et −6 de portée Extrême : le projectile rate.

---

## Bestiaire

### P1. Piétaille contre suivants

Source : ch. 5 « Personnages non joueurs », p. 132 (`04-bestiaire` l. 1396).

- **Situation** : 10 bandits (piétaille) contre les 7 suivants (piétaille) d'un héros, qui affronte leur chef.
- **Règle** : le camp le plus nombreux tue **d6M** adversaires, l'autre en tue **d3**.
- **Jets** : le MJ lance d6M et obtient 3 et 2, il garde **2** : les suivants perdent 2. Le joueur lance d3 et obtient **1** : un bandit tué.
- **Résultat** : les suivants tiennent bon ; il leur faut que le héros abatte vite le chef.

---

## Résumé des vérifications utiles

| Règle | Exemples |
| --- | --- |
| Seuil de réussite 9 | A1, A2, T2, T4, S3 |
| Malus d'initiative ennemie dans le jet de réaction | R1 |
| Succès héroïque (double 6) puis légendaire (−1 PH, +1 aux attaques) | R2, G2 |
| Dé de bonus (3 dés, on garde les 2 meilleurs) | T4 |
| Dé de malus (3 dés, on garde les 2 moins bons) | FO1 |
| Dégâts d6M (2 dés, garde le moins bon) | D1 |
| Dégâts d6B (2 dés, garde le meilleur) | D2 |
| Vigueur ajoutée aux dégâts de mêlée, moitié à distance | D1, D2 |
| Protection de l'armure en dé (d6−n) | D2 |
| Facteurs de portée et modificateurs | T1, T2 |
| Soins et récupération de vitalité | S1, S2, S3 |
| Difficulté qui monte avec la vitalité négative | S3 |
