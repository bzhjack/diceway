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
| 1 | Combat : sorcellerie, foi, pouvoir | M |
| 2 | Combat : confort et robustesse | S à M |
| 3 | Images | hors code |

## 1. Combat : sorcellerie, foi, pouvoir

- **Coût d'un sort** : les blessures du lanceur et le point de pouvoir perdu au 3e cercle ne sont que rappelés (`tas-sort.html:123`) ;
  les appliquer au lanceur, avec une confirmation.
- **Sort sur un allié** : un sort ne vise que le camp d'en face (`targetableKeys`, `combat-turn.util.ts:385`) ; un sort de soin ou de
  protection sur un allié se pose à la main. Ouvrir les cibles alliées aux sorts qui s'y prêtent.
- **Récupération des points de foi et de pouvoir** : rien ne les rend (« retourner au temple » n'est qu'un message, `de-foi.ts:121`).
  Un bouton de récupération (repos, temple) sur la fiche ou dans « Après combat ».
- **Dé de foi** : il ne se donne que depuis la ligne de l'attaquant ou la carte de la cible (`tas-attaquant.html:102`, `tas-cible.html:39`).
  À garder tel quel, sauf besoin à la table.

## 2. Combat : confort et robustesse

- **Accessibilité** : un effet qui expire disparaît sans être annoncé aux lecteurs d'écran (`combat-turn.util.ts:366`) ; l'annoncer par
  `LiveAnnouncer` (S).
- **« Retirer du combat »** ne s'annule pas en cours de combat (la réintégration n'existe qu'au démarrage, `start-combat-page.html:548`) (S).
- **« Rendre la main »** rejoue aussi une action perdue infligée par un adversaire, l'effet ne gardant que son `origine`
  (`combat-effect.model.ts:22`) ; garder qui l'a posé (S).
- **Passage de round** : si la réponse du serveur se perd, aucun écran ne joue le début de round (`combat-turn.store.ts:164`) ; une trace
  « sort payé » mal enregistrée est perdue au rechargement (M).
- **Les jours après le combat** ne sont pas suivis : le jet quotidien du soigneur reste un rappel (M, à décider si utile).
- **Échec critique** : il rapporte 1 PH, mais l'issue défavorable (« ce round et le suivant ») reste au MJ. Voulu (§ 8 de l'état des
  lieux) ; à revoir seulement si la table le demande.

## 3. Images (hors code)

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
