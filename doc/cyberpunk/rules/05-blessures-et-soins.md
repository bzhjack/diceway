# Blessures, soins, drogues et thérapie

Pages source : p. 219-232 (« Trauma Team »). Texte : `doc/cyberpunk/pdf-text/11-trauma-team-p219-232.txt`.

Les seuils de blessure, les jets de sauvegarde contre la mort et les tables de blessures critiques (repris p. 220-222) sont dans `04-combat.md`. La cyberpsychose (p. 230-232) est dans `06-cybermateriel-et-humanite.md`.

## Compétences de soin

| Compétence | Stabiliser un seuil | Soins d'urgence / traitement d'une blessure critique | Accès |
| --- | --- | --- | --- |
| Premiers secours | oui | soins d'urgence, seulement sur les blessures critiques les plus courantes | tout le monde ; au moins 2 à la création |
| Assistance médicale (× 2) | oui | soins d'urgence et traitement, sauf les blessures les plus graves | tout le monde, mais compétence à coût doublé |
| Chirurgie | non | toutes, y compris les plus létales | Medtech seulement (capacité Médecine) |
| Cybertech | non | soins d'urgence et traitement d'une blessure critique sur un cyberimplant qui remplace un organe (cybermembre, cyberœil, cyberaudio…), au SD indiqué et dans le même temps | tout le monde |

Une blessure critique sur une partie cybernétique s'applique quand même (effet et 5 dégâts bonus).

## Stabilisation

- Une action, `TECH + Premiers secours ou Assistance médicale + 1d10`, sur soi ou sur un autre.
- SD selon le seuil de la cible : **légère 10, grave 13, mortelle 15**.
- Stabilisé, on récupère **COR PS par jour** de repos (activités calmes la majeure partie du temps), jusqu'au maximum. Trop d'efforts : pas de PS ce jour-là, les plaies se rouvrent, il faut être stabilisé à nouveau.
- En **blessure mortelle**, la stabilisation rend immédiatement **1 PS** et le personnage est **inconscient 1 minute** (il ne perçoit plus rien). Il refait des jets de sauvegarde contre la mort s'il retombe en blessure mortelle pendant ce temps. La pénalité de sauvegarde revient à sa valeur de base.
- On ne ramène pas un mort à la vie.

## Soigner une blessure critique

| | Effet | Durée d'une tentative | Sur soi-même |
| --- | --- | --- | --- |
| **Soins d'urgence** | supprime l'effet de blessure **pour le reste de la journée** | 1 minute | oui |
| **Traitement** | supprime l'effet de blessure **définitivement** | 4 heures | non |

Pour certaines blessures (plaie avec corps étranger, muscle déchiré, commotion cérébrale), les soins d'urgence suffisent à supprimer l'effet définitivement. Les compétences et les SD de chaque blessure sont dans les tables de `04-combat.md`.

## Trauma Team

- Abonnement **Silver** 500 ED/mois : les traitements qui demandent de la chirurgie sont payés au prix de l'hôpital ; à défaut, l'équipe fait de son mieux avec Assistance médicale puis dépose le client à l'hôpital le plus proche. **Gold** 1 000 ED/mois : chirurgie comprise.
- Couverture transférable « un pour un » : pour un ami qui n'en a pas, pas pour deux à la fois ni si on l'a déjà utilisée pour soi.
- Appeler prend une action. Une carte enregistrée sur un Agent relié à un biomoniteur appelle sans action quand les PS passent **sous le COR** ou à chaque blessure critique qui arrache une partie du corps (aussi pour un ami dont l'Agent porte la carte).
- Arrivée en `1d6` rounds ; l'équipe se place **en tête de la file d'Initiative**, met les patients couverts en sac à cryopompe dans le tour de son arrivée si possible, puis repart sous tir de couverture. Abuser du service pour des bobos peut faire « oublier » le prochain appel.
- Équipe de 5 en AV-4 (Helix de Tsunami Arms en support d'arme lourde, 4 cryocuves, table d'opération). Profils de type renforts du Justicier : une **valeur de combat** (CARAC + compétence) + `1d10` en attaque comme en défense ; ils n'esquivent pas les balles.

| Membre | Équipement | Valeur de combat | PA | PS | MOUV et COR |
| --- | --- | --- | --- | --- | --- |
| Médecin | tenue pare-balles légère, cryopompe, pistolet lourd, 2 hypodairs de rapidétox ; valeur aussi pour Pilotage aérien, Premiers secours, Assistance médicale, Techniques médicales | 10 | 11 | 20 | 4 |
| Infirmier | kevlar, cryopompe, bouclier balistique ; mêmes compétences que le médecin | 10 | 7 | 25 | 6 |
| Pilote | kevlar, pistolet très lourd ; Aérotech, Premiers secours, Pilotage aérien | 10 | 7 | 25 | 6 |
| Agent de sécurité (× 2) | tenue pare-balles lourde, fusil d'assaut | 10 | 13 | 30 | 4 |

## Hôpital

- On ne paie que l'acte (stabilisation ou traitement) au **SD le plus élevé** nécessaire pendant la visite ; le reste est inclus. Un traitement prend au plus 4 heures ; on rentre souvent chez soi le jour même.
- Lit d'hôpital : 100 ED (Très coûteux) la nuit. Paiement possible au début du mois suivant (gare aux recouvreurs).

| SD le plus élevé de la visite | Prix |
| --- | --- |
| 17 ou plus | 1 000 (Très onéreux) |
| 15 | 500 (Onéreux) |
| 13 | 100 (Très coûteux) |
| 10 | 50 (Coûteux) |

- **Pièces de remplacement** : l'hôpital remplace une partie perdue par un organe cloné ou un **cyberimplant médicalisé** (fonction normale seulement : pas d'emplacement d'option, pas de bonus de dégâts, **pas de perte d'Humanité**). Membre cloné acheté d'avance et cryogénisé : 50 ED (Coûteux). Pour un vrai cyberimplant : payer le traitement, puis le cyberimplant (ex. bras arraché : 1 000 de traitement + 500 de cyberbras).

## Installer et extraire un cyberimplant

- L'installation est comprise dans le prix d'achat. La faire soi-même hors circuit : Chirurgie (Medtech), 4 heures ; le patient subit la perte d'Humanité normale. Pas d'opération sur soi-même, sauf pour un implant posé en boutique.
- **Extraire** un implant d'un cadavre sans le détruire : Medtech, même SD que l'installation, 4 heures (sauf implant amovible en une action : puce, cybermembre à monture rapide). Un échec détruit l'implant et coûte 2 heures. Arraché à la machette : une minute, mais l'implant est détruit (réparable avec Cybertech, invendable en l'état).

| Lieu d'installation | SD de Chirurgie (Medtech) | Prix à l'hôpital |
| --- | --- | --- |
| Boutique | 13 | 100 (Très coûteux) |
| Centre médical | 15 | 500 (Onéreux) |
| Hôpital | 17 | 1 000 (Très onéreux) |

## Sculpture corporelle

Une opération de 4 heures (un échec gaspille les matériaux et 2 heures) ; pas sur soi-même.

| Type | Lieu | Prix | Perte d'Humanité | SD de Chirurgie (Medtech) |
| --- | --- | --- | --- | --- |
| Classique | centre médical | 500 (Onéreux) | — | 15, matériaux 100 ED |
| Exotique (fourrure, queue, sabots, griffes…) | hôpital | 1 000 (Très onéreux) | 4d6 | 17, matériaux 500 ED |

## Drogues de rue

- Une dose : une action avec un **hypodair** sur une cible consentante, ou une attaque d'arme de mêlée qui, si elle touche, injecte au lieu de blesser.
- L'**effet principal** est automatique. Plusieurs doses multiplient sa durée par le nombre de doses.
- Quand il se dissipe : `VOL + Résistance à la torture/aux drogues + 1d10` contre le SD de l'**effet secondaire**. En cas d'échec, l'effet secondaire est **permanent** et rend dépendant jusqu'à une thérapie.

| Drogue | Prix | Effet principal | Effet secondaire (SD) |
| --- | --- | --- | --- |
| Boost | 50 (Coûteux) | 24 h : **INT +2** (peut dépasser 8) | 17 : accro, INT −2 tant qu'accro |
| Dentelle noire | 50 (Coûteux) | 24 h : perte d'Humanité de `2d6` à la prise (rendue si l'effet secondaire est évité) ; ignore les effets des blessures graves | 17 : la perte d'Humanité est définitive ; accro, RÉF −2 hors effet principal |
| Smash | 10 (Ordinaire) | 4 h : +2 en Danse, Contorsion, Conversation, Psychologie, Persuasion, Jeu d'acteur | 15 : accro, −2 dans ces mêmes compétences ; envies de dose à jouer |
| Synthécoke | 20 (Ordinaire) | 4 h : **RÉF +1** (peut dépasser 8), bouffées de paranoïa à jouer | 15 : accro, RÉF −2 hors effet principal ; envies à jouer |
| Verre bleu | 20 (Ordinaire) | 4 h : « flashs » (hallucinations) annoncés par le MJ : pas d'action pendant ce tour | 15 : accro ; l'effet principal ne provoque plus de flash, mais l'accro a des flashs hors effet (environ un par heure) |

## Thérapie

- Pratiquée par un Medtech avec **Techniques médicales** (capacité Médecine). Une semaine entière pendant laquelle docteur et patient ne font rien d'autre ; jet à la fin contre le SD. Échec : semaine perdue et matériaux perdus. Pas sur soi-même.
- Matériaux vendus exclusivement par Biotechnica. Le prix suppose que le patient ne dort pas à l'hôpital (sinon 100 ED la nuit).

| Thérapie | Prix | Effet | SD (matériaux) |
| --- | --- | --- | --- |
| Addiction | 1 000 (Très onéreux) | Libère d'une addiction ; pendant 1 an, tout jet contre l'effet secondaire de cette drogue échoue automatiquement. | 15 (500 ED) |
| Perte d'Humanité standard | 500 (Onéreux) | Regagne `2d6` points d'Humanité perdus. | 15 (100 ED) |
| Perte d'Humanité extrême | 1 000 (Très onéreux) | Regagne `4d6` points d'Humanité perdus. | 17 (500 ED) |

L'Humanité regagnée est plafonnée par l'Humanité maximum : chaque cyberimplant la réduit de 2, chaque cyborgimplant de 4 (un implant à 0 de perte ne la réduit pas). Mécanique de l'Humanité : `06-cybermateriel-et-humanite.md`.

## Traumatisme mental

Le MJ peut infliger une perte d'Humanité après un événement traumatique.

| Traumatisme | Exemple | Perte d'Humanité |
| --- | --- | --- |
| Incident physique | torture | 1d6 |
| Incident mental | assister à une mort ou une mutilation horrible | 1d6 |
| Stress mental prolongé | enlèvement, emprisonnement, maltraitance sur la durée | 2d6 |
| Stress environnemental prolongé | faim, zone de guerre, catastrophe, danger constant pendant 1 mois | 2d6 |

## Mort d'un personnage

Conseils au MJ (p. 220) : faire préparer un personnage de rechange qui connaît le défunt, et annoncer d'emblée que le jeu est létal.
