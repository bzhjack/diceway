# Prompts — portraits des Chroniques lémuriennes 1

Prompts pour générer (via ChatGPT) les portraits des PNJ créés par l'import des cinq aventures du recueil
(`app/*.json`) : **51 PNJ**. Les créatures et les démons du recueil, qui suivent le style du catalogue, sont dans
`doc/bol/image-prompts/creatures-demons-scenarios.md`.

Les PNJ suivent le style des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`) : illustration peinte et encrée façon BD
fantasy des années 80. La dominante est propre au recueil, qui mène du Khanat aux jungles de Qush : bleu acier /
gris froid contrasté par la lumière chaude d'une torche. Les descriptions viennent du livre, reprises dans le commentaire
de chaque fiche ; quand le livre ne décrit pas un personnage, la phrase s'en tient à ce qu'il dit de son rôle et de son
peuple.

## Où vont les portraits

Ces fiches appartiennent à un compte : leur portrait n'est pas un fichier `assets/bol/pnj/<id>.jpg` (réservé au
catalogue), mais le champ `avatar` de la fiche (choisi depuis le formulaire de la fiche, carré de 256×256 en PNG).

- Chaque aventure a sa propre saga d'import (`cl1-mariage-amer`, `cl1-les-trois-coffres`…), et une même clé revient
  d'une aventure à l'autre (`acolyte`, `guerrier`, `pretre`…). Nommer donc chaque portrait découpé d'après la
  **saga et la clé d'import** de sa fiche : `<saga>--<clé>.png` (ex. `cl1-mariage-amer--pretre.png`,
  `cl1-les-trois-coffres--rutgarr.png`). La saga et la clé sont stables d'un compte à l'autre, alors que l'id change.
- Pour les poser : un par un depuis le formulaire de la fiche (avatar), ou d'un coup avec `bol:import-portraits`, qui
  retrouve chaque fiche par sa clé d'import. Une fiche qui a déjà un portrait le garde (sauf `--force`), une clé qui
  renvoie au catalogue n'est pas touchée :

  ```bash
  docker cp portraits/ diceway:/tmp/portraits
  docker exec diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --dry-run
  docker exec -u www-data diceway php artisan bol:import-portraits /tmp/portraits --user=<email>
  ```

Les 21 PNJ des planches P6 à P9 portent aujourd'hui l'illustration en noir et blanc du livre : pour la remplacer, ajouter
`--force`. Les illustrations du livre ne sont pas dans le dépôt, et `bol:prune-portraits` supprime celles qui ne sont
plus sur une fiche. Pour les garder, copier le dossier avant :
`docker cp diceway:/var/www/html/storage/app/public/portraits ./portraits-livre`.

## Fiches du catalogue

Neuf clés du JSON d'import renvoient au catalogue (`"catalogue"`) : l'import ne crée pas de fiche, la scène
utilise directement celle du catalogue, qui affiche déjà son image (`front/src/assets/bol/`). Rien à générer ni à
poser ; l'image suit quand la planche du catalogue est refaite.

| Saga | Clé | Fiche du catalogue | Image |
| --- | --- | --- | --- |
| `cl1-la-tour-d-ajhaskar` | `jenko` | Sergent du guet | `front/src/assets/bol/pnj/11.jpg` |
| `cl1-le-plus-vieux-reve-de-lom` | `mythunga` | Mythunga | `front/src/assets/bol/bestiary/28.jpg` (ancien style jusqu'à la planche C5) |
| `cl1-le-plus-vieux-reve-de-lom` | `ours` | Ours des cavernes / ours polaire | `front/src/assets/bol/bestiary/29.jpg` (ancien style jusqu'à la planche C5) |
| `cl1-les-trois-coffres` | `necropede` | Nécropède | `front/src/assets/bol/bestiary/49.jpg` (ancien style jusqu'à la planche C9) |
| `cl1-les-trois-coffres` | `hyene` | Hyène du Beshaar | aucune avant la planche C10 (`bestiary/55.jpg`) |
| `cl1-les-trois-coffres` | `meneuse` | Meneuse de meute (hyène du Beshaar) | aucune avant la planche C10 (`bestiary/56.jpg`) |
| `cl1-mariage-amer` | `venator` | Venator | `front/src/assets/bol/bestiary/42.jpg` (ancien style jusqu'à la planche C7) |
| `cl1-mariage-amer` | `crocator` | Crocator | `front/src/assets/bol/bestiary/11.jpg` |
| `cl1-mariage-amer` | `necrophage` | Nécrophage | `front/src/assets/bol/bestiary/50.jpg` (ancien style jusqu'à la planche C9) |

Les planches C du catalogue sont dans `doc/bol/image-prompts/creatures-demons.md`.

## Consignes de planche — PNJ

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. À coller en
tête de chaque planche P, suivie de la liste de ses six personnages :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante bleu acier / gris froid, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase du personnage avec le préambule « Portrait illustré carré (1:1) »
de `doc/bol/image-prompts/pnj.md`, en remplaçant sa dominante vert émeraude sombre / teal par le bleu acier / gris froid.

## Planches

| Planche | Saga | Clés (cases 1 à 6) |
| --- | --- | --- |
| P1 | `cl1-mariage-amer` | `khalaman`, `jil`, `garde-villa`, `kalzo`, `venik`, `toll` |
| P2 | `cl1-mariage-amer` (cases 1 à 3), `cl1-un-ennui-mortel` (cases 4 à 6) | `guerrier`, `pretre`, `villageois`, `soldat-zombie`, `villageois-zombie`, `domestique-zombie` |
| P3 | `cl1-la-tour-d-ajhaskar` | `dramik`, `ilda`, `kurik`, `otos`, `ilkhta`, `rirtu` |
| P4 | `cl1-les-trois-coffres` | `rutgarr`, `acolyte`, `assassin`, `assim`, `shan`, `lana` |
| P5 | `cl1-les-trois-coffres` (cases 1 à 5), `cl1-la-tour-d-ajhaskar` (case 6) | `ram-verda`, `homme-de-main`, `arbaletrier`, `faldir`, `grooth`, `guerrier-xaliir` |
| P6 | `cl1-un-ennui-mortel` | `lai-mai`, `sharthal`, `qi-xian`, `muntal-zombie`, `kamai-zombie`, `garde-zombie` |
| P7 | `cl1-un-ennui-mortel` (cases 1 à 3), `cl1-mariage-amer` (cases 4 à 6) | `arlouk-zombie`, `lo-han-zombie`, `koubrog-zombie`, `tourmar`, `eormo`, `spirr` |
| P8 | `cl1-le-plus-vieux-reve-de-lom` (cases 1 à 4), `cl1-les-trois-coffres` (case 5), `cl1-la-tour-d-ajhaskar` (case 6) | `joanna`, `jaoor`, `oiseau`, `eclaireur`, `parsi`, `robos` |
| P9 | `cl1-la-tour-d-ajhaskar` | `ajhaskar`, `nyssa`, `momie` (3 cases, les 3 autres en fond noir uni) |

### P1 — Mariage amer : Satarla et les Kavaar

> 1. Khalaman Sendak : jeune aristocrate satarlan d'une vingtaine d'années à l'allure martiale, visage aquilin rasé de près, cheveux noirs huilés tirés en arrière, mâchoire crispée par une jalousie qu'il ne sait pas masquer, uniforme d'élite des pilotes des airs à brandebourgs et gants de cuir, gréement d'une nef volante sous un ciel d'orage zébré d'éclairs.
> 2. Jil Sendak : jeune héritière de la très haute aristocratie de Satarla, beauté fine au teint pâle, longs cheveux châtain clair tressés de perles, robe de mariée de soie blanche au voile rejeté en arrière, regard fiévreux d'amoureuse résolue, petite dague ouvragée serrée contre la poitrine, jardinières de jasmin d'une terrasse de palais.
> 3. Garde de la villa Sendak : garde satarlan trapu d'âge mûr, nez écrasé, moustache tombante, casque rond poli, tunique aux couleurs de la maison Sendak sur une armure de cuir, gourdin tenu en travers des mains, air buté de l'homme grassement payé pour ne laisser passer personne, balustrade d'un palais en fête.
> 4. Kalzo, nomade kavaar : géant céruléen à la peau bleue dans la force de l'âge, carrure massive, longue chevelure noire nouée en queue, barbe courte, visage grave et silencieux de veilleur funèbre, lance céruléenne dressée, braises d'une vasque à ses pieds, vestige céruléen dans la plaine au couchant.
> 5. Venik, nomade kavaar : géant céruléen plus jeune à la peau d'un bleu pâle, visage long et osseux, cheveux blancs coupés ras, cicatrice en travers de la joue, bouche close sur son vœu de silence, arc céruléen en bandoulière, linceul de peaux tannées flou derrière lui.
> 6. Toll, chaman des Kavaar : le plus vieux des trois géants bleus, visage bleu-gris profondément ridé, longue barbe blanche tressée de petits os, colliers de dents et sachets d'herbes médicinales, gourde de cuir à la ceinture, regard malicieux de marchand, gourdin géant à l'épaule, feu de camp dans un vallon.

### P2 — Mariage amer : les Mitis ; Un ennui mortel : les morts au front percé

> 1. Guerrier miti : chasseur de la jungle de Qush à la peau brune, corps sec et musculeux couvert de tatouages de serpents entrelacés, crâne rasé sur les côtés, langue violacée et yeux voilés de violet par la férocine, rictus de rage, longue sagaie, bourse de cuir pleine de dents d'ennemis nouée à la hanche, palissade de bambous affûtés.
> 2. Prêtre miti : homme mûr au crâne entièrement rasé, visage émacié et serein, tatouages de serpents remontant sur le cou, longue toge violette à motifs de serpents noirs, gemme blanche pendue au cou, lèvres murmurant une litanie, fumées d'encens devant une paroi de pierre noire sculptée de serpents.
> 3. Villageoise miti : jeune femme au teint clair, enlevée jadis à une autre tribu, cheveux châtains coupés court, guirlande de fleurs d'un violet intense en travers de la poitrine, tunique de cuir, regard méfiant et hostile envers l'étranger, huttes de branches et de lianes tressées.
> 4. Soldat zombie : soldat ghataï de la garnison de Shelang, peau cuivrée devenue blafarde, cheveux roux en désordre, chemise de laine de dormeur et aucune armure, petit trou net percé au milieu du front, regard vide de cadavre et rictus de haine, épée au poing, dortoir de pierre grise ; lumière froide de l'aube, sans torche (exception à la lumière chaude).
> 5. Villageois zombie : vieux pêcheur xi lu de Shelang, teint bistre devenu cireux, maigre barbiche noire, cheveux collés par l'embrun, vareuse de laine grossière et filet de pêche emmêlé sur l'épaule, trou percé au front, bouche béante, brouillard gelé et cahutes de pierres sèches ; palette livide, sans torche (exception à la lumière chaude).
> 6. Domestique zombie : corps sans tête d'un serviteur de la forteresse, cou tranché net, tunique et tablier de domestique maculés de sang, mains tendues à tâtons vers le spectateur, couloir de pierre grise du donjon éclaboussé d'écarlate ; le cadrage montre le buste et le cou tranché, aucun visage ; palette livide, sans torche (exception à la lumière chaude).

### P3 — La tour d'Ajhaskar : Lysor, la tour et les Xaliir

> 1. Capitaine Dramik : homme dans la force de l'âge, cheveux châtains coupés court, yeux verts perçants, visage carré et ferme de militaire, cuirasse de la garde royale de Lysor, épée au côté, assis sur un simple tabouret, salle de garde au fond d'un donjon.
> 2. Ilda, cuisinière d'Ajhaskar : vieille femme rabougrie et voûtée, cheveux gris filasse s'échappant d'un fichu, visage peu amène aux lèvres pincées, tablier de cuisine, louche à la main, garde-manger encombré de sacs de farine et de tonneaux.
> 3. Kurik, neveu d'Ilda : jeune homme roux d'environ seize ans, taches de rousseur, visage maigre et inquiet, tunique de domestique, chandelle à la main, recoin de cuisine entre des tonneaux.
> 4. Otos, serviteur du roi : homme entre deux âges en livrée royale fripée, cheveux clairsemés en désordre, sueur au front, yeux exorbités de panique, mains crispées sur sa poitrine, pierre noire d'une tour de sorcier.
> 5. Ilkhta, doyenne des Xaliir : très vieille femme à la peau brune, longs cheveux gris-brun, visage sillonné de rides, tunique de cuir, colliers de perles de bois, d'os et d'ivoire, scarification runique sur l'épaule gauche, regard dévot et inquiet, huttes de branchages sous une lune énorme.
> 6. Rirtu, frère de Nyssa : jeune garçon xaliir à la peau et aux cheveux bruns, tignasse en broussaille, pagne de cuir, scarification sur l'épaule gauche, arc et flèches à pointe d'os, regard vif de pisteur, jungle luxuriante.

### P4 — Les trois coffres : Halakh, le Phare et la roseraie

> 1. Rutgarr : druide gris d'une soixantaine d'années, grand et élancé, peau tannée par le soleil d'Halakh, visage grêlé par la petite vérole aux traits avenants qui dissimulent un fanatisme noir, cheveux gris rasés court, longue toge grise richement ornée, une rose rouge entre ses doigts, allées de rosiers sous une serre.
> 2. Acolyte de Rutgarr : fidèle des Brasiers des Ténèbres, jeune homme maigre aux joues creuses, capuche de robe grise rabattue, poignard tenu contre la poitrine, regard d'adoration aveugle, mezzanine encombrée de foin éclairée de chandelles.
> 3. Maître-assassin halakhi : tueur d'élite d'une trentaine d'années au crâne rasé luisant, barbe noire taillée en pointe, cicatrice fendant la lèvre, armure de cuir noir ajustée, paire de kriss à lame ondulée croisés devant lui, regard fanatique, dague fichée dans une poutre derrière lui.
> 4. Assim : vieux jardinier halakhi au visage parcheminé, barbe blanche clairsemée, chapeau de paille effrangé, serpette à la main, bouche tremblante d'une voix chevrotante, jardin de villa à Halakh.
> 5. Shan, gardienne du Phare : la plus ancienne des gardiennes, femme âgée d'origine beshaarie au visage brûlé de soleil, cheveux gris nattés, yeux d'un bleu terne et voilé, robe sombre du culte de Nemmereth, clef de bronze pendue au cou, urne de cuivre gravée de runes, tour conique de torchis ocre parmi des rochers rouges.
> 6. Lana : fillette beshaarie d'environ huit ans, robe écrue crasseuse, cheveux ébouriffés, yeux voilés, tête tournée de côté comme si elle tendait l'oreille, petits bras tendus à tâtons, piste caillouteuse du désert.

### P5 — Les trois coffres : Malakut et le plateau de Lhend ; La tour d'Ajhaskar : les Xaliir

> 1. Ram Verda : homme bedonnant d'une cinquantaine d'années, teint rougeaud, double menton, sourire carnassier sous des manières mielleuses de marchand prospère, habits riches et voyants, bagues à tous les doigts, poignard précieux à la main, haies sombres d'un labyrinthe d'épines la nuit.
> 2. Homme de main de Ram Verda : truand de la guilde des Poignards Sanglants, brun de peau, sec et nerveux, visage en lame de couteau, mine de gibier de potence, pourpoint de cuir, armé jusqu'aux dents, coutelas au poing, statue d'un jardin nocturne.
> 3. Homme de main de Ram Verda (arbalète) : tueur trapu au visage marqué de la vérole, bandeau noué sur le front, pourpoint de cuir, embusqué derrière une haie d'épines, arbalète épaulée vers le spectateur, un œil plissé.
> 4. Faldir : jeune adolescent pieds nus et crasseux, tignasse noire emmêlée, regard fier de mille coups pendables, sourire pompeux et malin, tunique trouée, ruelle de Malakut au crépuscule.
> 5. Grooth du plateau de Lhend : homme primitif efflanqué par la faim, front bas, arcades lourdes, poils drus, peaux de bête, gourdin noueux, regard affamé, poussière rougeâtre soulevée par le vent sur un plateau désolé.
> 6. Guerrier xaliir : guerrière xaliir d'une trentaine d'années à la peau et aux cheveux bruns, cheveux tressés de perles d'os, tunique de cuir, bijoux de bois et d'ivoire, scarification sur l'épaule gauche, épieu de bois durci au feu, jungle sombre.

### P6 — Un ennui mortel : la forteresse de Shelang

> 1. Laï Maï : jeune épouse xi lu d'une beauté froide, teint bistre, yeux bridés, longs cheveux de jais sous une haute coiffe de cérémonie ornée, riches soieries, expression aimable et distante où perce la folie, laboratoire obscur et cornues à la lueur d'une lampe.
> 2. Sharthal : jeune guerrier ghataï fort comme un bubalus, peau cuivrée, yeux en amande, large visage carré à l'air borné, casque à cimier, épaulières lamellaires ornées, épée au côté, couloir de pierre grise du donjon sous la torche.
> 3. Qi Xian le Fétide : cadavre momifié emmuré, crâne desséché aux orbites creuses, peau noircie, front percé d'un trou, longs cheveux blancs pendants, mâchoire ouverte sur un murmure dément, vu par un trou irrégulier dans un mur de pierre, lueur d'une lampe sur le bord du trou.
> 4. Muntal le Sourd (zombie) : vieux seigneur ghataï de plus de soixante-dix ans, peau cuivrée devenue blafarde, traces bleutées de strangulation autour du cou, petit trou percé au milieu du front, épaules nues et décharnées, frénésie meurtrière dans le regard, cimeterre levé, chambre de pierre grise ; palette livide, sans torche (exception à la lumière chaude).
> 5. Kamaï le bourreau (zombie) : colosse à la cagoule pourpre qui ne laisse voir que les yeux et la bouche, percée d'un trou au front, torse massif et blafard, grande hache posée sur l'épaule, gestes mécaniques, cour de pierre grise ; palette livide, sans torche (exception à la lumière chaude).
> 6. Soldat zombie (en armes) : soldat ghataï de la garnison, teint blafard, cheveux roux dépassant d'un casque à rabats de fourrure, armure lamellaire, regard vide de cadavre et rictus de haine, petit trou percé au front, épée au poing, chemin de ronde dans le brouillard gelé ; palette livide, sans torche (exception à la lumière chaude).

### P7 — Un ennui mortel : les notables morts ; Mariage amer : les mariés

> 1. Arlouk l'intendante (zombie) : petite femme raide d'âge mûr, peau cireuse, chignon serré sous une petite toque, gilet sombre boutonné, petit trou au front, regard vide, solide battoir à linge à la main et chausses sales dans l'autre, buanderie de pierre ; palette livide, sans torche (exception à la lumière chaude).
> 2. Lo Han le prêtre (zombie) : vieux prêtre au visage rond et affaissé, longue moustache tombante, calotte brodée, robe croisée, trou sanglant au milieu du front, couteau sacrificiel levé, chapelle de pierre ; palette livide, sans torche (exception à la lumière chaude).
> 3. Koubrog de Stalheim (zombie) : maître-brasseur valgardien, énorme barbe hirsute, bedaine dilatée de façon impossible, écume noirâtre de bière qui s'écoule de sa bouche et du petit trou de son front, yeux éteints, maillet de tonnelier, cave à tonneaux ; palette livide, sans torche (exception à la lumière chaude).
> 4. Tourmar Latia : jeune homme fier et ambitieux, fils d'éleveurs enrichis, large mâchoire, cheveux bruns frisés coupés court, sourcils épais, moustache, dents serrées d'indignation, riche tunique de marié un peu trop voyante, villa de Satarla aux lampes de fête.
> 5. Eormo : pilote des airs d'une vingtaine d'années, teint olivâtre, traits anguleux, beauté virile et martiale, longs cheveux noirs ceints d'un bandeau, corps tatoué de serpents entrelacés, yeux sombres teintés de violet par la férocine, rictus de rage, épée longue, palissade de bambous à la torche.
> 6. S'pirr, la slorth : corps de python blême aux reflets iridescents long de près de quatre mètres, visage de femme chauve aux traits lisses, grands yeux verts, deux canines en crochets, expression de supériorité divine, anneaux enroulés autour d'une stèle ; petite pyramide de pierre noire, fumées d'encens (violet sombre).

### P8 — Le plus vieux rêve de Lôm : le Peuple des Cimes ; Les trois coffres ; La tour d'Ajhaskar

> 1. Joanna Lôm : montagnarde trapue, nattes rousses, peau opaline tachée de son, regard obstiné et un peu exalté, vêtue de cuir et de peaux, col de fourrure, fronde à la ceinture, montagnes de l'Axos au crépuscule et lueur d'un feu de camp.
> 2. Jaoor, chaman du Peuple des Cimes : homme-oiseau élancé au long visage arrogant, nez en bec d'aigle, grandes ailes de plumes sombres repliées, coiffe de plumes, talismans de plumes, d'os et de perles sur la poitrine, collier de crocs, bâton-sceptre, crâne posé dans l'ombre derrière lui, grotte de corniche à la torche.
> 3. Homme-oiseau du Peuple des Cimes : jeune chasseuse élancée, cheveux courts ébouriffés par le vent, long nez fin, grandes ailes de plumes sombres déployées, sans armure, simple pagne et tunique de cuir, regard sauvage et craintif, fléchettes à la main, falaises de l'Axos sous un ciel d'orage.
> 4. Éclaireur du Peuple des Cimes : homme-oiseau élancé et nerveux, visage long à la mâchoire étroite, plumes sombres sur les bras, grandes ailes, brassards et harnais de cuir, javeline prête à être lancée, corniche et vide derrière lui à la lueur d'un brasero.
> 5. Parsi : vieil astronome adepte de Nemmereth, visage défiguré par une atroce balafre, barbe grise, capuchon pointu, regard hanté, longue béquille à la main, bergerie encombrée de livres et d'une lunette, lueur d'une lampe à huile.
> 6. Robos : disciple de sorcier d'une vingtaine d'années, blond aux yeux bleus, teint frais, cheveux ondulés au vent, visage de bon garçon et lent à comprendre, robe de toile écrue tachée d'encre, lance primitive à la main, jungle nocturne et lueur d'une torche.

### P9 — La tour d'Ajhaskar (trois cases)

Remplacer la fin des consignes par : « Les trois personnages, dans l'ordre (ne remplir que les trois cases de la ligne
du haut, le reste en fond noir uni) : ».

> 1. Ajhaskar : sorcier de plus de soixante-dix ans d'une taille de près de deux mètres, peau brune, épaisse chevelure noire sans un fil d'argent, yeux verts aux pupilles verticales de fauve, visage long et impitoyable, robe de brocart rouge sombre, bagues et colliers de talismans, cabinet de tour encombré à la lueur d'une lampe.
> 2. Nyssa : chasseresse xaliir belle et athlétique, cheveux bruns en longue natte, yeux noirs, visage farouche, brassière et pagne de cuir, couteau de silex à la ceinture, jungle de la Vallée de la Lune et lueur d'une torche.
> 3. Époux momifié de Labashaah : ancien homme vidé de son énergie vitale, sec comme une momie du désert, torse décharné aux côtes saillantes, crâne chauve à longues mèches rares, yeux blancs écarquillés, accroupi dans une niche de grotte, lueur rouge lointaine.
> 4. à 6. : laisser vides (fond noir uni).

## Découpe

Si les cases sont bien alignées (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-p1.png -crop 512x512 +repage -resize 256x256 case-%d.png
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas) ; renommer d'après le tableau des planches :
# P1 → cl1-mariage-amer--khalaman.png, cl1-mariage-amer--jil.png, cl1-mariage-amer--garde-villa.png,
#      cl1-mariage-amer--kalzo.png, cl1-mariage-amer--venik.png, cl1-mariage-amer--toll.png ;
# P2 → cases 0 à 2 en cl1-mariage-amer--…, cases 3 à 5 en cl1-un-ennui-mortel--… ; etc.
```

Si ChatGPT ne respecte pas la grille (cases décalées, portraits verticaux), recadrer à la main chaque case en carré
autour du visage, comme pour la planche C des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`).

## Avancement

| Planches | État |
| --- | --- |
| P1 à P5 | à faire |
| P6 à P9 | à faire (remplacent les illustrations du livre) |
