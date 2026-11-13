# Les jets d'une scène — analyse

Date : 2026-11-13. Statut : conception validée (approche A, décisions ci-dessous) ; plan : `2026-11-13-jets-de-scene-plan.md`.

## La demande

« En jeu » mélange tout et se lit mal en pleine partie. Ce que le MJ cherche pendant une scène, c'est **la liste des jets à faire** :
quel attribut, quelle difficulté, ce qui arrive si ça rate. Il faudrait :

1. que ces jets soient **clairement visibles** à la table ;
2. pouvoir les **saisir sous une forme structurée** en préparant une scène ;
3. **reprendre les scénarios** existants dans ce nouveau format (fichiers d'import et scènes déjà en base).

## L'existant

- **Stockage** : `bol_scene.jeu`, un texte libre de 10 000 caractères au plus (`BolSceneController`, `BolSceneService`), rempli à la main
  dans « Préparer la scène » (onglet « En jeu », une `textarea`) ou par l'import (`"jeu": "…"`, `format-import.md`).
- **À la table** : un onglet « En jeu » du carnet (`bol-scene-lecture`), le texte tel quel dans un paragraphe (`lec-jeu`), sans mise
  en forme.
- **Les jets à la table** : le panneau de jet d'action d'un héros (`action-roll-panel`) sait déjà tout faire — attribut, carrière,
  difficulté (échelle du livre), dés de bonus et de malus, héroïsme. Mais il s'ouvre vide : le MJ doit relire « En jeu » puis
  recopier l'attribut et la difficulté à la main.
- **Les scénarios importés** : 216 scènes ont un « En jeu », de 1 000 caractères en médiane (3 000 au plus). 99 d'entre elles citent
  un jet, 184 phrases en tout (Dieu voilé 83, Chroniques 52, Perle 49), dont seulement 38 avec une difficulté chiffrée.

### Ce que contient vraiment « En jeu »

Le texte de la scène « Les gardiens s'éveillent » (Perle, ch. 1) mélange en fait cinq sortes de choses :

| Sorte | Exemple | Où ça devrait vivre |
| --- | --- | --- |
| **Un jet** : un attribut, une difficulté, un enjeu | « Coquillage : Vigueur Ardue (-1) pour dégager sa jambe » | **la nouvelle liste des jets** |
| **Un effet sans jet** : dégâts ou conséquence automatiques | « Poissons volants : d3 dégâts automatiques, puis à chaque round… » | la liste des jets, comme un piège sans jet |
| **Un adversaire** et ses chiffres | « Tentacules : Att +2, dégâts d6, 6 PV » | **la distribution** : ce sont des fiches (planche CS4), le texte redit leur statbloc |
| **Une consigne au MJ** | « Piocher 2 ou 3 effets ; garder les hippocampes pour la fin » | reste dans « En jeu » |
| **Une description** : salles, plans, PNJ secondaires | les salles 1 à 15 de la tour d'Ajhaskar | reste dans « En jeu » |

Les jets sont donc une partie seulement d'« En jeu ». Il ne s'agit pas de remplacer le texte, mais d'**en sortir les jets** dans une liste
à part, et de laisser à « En jeu » les consignes et les descriptions.

### Incohérences relevées en passant

- Libellés de difficulté au masculin dans les textes (« Ardu », « Moyen ») ; le livre et l'app disent « Ardue », « Moyenne »
  (`rules/02-actions-combat.md`).
- Une difficulté fausse : « Difficile (-4) » une fois (c'est -2 ; -4 est « Très difficile »).
- « Réaction » cité comme un attribut (« Réaction Ardu (-1) pour ne pas tomber ») : il n'existe pas dans BoL. Le livre dit « jet de
  réaction » ; hors combat, c'est un jet d'Esprit (voir « Décisions »).

## Ce qu'est un jet

Une proposition de modèle, au plus simple qui couvre les exemples :

| Champ | Contenu | Exemple (le coquillage) |
| --- | --- | --- |
| `titre` | l'obstacle ou le déclencheur, court | « Coquillage » |
| `attributs` | un ou deux parmi Vigueur, Agilité, Esprit, Aura (« au choix »), ou aucun pour un effet automatique ; jamais Mêlée, Tir ou Défense (voir « Décisions ») | Vigueur |
| `difficulte` | un cran de l'échelle du livre (Très facile +2 … Héroïque -8), Moyenne par défaut | Ardue (-1) |
| `carriere` | facultatif : la carrière qui aide, en texte libre (« Marin », « Voleur ») | — |
| `enjeu` | ce qu'on tente, en une phrase | « dégager sa jambe » |
| `echec` | ce qui arrive si ça rate (dégâts, état, suite) | « le pied reste pris ; capture possible » |
| `reussite` | facultatif : ce qui arrive si ça réussit, quand ce n'est pas évident | — |
| `quand` | facultatif : le moment ou la condition | « en dernier, quand les héros vont sortir » |

Les jets d'une scène forment une **liste ordonnée** (`bol_scene.jets`, une colonne JSON comme `pistes` et `distribution`). Une limite
raisonnable : 20 jets par scène, 300 caractères par champ texte.

Ce qui reste hors du modèle, volontairement :

- **les adversaires** : leurs chiffres sont dans leur fiche, et la fiche est dans la distribution. Un jet peut citer « Tentacules », mais
  pas recopier « Att +2, 6 PV » ;
- **les tables aléatoires** (« piocher 2 ou 3 effets ») : c'est une consigne, elle reste dans « En jeu ».

La scène des gardiens deviendrait :

| Titre | Jet | Échec | Quand |
| --- | --- | --- | --- |
| Tentacules | Vigueur ou Agilité, Moyenne | emprisonné | — |
| Coquillage | Vigueur, Ardue (-1) | le pied reste pris | — |
| Poissons volants | aucun jet | d3 dégâts, puis à chaque round les pieds dans l'eau | — |
| Trou dans la mosaïque | Esprit, Moyenne (le repérer) | aspiré : Vigueur Ardue (-1) pour remonter | si le joueur regarde où il marche |
| Algues | Esprit, Ardue (-1) | tombe ; d3 rounds pour se dégager | — |
| Hippocampes | — (combat) | la conque sonne : l'intrusion est connue | en dernier, à la sortie |

Le trou dans la mosaïque montre la limite du modèle : **deux jets enchaînés** (repérer, puis remonter). Il y a deux réponses possibles :
deux lignes, ou un champ `ensuite` qui renvoie au jet suivant. Deux lignes suffisent probablement.

## Les approches

### A. Une liste structurée à côté d'« En jeu » (recommandée)

- Une colonne `jets` (JSON) sur `bol_scene` ; « En jeu » reste un texte libre pour le reste.
- Saisie : un onglet « Jets » dans « Préparer la scène », une ligne par jet, comme les pistes (titre, attributs en bascules,
  difficulté en liste, enjeu, échec ; les champs facultatifs repliés).
- Table : un onglet « Jets » dans le carnet, avant « Mise en scène » (l’ancien « En jeu »), en liste compacte.
- Import : `"jets": [...]` dans le format des scénarios.
- **Pour** : les jets deviennent des données. On peut les afficher en badges, les trier, et surtout **préremplir le panneau de jet**
  d'un héros. La validation est simple et l'import vérifiable.
- **Contre** : la saisie demande plus d'effort qu'un texte, et il faut reprendre les 216 scènes.

### B. Une mise en forme légère dans le texte

- Une convention d'écriture dans « En jeu », par exemple une ligne qui commence par `Jet :`, ou la forme
  `[Vigueur Ardue] Coquillage : …`, que l'app repère et affiche en badges.
- **Pour** : rien à changer dans la base ni dans l'import, et la saisie reste au clavier.
- **Contre** : c'est fragile, puisqu'une faute de frappe fait disparaître le jet. On ne valide rien, et le préremplissage du panneau de
  jet reste incertain. Les 216 scènes sont à reprendre de toute façon pour adopter la convention.

### C. A, plus un repérage automatique pour la reprise

- A comme modèle ; pour la reprise, un script propose une liste de jets à partir du texte (phrases qui citent un attribut et une
  difficulté), que le MJ relit et corrige avant l'import.
- C'est A, avec un outil pour la reprise : ce n'est pas un troisième modèle.

**Recommandation : A, avec le script de C pour la reprise.** B est tentante parce qu'elle ne touche à rien, mais elle ne permet pas ce
qui compte vraiment à la table : cliquer sur un jet pour le lancer avec le bon attribut et la bonne difficulté.

## À la table

L'onglet « Jets » du carnet, avant « Mise en scène » (l’ancien « En jeu ») :

```
JETS DE LA SCÈNE                                              6
┌──────────────────────────────────────────────────────────────┐
│ Coquillage            [VIGUEUR] [ARDUE −1]      Lancer pour ▾ │
│ dégager sa jambe · échec : le pied reste pris                 │
├──────────────────────────────────────────────────────────────┤
│ Trou dans la mosaïque [ESPRIT] [MOYENNE]        Lancer pour ▾ │
│ si le joueur regarde où il marche · échec : aspiré            │
├──────────────────────────────────────────────────────────────┤
│ Poissons volants      [SANS JET]                              │
│ d3 dégâts, puis à chaque round les pieds dans l'eau           │
└──────────────────────────────────────────────────────────────┘
```

- **Lancer pour ▾** ouvre la liste des héros de la compagnie. En choisir un ouvre son panneau de jet d'action **avec l'attribut et la
  difficulté déjà réglés**. Le MJ n'a plus qu'à ajouter la carrière et lancer. Pour un jet « au choix » (Vigueur ou Agilité), le panneau
  propose les deux et prend le meilleur du héros par défaut.
- Un jet sans attribut (un effet automatique) n'a pas de bouton.

## Dans « Préparer la scène »

- Un onglet « Jets » à côté de « En jeu » et des pistes, avec une ligne par jet et « Ajouter un jet ».
- Chaque ligne : le titre, les attributs en bascules (`aria-pressed`, au plus deux), la difficulté dans une liste (l'échelle du livre,
  Moyenne par défaut), l'enjeu et l'échec. « Plus » déplie la carrière, la réussite et le moment.
- Monter, descendre, supprimer, comme les pistes.
- L'onglet « En jeu » devient « Mise en scène », et son aide : « Comment jouer la scène : les consignes et les lieux ; les jets ont leur
  onglet. »

## L'import des scénarios

Dans `format-import.md`, à côté de `jeu` :

```jsonc
"jets": [
  {
    "titre": "Coquillage",
    "attributs": ["vigueur"],          // vigueur | agilite | esprit | aura ; [] pour un effet sans jet
    "difficulte": "ardue",             // tres-facile | facile | moyenne | ardue | difficile | tres-difficile | impossible | heroique
    "enjeu": "dégager sa jambe",
    "echec": "le pied reste pris"
  }
]
```

- C'est facultatif : un fichier sans `jets` s'importe comme aujourd'hui.
- Un attribut ou une difficulté inconnus refusent l'import, avec le chemin de l'erreur, comme pour le reste du format.
- Un réimport remplace les jets de la scène, comme il remplace son texte aujourd'hui.

## La reprise des scénarios existants

1. **Un script d'extraction** (dans `doc/bol/scenarios/`, hors de l'app) lit les `jeu` des fichiers JSON. Il propose un `jets` par
   scène à partir des phrases qui citent un attribut, et normalise les difficultés (« Ardu » → `ardue`, sans difficulté → `moyenne`). Il
   signale ce qu'il ne sait pas trancher : deux attributs, deux jets enchaînés ; « réaction » devient Esprit. Il ignore les phrases de combat (Mêlée,
   Tir, Défense, « Att + n ») : ce ne sont pas des jets de la liste.
2. **La relecture, saga par saga**, dans les fichiers JSON : garder, corriger, compléter l'échec, puis retirer de `jeu` les phrases
   devenues des jets. Il y a 99 scènes à revoir (184 phrases) ; les 117 autres n'ont pas de jet.
3. **Le réimport** des chapitres, dans l'ordre (`bol:import-scenario`). Attention : un réimport écrase les scènes modifiées dans l'app
   depuis.

Le script ne fait qu'une proposition : sur 184 phrases, seules 38 ont une difficulté chiffrée. Les autres demandent une décision du MJ,
souvent « Moyenne ».

## Décisions

- **Pas de jets de combat dans la liste** (Lionel, 2026-11-13) : Mêlée, Tir et Défense relèvent des combats, menés à la table par
  l'écran de combat. Un jet de la liste ne porte que sur Vigueur, Agilité, Esprit ou Aura. Les phrases d'« En jeu » qui donnent des
  chiffres de combat (« Att +2 », « Défense 1 ») concernent les adversaires de la distribution : la reprise ne les change pas en jets.

- **« Réaction » hors combat n'est pas l'Initiative** (Lionel, 2026-11-13) : le seul cas, les algues de « Les gardiens
  s'éveillent » (le livre : « Jet de réaction Ardu (-1) pour éviter de s'affaler »), devient un jet d'Esprit Ardue (-1), l'attribut du
  jet de réaction, sans l'Initiative. Pas de sorte de jet « Réaction » dans la liste.

- **On ne coche pas les jets** à la table pour le moment (Lionel, 2026-11-13) : on les voit et on les lance.
- **La reprise commence par un scénario** (Lionel, 2026-11-13) : la Perle du Beshaar (5 chapitres, 49 phrases de jets), celle de
  l'exemple ; les autres suivent une fois le format validé.
- **« En jeu » devient « Mise en scène »** (Lionel, 2026-11-13) : il ne garde que la façon de jouer la scène, les consignes
  au MJ et les lieux. Les onglets du carnet : « À lire aux joueurs », « Jets », « Mise en scène », « Secret du MJ ». Le champ garde son
  nom en base et dans l'import (`jeu`), seul le libellé change.

## Découpage possible

| Étape | Contenu | Effort |
| --- | --- | --- |
| 1 | Modèle `jets` (migration, validation, API), format d'import, tests back | S |
| 2 | Onglet « Jets » dans « Préparer la scène » | M |
| 3 | Onglet « Jets » du carnet à la table, « Lancer pour » vers le panneau de jet prérempli | M |
| 4 | Script d'extraction, relecture et réimport de la Perle du Beshaar pour valider | M |
| 5 | Reprise des deux autres scénarios (Dieu voilé, Chroniques) | L (relecture) |
