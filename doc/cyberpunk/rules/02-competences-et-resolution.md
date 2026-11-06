# Résolution des actions et compétences

Pages source : p. 125-142 (« Passer aux choses sérieuses », jusqu'à la liste des compétences). Texte : `doc/cyberpunk/pdf-text/08-resolution-des-actions-p125-166.txt`.

## Scène, distances, temps

- Un personnage interagit avec ce qu'il voit (ligne de vue). Il touche ce qui est à **2 m** (portée de main).
- Tout se mesure en mètres. Sur un plan quadrillé, **1 case = 2 m**.
- Trois échelles de mouvement :
  - **narratif** (km/h) : marche 4 km/h, course 11 km/h ; véhicules dans `04-combat.md` ;
  - **comparatif** : on compare deux MOUV pour une course sur la durée ;
  - **littéral** : en combat, `MOUV × 2` mètres (ou `MOUV` cases) par action de mouvement.
- **Temps de jeu** (temps réel) et **temps de combat** : tours de 3 secondes, Initiative `RÉF + 1d10` (détail dans `04-combat.md`).

### Précisions sur les actions (p. 127-128)

- **Courir** : impossible si l'état du personnage interdit l'action de mouvement.
- **Démarrer / monter dans un véhicule** : il faut la clé physique ou biométrique (ou un véhicule non verrouillé pour y monter).
- **Retarder son action** : jusqu'à un rang d'Initiative ou un événement précis ; on peut alors agir ou renoncer. Pas sur plusieurs rounds d'affilée, pas de changement de créneau, jamais pour une action de mouvement ou une action virtuelle.
- **Actions virtuelles** : réservées au Netrunner, à la place de son action (`07-netrunning.md`).
- **Utiliser une compétence / un objet** : tâche de 3 secondes au plus ; une tâche plus longue se poursuit sur plusieurs tours (3 s par tour), le jet a lieu à la fin.

## Jet de compétence

**Base de compétence = CARAC + niveau de compétence.** Un jet : `base + 1d10`.

Pas de jet pour ce qui est trivial. Deux façons de résoudre :

- **En opposition** (contre un être vivant) : `CARAC + compétence + 1d10` de l'attaquant contre le même calcul du défenseur. **L'égalité profite au défenseur.**
- **Contre un SD** fixé par le MJ : il faut **dépasser** le SD.

| Difficulté | Description | SD |
| --- | --- | --- |
| Simple | La plupart des gens y arrivent sans réfléchir (difficile pour un enfant). | 9 |
| Facile | Faisable sans entraînement spécifique. | 13 |
| Moyen | Difficile sans formation ni talent. | 15 |
| Professionnel | Demande de la pratique : niveau d'un professionnel doué. | 17 |
| Assez difficile | Talent rare : sportifs de haut niveau, superstars. | 21 |
| Difficile | Un exploit d'une vie : la crème de la profession. | 24 |
| Presque impossible | Une fois par génération. | 29 |

Exemple du livre : deux jets opposés de DEX + Athlétisme font 14 tous les deux, le défenseur gagne ; réparer un panneau (Facile, SD 13) avec TECH + Électronique : 14, réussi.

### Critiques

- **Réussite critique** : le d10 fait **10** → relancer 1d10 et **ajouter** le résultat. Un second 10 ne relance pas.
- **Échec critique** : le d10 fait **1** → relancer 1d10 et **soustraire** le résultat. Un second 1 ne relance pas.
- Un personnage très doué peut réussir malgré un échec critique, et un SD élevé peut résister à une réussite critique.

### Modificateurs

Le MJ peut appliquer des malus (cumulatifs). Les bonus viennent surtout du matériel, des cyberimplants, des capacités de rôle et des drogues.

| Situation | Modificateur |
| --- | --- |
| De nuit ou peu de lumière | −1 |
| Première fois qu'on fait cette action | −1 |
| Tâche complexe | −2 |
| Sans les outils ou pièces appropriés | −2 |
| Mal dormi la nuit dernière | −2 |
| Extrêmement stressé | −2 |
| Épuisé | −4 |
| Très saoul ou drogué | −4 |
| Agir discrètement | −4 |
| Vision brouillée (fumée, obscurité) | −4 |

### Autres règles du jet

- **Nouvel essai** : pas de nouvelle tentative après un échec, sauf si les chances se sont améliorées (plus de temps, meilleur outil, jet complémentaire).
- **Compétence complémentaire** : avec l'accord du MJ, un bon résultat sur une compétence qui influence logiquement une autre donne **+1** à la prochaine utilisation de celle-ci (une seule fois ; ces bonus ne se cumulent pas). Un autre joueur peut fournir ce bonus.
- **Temps supplémentaire** : quadrupler le temps prévu donne **+1** (une fois).
- **Sans la compétence** : `CARAC + 1d10` seulement.
- **Chance** : avant de lancer, dépenser des points de la réserve de Chance, **+1 par point**. La réserve vaut la CARAC CHA et se remplit au début de chaque session. (Interdit sur le jet de Crédit du Média.)

## Liste des compétences

`× 2` : la compétence coûte deux fois plus cher à acheter et à améliorer (2 points par niveau). **Compétences de base** (niveau 2 minimum à la création, voir `01-creation-personnage.md`) : Athlétisme, Bagarre, Concentration, Connaissance, Conversation, Discrétion, Esquive, Guide local (quartier d'origine), Langue (argot), Perception, Persuasion, Premiers secours, Psychologie.

Repères donnés pour chaque compétence : base 10 = formé, base 14 = professionnel, base 18 = parmi les meilleurs de Night City.

| Catégorie | Compétence | CARAC | Notes |
| --- | --- | --- | --- |
| Vigilance | Concentration | VOL | |
| Vigilance | Dissimulation/Révélation d'objet | INT | cacher ou trouver un objet dissimulé |
| Vigilance | Lecture sur les lèvres | INT | |
| Vigilance | Perception | INT | indices, pièges, personnes en Discrétion ; pas les objets dissimulés |
| Vigilance | Pistage | INT | |
| Corps | Athlétisme | DEX | sauter, escalader, lancer, nager, soulever |
| Corps | Contorsion | DEX | |
| Corps | Danse | DEX | |
| Corps | Discrétion | DEX | |
| Corps | Endurance | VOL | rester actif sans nourriture, sommeil, eau ; efforts prolongés |
| Corps | Résistance à la torture/aux drogues | VOL | poisons, drogues, interrogatoires |
| Contrôle | Conduite de véhicule terrestre | RÉF | |
| Contrôle | Équitation | RÉF | |
| Contrôle | Pilotage de véhicule aérien (× 2) | RÉF | |
| Contrôle | Pilotage de véhicule maritime | RÉF | |
| Éducation | Bibliothèque | INT | bases de données, puits de données, archives |
| Éducation | Bureaucratie | INT | |
| Éducation | Composition | INT | |
| Éducation | Comptabilité | INT | |
| Éducation | Connaissance | INT | éducation générale (lire, écrire, compter, histoire) |
| Éducation | Criminologie | INT | |
| Éducation | Cryptographie | INT | |
| Éducation | Déduction | INT | |
| Éducation | Dressage | INT | |
| Éducation | Gestion d'affaires | INT | |
| Éducation | Guide local | INT | un lieu à chaque augmentation (au plus un quartier ou une communauté) |
| Éducation | Jeux de hasard | INT | |
| Éducation | Langue | INT | une langue à chaque augmentation |
| Éducation | Science | INT | un domaine à chaque augmentation (géologie, mathématiques, physique, zoologie, anthropologie, biologie, chimie, histoire…) |
| Éducation | Survie en milieu hostile | INT | |
| Éducation | Tactique | INT | |
| Combat | Arme de mêlée | DEX | |
| Combat | Art martial (× 2) | DEX | une forme à chaque augmentation (aïkido, judo, karaté, taekwondo), développées séparément |
| Combat | Bagarre | DEX | frapper, agripper |
| Combat | Esquive | DEX | mêlée ; aussi tirs et explosions avec RÉF 8+ |
| Tir | Armes d'épaule | RÉF | fusils, fusils à pompe |
| Tir | Armes lourdes (× 2) | RÉF | lance-grenades, lance-roquettes |
| Tir | Pistolet | RÉF | pistolets et pistolets-mitrailleurs |
| Tir | Tir à l'arc | RÉF | |
| Tir | Tir automatique (× 2) | RÉF | tir automatique, tir de suppression |
| Représentation | Instrument | TECH | un instrument |
| Représentation | Jeu d'acteur | PRES | |
| Sociabilité | Connaissance de la rue | PRES | |
| Sociabilité | Conversation | EMP | |
| Sociabilité | Corruption | PRES | |
| Sociabilité | Habillement et style | PRES | |
| Sociabilité | Interrogatoire | PRES | |
| Sociabilité | Look | PRES | |
| Sociabilité | Négoce | PRES | |
| Sociabilité | Persuasion | PRES | |
| Sociabilité | Psychologie | EMP | |
| Technique | Aérotech | TECH | réparer les véhicules aériens |
| Technique | Armurerie | TECH | réparer les armes |
| Technique | Arts plastiques | TECH | |
| Technique | Assistance médicale (× 2) | TECH | `05-blessures-et-soins.md` |
| Technique | Contrefaçon | TECH | s'oppose généralement à Contrefaçon |
| Technique | Crochetage | TECH | |
| Technique | Cybertech | TECH | réparer la cybernétique |
| Technique | Électronique | TECH | appareils simples et tout ce qu'aucune autre compétence de Technique ne couvre |
| Technique | Explosifs (× 2) | TECH | |
| Technique | Maritech | TECH | réparer les véhicules maritimes |
| Technique | Photos et films | TECH | |
| Technique | Pickpocket | TECH | |
| Technique | Premiers secours | TECH | `05-blessures-et-soins.md` |
| Technique | Sécurité électronique (× 2) | TECH | |
| Technique | Terratech | TECH | réparer les véhicules terrestres |

Compétences réservées à une capacité de rôle (pas achetables) : **Chirurgie** et **Techniques médicales** (Medtech, `03-capacites-de-role.md`).

### Réparations

Le SD et le temps d'une remise en état complète avec une compétence de Technique dépendent :

**de la catégorie de prix de l'objet** (Armurerie, Cybertech, Électronique…)

| Catégorie de prix | SD | Temps |
| --- | --- | --- |
| Bon marché / Ordinaire | 9 | 1 heure |
| Coûteux | 13 | 6 heures |
| Très coûteux | 17 | 1 jour |
| Onéreux | 21 | 1 semaine |
| Très onéreux | 24 | 2 semaines |
| Luxueux | 29 | 1 mois |
| Super luxueux | 29 | 1 mois par tranche de 10 000 ED du prix |

**des dégâts subis, pour un véhicule** (Aérotech, Maritech, Terratech)

| État | SD | Temps |
| --- | --- | --- |
| Dégâts mineurs | 9 | 3 heures |
| Dégâts importants | 13 | 1 jour |
| Détruit | 17 | 1 semaine |

Un échec se découvre à mi-chemin : il faut tout recommencer.
