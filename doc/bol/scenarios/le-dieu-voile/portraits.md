# Prompts — portraits du Dieu voilé

Prompts pour générer (via ChatGPT) les portraits des PNJ créés par l'import de la saga (`app/intro.json` à
`app/ch5.json`) : **89 PNJ**. Les créatures et les démons de la saga, qui suivent le style du catalogue, sont dans
`doc/bol/image-prompts/creatures-demons-scenarios.md`.

Les PNJ suivent le style des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`) : illustration peinte et encrée façon BD
fantasy des années 80, dominante vert émeraude sombre / teal contrastée par la lumière chaude d'une torche. Les
descriptions viennent du livre, reprises dans le commentaire de chaque fiche.

## Où vont les portraits

Ces fiches appartiennent à un compte : leur portrait n'est pas un fichier `assets/bol/pnj/<id>.jpg` (réservé au
catalogue), mais le champ `avatar` de la fiche (choisi depuis le formulaire de la fiche, carré de 256×256 en PNG).

- Nommer chaque portrait découpé d'après la **clé d'import** de sa fiche : `<clé>.png` (ex. `lok-kozaar.png`,
  `ch3-oda-unjab.png`). La clé est stable d'un compte à l'autre, alors que l'id change.
- Pour les poser : un par un depuis le formulaire de la fiche (avatar), ou d'un coup avec `bol:import-portraits`, qui
  retrouve chaque fiche par sa clé d'import. Une fiche qui a déjà un portrait le garde (sauf `--force`), une clé qui
  renvoie au catalogue n'est pas touchée :

  ```bash
  docker cp portraits/ diceway:/tmp/portraits
  docker exec diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --saga=dieu-voile --dry-run
  docker exec -u www-data diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --saga=dieu-voile
  ```

## Illustrées par le livre

Les 29 PNJ des planches P11 à P15 portent aujourd'hui l'illustration en noir et blanc du livre, recadrée et posée en
avatar sur le compte de Lionel le 2026-10-23 : pour la remplacer, ajouter `--force`.

Les illustrations du livre ne sont pas dans le dépôt (supplément du commerce, usage personnel), et
`bol:prune-portraits` supprime celles qui ne sont plus sur une fiche. Pour les garder, copier le dossier avant :
`docker cp diceway:/var/www/html/storage/app/public/portraits ./portraits-livre`.

## Fiches du catalogue

Cinq clés du JSON d'import renvoient au catalogue (`"catalogue"`) : l'import ne crée pas de fiche, la scène
utilise directement celle du catalogue, qui affiche déjà son image (`front/src/assets/bol/`). Rien à générer ni à
poser ; l'image suit quand la planche du catalogue est refaite.

| Clé | Fiche du catalogue | Image |
| --- | --- | --- |
| `ch2-soldat` | Sergent du guet | `front/src/assets/bol/pnj/11.jpg` |
| `ch4-sergent-du-guet` | Sergent du guet | `front/src/assets/bol/pnj/11.jpg` |
| `ch4-marin-des-airs` | Pilote de nef volante de Satarla | `front/src/assets/bol/pnj/10.jpg` |
| `ch5-azhdarkho` | Azhdarkho | `front/src/assets/bol/bestiary/3.jpg` |
| `ch5-fangeux` | Fangeux | `front/src/assets/bol/bestiary/18.jpg` |

## Consignes de planche — PNJ

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. À coller en
tête de chaque planche P, suivie de la liste de ses six personnages :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante vert émeraude sombre / teal, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase du personnage avec le préambule « Portrait illustré carré (1:1) »
de `doc/bol/image-prompts/pnj.md`.

## Planches

| Planche | Clés (cases 1 à 6) |
| --- | --- |
| P1 | `lok-kozaar`, `qirmar`, `almar-de-chebeg`, `malcar`, `maben`, `soldat-nef-volante` |
| P2 | `embran-tarv`, `megere`, `mishart`, `barbare-de-qush`, `intro-sacrificateur`, `intro-almandus` |
| P3 | `intro-doros`, `ch1-assassin-arbaletrier`, `ch1-soldat-guet`, `ch1-milicien-kalindhit`, `ch1-chemdi`, `ch1-vagabond` |
| P4 | `ch1-druide-gris`, `ch1-oracle`, `ch1-amchak`, `ch1-amaston`, `ch1-madri`, `ch1-jembal` |
| P5 | `ch1-parchak`, `ch1-sebki`, `ch1-rimshak`, `ch1-liu-liong`, `ch2-efradus`, `ch2-jarnius` |
| P6 | `ch2-squelette`, `ch2-sartol`, `ch2-hirk`, `ch2-nobur`, `ch2-bambam`, `ch2-zaira` |
| P7 | `ch2-homme-de-main`, `ch2-cassa`, `ch3-lothar`, `ch3-apprenti-oda`, `ch3-soldat-pretre-rouge`, `ch3-galor` |
| P8 | `ch3-marin-pretre-rouge`, `ch3-amrazh`, `ch3-marek`, `ch3-michka`, `ch3-garde-du-guet`, `ch3-garde-filonier` |
| P9 | `ch3-julak`, `ch3-menni`, `ch4-ilsda`, `ch4-atti`, `ch4-acolyte`, `ch4-chasseur-grooth` |
| P10 | `ch5-druide-fou`, `ch5-chef-grooth`, `ch5-guerrier-grooth`, `ch5-garde-grooth`, `ch5-guerrier-des-jungles`, `ch5-fanatique-du-harem` |
| P11 | `jia`, `nirmus`, `coren`, `kurta`, `jorkus`, `hilario` |
| P12 | `matius`, `intro-amrita`, `ch1-messager`, `ch1-rajka`, `ch1-bekti`, `ch1-daruk` |
| P13 | `ch1-assassin`, `ch1-drajit`, `ch1-rassa`, `ch2-angus`, `ch2-albel`, `ch2-solmus` |
| P14 | `ch2-roumal`, `ch3-oda-unjab`, `ch3-kamatt`, `ch3-samazar`, `ch3-narubio`, `ch4-casmar` |
| P15 | `ch4-toursa`, `ch4-druide-jaune`, `ch4-druide-voile`, `ch4-bon-docteur`, `ch4-graak` (5 cases, la 6ᵉ en fond noir uni) |

### P1 — introduction : Satarla et la nef volante

> 1. Lok Kozaar : mercenaire céruléen massif à la peau bleutée, crâne rasé sauf une longue mèche nattée teinte en rouge, mâchoire brutale, regard d'ambition froide, hache de bataille sur l'épaule, baudrier de cuir, aucune armure.
> 2. Qirmar l'alchimiste : jeune alchimiste malakuti brillant, visage fin et studieux, cheveux noirs noués, robe d'érudit tachée de réactifs, fioles colorées à la ceinture, lueur verte d'un alambic.
> 3. Almar de Chebeg : vieil astrologue rabougri et grisonnant, front large, regard pénétrant, robe brodée d'étoiles, astrolabe de cuivre en main, ciel étoilé par une fenêtre.
> 4. Malcar : capitaine satarlan d'âge mûr, la joue ravagée par trois griffures de momie mal refermées, regard loyal et dur, armure légère et cape d'officier, épée de famille ouvragée.
> 5. Maben, pilote de la nef volante : jeune officier fringant de la noblesse satarlane, moustache fine, sourire enthousiaste, lunettes de pilote relevées sur le front, veste d'aviateur à boutons dorés, coque d'une nef volante dans le ciel.
> 6. Soldat de la nef volante : soldat satarlan aguerri, casque de métal à nasal, armure légère de cuir, lance tenue droite, arbalète dans le dos, cordages et bastingage d'une nef volante.

### P2 — introduction : la cour, la secte et l'armée

> 1. Embran Tarv : oncle et ministre du roi de Satarla, la soixantaine, allure martiale, cheveux gris coupés court, léger embonpoint, pourpoint brodé et lourde chaîne d'or, regard pragmatique.
> 2. Jessinda, dite la Mégère : druidesse jaune de Morgazzon portant un masque de vieille harpie ridée aux cheveux de filasse ; sous le bord du masque, on devine la peau claire et les yeux verts d'une jeune femme ; robe jaune, paille à souffler à la main ; dominante jaune soufre / teal.
> 3. Mishart, druide jaune : vieillard petit et trapu, robe jaune crasseuse cousue de talismans et de colifichets, bâton cérémoniel orné de breloques, sourire torve, brume des marais.
> 4. Barbare de Qush : guerrier d'élite des jungles, peau très sombre, peintures de guerre blanches, coiffe de plumes et d'os, lance et petit bouclier de peau, regard féroce, feuillage de jungle.
> 5. Prêtre sacrificateur de Nemmereth : prêtre en toge blanche, front rasé, un pan de sa toge relevé sur la tête, long couteau rituel tenu contre la poitrine, autel de pierre noire.
> 6. Maître Almandus, médecin : médecin satarlan aisé, la cinquantaine, barbe soignée, toque de praticien, lunettes de cristal, sacoche de cuir, étagères de pots derrière lui.

### P3 — introduction et chapitre 1 : Halakh, les lames

> 1. Doros : homme rondouillard en robes, large sourire avenant, médaillon d'Afyra en forme de feuille de palmier sur la poitrine.
> 2. Assassin de l'Ombre sanglante (arbalète) : tireur accroupi sur un toit de terre, foulard sur le visage, arbalète épaulée vers le spectateur, ciel nocturne et jasmin.
> 3. Soldat du guet d'Halakh : mercenaire beshaari brutal au teint cuivré, barbe drue, casque à pointe enturbanné, armure légère, cimeterre et javelots, sourire corrompu.
> 4. Milicien de la tribu des Kalindhit : jeune homme du quartier, bandeau de tissu rayé sur le front, armure de cuir dépareillée, javelot à la main, posté sur un toit.
> 5. Chemdi, champion de Parchak : colosse lutteur torse nu, lèvre fendue, hématome sur la joue, épaules huilées, poings bandés de cuir, estrade de lutte éclairée de lampes.
> 6. Vagabond soudoyé de la Ville nomade : mendiant décharné aux haillons, barbe sale, bâton noueux, regard sournois, murs de terre de la Ville nomade.

### P4 — chapitre 1 : le Sanctuaire Noir et les témoins

> 1. Druide gris du Sanctuaire Noir : silhouette en longue robe grise à capuche, visage couvert de cendre, mains dissimulées dans les manches, regard vide, pénombre de pierre noire.
> 2. L'oracle de Nemmereth : devin au crâne rasé, robe de brocart gris aux motifs argentés, visage maquillé de noir sur les saillies et de blanc dans les creux, voix atone devinée sur des lèvres entrouvertes, statue sombre derrière lui.
> 3. Amchak l'herboriste : vieil homme au visage plus parcheminé qu'une momie, traits farouches de nomade, sourcils broussailleux, bouquets d'herbes séchées et pots de terre.
> 4. Amaston de Lysor : petit homme d'une soixantaine d'années, teint clair, cheveux blonds cendrés, regard bienveillant, tablier de médecin, mains tachées d'onguent.
> 5. Madri la potière : femme d'âge mûr, sèche et menue, visage sévère buriné par le soleil, main gauche atrophiée à trois doigts tenant un pot signé d'une fleur de jasmin, patio fleuri.
> 6. Jembal le Roseau : homme très petit et trapu, visage rond et glabre, peau pâle, regard dangereux, bagues aux doigts, rideaux rouges d'un bouge.

### P5 — chapitre 1 et chapitre 2 : les témoins, la nécropole

> 1. Parchak : gros homme éméché, joues rougies, bourse pleine dans une main et coupe de vin dans l'autre, rire gras.
> 2. Sebki, prêtre d'Afyra : prêtre doux et soigné, robe vert d'eau, médaillon en feuille de palmier, encens et piliers d'un temple des vingt dieux.
> 3. Rimshak, maître de la Guilde du Lendemain : Halakhi entre deux âges, longue barbiche noire, sourire édenté, fioles de poison serrées entre les doigts, laboratoire encombré.
> 4. Liu Liong, de la Main de Jade : Xi Lu d'une trentaine d'années, visage grêlé de petites cicatrices, sérieux et affable, robe de soie de marchand ornée d'un pendentif de jade.
> 5. Maître Efradus, prieur de la nécropole : petit homme courtaud au front rasé, robes noires de Nemmereth, plume et rouleaux d'archives, mine inquiète.
> 6. Jarnius, jeune prêtre de la nécropole : jeune prêtre timide aux robes noires, lanterne levée, pied-de-biche à la main, mausolées dans la nuit.

### P6 — chapitre 2 : la nécropole et le Cloaque

> 1. Squelette de la nécropole : cadavre squelettique vêtu de lambeaux funéraires, orbites vides, mâchoire pendante, bras décharné tendu vers le spectateur, pluie et éclairs sur les tombes (palette froide, exception au teal chaud).
> 2. Sartol, disciple de Jorkus : garçon roux d'environ treize ans, taches de rousseur, robe de novice noire trop grande, regard intimidé mais franc.
> 3. Maître Hirk, aubergiste du Poisson d'or : grand homme chauve au léger embonpoint, bonhomie souriante, tablier propre, enseigne au poisson doré derrière lui.
> 4. Nobur, chef de bande du Cloaque : homme corpulent en pourpoint noir, lourde chaîne dorée, cheveux bruns coupés au bol, petits yeux chafouins, gourdin posé sur la table.
> 5. Bambam, lieutenant de Nobur : colosse de plus de cent vingt kilos, front défiguré par une vilaine cicatrice, sourire édenté, gourdin clouté sur l'épaule.
> 6. Zaïra : jeune femme rousse en robe rouge sombre, regard de chatte rusée, médaillon de pierre à l'éclat bleuté qu'elle touche du bout des doigts, deux poignards à la ceinture.

### P7 — chapitre 2 et chapitre 3 : l'embuscade, Urceb, la Dent Noire

> 1. Homme de main de Nobur : truand des bas-fonds en cuir usé, nez cassé, dague et gourdin, sourire mauvais, ruelle sale.
> 2. Dame Cassa, prêtresse d'Afyra : prêtresse au visage doux et fatigué, voile vert pâle, mains de soignante, lits d'hospice derrière elle.
> 3. Lothar, intendant du Prêtre Rouge : homme élancé aux cheveux noirs, teint pâle, robe brune aux manches galonnées d'or, yeux plissés qui jaugent.
> 4. Apprenti d'Oda : jeune forgeron torse nu ruisselant de sueur, pantalon rouge, marteau de forge levé, regard vide de transe, enclume gravée de syllabes démoniaques, flammes.
> 5. Soldat du Prêtre Rouge : soldat en pourpoint de cuir bouilli rouge sombre clouté de cuivre, casque soigné, épée et arbalète, discipline froide, pont d'un chebek.
> 6. Galor, capitaine du chebek : officier de marine d'âge mûr, même pourpoint rouge clouté de cuivre, barbe taillée, longue-vue à la ceinture, gaillard d'arrière.

### P8 — chapitre 3 : la Dent Noire et le guet d'Urceb

> 1. Marin du Prêtre Rouge : marin basané, foulard rouge, coutelas, cordages tendus, embruns.
> 2. Amrazh, mage de Narubio : homme maigre et très grand, visage émacié et glabre, longues robes bleu pastel, tatouage bleuté en forme d'œil empli d'arabesques au milieu du front, regard pâle presque laiteux.
> 3. Marek, sergent du guet : sergent d'âge mûr aux tempes grises, vêtements sombres de nuit, arbalète, regard de marin qui connaît les récifs.
> 4. Michka, garde grimpeur : jeune garde au physique sec et nerveux, corde enroulée à l'épaule, mains écorchées, sourire agile, orgues basaltiques.
> 5. Garde du guet d'Urceb : garde en pourpoint de cuir noir, casque simple, gourdin, visage carré et discipliné.
> 6. Garde du Filonier : garde mal rasé qui s'ennuie, armure de cuir, lance appuyée à l'épaule, grille de villa derrière lui.

### P9 — chapitre 3 et chapitre 4 : la villa, la Compagnie des Masques, les falaises

> 1. Julak, intendant du Filonier : gros homme glabre et ventripotent, cheveux blonds coupés au bol, trousseau de clefs à la ceinture, regard de joueur invétéré.
> 2. Menni : garçon roux de onze ans aux yeux noirs comme l'obsidienne, tunique de jeune serviteur, regard grave et courageux, lueur orangée de lave en contrebas.
> 3. Ilsda, cuisinière de Casmar : cuisinière ronde à l'air innocent, fichu sur la tête, joues rouges, bougie à la main, cuisine sombre.
> 4. Atti, servante de Casmar : jeune servante maigre aux yeux vifs et inquiets, tablier, oreille tendue vers une porte.
> 5. Acolyte de la Compagnie des Masques : fidèle en longue robe jaune portant un masque de cuir peint en faciès de singe à la bouche démesurée, poignard à la main.
> 6. Chasseur grooth du clan des falaises : humanoïde grooth bestial, front bas, mâchoire prognathe, poils drus, gourdin, agrippé à une paroi de pierre, regard affamé.

### P10 — chapitre 5 : l'île et Fort Junia

> 1. Le druide fou : vieil homme au visage ridé et tanné, barbe blanche hirsute, tignasse crasseuse pleine de feuilles et de brindilles, robe jaune fanée en guenilles, rire dément, papillons jaunes autour de lui, branches de jungle.
> 2. Chef grooth du clan des falaises : grooth robuste aux peintures d'argile, lance tenue haut, regard tourné vers le ciel, toit d'un donjon.
> 3. Guerrier grooth du clan des falaises : jeune grooth trapu, pagne de peau, gourdin rudimentaire, crocs apparents.
> 4. Garde grooth du dieu voilé : grooth robuste aux petits ossements tressés dans la tignasse, visage couvert d'une croûte d'argile blanchâtre imitant un voile, gourdin clouté.
> 5. Guerrier des jungles : guerrier qushite, peau sombre, peintures de guerre, plumes, arc court et lance, feu de camp dans une cour de fort.
> 6. Fanatique du harem : jeune homme ou jeune femme du harem du dieu voilé, voiles de soie, poudre d'or sur la peau, regard extatique et fanatisé, vapeurs de brasero.

### P11 — les figures de la saga : Satarla, Lok Kozaar, le dieu voilé

> 1. Jia : jeune femme xi lu, longs cheveux noirs luisants relevés en chignon, traits d'une exquise finesse, pendants d'oreille discrets, robe à col croisé, regard intelligent, un peu perdu après la mort de son père, comptoir marchand de la rue de la Conque à la lanterne.
> 2. Nirmus, prêtre de Nemmereth : haut dignitaire d'une cinquantaine d'années, front rasé jusqu'à la moitié du crâne, longs cheveux gris sur la nuque, traits austères, yeux bleu-gris pénétrants, robes noires aux manches galonnées, cordelette rouge des citoyens de Satarla, bureau du grand temple à la lueur d'un cierge.
> 3. Coren : jeune homme du Cloaque pas très grand, cheveux châtains en bataille, sourire en coin, allure canaille, gilet usé sur une chemise ouverte, ruelle sombre sous une lanterne.
> 4. Kurta : Halakhi courtaud au teint brun, fine barbiche, mèches noires sous une calotte et un capuchon clair, yeux sombres de cobra aux aguets, deux kriss à peine devinés, toits de terre la nuit.
> 5. Jorkus, le dieu voilé : vieillard de plus de soixante-dix ans, voile de gaze collé au visage qui laisse deviner un nez proéminent de corbeau, de petits yeux enfoncés et une bouche béante, corps flasque et ridé couvert de poudre d'or, bras levé au-dessus de la tête, sanctuaire en ruine où luit la poudre d'or à la torche.
> 6. Hilario : mercenaire satarlan, ancien soldat, blond à courte barbe, cheveux en désordre, yeux bleus rongés par le doute, cuir de campagne usé, épée longue, couloir de Fort Junia à la torche.

### P12 — introduction et chapitre 1 : Halakh et le Sanctuaire Noir

> 1. Matius, frère d'Hilario : jeune homme brun émacié, joues creuses, barbe clairsemée, cheveux en désordre agrippés d'une main, regard fuyant et halluciné, tunique d'hospice, cellule de bois de l'hospice d'Afyra.
> 2. Capitaine Amrita : jeune femme blonde aux cheveux courts, profil décidé, moue revêche et air de défi, pourpoint clouté, garde de sabre en forme d'hippocampe, quai nocturne et mâts d'un petit voilier.
> 3. Messager de Nemmereth : acolyte de l'oracle au crâne rasé, visage sombre et impassible, foulard noué au cou et remonté en bâillon, tunique de laine écrue, kriss à la ceinture, colonnes noires du Sanctuaire Noir à la torche.
> 4. Rajka, lieutenant de l'Ombre sanglante : Halakhi assez grand, nez busqué, yeux enfoncés sous d'épais sourcils froncés, l'œil gauche d'une blancheur laiteuse, mèches noires échappées d'un turban, robes banales, ruelle d'Halakh sous une lanterne.
> 5. Bekti, maître de l'Ombre sanglante : gaillard plus tout jeune, sec comme un coup de trique, longues moustaches noires tombantes, turban à aigrette, cape sombre, regard de vipère rouge, kriss à la main, cave d'une taverne.
> 6. Daruk, tavernier du Puits sec : ancien assassin manchot du bras gauche, crâne chauve, barbe noire fournie, visage faussement naïf, large carrure dans une chemise grossière, chope sur son comptoir, taverne enfumée.

### P13 — chapitres 1 et 2 : Halakh et Satarla

> 1. Assassin de l'Ombre sanglante : silhouette vêtue de noir, cagoule et voile qui ne laissent voir que des yeux durs, kriss levé dans un élan, toits de terre sous un ciel nocturne.
> 2. Drajit, aubergiste du Coursier bleu : Halakhi replet aux cheveux poivre et sel, grosse moustache, bonnet de laine, visage affable creusé par la peur, auberge sous une lampe à huile.
> 3. Rassa, matriarche des Kalindhit : jeune Halakhie d'une trentaine d'années, visage potelé, grands yeux noirs, pli amer à la bouche, voile sur les cheveux, nourrisson emmailloté endormi contre son épaule, salle de terre battue à la lueur d'une lampe.
> 4. Angus le Bubalus : géant valgardien riant à gorge déployée, longue tignasse blonde, chemise d'un blanc douteux tendue sur ses épaules, petit singe capucin au collier de diamants perché sur son épaule, chope énorme, taverne de L'Échange.
> 5. Albel, serveuse de L'Échange : jeune femme brune d'une vingtaine d'années, longs cheveux noirs à frange droite, grands yeux noirs, joli sourire triste, simple robe de servante, taverne à la lueur d'une lampe.
> 6. Solmus : homme de quarante ans passés, courte barbe blonde, teint hâlé, solide carrure de soldat, regard calculateur, lourdes robes de brocart d'astrologue brodées d'étoiles, salle d'astrologie à la lanterne.

### P14 — chapitres 2 à 4 : Roumal, Urceb et la Dent Noire

> 1. Roumal Jânn : colosse à la peau d'ébène, bandeau de tissu sur le crâne, bras couverts de scarifications rituelles, chemise de serviteur tendue sur son torse, huche à bûches portée sur le dos, regard hostile, cour d'une villa à la torche.
> 2. Oda Unjab, le Prêtre Rouge : crâne rasé, sourcils épilés, visage rond et empâté démenti par des yeux noirs perçants, tatouages géométriques sur la poitrine, cuirasse alchimique, bague à tête de salamandre tenant un rubis, forge de la Dent Noire aux lueurs de braise.
> 3. Kamatt, sentinelle kalukan : garde du corps colossal qui n'a PAS de tête ni de cou (ses épaules se rejoignent en une ligne lisse), un unique gros œil au centre de la poitrine, peau noire de jais ornée de tatouages argentés, torse musculeux, maillet de forge tenu droit, immobile comme une statue, cabine sombre d'un chebek ; l'œil tient lieu de visage, centré dans la case.
> 4. Samazar le Magnifique : gredin d'une quarantaine d'années, maigre et musclé comme un chat de gouttière, joues creusées non sans noblesse, cheveux et courte barbe en bataille, vêtements de cuir noir, galerie antique de l'Urceb-du-dessous à la torche.
> 5. Narubio, Protecteur de la ville : homme d'une cinquantaine d'années solidement charpenté, visage sévère rasé de frais, cheveux tirés en arrière, tunique noire sur une chemise de mailles, épée au côté, rempart d'Urceb sous un fanal.
> 6. Maître Casmar, le Bambin : notable portant un masque grotesque, en haut les traits poupins d'un nourrisson, en bas le visage ridé et édenté d'un vieillard, chapeau à plume de bourgeois, atelier de chandelier aux cierges allumés.

### P15 — chapitre 4 : la Compagnie des Masques et le clan des falaises (cinq cases)

Remplacer la fin des consignes par : « Les cinq personnages, dans l'ordre (ligne du haut de gauche à droite, puis les
deux premières cases de la ligne du bas ; la dernière case en fond noir uni) : ».

> 1. Toursa, le Prince Jaune : vieux majordome sous un masque doré, visage déformé penché de côté, yeux ronds, langue pendante dans un sourire dément, robe de cérémonie jaune, médaillon, temple souterrain de Morgazzon aux cierges.
> 2. Druide jaune de la Compagnie des Masques : adepte encapuchonné portant un masque grotesque et difforme, long nez crochu, paille portée à la bouche pour souffler une poudre hallucinogène, temple souterrain à la lueur des cierges.
> 3. Le druide voilé : fanatique au crâne rasé, voile de gaze cousu sur le front et tout autour du crâne, peau gonflée et suppurante sous le fil, voile taché, yeux fiévreux, bave au menton, robe crasseuse, mains levées en prière devant un autel, fumées jaunâtres.
> 4. Le Bon Docteur : alchimiste dément sous un capuchon, masque couvert de pustules aux yeux suintants, joue droite déformée par une énorme tumeur, petit pot de grès à la main, laboratoire encombré de cierges hallucinogènes.
> 5. Graak Deux-Crânes : grooth massif à l'allure absolument bestiale, crinière hirsute, gueule hurlante aux énormes crocs, collier de cuir où pendent des bouts d'os et un crâne humain, hache de pierre, toit d'un donjon sous un ciel d'orage et la lueur d'un brasier.
> 6. : laisser vide (fond noir uni).

## Découpe

Si les cases sont bien alignées (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-p1.png -crop 512x512 +repage -resize 256x256 case-%d.png
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas) ; renommer d'après le tableau des planches :
# P1 → lok-kozaar.png, qirmar.png, almar-de-chebeg.png, malcar.png, maben.png, soldat-nef-volante.png ; etc.
```

Si ChatGPT ne respecte pas la grille (cases décalées, portraits verticaux), recadrer à la main chaque case en carré
autour du visage, comme pour la planche C des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`).

## Avancement

| Planches | État |
| --- | --- |
| P1 à P10 | à faire |
| P11 à P15 | à faire (remplacent les illustrations du livre) |
