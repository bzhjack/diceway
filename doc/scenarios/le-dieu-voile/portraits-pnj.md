# Prompts — portraits des PNJ du Dieu voilé

Prompts pour générer (via ChatGPT) les portraits des **89 PNJ** créés par l'import de la saga (`app/intro.json` à
`app/ch5.json`), dans le style des PNJ du catalogue (`doc/pnj-image-prompts.md`) : illustration peinte et encrée
façon BD fantasy des années 80, dominante vert émeraude sombre / teal contrastée par la lumière chaude d'une torche.
Les descriptions viennent du livre, reprises dans le commentaire de chaque fiche.

## Où vont les portraits

Ces PNJ appartiennent à un compte : leur portrait n'est pas un fichier `assets/bol/pnj/<id>.jpg` (réservé au
catalogue), mais le champ `avatar` de la fiche (image encodée, comme celle choisie depuis le formulaire PNJ, carré
de 256×256 en PNG).

- Nommer chaque portrait découpé d'après la **clé d'import** de sa fiche : `<clé>.png` (ex. `lok-kozaar.png`,
  `ch3-oda-unjab.png`). La clé est stable d'un compte à l'autre, alors que l'id change.
- Pour les poser : un par un depuis le formulaire de la fiche PNJ (avatar). Ou bien d'un coup, par un petit script
  qui retrouve chaque fiche par `bol_import_ref` (saga `dieu-voile`, type `personnage`, clé) et remplit `avatar`. Ce
  script n'existe pas encore.

## Déjà illustrées par le livre (2026-10-23)

Le livre illustre 32 fiches du Dieu voilé (29 PNJ et 3 créatures). Leur illustration, recadrée, a été posée en avatar
sur le compte de Lionel ; ces fiches n'ont pas besoin des prompts ci-dessous :

`jia`, `nirmus`, `kurta`, `coren`, `jorkus`, `hilario`, `matius`, `intro-amrita`, `ch1-messager`, `ch1-rajka`,
`ch1-bekti`, `ch1-daruk`, `ch1-assassin`, `ch1-drajit`, `ch1-rassa`, `ch2-angus`, `ch2-albel`, `ch2-solmus`,
`ch2-roumal`, `ch3-oda-unjab`, `ch3-kamatt`, `ch3-narubio`, `ch3-samazar`, `ch4-casmar`, `ch4-toursa`,
`ch4-druide-voile`, `ch4-druide-jaune`, `ch4-bon-docteur`, `ch4-graak` ; créatures `ch2-momie-royale`,
`ch2-momie-enfant`, `ch5-ver-a-soie`.

Les illustrations du livre ne sont pas dans le dépôt (supplément du commerce, usage personnel).

## Consignes de planche

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. À coller en
tête de chaque planche, suivie de la liste de ses six personnages :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante vert émeraude sombre / teal, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase du personnage avec le préambule « Portrait illustré carré (1:1) »
de `doc/pnj-image-prompts.md`.

## Planches

| Planche | Clés (cases 1 à 6) |
| --- | --- |
| P1 | `jia`, `nirmus`, `lok-kozaar`, `coren`, `kurta`, `jorkus` |
| P2 | `hilario`, `matius`, `qirmar`, `almar-de-chebeg`, `malcar`, `maben` |
| P3 | `soldat-nef-volante`, `embran-tarv`, `megere`, `mishart`, `barbare-de-qush`, `intro-sacrificateur` |
| P4 | `intro-almandus`, `intro-amrita`, `intro-doros`, `ch1-messager`, `ch1-rajka`, `ch1-bekti` |
| P5 | `ch1-daruk`, `ch1-assassin`, `ch1-assassin-arbaletrier`, `ch1-soldat-guet`, `ch1-milicien-kalindhit`, `ch1-chemdi` |
| P6 | `ch1-vagabond`, `ch1-drajit`, `ch1-druide-gris`, `ch1-oracle`, `ch1-amchak`, `ch1-amaston` |
| P7 | `ch1-madri`, `ch1-jembal`, `ch1-parchak`, `ch1-sebki`, `ch1-rimshak`, `ch1-rassa` |
| P8 | `ch1-liu-liong`, `ch2-efradus`, `ch2-jarnius`, `ch2-squelette`, `ch2-sartol`, `ch2-hirk` |
| P9 | `ch2-angus`, `ch2-albel`, `ch2-nobur`, `ch2-bambam`, `ch2-zaira`, `ch2-homme-de-main` |
| P10 | `ch2-cassa`, `ch2-solmus`, `ch2-roumal`, `ch3-oda-unjab`, `ch3-kamatt`, `ch3-lothar` |
| P11 | `ch3-apprenti-oda`, `ch3-soldat-pretre-rouge`, `ch3-galor`, `ch3-marin-pretre-rouge`, `ch3-samazar`, `ch3-narubio` |
| P12 | `ch3-amrazh`, `ch3-marek`, `ch3-michka`, `ch3-garde-du-guet`, `ch3-garde-filonier`, `ch3-julak` |
| P13 | `ch3-menni`, `ch4-casmar`, `ch4-toursa`, `ch4-ilsda`, `ch4-atti`, `ch4-acolyte` |
| P14 | `ch4-druide-jaune`, `ch4-druide-voile`, `ch4-bon-docteur`, `ch4-chasseur-grooth`, `ch4-graak`, `ch5-druide-fou` |
| P15 | `ch5-chef-grooth`, `ch5-guerrier-grooth`, `ch5-garde-grooth`, `ch5-guerrier-des-jungles`, `ch5-fanatique-du-harem` (5 cases, la 6ᵉ en fond noir uni) |

### P1 — introduction : les grands rôles

> 1. Jia : jeune femme xi lu du lointain Khanat, longs cheveux noirs luisants relevés en chignon, traits d'une exquise finesse, teint pâle, regard intelligent mais esseulé, tenue de soie sobre de marchande, comptoir aux jarres et aux rouleaux derrière elle.
> 2. Nirmus, prêtre de Nemmereth : homme austère d'une cinquantaine d'années, front rasé jusqu'au milieu du crâne, yeux bleu-gris pénétrants, robes noires aux manches galonnées, cordelette rouge des citoyens de Satarla, colonnes d'un temple funéraire sombre.
> 3. Lok Kozaar : mercenaire céruléen massif à la peau bleutée, crâne rasé sauf une longue mèche nattée teinte en rouge, mâchoire brutale, regard d'ambition froide, hache de bataille sur l'épaule, baudrier de cuir, aucune armure.
> 4. Coren : jeune homme pas très grand, cheveux châtains en bataille, sourire en coin, allure de canaille des bas-fonds, doigts fins jouant avec une petite arbalète, gilet élimé.
> 5. Kurta : Halakhi courtaud au teint brun, fine barbiche noire, yeux sombres de serpent, deux kriss à lame ondulée croisés devant la poitrine, vêtements sombres ajustés, posture de cobra prêt à frapper.
> 6. Jorkus, le dieu voilé : vieillard de plus de soixante-dix ans au corps flasque et ridé couvert de poudre d'or, pagne rouge, un voile de gaze humide collé au visage qui en brouille les traits (nez proéminent et petits yeux enfoncés devinés dessous), assis sur un siège drapé ; dominante or et rouge sombre (exception au teal).

### P2 — introduction : les alliés et les soldats

> 1. Hilario : mercenaire satarlan, ancien soldat, blond à courte barbe, yeux bleus cernés par le doute, épée longue au côté, armure légère de cuir, petit bracelet tressé noir et bleu au poignet.
> 2. Matius : jeune homme brun émacié, joues creuses, barbe clairsemée, regard fuyant et halluciné, couverture d'hospice sur les épaules, mains crispées.
> 3. Qirmar l'alchimiste : jeune alchimiste malakuti brillant, visage fin et studieux, cheveux noirs noués, robe d'érudit tachée de réactifs, fioles colorées à la ceinture, lueur verte d'un alambic.
> 4. Almar de Chebeg : vieil astrologue rabougri et grisonnant, front large, regard pénétrant, robe brodée d'étoiles, astrolabe de cuivre en main, ciel étoilé par une fenêtre.
> 5. Malcar : capitaine satarlan d'âge mûr, la joue ravagée par trois griffures de momie mal refermées, regard loyal et dur, armure légère et cape d'officier, épée de famille ouvragée.
> 6. Maben, pilote de la nef volante : jeune officier fringant de la noblesse satarlane, moustache fine, sourire enthousiaste, lunettes de pilote relevées sur le front, veste d'aviateur à boutons dorés, coque d'une nef volante dans le ciel.

### P3 — introduction : la cour, la secte et l'armée

> 1. Soldat de la nef volante : soldat satarlan aguerri, casque de métal à nasal, armure légère de cuir, lance tenue droite, arbalète dans le dos, cordages et bastingage d'une nef volante.
> 2. Embran Tarv : oncle et ministre du roi de Satarla, la soixantaine, allure martiale, cheveux gris coupés court, léger embonpoint, pourpoint brodé et lourde chaîne d'or, regard pragmatique.
> 3. Jessinda, dite la Mégère : druidesse jaune de Morgazzon portant un masque de vieille harpie ridée aux cheveux de filasse ; sous le bord du masque, on devine la peau claire et les yeux verts d'une jeune femme ; robe jaune, paille à souffler à la main ; dominante jaune soufre / teal.
> 4. Mishart, druide jaune : vieillard petit et trapu, robe jaune crasseuse cousue de talismans et de colifichets, bâton cérémoniel orné de breloques, sourire torve, brume des marais.
> 5. Barbare de Qush : guerrier d'élite des jungles, peau très sombre, peintures de guerre blanches, coiffe de plumes et d'os, lance et petit bouclier de peau, regard féroce, feuillage de jungle.
> 6. Prêtre sacrificateur de Nemmereth : prêtre en toge blanche, front rasé, un pan de sa toge relevé sur la tête, long couteau rituel tenu contre la poitrine, autel de pierre noire.

### P4 — introduction et chapitre 1

> 1. Maître Almandus, médecin : médecin satarlan aisé, la cinquantaine, barbe soignée, toque de praticien, lunettes de cristal, sacoche de cuir, étagères de pots derrière lui.
> 2. Capitaine Amrita : jeune femme blonde aux cheveux courts, moue revêche et air de défi, pourpoint clouté, pantalon de cuir, sabre à la garde en forme d'hippocampe sur l'épaule, voiles et cordages.
> 3. Doros : homme rondouillard en robes, large sourire avenant, médaillon d'Afyra en forme de feuille de palmier sur la poitrine.
> 4. Messager de Nemmereth : jeune acolyte maigre pieds nus, tunique de laine écrue, foulard noué au cou relevé en bâillon sur la bouche, kriss en main, yeux fixes d'un sacrifié consentant, ténèbres d'un sanctuaire.
> 5. Rajka, lieutenant de l'Ombre sanglante : Halakhi assez grand au nez busqué, yeux enfoncés, l'œil gauche d'une blancheur laiteuse, turban d'où s'échappent des mèches noires, pourpoint de cuir épais, cimeterre.
> 6. Bekti, maître de l'Ombre sanglante : homme plus tout jeune, sec comme un coup de trique, visage anguleux et calme de vipère, tempes grises, armure de cuir, kriss ancien au pommeau d'argent.

### P5 — chapitre 1 : Halakh, les lames

> 1. Daruk, tavernier du Puits sec : ancien assassin trapu, manchot du bras gauche, visage rond faussement naïf, tablier de taverne, gourdin clouté posé sur le comptoir.
> 2. Assassin de l'Ombre sanglante : silhouette mince en vêtements de toile couleur de poussière, visage à moitié caché par un chèche, kriss tenu bas, couteaux de lancer à la ceinture, ruelle d'Halakh.
> 3. Assassin de l'Ombre sanglante (arbalète) : tireur accroupi sur un toit de terre, foulard sur le visage, arbalète épaulée vers le spectateur, ciel nocturne et jasmin.
> 4. Soldat du guet d'Halakh : mercenaire beshaari brutal au teint cuivré, barbe drue, casque à pointe enturbanné, armure légère, cimeterre et javelots, sourire corrompu.
> 5. Milicien de la tribu des Kalindhit : jeune homme du quartier, bandeau de tissu rayé sur le front, armure de cuir dépareillée, javelot à la main, posté sur un toit.
> 6. Chemdi, champion de Parchak : colosse lutteur torse nu, lèvre fendue, hématome sur la joue, épaules huilées, poings bandés de cuir, estrade de lutte éclairée de lampes.

### P6 — chapitre 1 : la Ville nomade et le Sanctuaire Noir

> 1. Vagabond soudoyé de la Ville nomade : mendiant décharné aux haillons, barbe sale, bâton noueux, regard sournois, murs de terre de la Ville nomade.
> 2. Drajit, aubergiste du Coursier bleu : Halakhi replet aux cheveux poivre et sel, visage sympathique rongé par la peur et la culpabilité, tablier, lampe à huile.
> 3. Druide gris du Sanctuaire Noir : silhouette en longue robe grise à capuche, visage couvert de cendre, mains dissimulées dans les manches, regard vide, pénombre de pierre noire.
> 4. L'oracle de Nemmereth : devin au crâne rasé, robe de brocart gris aux motifs argentés, visage maquillé de noir sur les saillies et de blanc dans les creux, voix atone devinée sur des lèvres entrouvertes, statue sombre derrière lui.
> 5. Amchak l'herboriste : vieil homme au visage plus parcheminé qu'une momie, traits farouches de nomade, sourcils broussailleux, bouquets d'herbes séchées et pots de terre.
> 6. Amaston de Lysor : petit homme d'une soixantaine d'années, teint clair, cheveux blonds cendrés, regard bienveillant, tablier de médecin, mains tachées d'onguent.

### P7 — chapitre 1 : les témoins de l'enquête

> 1. Madri la potière : femme d'âge mûr, sèche et menue, visage sévère buriné par le soleil, main gauche atrophiée à trois doigts tenant un pot signé d'une fleur de jasmin, patio fleuri.
> 2. Jembal le Roseau : homme très petit et trapu, visage rond et glabre, peau pâle, regard dangereux, bagues aux doigts, rideaux rouges d'un bouge.
> 3. Parchak : gros homme éméché, joues rougies, bourse pleine dans une main et coupe de vin dans l'autre, rire gras.
> 4. Sebki, prêtre d'Afyra : prêtre doux et soigné, robe vert d'eau, médaillon en feuille de palmier, encens et piliers d'un temple des vingt dieux.
> 5. Rimshak, maître de la Guilde du Lendemain : Halakhi entre deux âges, longue barbiche noire, sourire édenté, fioles de poison serrées entre les doigts, laboratoire encombré.
> 6. Rassa, matriarche des Kalindhit : jeune Halakhie d'une trentaine d'années, visage potelé, grands yeux noirs, pli amer à la bouche, châle et bijoux de cheffe de tribu, entourée d'une ombre de vieillards flous.

### P8 — chapitre 1 et chapitre 2 : la nécropole

> 1. Liu Liong, de la Main de Jade : Xi Lu d'une trentaine d'années, visage grêlé de petites cicatrices, sérieux et affable, robe de soie de marchand ornée d'un pendentif de jade.
> 2. Maître Efradus, prieur de la nécropole : petit homme courtaud au front rasé, robes noires de Nemmereth, plume et rouleaux d'archives, mine inquiète.
> 3. Jarnius, jeune prêtre de la nécropole : jeune prêtre timide aux robes noires, lanterne levée, pied-de-biche à la main, mausolées dans la nuit.
> 4. Squelette de la nécropole : cadavre squelettique vêtu de lambeaux funéraires, orbites vides, mâchoire pendante, bras décharné tendu vers le spectateur, pluie et éclairs sur les tombes (palette froide, exception au teal chaud).
> 5. Sartol, disciple de Jorkus : garçon roux d'environ treize ans, taches de rousseur, robe de novice noire trop grande, regard intimidé mais franc.
> 6. Maître Hirk, aubergiste du Poisson d'or : grand homme chauve au léger embonpoint, bonhomie souriante, tablier propre, enseigne au poisson doré derrière lui.

### P9 — chapitre 2 : le Cloaque

> 1. Angus le Bubalus : géant valgardien à la longue tignasse blonde, barbe hirsute, chemise d'un blanc douteux tendue sur des épaules énormes, chope géante à la main, un petit singe capucin au collier de diamants sur l'épaule, rire tonitruant.
> 2. Albel, serveuse de L'Échange : jeune femme brune d'une vingtaine d'années, grands yeux noirs, joli sourire triste, tablier de serveuse, bracelet tressé de cheveux et de cordelette bleue.
> 3. Nobur, chef de bande du Cloaque : homme corpulent en pourpoint noir, lourde chaîne dorée, cheveux bruns coupés au bol, petits yeux chafouins, gourdin posé sur la table.
> 4. Bambam, lieutenant de Nobur : colosse de plus de cent vingt kilos, front défiguré par une vilaine cicatrice, sourire édenté, gourdin clouté sur l'épaule.
> 5. Zaïra : jeune femme rousse en robe rouge sombre, regard de chatte rusée, médaillon de pierre à l'éclat bleuté qu'elle touche du bout des doigts, deux poignards à la ceinture.
> 6. Homme de main de Nobur : truand des bas-fonds en cuir usé, nez cassé, dague et gourdin, sourire mauvais, ruelle sale.

### P10 — chapitre 2 : l'embuscade, et chapitre 3 : Urceb

> 1. Dame Cassa, prêtresse d'Afyra : prêtresse au visage doux et fatigué, voile vert pâle, mains de soignante, lits d'hospice derrière elle.
> 2. Solmus : Satarlan de quarante ans passés, courte barbe blonde, teint hâlé, solide carrure d'archer, lourdes robes de brocart d'astrologue mal portées, arc long à l'épaule.
> 3. Roumal Jânn : colosse à la peau d'ébène de plus d'un mètre quatre-vingt-dix, bras couverts de scarifications rituelles, lourde massue de bois, petit bouclier en peau de crocator.
> 4. Oda Unjab, le Prêtre Rouge : crâne rasé, sourcils épilés, visage rond et empâté démenti par des yeux noirs perçants, tatouages géométriques sur le cou et la poitrine, cuirasse alchimique rougeoyante, bague à tête de salamandre tenant un rubis ; dominante rouge braise (exception au teal).
> 5. Kamatt, sentinelle kalukan : colosse kalukan à la peau noire de jais ornée de tatouages argentés, un seul œil au milieu du visage, maillet de forge sur l'épaule, lueur de forge.
> 6. Lothar, intendant du Prêtre Rouge : homme élancé aux cheveux noirs, teint pâle, robe brune aux manches galonnées d'or, yeux plissés qui jaugent.

### P11 — chapitre 3 : la Dent Noire

> 1. Apprenti d'Oda : jeune forgeron torse nu ruisselant de sueur, pantalon rouge, marteau de forge levé, regard vide de transe, enclume gravée de syllabes démoniaques, flammes.
> 2. Soldat du Prêtre Rouge : soldat en pourpoint de cuir bouilli rouge sombre clouté de cuivre, casque soigné, épée et arbalète, discipline froide, pont d'un chebek.
> 3. Galor, capitaine du chebek : officier de marine d'âge mûr, même pourpoint rouge clouté de cuivre, barbe taillée, longue-vue à la ceinture, gaillard d'arrière.
> 4. Marin du Prêtre Rouge : marin basané, foulard rouge, coutelas, cordages tendus, embruns.
> 5. Samazar le Magnifique : homme de quarante ans au physique maigre et musclé de chat de gouttière, vêtements de cuir noir, visage aux joues creusées non dénué de beauté ni de noblesse, moignon de la main droite bandé.
> 6. Narubio, Protecteur de la ville : seigneur de la cinquantaine, solidement charpenté, visage sévère rasé de frais, tunique noire sur une chemise de mailles, épée au côté.

### P12 — chapitre 3 : le guet d'Urceb et la villa

> 1. Amrazh, mage de Narubio : homme maigre et très grand, visage émacié et glabre, longues robes bleu pastel, tatouage bleuté en forme d'œil empli d'arabesques au milieu du front, regard pâle presque laiteux.
> 2. Marek, sergent du guet : sergent d'âge mûr aux tempes grises, vêtements sombres de nuit, arbalète, regard de marin qui connaît les récifs.
> 3. Michka, garde grimpeur : jeune garde au physique sec et nerveux, corde enroulée à l'épaule, mains écorchées, sourire agile, orgues basaltiques.
> 4. Garde du guet d'Urceb : garde en pourpoint de cuir noir, casque simple, gourdin, visage carré et discipliné.
> 5. Garde du Filonier : garde mal rasé qui s'ennuie, armure de cuir, lance appuyée à l'épaule, grille de villa derrière lui.
> 6. Julak, intendant du Filonier : gros homme glabre et ventripotent, cheveux blonds coupés au bol, trousseau de clefs à la ceinture, regard de joueur invétéré.

### P13 — chapitre 3 et chapitre 4 : la Compagnie des Masques

> 1. Menni : garçon roux de onze ans aux yeux noirs comme l'obsidienne, tunique de jeune serviteur, regard grave et courageux, lueur orangée de lave en contrebas.
> 2. Maître Casmar, le Bambin : notable portant un masque grotesque : en haut les traits poupins d'un nourrisson, en bas le visage ridé et édenté d'un vieillard ; robe jaune sur des vêtements cossus, cierges allumés.
> 3. Toursa, le Prince Jaune : vieux majordome voûté portant le masque doré du Prince Jaune : visage déformé penché de côté, yeux ronds, langue pendante dans un sourire dément ; robe jaune d'apparat ; dominante jaune or / teal.
> 4. Ilsda, cuisinière de Casmar : cuisinière ronde à l'air innocent, fichu sur la tête, joues rouges, bougie à la main, cuisine sombre.
> 5. Atti, servante de Casmar : jeune servante maigre aux yeux vifs et inquiets, tablier, oreille tendue vers une porte.
> 6. Acolyte de la Compagnie des Masques : fidèle en longue robe jaune portant un masque de cuir peint en faciès de singe à la bouche démesurée, poignard à la main.

### P14 — chapitre 4 : le temple de Morgazzon et Fort Junia ; chapitre 5 : l'île

> 1. Druide jaune de la Compagnie des Masques : druide en robe jaune, masque de visage grotesque et difforme, coutelas et paille à souffler, brume hallucinogène.
> 2. Le druide voilé : fanatique au crâne rasé, voile de gaze cousu au front et tout autour du crâne, peau gonflée et suppurante sous le fil, voile taché, yeux fiévreux, bave au menton.
> 3. Le Bon Docteur : alchimiste dément au masque couvert de pustules, aux yeux suintants, la joue droite déformée par une énorme tumeur, petits pots de grès dans les mains.
> 4. Chasseur grooth du clan des falaises : humanoïde grooth bestial, front bas, mâchoire prognathe, poils drus, gourdin, agrippé à une paroi de pierre, regard affamé.
> 5. Graak Deux-Crânes : chef grooth massif à l'allure absolument bestiale, collier de cuir où pendent des os et un crâne humain, hache de pierre, rugissement.
> 6. Le druide fou : vieil homme au visage ridé et tanné, barbe blanche hirsute, tignasse crasseuse pleine de feuilles et de brindilles, robe jaune fanée en guenilles, rire dément, papillons jaunes autour de lui, branches de jungle.

### P15 — chapitre 5 : Fort Junia (cinq cases)

> 1. Chef grooth du clan des falaises : grooth robuste aux peintures d'argile, lance tenue haut, regard tourné vers le ciel, toit d'un donjon.
> 2. Guerrier grooth du clan des falaises : jeune grooth trapu, pagne de peau, gourdin rudimentaire, crocs apparents.
> 3. Garde grooth du dieu voilé : grooth robuste aux petits ossements tressés dans la tignasse, visage couvert d'une croûte d'argile blanchâtre imitant un voile, gourdin clouté.
> 4. Guerrier des jungles : guerrier qushite, peau sombre, peintures de guerre, plumes, arc court et lance, feu de camp dans une cour de fort.
> 5. Fanatique du harem : jeune homme ou jeune femme du harem du dieu voilé, voiles de soie, poudre d'or sur la peau, regard extatique et fanatisé, vapeurs de brasero.
> 6. : laisser vide (fond noir uni).

## Découpe

Si les cases sont bien alignées (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-p1.png -crop 512x512 +repage -resize 256x256 case-%d.png
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas) ; renommer d'après le tableau des planches :
# P1 → jia.png, nirmus.png, lok-kozaar.png, coren.png, kurta.png, jorkus.png ; etc.
```

Si ChatGPT ne respecte pas la grille (cases décalées, portraits verticaux), recadrer à la main chaque case en carré
autour du visage, comme pour la planche C des PNJ du catalogue (`doc/pnj-image-prompts.md`).

## Avancement

| Planches | État |
| --- | --- |
| P1 à P15 | à faire |
