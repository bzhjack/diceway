# Netrunning

Pages source : p. 195-218. Texte : `doc/cyberpunk/pdf-text/10-netrunning-p195-218.txt`.

## Matériel nécessaire

- **Capacité Interface** (Netrunner) : sans elle, pas de netrunning (`03-capacites-de-role.md`).
- **Câblage neural + ports d'interface neuronale** pour brancher une cyberconsole (`06-cybermateriel-et-humanite.md`).
- **Cyberconsole** : programmes et matériel informatique occupent ses emplacements. Une seule cyberconsole branchée à la fois ; en changer prend une action réelle.

| Cyberconsole | Prix | Emplacements |
| --- | --- | --- |
| Mauvaise qualité | 100 (Très coûteux) | 5 |
| Standard | 500 (Onéreux) | 7 |
| Excellente qualité | 1 000 (Très onéreux) | 9 |

- **Lunettes de réalité virtuelle** : le NET se superpose à la vue réelle (le « frigo à viande »). Sans elles, on se connecte « à l'ancienne » et on reste **inconscient** dans le réel jusqu'à la déconnexion.
- Les appareils sans architecture NET (analogiques, ou fonctionnant sur CitiNet et des puces : Agents, caméras vidéo…) ne se piratent pas avec Interface mais avec **Sécurité électronique** ; les cyberimplants relèvent de **Cybertech**.

## Actions réelles et virtuelles

- À son tour, le Netrunner fait **soit une action réelle, soit ses actions virtuelles** (nombre selon le rang d'Interface), plus toujours son action de mouvement.

| Rang d'Interface | 1-3 | 4-6 | 7-9 | 10 |
| --- | --- | --- | --- | --- |
| Actions virtuelles | 2 | 3 | 4 | 5 |

**Actions virtuelles**

- **Se connecter / se déconnecter** : à **6 m** ou moins d'un point d'accès (sans mur entre les deux en général). Se déconnecter proprement réinitialise les défenses (il faudra tout recommencer) et retire tous vos programmes ; seul un Virus laisse un effet durable.
- Sortir de portée en étant connecté, ou être éjecté de force : déconnexion **dangereuse**, on subit l'effet de **tous les GLACE ennemis rencontrés et non dérezzés**.
- **Utiliser une capacité d'Interface** (toutes sauf Recherche).
- **Activer / désactiver un programme**.
- **Divers** : ce que le MJ autorise d'autre, en général une action virtuelle.

**Gratuit** : se déplacer dans l'architecture (autant d'étages qu'on veut, dans l'ordre, sans franchir un obstacle comme un mot de passe) et copier un fichier dans sa cyberconsole.

## Capacités d'Interface

Résolution : `Interface + 1d10` contre un SD (sauf Élimination, en opposition).

| Capacité | Coût | Effet |
| --- | --- | --- |
| Recherche | **action réelle** | Localise les points d'accès aux architectures de la zone ; le MJ dose selon le résultat. |
| Analyse | 1 action virtuelle | Révèle le contenu et la valeur d'un fichier (certains ont un SD pour être ouverts). |
| Cartographie | 1 action virtuelle | Révèle le plan sur un nombre d'étages égal au résultat, ou jusqu'au premier obstacle dont le SD dépasse le résultat. Les SD restent secrets. |
| Contrôle | 1 action virtuelle | Prendre un nœud de contrôle (dépasser son SD), puis une action virtuelle par appareil manipulé, depuis n'importe où dans l'architecture. Un nœud ne s'active qu'une fois par tour. Le contester à un autre Netrunner ou à un Démon : SD = son jet de Contrôle. Perdu à la déconnexion. |
| Élimination | 1 action virtuelle | Attaque : `Interface + 1d10` contre `DÉF + 1d10` d'un programme ou `Interface + 1d10` d'un Netrunner ; si elle réussit, `1d6` au REZ du programme ou **directement au cerveau** du Netrunner. |
| Glissement | 1 action virtuelle | Fuir un GLACE (pas un Démon) : contre `PER + 1d10` du GLACE, on passe à un étage adjacent (sans franchir d'obstacle). Le GLACE se poste en attente là où il a été semé. Une fois par tour, pas par anticipation. |
| Masquage | 1 action virtuelle | Efface les traces de passage et des Virus. Pour les retrouver, il faut une Cartographie contre SD = résultat du Masquage. Sans Masquage, n'importe quel Netrunner voit ce que vous avez fait. |
| Porte dérobée | 1 action virtuelle | Franchir un mot de passe (connu : franchi automatiquement). |
| Virus | variable | Seulement à l'**étage le plus bas** : un virus qui fait deux actions ou changements raisonnables, qui persiste après déconnexion. Le MJ fixe le SD et le nombre d'actions virtuelles. SD pour le détruire = résultat du jet. |

Exemples de Virus (p. 200) : changer une icône (SD 6, 1 action) ; désactiver un GLACE ou faire tomber un nœud de contrôle en panne (SD 10, 2 actions) ; supprimer tous les GLACE ou diviser par deux les étages pour toujours (SD 12, 10 actions).

## Combat dans le NET

`Interface + ATT du programme + 1d10` (ou `ATT du GLACE + 1d10`) contre `Interface de la cible + 1d10` (ou `DÉF du programme/GLACE + 1d10`). Si l'attaquant touche, la cible subit l'effet du programme. Un programme **antipersonnel** ne vise que les Netrunners, un **antiprogramme** que les programmes.

- Un programme à **0 REZ** est **dérezzé** : toujours chargé mais inutile ; deux actions virtuelles (désactiver puis réactiver) le restaurent.
- Un programme **détruit** est effacé, il faut en racheter un.
- Les dégâts « au cerveau » sont retirés des PS du Netrunner.

## Programmes

- Activer ou désactiver : une action virtuelle. Chaque programme chargé ne s'active **qu'une fois par round** ; activé (rezzé), il ne se réactive pas avant d'être désactivé. Les programmes offensifs se désactivent seuls après usage.
- On peut charger plusieurs copies d'un même programme ; leurs effets se cumulent sauf mention contraire.
- Installer ou désinstaller un programme ou un matériel : **1 heure**.

| Programme | Classe | ATT | DÉF | REZ | Effet | Prix |
| --- | --- | --- | --- | --- | --- | --- |
| Effaceur | soutien | 0 | 0 | 7 | +2 aux jets de Masquage | 20 (Ordinaire) |
| Loupe | soutien | 0 | 0 | 7 | +2 aux jets de Cartographie | 20 (Ordinaire) |
| Speedy Gonzalvez | soutien | 0 | 0 | 7 | +2 en Vitesse | 100 (Très coûteux) |
| Ver | soutien | 0 | 0 | 7 | +2 aux jets de Porte dérobée | 50 (Coûteux) |
| Armure | défensif | 0 | 0 | 7 | −4 à tous les dégâts au cerveau ; une copie active à la fois, une utilisation par Netrun | 50 (Coûteux) |
| Bouclier | défensif | 0 | 0 | 7 | Arrête le premier effet réussi d'un programme non-GLACE qui ferait des dégâts au cerveau, puis se dérezze ; une copie, une fois par Netrun | 20 (Ordinaire) |
| Tir de barrage | défensif | 0 | 0 | 7 | ATT 0 pour tous les programmes offensifs non-GLACE lancés contre vous ; une copie, une fois par Netrun | 50 (Coûteux) |
| Bannissement | offensif antiprogramme | 1 | 0 | 0 | 2d6 aux GLACE, 3d6 aux autres programmes | 50 (Coûteux) |
| Sabre | offensif antiprogramme | 1 | 0 | 0 | 3d6 aux GLACE, 2d6 aux autres programmes | 50 (Coûteux) |
| ConsoleKRASH | offensif antipersonnel | 0 | 0 | 0 | Déconnexion forcée et dangereuse de la cible | 100 (Très coûteux) |
| Feubeu | offensif antipersonnel | 2 | 0 | 0 | 2d6 au cerveau ; sans câblage isolé, console et vêtements prennent feu (2 PS à chaque fin de tour jusqu'à une action réelle pour éteindre ; non cumulable) | 100 (Très coûteux) |
| Hélice d'éclairs | offensif antipersonnel | 1 | 0 | 0 | 1d6 au cerveau, −1 action virtuelle au prochain tour (min. 2) | 50 (Coûteux) |
| Laser corrosif | offensif antipersonnel | 0 | 0 | 0 | Détruit un programme non-GLACE au hasard sur la console ciblée | 100 (Très coûteux) |
| Superglue | offensif antipersonnel | 2 | 0 | 0 | Ni progresser ni se déconnecter proprement pendant 1d6 rounds ; une fois par Netrun | 100 (Très coûteux) |
| Taser | offensif antipersonnel | 0 | 0 | 0 | INT, RÉF et DEX −1d6 chacune (min. 1) pendant 1 heure | 100 (Très coûteux) |

## GLACE

- Programmes mortels qui traquent Netrunners ou programmes. Un GLACE (sauf Démon) peut s'installer sur sa propre cyberconsole : il prend **2 emplacements**.
- **Rencontre** d'un GLACE posté : `Interface + bonus de VIT actifs + 1d10` contre `VIT + 1d10` du GLACE. S'il gagne, il applique immédiatement son effet (à vous, ou à un de vos programmes actifs au hasard s'il est antiprogramme). Il se place **en tête de la file d'Initiative** (1 de plus que le meilleur score).
- À ses tours : `ATT + 1d10` contre `Interface + 1d10` (ou `DÉF + 1d10` du programme visé). Il poursuit sa cible dans toute l'architecture jusqu'à être dérezzé ou semé par Glissement (un antiprogramme suit même un Netrunner sans programme actif).
- **Son propre GLACE** : une action virtuelle pour le poster en attente à l'étage (hors combat) ou pour l'activer en combat contre une cible valide (il passe en tête de l'Initiative). Changer de cible : le désactiver puis le réactiver. Il suit son code sans initiative ; le MJ joue tous les GLACE.
- **PER** = SD pour Glisser ; **VIT** = réactivité à la rencontre.

| GLACE | Classe | PER | VIT | ATT | DÉF | REZ | Effet | Prix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cerbère | antipersonnel | 6 | 6 | 6 | 2 | 20 | 2d6 au cerveau ; feu comme Feubeu sans câblage isolé | 500 |
| Cobra | antipersonnel | 4 | 6 | 2 | 2 | 15 | Détruit un programme au hasard sur la console | 100 |
| Corbeau | antipersonnel | 6 | 4 | 4 | 2 | 15 | Dérezze un programme défensif au hasard, puis 1d6 au cerveau | 50 |
| Feu follet | antipersonnel | 4 | 4 | 4 | 2 | 15 | 1d6 au cerveau, −1 action virtuelle au prochain tour (min. 2) | 50 |
| Kraken | antipersonnel | 6 | 2 | 8 | 4 | 30 | 3d6 au cerveau ; ni progresser ni se déconnecter proprement jusqu'à la fin de son prochain tour | 1 000 |
| Liche | antipersonnel | 8 | 2 | 6 | 2 | 25 | INT, RÉF, DEX −1d6 chacune (min. 1) pendant 1 heure | 500 |
| Putois | antipersonnel | 2 | 4 | 4 | 2 | 10 | −2 aux jets de Glissement tant qu'il est rezzé (un Netrunner à la fois ; plusieurs Putois se cumulent) | 500 |
| Scorpion | antipersonnel | 2 | 6 | 2 | 2 | 15 | MOUV −1d6 (min. 1) pendant 1 heure | 100 |
| Titan | antipersonnel | 2 | 2 | 8 | 4 | 25 | 3d6 au cerveau et déconnexion forcée dangereuse | 1 000 |
| Dragon | antiprogramme | 6 | 4 | 6 | 6 | 30 | 6d6 à un programme ; s'il serait dérezzé, il est détruit | 1 000 |
| Tigre à dents de sabre | antiprogramme | 8 | 6 | 6 | 2 | 25 | 6d6 à un programme ; s'il serait dérezzé, il est détruit | 1 000 |
| Tueur | antiprogramme | 4 | 8 | 6 | 2 | 20 | 4d6 à un programme ; s'il serait dérezzé, il est détruit | 500 |

## Matériel informatique

Un emplacement chacun sauf mention ; installation 1 heure.

| Matériel | Effet | Emplacements | Prix |
| --- | --- | --- | --- |
| Barrière anti-KRASH | Immunise contre les effets qui forcent la déconnexion | 2 | 100 |
| Câblage isolé | La console ne prend pas feu et n'enflamme pas les vêtements | 1 | 100 |
| Circuits renforcés | Insensible aux IEM et aux effets de programmes non-GLACE qui la désactivent | 1 | 100 |
| Disque dur de sauvegarde | Sauve les programmes non-GLACE détruits ; une action réelle pour les réinstaller (dans leur état sauvegardé) | 2 | 100 |
| Extension de portée | Connexion à 8 m d'un point d'accès | 1 | 100 |
| Verrou biométrique | Console verrouillée ; Sécurité électronique SD 17 pour forcer | 2 | 100 |

Autres améliorations : **combinaison connectée** (PA 11 tête et corps, +1 emplacement réservé au matériel, 1 000) ; **cyberconsole dans un cyberbras** (+1 emplacement, 500).

## L'architecture NET

Un ascenseur : chaque étage est un niveau, et derrière chaque « porte » se trouve un fichier, un mot de passe, un nœud de contrôle, un GLACE, un autre Netrunner… On ouvre les portes dans l'ordre, sans sauter d'étage.

### Construire une architecture (MJ)

**Étape 0 — difficulté**

| | Basique | Standard | Inhabituelle | Avancée |
| --- | --- | --- | --- | --- |
| SD des mots de passe, fichiers, nœuds | 6 | 8 | 10 | 12 |
| Interface d'un Netrunner qui a ses chances | 2 | 4 | 6 | 8 |
| Interface d'un Netrunner qui pourrait mourir avant le fond | — | 2 ou moins | 4 ou moins | 6 ou moins |

**Étape 1 — plan** : `3d6` étages. Sur `1d10` ≥ 7, un embranchement (relancer jusqu'à ne plus en obtenir). Les embranchements partent sous le 2e étage de la branche principale ; une branche est plus longue que les autres, et son dernier étage est le « fond » (où l'on pose un Virus).

**Étape 2 — peupler**, du haut vers le bas, en relançant les doublons de programme ou de mot de passe :

| 1d6 | Lobby (2 premiers étages) |
| --- | --- |
| 1 | Fichier SD 6 |
| 2 | Mot de passe SD 6 |
| 3 | Mot de passe SD 8 |
| 4 | Putois |
| 5 | Feu follet |
| 6 | Tueur |

| 3d6 | Basique | Standard | Inhabituel | Avancé |
| --- | --- | --- | --- | --- |
| 3 | Cerbère | Cerbère × 2 | Kraken | Cerbère × 3 |
| 4 | Tigre à dents de sabre | Cerbère, Tueur | Cerbère, Scorpion | Cobra × 2 |
| 5 | Corbeau × 2 | Putois × 2 | Cerbère, Tueur | Cerbère, Liche |
| 6 | Cerbère | Tigre à dents de sabre | Corbeau × 2 | Feu follet × 3 |
| 7 | Feu follet | Scorpion | Tigre à dents de sabre | Cerbère, Tigre à dents de sabre |
| 8 | Corbeau | Cerbère | Cerbère | Kraken |
| 9 | Mot de passe SD 6 | Mot de passe SD 8 | Mot de passe SD 10 | Mot de passe SD 12 |
| 10 | Fichier SD 6 | Fichier SD 8 | Fichier SD 10 | Fichier SD 12 |
| 11 | Nœud de contrôle SD 6 | Nœud de contrôle SD 8 | Nœud de contrôle SD 10 | Nœud de contrôle SD 12 |
| 12 | Mot de passe SD 6 | Mot de passe SD 8 | Mot de passe SD 10 | Mot de passe SD 12 |
| 13 | Putois | Cobra | Tueur | Titan |
| 14 | Cobra | Tueur | Liche | Dragon |
| 15 | Scorpion | Liche | Dragon | Tueur, Scorpion |
| 16 | Tueur, Putois | Cobra | Cobra, Corbeau | Kraken |
| 17 | Feu follet × 3 | Corbeau × 3 | Dragon, Feu follet | Corbeau, Feu follet, Cerbère |
| 18 | Liche | Liche, Corbeau | Titan | Dragon × 2 |

Le livre ne nomme pas le dé de ces deux tables ; les résultats vont de 1 à 6 et de 3 à 18, donc `1d6` et `3d6`.

**Étape 3 — ancrer dans le réel** : chaque fichier et nœud a une raison d'être (caméras, extincteurs, portes, tourelles…) ; décider si un Démon gère les nœuds (le Lutin est le plus courant). On peut échanger un programme contre un autre du même prix, réordonner les étages, ou ajouter un étage « boss » de la difficulté supérieure.

Exemple du livre (p. 209) : fichier (Analyse SD 6), mot de passe (SD 8), nœud caméras (SD 10), mot de passe (SD 8), Cobra, nœud porte sécurisée (SD 10), Cerbère.

### Démons

- GLACE intelligents qui défendent l'architecture et le lieu réel par les nœuds de contrôle (drones, tourelles). Ni programme ni GLACE à exécuter ; seulement **Élimination** et **Contrôle**, avec leurs actions virtuelles.
- Conscients de toute l'architecture : pas gênés par les mots de passe, savent toujours si un Netrunner est là, gagnent tout concours de Vitesse. Pas de VIT, de PER ni de DÉF : pas de Glissement contre eux, pas de coup gratuit à la rencontre ; ils se défendent avec `Interface + 1d10`.
- Ils passent **en tête de l'Initiative** dès qu'ils détectent un intrus (caméra) ou qu'un Netrunner entre ; ils activent d'abord leurs nœuds, puis éliminent s'il reste des actions. Ils suivent des déclencheurs fixes (ex. « tirer sur qui n'a pas le badge »).

| Démon | REZ | Interface | Actions virtuelles | Valeur de combat | Prix |
| --- | --- | --- | --- | --- | --- |
| Lutin | 15 | 3 | 2 | 14 | 1 000 (Très onéreux) |
| Ifrit | 25 | 4 | 3 | 14 | 5 000 (Luxueux) |
| Balron | 30 | 7 | 4 | 14 | 10 000 (Super luxueux) |

### Défenses

- **Mobiles** (drones) : un Démon doit tenir leur nœud, sinon elles se piratent avec Sécurité électronique. Contrôlées par un Netrunner, elles utilisent ses compétences.
- **Fixes** (tourelles, armes automatisées) : agissent seules avec leur valeur de combat + `1d10`, n'esquivent pas.
- **Environnementales** (sols, pièges) : seulement allumées ou éteintes ; se déclenchent automatiquement. Perception SD 17 pour les repérer.
- Une défense non contrôlée, une fois piratée par Sécurité électronique, se commande avec un Agent à 6 m d'un point d'accès (une action, comme Contrôle).

| Défense | Type | Données | Piratage (Sécurité électronique) |
| --- | --- | --- | --- |
| Drone terrestre | mobile | MOUV 4, 30 PS ; 2 parmi pistolet très lourd (8 perforantes), pistolet-mitrailleur (30), caméra | SD 21, 5 min |
| Grand drone aérien | mobile | MOUV 6, 20 PS ; 2 parmi pistolet à fléchettes (8 empoisonnées), pistolet très lourd, caméra | SD 21, 5 min |
| Mini-drone aérien | mobile | MOUV 6, 15 PS ; 1 des mêmes objets | SD 17, 5 min |
| Nuage de drones | mobile | MOUV 8, 15 PS ; une entité qui frappe comme une arme de mêlée très lourde | SD 17, 5 min |
| Drone-araignée | mobile | MOUV 4, 40 PS ; 2 parmi lance-grenades (2 lacrymogènes), arme de mêlée très lourde, pistolet-mitrailleur lourd (40), caméra | SD 21, 5 min |
| Arme de mêlée automatisée | fixe | valeur de combat 14, 25 PS ; arme de mêlée très lourde | SD 17, 5 min |
| Nuage sanglant | fixe | une attaque sur tous : Résistance à la torture/aux drogues SD 15 ou 3d6 directs aux PS | SD 21, 5 min |
| Tourelle automatisée | fixe | valeur de combat 14, 25 PS ; fusil d'assaut, crache-feu, pistolet à fléchettes, pistolet très lourd ou PM lourd | SD 17, 5 min |
| Caméras d'observation | environnementale | 5 PS, vision nocturne/IR/UV | SD 9, 1 min |
| Tapis d'enchevêtrement | environnementale | 20 PS, MOUV −1d6 tant qu'on est dessus | SD 13, 1 min |
| Sol électrifié | environnementale | 20 PS, 6d6 au corps (armure, sans perforer), à nouveau à chaque fin de tour | SD 13, 1 min |
| Grille de lasers | environnementale | comme une arme de mêlée très lourde au corps ; Contorsion SD 17 pour traverser | SD 17, 5 min |
| Piège à fosse | environnementale | Athlétisme SD 15 pour éviter ; fond à pics ou nanofils 6d6 | SD 13, 1 min |
| Glue | environnementale | 10 PS, MOUV −2d6 | SD 13, 1 min |
| Barres anti-intrusion | environnementale | 20 PS, 6d6 au corps | SD 13, 5 min |
| Glissomax | environnementale | 10 PS, Athlétisme SD 15 à chaque mouvement ou au sol | SD 13, 1 min |
| Panneaux étourdissants | environnementale | 5 PS ; Résistance SD 15 ou œil et oreille endommagés 1 minute (sans dégâts bonus), zone 10 × 10 m | SD 13, 1 min |
| Ascenseur à gaz soporifique | environnementale | 60 PS ; pièce scellée, Résistance SD 13 ou inconscient | SD 17, 5 min |

### Acheter sa propre architecture

Seulement sur un Marché de nuit d'électronique personnelle organisé par un Fixer de rang 4 ou plus. Le nombre d'étages est définitif.

| Étages | Nœuds de contrôle max | Portatif | Prix par étage |
| --- | --- | --- | --- |
| 3-6 | 2 | oui | 1 000 (Très onéreux) |
| 7-12 | 3 | non | 5 000 (Luxueux) |
| 13-18 | — | non | 10 000 (Super luxueux) |

- Mot de passe, fichier ou nœud (un étage chacun) : SD 6 → 500 ; SD 8 → 1 000 ; SD 10 → 5 000 ; SD 12 → 10 000.
- GLACE : prix normal ; deux GLACE sur un étage coûtent le double chacun, trois le triple. Un seul Démon par tranche de six étages (Lutin 1 000, Ifrit 5 000, Balron 10 000).
- Défense reliée à un nœud, selon son SD de piratage : SD 9 → 500 ; SD 13 → 1 000 ; SD 17 → 5 000 ; SD 21 → 10 000.

Exemple du livre : 4 étages (4 000) ; Cerbère + Tueur au même étage (1 000 + 1 000) ; mot de passe SD 8 (1 000) ; Cerbère seul (500) ; nœud SD 8 (1 000) relié à une tourelle (5 000) → 13 500 ED.
