# Références Cyberpunk RED

Données de référence recopiées du livre de base (`doc/cyberpunk/pdf/Cyberpunk RED - Livre de base VF.pdf`), pour concevoir et alimenter l'application sans rouvrir le PDF. Les règles qui les utilisent sont dans `../rules/` (commencer par `00-index.md`).

Les pages citées sont celles du livre ; page PDF = page livre + 4.

## Fichiers

| Fichier | Contenu | Pages livre |
| --- | --- | --- |
| [roles.md](./roles.md) | Par rôle : tables de CARAC, compétences du Rat des Rues, armes, armure, attirail, vêtements, cyberimplants de départ, petits boulots | 73-103, 117-118, 381-385 |
| [armes.md](./armes.md) | Armes de mêlée et à distance, qualités et modèles, accessoires, chargeurs, munitions, armes exotiques | 340-349 |
| [armures.md](./armures.md) | Armures, boucliers | 349-350 |
| [equipement.md](./equipement.md) | Équipement général, mode, drogues, services et divertissements | 351-357, 376 |
| [cybermateriel.md](./cybermateriel.md) | Catalogue complet des cyberimplants, par pièce mère | 358-366 |
| [marche-de-nuit.md](./marche-de-nuit.md) | Générateur de Marché de nuit (tables d100) | 337-340 |
| [pnjs.md](./pnjs.md) | Sbires, lieutenants, mini-boss, cyberpsycho ; membres d'équipe du Corporatiste | 154-157, 412-416 |
| [parcours.md](./parcours.md) | Parcours personnel et parcours des dix rôles | 44-70 |

Programmes, GLACE, Démons, défenses et architectures du NET, véhicules, renforts du Justicier et Trauma Team sont déjà détaillés dans les règles (`../rules/07-netrunning.md`, `../rules/04-combat.md`, `../rules/03-capacites-de-role.md`, `../rules/05-blessures-et-soins.md`).

## Méthode

- Les tables ont été extraites du PDF en mise en page conservée, puis relues colonne par colonne. Les tables de CARAC par rôle ont été générées par script depuis cette extraction.
- Les incohérences du livre sont signalées là où elles se trouvent, sans être corrigées en silence. Les principales :
  - **Solo** : implants de départ dont la PH ne correspond pas au total annoncé (`roles.md`, `../rules/06-cybermateriel-et-humanite.md`) ;
  - **arme de mêlée très lourde** : 100 ED dans le générateur, 500 au catalogue (`marche-de-nuit.md`) ;
  - **numérotations** fautives dans deux tables du parcours (Média, Nomade : `parcours.md`) ;
  - **Pyromane** : munitions de pistolet TL pour un pistolet lourd (`pnjs.md`) ;
  - **Technicien du Corporatiste** : Armurerie marquée × 2 (`pnjs.md`).
