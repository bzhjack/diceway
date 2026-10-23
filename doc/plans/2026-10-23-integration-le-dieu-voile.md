# Intégrer *Le Dieu voilé* (*Chroniques Lémuriennes 2*) dans l'app

Source : `doc/Pdf BoL Chroniques Lemuriennes 2.0 Le Dieu voilé.pdf` (200 pages, Ludospherik, 2020 ; page PDF = page
livre + 2). Préparation : `doc/scenarios/le-dieu-voile/` (voir son README). Même circuit que la Perle et les
Chroniques 1 : texte relu → fiche de session → JSON → `bol:import-scenario`. Aucun changement de code.

## 1. Décisions

- **Une saga d'import `dieu-voile`, un scénario par partie** : introduction, puis chapitres 1 à 5. La saga est
  suivie : ses personnages reviennent d'un chapitre à l'autre.
- **Personnages récurrents définis dans `intro.json`.** Jorkus, Lok Kozaar et Hilario agissent dès l'introduction,
  mais leurs stats ne sont données qu'au chapitre 5. Or l'import ne résout un personnage externe que s'il a été créé
  par un import précédent de la saga.
  - Le registre `personnages-recurrents.md` liste les 17 récurrents.
  - Ils sont tous définis dans l'introduction ; ceux qui n'y sont pas distribués attendent dans les coulisses.
  - Les chapitres les reprennent par leur clé.
  - Les personnages propres à une partie ont une clé préfixée (`intro-`, `ch1-` … `ch5-`).
  - **L'ordre d'import compte** : `intro.json` d'abord.
- **Astrologue** (nouvelle carrière du livre) : en Markdown seulement, sur décision de Lionel du 2026-10-23. Les PNJ
  astrologues prennent Scribe, avec « astrologue N » en commentaire.
- **Propriété** : tout est sur le compte de Lionel. Il n'y a pas de bestiaire générique, donc rien au catalogue.
- **Vilénie des rivaux** : 3 quand le livre ne donne pas de points, sinon sa valeur.
- **Kriss** : le « Kriss » du catalogue (d6M+1) au lieu du d6M du livre, comme dans les Chroniques 1, avec l'écart
  en commentaire.
- **Fort Junia** : en région « Satarla », le lieu précis dans `lieu`. L'île de Kryphondus est en « Jungle de Qo et
  jungle de Qush ».

## 2. Contenu

| Partie | Fichier | Scènes | Créés | Catalogue |
|---|---|---|---|---|
| Introduction : La colère de Nemmereth | `app/intro.json` | 8 | 21 PNJ (dont les 17 récurrents), 1 créature, 3 armes | — |
| 1. L'oracle de Nemmereth | `app/ch1.json` | 16 | 22 PNJ, 4 armes | — |
| 2. Envolé le Corbeau ! | `app/ch2.json` | 16 | 14 PNJ, 2 créatures, 2 armes | Sergent du guet |
| 3. Le dieu dévoilé | `app/ch3.json` | 15 | 16 PNJ, 2 démons, 2 armes | — |
| 4. Quand tombent les masques | `app/ch4.json` | 16 | 10 PNJ | Sergent du guet, Pilote de nef volante |
| 5. L'île de Kryphondus | `app/ch5.json` | 17 | 6 PNJ, 5 créatures | Fangeux, Azhdarkho |

Chaque fiche de session (`<partie>/01-fiche-de-session.md`) détaille ses écarts. Les principaux :

- **Figurants sans stats dans le livre** : fiches minimales inventées et signalées.
  - Récurrents : Nirmus, Jia, Almar, Malcar, Maben, Embran Tarv, Matius ; Qirmar est complété à partir des deux
    valeurs du livre.
  - Figurants du chapitre 1 : les témoins de l'enquête.
  - Figurants des chapitres 2 à 5 : Ilsda, Atti, le druide fou, les guerriers des jungles…
- **Rangs obtenus par la taille** :
  - momies du chapitre 2 ;
  - parturiente maudite (« Très grande », rivale) et ses rejetons (piétaille).
- **Protections sans armure** (Lok Kozaar, Kamatt) : par les avantages Baudrier de guerre et Peau dure.
- **Chapitre 3, la vision prémonitoire** : l'app ne la représente pas. Les scènes 6 à 10 l'indiquent dans leurs notes.
- **Valeurs du combat final** (vilénie, pouvoir) qui diffèrent des fiches du registre : dans « En jeu ».
- **Armes partagées.** « Sabre à l'hippocampe » (intro → ch. 2) ; « Cimeterre », « Armes de marin » et « Armes
  diverses (piétaille) » reprennent la définition de la Perle. Aucune arme propre de même nom n'a deux définitions,
  dans aucun des fichiers d'import du dépôt.

## 3. Recette (2026-10-23)

- [x] Simulation de chaque fichier sur `claude-test@example.com`. L'introduction a été importée d'abord, pour que les
  récurrents se résolvent.
- [x] Import réel des six parties sur le compte de test. Les 88 scènes ont été chargées une à une sur une table :
  - aucune entrée ignorée ;
  - le cartouche montre le bon titre ;
  - aucune erreur hors des portraits absents ;
  - jusqu'à 18 cartes sur une scène (la nécropole, ch. 2).
- [x] Données de test supprimées : 6 scénarios, 88 scènes, 89 PNJ, 8 créatures, 2 démons, 13 armes et leurs
  `bol_import_ref`. Aucune ligne orpheline.
- [x] Import sur le compte de Lionel, dans l'ordre. Les armes de la Perle déjà présentes ont été reprises.

## Hors périmètre

- Carrière d'astrologue au catalogue (création de héros, points d'astrologie, horoscopes).
- Portraits des PNJ, créatures et démons importés.
