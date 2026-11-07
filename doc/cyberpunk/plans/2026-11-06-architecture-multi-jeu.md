# Cyberpunk RED dans Diceway — architecture et plan

Date : 2026-11-06. Statut : étapes 1 et 2 terminées (2026-11-06 et 2026-11-07) ; étape 3 (écrans) à lancer.

## Pourquoi

Diceway ne connaît qu'un jeu, Barbarians of Lemuria. Tout y est préfixé `Bol` : 37 modèles, 18 contrôleurs, 27 services, 112 migrations,
les routes `/api/bol/...`, la zone front `front/src/app/bol/`. Les règles et les données de Cyberpunk RED sont prêtes
(`doc/cyberpunk/rules/`, `doc/cyberpunk/resources/`). Il faut décider comment le second jeu s'installe **à côté** du premier, sans dupliquer
l'application ni tordre les écrans de BoL.

## Principe

**Deux jeux côte à côte, une même coquille.** Cyberpunk reprend le patron de BoL avec son propre préfixe (`cpr`), et partage ce qui ne
dépend d'aucun jeu : comptes, authentification, portraits, propriété des fiches, primitives d'interface, habillage. On ne factorise pas
BoL en amont : on extrait une pièce commune seulement au moment où Cyberpunk en a besoin, et seulement si elle est vraiment neutre.

## Ce qui est partagé

| Pièce | Où | Ce qu'il faut faire |
| --- | --- | --- |
| Comptes, Sanctum, Google OAuth | `App\Models\User`, `Auth\*`, `core/auth/` | rien |
| Propriété des fiches (`accessibleTo`, catalogue `user_id` null) | `App\Traits\AccessibleToUser` | rien, le trait est déjà neutre |
| Politique « catalogue ou fiche du compte » | `App\Policies\Bol\CatalogEntryPolicy` | la déplacer vers `App\Policies\CatalogEntryPolicy` quand la première politique Cyberpunk en hérite |
| Portraits en fichiers | `App\Traits\HasPortrait`, `BolPortraits`, `/api/bol/portraits/...` | réutiliser tel quel au début (le service range des fichiers, il ne sait rien de BoL) ; renommer route et service en neutre plus tard, avec un alias pour les adresses déjà stockées |
| Primitives d'interface | `front/src/app/shared/` (`dw-tag`, `dw-panel`, `dw-library-header`, `dw-library-toolbar`, `dw-statblock-dialog`, `value-stepper`…) | rien, à réutiliser |
| Habillage « forge » | `front/src/styles/` | rien au début ; une teinte propre à Cyberpunk pourra venir plus tard en jetons |
| Dés | `shared/dice-3d`, `die-face`, `roll-sum` | à vérifier : Cyberpunk lance surtout `1d10` et des `Nd6` |

## Ce qui est propre au jeu

| Couche | BoL (existant) | Cyberpunk (à créer) |
| --- | --- | --- |
| Tables | `bol_*` | `cpr_*` |
| Modèles | `App\Models\Bol\Bol*` | `App\Models\Cpr\Cpr*` |
| Services | `App\Http\Services\Bol\` | `App\Http\Services\Cpr\` |
| Contrôleurs | `App\Http\Controllers\Bol\` | `App\Http\Controllers\Cpr\` |
| Politiques | `App\Policies\Bol\` | `App\Policies\Cpr\` |
| Routes API | `/api/bol/...` | `/api/cpr/...` (dans le même groupe `auth:sanctum`) |
| Tests | `tests/Feature/Bol*`, `tests/Unit/Bol*` | `tests/Feature/Cpr*`, `tests/Unit/Cpr*` |
| Front | `front/src/app/bol/`, routes à la racine (`/`, `/create/hero`, `/library/...`) | `front/src/app/cpr/`, routes sous `/cpr/...` |
| Types front | `front/src/app/bol/models/bol-*.model.ts` | `front/src/app/cpr/models/cpr-*.model.ts` |

Les routes de BoL restent à la racine : on ne les déplace pas (liens, favoris, `returnUrl`). Seul Cyberpunk a un préfixe.

Le chemin `bol/` reste celui des types d'une zone BoL ; `CLAUDE.md` gagnera une section Cyberpunk qui reprend les conventions
(préfixe, zones `front/src/app/cpr/<zone>/models/`).

## Données de référence : fichiers de données, ids fixes

Chez BoL, les premières données de référence sont venues de seeders lancés à la main (`DatabaseSeeder` ne les appelle pas), avec des ids
fixes : les images sur disque portent l'id de leur ligne (`/assets/bol/bestiary/<id>.jpg`). Les corrections suivantes sont passées par des
migrations idempotentes (`add_mythic_plus_reference_data`, `fix_reference_data_from_rulebook_audit`).

**Pour Cyberpunk, les lignes du livre sont dans `backend/database/data/cpr/<table>.php`**, une ligne par enregistrement, chacune avec
son `id` fixe. Ces fichiers sont la seule source : `CprReferenceCatalogue` les lit, les migrations l'appellent pour remplir leurs tables, la
commande `php artisan cpr:reference` aussi. Conséquences :

- sur chaque poste, `php artisan migrate` suffit (pas de seeder à se rappeler) ;
- les tests (`RefreshDatabase`, SQLite en mémoire) ont les données sans rien faire ;
- **une correction** : modifier le fichier, puis `php artisan cpr:reference` (option `--dry-run` pour voir ce qui changerait, tables en
  argument pour n'en traiter que certaines). La commande met à jour par id, ajoute les lignes nouvelles, ne supprime jamais rien (des fiches
  peuvent citer une ligne) et signale les lignes du livre qui ne sont plus dans leur fichier ; elle vide le cache ;
- **un id ne change ni ne se réutilise** : une ligne ajoutée prend l'id suivant de son fichier. Les images se rangent sous cet id, par
  exemple `front/src/assets/cpr/cyber/<id>.webp` pour `cpr_cyber` ;
- les lignes du catalogue ont `user_id` null ; chaque table de catalogue garde une colonne `user_id` pour accueillir plus tard les objets
  créés par un compte (comme `bol_arme`). Leurs ids commencent à 10 000 (`CprReferenceCatalogue::ID_DES_COMPTES`, posé par la
  synchronisation) : le livre reste en dessous, et un ajout du livre ne tombe jamais sur un objet de compte.

Les données servies au front sont mises en cache comme `BolReferenceData` (un `CprReferenceData`, clés `cpr_*`, vidées par la
synchronisation et par le `down` des migrations).

## Étapes

### Étape 1 — les tables de référence (le prochain chantier)

Livrable : les tables du catalogue Cyberpunk, remplies, avec leurs modèles, une API en lecture et des tests qui comparent les données
au livre. Aucun écran.

| Table | Contenu | Lignes | Source |
| --- | --- | --- | --- |
| `cpr_role` | les 10 rôles : code, nom, capacité de rôle, résumé | 10 | `rules/03` |
| `cpr_competence` | nom, CARAC liée, catégorie, coût (1 ou 2), compétence de base, à spécialité (langue, science, instrument, guide local, art martial), réservée à un rôle (Chirurgie, Techniques médicales) | 68 | `rules/02` |
| `cpr_role_competence` | les 20 compétences de chaque rôle et leur niveau au Rat des Rues | 200 | `resources/roles.md` |
| `cpr_role_profil` | les tables de CARAC : rôle, jet (1-10), 10 CARAC | 100 | `resources/roles.md` |
| `cpr_arme` | classes d'armes et armes exotiques : catégorie (mêlée, distance, exotique), compétence, dégâts, chargeur, munition, Att/round, mains, dissimulable, prix, traits (JSON), règles particulières | 15 + 14 | `resources/armes.md` |
| `cpr_munition` | les 13 types : prix, types d'armes compatibles (JSON), effet | 13 | `resources/armes.md` |
| `cpr_accessoire` | accessoires d'armes : prix, emplacements, armes compatibles, effet | 8 | `resources/armes.md` |
| `cpr_armure` | armures et boucliers : PA ou PS, pénalité, prix, couvre tête et corps d'un coup (combinaison connectée) | 9 + 1 | `resources/armures.md` |
| `cpr_cyber` | le catalogue des implants : catégorie, pièce mère requise (référence vers une autre ligne), pose, emplacements occupés, emplacements fournis, couplé, PH fixe, dés de PH, prix, effet, bonus structurés (JSON : compétence, valeur) | ~85 | `resources/cybermateriel.md` |
| `cpr_equipement` | équipement général : prix, description, bonus structurés | ~60 | `resources/equipement.md` |
| `cpr_vetement` | prix par style et par pièce | 10 × 9 | `resources/equipement.md` |
| `cpr_drogue` | les 5 drogues : durée, SD de l'effet secondaire, prix, effets | 5 | `rules/05` |
| `cpr_programme` | programmes et GLACE : classe, ATT, DÉF, REZ, PER, VIT, emplacements, effet, prix | 15 + 12 | `rules/07` |
| `cpr_materiel_net` | matériel de cyberconsole : emplacements, effet, prix | 6 | `rules/07` |
| `cpr_vehicule` | PDS, places, MOUV, vitesse, prix | 14 | `rules/04` |
| `cpr_role_dotation` | équipement de départ par rôle : objet (référence polymorphe vers arme, armure, équipement, cyber, programme, munition), quantité, groupe d'alternative pour les « ou » | ~150 | `resources/roles.md` |

Restent **dans le code** (constantes partagées front et back, ou JSON statique) plutôt qu'en base : les catégories de prix et leurs
montants, les SD de difficulté et de réparation, les tables de blessures critiques, les portées, les tables du parcours, les petits
boulots, le générateur de Marché de nuit. Ce sont des tables fixes du livre, sans lien avec les fiches des comptes. Les blessures
critiques pourront passer en base le jour où une fiche devra en référencer une.

API (lecture seule, `auth:sanctum`) : `GET /api/cpr/reference` (un seul appel qui renvoie rôles, compétences, profils et catalogues pour
la création de personnage), puis des routes par catalogue si le volume le demande.

Tests :

- un test d'audit par table, qui vérifie des lignes précises contre le livre (par exemple : le fusil d'assaut fait 5d6, chargeur 25,
  tir automatique 4 ; le sandevistan coûte 500 ED, PH 7 / 2d6 ; la ligne 6 du profil Solo vaut 7 7 6 5 7 6 6 7 7 5) ;
- un test de cohérence : chaque rôle a 20 compétences dont les 13 de base, les niveaux du Rat des Rues sont 2, 4 ou 6, chaque option de
  cybermatériel désigne une pièce mère qui existe ;
- un test d'accès : le catalogue se lit avec n'importe quel compte, et pas sans compte.

Découpage : une migration par famille, dans cet ordre, chacune avec ses tests.

**Avancement de l'étape 1**

- [x] **1/8 Rôles et compétences** (2026-11-06) : `cpr_role` (10), `cpr_competence` (68), `cpr_role_competence` (200), `cpr_role_profil` (100) ;
  migration `2026_11_06_100000_create_cpr_roles_and_competences.php`, modèles `App\Models\Cpr\CprRole`, `CprCompetence`, `CprRoleCompetence`,
  `CprRoleProfil`, service `CprReferenceData`, route `GET /api/cpr/reference`, test `CprRolesCompetencesTest` (9 tests). Écart avec le
  tableau ci-dessus : `cpr_role_competence` porte aussi `precision` (argot, quartier d'origine) et `de_role` (compétence de rôle ou de base) ;
  les rôles et les compétences n'ont pas de `user_id` (ils ne sont pas des objets qu'un compte crée).
- [x] **2/8 Armes, munitions et accessoires** (2026-11-06) : `cpr_arme` (15 classes + 14 exotiques), `cpr_munition` (13),
  `cpr_accessoire` (8) ; migration `2026_11_06_110000_create_cpr_armes_munitions_accessoires.php`, modèles `CprArme`, `CprMunition`,
  `CprAccessoire`, catalogues ajoutés à `GET /api/cpr/reference` (lignes du livre seulement), test `CprArmesTest` (7 tests). Choix faits :
  une arme exotique pointe vers sa classe (`base_id`) et en recopie ce qu'elle ne précise pas ; les capacités de chargeur des
  accessoires (`chargeur_extension`, `chargeur_cylindre`) sont portées par les classes ; une munition liste ses types compatibles (JSON),
  son prix vaut pour 10 sauf grenades et roquettes ; munitions et accessoires ont aussi un `user_id`.
- [x] **3/8 Armures** (2026-11-06) : `cpr_armure` (8 armures + bouclier balistique) ; migration `2026_11_06_120000_create_cpr_armures.php`,
  modèle `CprArmure`, catalogue ajouté à `GET /api/cpr/reference`, test `CprArmuresTest` (5 tests). Armures et boucliers partagent la table
  (`type`, `pa` ou `ps`) ; la combinaison connectée est la seule à couvrir tête et corps (`tete_et_corps`) et ajoute un emplacement de
  matériel à la cyberconsole (`emplacements_materiel`). Le bouclier escamotable sera une option de cyberbras (famille 4).
- [x] **4/8 Cybermatériel** (2026-11-06) : `cpr_cyber` (96 implants) ; migration `2026_11_06_130000_create_cpr_cyber.php`, modèle `CprCyber`
  (constante `EMPLACEMENTS_SANS_PIECE_MERE` = 7), catalogue ajouté à `GET /api/cpr/reference`, test `CprCyberTest` (7 tests). Écarts avec le
  tableau ci-dessus : au lieu d'une seule pièce mère, `requiert` liste les codes dont l'une suffit (« cyberbras ou cyberjambe ») et
  `emplacement` nomme le réservoir occupé (neuromateriel, cyberoeil, cyberaudio, cyberbras, cyberjambe, cybermembre, support_de_puces,
  cyberfashion, interne, externe, aucun) ; s'ajoutent `bras_de_chair`, `exclusif` (une mégadrénaline, un kit cyberaudio, une monture…) et
  `prerequis` (COR minimum et maillages des charpentes). Les puces occupent un support de puces, pas le câblage neural. Les effets
  structurés (JSON) couvrent les bonus de compétence, d'Initiative, de CARAC, le PA, les armes intégrées ; le reste est décrit en texte.
- [x] **5/8 Équipement, vêtements et drogues** (2026-11-06) : `cpr_equipement` (55 objets + 33 services), `cpr_vetement` (10 styles × 9 pièces),
  `cpr_drogue` (5) ; migration `2026_11_06_140000_create_cpr_equipement_vetements_drogues.php`, modèles `CprEquipement`, `CprVetement`,
  `CprDrogue`, catalogues ajoutés à `GET /api/cpr/reference`, test `CprEquipementTest` (5 tests). Ajout au tableau : les **services** du livre
  (bars, hôtels, poses de pièce mère, thérapies, traitements médicaux, Trauma Team…) sont dans `cpr_equipement` avec `type` = service ;
  les cyberconsoles y sont aussi (effet `cyberconsole` avec leur nombre d'emplacements). `cpr_vetement` n'a pas de `user_id` (une grille de prix).
- [x] **6/8 NET** (2026-11-06) : `cpr_programme` (15 programmes + 12 GLACE + 3 Démons), `cpr_materiel_net` (6) ; migration
  `2026_11_06_150000_create_cpr_net.php`, modèles `CprProgramme`, `CprMaterielNet`, catalogues ajoutés à `GET /api/cpr/reference`, test
  `CprNetTest` (6 tests). Programmes, GLACE et Démons partagent la table (`classe`) ; une GLACE prend 2 emplacements de cyberconsole, un
  Démon aucun (`emplacements` null). Les défenses (drones, tourelles, pièges) et les prix d'architecture viendront avec les architectures.
- [x] **7/8 Véhicules** (2026-11-06) : `cpr_vehicule` (14), `cpr_amelioration_vehicule` (19) ; migration `2026_11_06_160000_create_cpr_vehicules.php`,
  modèles `CprVehicule`, `CprAmeliorationVehicule`, catalogues ajoutés à `GET /api/cpr/reference`, test `CprVehiculesTest` (5 tests). Ajouts au
  tableau : `rang_nomade` (rang de Moto qui ouvre le véhicule au garage familial), `pieces_minimum` (bateau de plaisance, yacht, aérozep :
  places et prix par pièce) et la table des améliorations de véhicule du Nomade (rang requis, véhicules concernés, cumulable, prérequis).
- [x] **8/8 Dotations de départ** (2026-11-06) : `cpr_role_dotation` (238 lignes) ; migration `2026_11_06_170000_create_cpr_role_dotation.php`,
  modèle `CprRoleDotation` (relation `CprRole::dotations`, servie avec les rôles dans `GET /api/cpr/reference`), test `CprDotationsTest`
  (7 tests). Une ligne par objet (`objet_type` + `objet_id` dans le catalogue du type ; vêtement : la ligne style × pièce), `groupe` pour les
  alternatives, `quantite`, `precision` (localisation de l'armure, type de munition). La migration s'arrête si un code n'existe pas. Le
  Kerenzikov est la « mégadrénaline » au choix du Solo ; le Nomade a une ligne `garage_familial` de 4 choix. Les 500 ED de départ sont une
  règle, pas une ligne. Contrôle croisé : la PH des implants de départ recalculée depuis `cpr_cyber` donne le total du livre pour les
  10 rôles (21 pour le Solo, comme décidé).

**Étape 1 terminée le 2026-11-06** : 21 tables `cpr_*`, 46 tests Cyberpunk, suite complète à 383 tests ; les 8 migrations ont été
appliquées, défaites puis réappliquées sur une base SQLite jetable.

**Avancement de l'étape 2**

- [x] **2.1 Tables, propriété, API** (2026-11-07) : migration `2026_11_07_100000_create_cpr_personnage.php` (7 tables), modèles
  `CprPersonnage` (+ 6 modèles de lignes), `CprPersonnageRequest`, `CprPersonnageService`, `CprPersonnageController`, `CprPersonnagePolicy`,
  5 routes `/api/cpr/personnages`, test `CprPersonnageTest` (11 tests). `CatalogEntryPolicy` est passée dans `App\Policies` (les trois
  politiques de BoL qui en héritent l'importent). Précisions : `user_id` est nullable (fiche du catalogue, lisible par tous, modifiable
  par personne) ; dans le document, un implant cite sa pièce mère par une clé locale (`cle`, `parent`) que le serveur traduit en
  `parent_id` ; une liste absente du document est laissée telle quelle, une liste présente remplace les lignes ; armes, armures, implants
  et objets doivent être du livre ou du compte.
- [x] **2.2 Calculs côté serveur** (2026-11-07) : `CprPersonnageCalcul`, bloc `calcule` ajouté aux réponses de lecture et d'enregistrement
  d'une fiche, test `CprPersonnageCalculTest` (12 tests, sur les exemples du livre : 45 PS pour COR 7 et VOL 6, EMP 4 pour 44 d'Humanité).
  Le bloc donne CARAC (avec implants) et CARAC effectives (avec la pénalité d'armure), PS, seuil de blessure grave, sauvegarde, Humanité
  actuelle et maximum, EMP actuelle, PH totale, Chance, PA tête et corps (et PS des boucliers), Initiative, base de chaque compétence,
  emplacements de chaque pièce mère et des catégories sans pièce mère, alertes. **Interprétations** (le livre ne tranche pas) : plusieurs
  bonus pour une même compétence ne se cumulent pas, le plus élevé compte ; un bonus sous condition (« pour l'ouïe ») est listé sans entrer
  dans la base ; l'Initiative ne compte que les bonus permanents (Kerenzikov, Réaction d'Initiative du Solo), pas le sandevistan qui
  s'active ; l'Humanité de départ, tant qu'elle n'est pas enregistrée, vaut EMP × 10 − PH payée. Les capacités de rôle prises en compte pour
  l'instant : Moto du Nomade (ajoutée aux compétences de conduite et de mécanique) et Réaction d'Initiative du Solo ; les spécialités du
  Techie et du Medtech attendront leur format de `details` (2.3).
- [x] **2.3 Règles de création** (2026-11-07) : `CprCreationRegles`, appelé par `CprPersonnageService` pour un PJ qui a une méthode,
  test `CprCreationReglesTest` (12 tests). **Brouillon** : rien ne dépasse (bornes, points, budgets), la fiche peut être incomplète ;
  **activation** (brouillon → actif) : tout est complet ; une fiche active et un PNJ n'y sont plus soumis. Les règles portent sur la fiche
  entière (le document complété par la fiche existante). Contrôles : rôle unique au rang 4 et sa capacité répartie ; Rat des Rues (ligne de
  CARAC et compétences exactes) ; Edgerunner (CARAC dans la colonne du rôle, 86 points sur ses 20 compétences entre 2 et 6) ; Formule
  complète (62 points de CARAC entre 2 et 8, 86 points de compétences jusqu'à 6, achats dans 2 550 ED, vêtements et cyberfashion dans 800 ED
  dont le dépassement passe sur le budget principal) ; dotation (une alternative par groupe, le reste acheté dans 500 ED, qualité et
  accessoires comptés) ; compétences de base à 2, langue d'origine gratuite au niveau 4, pas de compétence réservée achetée ; PH fixe des
  implants et Humanité de départ. **Formats de `details`** fixés (voir l'en-tête de `CprCreationRegles`) : spécialités du Techie (2 × rang,
  chacune au plus le rang), du Medtech (rang ; Médicaments et Cryosystèmes jusqu'à 5 ; un médicament choisi par point), répartition du
  Solo (au plus le rang, avec les paliers du livre), garage du Nomade (autant de choix que le rang, de ce rang au plus). Les calculs en
  tiennent compte : Chirurgie (2 niveaux par point) et Techniques médicales du Medtech, Expert sur le terrain du Techie. Contrôle croisé :
  un Rat des Rues de chacun des 10 rôles, construit depuis les tables de référence, s'active sans erreur. Les alertes d'implants (deux
  mégadrénalines du Solo qui prend le Kerenzikov, emplacements) restent des alertes, pas des refus.

**Étape 2 terminée le 2026-11-07** : 7 tables de fiche, 5 routes, calculs et règles de création ; 35 tests de fiche, suite complète à 418 tests.

- [x] **Ids fixes et réinjection** (2026-11-07) : les données des 8 migrations de référence sont sorties dans `database/data/cpr/` (17 fichiers,
  ids inchangés : ceux de l'ordre d'insertion), lues par `CprReferenceCatalogue` ; commande `cpr:reference` ; test `CprReferenceCatalogueTest`
  (7 tests), suite complète à 425 tests. Contrôle : les nouvelles migrations, sur une base vide, redonnent exactement les fichiers. Sur la base
  du poste, la commande n'a rien trouvé à changer et a posé le départ des ids de compte à 10 000.

À faire sur chaque poste après un pull : `docker exec diceway php artisan migrate` (les tables `cpr_*` se créent et se remplissent).

### Étape 2 — la fiche de personnage (tables, API, calculs)

Détaillée le 2026-11-06, sur le modèle des héros de BoL (`BolHeros` : uuid, `user_id`, portrait en fichier, brouillon puis fiche activée,
politique « catalogue ou fiche du compte », 404 pour la fiche d'un autre compte).

**Principe d'API : la fiche entière en un document.** Le front envoie toute la fiche (CARAC, rôles, compétences, équipement, implants) et le
serveur remplace ses lignes dans une transaction. Pas de routes par relation comme chez BoL : un formulaire de création s'enregistre d'un coup.

#### 2.1 Tables, propriété, API

| Table | Contenu |
| --- | --- |
| `cpr_personnage` | uuid, `user_id` (clé vers `users`, suppression en cascade), `type` (pj, pnj), `statut` (brouillon, actif), `methode` (rat_des_rues, edgerunner, formule_complete ; null pour un PNJ), `pseudo`, `joueur`, `avatar` (`HasPortrait`), `role_id` (le rôle actuel, celui sous lequel la Rue le voit), les 10 CARAC de base (`int`, `ref`, `dex`, `tech`, `pres`, `vol`, `cha`, `mouv`, `cor`, `emp`), `profil_jet` (la ligne tirée au Rat des Rues), `humanite` (actuelle), `ps` (actuels ; null : au maximum), `chance` (restante ; null : pleine), `reputation`, `eddies`, `pam` (disponibles), `parcours` (JSON), `niveau_de_vie`, `logement`, `notes` |
| `cpr_personnage_role` | rôle, rang (1-10), `details` (JSON : spécialités du Techie et du Medtech, répartition du Solo, choix du garage du Nomade) ; une ligne par rôle (multiclassage) |
| `cpr_personnage_competence` | compétence, `precision` (quelle langue, science, forme, quel lieu, instrument), niveau |
| `cpr_personnage_arme` | arme, `qualite`, `accessoires` (JSON de codes), `munition` (variété chargée), notes |
| `cpr_personnage_armure` | armure, `localisation` (tete, corps ; null : bouclier ou combinaison connectée), `pa` actuel (perforations ; null : intact), `equipee` |
| `cpr_personnage_cyber` | implant, `parent_id` (la pièce mère de la fiche où il est posé), `cote` (gauche, droite), `precision` (la compétence d'une puce, l'arme escamotée…), `ph` réellement payée |
| `cpr_personnage_objet` | `objet_type` (equipement, programme, munition, vetement, materiel_net, vehicule, amelioration_vehicule), `objet_id`, `quantite`, `precision` (type de munition, véhicule amélioré…) |

API (`auth:sanctum`) : `GET /api/cpr/personnages` (les fiches du compte), `GET /api/cpr/personnages/{id}`, `POST /api/cpr/personnages`,
`PUT /api/cpr/personnages/{id}`, `DELETE /api/cpr/personnages/{id}`. La fiche d'un autre compte répond 404. `CatalogEntryPolicy` passe de
`App\Policies\Bol` à `App\Policies` (les politiques de BoL en héritent toujours) ; `CprPersonnagePolicy` en hérite.

Tests : propriété (un compte ne lit, ne modifie, ne supprime pas la fiche d'un autre), aller-retour d'une fiche complète, remplacement
des lignes à la mise à jour, références invalides refusées (compétence, implant ou objet inexistant, pièce mère d'une autre fiche).

#### 2.2 Calculs côté serveur

`CprPersonnageCalcul` produit, dans chaque réponse, un bloc `calcule` : CARAC effectives (implants : maillage, charpentes ; pénalité d'armure
à RÉF, DEX, MOUV), PS maximum, seuil de blessure grave, sauvegarde contre la mort, Humanité maximum (EMP × 10 − 2 par cyberimplant − 4 par
cyborgimplant), EMP actuelle (la dizaine de l'Humanité), PH totale des implants, base de chaque compétence (CARAC + niveau + bonus
d'implants et d'équipement), PA de la tête et du corps, Initiative, emplacements libres de chaque pièce mère. Tests unitaires sur les
exemples du livre (COR 7, VOL 6 → 45 PS ; Humanité 44 → EMP 4 ; pénalité de la tenue pare-balles moyenne…).

#### 2.3 Règles de création

Contrôlées tant que la fiche est en **brouillon** (comme chez BoL) ; une fiche **active** ne subit que des bornes de bon sens.

- **Rat des Rues** : CARAC égales à la ligne `profil_jet` du rôle ; compétences et dotation du rôle (une alternative par groupe).
- **Edgerunner** : chaque CARAC est l'une des valeurs de sa colonne dans la table du rôle ; 86 points sur les 20 compétences du rôle,
  chacune entre 2 et 6, coût doublé pour les compétences (x2) ; langue d'origine au niveau 4 en plus ; dotation du rôle.
- **Formule complète** : 62 points de CARAC, chacune entre 2 et 8 ; 86 points de compétences, aucune au-dessus de 6, les 13 de base à 2
  au moins ; achats dans 2 550 ED (plus 800 ED de vêtements et cyberfashion) ; option « vendre son âme » plus tard.
- Toutes : capacité de rôle au rang 4, Humanité de départ = EMP × 10 − PH fixe des implants.

### Étape 3 — les écrans de création

- Une bibliothèque des personnages sous `/cpr/library/characters` (structure des pages bibliothèque de `CLAUDE.md`).
- Un formulaire de création qui suit les trois méthodes : **Edgerunner** d'abord (rôle, tirage des CARAC, 86 points de compétences, dotation),
  puis **Formule complète** (62 points de CARAC, 86 de compétences, 2 550 ED d'achats et 800 ED de vêtements), puis **Rat des Rues**
  (tout imposé, le plus simple, mais le moins utile une fois les deux autres faits).
- Le parcours : tirage ou choix, avec les tables du livre en constantes.

### Étapes suivantes (non détaillées ici)

PNJ et sbires (catalogue des 10 profils, comme les PNJ de BoL), la table de jeu (Initiative, attaques, armure, blessures critiques), le
netrunning, la progression (PAM), l'économie (marché de nuit, petits boulots). Chacune aura son plan.

## Entrée dans l'application

L'accueil (`/`) est aujourd'hui celui de BoL. Proposition pour les étapes 1 à 3 : un lien « Cyberpunk RED » discret sur l'accueil (ou dans
la barre de navigation) mène à `/cpr`, qui affiche la bibliothèque des personnages. Un vrai choix de jeu à l'arrivée attendra qu'il y ait
de quoi jouer à Cyberpunk.

## Hors objectifs

- Pas de refonte de BoL : ni renommage des tables `bol_*`, ni déplacement de ses routes, ni abstraction « jeu générique » en amont.
- Pas de table de jeu ni de scénario Cyberpunk dans ce plan.
- Pas de tables mixtes : une compagnie BoL ne contient pas de personnage Cyberpunk.

## Décisions

Tranché le 2026-11-06 :

- **Objets créés par les comptes** : chaque catalogue a une colonne `user_id` dès l'étape 1 (null pour le livre), comme `bol_arme`.
- **Implants de départ du Solo** : la liste du livre telle quelle (biomoniteur, câblage neural, sandevistan, étripeurs **ou**
  mégadrénaline) ; la PH est la somme réelle des implants (21 avec les étripeurs), pas le 14 annoncé. Le choix « mégadrénaline » donne
  deux mégadrénalines : la règle d'unicité s'appliquera quand la fiche saura la vérifier (à revoir à l'étape 2).
- **Garage du Nomade créé au rang 4** : quatre choix, un par rang (véhicules ou améliorations de rang 4 au plus).

Retenu par défaut, à revoir si besoin :

- **Entrée** : un lien vers `/cpr` depuis l'accueil BoL, pas d'écran de choix du jeu pour l'instant.
- **Tables fixes du livre** (parcours, blessures critiques, générateur, SD, portées) en constantes, pas en base.
- **Ordre des méthodes de création** : Edgerunner, Formule complète, Rat des Rues.

## Mise à jour de `CLAUDE.md` (à la fin de l'étape 1)

- Project Overview : les deux jeux.
- Une section « Cyberpunk RED » : préfixe `cpr`, zones front, routes `/cpr`, données de référence dans `database/data/cpr/` (ids fixes, `cpr:reference`), où sont les règles.
- Business rules : renvoyer vers `doc/cyberpunk/resources/` et `doc/cyberpunk/rules/` pour Cyberpunk.
