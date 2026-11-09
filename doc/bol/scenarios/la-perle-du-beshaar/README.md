# La Perle du Beshaar — Markdown de préparation

Texte extrait de `doc/bol/pdf/La-Perle-du-Beshaar.pdf` (146 pages, *Chroniques
lémuriennes 4*) via :

```bash
pdftotext -f <première page PDF> -l <dernière page PDF> "La-Perle-du-Beshaar.pdf" -
```

Pagination : **page PDF = page livre + 2** dans tout le livre (vérifié sur les numéros imprimés le 2026-11-09). Les pages
livre 83 et 123, entre les chapitres 2/3 et 4/5, sont des pleines pages sans numéro.

## Qualité de la transcription

Tous les fichiers ont été **relus et remis en ordre de lecture à la main** sur le PDF : la mise en page originale du livre est
en deux colonnes avec des encarts (Note au MJ, statistiques, encarts d'ambiance), que l'extraction brute mélangeait. `00` à
`04` l'ont été d'abord ; `05` à `12` le 2026-11-09, au même format (titres, encadrés en citation, blocs de statistiques en
tableau), avec les valeurs de statistiques que l'extraction avait perdues rétablies d'après le PDF. Chaque fichier a été comparé
mot à mot à l'ancien texte : rien n'est reformulé, seuls l'ordre, la forme, les césures et les coquilles d'extraction (« 'ulé »
pour Thulé, mots soudés) ont changé. Ces fichiers sont fiables tels quels pour préparer et faire jouer une séance.

## Fichiers

| Fichier | Contenu | Pages livre | Pages PDF |
| --- | --- | --- | --- |
| `00-presentation-generale.md` | Pitch de la saga, notes MJ générales | 36 | 38 |
| `01-histoire-avant-histoire.md` | Contexte : Dazzandroth Zant, Tolometh, l'Ébranleur | 37-39 | 39-41 |
| `02-resume-des-aventures.md` | Résumé des 5 chapitres | 40 | 42 |
| `03-introduction.md` | Vous êtes dans une sale passe... (Marsus, Surdral) | 41-43 | 43-45 |
| `04-chapitre1-sacrilege-a-satarla.md` | Sanctuaire de Shazzadion, fuite vers Malakut, Arjanek | 44-55 | 46-57 |
| `05-cadre-malakut.md` | Aide de jeu : la ville de Malakut | 6-13 | 8-15 |
| `06-cadre-le-beshaar.md` | Aide de jeu : le désert du Beshaar | 14-23 | 16-25 |
| `07-cadre-bestiaire-du-beshaar.md` | Bestiaire du Beshaar | 24-35 | 26-37 |
| `08-chapitre2-de-sable-et-deau.md` | Chapitre 2 | 56-82 | 58-84 |
| `09-chapitre3-tombeau-urzulzalinaar.md` | Chapitre 3 | 84-97 | 86-99 |
| `10-chapitre4-reveil-ebranleur.md` | Chapitre 4 | 98-122 | 100-124 |
| `11-chapitre5-tolometh.md` | Chapitre 5 | 124-141 | 126-143 |
| `12-annexe-saltimbanques-de-kutas.md` | Annexe : culte des Saltimbanques de Kutas | 142-144 | 144-146 |

## Fiches de session et version jouable dans l'app

Chaque chapitre a une fiche de session condensée, établie en relisant le texte avec le PDF :
`chapitre-1/` à `chapitre-5/` (l'annexe des saltimbanques est dans celle du chapitre 4). Le PDF source est
hors de git, dans `doc/pdf/La-Perle-du-Beshaar.pdf` (dossier ignoré) ; on l'extrait avec `pdftotext -layout`.

Le dossier `app/` contient un fichier JSON par chapitre, importable dans l'app avec
`php artisan bol:import-scenario` (format : `../format-import.md`). Les chapitres se suivent : un personnage
défini dans un chapitre est repris par les suivants. Importer `ch1.json`, puis `ch2.json`, et ainsi de suite.

Un scénario par chapitre, pour garder la frise des actes à 8 à 15 scènes. Tout appartient au compte de l'utilisateur, sauf
le bestiaire du Beshaar (13 créatures), au catalogue à la demande de Lionel : `BolCreatureSeeder`, ids 51 à 63, capacités
1001 à 1013.

## Pour la séance de ce soir

Lis dans l'ordre `00` → `01` → `02` → `03` → `04`, et pioche dans `05`
(Malakut) pour le décor si tes joueurs traînent en ville avant de
partir. Le chapitre 1 se termine sur le départ pour le Beshaar
(chapitre 2).
