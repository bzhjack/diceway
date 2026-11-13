# Prompts — portraits des créatures et des démons des scénarios

Prompts pour générer (via ChatGPT) les portraits des créatures et des démons **hors du livre de base** : les fiches
créées par l'import de la Perle du Beshaar, des Chroniques lémuriennes 1 et du Dieu voilé, soit **24 créatures et
12 démons**. Même style que le catalogue (`doc/bol/image-prompts/creatures-demons.md`), quel que soit le scénario. Les
PNJ, dont la palette change d'un scénario à l'autre, sont dans le `portraits.md` de chacun
(`doc/bol/scenarios/<dossier>/portraits.md`).

Les descriptions viennent des livres, reprises dans le commentaire de chaque fiche. 14 créatures et 7 démons portent
aujourd'hui l'illustration en noir et blanc du livre : le nouveau portrait la remplace, pour rester dans le style du
catalogue. Les planches sont regroupées par éclairage, plutôt que par scénario, pour qu'une même image reste cohérente.

## Où vont les portraits

Ces fiches appartiennent à un compte : leur portrait n'est pas un fichier de `front/src/assets/bol/` (réservé au
catalogue), mais le champ `avatar` de la fiche (carré de 256×256 en PNG).

- Nommer chaque portrait découpé comme dans le tableau des planches : `<saga>--<clé>.png`. La saga et la clé sont
  stables d'un compte à l'autre, alors que l'id change.
- Pour les poser, `bol:import-portraits` retrouve chaque fiche par sa clé d'import. Il faut `--force`, sinon une fiche
  garde le portrait qu'elle a déjà :

  ```bash
  docker cp portraits/ diceway:/tmp/portraits
  docker exec diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --force --dry-run
  docker exec -u www-data diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --force
  ```

Les illustrations du livre ne sont pas dans le dépôt (supplément du commerce, usage personnel). Une fois remplacée, la
sienne reste dans le dossier des portraits jusqu'au prochain `bol:prune-portraits`, qui la supprime. Pour les garder,
copier ce dossier avant :
`docker cp diceway:/var/www/html/storage/app/public/portraits ./portraits-livre`.

## Planches

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. Ordre des cases :
ligne du haut de gauche à droite, puis ligne du bas de gauche à droite. Découpe : voir « Découpe » dans
`doc/bol/image-prompts/creatures-demons.md`, en sortant du 256×256 en PNG.

| Planche | Consignes | Fichiers (cases 1 à 6, sans `.png`) |
| --- | --- | --- |
| ✅ CS1 | plein jour | `cl1-mariage-amer--jeune-elasmotherium`, `dieu-voile--ch5-macaque-hurleur`, `dieu-voile--ch5-blob-attrapeur`, `cl1-les-trois-coffres--gardien-rouge`, `dieu-voile--intro-bubalus-zombie`, `perle-du-beshaar--crabe` |
| ✅ CS2 | pénombre | `perle-du-beshaar--fille-djidaa`, `perle-du-beshaar--djidaa`, `dieu-voile--ch2-momie-royale`, `dieu-voile--ch2-momie-enfant`, `perle-du-beshaar--slorth-automate`, `perle-du-beshaar--ver-des-sables` |
| ✅ CS3 | pénombre | `cl1-un-ennui-mortel--arctodus-empaille`, `cl1-un-ennui-mortel--nuee-vermine`, `cl1-la-tour-d-ajhaskar--andrak-obsidienne`, `cl1-la-tour-d-ajhaskar--xolth-juvenile`, `cl1-mariage-amer--serpent-sacre`, `dieu-voile--ch5-ver-a-soie` |
| ✅ CS4 | pénombre | `perle-du-beshaar--tentacule`, `perle-du-beshaar--hippocampe`, `perle-du-beshaar--golem`, `cl1-les-trois-coffres--gardienne-bleue`, `dieu-voile--ch5-parturiente-maudite`, `dieu-voile--ch5-rejeton-parturiente` |
| ✅ DS1 | démons | `cl1-la-tour-d-ajhaskar--krulak`, `cl1-la-tour-d-ajhaskar--avatar-krulak`, `cl1-la-tour-d-ajhaskar--labashaah`, `cl1-la-tour-d-ajhaskar--aine`, `cl1-la-tour-d-ajhaskar--rejeton`, `perle-du-beshaar--idole` |
| ✅ DS2 | démons | `perle-du-beshaar--ilirk`, `perle-du-beshaar--ghashtalarann`, `perle-du-beshaar--limier`, `perle-du-beshaar--piqueur`, `dieu-voile--ch3-demon-fuligineux`, `dieu-voile--ch3-forgeur-de-zaggath` |

## Consignes de planche — créatures, plein jour

À coller en tête de la planche CS1, suivie de la liste de ses six créatures :

> Planche de portraits illustrés de créatures : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre une seule créature, la tête et le haut du corps en gros plan (ou la bête entière quand elle est petite), la tête au centre de sa case, loin des bords et des coins (le portrait sera recadré en médaillon rond), contre-plongée dramatique pour les grandes bêtes : la créature domine le cadre et fixe le spectateur. Scène diurne, sans lune, lumière dorée d'un soleil bas. Dominante chromatique ambre / ocre, avec en fond un décor flou de son lieu dans les mêmes tons chauds. Aucun être humain vivant, aucun texte, légende, numéro, logo ni watermark.
>
> Les six créatures, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

## Consignes de planche — créatures, pénombre

À coller en tête des planches CS2, CS3 et CS4, suivie de la liste de leurs six créatures :

> Planche de portraits illustrés de créatures : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre une seule créature, la tête et le haut du corps en gros plan (ou la bête entière quand elle est petite), la tête au centre de sa case, loin des bords et des coins (le portrait sera recadré en médaillon rond), contre-plongée dramatique pour les grandes bêtes : la créature domine le cadre et fixe le spectateur. Scènes de pénombre : décor flou à peine deviné, une seule source de lumière par portrait, précisée dans la phrase de chaque créature avec sa dominante. Aucun être humain vivant, aucun texte, légende, numéro, logo ni watermark.
>
> Les six créatures, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

## Planches de créatures

### ✅ CS1 — plein jour

> 1. ✅ Jeune elasmotherium : jeune rhinocéros massif, encore petit pour son espèce, corne unique encore courte, peau poussiéreuse, yeux affolés, beuglant de peur et prêt à charger, herbes hautes des plaines de Klaar.
> 2. ✅ Macaque hurleur : petit singe au pelage beige rongé de gale, yeux jaunes et luisants, longues canines découvertes dans un hurlement, bondissant d'une branche de la jungle.
> 3. ✅ Blob attrapeur : énorme moisissure jaune et verruqueuse qui enveloppe le tronc et les branches d'un grand banian, lianes cinglantes, crânes humains traversés de racines suspendus aux branches, jungle humide.
> 4. ✅ Gardien du Puits : statue animée de près de trois mètres en pierre rouge sombre, guerrier barbu et enturbanné au visage majestueux, long trident à la main, regard de défi ; fond d'un puits de pierre éclairé par le soleil, grande porte de bronze derrière lui, ossements épars dans la poussière.
> 5. ✅ Bubalus zombie : bovidé massif ressemblant à un bison, robe beige, cornes couronnées de fleurs, flancs peints de symboles mystiques, gorge tranchée rouge et béante, yeux vides, tête baissée, prêt à charger ; vaste cour intérieure d'un temple, autel sacrificiel et mince colonnette de pierre à l'arrière-plan, fin d'après-midi.
> 6. ✅ Crabe de sable : crabe géant fait de sable compact, pinces levées, grains qui ruissellent de sa carapace, grosse perle opalescente de la taille d'une pastèque logée dans une cavité de son dos ; sanctuaire taillé dans la roche aux fresques bleues effacées, seule lumière le soleil bas entrant par la porte et dorant la poussière.

### ✅ CS2 — caveaux et tombeaux à la torche

> 1. ✅ Fille de Djidaâ : cadavre de princesse beshaarie momifié « naturellement », peau parcheminée tendue sur les os, soieries élimées et souillées, lourds bijoux d'or beshaaris, haine des vivants au fond des orbites, s'extirpant d'un sarcophage de pierre au fond d'une grotte funéraire ; ténèbres, lueur de torches venue d'en haut, dominante ambre sombre.
> 2. ✅ Grand-mère Djidaâ : morte-vivante au corps squelettique de la teinte grise de la pierre, peau collée aux os, hardes déchirées et fanées, boucles d'oreille et bracelets d'or, yeux enfoncés luisant d'un éclat rouge et malsain, gloussement sur ses lèvres desséchées, assise sur un sarcophage ; renfoncement de caverne encombré de sarcophages ouverts et d'ossements blanchis, lueur de torche, dominante ambre sombre.
> 3. ✅ Momie royale : momie aux membres minces et desséchés, corps dur comme du vieux bois, bandelettes de lin aux traces de teinture pourpre et de peintures ornementales, bracelets d'or et d'argent, bijoux et talismans glissés entre les bandelettes, cercle d'or rehaussé de pierreries au front, yeux blancs écarquillés, bouche béante ; galerie de nécropole, lueur de torche, dominante ambre sombre.
> 4. ✅ Momie d'enfant : toute petite momie couverte de bandelettes et parée de bijoux, longues mèches sèches, yeux blancs écarquillés, bouche grande ouverte sur un cri, se jetant vers le spectateur ; même galerie de nécropole, lueur de torche, dominante ambre sombre.
> 5. ✅ Slorth automate : python mécanique de bronze de trois mètres, fin et élancé, anneaux cliquetants enroulés autour du tronc d'un arbre de bronze aux fruits luisants, visage en masque d'or blanc aux traits purs et nobles, deux yeux d'émeraude scintillants, nuage de poussière ; jardin minéral de sable et de roche dans un tombeau, lueur de torche sur le métal, dominante bronze et ambre sombre.
> 6. ✅ Ver des sables juvénile : scolopendre gigantesque à la carapace annelée couleur de sable, dizaines de paires de pattes, presque aveugle, jaillissant d'une coulée de sable, énorme gueule ouverte sur deux langues gluantes, mandibules et pinces ; salle de tombeau en partie effondrée aux fresques effacées, lueur de torche, dominante ocre sombre.

### ✅ CS3 — demeures et antres

> 1. ✅ Arctodus empaillé zombie : ours géant à face courte naturalisé, juvénile de deux mètres cinquante dressé sur ses pattes arrière, fourrure râpée rembourrée de paille qui s'échappe des coutures, armature de métal entrevue, petit trou à peine visible au front, tête empaillée penchée vers le spectateur et gueule béante ; palier d'un donjon de pierre, tapisseries fanées, lueur de torche, dominante brun fauve.
> 2. ✅ Nuée de vermine : gros rat noir au premier plan, au centre de la case, dents découvertes et yeux blancs, entraînant une déferlante grouillante de rats, de souris, de cafards et d'insectes qui jaillissent d'un trou dans un mur de pierre ; laboratoire obscur, lueur d'une seule chandelle, dominante brun sale.
> 3. ✅ Andrak d'obsidienne : lion de pierre noire vitreuse à l'épaisse crinière sculptée, animé par magie, crocs découverts, s'avançant dans un silence terrifiant ; salle d'audience au sol de marbre taché de sang, tenture pourpre, lumière froide d'un luminaire de fer forgé aux petits globes luminescents, dominante noire et violette.
> 4. ✅ Xolth juvénile : limace hideuse et aveugle de la taille d'un homme, masse gélatineuse luisante qui rampe hors d'une fosse peu profonde, gueule béante, ossements et crâne humain à demi englués ; cave creusée dans le roc, lueur d'une torche lointaine que la bête semble fuir, dominante verdâtre et brune.
> 5. ✅ Serpent sacré : serpent femelle géant aux écailles noires comme l'onyx, tête massive dressée hors d'une fosse, langue fourchue, petits serpents grouillant sur ses anneaux, offrandes pourrissantes et fumées d'encens dans une petite pyramide de pierre noire ; pénombre enfumée, lueur de braises, dominante violet sombre.
> 6. ✅ Ver à soie corrompu : immonde chenille blême de six mètres à demi dressée, segments boursouflés marqués chacun d'un point jaune, courtes pattes membraneuses, tête grisâtre à six ocelles au-dessus de mandibules tranchantes, gros fils de soie jaunâtres pendant du plafond ; grotte dans une pénombre diffuse où scintillent les fils, palette froide blême et jaune.

### ✅ CS4 — lueurs froides

> 1. ✅ Tentacule de la mosaïque : long tentacule de pieuvre aux ventouses luisantes, chair aux nuances de bleu et de vert piquée de tesselles d'or, jaillissant d'un sol de mosaïque sous-marine (algues, poissons, coquillages) couvert d'eau jusqu'à la cheville et fouettant l'air ; vieux sanctuaire de bois aux murs nus, pénombre bleu-vert, seule lumière la lueur orangée de deux bougies.
> 2. ✅ Hippocampe géant : hippocampe d'un mètre de long dressé hors de l'eau sur sa queue arrondie, corps luisant et souple aux nuances de bleu et de vert, petite bouche tubulaire, œil fixe ; même sol de mosaïque marine couvert d'eau, pied d'un autel de pierre brute couvert d'algues et de concrétions, pénombre bleu-vert, seule lumière la lueur orangée de deux bougies.
> 3. ✅ Golem de Tolometh : squelette humain entièrement recouvert de berniques, de coques et de coraux, à la forme vaguement humaine, orbites vides, s'avançant à grands pas dandinants ; salle caverneuse de nacre humide et ruisselante, éclairée de quelques torches, palette froide nacre et bleu.
> 4. ✅ Gardienne du Puits : statue animée de près de trois mètres en pierre légèrement bleutée, visage de femme d'une grande finesse à la détermination sereine, croissant de lune au front retenant sa longue chevelure, large collier de pierre sculpté sur la poitrine, pagne, deux cimeterres levés dans un élégant pas de danse ; fond d'un puits de pierre en pleine nuit, porte de bronze derrière elle, clair de lune, palette froide bleu nuit.
> 5. ✅ Parturiente maudite : statue d'Afyra enceinte couchée sur son piédestal, devenue chair : visage de tentacules autour d'un œil unique, corps de pierre marbré de veines jaunâtres, sang jaune fluorescent ; fond de temple en ruine plongé dans la pénombre, seule lueur le jaune fluorescent.
> 6. ✅ Rejeton de la parturiente : petit être vaguement humanoïde de moins d'un mètre, corps suintant et grumeleux, visage mou et lisse sans yeux ni bouche, mucus jaunâtre ; sol du même temple en ruine, même pénombre, seule lueur le jaune fluorescent du mucus.

## Consignes de planche — démons

À coller en tête des planches DS1 et DS2, suivie de la liste de leurs six démons :

> Planche de portraits illustrés de démons : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, mais tonalité plus sombre et surnaturelle. Chaque portrait montre une seule entité démoniaque, le haut du corps en gros plan, à la silhouette inquiétante, la tête au centre de sa case, loin des bords et des coins (le portrait sera recadré en médaillon rond), contre-plongée, composition menaçante. Sauf indication contraire dans sa phrase, fond d'autel en ruine ou de ciel nocturne orageux avec des symboles gravés incandescents, fumée et énergie qui s'échappent du sol, lueur infernale à l'horizon. Dominante chromatique rose / pourpre profond virant au rouge sang, forte tension lumineuse. Aucun être humain vivant, aucun texte, légende, numéro, logo ni watermark.
>
> Les six démons, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

## Planches de démons

### ✅ DS1 — la tour d'Ajhaskar, l'idole d'Upok-N'Mee

> 1. ✅ Krulak : démon simiesque trapu au pelage ras d'un gris malsain, bras démesurés levés au-dessus de la tête, jambes courtaudes, pattes à trois doigts griffus, quatre yeux rouges sans paupières, quatre petites cornes, gueule grande ouverte sur un hurlement ; intérieur d'une tour de sorcier.
> 2. ✅ Avatar de Krulak : double du même démon simiesque gris, quatre yeux rouges et quatre petites cornes, déjà à demi dissous dans une fumée épaisse et bitumineuse, contours effilochés, griffes tendues hors de la fumée.
> 3. ✅ Labashaah : démon majeur à la longue chevelure agitée, visage hideux de vieille femme aux traits de chauve-souris, grandes ailes membraneuses déployées, peau laiteuse, épaules et poitrine couvertes d'une fourrure noire et rase de chauve-souris, mains griffues tendues, aura d'autorité troublante, en plein vol ; antre rocheux ouvert sur une nuit de lune.
> 4. ✅ Aîné de Labashaah : être primitif, mi-humain, mi-chauve-souris, corps trapu et velu, visage simiesque aux crocs découverts, oreilles pointues, grandes ailes membraneuses repliées autour des épaules ; jungle nocturne.
> 5. ✅ Rejeton de Labashaah : chauve-souris géante aux quelques traits vaguement humains, grandes oreilles, yeux blancs, gueule ouverte sur un cri aigu, ailes déployées ; ciel nocturne au-dessus de la jungle, sous une grande lune.
> 6. ✅ Idole brisée d'Upok-N'Mee : petit être de glaise molle, étrangement organique, tête de batracien aux gros yeux globuleux et à la crête épineuse, longs flagelles cinglants qui ondulent autour de lui, éclats d'une idole brisée à ses pieds ; autel en ruine.

### ✅ DS2 — le palais de Tolometh, Malakut et les marais, Urceb

> 1. ✅ Ilirk : gnome démoniaque pansu à tête de mouche, gros yeux à facettes, ailes translucides, duvet de plumes bleutées, poignard cranté comme une patte d'insecte, à demi fondu dans l'air comme s'il allait disparaître ; salle de nacre (dominante bleutée et pourpre).
> 2. ✅ Ghashtalarann : démon de l'illusion, humanoïde courtaud au corps flasque et gélatineux, visage de masque de cire fondu aux traits indéfinissables, quatre petits yeux placés de travers au-dessus d'une bouche aux lèvres molles, poings durs comme le roc ; cave voûtée qui se démultiplie en dédale illusoire de portes et d'escaliers.
> 3. ✅ Limier de Bazaal Dûl : lévrier démoniaque efflanqué et écorché, chair rougeâtre et suintante, bouquets de petites cornes sur le crâne, yeux brasillant d'une lueur mauvaise, gueule hérissée de deux rangées de crocs, surgissant d'un miroitement de l'air à l'orée des marais.
> 4. ✅ Piqueur de Bazaal Dûl : démon chasseur au corps humanoïde trapu et musculeux, cuir squameux aux teintes automnales parsemé de touffes de fourrure épaisse, visage aux traits canins, crâne protubérant couronné de deux cornes torsadées rouge sombre, mains griffues serrant un lourd épieu de chasse de bois noir et huileux, nuage de fumée nauséabonde.
> 5. ✅ Démon fuligineux : nuage bouillonnant de suie opaque, à peine une forme, d'où percent des volutes en forme de bras et une gueule devinée, qui jaillit d'une faille au fond d'une cave et étouffe toute lumière ; seule la flamme d'une bougie enchantée résiste dans un coin.
> 6. ✅ Forgeur de Zaggath : démon majeur au corps râblé de minerai en fusion, trois fois la taille d'un homme, visage odieusement humain à la bouche immense hérissée de crocs diamantins, petits yeux d'obsidienne, crinière de flammes, chaleur qui déforme l'air ; dominante rouge et orange de forge plutôt que le pourpre.

## Si ChatGPT refuse ou décale

Si une case est refusée ou ne ressemble pas à sa phrase, générer le portrait seul avec la même phrase, en remplaçant
« Planche » par « Portrait carré unique » dans les consignes. La Gardienne du Puits et Labashaah sont torse nu dans les
livres : les phrases les couvrent d'un collier de pierre et de fourrure pour passer le filtre de ChatGPT.

## Avancement

| Planches | État |
| --- | --- |
| ✅ CS1 | fait le 2026-11-06 : grille exacte, 3 px rognés par bord, découpe régulière, posée sur les fiches avec `--force` |
| ✅ CS2 | fait le 2026-11-08 : colonnes coupées à 511 et 1024, ligne à 512 ; découpe sur les coupures mesurées, 3 px rognés par bord, aucun recadrage ; posée sur les fiches avec `--force` |
| ✅ CS3 | fait le 2026-11-08 : grille exacte (512, 1024 ; ligne à 512), 3 px rognés par bord, aucun recadrage ; posée sur les fiches avec `--force` |
| ✅ CS4 | fait le 2026-11-13 : colonnes coupées à 511 et 1024, ligne à 512 ; découpe sur les coupures mesurées, 3 px rognés par bord, aucun recadrage ; posée sur les fiches avec `--force` |
| ✅ DS1 | fait le 2026-11-13 : colonnes coupées à 511 et 1024, ligne à 512 ; découpe sur les coupures mesurées, 3 px rognés par bord, aucun recadrage ; posée sur les fiches avec `--force` |
| ✅ DS2 | fait le 2026-11-13 : colonnes coupées à 511 et 1024, ligne à 512 ; découpe sur les coupures mesurées, 3 px rognés par bord, aucun recadrage ; posée sur les fiches avec `--force` |
