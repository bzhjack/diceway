# Reste à faire — Barbarians of Lemuria

Date : 2026-11-09. Ce fichier ne garde que ce qui reste ouvert : ce qui est fait en est retiré et reste dans l'historique git. Il vient
d'un inventaire vérifié dans le code le même jour (suite back complète verte : 438 tests).

- Le plan de l'accueil par parties (`2026-11-04-accueil-parties-plan.md` et `-design.md`) était entièrement réalisé, souvent sous une forme
  plus récente (compagnies, maquettes A et D, `scenario_termine`) : supprimé le 2026-11-09, il reste dans l'historique git.
- Le combat gère les règles du livre (les notes d'armes — fléau, gourdin, arbalète — depuis le 2026-11-09) ; son comportement est décrit dans `2026-10-13-combat-etat-des-lieux.md`,
  dont le § 9 « Limites connues » est repris ici. Les points de l'audit du 2026-06-10 (+1 légendaire, PH décomptés, réussite héroïque pour 1 PH, échec critique au
  choix, postures et effets gardés, après combat, choix d'arme et options) sont tous faits.
- Aucun TODO dans le code, plus aucune dette de lint (`eslint-suppressions.json` et `stylelint-suppressions.json` vides).

Effort : **S** (quelques heures), **M** (une journée environ), **L** (plusieurs jours).

## En bref

| # | Sujet | Effort |
| --- | --- | --- |
| 1 | Images | hors code |

## 1. Images (hors code)

- `doc/bol/image-prompts/fonds-bibliotheques.md` : 6 fonds plein écran pour les bibliothèques (héros, PNJ, créatures, démons, armes,
  armures), à la résolution du fond des scénarios ; puis, page par page, `image` et `[fondPleinePage]="true"` sur l'en-tête (S).
- `doc/bol/image-prompts/creatures-demons-scenarios.md` : 3 planches, 18 portraits.
  - **CS4** (créatures) : tentacule, hippocampe, golem (Perle), gardienne bleue (Chroniques 1), parturiente maudite et son rejeton
    (Dieu voilé, ch5).
  - **DS1** (démons) : Krulak et son avatar, Labashaah, l'Aîné, le Rejeton (tour d'Ajhaskar), l'idole de la Perle.
  - **DS2** (démons) : Ilirk, Ghashtalarann, Limier, Piqueur (Perle), démon fuligineux et forgeur de Zaggath (Dieu voilé).
- Portraits des PNJ de scénario : aucune planche faite.
  - `doc/bol/scenarios/chroniques-lemuriennes-1/portraits.md` : P1 à P9, environ 51 portraits.
  - `doc/bol/scenarios/la-perle-du-beshaar/portraits.md` : P1 à P7, environ 41 portraits.
  - `doc/bol/scenarios/le-dieu-voile/portraits.md` : P1 à P15, environ 89 portraits.

## Hors périmètre, pour mémoire

Écartés par l'état des lieux du combat : la guerre, le quadrillage, la fabrication alchimique, le journal des événements, l'annulation d'un
coup. Notés pour la table le 2026-10-18, sans trace dans le code : journal de séance, table d'événements d6, vue Atlas.
