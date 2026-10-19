# Inventaire des boutons — harmonisation des formes (2026-10-19)

Règle proposée par Lionel : **tout bouton (action) est arrondi en pilule, tout toggle (état allumé/éteint ou choix dans un
groupe) est un rectangle à coins légèrement arrondis.** Précisions retenues :

- « Carré » = rectangle à coins de ~6 px (jeton `--dw-radius-toggle`), pas d'angles vifs.
- Bouton-icône seul (dé, ×, −/+ d'un compteur, chevrons) = cercle : c'est un bouton.
- La forme n'est jamais le seul signal : un toggle garde `aria-pressed` et un état allumé visible (fond plein).
- Hors règle : portraits, avatars, cartes, tuiles et liens dans le texte (leur forme est leur identité).

Méthode : tous les `<button>` des gabarits (`.html` et gabarits en ligne `.ts`, hors specs), avec leur variante Material, la
présence d'`aria-pressed` et le `border-radius` de leur classe (ou de leur conteneur).

## Chiffres

| | Nombre |
| --- | --- |
| `<button>` recensés | 289 |
| Boutons Material (`mat-flat/stroked/button`) | 130 — déjà en pilule (forme M3 par défaut, non surchargée) |
| `mat-icon-button` | 25 — déjà ronds |
| `mat-menu-item` | 9 — hors règle (lignes de menu) |
| Boutons maison | 125, dont 40 toggles (`aria-pressed`) |
| `mat-button-toggle-group` | 4 — **en pilule** (forme M3 par défaut) |

## 1. Actions à passer en pilule (aujourd'hui rectangulaires)

| Classe | Rayon actuel | Où | Boutons |
| --- | --- | --- | --- |
| `tas-ghost` | 8px | assistant de tour | Fiche, Retarder, Défense totale, Secourir, Fin du tour ; Fiche et Changer de cible (cible) |
| `tas-act` (actions) | 8px | assistant de tour | Faveur divine, Parade in extremis, Bouclier humain, Juste une égratignure, Annuler l'égratignure |
| `ard-act` (action) | 8px | jet d'action | Faveur divine |
| `ard-go` | 12px | jet d'action | Lancer / Relancer |
| `efl-add` | 8px | effets d'une carte | + Effet |
| `scs-chip` | 8px | bandeau des scènes | Charger la scène |

Déjà en pilule, conformes : `cp-header-action` (Terminer le combat), `scd-career-btn`, `sca-acte` (frise), `hd-chip`
(menus carrières/traits/armes), `dws-chevron`, `acd-add`.

Note : « Défense totale » émet `totalDefenseRequested` (une action, pas un état) → pilule.

## 2. Toggles à passer en rectangle (aujourd'hui en pilule)

| Classe | Rayon actuel | Où | Boutons |
| --- | --- | --- | --- |
| `ard-chip` | 999px | jet d'action | Carrière (Aucun, chaque carrière), Dé bonus MJ, Dé malus MJ, dés des traits |
| `scd-seg` | 999px | début de combat | Embuscade (options) |
| `atp-option` | 999px | attitude d'un PNJ (carte) | Hostile, Méfiant… |
| `acd-camp-toggle` | 999px | ajout de combattant | Héros / Adversaires |
| `acd-tab` | 999px | ajout de combattant | Tous, Héros, PNJ, Créatures, Démons |
| `cpd-tab` | 999px | choix des combattants (nouvelle session) | Tous, Héros, PNJ, Créatures, Démons |
| `mat-button` + `aria-pressed` | pilule | lecture de la scène | Afficher / Masquer le secret |
| `mat-button-toggle-group` | pilule (M3) | éditeur de scène (×2), réserve, menu d'ajout de traits | Moment, danger, filtres… |

**Accessibilité** : `acd-tab`, `cpd-tab` et `acd-camp-toggle` n'exposent pas leur état sélectionné (ni `aria-pressed` ni
`aria-selected`) → à ajouter au passage.

## 3. Toggles déjà rectangulaires (rayon à unifier sur le jeton)

| Classe | Rayon actuel | Où |
| --- | --- | --- |
| `tas-chip` (toggles) | 8px | assistant de tour : armes, Bagarre, À deux mains, Mêlée/Tir, carrières, options spéciales, Dé bonus/malus MJ, options héroïques |
| `tas-segm` / `tas-seg` | 10px (groupe) | assistant de tour : carrière sur Attaque / Dégâts ; postures |
| `tas-act` (toggles) | 8px | assistant de tour : Échec critique, Succès légendaire, Succès héroïque |
| `ard-act` (toggles) | 8px | jet d'action : mêmes cases |
| `ard-ladder` | 7px / 2px | jet d'action : échelle des difficultés |
| `scd-act` | 8px | début de combat : Échec critique, Succès légendaire |
| `rsc-chip` | 8px | secours : patient, carrière |
| `acd-chip` | 8px | après le combat : soigneur |

## 4. Boutons-icônes à passer en cercle

| Classe | Rayon actuel | Où |
| --- | --- | --- |
| `tas-dice-btn` | 10px | dé d'attaque, de dégâts, de l'égratignure |
| `tas-mini` | 10px / 7px | dé de protection, retour à la protection fixe |
| `scd-dice-btn` | 10px | dé de réaction (début de combat) |
| `scd-icon-btn` | 8px | exclure / réintégrer un héros (début de combat) |
| `ard-manual-btn` | 9px | valider le total tapé (jet d'action) |
| `tas-chip` ‹ › (sans `aria-pressed`) | 8px | portée : plus près / plus loin — aujourd'hui déguisés en puces |
| `cmp-step`, `cvl-step`, `hrs-step`, `vs__btn` | 4px | −/+ vitalité, héroïsme, vilénie, `dw-value-stepper` |
| `scd-stepper`, `ard-stepper` (−/+) | 7px | initiative ennemie, modificateur du MJ |

Déjà ronds : `tas-sum-x`, `efl-remove`, `dw-add-trigger`, `mat-icon-button`.

## 5. Hors règle (identité visuelle)

Portraits et avatars (`entity-card__portrait`, `cmp-portrait`, `rsv-avatar`, `scd-token`, `tor-med`, `acteur`), cibles
(`tas-target`), cartes et tuiles (`cpd-open`, `snp-add-tile`), épingles et lignes de la carte des régions (`hrg-pin`,
`hrg-region-row`), liens dans le texte (`ctc-lieu-carte`, `sca-scenario`, « sélectionne un fichier »), icônes de
`trait-row`.

## À trancher

1. **Médaillons d'attribut du jet d'action** (`ard-medal`, ronds, toggles) : toggles donc rectangles, ou médaillons hors
   règle comme les portraits ? Proposition : hors règle (ce sont des « jetons », pas des puces).
2. **−/+ des compteurs** en cercle : ils passent de 4 px à 50 % ; ils restent petits (1,2 à 1,5 rem).
3. **Rayon du toggle** : 6 px proposé (les cartes sont à 8 px, les champs à `corner-extra-small` = 4 px).

## Mise en œuvre proposée

1. `_tokens.scss` : `--dw-radius-toggle: 6px` ; `_material-button-theme.scss` : `button-toggle-overrides` avec `shape` au
   jeton.
2. Une passe par écran (assistant de tour, jet d'action, dialogues de combat, théâtre, création de session), chaque classe
   maison sur son rayon cible (pilule `999px`, jeton, ou `50%`), états `aria-pressed` ajoutés aux onglets.
3. Captures avant / après de l'écran de combat et du jet d'action ; `npm run build`, suite, `e2e:theatre`.
4. Règle ajoutée à `CLAUDE.md`, section Styling.

## Fait (2026-10-19)

Lionel a validé les trois points (médaillons hors règle, −/+ en cercle, toggle à 6 px). Appliqué :

- Jetons `--dw-radius-pill` / `--dw-radius-toggle` (`_tokens.scss`) ; `mat-button-toggle` au jeton (`_material-button-theme.scss`).
- Pilules : `tas-ghost`, `tas-act` (actions), `ard-act` (action), `ard-go`, `efl-add`.
- Rectangles : `ard-chip`, `scd-seg`, `atp-option`, `acd-camp-toggle`, `acd-tab`, `cpd-tab`, secret de la lecture (`lec-bascule`) ;
  `tas-chip`, `tas-segm`, `tas-act`/`ard-act` cochables (`&[aria-pressed]`), `ard-ladder`, `scd-act`, `rsc-chip`, `acd-chip`
  ramenés au jeton.
- Cercles : `tas-dice-btn`, `tas-mini`, `scd-dice-btn`, `scd-icon-btn`, `ard-manual-btn`, nouvelle classe `tas-step` (‹ › de la
  portée), `cmp-step`, `cvl-step`, `hrs-step`, `vs__btn` ; compteurs `ard-stepper` et `scd-stepper` passés de boîte segmentée à
  « valeur entre deux cercles » ; `exc-icon-btn` rendu à son cercle Material.
- Accessibilité : `aria-pressed` et `role="group"` sur les onglets et le choix de camp des deux dialogues d'ajout ; l'état
  « allumé » du camp ne s'affichait pas (spécificité CSS), corrigé.
- Laissés tels quels : `scs-chip` (lignes de la liste des scènes, pleine largeur), médaillons `ard-medal`.
- Règle ajoutée à `CLAUDE.md` (« Button shapes »).
