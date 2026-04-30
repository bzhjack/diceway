# Plan — Session live : panneau combat

## Ce qui est fait ✅

- **Jet de réaction** — 8 catégories, ordre d'initiative, bonus légendaire (+1 attaque), R1 bloqué (coriaces/piétaille)
- **Gestion des rounds** — compteur, coma bleed (−1 vitalité/round pour vitalité < 0)
- **États auto** — hors-combat (= 0), coma (< 0), mort (≤ −6) calculés depuis la vitalité
- **Assistant jet d'attaque** — formule `2d6 + agilité + mêlée/tir − défense`, difficulté, avantage/désavantage, affichage des dégâts et de la protection cible

---

## Bugs à corriger

### Bug 1 — Vitalité bloquée à 0

`adjustHp` fait `Math.max(0, ...)` : la vitalité ne peut pas devenir négative.
Or le coma (vitalité < 0) est une règle centrale — le bouton − doit pouvoir descendre en dessous de 0.

**Fix** : retirer le clamp `Math.max(0, ...)`, autoriser jusqu'à −10 minimum.

---

## Étapes restantes

### Étape 4 — Fix vitalité négative *(petit, prioritaire)*

- Retirer `Math.max(0, ...)` dans `adjustHp` dans `bol-combat-panel.ts`.
- Clamp minimum à −10 (évite les valeurs aberrantes).

---

### Étape 5 — Options de combat dans l'assistant

Ajouter un sélecteur "Option de combat" dans la dialog `BolAttackAssistantComponent`.
La sélection ajuste automatiquement les bonus dans la formule.

| Option | Δ attaque | Info défense attaquant | Note |
|---|---|---|---|
| Aucune | 0 | — | — |
| Posture offensive | +1 | −1 défense | — |
| Attaque intrépide | +2 | −2 défense, perd bouclier | — |
| Posture défensive | −1 | +1 défense | — |
| Défense totale | — | +2 défense | Pas d'attaque |
| Combat 2 armes — parade | −1 | +1 défense | Armes légères/moyennes seulement |
| Combat 2 armes — double frappe | −1 | — | Dégâts +1 catégorie |
| Attaque au défaut de l'armure | −protection fixe cible | — | Si touche : ignore l'armure |

Règles "attaque au défaut" : malus = valeur fixe de protection (légère −1, moyenne −2, lourde −3). Si touche malgré le malus, les dégâts ignorent entièrement la protection.

---

### Étape 6 — Succès héroïque et légendaire dans l'assistant

Quand `dice === 12` (succès héroïque automatique) : afficher les 6 options à sélectionner.

| Option héroïque | Effet |
|---|---|
| Carnage | Attaque supplémentaire immédiate (sans dépense de PH) |
| Coup dévastateur | +6 dégâts |
| Coup précis | Dégâts normaux + dé de malus sur un type de jet (accord MJ) |
| Désarmement | L'adversaire perd son arme (au lieu de dégâts) |
| Massacrer la piétaille | Dégâts = nombre de piétaille mis hors combat |
| Renversement | Adversaire à terre, dé de malus à sa prochaine action |

Si l'attaquant a des points d'héroïsme disponibles (`heroismCourant > 0`) : proposer de dépenser 1 PH pour passer en **succès légendaire** → choisir 2 options (la même deux fois si cohérent).

---

### Étape 7 — Récupération post-combat

Bouton "Terminer le combat" → dialog récapitulatif avec calcul automatique :

- Vitalité > 0 : récupère `⌈(vitaliteMax − vitaliteCourante) / 2⌉`
- Vitalité = 0 (avec repos 10-15 min) : même calcul
- Vitalité < 0 : pas de récupération automatique (soins médicaux nécessaires, gérés manuellement)
- Les dégâts de bagarre à mains nues récupèrent entièrement (non géré automatiquement — laisser au MJ)

Au clic "Confirmer" : applique la récupération et ferme le panneau combat.
