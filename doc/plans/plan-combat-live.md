# Plan — Session live : panneau combat

## Ce qui est fait ✅

### Grille d'initiative
- **Jet de réaction** — 8 catégories, ordre d'initiative, bonus légendaire (+1 attaque), R1 bloqué (coriaces/piétaille)
- **Gestion des rounds** — compteur, coma bleed (−1 vitalité/round pour vitalité < 0)
- **États auto** — hors-combat (= 0), coma (< 0), mort (≤ −6) calculés depuis la vitalité
- **Cartes de combat** — layout flex-wrap, avatar 50×50, stats, badges, PV colorés (vert/orange/rouge)

### Participants
- **Héros** — stats complètes (agilité, esprit, initiative, mêlée, tir, défense), armes, armures
- **Créatures** — rang snapshot, capacités en tags, protection naturelle dans armures
- **Démons** — rang snapshot, pouvoirs en chips rouges ; "Armure" et "Cuirassé" convertis en entrées `armures` (d6-2 (2) / d6 (4))
- **PNJs** — rang snapshot, armes

### Assistant jet d'attaque
- Formule `2d6 + agilité + mêlée/tir − défense ± difficulté`
- Avantage / désavantage (3d6 garder 2)
- Affichage des dégâts de l'attaquant et des armures de la cible

### Backend
- `BolPouvoirSeeder` — 16 descriptions alignées avec les règles

---

## Bugs à corriger

### Bug — Vitalité bloquée à 0

`adjustHp` fait `Math.max(0, ...)` : la vitalité ne peut pas devenir négative.
Or le coma (vitalité < 0) est une règle centrale.

**Fix** : dans `bol-combat-panel.ts`, remplacer `Math.max(0, ...)` par `Math.max(-10, ...)`.

---

## Étapes restantes

### Étape 1 — Fix vitalité négative *(prioritaire)*

- `adjustHp` : `Math.max(0, s.vitaliteCourante + delta)` → `Math.max(-10, s.vitaliteCourante + delta)`

---

### Étape 2 — Options de combat dans l'assistant

Sélecteur "Option de combat" dans `BolAttackAssistantComponent`. Ajuste la formule automatiquement.

| Option | Δ attaque | Note |
|---|---|---|
| Aucune | 0 | — |
| Posture offensive | +1 | −1 défense attaquant |
| Attaque intrépide | +2 | −2 défense, perd le bonus bouclier |
| Posture défensive | −1 | +1 défense attaquant |
| Défense totale | — | +2 défense, pas d'attaque |
| Combat 2 armes — parade | −1 | +1 défense, armes légères/moyennes |
| Combat 2 armes — double frappe | −1 | Dégâts +1 catégorie |
| Attaque au défaut de l'armure | −protection cible | Si touche : dégâts ignorent l'armure |

Règles "défaut d'armure" : malus = valeur fixe de la protection (légère −1, moyenne −2, lourde −3).

---

### Étape 3 — Succès héroïque et légendaire dans l'assistant

Quand `dice === 12` : afficher les 6 options héroïques.

| Option | Effet |
|---|---|
| Carnage | Attaque supplémentaire immédiate |
| Coup dévastateur | +6 dégâts |
| Coup précis | Dégâts normaux + dé de malus (accord MJ) |
| Désarmement | Adversaire perd son arme |
| Massacrer la piétaille | Dégâts = nombre de piétaille éliminés |
| Renversement | Adversaire à terre, dé de malus à sa prochaine action |

Si `heroismCourant > 0` : proposer de dépenser 1 PH → **succès légendaire** → choisir 2 options.

---

### Étape 4 — Pouvoirs mécaniques des démons

Pouvoirs qui ont un impact direct en combat :

| Pouvoir | Mécanique | Implémentation |
|---|---|---|
| Armes améliorées | Dé de bonus à toutes les attaques | Avantage auto dans l'assistant si le démon attaque |
| Attaques dévastatrices | Dégâts +1 catégorie | Badge + indication dans l'assistant (dégâts) |
| Régénération | +1 PV par round | `startNewRound()` : incrémenter vitalité des démons avec ce pouvoir (max vitaliteMax) |
| Intangible | Blessé seulement par magie/alchimie | Badge d'avertissement sur la carte |
| Vulnérabilité | Élément inflige ×2 | Badge d'avertissement sur la carte |
| Séducteur | Asservit 1d6+6 piétaille, résistance esprit | Informatif (géré par le MJ) |
| Poison | Paralysie, jet vigueur Difficile (−2) | Badge d'avertissement sur la carte |

---

### Étape 5 — Récupération post-combat

Bouton "Terminer le combat" → dialog récapitulatif :

- Vitalité > 0 : récupère `⌈(vitaliteMax − vitaliteCourante) / 2⌉`
- Vitalité = 0 : même calcul (après repos 10-15 min)
- Vitalité < 0 : pas de récupération auto (soins manuels)
- Bagarre à mains nues : récupération totale (laisser au MJ)

Au clic "Confirmer" : applique la récupération et ferme le panneau combat.
