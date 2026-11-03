# Reste à faire

Date : 2026-11-02, mis à jour le 2026-11-03. Ce fichier ne garde que ce qui reste ouvert : ce qui est fait en est retiré et reste dans l'historique git (dont les anciens `2026-10-14-combat-reste-a-faire.md`, `2026-10-31-revue-de-code.md` et `2026-11-03-revue-globale.md`). Le combat est terminé : toutes les règles du livre sont gérées ; son comportement et ses limites sont décrits dans `2026-10-13-combat-etat-des-lieux.md`.

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## En bref : ce qui reste ouvert

| Sujet | Section | Effort |
| --- | --- | --- |
| Code : dette suivie par le lint (couleurs en dur, `::ng-deep`, clavier, `$any()`) | 1 | M |

## 1. Code

- **Dette suivie par le lint** (`eslint-suppressions.json`, `stylelint-suppressions.json`) : 285 couleurs hexadécimales hors de `_tokens.scss`, 14 `::ng-deep`, 6 clics sans clavier et 5 éléments cliquables sans focus, 3 `$any()`. `npm run lint:prune` baisse les comptes après correction (M).
- Hauteurs fixes mesurées à la main (`--tas-h`, `min-height` de `combattant-carte.scss`) : toute nouvelle option dans ces cartes peut demander de les remesurer.
