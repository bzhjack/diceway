# Reste à faire — Barbarians of Lemuria

Date : 2026-11-09, repris le 2026-11-15 et le 2026-11-16. Ce fichier ne garde que ce qui reste ouvert : ce qui est fait en est retiré et reste dans
l'historique git. Il vient d'un inventaire vérifié dans le code le 2026-11-09 (suite back complète verte : 438 tests), revu le 2026-11-15
contre les plans du 2026-11-13.

- Le plan de l'accueil par parties (`2026-11-04-accueil-parties-plan.md` et `-design.md`) était entièrement réalisé, souvent sous une forme
  plus récente (compagnies, maquettes A et D, `scenario_termine`) : supprimé le 2026-11-09, il reste dans l'historique git.
- Le combat gère les règles du livre (les notes d'armes — fléau, gourdin, arbalète — depuis le 2026-11-09) ; son comportement est décrit dans `2026-10-13-combat-etat-des-lieux.md`,
  dont le § 9 « Limites connues » dit ce qu'il ne gère pas. Les points de l'audit du 2026-06-10 (+1 légendaire, PH décomptés, réussite héroïque pour 1 PH, échec critique au
  choix, postures et effets gardés, après combat, choix d'arme et options) sont tous faits.
- Les bibliothèques en tuiles sont faites : tuiles le 2026-11-13, en-tête et barre de filtres sur une ligne, sans tri, le 2026-11-15
  (décrites dans `CLAUDE.md`, « Library in tiles »). Leur conception et leur plan, entièrement réalisés, sont supprimés.
- Les jets d'une scène sont faits le 2026-11-16 : onglet « Jets » de « Préparer la scène » et du carnet, « Lancer pour » vers le panneau de
  jet réglé, et les trois scénarios repris (Perle 51 jets, Dieu voilé 56, Chroniques 31). Décrits dans `CLAUDE.md` et
  `doc/bol/scenarios/format-import.md` (pour un nouveau scénario : `doc/bol/scenarios/outils/extraire-jets.py`). Leur analyse et leur
  plan, entièrement réalisés, sont supprimés.
- Le carnet de la table range les pistes dans un onglet « Pistes » depuis le 2026-11-15 (elles étaient au pied du carnet, sous « Ensuite »).
- Aucun TODO dans le code, plus aucune dette de lint (`eslint-suppressions.json` et `stylelint-suppressions.json` vides).

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## En bref

| # | Sujet | Effort |
| --- | --- | --- |
| 1 | Images | hors code |

## 1. Images (hors code)

- Portraits des PNJ de scénario : aucune planche faite.
  - `doc/bol/scenarios/chroniques-lemuriennes-1/portraits.md` : P1 à P9, environ 51 portraits.
  - `doc/bol/scenarios/la-perle-du-beshaar/portraits.md` : P1 à P7, environ 41 portraits.
  - `doc/bol/scenarios/le-dieu-voile/portraits.md` : P1 à P15, environ 89 portraits.

## Hors périmètre, pour mémoire

Écartés par l'état des lieux du combat : la guerre, le quadrillage, la fabrication alchimique, le journal des événements, l'annulation d'un
coup. Notés pour la table le 2026-10-18, sans trace dans le code : journal de séance, table d'événements d6, vue Atlas.
