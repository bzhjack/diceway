# Prompts — fonds plein écran des bibliothèques

Prompts pour générer (via ChatGPT) les fonds des pages bibliothèque, à la résolution du fond des scénarios
(`front/src/assets/bol/dashboard-header.webp`, 1950 × 807). Les bannières actuelles (`header-*.webp`, environ 1900 × 200)
sont trop basses pour couvrir l'écran : la page ne les montre qu'en haut, effacées vers le bas. Avec une image assez haute,
la page la pose sur tout l'écran (`[fondPleinePage]="true"` sur `dw-library-header`, comme les scénarios).

Les bannières `header-*.webp` restent en place : les tuiles de l'accueil s'en servent. Les fonds sont des fichiers à part.

## Consignes communes

- **Format** : paysage, le plus large possible (au moins 1920 px de large et 800 px de haut ; un 3:2 de 1536 × 1024 convient).
  L'image couvre l'écran en `background-size: cover`, calée en haut (`center top`) : sur l'écran de référence (1440 × 704),
  le bas d'une image 3:2 est rogné.
- **Composition** : le tableau de la bibliothèque, sur une carte de suie translucide, couvre le centre et la droite ; la colonne
  des filtres, la gauche. Mettre le sujet dans le tiers haut et sur les bords, garder le centre et le bas plus calmes et plus
  sombres, sans détail qui se battrait avec le texte.
- **Style** : illustration peinte et encrée façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), fort contraste,
  ombres profondes ; la même dominante de couleur que la bannière de la page, pour que l'accueil et la page se répondent.
- Aucun texte, logo, cadre ni watermark.
- **Livraison** : exporter en WebP (`cwebp -q 82 fond-<page>.png -o fond-<page>.webp`) dans `front/src/assets/bol/`.

## Héros — `fond-heros.webp`

> Illustration de fond plein écran, format paysage large (16:9 ou plus large, au moins 1920 × 800 px), style pulp sword & sorcery peint et encré façon comics fantasy des années 1980 (Frank Frazetta, Boris Vallejo), fort contraste, ombres profondes. Deux ou trois aventuriers héroïques (un guerrier musclé épée levée, une archère, une prêtresse) en contre-plongée au sommet des marches d'un temple en ruine envahi par la jungle, placés dans le tiers haut de l'image et vers la gauche ; colonnes de pierre sculptées sur les bords, torches enflammées, lune rouge sang dans un ciel nuageux crépusculaire. La moitié basse de l'image descend vers des marches et des ruines plongées dans l'ombre, calmes, presque sans détail. Dominante rouge/orangé profond, lumière de feu chaude. Aucun texte, logo ni watermark.

## PNJ — `fond-pnj.webp`

> Illustration de fond plein écran, format paysage large (16:9 ou plus large, au moins 1920 × 800 px), même style pulp sword & sorcery peint et encré (comics fantasy des années 1980). Une rue nocturne d'une cité antique : dans le tiers haut et sur les côtés, des silhouettes de personnages secondaires typés (un garde en armure, un marchand, un étranger encapuchonné, une mercenaire) éclairés par des lanternes et des torchères, façades de pierre, arches et palmiers qui montent vers un ciel nocturne. Le bas de l'image est une chaussée pavée dans la brume et l'ombre, calme et sombre. Dominante vert émeraude sombre / teal, contrastée par la lumière chaude des torches. Aucun texte, logo ni watermark.

## Créatures — `fond-creatures.webp`

> Illustration de fond plein écran, format paysage large (16:9 ou plus large, au moins 1920 × 800 px), style pulp sword & sorcery peint et encré (comics fantasy des années 1980). Une créature monstrueuse massive, reptilienne et primordiale (grand saurien à crête), surgit de ruines englouties par la jungle : sa tête et son échine dominent le tiers haut de l'image, côté droit ; colonnes brisées et statues érodées sur les bords, poussière en suspension dans la lumière dorée d'un soleil bas (scène diurne, pas de lune), ciel embrasé façon tempête de sable. Le bas de l'image est un sol de ruines et de sable dans une pénombre ocre, calme. Dominante ambre/ocre. Aucun texte, logo ni watermark.

## Démons — `fond-demons.webp`

> Illustration de fond plein écran, format paysage large (16:9 ou plus large, au moins 1920 × 800 px), style pulp sword & sorcery peint et encré (comics fantasy des années 1980), tonalité sombre et surnaturelle. Une entité démoniaque immense se matérialise dans le tiers haut de l'image, au-dessus d'un autel en ruine couvert de symboles gravés incandescents ; fumée et énergie pourpre s'échappent de fissures sur les bords, ciel nocturne orageux avec une lueur infernale à l'horizon. Le bas de l'image est un dallage brisé où courent quelques runes éteintes, dans l'ombre, calme. Dominante rose/pourpre profond virant au rouge sang. Aucun texte, logo ni watermark.

## Armes — `fond-armes.webp`

> Illustration de fond plein écran, format paysage large (16:9 ou plus large, au moins 1920 × 800 px), style pulp sword & sorcery peint et encré (comics fantasy des années 1980). Une forge d'armurier taillée dans la pierre : dans le tiers haut et à gauche, un forgeron torse nu martèle une lame incandescente sur une enclume, gerbes d'étincelles ; sur les murs, des épées, haches et lances forgées suspendues en rang jusqu'aux voûtes. Le bas de l'image est le sol de la forge, cendres et outils dans l'ombre charbonneuse, calme. Dominante orangé/ambre intense de la forge. Aucun texte, logo ni watermark.

## Armures — `fond-armures.webp`

> Illustration de fond plein écran, format paysage large (16:9 ou plus large, au moins 1920 × 800 px), style pulp sword & sorcery peint et encré (comics fantasy des années 1980). Une salle d'armurerie en pierre : dans le tiers haut, un armurier plonge une armure de plates ornée dans un bac d'eau, la vapeur monte vers les voûtes ; sur les côtés, des armures sur mannequins de bois et des boucliers sur des présentoirs, la lueur orangée d'une forge au fond. Le bas de l'image est un sol de dalles humides dans l'ombre, calme. Dominante bleu acier / gris froid, contrastée par l'orangé de la forge. Aucun texte, logo ni watermark.

## Mise en place dans l'app

Une fois une image déposée dans `front/src/assets/bol/`, sur la page correspondante (`<page>-library-page.html`) :
`image="/assets/bol/fond-<page>.webp"` et `[fondPleinePage]="true"` sur `<dw-library-header>`.

| Page | Fichier | Page Angular |
| --- | --- | --- |
| Héros | `fond-heros.webp` | `bol/hero/library/hero-library-page.html` |
| PNJ | `fond-pnj.webp` | `bol/pnj/library/pnj-library-page.html` |
| Créatures | `fond-creatures.webp` | `bol/creature/library/creature-library-page.html` |
| Démons | `fond-demons.webp` | `bol/demon/library/demon-library-page.html` |
| Armes | `fond-armes.webp` | `bol/arme/library/arme-library-page.html` |
| Armures | `fond-armures.webp` | `bol/armure/library/armure-library-page.html` |
