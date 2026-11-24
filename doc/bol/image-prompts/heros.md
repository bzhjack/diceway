# Prompts — portraits des héros de « les copains sous la terrasse »

Quatre héros créés le 2026-11-24 sur le compte de Lionel, sans portrait (les seuls portraits libres du compte sont ceux des PNJ
des scénarios : les reprendre aurait mis deux fois le même visage à la table). Une planche à générer via ChatGPT, dans le style
des planches de PNJ (`pnj.md`), puis à découper : chaque case devient l'`avatar` de la fiche (fichier sous
`/api/bol/portraits/`).

| Case | Héros | Fiche (`bol_heros.id`) |
| --- | --- | --- |
| 1 (haut gauche) | Jorg de Tyrus | `fa22db6e-8730-40b8-8e0f-eedb38081aea` |
| 2 (haut droite) | Domitia de Satarla | `f68f38a4-797b-4154-bb5f-de1774de5351` |
| 3 (bas gauche) | Brongara de Valgard | `ffc3dd8c-1477-44f5-91a0-a17f8b798679` |
| 4 (bas droite) | Kaja de Parsool | `6565c544-0f94-4e0f-a30d-06a28c3f4445` |

## Planche — 2 × 2, carrée

Le portrait est affiché en grand en haut des cartes de « Démarrer le combat » (recadré au tiers haut) et en médaillon rond
ailleurs : visage centré, tête entière dans la case, un peu d'espace au-dessus.

> Planche de portraits illustrés : une image carrée (1024×1024) découpée en une grille de 2 colonnes × 2 lignes de portraits carrés de taille identique (512×512), accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre avec un peu d'espace au-dessus, contre-plongée légère, regard vers le spectateur ou de trois quarts. Ce sont des héros : allure fière et déterminée, pas de monstre ni de visage inquiétant. Fonds sombres, flous et peu chargés, sans autre personnage. Lumière chaude et orangée d'une torche ou d'un couchant sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre (forme du visage, nez, âge, carnation, cheveux, pilosité, expression) ; ne jamais répéter le même visage.
>
> Les quatre personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :
>
> 1. Jorg de Tyrus : homme d'une trentaine d'années, ancien archer de la garde de Tyrus devenu mercenaire, visage anguleux et rasé, cheveux châtains coupés court, petite cicatrice au sourcil, regard calme de tireur ; un grand arc de guerre orné sur l'épaule, carquois de flèches empennées de bleu, armure légère de cuir clouté, manteau bleu délavé de Tyrus ; remparts de cité au crépuscule derrière lui.
> 2. Domitia de Satarla : prêtresse lettrée d'une maison noble de Satarla, femme d'une quarantaine d'années, visage fin et grave, peau mate, cheveux noirs relevés en chignon tenu par une épingle d'or, quelques mèches grises ; robe de prêtresse blanche et pourpre, pendentif sacré, un rouleau de parchemin dans une main et un bâton de marche dans l'autre ; colonnade de temple éclairée de lampes à huile derrière elle.
> 3. Brongara de Valgard : barbare des neiges du nord, femme de haute stature et massive, peau très claire rougie par le froid, longues tresses blond pâle, yeux gris, mâchoire carrée, cicatrice sur la joue ; épée valgardienne à large lame sur l'épaule, petit bouclier rond cerclé de fer, armure moyenne de mailles sous une fourrure d'ours ; proue de drakkar et ciel de neige derrière elle.
> 4. Kaja de Parsool : pirate de Parsool, jeune femme vive et rusée d'une vingtaine d'années, peau hâlée par le sel, cheveux noirs bouclés retenus par un foulard rouge, anneau d'or à l'oreille, sourire en coin effronté ; hache d'abordage à la main, javelots courts dans le dos, armure légère de cuir, chemise ouverte ; gréement et voiles d'un navire au couchant derrière elle.

## Découpe et pose

Déposer la planche dans `~/Téléchargements`, puis demander à Claude de la poser. Découpe en 4 cases de 512×512, réduites à
400×400 (ou recadrées à la main autour du visage si la grille n'est pas respectée, comme pour la planche C des PNJ) ; chaque case
est écrite dans l'`avatar` de sa fiche, qui en fait un fichier (`HasPortrait`, `BolPortraits`) — en `-u www-data`, sinon Apache ne
peut plus écrire dans le dossier des portraits.

## Avancement

| Planche | État | Date |
| --- | --- | --- |
| ✅ Héros 1 à 4 | fait : planche 1254×1254 bien alignée, 4 cases coupées à 4 px de la jointure, réduites à 512×512 (WebP), posées sur les fiches | 2026-11-24 |
