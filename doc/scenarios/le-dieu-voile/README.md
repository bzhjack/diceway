# Le Dieu voilé (*Chroniques Lémuriennes 2*) — Markdown de préparation

Texte extrait de `doc/Pdf BoL Chroniques Lemuriennes 2.0 Le Dieu voilé.pdf` (200 pages, Ludospherik, 2020) avec :

```bash
pdftotext -layout -f <première page PDF> -l <dernière page PDF> "Pdf BoL Chroniques Lemuriennes 2.0 Le Dieu voilé.pdf" -
```

Pagination : **page PDF = page livre + 2**.

Le livre contient une nouvelle carrière, quatre descriptions de lieux et cultes, puis une saga suivie (introduction et
cinq chapitres) dont les personnages reviennent d'un chapitre à l'autre.

## Fichiers

| Fichier | Contenu | Pages PDF |
| --- | --- | --- |
| `00-credits-et-sommaire.md` | Crédits, sommaire, liste des aides de jeu | 3-6 |
| `01-carriere-astrologue.md` | Carrière d'astrologue et horoscopes (référence seulement, hors catalogue) | 7-13 |
| `02-satarla.md` | Satarla | 14-25 |
| `03-halakh.md` | Halakh | 26-34 |
| `04-les-druides-gris.md` | Culte : les druides gris de Nemmereth | 35-37 |
| `05-urceb.md` | Urceb | 38-45 |
| `06-la-saga.md` | Présentation de la saga, et la chronologie récapitulative (aide de jeu V) | 46-53, 199 |
| `07-introduction-la-colere-de-nemmereth.md` | Introduction | 54-62 |
| `08-chapitre1-l-oracle-de-nemmereth.md` | Chapitre 1 (+ aide de jeu I) | 63-87 |
| `09-chapitre2-envole-le-corbeau.md` | Chapitre 2 (+ aide de jeu II) | 88-115 |
| `10-chapitre3-le-dieu-devoile.md` | Chapitre 3 (+ aide de jeu III) | 116-141 |
| `11-chapitre4-quand-tombent-les-masques.md` | Chapitre 4 (+ aide de jeu IV) | 142-167 |
| `12-chapitre5-l-ile-de-kryphondus.md` | Chapitre 5 (+ aides de jeu VI et VII) | 168-199 |
| `personnages-recurrents.md` | Registre des personnages qui reviennent d'une partie à l'autre | — |

Chaque partie de la saga a un dossier (`introduction/`, `chapitre-1/` … `chapitre-5/`) avec sa fiche de session
`01-fiche-de-session.md`. Les fichiers d'import sont dans `app/` (`intro.json`, `ch1.json` … `ch5.json` ; format :
`../format-import.md`).

## Dans l'app

- **Une saga d'import `dieu-voile`, un scénario par partie.** L'ordre d'import compte : `intro.json`, puis
  `ch1.json` à `ch5.json`.
- **Personnages récurrents** (registre) : tous définis dans `intro.json`, même ceux qui n'y sont pas distribués (ils
  attendent dans les coulisses). Les chapitres les reprennent par leur clé. Les personnages propres à un chapitre ont
  une clé préfixée (`intro-`, `ch1-` … `ch5-`).
- **Tout est sur le compte de l'utilisateur**, rien au catalogue : le livre n'a pas de bestiaire générique.
- **Astrologue** : en Markdown seulement (décision de Lionel du 2026-10-23). Les PNJ astrologues prennent la carrière
  la plus proche, avec « astrologue N » en commentaire.

Plan et décisions : `doc/plans/2026-10-23-integration-le-dieu-voile.md`.
