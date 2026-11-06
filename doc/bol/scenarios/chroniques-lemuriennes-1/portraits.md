# Prompts — portraits des Chroniques lémuriennes 1

Prompts pour générer (via ChatGPT) les portraits des fiches créées par l'import des cinq aventures du recueil
(`app/*.json`) qui n'en ont pas encore : **30 PNJ et 2 créatures** (état au 2026-11-02).

Les PNJ suivent le style des PNJ du catalogue (`doc/image-prompts/pnj.md`) : illustration peinte et encrée façon BD
fantasy des années 80. La dominante est propre au recueil, qui mène du Khanat aux jungles de Qush : bleu acier /
gris froid contrasté par la lumière chaude d'une torche. Les créatures suivent le style du bestiaire du catalogue
(`doc/image-prompts/creatures-demons.md`). Les descriptions viennent du livre, reprises dans le commentaire de chaque
fiche ; quand le livre ne décrit pas un personnage, la phrase s'en tient à ce qu'il dit de son rôle et de son peuple.

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

Les planches C du catalogue sont dans `doc/image-prompts/creatures-demons.md`.

## Consignes de planche — PNJ

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. À coller en
tête de chaque planche P, suivie de la liste de ses six personnages :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante bleu acier / gris froid, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase du personnage avec le préambule « Portrait illustré carré (1:1) »
de `doc/image-prompts/pnj.md`, en remplaçant sa dominante vert émeraude sombre / teal par le bleu acier / gris froid.

## Consignes de planche — créatures

À coller en tête de la planche B1 (préambule de `doc/image-prompts/creatures-demons.md`), suivie de la liste de ses
créatures :

> Planche de portraits illustrés de créatures : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre une seule créature, la tête et le haut du corps en gros plan (ou la bête entière quand elle est petite), centrée dans sa case, entière dans le cadre, contre-plongée dramatique pour les grandes bêtes : la créature domine le cadre et fixe le spectateur. Scène diurne, sans lune, lumière dorée d'un soleil bas. Dominante chromatique ambre / ocre, ciel embrasé façon tempête de sable, avec en fond un décor flou de son habitat (jungle, désert, marais, montagne, mer…) dans les mêmes tons chauds. Aucun personnage humain, aucun texte, légende, numéro, logo ni watermark.
>
> Les six créatures, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

B1 n'a que deux créatures : remplacer la fin par « Les deux créatures, dans l'ordre (ne remplir que les deux
premières cases de la ligne du haut, le reste en fond noir uni) : ». Générer plutôt deux portraits uniques revient au
même prix (même préambule, en remplaçant « planche » par « portrait carré unique »).

## Planches

| Planche | Saga | Clés (cases 1 à 6) |
| --- | --- | --- |
| P1 | `cl1-mariage-amer` | `khalaman`, `jil`, `garde-villa`, `kalzo`, `venik`, `toll` |
| P2 | `cl1-mariage-amer` (cases 1 à 3), `cl1-un-ennui-mortel` (cases 4 à 6) | `guerrier`, `pretre`, `villageois`, `soldat-zombie`, `villageois-zombie`, `domestique-zombie` |
| P3 | `cl1-la-tour-d-ajhaskar` | `dramik`, `ilda`, `kurik`, `otos`, `ilkhta`, `rirtu` |
| P4 | `cl1-les-trois-coffres` | `rutgarr`, `acolyte`, `assassin`, `assim`, `shan`, `lana` |
| P5 | `cl1-les-trois-coffres` (cases 1 à 5), `cl1-la-tour-d-ajhaskar` (case 6) | `ram-verda`, `homme-de-main`, `arbaletrier`, `faldir`, `grooth`, `guerrier-xaliir` |
| B1 | `cl1-mariage-amer` | `serpent-sacre`, `jeune-elasmotherium` (2 cases, les 4 autres en fond noir uni) |

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

### B1 — Mariage amer : créatures (deux cases)

> 1. Serpent sacré : serpent femelle géant aux écailles noires comme l'onyx, tête massive dressée hors d'une fosse, langue fourchue, petits serpents grouillant sur ses anneaux, offrandes pourrissantes et fumées d'encens dans une petite pyramide de pierre noire ; pénombre enfumée (exception à la scène diurne).
> 2. Jeune elasmotherium : jeune rhinocéros massif, encore petit pour son espèce, corne unique encore courte, peau poussiéreuse, yeux affolés, beuglant de peur et prêt à charger, herbes hautes des plaines de Klaar.

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
autour du visage, comme pour la planche C des PNJ du catalogue (`doc/image-prompts/pnj.md`).

## Avancement

| Planches | État |
| --- | --- |
| P1 à P5 | à faire |
| B1 | à faire |
