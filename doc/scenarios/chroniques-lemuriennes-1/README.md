# Chroniques Lémuriennes 1.2 — Markdown de préparation

Texte extrait de `doc/Pdf BoL Chroniques-Lémuriennes 1.2.pdf` (136 pages, Ludospherik, 2017) avec :

```bash
pdftotext -layout -f <première page PDF> -l <dernière page PDF> "Pdf BoL Chroniques-Lémuriennes 1.2.pdf" -
```

Pagination : **page PDF = page livre + 2**.

Le livre réunit deux aides de jeu et cinq aventures indépendantes. Chaque aventure est un scénario de l'app,
avec sa propre saga d'import (`cl1-<aventure>`) : deux aventures ne partagent aucun personnage.

## Qualité de la transcription

Tous les fichiers ont été remis dans l'ordre de lecture à partir de l'extraction `-layout` : la mise en page en
deux colonnes avec encarts mélange les blocs. Les blocs de stats sont relus contre le PDF.

## Fichiers

| Fichier | Contenu | Pages PDF |
| --- | --- | --- |
| `00-avant-propos.md` | Crédits et avant-propos | 5-6 |
| `01-le-calendrier-de-satarla.md` | Aide de jeu : fêtes et calendrier de Satarla (+ tableau des mois, p. 133) | 8-11 |
| `02-le-khanat.md` | Aide de jeu : origines, géographie, factions, bestiaire, idées d'aventure | 13-29 |
| `03-un-ennui-mortel.md` | Aventure (Khanat, forteresse de Shelang) | 30-43 |
| `04-le-plus-vieux-reve-de-lom.md` | Aventure (Col Gelé) | 44-59 |
| `05-mariage-amer.md` | Aventure (poursuite dans les cieux, temple de S'pirr) | 60-77 |
| `06-la-tour-d-ajhaskar.md` | Aventure (la tour, puis la Vallée de la Lune) | 78-103 |
| `07-les-trois-coffres.md` | Aventure (missions de Rutgarr) et prétirés kalukans | 104-132 |
| `08-annexes.md` | Liste des dieux, noms de personnage selon l'origine, carte du Khanat (image, dans le PDF) | 133-136 |

Chaque aventure a un dossier `<aventure>/01-fiche-de-session.md` (déroulé scène par scène, stats) et un
fichier d'import `app/<aventure>.json` (format : `../format-import.md`).

## Dans l'app

- **Scénarios, scènes, PNJ et créatures propres** : sur le compte de l'utilisateur, par
  `bol:import-scenario`. Ce sont des données d'un supplément du commerce, jamais au catalogue.
- **Bestiaire du Khanat** (11 créatures, livre p. 20-26) : au catalogue, par `BolCreatureSeeder`
  (ids 64 à 74, capacités 2001 à 2014), à la demande de Lionel, comme celui du Beshaar.
- **Prétirés kalukans** (*Les trois coffres*) : dans le Markdown seulement, pas importés.

Plan et décisions : `doc/plans/2026-10-23-integration-chroniques-lemuriennes-1.md`.
