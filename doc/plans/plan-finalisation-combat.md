# Plan — Finalisation de la gestion de combat

> Rédigé le 2026-06-10. Décisions de cadrage validées :
> - **Persistance** : sauvegarde locale légère (sessionStorage), pas de backend.
> - **Rythme** : tracker de tour complet (combattant actif, bouton Suivant, round auto).
> - **Dés** : philosophie hybride assumée — l'app peut lancer, tout reste saisissable/corrigeable à la main.
> - **Scope** : les correctifs de conformité côté création de héros sont inclus.

## Vision MJ

À la table, le MJ fait tourner 4-8 combattants tout en racontant. Chaque seconde passée à chercher
« où j'en suis » ou à recalculer un modificateur de tête casse le rythme. L'app doit répondre en
permanence à trois questions sans réfléchir : **qui joue maintenant ? quel est l'état de chacun ?
combien de dégâts ?** — et automatiser tout ce que les règles rendent automatisable (PH, +1 légendaire,
états posés par les options héroïques), sans jamais empêcher le MJ de forcer une valeur à la main.

---

## Audit de conformité (2026-06-10)

### ✅ Conforme au manuel

| Mécanique | Où | Vérifié contre |
| --- | --- | --- |
| Jet d'attaque `2d6 + agilité + mêlée/tir − défense ≥ 9`, 12 naturel auto-réussite, 2 naturel auto-échec | `bol-attack-assistant.ts` (`isHit`) | `02-actions-combat.md` |
| Avantage/désavantage 3d6 garder 2 | `rollDice()` | idem |
| Jet de réaction : `2d6 + esprit + initiative ≥ 9`, modificateurs (surpris −1, embuscade +2, carrière, init. ennemie), 12 → héroïque, +1 PH → légendaire, 2 → échec critique **au choix du joueur** | `bol-roll-phase.ts` (`confirm`) | idem |
| Ordre d'initiative 8 catégories, blocage R1 coriaces/piétaille, échec critique R1 | `combat.constants.ts`, `bol-combat-panel.ts` | idem |
| Catégories de dégâts (d3/d6M/d6/d6B), vigueur entière en mêlée, /2 en tir et mains nues | `vigBonus`, `damageDiceLabel` | idem |
| Coup dévastateur +6, double frappe +1 catégorie, dévastatrices (pouvoir) +1 catégorie | `totalDamage`, `effectiveDamageCategorie` | idem |
| Options de combat (postures ±1, intrépide +2/−2, 2 armes, défaut d'armure) | `BolCombatOptionSeeder.php` | idem |
| 6 options héroïques | `BolHeroicOptionSeeder.php` | idem |
| Protection fixe d'armure parsée depuis `"d6-2 (2)"`, dé variable optionnel saisissable | `protectionFixed()`, `armorValue` | idem |
| Coma : −1 vitalité/round si < 0 ; régénération démons +1/round | `startNewRound()` | idem |
| Création : 4 pts attributs / 4 pts aptitudes / 4 pts carrières, max 3, un seul −1 | `create.validators.ts` | `01-creation-heros.md` |
| Vitalité = 10 + vigueur + modificateurs de traits (dur à cuire…) | `bol-heros-state.service.ts:131` | idem |
| Langues = max(esprit, 0) + carrières `donne_langue` + bonus origine lémurienne | `create.rules.ts` | idem |

### ⚠ Écarts relevés (corrigés par les phases ci-dessous)

| # | Écart | Règle | Phase |
| --- | --- | --- | --- |
| E1 | **+1 légendaire jamais appliqué au jet d'attaque** : `legendaryBonus` est calculé dans le panel mais non transmis à l'assistant ; `totalBonus` ne l'inclut pas. Et le bonus appartient au héros légendaire, pas à tout le monde. | Succès légendaire en réaction : +1 à tous les jets d'attaque du héros pendant la rencontre | 1 |
| E2 | **PH jamais décrémentés automatiquement** : légendaire en réaction (−1 PH), légendaire dans l'assistant (−1 PH). | Coût en points d'héroïsme | 1 |
| E3 | **Conversion réussite normale → succès héroïque via 1 PH** non proposée (seul un 12 naturel ouvre les options). | p. 56-57 | 1 |
| E4 | **2 naturel affiché « Échec critique » d'office** ; c'est un choix du joueur (qui peut rapporter 1 PH). | Échec critique volontaire | 1 |
| E5 | **Arme improvisée** (`d3`) mappée comme mains nues → vigueur/2 en mêlée au lieu de vigueur entière. | Table des dégâts | 1 |
| E6 | **Deux avantages cumulés → 4d6 garder 2** non supporté (plafonné à 3d6). | Dés de bonus/malus | 1 |
| E7 | **Postures non persistées** : posture défensive/offensive/intrépide/défense totale modifient la défense du combattant jusqu'à son prochain tour, mais rien n'est mémorisé — la défense de la cible affichée dans l'assistant est fausse si elle a pris une posture. | Options de combat | 3 |
| E8 | **Options héroïques sans effet mécanique** : Renversement (à terre + dé de malus), Désarmement (perd l'arme), Coup précis (dé de malus) ne posent aucun état sur la cible ; Carnage n'offre pas d'enchaînement ; Massacrer la piétaille n'a pas d'application multi-cibles. | Options de succès héroïque | 3, 4 |
| E9 | **Récupération post-combat absente** (étape 5 du plan-combat-live). | Récupération : ⌈perdus/2⌉ | 4 |
| E10 | **Double frappe** non restreinte aux armes légères/moyennes ; **armes lourdes** maniables même avec vigueur < 0 (simple warning suffira). | Combat à 2 armes ; armes lourdes | 1 |
| E11 | Création : **Non-combattant** (2 pts d'aptitudes, 6 pts de carrières) ignoré — budgets codés en dur à 4. | Désavantages | 7 |
| E12 | Création : **désavantages supplémentaires obligatoires** non vérifiés — sorcier (par rang > 1), alchimiste (par rang > 2), Magie des Rois-Sorciers, Pouvoir du Néant. | Carrières dangereuses ; avantages | 7 |
| E13 | À vérifier en phase 7 : exactement **4 carrières** choisies ; 2e/3e avantage régional compensé (désavantage régional ou −1 PH permanent). | Origine ; carrières | 7 |

---

## Phase 1 — Conformité combat (quick wins)

Petites corrections à fort impact, toutes dans `bol-attack-assistant.ts/.html`,
`bol-roll-phase.ts` et `bol-combat-panel.ts`.

1. **+1 légendaire (E1)** : dans `totalBonus`, ajouter `+1` si `attacker().type === 'hero' && attacker().category === 'legendaire'`. L'afficher dans `bonusSummary` (« Légendaire +1 ») et comme cellule dans la formule.
2. **Décrément PH (E2)** :
   - Jet de réaction : `onRollConfirmed` décrémente `heroismCourant` des héros dont `depenseHeroisme` est vrai. Désactiver la case si PH = 0.
   - Assistant : nouvel output `heroismChange` ; toggle légendaire → émet −1 à l'activation, +1 si désactivé avant application.
3. **Conversion 1 PH → héroïque (E3)** : si `rollStatus() === 'hit'` (réussite normale) et PH > 0, bouton « ★ Convertir en succès héroïque (−1 PH) » qui ouvre la section héroïque avec **une** option (pas de légendaire derrière — la double conversion est interdite par la règle).
4. **Échec critique au choix (E4)** : sur 2 naturel, statut « Échec automatique » + toggle « Le joueur accepte l'échec critique » (badge +1 PH possible, émet `heroismChange +1` si coché).
5. **Arme improvisée (E5)** : ajouter `'improvisee'` à `DamageCategorie` (d3, vigueur entière en mêlée). `categorieFromDegats` ne peut pas la distinguer de `d3` mains nues → la déduire du nom ou ajouter le flag côté données d'armes ; à défaut, rendre le **bonus de vigueur éditable** dans la section dégâts (couvre aussi Poings d'acier, Tireur puissant, bonus de carrière accordé par le MJ).
6. **4d6 (E6)** : options de dés étendues — Désavantage ×2 / Désavantage / Normal / Avantage / Avantage ×2 (4d6 garder 2 meilleurs ou 2 pires).
7. **Warnings (E10)** : badge dans l'assistant si double frappe avec arme lourde, ou arme lourde avec vigueur < 0. Pas de blocage — le MJ décide.

**Validation** : `npm run build` + tests unitaires sur `totalBonus`, `totalDamage`, conversion PH.

## Phase 2 — Tracker de tour (le plus gros gain de fluidité)

Dans `bol-combat-panel.ts` + `combat-card`.

- Signal `activeTurnId` ; l'ordre du tour = `sortedInitiative()` filtré : on saute les morts/hors-combat, et au round 1 les coriaces/piétaille si `round1Blocked()` ainsi que les échecs critiques.
- **Carte active surlignée** (bordure ambre, légère mise à l'échelle) ; bouton **« Suivant »** dans le header + raccourci clavier (`N` ou espace via `host` listener du panel).
- Fin de liste → `startNewRound()` automatique (coma bleed + régénération inchangés) et retour au premier.
- Le bouton « Attaque » de la carte active devient l'action primaire (severity warn pleine) ; il reste disponible sur les autres cartes (réactions, interruptions).
- **Retarder son action** : bouton sur la carte active qui la replace plus loin dans le round (après le prochain, ou en fin de round au choix simple : fin de round).
- Compteur dans le header : « Round 2 — Tour 3/7 ».

**Validation** : `npm test` sur le calcul de l'ordre de tour (blocages R1, skips), test manuel d'un round complet.

## Phase 3 — États et postures persistants

Nouveau champ `etats` (mutable) sur `InitiativeSlot` :

```typescript
interface EtatSlot {
  type: 'posture-off' | 'posture-def' | 'defense-totale' | 'intrepide'
      | 'a-terre' | 'desarme' | 'de-malus' | 'stabilise';
  note?: string;          // ex. « malus sur jets de vue (Coup précis) »
  expiresAtTurnOf?: string; // id du slot — l'état tombe quand ce combattant rejoue
}
```

- **Postures (E7)** : choisir une option de combat dans l'assistant pose l'état correspondant sur
  l'attaquant jusqu'à son prochain tour (purge dans le tracker de tour). La **défense effective**
  (base ± posture) est affichée sur la carte et utilisée par `totalBonus` quand le combattant est ciblé.
- **Défense totale** : ce n'est pas une attaque → bouton dédié sur la carte active (icône bouclier),
  pose l'état +2 déf et passe au combattant suivant.
- **Effets héroïques actifs (E8)** : après application des dégâts, si Renversement → état « à terre +
  dé de malus » sur la cible ; Désarmement → état « désarmé » (l'assistant ne propose alors que
  mains nues pour ce combattant) ; Coup précis → état « dé de malus » avec note libre.
- Badges d'état sur les cartes (réutiliser le style `cc-etat`), cliquables pour lever un état à la main.
- L'assistant signale en en-tête les états de l'attaquant et de la cible (« cible à terre », « vous êtes désarmé »).

**Validation** : tests unitaires sur l'expiration des états ; vérifier que la défense effective alimente bien l'assistant.

## Phase 4 — Fin de combat et flux d'attaque complet

1. **Récupération post-combat (E9)** — bouton « Terminer le combat » dans le header :
   dialog récapitulatif, une ligne par participant : PV perdus, récupération proposée
   (`vitalité > 0` ou `= 0` → ⌈perdus/2⌉ ; `< 0` → 0, mention « soins requis ») ;
   toggle par ligne « bagarre à mains nues » → récupération totale. « Confirmer » applique,
   ferme le mode combat et purge la sauvegarde locale.
2. **Carnage** : si l'option est choisie, bouton « Enchaîner une attaque » qui réinitialise le jet
   en conservant attaquant et arme (cible re-sélectionnable).
3. **Massacrer la piétaille** : après saisie des dégâts, mode multi-sélection des piétailles de la
   grille (jusqu'à `totalDamage()` cibles) → les passe hors combat d'un clic.
4. **Menu PH sur les cartes héros** : popover listant les usages courants — Défier la mort
   (remonte à 0 si entre −1 et −5, ou stabilise), Juste une égratignure (+1d6 PV plafonné aux
   derniers dégâts), Parade in extremis (annule les dégâts), Interruption. Chaque entrée décrémente
   le PH et applique l'effet quand il est automatisable.
5. **Piétaille à 0** : proposer le retrait de la grille (tuée/assommée) pour garder l'écran propre.

**Validation** : test manuel d'un combat complet (initiative → tours → fin de combat) ; tests unitaires sur le calcul de récupération.

## Phase 5 — Sauvegarde locale légère

- Service `bol-combat-storage.service.ts` : à chaque mutation (effect sur les signaux du panel),
  snapshot JSON dans `sessionStorage` sous la clé `bol-combat-{scenarioId}` : slots (PV, PH, états,
  catégories), round, tour actif.
- Au chargement de `session-live-page` avec un combat sauvegardé : bandeau « Un combat est en cours
  (Round 3) — Reprendre / Abandonner ».
- Purge à « Terminer le combat » et sur « Abandonner ».

**Validation** : refresh en plein combat → reprise à l'identique.

## Phase 6 — Dés hybrides partout

- **Jet d'attaque saisissable à la main** : input 2d6 à côté du bouton « Lancer les dés »
  (aujourd'hui seul `rollDice()` fixe `dice`). Le 12/2 naturel saisi manuellement déclenche les
  mêmes statuts.
- **Dégâts** : bouton « lancer » optionnel à côté de l'input, qui lance selon
  `effectiveDamageCategorie` (d3, d6, 2d6 min, 2d6 max) et remplit le champ — corrigeable.
- **Armure variable** : bouton d6 optionnel (d6−3/−2/−1 selon l'armure) qui s'ajoute à la valeur fixe.
- Champ **« ajustement »** libre (±) dans la section dégâts pour tous les cas non modélisés.

**Validation** : `npm test` sur les générateurs de dés (bornes par catégorie).

## Phase 7 — Conformité création de héros

Dans `create.validators.ts`, `hero-advanced-page.ts` et composants concernés.

1. **Non-combattant (E11)** : budgets paramétrés — si le désavantage est sélectionné,
   `combatFormValidator` plafonne à 2 et `carrieresFormValidator` à 6 (les validateurs reçoivent le
   budget au lieu du 4 codé en dur). Message explicite dans l'IHM.
2. **Désavantages supplémentaires (E12)** : validation croisée traits/carrières —
   sorcier rang > 1 → +1 désavantage par rang au-dessus de 1 ; alchimiste rang > 2 → idem au-dessus
   de 2 ; avantages Magie des Rois-Sorciers et Pouvoir du Néant → +1 désavantage chacun.
   Affichage du « solde de désavantages requis » dans l'étape traits.
3. **Vérifications (E13)** :
   - exactement 4 carrières choisies (à confirmer dans le formulaire actuel, corriger sinon) ;
   - flux origines : 2e avantage régional ⇒ désavantage régional **ou** −1 PH permanent ;
     3e avantage ⇒ désavantage supplémentaire **ou** −1 PH permanent (auditer `origines/`, corriger si absent).
4. **Warning équipement** : arme lourde sélectionnée avec vigueur < 0.

**Validation** : `npm test` sur les validateurs (cas non-combattant, sorcier 3, alchimiste 3, Rois-Sorciers).

---

## Ordre et dépendances

| Ordre | Phase | Dépend de | Taille |
| --- | --- | --- | --- |
| 1 | Phase 1 — Conformité combat | — | S |
| 2 | Phase 2 — Tracker de tour | — | M |
| 3 | Phase 3 — États & postures | Phase 2 (expiration au tour) | M |
| 4 | Phase 4 — Fin de combat & flux | Phases 1-3 | M |
| 5 | Phase 5 — Sauvegarde locale | Phases 2-3 (état complet à snapshoter) | S |
| 6 | Phase 6 — Dés hybrides | — (parallélisable) | S |
| 7 | Phase 7 — Création | — (parallélisable) | M |

Tout est front (`npm run build` pour valider chaque lot) sauf un éventuel flag « improvisée » sur
les armes (migration + seeder si on choisit la voie données en phase 1.5).
