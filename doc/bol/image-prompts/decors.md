# Prompts — décors de fond

Prompts pour générer (via ChatGPT) des illustrations de **décor** à poser en fond des écrans : pages de bibliothèque
(`bol-library-fond`), bandeaux, accueil, illustration de scène à la table (`sceneDecor`). Même style que les fonds
actuels (`front/src/assets/bol/fond-*.webp`) : pulp sword & sorcery des années 1980, encré et peint. Chaque image
montre un lieu de Lémurie habité de quelques personnages, sans en faire un portrait : le lieu reste le sujet.

Cocher ✅ chaque décor fait, dans sa ligne et dans le tableau des fichiers. Faits : 1 à 3 (le 2026-11-22).

## Format et contraintes des écrans

- **Paysage 16:9**, la plus grande taille proposée ; à sortir en WebP de 1672 × 941 (la taille des fonds actuels),
  qualité 85 :

  ```bash
  magick decor.png -resize 1672x941^ -gravity center -extent 1672x941 -quality 85 fond-<clé>.webp
  ```

- L'image est **recouverte** : un en-tête presque opaque en haut, le titre et ses textes à gauche, des colonnes
  translucides par-dessus. Il faut donc :
  - une **moitié gauche et un quart du haut calmes** (ciel, brume, eau, paroi, ombre), sans personnage, animal ni objet
    marquant ;
  - le sujet et les personnages dans la **moitié droite**, au second plan ou plus loin ;
  - des personnages **petits** : en pied, chacun à moins d'un tiers de la hauteur, jamais au premier plan ni coupés par
    le bord, pour qu'un fond reste un fond ;
  - un contraste modéré dans les zones calmes : le texte clair doit rester lisible par-dessus.
- Aucun texte, logo, signature, cadre ni watermark.

## Dans ChatGPT

Une image par message. Coller la **consigne commune** ci-dessous, puis, à la ligne, **un seul décor** de la liste (sa
phrase, sans le numéro). **Recoller la consigne commune en entier à chaque image** : en enchaînant par « Même consigne,
décor suivant », ChatGPT oublie la composition et revient à un personnage en gros plan au centre. Si l'image montre
encore un grand personnage, répondre : « Même scène, mais vue de beaucoup plus loin : personnages minuscules dans la
moitié droite, moitié gauche vide. »

Pourquoi c'est appuyé : le 2026-11-22, avec l'ancienne consigne (« tiers gauche calme, personnages petits ou moyens »),
le village de l'Axos et le campement beshaari sont sortis avec un personnage en pied sur presque toute la hauteur et une
moitié gauche chargée ; seul le village de pêcheurs la respectait.

Exemple, pour le décor 1 :

> Illustration de décor pour un fond d'écran, format paysage 16:9. Style pulp sword & sorcery […] cadre ni watermark.
>
> Village de pêcheurs : sur pilotis au bord d'une lagune, […] soleil pâle à droite.

## Consigne commune

> Illustration de décor pour un fond d'écran, format paysage 16:9. Style pulp sword & sorcery peint et encré façon
> comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo, couvertures de Conan), contours d'encrage visibles,
> fort contraste, ombres profondes, grain de peinture. Monde de Lémurie, préhistoire fantastique barbare : pas
> d'acier moderne, pas de poudre, pas d'architecture médiévale européenne ; bronze, pierre taillée, cuir, soie,
> plumes, ossements. Plan large, vu de loin, horizon visible : le lieu est le sujet, pas les personnages.
> COMPOSITION OBLIGATOIRE : la moitié gauche de l'image est vide de personnages, d'animaux et d'objets marquants ; elle
> ne montre que du ciel, de la brume, de l'eau calme, une paroi ou de l'ombre, sombres et peu contrastés, car du texte
> s'y affichera. Le haut de l'image (le quart supérieur) est lui aussi calme. Les personnages sont de petites
> silhouettes en pied, chacun à moins d'un tiers de la hauteur de l'image, placés dans la moitié droite, au second plan
> ou plus loin, jamais au premier plan, jamais coupés par le bord de l'image, jamais vus de près. Rien de grand au
> premier plan, ni personnage, ni animal, ni objet. Aucun texte, légende, logo, signature, cadre ni watermark.

L'éclairage et la dominante de couleur sont donnés par chaque décor : ils varient d'une image à l'autre, pour que les
écrans ne se ressemblent pas tous.

## Fichiers

Chaque image, une fois convertie (voir plus haut), prend le nom de sa ligne.

| N° | Décor | Fichier |
| --- | --- | --- |
| ✅ 1 | Village de pêcheurs | `fond-village-pecheurs.webp` |
| ✅ 2 | Village de l'Axos | `fond-village-axos.webp` |
| ✅ 3 | Campement beshaari | `fond-campement-beshaari.webp` |
| 4 | Village de la jungle | `fond-village-jungle.webp` |
| 5 | Hameau des marais | `fond-hameau-marais.webp` |
| 6 | Campement céruléen | `fond-campement-ceruleen.webp` |
| 7 | Col de l'Axos | `fond-col-axos.webp` |
| 8 | Nids des hommes-oiseaux | `fond-aire-hommes-oiseaux.webp` |
| 9 | Volcan de la Côte de Feu | `fond-volcan-cote-de-feu.webp` |
| 10 | Glacier de Valgard | `fond-glacier-valgard.webp` |
| 11 | Forêt primitive | `fond-foret-ancienne.webp` |
| 12 | Ruines dans la jungle | `fond-jungle-ruines.webp` |
| 13 | Forêt maudite | `fond-foret-maudite.webp` |
| 14 | Rivière de la jungle | `fond-riviere-jungle.webp` |
| 15 | Nefs volantes de Satarla | `fond-satarla-nefs.webp` |
| 16 | Marché de Halakh | `fond-marche-halakh.webp` |
| 17 | Bas-quartiers de Malakut | `fond-bas-quartiers-malakut.webp` |
| 18 | Jardins de Lysor | `fond-lysor-jardins.webp` |
| 19 | Palais de Parsool | `fond-parsool-palais.webp` |
| 20 | Repaire pirate | `fond-port-pirate.webp` |
| 21 | Désert de Beshaar | `fond-desert-beshaar.webp` |
| 22 | Cité ensevelie | `fond-cite-engloutie.webp` |
| 23 | Terres Désolées | `fond-terres-desolees.webp` |
| 24 | Marais de Festrel | `fond-marais-festrel.webp` |
| 25 | Temple souterrain | `fond-temple-sombre.webp` |
| 26 | Tour de sorcier | `fond-tour-sorcier.webp` |
| 27 | Taverne de port | `fond-taverne.webp` |
| 28 | Arène | `fond-arene.webp` |

## Villages et campements

> 1. ✅ Village de pêcheurs : sur pilotis au bord d'une lagune, huttes de roseaux et de bois flotté, filets qui sèchent, pirogues à balancier tirées sur le sable. Deux pêcheurs halent un filet plein de poissons étranges ; un enfant court sur une passerelle. Aube brumeuse, dominante bleu-vert et nacre, soleil pâle à droite.
>
> 2. ✅ Village de l'Axos : village de barbares des montagnes, à flanc de vallée ; maisons basses de pierre sèche aux toits de lauzes, enclos de chèvres à longs poils, fumée des foyers. Un chasseur de grande taille, peau claire, fronde à la ceinture, rentre en portant un bouquetin sur les épaules. Fin d'après-midi d'automne, dominante ocre et gris, lumière rasante.
>
> 3. ✅ Campement beshaari : nomades du désert de Beshaar au pied d'une dune ; tentes de peau teintes en rouge et indigo, grands oiseaux coureurs (semblables à des autruches) entravés, feu de crottin. Un guerrier beshaari, javelots en faisceau, scrute l'horizon ; une femme voilée attise le feu. Crépuscule, ciel orange et violet, dominante ambre.
>
> 4. Village de la jungle : dans la jungle de Qush, sous la canopée ; huttes rondes sur plateformes reliées par des ponts de lianes, totems peints, fleurs géantes. Une chasseresse à la peau sombre, sarbacane à la main, descend une échelle de liane ; des singes la suivent. Lumière verte filtrée par les feuilles, rais de soleil dans la brume.
>
> 5. Hameau des marais : dans les marais de Kasht, cabanes sur pilotis noircis, passerelles branlantes, lanternes à huile de poisson. Un batelier trapu pousse sa barque à la perche ; un héron géant observe depuis un arbre mort. Nuit tombante, brume au ras de l'eau, dominante vert olive et lueurs jaunes.
>
> 6. Campement céruléen : dans les plaines de Klaar, grandes tentes coniques, troupeaux au loin dans l'herbe haute. Deux géants à la peau gris-bleu, en manteaux de fourrure, marchent vers le camp avec leurs lances. Matin venteux, ciel immense, dominante bleu pâle et or.

## Montagnes et hauteurs

> 7. Col de l'Axos : col enneigé des montagnes de l'Axos, sentier taillé dans la falaise au-dessus d'un gouffre. Trois aventuriers (un barbare en fourrures, une archère, un sorcier encapuchonné) avancent en file, petits face à la montagne ; au sommet, des silhouettes d'hommes-oiseaux planent. Lumière froide de midi, dominante blanc et bleu acier.
>
> 8. Nids des hommes-oiseaux : accrochés aux cimes, plateformes de branches et d'os sur des pitons rocheux, mer de nuages en dessous. Un homme-oiseau aux ailes déployées se pose ; un captif ligoté attend sur une corniche. Coucher de soleil, dominante rose et or.
>
> 9. Volcan de la Côte de Feu : volcan fumant au-dessus d'une mer sombre, coulées de lave jusqu'aux vagues, temple de basalte sur un promontoire. Des sentinelles kalukans en armure d'écailles montent la garde. Nuit, dominante rouge et noir, reflets de lave sur l'eau.
>
> 10. Glacier de Valgard : falaises de glace bleue, aurores boréales, crânes de bêtes géantes pris dans la glace. Un groupe de guerriers valgardiens, barbes tressées, haches à la main, traverse sur des patins d'os. Nuit claire, dominante bleu nuit et vert d'aurore.

## Forêts et jungles

> 11. Forêt primitive : arbres colossaux, racines plus hautes qu'un homme, champignons luminescents. Un éclaireur et une guerrière se faufilent entre les racines, armes au clair, guettant une ombre énorme entre les troncs. Pénombre, rais de lumière verte, dominante émeraude et brun.
>
> 12. Ruines dans la jungle : temple englouti par la jungle de Qo, statues de dieux oubliés couvertes de lianes, escalier envahi de racines. Un voleur escalade une statue ; un sorcier déchiffre des glyphes à la lueur d'une torche. Après la pluie, vapeur, dominante vert sombre et or des torches.
>
> 13. Forêt maudite : forêt morte aux arbres noirs et tordus, corbeaux, toiles géantes entre les branches, ossements au sol. Un barbare avance seul, torche levée ; des yeux brillent dans l'ombre. Nuit sans lune, dominante gris-violet, lueur orange de la torche.
>
> 14. Rivière de la jungle : rivière boueuse sous la jungle, une barque à fond plat descend le courant. Les aventuriers rament ; un crocodile géant glisse sous la surface ; oiseaux de couleur dans les arbres. Chaleur moite de midi, dominante vert jade et brun.

## Villes et cités

> 15. Nefs volantes de Satarla : Satarla, la cité des nefs volantes ; tours élancées de marbre, quais suspendus où sont amarrés des navires aériens aux voiles de soie. Un pilote des airs satarlan fait signe depuis le bastingage ; des passagers embarquent. Matin limpide, dominante blanc, or et bleu ciel.
>
> 16. Marché de Halakh : sur le port de Halakh, étals sous des voiles colorées, épices, esclaves, bêtes étranges en cage, bateaux de toutes les nations au fond. Une marchande discute le prix avec un barbare ; un voleur halakhi au kriss coupe une bourse. Plein soleil, dominante safran et turquoise.
>
> 17. Bas-quartiers de Malakut : une ruelle, maisons de terre entassées, passerelles, linge, lanternes rouges, une taverne d'où sort une rixe. Deux coupe-jarrets des Poignards Sanglants guettent sous une arche. Nuit, dominante brun et rouge, flaques luisantes.
>
> 18. Jardins de Lysor : jardins en terrasses, bassins, pavillons à colonnes, saules, encens. Un médecin lysorien aux cheveux clairs soigne un blessé ; des disciples méditent. Fin d'après-midi paisible, dominante vert tendre et crème.
>
> 19. Palais de Parsool : escalier monumental d'un palais de Parsool, statues de lions ailés, gardes jemadars aux lances khastoks. Les héros, poussiéreux, montent vers la salle du trône ; un vizir les attend en haut. Lumière dorée, dominante pourpre et or.
>
> 20. Repaire pirate : dans les îles du Crâne, crique entre des falaises en forme de crâne, galères à l'ancre, cabanes sur la plage, feux. Un capitaine pirate borgne compte un butin ; un équipage débarque des coffres. Coucher de soleil orageux, dominante cuivre et vert sombre.

## Déserts, ruines et terres sauvages

> 21. Désert de Beshaar : dunes à perte de vue, ossements d'une bête colossale à demi enterrés. Une caravane d'oiseaux coureurs passe au pied d'un squelette ; un guide pointe l'horizon. Midi écrasant, dominante blanc doré, ciel délavé.
>
> 22. Cité ensevelie : cité en ruines à moitié ensevelie dans le sable, coupoles fendues, colonnes renversées, une porte de bronze entrouverte. Les aventuriers, torches allumées, s'apprêtent à entrer. Fin de journée, dominante ocre et ombres bleues.
>
> 23. Terres Désolées : plaine craquelée, arbres pétrifiés, ciel d'orage verdâtre, pierres levées couvertes de runes. Deux cavaliers sur des montures reptiliennes traversent la plaine. Lumière d'orage, dominante vert-gris et éclairs.
>
> 24. Marais de Festrel : eaux noires, cyprès géants, brume épaisse, idole de pierre à demi immergée. Une barque avec trois silhouettes ; une forme serpentine sous l'eau. Nuit, dominante vert d'eau et argent de lune.

## Lieux de magie et de mystère

> 25. Temple souterrain : idole géante au visage de démon, autel de sacrifice, braseros, colonnes gravées. Un prêtre en robe noire lève un poignard au-dessus d'une captive ; les héros surgissent au fond. Dominante rouge sang et noir.
>
> 26. Tour de sorcier : tour sur un pic isolé, éclairs autour du sommet, fenêtres d'où sort une lumière violette. Les aventuriers gravissent l'escalier extérieur en spirale. Nuit d'orage, dominante violet et bleu électrique.
>
> 27. Taverne de port : salle enfumée, poutres basses, tonneaux, jeux de dés, danseuse, mercenaires de toutes les régions attablés. Un barbare tape du poing sur la table ; une voleuse écoute dans l'ombre. Lumière chaude des lampes, dominante ambre et brun.
>
> 28. Arène : arène de gladiateurs, gradins pleins, sable taché, une bête monstrueuse qui sort d'une herse. Deux combattants se font face au centre ; un tyran observe depuis sa loge. Plein soleil, dominante sable et rouge.
