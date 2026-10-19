# Intégrer « La Perle du Beshaar » dans l'app : compatibilité et plan

Source : `doc/scenarios/la-perle-du-beshaar/` (texte du livre *Chroniques lémuriennes 4* et fiches de
session pour les chapitres 1 et 2). Cible : le modèle **Scénario → Scènes** et le mode Théâtre de la table
(`doc/plans/2026-10-16-theatre-session-plan.md`).

## 1. Verdict de compatibilité

**Oui, le scénario est compatible.** Les fiches de session sont déjà découpées « scène par scène », et chaque
rubrique correspond à un champ de `bol_scene`. Il manque trois choses : un outil pour importer les données,
une place pour les règles de chaque scène, et la règle de horde. Ce sont des manques de confort ou de volume.
Rien ne bloque.

### Ce qui colle tel quel

| Dans le scénario | Dans l'app | Remarque |
|---|---|---|
| La saga | `bol_scenario` (titre, pitch) | Pitch : le texte de `00-presentation-generale.md`. |
| Une scène de fiche (« 2. Le temple de Shazzadion ») | `bol_scene` | Titre de 120 caractères au plus : largement suffisant. |
| Le lieu (Satarla, Malakut, Beshaar…) | `region_id` + `lieu` | **Toutes les régions de la saga existent** : Satarla, Malakut, Désert de Beshaar, Marais de Kasht, Parsool, Îles du Crâne, Zalut. |
| « Nuit de fête », « tempête de sable »… | `moment` / `meteo` | Valeurs fermées. `cendres` ou `vent` couvrent les tempêtes du désert. |
| Les encarts en italique (« *Une main sur la bouche…* ») | `lecture` (5 000 caractères au plus, `pre-line`) | Les fiches les isolent déjà. |
| « Secrets à ne jamais lâcher » (Karstus sorcier, Léhéné mi-démone) | `notes` (secret masqué par défaut, 10 000 au plus) | Ils sont parfaits ici. |
| Les embranchements (Option A/B, « parlementer / mentionner Marsus / tuer les capitaines », le choix final du ch. 2) | `pistes` (8 au plus, 200 caractères chacune, lien vers une scène du même scénario) | Les liens de piste deviennent des boutons « aller à l'acte ». |
| Les adversaires et les alliés d'une scène | `distribution` (pnj / créature / démon, `qty`, `camp`, `attitude`) | Surdral, qui se bat avec les héros, va en `camp: heros`. Marsus est `hostile` ou `neutre`. |
| Les PNJ récurrents (Surdral, Karstus, Arjanek…) | fiches PNJ de la bibliothèque | Une seule fiche par PNJ, référencée par plusieurs scènes et plusieurs chapitres. |
| Le bestiaire standard (Dinohyus, Phororacos, Cathgan, Scorpion-araignée géant) | catalogue des créatures (`user_id` nul) | Déjà semé, il suffit de le référencer. |
| La difficulté par défaut (Moyenne +0) | jets de la table | Aucun changement. |

### Ce qui coince

1. **Le volume de la frise.** La saga compte une introduction et cinq chapitres, soit 50 à 60 scènes. La frise
   des actes affiche **toutes** les scènes du scénario affiché : avec 60 pastilles, elle devient illisible. Rien
   ne regroupe des scènes en chapitres.
2. **Pas de place pour les règles d'une scène.** Les jets, les tables d'effets (les 6 effets de la mosaïque),
   les difficultés et les conseils de jeu n'ont pas de champ. `notes` est le *secret*, masqué par défaut, alors
   que le MJ consulte ces règles pendant toute la scène. `lecture`, lui, est lu aux joueurs.
3. **La règle de horde n'existe pas.** Le combat ne la gère pas, et une ligne vaut une carte (décision du
   2026-10-07). « 30 marins sur 48 » donnerait 30 cartes sur la rampe.
4. **On ne peut pas créer de scène hors de la table.** `POST /bol/scene/create` exige un `session_id` et
   photographie la table. Saisir 60 scènes et environ 40 fiches à la main serait trop long.
5. **Des statistiques sont incomplètes.**
   - Au chapitre 2, les attributs des PNJ créés pour le chapitre ont été perdus à l'extraction (la fiche le
     signale). Les chapitres 3 à 5 n'ont été que nettoyés automatiquement, pas relus.
   - **Le PDF source est hors du dépôt**, dans `~/Téléchargements/La-Perle-du-Beshaar.pdf` (146 pages). Le
     README cite `doc/La-Perle-du-Beshaar.pdf`, mais le fichier n'y est pas. Pour récupérer les stats, il faut
     extraire **avec `-layout`** : `pdftotext -layout -f <p> -l <p> …`. La colonne des blocs de stats reste
     alors alignée, et les attributs de Djaloum (ch. 2, PDF p. 58-84) se retrouvent en entier.
   - Les blocs de piétaille ne donnent que « Attaque +1 · Dégâts d3 ». Une fiche PNJ demande des attributs et
     une Mêlée ou un Tir. Règle de conversion proposée : Attaque → Mêlée (ou Tir si l'arme est à distance),
     attributs à 0.
6. **Des armes et des capacités sont hors catalogue.** Exemples d'armes : la « canne au pommeau plombé » de
   Surdral, le « sabre d6+1 ». Exemples de capacités du bestiaire du Beshaar : *Gardien éternel*, *Corps de
   sable*, *Poussière de cadavre*.
   - Armes : prendre l'arme la plus proche du catalogue et mettre le nom réel en surnom ou en note.
   - Capacités : mettre leur texte dans le `detail` d'une capacité générique.
7. **Il n'y a ni état de campagne ni objets.** Les choix d'un chapitre changent la suite : la Perle volée ou
   non, l'alliance avec la slorth. Les objets remis (Larme de la nuit, pendentif kashtien, coffret capitonné) et
   la récompense de fin de chapitre (héroïsme récupéré, +1 XP) n'ont pas non plus de support. **Ce n'est pas
   bloquant** : ils vont dans le secret ou les pistes de la dernière scène de chaque chapitre.
8. **Il n'y a ni table aléatoire ni voyage.** Rien ne gère les rencontres du Beshaar (2d6) ni la traversée sur
   plusieurs jours (soif, chaleur). Ces règles vont dans le champ de règles du point 2, ou restent dans le
   Markdown.
9. **Il n'y a pas d'illustrations.** Le PDF n'est pas là et ses illustrations sont protégées. `image` reste vide
   ou reçoit des images générées (voir `doc/header-image-prompts.md`).

### Droits

*La Perle du Beshaar* est un supplément du commerce. Toutes les données importées (scénario, scènes, PNJ,
créatures propres au scénario) appartiennent à **l'utilisateur** (`user_id` = le compte de Lionel). **Jamais au
catalogue** (`user_id` nul), qui est visible de tous les comptes. Le format d'import (lot 1) ne doit donc pas
permettre d'écrire dans le catalogue.

## 2. Décisions

- **Un scénario par chapitre** : « Perle du Beshaar — Introduction & 1. Sacrilège à Satarla »,
  « Perle du Beshaar — 2. De sable et d'eau », etc. Le découpage correspond à « une séance (ou deux) = un
  chapitre », comme les fiches de session. Il règle le point 1 sans développement et garde la frise à 8 à
  12 actes. Si le besoin se fait sentir, un regroupement « saga » viendra plus tard ; ce n'est pas l'objet ici.
- **Import par fichier de données**, pas par saisie à la main : une commande artisan lit un JSON par chapitre,
  écrit à la main (ou par Claude) à partir des fiches de session. Elle resservira pour d'autres scénarios.
- **Un champ « En jeu »** sur la scène pour les règles (point 2). Il est visible en permanence dans la colonne
  de lecture, entre « À lire aux joueurs » et « Secret du MJ ».
- **Pas de règle de horde pour l'instant** : 3 à 6 cartes de piétaille représentent la horde, et l'effectif réel
  est noté dans « En jeu ». La horde fera l'objet d'un chantier à part si elle manque en partie.

## 3. Plan

### Lot 1 — Champ « En jeu » sur la scène (back + front, petit) — fait le 2026-10-19

Pas de test PHPUnit pour la mise à jour : les tests du dépôt sont sans base. La sauvegarde est couverte par
`npm run e2e:theatre` (étape 4 bis).

- Migration : `bol_scene.jeu` (`text`, nullable), placé après `lecture`.
- `BolScene::$fillable`, la validation de `BolSceneController::update` (`sometimes|nullable|string|max:10000`)
  et `BolSceneService::update` (liste des champs modifiables).
- Front :
  - `BolSceneModel.jeu`, `BolSceneChanges.jeu` ;
  - une zone de texte dans `scene-editor-dialog` ;
  - un bloc « En jeu » (icône `casino`) dans `scene-lecture.html`, avec le même rendu `pre-line` que la lecture.
- Tests : PHPUnit sur la validation et la mise à jour ; Vitest sur `scene-lecture` (bloc présent si `jeu`
  est rempli, absent sinon).

### Lot 2 — Format d'import et commande `bol:import-scenario` (back) — fait le 2026-10-19

Le format et l'usage sont décrits dans `doc/scenarios/format-import.md`. Les décisions prises à l'exécution
remplacent la première version de ce plan :

- **Une saga.** Chaque fichier déclare une `saga`. Un personnage défini dans un chapitre (Surdral au ch. 1)
  se reprend dans un autre par sa seule clé, sans être redéfini.
- **Réimport = mise à jour.** Ce n'est pas `--replace`. La table `bol_import_ref` (user, saga, type, clé →
  entité) retrouve ce que l'import précédent a créé.
  - Scénario, fiches et scènes sont mis à jour sur place, et les ids ne bougent pas : les sessions qui ont
    chargé une scène la gardent.
  - Les scènes retirées du fichier sont supprimées.
- **Un PNJ = une carte.** `qty` sur un PNJ donne autant d'entrées de distribution. Sur une créature ou un
  démon, c'est un lot.
- **Armes propres au scénario.** Un objet `{nom, degats, type}` crée une arme dans la bibliothèque du compte.
  Une chaîne désigne une arme du catalogue.
- **Code :**
  - `BolScenarioImportPlan` : contrôle pur, sans base, avec toutes les erreurs et leur chemin ;
  - `BolImportCatalog` : noms → ids ;
  - `BolScenarioImporter` : écriture en transaction ;
  - `App\Console\Commands\BolImportScenario` (`--user` obligatoire, `--dry-run`).
- **Tests et recette :**
  - `tests/Unit/BolScenarioImportPlanTest.php` (7 tests) ;
  - recette dans le conteneur sur le compte de test : import, simulation, réimport avec scène retirée,
    personnage repris d'un 2ᵉ chapitre, personnage inconnu refusé avec annulation complète, scène chargée sur
    une table et vue dans le Théâtre ; données de test supprimées ensuite.
- **Reste à faire si le besoin apparaît** : une option pour supprimer un import (scénario, scènes et fiches
  créées).

### Lot 3 — Chapitre 1 en données (contenu) — fait le 2026-10-19

Fichier : `doc/scenarios/la-perle-du-beshaar/app/ch1.json`, importé sur le compte de Lionel (`bogomit@gmail.com`).

- **Stats.** Surdral, Arjanek et Karstus viennent du chapitre 4 (PDF p. 103 et 123, `pdftotext -layout`).
  Marsus n'a pas de stats dans le livre : sa fiche de rival est inventée et le dit dans son commentaire.
- **Écarts au catalogue :**
  - « tentateur » devient Tentatrice ;
  - Érudit et Druide de Karstus ne sont pas au catalogue : ils sont notés dans son commentaire ;
  - les dégâts des armes sont ceux de base, car le livre inclut la Vigueur ;
  - armes créées : Canne plombée, Sabre, Armes de marin.
- **Points de Surdral.** Ses 5 points d'héroïsme sont portés en vilénie, la réserve d'un rival dans l'app.
- **Recette** sur le compte de test :
  - 10 actes dans la frise, qui défile à 1440 px ;
  - quatre scènes chargées sans entrée ignorée ;
  - fiche de Surdral ouverte dans le formulaire PNJ ;
  - aucune erreur console ;
  - données supprimées ensuite.

Le détail des scènes prévu au départ :

Source fiable : textes relus à la main, `chapter-one/01-fiche-de-session.md`.

**Scènes** : 10 scènes, numérotées de 0 à 9 comme dans la fiche.

| # | Scène | Région / lieu | Distribution | Pistes |
|---|---|---|---|---|
| 0 | La taverne de Marsus | Satarla, Cloaque | Marsus (hostile), Surdral (neutre) | → 1 |
| 1 | Trajet jusqu'au temple | Satarla | — | → 2 |
| 2 | Le temple de Shazzadion | Satarla, île d'Ajamba | 2 prêtres | → 3 |
| 3 | Le sanctuaire interdit | idem | — (prêtres en renfort : d6B rounds, dans « En jeu ») | → 4 |
| 4 | Les gardiens s'éveillent | idem | tentacules, hippocampes géants (créatures propres) | → 5 |
| 5 | Fuite et embarquement | Satarla, quai du Pendu | Surdral (allié) | → 6 |
| 6 | La nuit du coup fourré | en mer (Satarla) | Gallus, Tertus, marins (×5, horde de 30 dans « En jeu »), Surdral (allié) | parlementer / Marsus / tuer → 7 |
| 7 | Arrivée à Malakut | Malakut | — (Léhéné dans le secret) | → 8 |
| 8 | Rencontre avec maître Arjanek | Malakut | Arjanek, Karstus (secret) | → 9 |
| 9 | La proposition et les préparatifs | Malakut | Arjanek, Surdral | → scénario du chapitre 2 (piste en texte seul : une piste ne lie qu'au même scénario) |

**Personnages à créer** (environ 9) :

- PNJ : Marsus, Surdral, Arjanek, Karstus, Gallus, Tertus, prêtre de Shazzadion, marin ;
- créatures : tentacule de la mosaïque, hippocampe géant.

Les stats viennent de `04-chapitre1-…md`. Quand le livre n'en donne pas (Marsus, Arjanek), on crée une fiche
« rival » minimale et on le signale dans le JSON.

**Recette** :

1. Importer sur le compte de test `claude-test@example.com`, ouvrir une session et dérouler les 10 actes dans
   le Théâtre (frise, aperçu, lever de rideau, pistes cliquables, secret, « En jeu ») ;
2. lancer un combat à la scène 6 ;
3. supprimer l'import de test.

### Lot 4 — Chapitre 2 — fait le 2026-10-19

Fichier : `doc/scenarios/la-perle-du-beshaar/app/ch2.json`, importé sur le compte de Lionel.

- **Scènes : 14.** Quatre scènes de prologue (route, dinohyus, Badhasar, traversée avec la table 2d6 dans
  « En jeu »), puis les 10 scènes de la fiche de session. La branche « rester » est la scène 14.
- **Personnages :** 10 PNJ et 7 créatures, plus 4 créatures du catalogue. Karstus est repris du ch. 1 par sa
  clé.
  - Ilémah et Beckéram ont des fiches distinctes, aux stats identiques, pour qu'on distingue les camps sur la
    rampe.
  - Les bêtes des rencontres aléatoires sont créées sans être distribuées : elles attendent dans les
    coulisses.
- **Écarts au livre :**
  - Djidaâ prend la taille « Grande » pour avoir le rang de rivale ;
  - le crabe de sable a 99 de vitalité (le livre : aucune) ;
  - les 5 points d'héroïsme de Djaloum sont portés en vilénie ;
  - les fossoyeurs prennent le profil des villageois nata urdu.
- **Fiche de session corrigée.** Elle a les vraies stats, issues du PDF, et le bestiaire des rencontres.
  Correction : Karstus enlève Marika et torture une domestique, il ne torture pas la servante de Marika.
- **Recette** sur le compte de test (ch. 1 puis ch. 2) :
  - 14 scènes chargées sans entrée ignorée ;
  - Karstus résolu depuis le ch. 1 ; sans le ch. 1, l'import est refusé ;
  - aucune erreur console ;
  - données supprimées ensuite.
- **Défaut relevé :** la frise ne fait pas défiler l'acte en cours dans la vue. À l'acte 14, son titre est
  hors champ.

Notes de départ :

- `chapter-two/01-fiche-de-session.md` donne déjà 10 scènes et leurs embranchements.
- Les attributs perdus se reprennent dans le PDF (`pdftotext -layout`, PDF p. 58-84) : pillards, guerriers
  beshaaris, Djaloum, Shammaz, Djidaâ et ses filles, crabe de sable. Il faut aussi corriger le tableau
  « PNJ créés pour ce chapitre » de la fiche de session.
- Les créatures propres au Beshaar viennent de `07-cadre-bestiaire-du-beshaar.md`, en relisant le bloc de stats
  de chacune.
- La table des rencontres aléatoires (2d6) va dans le « En jeu » de la scène « Traverser le désert ».

### Lot 5 — Chapitres 3 à 5 et annexe — fait le 2026-10-19

- **Fiches de session** écrites en relisant le texte avec le PDF (`pdftotext -layout`) :
  `chapter-three/`, `chapter-four/` (qui intègre l'annexe des saltimbanques de Kutas) et `chapter-five/`.
  Toutes les stats perdues dans les Markdown bruts y sont rétablies.
- **Fichiers** `app/ch3.json` (9 scènes), `app/ch4.json` (15 scènes, trois options de départ dans « En jeu »)
  et `app/ch5.json` (9 scènes). Ils sont importés sur le compte de Lionel.
- **Personnages repris des chapitres précédents par leur clé** :
  - Surdral, Arjanek, Karstus, le prêtre de Shazzadion (ch. 1) ;
  - les villageois nata urdu (ch. 2) ;
  - le druide noir (ch. 4).
- **Démons** : Ghashtalarann, limier et piqueur de Bazaal Dûl, idole d'Upok-N'Mee, Ilirk. Les pouvoirs hors
  catalogue sont dans le commentaire.
- **Écarts** :
  - les carrières druide, érudit, astrologue et pêcheur sont absentes du catalogue (notées en commentaire) ;
  - « pirate » devient Marin, « acrobate » Danseur, « courtisane » Tentatrice, « magicien » Sorcier ;
  - Dazzandroth a une défense de 5, démons de l'éther compris ;
  - les points d'héroïsme des PNJ sont portés en vilénie.
- **Recette** : chaque chapitre a été chargé scène par scène sur le compte de test (aucune entrée ignorée,
  aucune erreur console), avec des captures du Théâtre. Données de test supprimées ensuite.
- **Bilan sur le compte de Lionel** : 5 scénarios, 57 scènes, 62 personnages référencés.

Notes de départ :

Pour chaque chapitre, dans l'ordre :

1. relire le Markdown à la main (encarts déplacés), avec le PDF ;
2. écrire la fiche de session sur le modèle des chapitres 1 et 2 ;
3. écrire le JSON ;
4. importer.

Le chapitre 4 est le plus chargé (11 blocs de stats). Le chapitre 5 fait intervenir des factions (Parsool,
pirates, galère de Zalut) qui pourront avoir leurs propres scènes d'alliance.

### Hors périmètre (à rouvrir si le besoin apparaît en jeu)

- Règle de horde au combat.
- Regroupement de plusieurs scénarios en une saga dans la frise.
- État de campagne : choix faits, objets remis aux héros.
- Tables aléatoires lançables depuis la table.
- Illustrations des scènes.

## 4. Ordre conseillé

Tous les lots sont faits (2026-10-19) : la saga complète est jouable depuis l'app.
