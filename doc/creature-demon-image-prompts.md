# Prompts — portraits des créatures et des démons du catalogue global

Prompts pour regénérer (via ChatGPT) les portraits des **63 créatures** du
bestiaire (`BolCreatureSeeder.php`) et des **3 démons** (`BolDemonSeeder.php`),
dans le même style que les bannières des bibliothèques
(`doc/header-image-prompts.md`, en particulier `header-creatures.png` et
`header-demons.png`) : illustration peinte et encrée façon BD fantasy des
années 80, fort contraste, ombres profondes. Même démarche que
`doc/pnj-image-prompts.md` (planches de 6 portraits, découpées ensuite).

Les créatures 51 à 63 (bestiaire du Beshaar) n'ont encore aucun portrait ; les
autres ont aujourd'hui un rendu réaliste qui ne colle plus au style.

## Fichiers attendus

| Type | Dossier | Nom du fichier | Lu par |
| --- | --- | --- | --- |
| Créature | `front/src/assets/bol/bestiary/` | `<id>.jpg` (id 1 à 63) | `creature-card.component.ts`, `tapis.util.ts`, `combat-play.util.ts` |
| Démon | `front/src/assets/bol/demon/` | `<id>.jpg` (id 1 à 3) | `tapis.util.ts`, `combat-play.util.ts` |

Format actuel : carrés de 400×400 (JPEG). Les portraits sont affichés en
médaillon rond dans l'ordre de passage et les cartes de combat : garder la tête
(ou le point focal) au centre de la case, entière dans le cadre.

## Planches

Une planche = une image **1536×1024 (paysage), 3 colonnes × 2 lignes** de
portraits carrés de 512×512, à découper puis à réduire à 400×400 (voir la
découpe en bas). Les ids se suivent d'une planche à l'autre pour simplifier le
renommage.

| Planche | Ids | Planche | Ids |
| --- | --- | --- | --- |
| C1 | 1 à 6 | C7 | 37 à 42 |
| C2 | 7 à 12 | C8 | 43 à 48 |
| C3 | 13 à 18 | C9 | 49 à 54 |
| C4 | 19 à 24 | C10 | 55 à 60 |
| C5 | 25 à 30 | C11 | 61 à 63 |
| C6 | 31 à 36 | D | démons 1 à 3 |

Ordre des cases : ligne du haut de gauche à droite, puis ligne du bas de gauche
à droite.

## Consignes de planche — créatures

À coller en tête de chaque planche C1 à C11, suivie de la liste de ses six
créatures :

> Planche de portraits illustrés de créatures : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, ombres profondes. Chaque portrait montre une seule créature, la tête et le haut du corps en gros plan (ou la bête entière quand elle est petite), centrée dans sa case, entière dans le cadre, contre-plongée dramatique pour les grandes bêtes : la créature domine le cadre et fixe le spectateur. Scène diurne, sans lune, lumière dorée d'un soleil bas. Dominante chromatique ambre / ocre, ciel embrasé façon tempête de sable, avec en fond un décor flou de son habitat (jungle, désert, marais, montagne, mer…) dans les mêmes tons chauds. Aucun personnage humain, aucun texte, légende, numéro, logo ni watermark.
>
> Les six créatures, dans l'ordre (ligne du haut de gauche à droite, puis ligne du bas de gauche à droite) :

Pour **un seul portrait**, reprendre la phrase de la créature avec le même
préambule, en remplaçant « planche » par « portrait carré unique ».

### C1 — créatures 1 à 6

> 1. Andrak : fauve ressemblant à un lion noir à l'épaisse crinière, plus de trois mètres de long, crocs acérés et regard de chasseur ; montagnes et plaines.
> 2. Anguille chasseresse : grosse anguille à la tête volumineuse, longs piquants sur le corps serpentin, jaillissant d'une eau trouble de marais ou de rivière.
> 3. Azhdarkho : grand lézard volant aux ailes membraneuses de chauve-souris (neuf mètres d'envergure), plus petit et plus agile qu'un drakk, plumage de crête et cou serpentin, en plein vol au-dessus des montagnes.
> 4. Banth : énorme bête placide ressemblant à un tricératops, cuir épais, trois cornes et collerette, harnaché de sacs de marchand, plaines de Klaar.
> 5. Béhémathon : gigantesque pieuvre marine à dix tentacules s'enroulant autour de la coque d'une galère de guerre, mer sombre et ciel de tempête.
> 6. Bubalus : bovidé robuste ressemblant à un bison, épaisse robe de cuir et de fourrure, cornes courtes, bête de somme au regard calme.

### C2 — créatures 7 à 12

> 7. Bronyx : prédateur proche d'un chark en moins énorme, longue queue, griffes aussi longues que des épées courtes, gueule allongée d'alligator hérissée de crocs ; jungles de Qo et de Qush.
> 8. Cathgan : petite vipère écarlate enroulée, crocs venimeux dévoilés, gros plan sur le sable d'un désert.
> 9. Chark : le « dragon des jungles », monstre massif à plusieurs rangées de crocs aussi grands que des épées, peau épaisse, surgissant de la végétation vierge.
> 10. Coursier des sables : grand oiseau coureur ressemblant à une autruche, plumage ocre, pattes puissantes, dunes du désert, bête de selle.
> 11. Crocator : énorme crocodile-dragon à fleur d'eau, camouflé dans la vase d'une jungle, yeux et naseaux à la surface.
> 12. Dinohyus : phacochère géant au crâne allongé, canines larges, bosse hérissée de piquants entre les épaules, hérissé le long de l'échine ; jungle.

### C3 — créatures 13 à 18

> 13. Deodarg : gigantesque croisement de félin et de reptile, corps musclé tacheté d'écailles, mâchoires de prédateur, jungle dense.
> 14. Dracophon : six pattes courtes et larges comme des souches, peau épaisse, air pataud d'herbivore, mais énormes crocs qui saillent de la gueule, longue queue serpentine, il se dresse sur ses pattes arrière quand il est en colère.
> 15. Drakk : monstre volant ressemblant à un ptérodactyle géant, corps écailleux et serpentin, ailes de chauve-souris de plus de treize mètres d'envergure, serres sous le ventre, emportant une proie vers son nid.
> 16. Elasmotherium : rhinocéros massif de quatre mètres au garrot, museau armé d'une longue corne unique, plaines poussiéreuses.
> 17. Eldaphon : mastodonte à la longue trompe encadrée de défenses de plus de quatre mètres, peau ridée, plaines, harnaché pour la guerre des nomades bleus.
> 18. Fangeux : cousin de la pieuvre des marais, quatre tentacules, quatre pieds de limace, corps flasque couvert de vase, yeux globuleux, surgissant d'un marécage.

### C4 — créatures 19 à 24

> 19. Frossor : croisement de reptile et de mammifère d'un peu plus d'un mètre, fourrure grise, puissantes griffes de fouisseur, petites dents venimeuses, déterrant des termites.
> 20. Ganuc : minuscule phytophage sauteur, mi-mammifère mi-reptile, assez petit pour tenir dans la paume d'une main (montrer une main pour l'échelle), air mignon, jungle ou plaine.
> 21. Jemadar : énorme prédateur à la peau épaisse de couleur pourpre, croisement entre un chat sauvage et un raptor, six longues pattes griffues, queue à piquants, crocs terrifiants.
> 22. Jit : petite araignée jaune à pois rouges, grosse comme une paume, sur une toile dans une jungle humide, gros plan macro.
> 23. Kalathorn : serpent de mer géant ressemblant à un plésiosaure préhistorique, deux fois plus long qu'une galère de guerre, dressé hors des flots sous un ciel menaçant.
> 24. Kroark : créature reptilienne gris-vert dressée sur deux puissantes pattes postérieures, monture rétive et dressée au combat, selle et harnais de cuir.

### C5 — créatures 25 à 30

> 25. Kyphus : petit lézard à fourrure d'une trentaine de centimètres, dents de rongeur, se nourrissant d'insectes et de larves (montrer sa petite taille avec une pierre ou une feuille).
> 26. Loup : loup puissant et efflanqué, fourrure grise, gros plan agressif, meute floue en arrière-plan.
> 27. Loup géant : loup nettement plus grand et plus imposant, solitaire, fourrure sombre, regard fixe et dents découvertes.
> 28. Mythunga : immense oiseau de proie aux serres puissantes, capable d'emporter un homme dans son nid ; il plonge en piqué, caché dans le soleil ou derrière un banc de nuages ; montagnes et bord de mer.
> 29. Ours des cavernes / ours polaire : ours massif dressé sur ses pattes arrière (plus de trois mètres), griffes redoutables, montagnes enneigées et toundra, fourrure sombre ou blanche.
> 30. Phong : chauve-souris suceuse de sang de la taille d'un petit chat, ailes déployées, petits crocs, nuée qui s'approche dans le crépuscule.

### C6 — créatures 31 à 36

> 31. Parvalus : équidé en grands troupeaux, pelage aux couleurs variées, crinière sauvage, plaines de Klaar.
> 32. Phororacos : énorme oiseau coureur aux vestiges d'ailes, ressemblant à un coursier des sables mais bien plus grand et hideux, serres impressionnantes, bec acéré et recourbé, désert du Beshaar.
> 33. Poad : énorme serpent-dragon colossal d'un cours d'eau, écrasant la coque d'une barge ou d'une galère dans ses anneaux, eaux troubles et marécages.
> 34. Purgat : petit mammifère semblable à un rat, fourrure marron, longue queue squameuse, opportuniste fouillant des déchets.
> 35. Sardolith : dinosaure quadrupède gigantesque à la peau épaisse couverte de petites plaques osseuses formant une armure articulée, avec une paire de têtes ophidiennes au sommet de ses deux cous, jungle.
> 36. Scorpion-araignée : hybride de scorpion et d'araignée d'un mètre de long, noir, grosses pinces et dard au bout de la queue, sable du désert.

### C7 — créatures 37 à 42

> 37. Scorpion-araignée géant : le même hybride en version colossale, pinces énormes et dard menaçant, dominant le cadre, dunes et plaines.
> 38. Singe des neiges : primate bipède ressemblant à un grand singe à quatre bras, fourrure blanche épaisse, tempérament agressif, terres gelées ou haute montagne.
> 39. Triotaur : ressemble à un banth mais avec une épaisse collerette osseuse au niveau du cou, une courte corne sur le museau et deux défenses qui encadrent la gueule, très agressif, jungle.
> 40. Ursavus : sorte d'ours un peu plus petit qu'un homme, traits mêlant chien et félin, perché dans les branches d'un arbre où il chasse oiseaux et petits singes.
> 41. Uzeg : sorte de petit rat sans pelage, yeux d'un vert brillant et longs crocs venimeux (de la taille d'un petit chien), dans un égout sombre.
> 42. Venator : petit prédateur rapide qui marche sur ses deux pattes postérieures, version miniature d'un chark, un peu plus petit qu'un homme, plaines et jungles.

### C8 — créatures 43 à 48

> 43. Ver des glaces : gros ver à la fourrure blanche qui se confond avec la neige, gueule ronde devant la tête, terres gelées et montagnes.
> 44. Xolag : amas amiboïde d'une grotte humide, deux longs pseudopodes qui saisissent de petits animaux, corps gélatineux et luisant.
> 45. Xolth : limace gigantesque et hideuse, aveugle, corps amiboïde gélatineux qui enveloppe ses proies, rôdant dans des catacombes ou une cité ensevelie, immense dans le cadre.
> 46. Yorth : grand prédateur de 2,5 mètres avec une crête osseuse pointue sur le dos et deux cornes atrophiées au sommet du crâne, couleur adaptée au terrain, jungle ou montagne.
> 47. Zathog : ignoble reptile des marais ressemblant à un crocator géant, peau grise ou gris-brun épaisse, énorme gueule hérissée de plusieurs rangées de crocs venimeux.
> 48. Main cavaleuse : main humaine coupée et animée par sorcellerie, rampant sur ses doigts, peau grise et nécrosée, dans un antre de sorcier éclairé de bougies, gros plan (palette plus froide, exception à l'ambre).

### C9 — créatures 49 à 54

> 49. Nécropède : plusieurs torses de cadavres humains cousus ensemble en un mille-pattes grotesque, seul le torse supérieur a gardé sa tête, bras multiples servant de pattes, dans une crypte (palette froide verdâtre, exception à l'ambre).
> 50. Nécrophage : sous-humain dégénéré, blafard, décharné et glabre, grands yeux globuleux, mains griffues, bouche de crocs, tapi dans une cave de crypte (palette froide, exception à l'ambre).
> 51. Chien de Zaggath : prédateur efflanqué tenant du lézard autant que du chien, corps couvert d'écailles et de fourrure, peau luisante d'un suint huileux, entouré de braises et de chaleur, désert brûlant de la Côte de Feu, en meute.
> 52. Dyrhunga : oiseau-titan nichant dans les monts Besharoon, béni par Dyr, dieu des tempêtes, fondant sur sa proie au cœur d'une tempête de sable, ailes immenses et éclair en arrière-plan.
> 53. Dragon de feu : grand lézard carnivore à la peau grise et écailleuse, corps irradiant une chaleur qui fait frémir l'air, nageant dans la lave d'une grotte volcanique, vapeurs toxiques.
> 54. Essaim de fourmis d'os : nuée de fourmis blanches dont les corps ressemblent à de petits os, déferlant sur le sable et sur des ossements, gros plan de la masse grouillante.

### C10 — créatures 55 à 60

> 55. Hyène du Beshaar : hyène efflanquée du désert, pelage ras et tacheté, mâchoires puissantes, sourire sauvage, dunes du Beshaar.
> 56. Meneuse de meute (hyène du Beshaar) : la plus grande et la plus ancienne hyène de la meute, cicatrices au museau, regard calculateur, parée de quelques colifichets d'os, le reste de la meute en silhouettes floues.
> 57. Hyène géante : hyène monstrueuse, taille d'un cheval, mâchoires capables de broyer les os, regard affamé, désert.
> 58. Qal'efr : la « pieuvre des sables », piégeur redoutable : tentacules jaillissant d'un entonnoir de sable aux pentes lisses, créature à demi enfouie au centre du piège.
> 59. Spicomallos : bête placide mais lourdement cuirassée, immenses pointes qui hérissent sa cuirasse, domestiquée par les tribus beshaaries pour briser la roche, la guerre et la charge.
> 60. Ver des sables : scolopendre gigantesque à des dizaines de paires de pattes, jaillissant du sable, énorme gueule ouverte et deux langues gluantes déployées, désert.

### C11 — créatures 61 à 63 (trois cases du haut, le reste en fond noir uni)

> 61. Gardien de bronze : statue de bronze sans socle d'un guerrier géant, masses à la place des mains et cloche en guise de tête, patine verdâtre, éveillée par la lumière du soleil, ruines à demi englouties par le sable.
> 62. Momie noire d'humain : mort-vivant desséché hanté par la magie impie des sables noirs, bandelettes sombres et suintantes, maladie visible sur la peau, sable noir autour.
> 63. Momie noire de coursier des sables : le grand oiseau coureur des sables en version momie noire, plumage pourri, bandelettes noires, yeux éteints, sable noir autour.
> 4. à 6. : laisser vides (fond noir uni).

## Démons

Les démons ont leur propre planche, plus sombre et surnaturelle, dans la
dominante de `header-demons.png`.

### Consignes de planche — démons

> Planche de portraits illustrés de démons : une image paysage 3:2 (1536×1024) découpée en une grille de 3 colonnes × 2 lignes de portraits carrés de taille identique, accolés sans marge, sans bordure, sans cadre ni séparateur visible (chaque portrait remplit sa case jusqu'au bord, et rien ne déborde sur la case voisine). Même style pour tous : pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), contours d'encrage visibles, fort contraste, mais tonalité plus sombre et surnaturelle. Chaque portrait montre une seule entité démoniaque, le haut du corps en gros plan, à la silhouette inquiétante, centrée dans sa case et entière dans le cadre, contre-plongée, composition menaçante. Fond d'autel en ruine ou de ciel nocturne orageux avec des symboles gravés incandescents, fumée et énergie qui s'échappent du sol, lueur infernale à l'horizon. Dominante chromatique rose / pourpre profond virant au rouge sang, forte tension lumineuse. Aucun personnage humain, aucun texte, légende, numéro, logo ni watermark.
>
> Les trois démons, dans l'ordre (ligne du haut de gauche à droite ; ne remplir que les trois cases du haut, le reste en fond noir uni) :

> 1. Zullthegg : créature dégingandée et simiesque qui se déplace à quatre pattes, mais peut se redresser sur ses pattes arrière et dominer d'une bonne tête un homme de taille moyenne, membres trop longs, regard sombre ; démon mineur.
> 2. Vul'mazzanlu, la chose-singe : démon inférieur typique de ceux invoqués par un sorcier, raisonnablement intelligent mais prompt à perdre son sang-froid, simiesque, sourire de supériorité qui laisse deviner la frustration.
> 3. Mazallakos le Voilé : démon majeur, calme, vigilant et patient, rempli de ressentiment envers les mortels qui voudraient l'asservir ; silhouette haute et imposante, enveloppée d'un voile ou d'une robe de ténèbres qui masque presque son visage, deux yeux seulement brillent dans l'ombre.

## Découpe

Si les cases sont bien alignées, un découpage en 512×512 puis une réduction à
400×400 suffisent (ImageMagick, depuis le dossier de la planche) :

```bash
magick planche-c1.png -crop 512x512 +repage -resize 400x400 -quality 88 case-%d.jpg
# case-0 … case-5 (lignes de gauche à droite, du haut vers le bas)
# à renommer en <id>.jpg : C1 → 1…6, C2 → 7…12, …, C11 → 61…63 ; D → 1…3 (demon/)
```

Si ChatGPT ne respecte pas exactement la grille (cases décalées, léger
débordement), recadrer à la main chaque case en carré autour du point focal
plutôt que de forcer le découpage régulier ; en dernier recours, redemander
la planche ou générer le portrait seul avec la même phrase.

## Avancement

| Planche | Ids | Date | Remarque |
| --- | --- | --- | --- |
| C1 | 1 à 6 | 2026-10-23 | Grille respectée (bords pile à 512 et 1024 px) : découpe régulière. |
| C2 | 7 à 12 | 2026-10-23 | Grille respectée : découpe régulière. |
