# Intégrer *Chroniques Lémuriennes 1.2* dans l'app

Source : `doc/Pdf BoL Chroniques-Lémuriennes 1.2.pdf` (136 pages, Ludospherik, 2017 ; page PDF = page livre + 2).
Préparation : `doc/scenarios/chroniques-lemuriennes-1/` (voir son README). Même circuit que
`2026-10-19-integration-perle-du-beshaar.md` : texte relu → fiche de session → JSON → `bol:import-scenario`. Aucun
changement de code n'a été nécessaire.

## 1. Décisions

- **Un scénario par aventure, une saga d'import par aventure** (`cl1-<aventure>`). Les cinq aventures sont
  indépendantes. Les personnages d'import sont repérés par saga : une saga commune aurait fait se confondre deux
  « gardes » de deux aventures.
- **Propriété.** Scénarios, scènes, PNJ, créatures et démons propres sont créés sur le compte de Lionel
  (`--user`), jamais au catalogue. Ce ne sont pas des fiches génériques, et c'est un supplément du commerce.
- **Bestiaire du Khanat au catalogue** (à la demande de Lionel, comme celui du Beshaar). `BolCreatureSeeder` :
  - créatures 64 à 74, capacités 2001 à 2014 ;
  - les capacités partent de 2001, car l'auto-incrément des capacités d'utilisateur a déjà dépassé 1013.
- **Aides de jeu** (calendrier de Satarla, le Khanat, annexes) : en Markdown de référence seulement.
- **Prétirés kalukans** (*Les trois coffres*) : dans le Markdown, pas importés (ce sont des héros).
- **Vilénie des rivaux** (consigne de Lionel du 2026-10-23) :
  - 3 quand le livre ne donne pas de points ;
  - si le livre en donne, sa valeur (points d'héroïsme portés en vilénie) ;
  - la valeur par défaut est signalée dans le commentaire de la fiche.
- **Pas de région « Khanat »** au catalogue : les scènes hors des régions existantes n'ont pas de `region`, le lieu
  est dans `lieu`. Cela concerne le Khanat, le plateau de Lhend, la Vallée de la Lune et la poursuite en vol.
- **Lecture aux joueurs.** Le livre n'a presque pas d'encarts à lire. Les textes `lecture` sont rédigés à la
  2ᵉ personne à partir de ses descriptions, sans secret.

## 2. Bestiaire du Khanat (livre p. 20-26)

Arctodus, Bubalus des neiges, Eucladocéros, Morska, Tigre bleu, Xalibu, Yi qi, Gardien du Royaume Putride, Leng shi,
Mogmaï, Windoku.

Écarts :
- Eucladocéros : Esprit « -1 à 3 », -1 retenu.
- Morska : profil dans l'eau ; sur la terre ferme (Agilité -2, Attaque +0), en commentaire.
- Gardien du Royaume Putride :
  - Agilité et Défense avec l'armure (0 et 2) ;
  - dégâts d6B+1, dé de bonus de l'aura de givre compris ;
  - *Capitaine des morts* en commentaire (une seule Attaque spéciale par fiche).
- Leng shi : pas d'attaque, dégâts d3 = son hurlement.
- Mogmaï : pas de profil dans le livre. Ont été choisis :
  - attaque et dégâts de sa volée d'objets ;
  - vitalité 1 pour le phylactère ;
  - taille « Moyenne », pour en faire un coriace.

## 3. Aventures

| Aventure | Fichier | Scènes | Créés | Catalogue |
|---|---|---|---|---|
| Un ennui mortel (L. Beaupère) | `app/un-ennui-mortel.json` | 14 | 12 PNJ, 2 créatures, 3 armes | — |
| Le plus vieux rêve de Lôm (A. Prié) | `app/le-plus-vieux-reve-de-lom.json` | 10 | 4 PNJ, 3 armes | Mythunga, Ours des cavernes |
| Mariage amer (A. Salvatores) | `app/mariage-amer.json` | 14 | 12 PNJ, 2 créatures, 5 armes | Venator, Crocator, Nécrophage |
| La tour d'Ajhaskar (V. Basset) | `app/la-tour-d-ajhaskar.json` | 17 | 11 PNJ, 2 créatures, 5 démons, 4 armes | Sergent du guet |
| Les trois coffres (A. Salvatores) | `app/les-trois-coffres.json` | 16 | 12 PNJ, 2 créatures, 2 armes | Hyène du Beshaar, Meneuse de meute, Nécropède |

Chaque fiche de session (`<aventure>/01-fiche-de-session.md`) liste ses écarts au livre et au catalogue. Les
principaux :

- **Carrières hors catalogue** → la plus proche, avec le nom réel en commentaire :
  - érudit → Scribe ;
  - druide (Rutgarr) → Prêtre ;
  - serviteur → Esclave ;
  - guérisseur → Médecin ;
  - chasseur-cueilleur → Chasseur ;
  - astronome → Scribe ;
  - pilote de nef → Pilote des airs ;
  - chaman → Prêtre ;
  - sorcière → Sorcier.
- **Figurants sans stats dans le livre** : fiches minimales inventées et signalées. Ce sont Tourmar, Jil, les
  gardes de la villa Sendak, Dramik, les domestiques d'Ajhaskar, Ilkhta, Lana, Shan, Parsi, Faldir et Assim.
- **Profils convertis** :
  - Qi Xian (profil de créature) devient un PNJ rival ;
  - l'arctodus empaillé prend la taille Moyenne, pour être coriace ;
  - aînés et rejetons de Labashaah sont des démons Inférieur et Mineur, pour les rangs coriace et piétaille ;
  - la protection de Labashaah passe par un pouvoir Armure.
- **Hordes** : 6 cartes au plus, effectif réel dans « En jeu ». Exception : *Les trois coffres*, où les 9 hyènes
  (un lot) et les 10 grooth (coriaces) sont à l'effectif du livre.
- **En coulisses** (créés, non distribués) :
  - la nuée de vermine de Qi Xian (*Un ennui mortel*) ;
  - le jeune elasmotherium (*Mariage amer*).
- **Coquilles et contradictions du livre** : signalées dans les Markdown (entrée secrète d'*Un ennui mortel*, rives
  de l'Oom, « Très difficile [-2] » p. 60…).
- **Arme partagée.** « Morsure de slorth » (*Mariage amer*) reprend exactement la définition de la Perle ch. 3 :
  l'import retrouve les armes du compte par leur nom.

## 4. Recette

- [x] Seeder du Khanat joué en local : 74 créatures au catalogue, capacités vérifiées.
- [x] Simulation (`--dry-run`) des cinq fichiers sur `claude-test@example.com` : sans erreur.
- [x] Aucune arme propre homonyme avec une définition différente, ni entre les aventures ni avec la Perle.
- [x] Import réel sur le compte de test (2026-10-23).
- [x] Les 71 scènes chargées une à une sur une table :
  - aucune entrée ignorée ;
  - le cartouche montre le bon titre ;
  - captures des scènes chargées, jusqu'à 18 cartes (antre de Labashaah).
- [x] Seules erreurs console : des 404 sur les portraits absents des créatures et démons importés
  (`/assets/bol/bestiary/<id>.jpg`, `/assets/bol/demon/<id>.jpg`, et les hyènes 55-56 du catalogue). Le Théâtre
  retombe sur l'icône par défaut.
- [x] Données de test supprimées : 5 scénarios, 71 scènes, 51 PNJ, 8 créatures, 5 démons, 17 armes et leurs
  `bol_import_ref`. Aucune ligne orpheline, catalogue intact (74 créatures).
- [x] Import sur le compte de Lionel (2026-10-23). « Morsure de slorth » y existait déjà (Perle ch. 3) : 4 armes
  créées pour *Mariage amer* au lieu de 5.
- [ ] Seeder à jouer sur les autres environnements :
  `php artisan db:seed --class='Database\Seeders\BolCreatureSeeder' --force`.

## Hors périmètre

- *Chroniques Lémuriennes 2.0 — Le Dieu voilé* (`doc/Pdf BoL Chroniques Lemuriennes 2.0 Le Dieu voilé.pdf`).
- Région « Khanat » et origines de héros du Khanat (Bei Wei, Ghataï, Xi Lu) dans la création de personnage.
- Armes ghataï (arc ghataï…) au catalogue.
