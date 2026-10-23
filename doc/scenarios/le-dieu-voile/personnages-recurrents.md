# Le Dieu voilé — Registre des personnages récurrents

*Saga d’import : `dieu-voile`. Source : `doc/Pdf BoL Chroniques Lemuriennes 2.0 Le Dieu voilé.pdf` (page PDF = page
livre + 2), parcouru de la PDF p. 46 à 199 : chaque chapitre survolé, ses blocs de stats et ses « Protagonistes » lus.*

## Pourquoi ce registre

L’import se fait chapitre par chapitre, dans l’ordre : `intro.json`, puis `ch1.json` à `ch5.json`, tous dans la saga
`dieu-voile`. Un personnage cité dans une distribution sans être défini dans le fichier est cherché parmi ceux qu’un
import **précédent** de la même saga a créés (voir `doc/scenarios/format-import.md`).

Or plusieurs personnages agissent dès l’introduction alors que leurs stats ne viennent qu’au chapitre 5 (Jorkus, Lok
Kozaar, Hilario). Décision : **tous les personnages récurrents sont définis dans `app/intro.json`**, distribués ou
non. Ceux qui ne sont pas distribués dans l’introduction attendent dans les coulisses. Les chapitres 1 à 5 les
reprennent par leur clé, sans jamais les redéfinir.

Est récurrent un personnage qui apparaît dans au moins deux des six parties (intro, ch. 1 à 5), ou dont les stats
sont données dans un autre chapitre que celui de sa première apparition. « Apparaît » : il est en scène ou il agit
hors champ dans le déroulé du chapitre ; une simple mention dans un récapitulatif ne compte pas.

## Le registre

Pages de stats : pages **PDF**. « Inventée » : le livre ne donne pas de stats, la fiche est minimale et le dit dans
son commentaire.

| Clé | Nom (fiche) | Kind | Rang | Parties | Stats | Dans l’intro |
|---|---|---|---|---|---|---|
| `jorkus` | Jorkus, le dieu voilé | pnj | rival | intro (hors champ), ch. 2 (enquête), ch. 4, ch. 5 | p. 195 | coulisses |
| `lok-kozaar` | Lok Kozaar | pnj | rival | intro, ch. 1 et 2 (hors champ), ch. 3 (cité), ch. 4, ch. 5 | p. 196 | distribué |
| `hilario` | Hilario | pnj | rival | intro (hors champ), ch. 2 (enquête), ch. 4 (cité), ch. 5 | p. 196 | coulisses |
| `kurta` | Kurta | pnj | rival | intro (cité), ch. 1 (hors champ), ch. 2, ch. 4 (s’il a survécu) | p. 111 | coulisses |
| `coren` | Coren | pnj | rival | intro, ch. 2 | p. 112 | distribué |
| `megere` | Jessinda, dite la Mégère | pnj | rival | ch. 4, ch. 5 | p. 195 | coulisses |
| `mishart` | Mishart, druide jaune | pnj | coriace | ch. 4, ch. 5 | p. 196 | coulisses |
| `nirmus` | Nirmus, prêtre de Nemmereth | pnj | rival | intro, ch. 1 (cité), ch. 2, ch. 4, ch. 5 | inventée | distribué |
| `jia` | Jia | pnj | rival | intro, ch. 1 (citée), ch. 2 | inventée | distribuée |
| `qirmar` | Qirmar l’alchimiste | pnj | rival | ch. 1, ch. 2, ch. 4 | partielle, p. 89 (Esprit 3, alchimiste 2) | coulisses |
| `almar-de-chebeg` | Almar de Chebeg | pnj | rival | ch. 2, ch. 3 | inventée | coulisses |
| `matius` | Matius, frère d’Hilario | pnj | coriace | ch. 2, ch. 4 | inventée | coulisses |
| `malcar` | Malcar | pnj | rival | ch. 2, ch. 4 | inventée | coulisses |
| `maben` | Maben, pilote de la nef volante | pnj | rival | ch. 4, ch. 5 | inventée | coulisses |
| `embran-tarv` | Embran Tarv | pnj | rival | ch. 4, ch. 5 | inventée | coulisses |
| `soldat-nef-volante` | Soldat de la nef volante | pnj | coriace | ch. 4, ch. 5 | p. 199 (aide de jeu VII) | coulisses |
| `barbare-de-qush` | Barbare de Qush | pnj | coriace | ch. 4, ch. 5 | p. 165 et p. 187 (même profil) | coulisses |

Aucune créature ni aucun démon n’est récurrent : les bêtes, morts-vivants et démons de la saga sont propres à un
chapitre.

## Fiches

Les stats complètes sont dans `app/intro.json`. Ci-dessous : camp et attitude typiques, évolution d’un chapitre à
l’autre, et ce qu’il faut savoir pour les distribuer.

### `jorkus` — Jorkus, le dieu voilé (rival, p. 195)

- **Stats :** V0 A1 E4 Au1, Init 1, Mêlée 0, Tir 0, Déf 1, vitalité 10. Vilénie 4, pouvoir 11, foi 0.
- **Carrières :** érudit 3 → Scribe, prêtre 2, sorcier 1, druide 0 (non retenu), alchimiste 1. Dague.
- **Le voile :** invulnérable tant qu’il n’est pas déchiré. Les règles du voile (livre p. 190-191) sont dans le
  commentaire de la fiche.
- **Camp :** adversaires.
- **Par partie :**
  - intro à ch. 3 : absent, en route vers l’île puis à la tête des tribus ;
  - ch. 2 : on fouille son tombeau vide et ses appartements ;
  - ch. 4 : il brise les portes de Fort Junia, couvert d’or et de sang (`hostile`). Il est invulnérable : les héros
    doivent fuir ;
  - ch. 5 : salle du trône du donjon de Fort Junia, confrontation finale (`hostile`, il s’offre aux coups).

### `lok-kozaar` — Lok Kozaar (rival, p. 196)

- **Stats :** V4 A2 E0 Au0, Init 1, Mêlée 3, Tir 0, Déf 1, vitalité 16. Vilénie 5 (3 au combat final).
- **Équipement :** hache de bataille → « Épée / hache à 2 mains », masse d’armes. Baudrier de guerre et peau dure
  (protection 3, sans armure).
- **Camp :** adversaires.
- **Par partie :**
  - intro : `neutre` (il joue le mercenaire honnête au temple) ;
  - ch. 1 et 2 : hors champ. Il élimine Amrita et envoie Kurta, puis ses hommes chez Almar de Chebeg. Il attend chez
    maître Casmar ;
  - ch. 3 : seulement cité par Samazar ;
  - ch. 4 : il a quitté Satarla avant le retour des héros, et on le voit commander l’assaut de Fort Junia (`hostile`) ;
  - ch. 5 : il dirige l’armée, sirote sa bière face à Mishart dans la salle du trône. Il ameute les renforts, puis
    négocie sa fuite ou se bat à mort.

### `hilario` — Hilario (rival, p. 196)

- **Stats :** V1 A2 E1 Au0, Init 0, Mêlée 2, Tir 1, Déf 2, vitalité 11. Ses 6 points d’héroïsme (4 au combat final)
  sont portés en vilénie.
- **Équipement :** épée, dague, armure légère, petit bouclier.
- **Camp :** adversaires, attitude `mefiant`. Il peut basculer `amical` / `heros` si on lui parle d’Albel ou de
  Matius.
- **Par partie :**
  - ch. 2 : on suit sa piste (le Poisson d’or, la taverne de L’Échange, Albel, Matius), mais il est absent ;
  - ch. 5 : on le trouve dans la chambre n° 9 du donjon de Fort Junia, ou dans la salle du trône.

### `kurta` — Kurta (rival, p. 111)

- **Stats :** V1 A2 E1 Au0, Init 1, Mêlée 2, Tir 0, Déf 2, vitalité 11. Vilénie 5 (4 au début de l’embuscade).
- **Équipement :** deux kriss halakhis → arme « Kriss » du catalogue. Arme favorite, Discret.
- **Camp :** adversaires.
- **Par partie :**
  - ch. 1 : hors champ. Il paie l’Ombre sanglante, Qirmar ne fait que l’apercevoir, et il repart avertir Lok ;
  - ch. 2 : il joue Taruk, le serviteur d’Almar de Chebeg (`hostile` une fois démasqué). Il fuit si tout tourne mal,
    mais préfère mourir que se rendre ;
  - ch. 4 : s’il a survécu, il a rejoint Lok et l’armée du dieu voilé (livre p. 141).

### `coren` — Coren (rival, p. 112)

- **Stats :** V0 A3 E1 Au0, Init 1, Mêlée 1, Tir 1, Déf 2, vitalité 10. Vilénie 5 (3 au début de l’embuscade).
- **Équipement :** dague, arbalète.
- **Camp :** adversaires.
- **Par partie :**
  - intro : le jeune homme qui accompagne Lok au temple (`neutre`) ; le livre ne le nomme pas encore ;
  - ch. 2 : il se cache dans la tourelle de la salle d’astrologie d’Almar pour ne pas être reconnu (`hostile`). Il se
    rend et négocie sa vie contre des informations.

### `megere` — Jessinda, dite la Mégère (rivale, p. 195)

- **Stats :** V0 A2 E2 Au1, Init 0, Mêlée 2, Tir 0, Déf 2, vitalité 10. Vilénie 5, foi 2, pouvoir 13 (7 ou 11 selon
  le moment de l’attaque finale).
- **Carrières :** noble 0, guérisseuse 1 → Médecin, druidesse 2 → Prêtre, sorcière 3 → Sorcier.
- **Camp :** adversaires.
- **Par partie :**
  - ch. 4 : la femme au masque de vieille qui incante près du palanquin. Son sortilège permet à Jorkus de briser les
    portes, puis elle s’effondre ;
  - ch. 5 : elle peut évoquer un azhdarkho contre la nef (créature du catalogue). Dans la salle du trône, elle est
    démasquée parmi le harem et court reprendre son masque.

### `mishart` — Mishart, druide jaune (coriace, p. 196)

- **Stats :** V0 A0 E2 Au0, Init 0, Mêlée 1, Tir 0, Déf 1, vitalité 6, foi 2. Druide 2 → Prêtre.
- **Équipement :** bâton cérémoniel empoisonné (arme propre).
- **Camp :** adversaires.
- **Par partie :**
  - ch. 4 : le vieillard héraut qui somme Fort Junia de se rendre (`hostile`) ;
  - ch. 5 : il est face à Lok dans la salle du trône et tente de fuir pour appeler à l’aide.

### `nirmus` — Nirmus (rival, fiche inventée)

- **Camp :** `heros`, `amical`. C’est le commanditaire.
- **Par partie :**
  - intro : il engage les héros ;
  - ch. 1 : cité ;
  - ch. 2 : il décrypte l’oracle avec eux et les conduit à la nécropole et aux appartements de Jorkus ;
  - ch. 4 : il reçoit les héros à leur retour d’Urceb et leur présente Embran Tarv ;
  - ch. 5 : il les accueille s’ils repassent par Satarla, et à l’épilogue.
- Le livre suggère d’en faire un PJ de remplacement (livre p. 65).

### `jia` — Jia (rivale, fiche inventée)

- **Camp :** `heros`, `amical`.
- **Par partie :**
  - intro : le comptoir, les funérailles ;
  - ch. 1 : citée ;
  - ch. 2 : elle loge les héros, les renseigne et les aide à trouver un bateau pour Urceb.
- Point d’ancrage à Satarla pendant toute la saga, et PJ de remplacement possible.

### `qirmar` — Qirmar l’alchimiste (rival)

- **Stats :** fiche inventée à partir des seules valeurs du livre (Esprit 3, alchimiste 2).
- **Camp :**
  - ch. 1 : prisonnier enchaîné dans la maison de Bekti (`amical`, à libérer) ;
  - ensuite : allié, `heros` / `amical`.
- **Par partie :**
  - ch. 2 : il fournit des potions, analyse la coupe de Jorkus et soigne Matius ;
  - ch. 4 : il a fait parler Matius et exploite les drogues des druides jaunes.

### `almar-de-chebeg` — Almar de Chebeg (rival, fiche inventée)

- Astrologue 3 → Scribe.
- **Par partie :**
  - ch. 2 : il ne paraît qu’à la fin, libéré de sa cave (`amical`). Pendant l’embuscade, c’est Solmus qui joue
    l’astrologue ;
  - ch. 3 : il conduit les héros à Urceb, auprès de Samazar (`heros`, `amical`).

### `matius` — Matius (coriace, fiche inventée)

- Non-combattant, fou. `neutre`.
- **Par partie :**
  - ch. 2 : l’hospice d’Afyra, avec Albel ;
  - ch. 4 : la conversation lucide, grâce à l’élixir de Qirmar.

### `malcar` — Malcar (rival, fiche inventée)

- **Équipement :** son « Épée de Malcar », arme alchimique de famille.
- **Camp :** `heros`.
- **Par partie :**
  - ch. 2 : capitaine de la patrouille assaillie par les morts de la nécropole. Allié de circonstance, à faire
    survivre ;
  - ch. 4 : commandant de Fort Junia. Il reste à son poste et confie son épée aux héros.

### `maben` — Maben, pilote de la nef volante (rival, fiche inventée)

- **Camp :** `heros`, `amical`.
- **Par partie :**
  - ch. 4 : le vol vers Fort Junia et la défense de la nef ;
  - ch. 5 : la recherche de l’île ; il garde la nef pendant l’exploration et l’approche de Fort Junia.
- **Variante :** le catalogue a aussi un « Pilote de nef volante de Satarla » (coriace), utile pour les deux autres
  marins des airs.

### `embran-tarv` — Embran Tarv (rival, fiche inventée)

- Oncle et ministre du roi Davym. `heros` / `amical`. Non-combattant en pratique.
- **Par partie :**
  - ch. 4 : la rencontre royale au temple ;
  - ch. 5 : le passage par Satarla (facultatif) et l’épilogue.

### `soldat-nef-volante` — Soldat de la nef volante (coriace, p. 199)

- **Camp :** `heros`.
- **Par partie :**
  - ch. 4 : cinq soldats à bord ;
  - ch. 5 : six rescapés. Deux ou trois accompagnent les héros sur l’île comme suivants (BoL p. 165).
- Une ligne de distribution = une carte : mettre `qty` à l’effectif voulu.

### `barbare-de-qush` — Barbare de Qush (coriace, p. 165 et 187)

- **Camp :** adversaires, `hostile`.
- **Par partie :**
  - ch. 4 : quinze sur les quais de Fort Junia ;
  - ch. 5 : six sur le quai de pierre du fort.
- Ils fuient en infériorité numérique. Horde : 3 à 6 cartes, effectif réel dans « En jeu ».

## Armes propres déjà définies

Une arme propre est retrouvée **par son nom** dans la bibliothèque du compte. Deux définitions différentes sous un
même nom sont interdites, entre chapitres comme entre sagas.

**Définies dans `intro.json`** (à reprendre telles quelles si un chapitre en a besoin) :

```json
{ "nom": "Sabre à l’hippocampe", "degats": "d6", "type": "M", "notes": "Arme alchimique : une fois par round, relance un 1 obtenu sur un jet de dégâts ; un 12 naturel à l'attaque devient un succès légendaire sans dépenser de point d'héroïsme. Son porteur subit le désavantage traqué (pirates des îles du Crâne, Vornor « Beau Brun »)." }
{ "nom": "Épée de Malcar", "degats": "d6", "type": "M", "notes": "Épée de famille, arme alchimique : une fois par round, relance un 1 obtenu sur un jet de dégâts." }
{ "nom": "Bâton cérémoniel empoisonné", "degats": "d6M", "type": "M", "notes": "Pointe enduite d'un poison des marais : la première attaque réussie impose un test de Vigueur Difficile (-2) ; échec = hémorragie, perte de d3 vitalité au début des trois rounds suivants." }
```

Le sabre à l’hippocampe est celui d’Amrita. Au ch. 2, Solmus le porte : reprendre exactement cette définition.

**Déjà sur le compte de Lionel** (Perle du Beshaar, *Chroniques Lémuriennes 1*). Les reprendre à l’identique si le
nom convient :

```json
{ "nom": "Sabre", "degats": "d6", "type": "M" }
{ "nom": "Cimeterre", "degats": "d6", "type": "M" }
{ "nom": "Armes diverses (piétaille)", "degats": "d3", "type": "M", "notes": "Épées, javelots, lances, coutelas de la piétaille." }
{ "nom": "Mains nues (momie)", "degats": "1", "type": "M" }
```

**Kriss.** Le kriss halakhi du livre fait d6M (+ Vigueur). La saga prend l’arme **« Kriss » du catalogue** (Mythic+,
d6M+1) et signale l’écart en commentaire. C’est le cas de Kurta, à faire de même pour les assassins du ch. 1.

## Personnages propres à un chapitre (repérés en survol)

Ils ne sont **pas** dans `intro.json`. Le chapitre indiqué les définit, avec une clé préfixée.

- **Intro :**
  - Amrita et Doros (`intro-amrita`, `intro-doros`) : morts hors champ au ch. 1. Au ch. 2, ne pas les distribuer,
    seulement les citer ;
  - le bubalus zombie, le sacrificateur, maître Almandus ;
  - Min Tan (aucune fiche).
- **Ch. 1 :**
  - messagers de Nemmereth, p. 65 ;
  - Chemdi, p. 75 ;
  - Daruk, soldats du guet d’Halakh, assassins de l’Ombre sanglante, p. 86 ;
  - Rajka et Bekti, p. 87 ;
  - Jembal, Parchak, Rassa, Drajit, Liu Liong (aucune stats). Liu Liong est cité dans l’intro mais n’apparaît qu’au
    ch. 1.
- **Ch. 2 :**
  - squelettes, momies royales, p. 96 ; momies d’enfants, p. 97 ;
  - Angus le Bubalus, p. 102 ;
  - Nobur, Bambam, Zaïra, hommes de main de Nobur, p. 106 ;
  - Solmus, p. 111 ; Roumal Jânn, p. 112 ;
  - Albel, Efradus, Sartol, maître Hirk, dame Cassa (aucune stats) ;
  - le Passeur de Nemmereth : apparition spectrale sans stats, citée dans l’intro et aux ch. 4-5. Il ne se combat pas.
- **Ch. 3 :**
  - Samazar le Magnifique : cité à la fin du ch. 2, il n’apparaît qu’au ch. 3 ;
  - démon fuligineux, p. 125 ;
  - Oda Unjab le Prêtre Rouge, Kamatt, apprentis d’Oda, p. 140 ;
  - Lothar, soldats et marins du Prêtre Rouge (dont Galor), Forgeur de Zaggath, p. 141 ;
  - le Filonier.
- **Ch. 4 :**
  - maître Casmar, le Bambin, p. 157 : cité aux ch. 2 et 5, en scène au seul ch. 4 ;
  - druides jaunes, p. 155 ; Toursa le Prince Jaune, acolytes, p. 157 ;
  - le druide voilé, le Bon Docteur, p. 158 ;
  - chasseurs grooth, Graak Deux-Crânes, p. 165.
- **Ch. 5 :**
  - macaques hurleurs, p. 174 ; blob attrapeur, p. 175 ;
  - Fangeux, p. 177, au catalogue : à référencer si le profil est identique ;
  - la parturiente maudite et ses rejetons, p. 180 ; le ver à soie corrompu, p. 183 ;
  - chef grooth, guerriers grooth, p. 190 ; gardes grooth, p. 196.
  - Les grooth du ch. 5 n’ont **pas** le profil des chasseurs grooth du ch. 4 : fiches distinctes.

## Convention pour les autres agents

- **Personnages propres à un chapitre :** clé préfixée `ch<N>-` (ex. `ch2-garde-du-guet`, `ch5-gardes-grooth`).
- **Personnages récurrents :** la clé du registre ci-dessus. Ils ne sont **jamais redéfinis** : on les cite dans la
  `distribution`, et l’import les retrouve dans `intro.json`. Une simulation (`--dry-run`) d’un chapitre exige donc
  que l’introduction ait été importée avant sur le même compte, dans la saga `dieu-voile`.
- **Un manque à une fiche récurrente** (stat erronée, nom à corriger) se corrige dans `intro.json` et se signale dans
  le rapport. On ne crée pas de doublon dans un chapitre.
- **Armes propres :** reprendre à l’identique les définitions listées plus haut. Ne pas créer d’homonyme avec des
  dégâts différents.
- **Vilénie des rivaux :** 3 quand le livre n’en donne pas, signalé en commentaire. Sinon la valeur du livre ;
  l’héroïsme d’un rival allié est porté en vilénie.
