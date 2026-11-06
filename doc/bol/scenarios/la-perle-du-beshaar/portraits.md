# Prompts — portraits de la Perle du Beshaar

Prompts pour générer (via ChatGPT) les portraits des fiches créées par l'import de la saga (`app/ch1.json` à
`app/ch5.json`) qui n'en ont pas encore : **24 PNJ, 3 créatures et 3 démons** (état au 2026-11-02).

Les PNJ suivent le style des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`) : illustration peinte et encrée façon BD
fantasy des années 80, dominante bleu nuit profond / ocre sable brûlé contrastée par la lumière chaude d'une torche,
pour rester dans les nuits du désert et des ports de la saga. Les créatures et les démons suivent celui du bestiaire
du catalogue (`doc/bol/image-prompts/creatures-demons.md`). Les descriptions viennent du livre, reprises dans le
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

Les autres fiches de la saga (Surdral, Arjanek, Karstus, Djaloum, Salishmè, Léhéné, Dazzandroth…) ont déjà un
portrait.

## Fiches du catalogue

Quatre clés du JSON d'import renvoient au catalogue (`"catalogue"`) : l'import ne crée pas de fiche, la scène
utilise directement la créature du catalogue, qui affiche déjà son image (`front/src/assets/bol/`). Rien à générer
ni à poser ; l'image suit quand la planche du catalogue est refaite.

| Clé | Fiche du catalogue | Image |
| --- | --- | --- |
| `dinohyus` | Dinohyus | `front/src/assets/bol/bestiary/12.jpg` |
| `phororacos` | Phororacos | `front/src/assets/bol/bestiary/32.jpg` (ancien style jusqu'à la planche C6) |
| `cathgan` | Cathgan (chapitres 2 et 3, une seule fiche) | `front/src/assets/bol/bestiary/8.jpg` |
| `scorpion` | Scorpion-araignée géant | `front/src/assets/bol/bestiary/37.jpg` (ancien style jusqu'à la planche C7) |

## Consignes de planche — PNJ

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de portraits carrés de 512×512. À coller en
tête de chaque planche P, suivie de la liste de ses six personnages :

> Planche de portraits illustrés : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre un seul personnage en buste (de la tête à la poitrine), visage lisible et centré dans sa case, tête entière dans le cadre, contre-plongée légère. Fonds sombres, flous et peu chargés, sans autre personnage. Dominante bleu nuit profond / ocre sable brûlé, contrastée par la lumière chaude et orangée d'une torche ou d'une lanterne sur un côté du visage. Aucun texte, légende, numéro, logo ni watermark. Visages TRÈS différents d'un portrait à l'autre : chaque personnage a ses propres traits (forme du visage, nez, âge, carnation, couleur et coupe des cheveux, pilosité) et sa propre expression ; ne jamais répéter le même visage ni le même sourire, éviter le « beau gosse basané à barbe de trois jours » par défaut.
>
> Les six personnages, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase du personnage avec le préambule « Portrait illustré carré (1:1) »
de `doc/bol/image-prompts/pnj.md`.

Pour les créatures (planche B1) et les démons (planche D1), reprendre les consignes de planche de
`doc/bol/image-prompts/creatures-demons.md` (« Consignes de planche — créatures » et « — démons »).

## Planches

| Planche | Clés (cases 1 à 6) |
| --- | --- |
| P1 | `marsus`, `pretre`, `marin`, `gallus`, `tertus`, `pillard` |
| P2 | `guerrier-ilemah`, `pietaille-ilemah`, `guerrier-beckeram`, `pietaille-beckeram`, `fossoyeur`, `villageois-aljanir` |
| P3 | `pranma`, `gerro`, `asyr`, `nahuet`, `acrobate`, `musicien` |
| P4 | `faux-garde`, `mercenaire-temple`, `druide-noir`, `krum`, `pirate-coriace`, `pirate` |
| B1 | `tentacule`, `fille-djidaa`, `golem` (3 cases, les 3 autres en fond noir uni) |
| D1 | `ghashtalarann`, `limier`, `piqueur` (3 cases, les 3 autres en fond noir uni) |

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

### B1 — créatures : le sanctuaire, le puits des princes, le palais de Tolometh (trois cases)

Consignes de planche — créatures du catalogue, en remplaçant la fin par : « Les trois créatures, dans l'ordre (ne
remplir que les trois cases de la ligne du haut, le reste en fond noir uni) : ». Les trois vivent dans le noir :
chaque case précise son éclairage, en exception à la scène diurne.

> 1. Tentacule de la mosaïque : long tentacule de pieuvre aux ventouses luisantes, chair aux nuances de bleu et de vert piquée de tesselles d'or, jaillissant d'un sol de mosaïque sous-marine (algues, poissons, coquillages) couvert d'eau jusqu'à la cheville et fouettant l'air ; vieux sanctuaire de bois aux murs nus, pénombre bleu-vert, seule lumière la lueur orangée de deux bougies.
> 2. Fille de Djidaâ : cadavre de jeune princesse beshaarie momifié « naturellement », peau parcheminée tendue sur les os, soieries élimées et souillées, lourds bijoux d'or beshaaris, haine des vivants au fond des orbites, s'extirpant d'un sarcophage de pierre au fond d'une grotte funéraire ; ténèbres, lueur de torches venue d'en haut.
> 3. Golem de Tolometh : squelette humain entièrement recouvert de berniques, de coques et de coraux, à la forme vaguement humaine, orbites vides, s'avançant à grands pas dandinants ; salle caverneuse de nacre humide et ruisselante, éclairée de quelques torches (palette froide nacre et bleu).

### D1 — démons : Malakut et les marais (trois cases)

Consignes de planche — démons du catalogue, telles quelles (elles prévoient déjà trois démons sur la ligne du haut,
le reste en fond noir uni).

> 1. Ghashtalarann : démon de l'illusion, humanoïde courtaud au corps flasque et gélatineux, visage de masque de cire fondu aux traits indéfinissables, quatre petits yeux placés de travers au-dessus d'une bouche aux lèvres molles, poings durs comme le roc ; cave voûtée qui se démultiplie en dédale illusoire de portes et d'escaliers.
> 2. Limier de Bazaal Dûl : lévrier démoniaque efflanqué et écorché, chair rougeâtre et suintante, bouquets de petites cornes sur le crâne, yeux brasillant d'une lueur mauvaise, gueule hérissée de deux rangées de crocs, surgissant d'un miroitement de l'air à l'orée des marais.
> 3. Piqueur de Bazaal Dûl : démon chasseur au corps humanoïde trapu et musculeux, cuir squameux aux teintes automnales parsemé de touffes de fourrure épaisse, visage aux traits canins, crâne protubérant couronné de deux cornes torsadées rouge sombre, mains griffues serrant un lourd épieu de chasse de bois noir et huileux, nuage de fumée nauséabonde.

## Découpe

Si les cases sont bien alignées (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-p1.png -crop 512x512 +repage -resize 256x256 case-%d.png
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas) ; renommer d'après le tableau des planches :
# P1 → marsus.png, pretre.png, marin.png, gallus.png, tertus.png, pillard.png ; etc.
# B1 et D1 : seules case-0 à case-2 servent.
```

Si ChatGPT ne respecte pas la grille (cases décalées, portraits verticaux), recadrer à la main chaque case en carré
autour du visage, comme pour la planche C des PNJ du catalogue (`doc/bol/image-prompts/pnj.md`).

## Avancement

| Planches | État |
| --- | --- |
| P1 à P4 | à faire |
| B1, D1 | à faire |
