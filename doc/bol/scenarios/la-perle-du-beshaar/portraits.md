# Prompts — portraits de la Perle du Beshaar

Prompts pour générer (via ChatGPT) les portraits des PNJ créés par l'import de la saga (`app/ch1.json` à
`app/ch5.json`) : **41 PNJ**. Les créatures et les démons de la saga, qui suivent le style du catalogue, sont dans
`doc/bol/image-prompts/creatures-demons-scenarios.md`.

Les PNJ suivent le style des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`) : illustration peinte et encrée façon BD
fantasy des années 80, dominante bleu nuit profond / ocre sable brûlé contrastée par la lumière chaude d'une torche,
pour rester dans les nuits du désert et des ports de la saga. Les descriptions viennent du livre, reprises dans le
commentaire de chaque fiche ; quand le livre ne décrit pas un personnage, la phrase tranche ce qu'un illustrateur
doit trancher, sans contredire le texte.

## Où vont les portraits

Ces fiches appartiennent à un compte : leur portrait n'est pas un fichier `assets/bol/pnj/<id>.jpg` (réservé au
catalogue), mais le champ `avatar` de la fiche (choisi depuis le formulaire de la fiche, carré de 256×256 en PNG).

- Nommer chaque portrait découpé d'après la **clé d'import** de sa fiche : `<clé>.png` (ex. `marsus.png`,
  `guerrier-ilemah.png`). La clé est stable d'un compte à l'autre, alors que l'id change.
- Pour les poser : un par un depuis le formulaire de la fiche (avatar), ou d'un coup avec `bol:import-portraits`, qui
  retrouve chaque fiche par sa clé d'import. Une fiche qui a déjà un portrait le garde (sauf `--force`), une clé qui
  renvoie au catalogue n'est pas touchée :

  ```bash
  docker cp portraits/ diceway:/tmp/portraits
  docker exec diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --saga=perle-du-beshaar --dry-run
  docker exec -u www-data diceway php artisan bol:import-portraits /tmp/portraits --user=<email> --saga=perle-du-beshaar
  ```

Les 17 PNJ des planches P5 à P7 portent aujourd'hui l'illustration en noir et blanc du livre : pour la remplacer, ajouter
`--force`. Les illustrations du livre ne sont pas dans le dépôt, et `bol:prune-portraits` supprime celles qui ne sont
plus sur une fiche. Pour les garder, copier le dossier avant :
`docker cp diceway:/var/www/html/storage/app/public/portraits ./portraits-livre`.

## Fiches du catalogue

Quatre clés du JSON d'import renvoient au catalogue (`"catalogue"`) : l'import ne crée pas de fiche, la scène
utilise directement la créature du catalogue, qui affiche déjà son image (`front/src/assets/bol/`). Rien à générer
ni à poser ; l'image suit quand la planche du catalogue est refaite.

| Clé | Fiche du catalogue | Image |
| --- | --- | --- |
| ✅ `dinohyus` | Dinohyus | `front/src/assets/bol/bestiary/12.jpg` |
| ✅ `phororacos` | Phororacos | `front/src/assets/bol/bestiary/32.jpg` |
| ✅ `cathgan` | Cathgan (chapitres 2 et 3, une seule fiche) | `front/src/assets/bol/bestiary/8.jpg` |
| ✅ `scorpion` | Scorpion-araignée géant | `front/src/assets/bol/bestiary/37.jpg` |

## Consignes de planche — PNJ

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. À coller en
tête de chaque planche P, suivie de la liste de ses six personnages :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante bleu nuit profond / ocre sable brûlé, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase du personnage avec le préambule « Portrait illustré carré (1:1) »
de `doc/bol/image-prompts/pnj.md`.

## Planches

| Planche | Clés (cases 1 à 6) |
| --- | --- |
| P1 | `marsus`, `pretre`, `marin`, `gallus`, `tertus`, `pillard` |
| P2 | `guerrier-ilemah`, `pietaille-ilemah`, `guerrier-beckeram`, `pietaille-beckeram`, `fossoyeur`, `villageois-aljanir` |
| P3 | `pranma`, `gerro`, `asyr`, `nahuet`, `acrobate`, `musicien` |
| P4 | `faux-garde`, `mercenaire-temple`, `druide-noir`, `krum`, `pirate-coriace`, `pirate` |
| P5 | `arjanek`, `karstus`, `surdral`, `lehene`, `shammaz`, `mercenaire` |
| P6 | `djaloum`, `villageois`, `isimba`, `guerrier-issa`, `salishme` (5 cases, la 6ᵉ en fond noir uni) |
| P7 | `oglar`, `zutesh`, `jarvik`, `kutas`, `dazzandroth`, `noye` |

### P1 — introduction et chapitre 1 : Satarla et la Jalinha ; chapitre 2 : la piste

> 1. Marsus : patron redouté de la pègre de Satarla, homme dans la force de l'âge, grand et épais, mélange de muscles et d'embonpoint, crâne dégarni par une calvitie précoce qu'il caresse du plat de la main, regard froid et méprisant, sourire narquois, pourpoint de cuir sombre, arrière-salle enfumée d'une taverne sordide du Cloaque.
> 2. Prêtre de Shazzadion : prêtre satarlan d'âge mûr, mince, rasé de près, tempes grises, visage grave et paisible, robe traditionnelle vert-bleu, petite conque marine en pendentif, long bâton tenu droit, forêt de colonnes aux chapiteaux sculptés de motifs marins dans le demi-jour des cierges.
> 3. Marin de la Jalinha : marin contrebandier sec et tanné par le sel, pommettes saillantes, foulard noué sur le crâne, anneau à l'oreille, chemise ouverte, coutelas au poing et arc dans le dos, pont d'une galère marchande éclairé par un fanal dans la nuit.
> 4. Gallus, capitaine de la Jalinha : contrebandier d'une quarantaine d'années au visage long et anguleux, nez busqué, cheveux noirs tirés en catogan, courte barbe noire, regard nerveux jeté par-dessus l'épaule, sabre au côté, figure de proue en femme-oiseau aux ailes déployées devinée dans l'ombre.
> 5. Tertus, capitaine du Dauphin : frère cadet de Gallus, même nez busqué mais visage large et rasé, cheveux châtains coupés ras, oreille entaillée, sourire cupide, sabre tiré, coque d'une autre galère accostée dans la nuit.
> 6. Pillard beshaari : nomade du désert petit et sec, peau basanée, yeux noirs plissés contre le vent, joues creuses, turban poussiéreux dont un pan est rabattu sous le menton, épée et javelot, coursier des sables flou derrière lui, bourrasques de sable ocre sous le vent brûlant.

### P2 — chapitre 2 : l'embuscade et Jalad Nût ; chapitre 3 : Aljanir

> 1. Guerrier ilémah : guerrier beshaari aguerri d'une trentaine d'années, visage maigre, yeux d'un violet surprenant, barbe noire taillée en pointe, sur le devant du turban une plume de coursier coupée par le milieu et teinte en rouge, épée courbe levée, sourire de prédateur, mêlée dans un nuage de sable.
> 2. Combattant ilémah : jeune nomade à peine sorti de l'adolescence, visage rond, duvet de moustache, la même plume de coursier teinte en rouge sur un turban plus modeste, lance tenue à deux mains, regard exalté, cavaliers flous dans la poussière.
> 3. Guerrier beckéram : vieux guerrier beshaari au visage buriné et ridé, barbe grise courte, yeux verts, petite palme en cuivre martelé sur le front, cimeterre ensanglanté, traits graves de deuil, sarcophage de pierre blanche sur un travois derrière lui.
> 4. Combattant beckéram : nomade trapu au visage carré grêlé, longs cheveux noirs emmêlés tombant sur les épaules, petite palme en cuivre martelé sur le front, javelot, mâchoire serrée par la peur, dunes ocre au soleil couchant.
> 5. Fossoyeur de Jalad Nût : vieil homme maigre et voûté du « clan de la honte », peau basanée et cuite, crâne rasé, regard fuyant où couve une rancœur secrète, main gauche levée dont il manque la première phalange du petit doigt, corde de cabestan sur l'épaule, cabanes semi-troglodytes de pierres sèches à la nuit tombante.
> 6. Villageoise d'Aljanir : femme de l'oasis d'une trentaine d'années, peau sombre, visage grave et inquiet de mère dont on a pris les enfants, voile de coton clair, lance ramassée sur un ennemi tombé, maisons de torchis et palmiers sous les premières étoiles.

### P3 — chapitre 4 : le banquet de Surdral, les saltimbanques de Kutas

> 1. Pranma, dresseur fantasque : vieux baladin aux cheveux blancs clairsemés, strabisme prononcé, nez couperosé d'ivrogne, sourire hilare, tenue bigarrée débraillée et tachée de vin, petit singe agrippé à son épaule, long poignard glissant de sa manche, flambeaux d'une cour de banquet.
> 2. Gerro, flûtiste mortel : vieux musicien au visage ridé et émacié, longs cheveux gris raides, mine austère et détachée comme absorbée par sa musique, longue flûte de bois portée aux lèvres comme une sarbacane, costume de scène sobre aux couleurs passées.
> 3. Asyr, danseuse vénéneuse : danseuse d'Halakh belle et athlétique, peau cuivrée, cheveux noirs tressés serrés sur la nuque, visage aigu au regard dur et concentré, tenue de scène de soie aux épaules nues, bracelets de cuivre, kriss à lame ondulée brandi devant elle.
> 4. Nahuet, danseuse vénéneuse : l'autre danseuse d'Halakh, visage plus rond et doux, grands yeux soulignés de khôl, sourire charmeur, longue chevelure ondulée aux reflets auburn, voile de danse translucide, la pointe d'un kriss cachée derrière l'épaule.
> 5. Acrobate filou (Nîm ou Nâm) : jeune homme trapu et musculeux, cheveux noirs bouclés, nez camus, large sourire de saltimbanque, gilet bariolé sur un torse nu, grand bâton de numéro sur l'épaule, table de banquet renversée derrière lui.
> 6. Musicienne de la troupe : jeune orpheline des rues recrutée par Kutas, visage taché de son, cheveux roux coupés court, costume bigarré, tambourin dans une main et dague dégainée dans l'autre, regard rancunier et sans pitié.

### P4 — chapitre 4 : Malakut, les marais de Kasht et la côte des pirates

> 1. « Garde » d'Arjanek : faux serviteur, voleur et tueur à gages, homme d'une trentaine d'années à la mâchoire lourde, cheveux huilés plaqués, livrée propre de domestique malakuti, gourdin à la ceinture et dague à la main, sourire de traître, cour de banquet illuminée de flambeaux.
> 2. Mercenaire du temple de Shazzadion : soldat satarlan payé par le temple, vétéran au visage couturé de cicatrices, nez cassé, moustache tombante grise, armure légère de cuir, hache à la main et arc dans le dos, rue de Malakut à la nuit.
> 3. Druidesse noire : fanatique émaciée au crâne ras, robe noire druidique, petit médaillon noir en forme de silhouette humaine constellé de grains de quartz, regard dément, poignard à la main, fourrés à l'orée des marais noyés de brume (dominante vert de marais / bleu nuit, exception à l'ocre).
> 4. Krum, officier du Kalathorn améthyste : pirate d'âge mûr au visage carré et buriné, cheveux poivre et sel noués en queue, barbe courte, sabre d'abordage au côté, assurance de façade que trahit un regard inquiet, feu de camp dans la cour d'un temple en ruine envahi de lianes.
> 5. Pirate (coriace) : pirate massif à la peau très sombre, crâne rasé couvert de tatouages, anneaux d'or aux oreilles, sabre d'abordage, sourire carnassier, plage d'une crique avec une galère de guerre au mouillage.
> 6. Pirate : jeune pirate maigre et superstitieux, dents gâtées, foulard crasseux, amulette serrée dans le poing, coutelas à la ceinture, regard nerveux tourné vers des ruines où montent des lueurs étranges.

### P5 — introduction et chapitres 1 et 4 : Arjanek et Malakut

> 1. Maître Arjanek : négociant en épices de Parsool d'une trentaine d'années, belle stature, cheveux châtain clair mi-longs, teint pâle, noble allure, regard enthousiaste et sincère d'érudit naïf, pourpoint soigné à col montant, étagères de vieux manuscrits et sacs d'épices dans la pénombre.
> 2. Karstus : ancien soldat satarlan d'une cinquantaine d'années, athlétique, cheveux et barbe blonds teintés d'argent, bandeau de cuir sur le front, visage buriné, regard silencieux et vigilant, armure légère, port martial, épée au côté, ruelle de Malakut à la lanterne.
> 3. Surdral Prados : petit homme mince d'une soixantaine d'années, teint bistre, cheveux noirs bouclés parsemés d'argent, longues moustaches et barbiche soignée, toque brodée, sourire chaleureux et raffiné, pommeau d'ivoire d'une canne sous la main, salon luxueux de Malakut aux lampes de cuivre.
> 4. Léhéné : femme d'une beauté troublante, longs cheveux noirs sous un voile léger, yeux verts pailletés d'or, regard hypnotique, robe drapée, bijoux discrets, aucun trait démoniaque visible, niche de pierre sculptée et fumées de parfum.
> 5. Shammaz : Malakuti trapu, vétéran de plusieurs guerres, teint olivâtre, cheveux noirs bouclés, moustache, visage balafré, sourire de bretteur sûr de lui, armure ornée aux épaulières, une lame dans chaque main, salle de garde d'une villa sous la torche.
> 6. Mercenaire beshaari : homme du désert recruté à Badhasar, visage maigre et sombre, regard en coin méfiant de qui se rendra si le combat tourne mal, turban de toile roulé, épée courbe levée, campement nocturne au milieu des rochers.

### P6 — chapitres 2 et 3 : le Beshaar (cinq cases)

Remplacer la fin des consignes par : « Les cinq personnages, dans l'ordre (ligne du haut de gauche à droite, puis les
deux premières cases de la ligne du bas ; la dernière case en fond noir uni) : ».

> 1. Djaloum ut Beckéram : noble beshaari d'une trentaine d'années, trapu, yeux vairons (l'un marron, l'autre vert), cheveux d'un noir luisant, traits sévères taillés à la serpe, turban orné d'une broche, manteau de voyage, chef d'une escorte funéraire, dunes sous la lune et lueur d'un flambeau.
> 2. Villageois nata urdu : vieil homme du « peuple de l'eau » à la peau sombre, barbe blanche frisée, large chapeau conique de vannerie, vêtement de toile claire, visage doux d'un paysan pacifique, vieille lance à la main, canaux et palmiers d'une oasis à la nuit tombante.
> 3. Isimba : cheffe des guerriers issa, peau sombre, cheveux ras sous un bandeau, longue balafre en travers du visage, bras scarifiés en forme d'écailles, baudrier de guerre, vipère rouge du désert lovée autour du cou, regard de défi, lance dressée, désert du sud sous une torche.
> 4. Guerrier issa : homme du « peuple des serpents » au visage rond, peau scarifiée d'écailles, longue langue fourchue sortie de la bouche, yeux fixes de fanatique, haute coiffe conique de tissu, lance au poing, rochers du désert du sud.
> 5. Salishmè, slorth couronnée : créature d'un autre âge, buste de serpent de huit mètres aux écailles blêmes dont les anneaux s'enroulent derrière elle, visage pâle d'une beauté froide, yeux mordorés, oreilles effilées, couronne de protubérances osseuses, langue fine et fourchue, rangs de perles anciennes, tourbillon de sable ocre dans la nuit (peau blême, sans lumière de torche : exception).
> 6. : laisser vide (fond noir uni).

### P7 — chapitres 4 et 5 : les marais, les pirates et Tolometh

> 1. Oglar : druide de lourde carrure, plein d'embonpoint, presque chauve, petits yeux ternes, lèvre rongée par une plaie purulente, robe de bure crasseuse, grande corne de Bazaal Dûl en bandoulière, marais de Kasht sous la lanterne.
> 2. Zutesh : druide noir maigre sous un capuchon sombre, long visage revêche, menton en galoche, médaillon des druides noirs, cierge noir à la main, loggia d'une tour ouverte sur le port, la nuit.
> 3. Jarvik Barbe-de-feu : capitaine pirate colossal, barbe rousse tressée, balafre de l'oreille mutilée jusqu'au nez, foulard sur le crâne, corset de cuir crasseux, regard basculé dans la folie, bouche ouverte sur un rugissement, hache d'abordage, pont d'une galère sous un fanal.
> 4. Kutas : maître d'une troupe de baladins, grand gaillard aux épaules larges, cheveux poivre et sel en courte queue de cheval, barbe taillée, visage de bonhomie et sourire engageant que démentent des yeux de tueur sans pitié, dague à la main, roulotte de saltimbanques à la lanterne.
> 5. Dazzandroth Zant : tout petit vieillard difforme, Haut Mage déchu, crâne allongé et bosselé, peau tavelée fine comme du papier, grands yeux sombres d'une vitalité surnaturelle, mains jointes du bout des doigts, grand col de fourrure, air qui tremble autour de lui, trône d'une salle caverneuse de nacre.
> 6. Noyé : squelette rongé par les poissons, couvert de coquillages et d'algues, orbites vides, mâchoire pendante, eau ruisselante ; salle caverneuse de nacre humide, palette froide nacre et bleu, sans torche (exception à la lumière chaude).

## Découpe

Si les cases sont bien alignées (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-p1.png -crop 512x512 +repage -resize 256x256 case-%d.png
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas) ; renommer d'après le tableau des planches :
# P1 → marsus.png, pretre.png, marin.png, gallus.png, tertus.png, pillard.png ; etc.
# P6 : case-5 ne sert pas.
```

Si ChatGPT ne respecte pas la grille (cases décalées, portraits verticaux), recadrer à la main chaque case en carré
autour du visage, comme pour la planche C des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`).

## Avancement

| Planches | État |
| --- | --- |
| P1 à P4 | à faire |
| P5 à P7 | à faire (remplacent les illustrations du livre) |
