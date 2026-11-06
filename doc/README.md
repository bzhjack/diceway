# Documentation

Un dossier par jeu.

| Dossier | Contenu |
| --- | --- |
| `bol/` | **Barbarians of Lemuria** (Mythic) : règles, données de référence, scénarios, specs de création, notes de travail. Voir `bol/README.md`. |
| `cyberpunk/` | **Cyberpunk RED** : en cours de modélisation. Voir `cyberpunk/README.md`. |

## Organisation d'un dossier de jeu

Chaque jeu suit le même découpage, pour qu'on sache où chercher d'un jeu à l'autre :

| Sous-dossier | Contenu |
| --- | --- |
| `resources/` | Données de référence (armes, armures, carrières, bestiaire…). À consulter en premier. |
| `rules/` | Règles mécaniques, une fiche par chapitre du livre (`00-index.md`). |
| `pdf-text/` | Texte extrait des PDF, un fichier par chapitre : pour vérifier une règle sans rouvrir le PDF. |
| `pdf/` | Les PDF d'origine. Hors git (`/doc/*/pdf/`) : à copier à la main sur chaque poste. |
| `specs/` | Ce que l'application doit respecter à la création des fiches. |
| `scenarios/` | Une saga par dossier, avec `app/` pour les fichiers d'import. |
| `image-prompts/` | Prompts des bannières et des portraits. |
| `plans/` | Notes de travail datées sur la partie de l'application propre au jeu : états des lieux, revues de code, reste à faire. |

Un jeu n'a que les sous-dossiers dont il a besoin.
