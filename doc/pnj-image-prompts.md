# Prompts — portraits des PNJ du catalogue global

Prompts pour regénérer (via ChatGPT) les portraits des 15 PNJ du catalogue
global (`BolPnjSeeder.php`), dans le même style que les bannières des
bibliothèques (`doc/header-image-prompts.md`, en particulier `header-pnj.png`) :
illustration peinte et encrée façon BD fantasy des années 80, ombres
profondes, dominante vert émeraude sombre / teal contrastée par la lumière
chaude de torches. Les portraits actuels sont des rendus réalistes qui ne
collent plus à ce style.

## Fichiers attendus

Un fichier par PNJ, nommé d'après son `id` en base :
`front/src/assets/bol/pnj/<id>.jpg` (lus par `pnj-card.component.ts` et
`combat-play.util.ts`). Les images actuelles sont des carrés de 400×400 :
générer en carré (1:1, 1024×1024 ou plus), puis réduire à 400×400 en JPEG.

| id | PNJ | Type |
| --- | --- | --- |
| 1 | Archer de Tyrus | coriace |
| 2 | Barbare tribal | coriace |
| 3 | Assassin halakhi | coriace |
| 4 | Champion gladiateur | coriace |
| 5 | Chef de bande | coriace |
| 6 | Druide jaune d’Oomis | coriace |
| 7 | Garde jemadar | coriace |
| 8 | Guetteur homme-oiseau | coriace |
| 9 | Matelot de Parsool | coriace |
| 10 | Pilote de nef volante de Satarla | coriace |
| 11 | Sergent du guet | coriace |
| 12 | Sentinelle kalukan | coriace |
| 13 | Methyn Sarr, la Reine Sorcière | rival |
| 14 | Jesharek Jool | rival |
| 15 | Kalzatan l’Imposteur | rival |

## Consignes communes

À coller **en tête de chaque prompt**, avant la description du personnage
(ou à donner une fois en début de conversation, puis demander les PNJ un par
un pour garder la même patte) :

> Portrait illustré carré (1:1), style pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Un seul personnage en buste (de la tête à la poitrine, un peu au-dessus de la ceinture), visage bien lisible et centré, regard tourné vers le spectateur ou légèrement de trois quarts, contre-plongée légère. Fond sombre de cité antique en ruine ou de nature sauvage, flou et peu chargé (brume, palmiers, pierre taillée), sans autre personnage. Dominante chromatique vert émeraude sombre / teal, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne qui éclaire un côté du visage. Aucun texte, logo, watermark ni cadre dans l'image.

Le portrait est affiché en médaillon rond (ordre de passage, cartes de
combat) : garder le visage au centre et la tête entière dans le cadre.

Pour les rivaux (13 à 15), on peut pousser la dominante vers la couleur de
leur univers (voir leur prompt) tout en gardant la même facture.

## Coriaces

### 1 — Archer de Tyrus

> Un archer d'élite de l'armée de Tyrus, homme d'âge mûr, barbe courte et regard concentré, bandant un arc long orné vers le spectateur, corde tendue près de la joue, carquois de flèches à l'épaule. Armure légère de cuir clouté, manteau bleu de Tyrus rejeté sur l'épaule. Lumière de torche orangée sur le visage.

### 2 — Barbare tribal

> Un barbare tribal massif à la peau claire et hâlée de rousseur, cheveux longs roux-blond emmêlés et barbe tressée, yeux bleu clair, peintures de guerre bleues sur le visage et la poitrine, cicatrices, fourrures et cuir sur les épaules, la lame d'une grande épée à deux mains dressée derrière la tête. Armure légère de cuir et d'os. Expression féroce, mâchoire serrée. Fond de jungle sombre et brume.

### 3 — Assassin halakhi

> Un assassin de la cité montagneuse d'Halakh, mince et silencieux, capuche et foulard sombres ne laissant voir que des yeux perçants, un kriss à lame ondulée tenu bas devant lui, quelques couteaux de lancer glissés à la bandoulière. Aucune armure, vêtements sombres ajustés. Silhouette dans l'ombre, éclairée seulement d'un trait de lumière chaude sur les yeux et la lame.

### 4 — Champion gladiateur

> Un champion gladiateur de l'arène, homme noir athlétique à la tête rasée et au visage lisse, marqué de cicatrices de combats contre des hommes et des bêtes, casque ouvert, épée à la main et bouclier rond levé devant l'épaule. Armure moyenne de plates et de cuir, épaulière ouvragée. Regard calme et dur, sans sourire, sable de l'arène et poussière dorée en arrière-plan, foule floue dans l'ombre.

### 5 — Chef de bande

> Le chef d'une bande de voyous des ruelles : homme maigre au teint cireux, visage étroit et nez long, cheveux grisonnants plaqués en arrière, regard fuyant et rusé, dent en or, balafre à la joue, un gourdin cloué sur l'épaule et une dague glissée à la ceinture. Aucune armure, veste de cuir usée et foulard. Ruelle étroite et sombre éclairée par une lanterne, ombres de complices en arrière-plan très flou.

### 6 — Druide jaune d'Oomis

> Un druide fou, adorateur de Morgazzon : homme maigre aux yeux écarquillés et brillants, barbe emmêlée, robe jaune safran en lambeaux, feuillages et ossements dans les cheveux, un coutelas de bronze à la main. Aucune armure. Expression exaltée et inquiétante, sourire dément. Fond de forêt brumeuse aux troncs tordus, lueurs verdâtres.

### 7 — Garde jemadar

> Une garde d'élite de la reine de Malakut (la Garde jemadar), guerrière gracieuse et redoutable, visage fier, tenant devant elle le khastok, une longue lance au fer effilé, un couteau à la ceinture. Armure légère de cuir et de métal aux ornements de danseuse, tissus colorés et bijoux. Palais de pierre sculptée et torches en arrière-plan flou.

### 8 — Guetteur homme-oiseau

> Un guetteur homme-oiseau : humanoïde élancé aux traits d'oiseau de proie (bec crochu, yeux ronds et jaunes, plumes sombres sur la tête et les bras), perché sur un rocher et brandissant une fronde ou une poignée de fléchettes. Aucune armure, sangles de cuir légères. Falaises de roche et ciel de nuit orageux derrière lui.

### 9 — Matelot de Parsool

> Un vétéran de la marine de Parsool, sexagénaire trapu, visage rond et large, crâne dégarni sous un foulard noué sur la tête, favoris et barbe blancs, rides profondes, peau tannée par le sel et le soleil, un œil plissé, sabre à la main et dague à la ceinture. Aucune armure, chemise ouverte et gilet de cuir. Air de vieux loup de mer bougon. Pont de navire, cordages et voile en arrière-plan, lanterne de bord.

### 10 — Pilote de nef volante de Satarla

> Le cadet d'une famille noble de Satarla, pilote de la marine aérienne : jeune homme élégant et un peu hautain, lunettes d'aviateur relevées sur le front, cape et vêtements de qualité, épée au côté et arbalète à la main. Armure légère de cuir ouvragé. Ciel de nuit avec la coque d'une nef volante à l'arrière-plan, lanternes dorées.

### 11 — Sergent du guet

> Un sergent du guet, guerrier d'âge mûr aux tempes grisonnantes et au visage fermé, casque de métal, moustache grise, épée courte ou gourdin d'officier à la main, bouclier au bras. Armure moyenne de mailles et de cuir. Regard d'autorité fatiguée. Porte de cité en pierre et torches du guet en arrière-plan.

### 12 — Sentinelle kalukan

> Une sentinelle kalukan, garde du corps de la Reine Sorcière : colosse impassible au visage figé et sans émotion, yeux vides, peau pâle d'automate ou de mort-vivant, armure moyenne de plates sombres gravées de runes, épée lourde tenue droite devant lui, bouclier au bras. Posture immobile et menaçante. Lueur rouge de braise dans l'ombre, fond de forteresse volcanique.

## Rivaux

### 13 — Methyn Sarr, la Reine Sorcière

> Methyn Sarr, la Reine Sorcière de la Côte de Feu : femme à la beauté terrible et arrogante, yeux perçants couleur de braise, longue chevelure noire comme du charbon tressée de pierreries flamboyantes et d'amulettes, baudrier de guerre ouvragé sur une tenue sombre, une dague rituelle à la ceinture. Des flammes de Zaggath, le Seigneur du Feu, dansent autour d'une main levée et éclairent son visage. Dominante chromatique rouge braise / orangé profond sur fond sombre (exception à la dominante teal), forteresse volcanique derrière elle.

### 14 — Jesharek Jool

> Jesharek Jool, alchimiste et magicien renommé de Tyrus : vieil homme rabougri de plus de soixante-dix ans, visage ridé et peu amène, barbe clairsemée, yeux fatigués derrière un regard acéré, robe de savant couverte de taches, un bâton à la main, une dague et des fioles à la ceinture. Laboratoire encombré d'alambics, de cornues et de grimoires derrière lui, lueur de fioles verdâtres et bougies. Dominante vert émeraude / ambre.

### 15 — Kalzatan l'Imposteur

> Kalzatan l'Imposteur (de son vrai nom Ferk), sorcier né esclave à Zalut qui a pris la place et l'apparence de son maître : homme dans la force de l'âge, visage séduisant mais faux, sourire trop large, regard fiévreux et paranoïaque, robes de sorcier somptueuses mal ajustées, une épée à la ceinture. Une seconde silhouette ou un reflet déformé flotte derrière son visage, trahissant l'illusion. Énergie violette du Néant qui s'échappe de ses mains. Dominante teal / violet sombre.

## Planches (plusieurs portraits en une seule image)

Pour garder la même patte d'un PNJ à l'autre et générer moins d'images, on peut
demander une **planche** : une grille de portraits carrés, qu'on découpe ensuite.
Format conseillé : **1536×1024 (paysage), 3 colonnes × 2 lignes** = 6 cases
carrées de 512×512, puis réduites à 400×400. 1024×1024 n'est pas un multiple de
400 et 3×3 donnerait des cases trop petites (341 px). 15 PNJ = 3 planches
(6 + 6 + 3).

| Planche | Cases (ligne 1 : gauche → droite, puis ligne 2) | ids |
| --- | --- | --- |
| A | Archer, Barbare, Assassin / Gladiateur, Chef de bande, Druide | 1 à 6 |
| B | Garde jemadar, Guetteur, Matelot / Pilote, Sergent, Sentinelle | 7 à 12 |
| C | Methyn Sarr, Jesharek, Kalzatan (3 cases, la 2ᵉ ligne vide) | 13 à 15 |

### Consignes de planche

À coller en tête de chaque planche, à la place du bloc « Consignes communes » :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante vert émeraude sombre / teal, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

### Planche A — coriaces 1 à 6

> 1. Archer de Tyrus : homme d'âge mûr, barbe courte, regard concentré, bandant un arc long orné vers le spectateur, carquois à l'épaule, armure légère de cuir clouté, manteau bleu de Tyrus.
> 2. Barbare tribal : colosse à la peau claire, longs cheveux roux-blond emmêlés, barbe tressée, yeux bleu clair, peintures de guerre bleues, cicatrices, fourrures et cuir, une grande épée à deux mains dressée derrière la tête, expression féroce.
> 3. Assassin halakhi : mince et silencieux, capuche et foulard sombres ne laissant voir que les yeux, un kriss à lame ondulée tenu bas, couteaux de lancer à la bandoulière, dans l'ombre.
> 4. Champion gladiateur : homme noir athlétique à la tête rasée et au visage lisse, cicatrisé, casque ouvert, épée en main et bouclier rond levé, armure moyenne de plates et de cuir, regard calme et dur sans sourire, sable et poussière dorée derrière lui.
> 5. Chef de bande : homme maigre au teint cireux, visage étroit, nez long, cheveux grisonnants plaqués en arrière, regard fuyant et rusé, dent en or, balafre à la joue, gourdin cloué sur l'épaule, dague à la ceinture, veste de cuir usée, ruelle sombre.
> 6. Druide jaune d'Oomis : homme maigre aux yeux écarquillés, barbe emmêlée, robe jaune safran en lambeaux, feuillages et ossements dans les cheveux, coutelas de bronze, sourire dément, forêt brumeuse verdâtre.

### Planche B — coriaces 7 à 12

> 1. Garde jemadar : guerrière gracieuse et fière de la garde de la reine de Malakut, tenant le khastok (longue lance au fer effilé), armure légère ornée de bijoux et de tissus colorés, palais de pierre sculptée derrière elle.
> 2. Guetteur homme-oiseau : humanoïde élancé aux traits d'oiseau de proie (bec crochu, yeux ronds jaunes, plumes sombres), perché sur un rocher, brandissant une fronde, ciel d'orage.
> 3. Matelot de Parsool : vétéran sexagénaire trapu au visage rond, crâne dégarni sous un foulard, favoris et barbe blancs, rides profondes, peau tannée par le sel, un œil plissé, sabre en main, gilet de cuir sur chemise ouverte, air bougon, pont de navire et cordages.
> 4. Pilote de nef volante de Satarla : jeune noble élégant et un peu hautain, lunettes d'aviateur relevées sur le front, cape de qualité, armure légère de cuir ouvragé, épée au côté, coque d'une nef volante dans un ciel de nuit.
> 5. Sergent du guet : guerrier d'âge mûr aux tempes grises et au visage fermé, casque de métal, moustache grise, armure moyenne de mailles et de cuir, bouclier au bras, porte de cité et torches du guet.
> 6. Sentinelle kalukan : colosse impassible au visage figé et sans émotion, yeux vides, peau pâle d'automate, armure moyenne de plates sombres gravées de runes, épée lourde tenue droite, lueur rouge de braise et forteresse volcanique.

### Planche C — rivaux 13 à 15

La dominante teal est volontairement relâchée pour les rivaux (une couleur
par personnage). Lignes de la grille : ne remplir que les trois cases du haut.

> 1. Methyn Sarr, la Reine Sorcière : beauté terrible et arrogante, yeux couleur de braise, longue chevelure noire tressée de pierreries flamboyantes et d'amulettes, baudrier de guerre ouvragé, une main levée d'où dansent les flammes de Zaggath qui éclairent son visage ; dominante rouge braise / orangé profond, forteresse volcanique derrière elle.
> 2. Jesharek Jool : alchimiste et magicien de Tyrus, vieil homme rabougri de plus de soixante-dix ans, visage ridé et peu amène, barbe clairsemée, regard acéré, robe de savant tachée, bâton en main, fioles à la ceinture, laboratoire d'alambics et de grimoires derrière lui ; dominante vert émeraude / ambre.
> 3. Kalzatan l'Imposteur : sorcier né esclave qui a pris l'apparence de son maître, homme dans la force de l'âge au visage séduisant mais faux, sourire trop large, regard fiévreux, robes somptueuses mal ajustées, un reflet déformé flottant derrière son visage, énergie violette du Néant qui s'échappe de ses mains ; dominante teal / violet sombre.
> 4. à 6. : laisser vides (fond noir uni).

### Découpe

Si les cases sont bien alignées, un découpage en 512×512 puis une réduction à
400×400 suffisent (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-a.png -crop 512x512 +repage -resize 400x400 -quality 88 case-%d.jpg
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas)
# à renommer en <id>.jpg : A → 1…6, B → 7…12, C → 13…15
```

Si ChatGPT ne respecte pas exactement la grille (cases décalées, léger
débordement), recadrer à la main chaque case en carré autour du visage plutôt
que de forcer le découpage régulier ; en dernier recours, redemander la planche
ou générer le portrait seul avec le prompt individuel plus haut.
