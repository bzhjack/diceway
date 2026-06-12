# Plan — Alignement de `doc/rules/*.md` avec le PDF de règles

> Audit réalisé le 2026-06-10 contre `doc/Pdf BoL Mythic Livre de base VF 1.3.pdf` (217 pages),
> via les extractions texte de `doc/pdf-text/` (rappel : page PDF = page livre + 2).
>
> **✅ Toutes les corrections (F1, C1-C6, H1-H2, P1-P2, N1) appliquées le 2026-06-10.**

## Verdict global

**Le corpus `doc/rules/` est très fidèle au livre.** Toutes les tables de valeurs vérifiées sont
exactes : jet d'action/attaque/réaction, difficultés et portées, dégâts par catégorie, armures et
boucliers, table des armes, options de combat et options héroïques, points d'attributs/aptitudes/
carrières à la création, langues, table des tailles de créatures, gabarits de démons et pouvoirs,
profils PNJ et règle de horde, valeur d'armée et jet de bataille (−7, ±10), ressources navales et
profils de navires, coûts XP et suivants, coûts/minima des cercles de sorcellerie, récupération du
pouvoir, coûts et difficultés d'alchimie.

Les écarts relevés sont des **nuances de formulation ou des omissions ponctuelles** — aucune
valeur chiffrée fausse. Un seul écart a un impact mécanique réel (F1, points de foi).

## Écarts à corriger

### `05-alchimie-foi-sorcellerie.md`

| ID | Écart | Source | Correction |
| --- | --- | --- | --- |
| F1 | **La règle d'acquisition des points de foi manque** : le md donne le tableau des temps de dévotion mais pas le taux. Le livre : « Prêtres et druides reçoivent **1 point de foi par heure** passée à faire leurs dévotions. » | livre p. 146 | Ajouter la ligne « 1 point de foi par heure de dévotion » en tête de la section *Acquisition*. |

### `02-actions-combat.md`

| ID | Écart | Source | Correction |
| --- | --- | --- | --- |
| C1 | Conversion réussite → succès héroïque : le md ajoute « (avec accord du MJ) » ; le livre n'exige pas d'accord (« vous pouvez aussi convertir un simple succès en succès héroïque par la dépense de 1 point d'héroïsme »). | p. 59 | Retirer la mention d'accord du MJ. |
| C2 | Défier la mort sous −5 : le md affirme « récupère 1 vitalité/jour jusqu'à score positif » ; le livre dit seulement « vous pourrez vous remettre sur pied avec quelques jours de repos ». Le rythme 1/jour appartient à *Secourir un mourant*. | p. 58 | Reformuler : « stabilisé, inconscient, remis sur pied en quelques jours de repos ». |
| C3 | Soins médicaux : le md applique « +1 niveau de difficulté par point de vitalité négatif » au jet quotidien de doublement de récupération ; dans le livre cette aggravation ne concerne que le jet de **stabilisation** (Secourir un mourant). | p. 65-66 | Déplacer la phrase d'aggravation vers la seule section *Secourir un mourant*. |
| C4 | Faveur divine : le md omet la précision « utilisable même après un double 1 (échec automatique) ». | p. 58 | Ajouter la précision. |
| C5 | Retarder son action : le livre précise « vous agissez en toute fin de round, ou vous perdez simplement votre action » ; le md dit « agit plus tard dans le round, ou renonce à agir ». | p. 61 | Préciser « en toute fin de round ». |
| C6 | Succès légendaire : le livre précise que la conversion héroïque → légendaire reste possible après une relance par *Faveur divine* si le second jet donne un double 6. | p. 59 | Ajouter cette note. |

### `01-creation-heros.md`

| ID | Écart | Source | Correction |
| --- | --- | --- | --- |
| H1 | Abaisser un **attribut** à −1 requiert « l'accord du MJ » dans le livre ; le md ne le mentionne pas (pour les aptitudes de combat, le livre ne demande pas d'accord — l'asymétrie est dans le texte source). | p. 14, 17 | Ajouter « avec l'accord du MJ » à la règle des attributs uniquement. |
| H2 | 2e avantage d'origine : le livre permet de choisir ce 2e avantage **dans la liste générale** ; seul le désavantage compensatoire doit être régional. Le md laisse entendre que le 2e avantage est régional. | p. 16 | Préciser : « un 2e avantage (régional **ou général**) contre 1 désavantage **régional** ou −1 PH permanent ». |

### `06-progression.md`

| ID | Écart | Source | Correction |
| --- | --- | --- | --- |
| P1 | Le md omet : « certains avantages ne peuvent être choisis qu'à la création » et « certains désavantages ne peuvent être supprimés ». | p. 165 | Ajouter ces deux réserves à la section *Acheter ou retirer des traits*. |
| P2 | Maximum d'attribut humain : le livre ajoute « (mais des avantages permettent d'augmenter cette limite) » — cohérent avec Savant/Vigueur céruléenne (max 6) déjà documentés dans `01`. | p. 165 | Ajouter la parenthèse avec renvoi vers `01-creation-heros.md`. |

### `04-pnj-creatures-demons.md` — note de cohérence (pas une erreur)

| ID | Constat | Action |
| --- | --- | --- |
| N1 | Vitalité des coriaces : le chapitre 3 du livre dit « 5 à 9 » (p. 66, repris dans `02`), le chapitre 5 dit « 5 à 8 » (p. 132, repris dans `04`). **Incohérence interne du livre** — chaque md est fidèle à sa page source. | Ajouter une note croisée dans `02` et `04` signalant la divergence du livre, et retenir une valeur de référence pour l'app (suggestion : 5-9, le chapitre combat étant celui qu'implémente le code). |

### `03-guerre.md`

Aucun écart relevé sur les points vérifiés (valeur d'armée, jet de bataille, réaction du capitaine,
bandes de portée, ressources 1/20 plafonnées à +3 sauf abordage, manœuvres, profils de navires).

## Couverture de l'audit

Vérifié exhaustivement : toutes les formules et tables chiffrées des six fichiers.
Vérifié par échantillonnage (≈10 entrées chacune) : descriptions des ~50 avantages et
~40 désavantages, matrices régionales, restrictions raciales, profils du bestiaire, exemples de
sorts. Un écart résiduel dans ces longues listes reste possible ; si un doute surgit en jeu,
consulter `doc/pdf-text/` (grep) avant le PDF.

## Ordre d'exécution

1. **F1** (seul écart à impact mécanique — la foi est inutilisable sans le taux d'acquisition).
2. C1-C6 sur `02-actions-combat.md` (chapitre qu'implémente l'app combat ; C1 lève aussi
   l'ambiguïté pour l'assistant d'attaque — la conversion 1 PH → héroïque prévue en phase 1 du
   plan-finalisation-combat n'a pas besoin d'un toggle « accord MJ »).
3. H1-H2, P1-P2, N1 (documentaires, sans impact code).

Aucun changement de code n'est requis par cet audit : les mécaniques implémentées (combat,
création) reposent sur des valeurs qui se sont toutes révélées exactes.
