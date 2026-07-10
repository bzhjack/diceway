# Plan UX — faciliter la conduite de partie

> Issu d'un exercice « regard UX externe » du 2026-07-09, à la suite de la refonte de la fiche héros (branche `feature/ux2`).
> Maquettes visuelles : https://claude.ai/code/artifact/a49b6e72-4241-47c6-ba7f-3b96f2da512e

## Constat

L'app excelle à **préparer** la partie (création/édition dense, tout sous les yeux), mais **pendant** la partie le MJ fait encore de tête ce que l'écran pourrait lui donner : formules de jet, échelle de difficulté, suivi des PV de la tablée. Les cinq propositions ci-dessous comblent cet écart.

Principes retenus :

- **Additif uniquement** — aucune page existante n'est refaite ; on ajoute des surfaces.
- **Material stock** (menu, drawer, snackbar, button-toggle) + composants maison existants (`dw-value-stepper`, `dw-collapsible-row`, pattern add-menu).
- **Les règles du livre comme source de vérité** (`doc/rules/`), pas d'invention mécanique.

## M1 · Mode Séance sur la fiche héros — effort S

Bascule « ✏️ Édition / 🎲 Séance » en tête de fiche. Le mode Séance réorganise les **mêmes données** pour la lecture à distance de bras :

- gros compteurs PV / Héroïsme (steppers), protection ;
- lignes d'armes avec la formule pré-calculée (`2d6 + Vig 1 + Mêlée 6 · dégâts d6B`) ;
- traits réduits à leur effet mécanique (« dé bonus : interactions animaux »), langues.

**Tech** : `MatButtonToggle` + un composant `hero-play-view` alimenté par le même `FormGroup` en lecture. Aucun endpoint nouveau. Profite de M2 si présent (armes cliquables).

## M2 · Jet en un clic depuis la fiche — effort M

Chaque cellule de stat et chaque arme devient lançable (affordance dé au survol). Le popover :

- assemble la formule `2d6 + attribut + aptitude`, seuil 9+ ;
- propose l'échelle de difficulté officielle en chips : Très facile +2 · Facile +1 · Moyenne 0 · Ardue −1 · Difficile −2 · Très difficile −4 · Impossible −6 · Héroïque −8 ;
- pré-suggère le dé bonus/malus (3d6 garde 2) quand un trait du héros s'applique — lit `de_bonus_domaine` / `de_malus_domaine` déjà en base ;
- annonce le résultat : réussite / échec / succès héroïque (12 naturel), avec rappel « 1 PH pour convertir en succès héroïque ».

**Tech** : `MatMenu`/CDK overlay ancré sur la cellule (même pattern que les menus d'ajout), jet délégué au panneau dés 3D existant.

## M3 · Bandeau de tablée dans le workspace — effort M

Rangée de cartes-héros compactes pour piloter le combat d'un regard :

- avatar, nom, carrières ;
- ❤️ PV et ⭐ PH ajustables sur place (mini ±) ;
- 🛡️ protection rappelée ;
- état dérivé des règles : `vitalite < 0` → badge « mourant » + bordure rouge.

**Tech** : réutilise le pattern snapshot du workspace et les héros actifs déjà chargés ; les ± écrivent via le service existant.

## M4 · Tiroir règles global — effort S

Bouton « ? » global ouvrant un `MatDrawer` : tables consultées dix fois par soirée (difficultés/portées, dés bonus-malus, blessures & mort, récupération), recherche, et section « suggérée » selon la page courante (carte route → section).

**Tech** : contenu compilé depuis `doc/rules/*.md` au build — zéro backend, zéro réseau. Meilleur ratio valeur/effort du lot.

## M5 · Journal de séance avec annulation — effort M

Fil discret des événements de la soirée — jets (M2), dégâts et PH dépensés (M3) — horodatés, avec **annulation ligne à ligne** (ré-application de l'inverse, pas de time-travel générique). Filet de sécurité des ± rapides + récit de la partie en fin de session.

**Tech** : service `session-log` (signaux + localStorage). Dépend de M2 ou M3 pour avoir des événements à consigner.

## Priorisation proposée

| Maquette | Valeur en séance | Effort | Dépendances |
| --- | --- | --- | --- |
| M3 · Bandeau de tablée | Très forte — le combat se pilote d'un regard | M | aucune |
| M2 · Jet en un clic | Très forte — supprime le calcul mental répété | M | panneau dés existant |
| M4 · Tiroir règles | Forte — remplace le PDF ouvert à côté | S | aucune |
| M1 · Mode Séance | Forte — la fiche devient jouable | S | profite de M2 |
| M5 · Journal + annuler | Moyenne seule, forte avec M2/M3 | M | M2 ou M3 |

**Premier sprint suggéré : M4 + M3** (meilleur ratio valeur/effort + le workspace devient un poste de pilotage), puis M2 qui débloque M1 et M5 presque gratuitement.
