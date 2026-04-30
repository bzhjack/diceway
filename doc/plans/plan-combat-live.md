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

### Assistant jet d'attaque ✅
- Formule `2d6 + agilité + mêlée/tir − défense ± difficulté ± option`
- Avantage / désavantage (3d6 garder 2)
- Affichage des dégâts de l'attaquant et des armures de la cible
- Bouton caché tant que l'initiative n'est pas confirmée

### Étape 2 — Options de combat ✅
- Sélecteur option de combat : posture offensive/défensive, attaque intrépide, combat 2 armes ×2, attaque au défaut de l'armure
- Malus "défaut d'armure" paramétrable (saisie manuelle de la protection)

### Étape 3 — Succès héroïque et légendaire ✅
- Quand `dice === 12` : sélecteur des 6 options héroïques (Carnage, Coup dévastateur, Coup précis, Désarmement, Massacrer la piétaille, Renversement)
- Si `heroismCourant > 0` : bouton succès légendaire (−1 PH) → 2 options

### Étape 4 — Pouvoirs mécaniques des démons ✅
- Flags booléens sur `bol_pouvoir` : `avantage_attaque`, `degats_superieurs`, `regeneration`, `intangible`, `avertissement_combat`
- `PouvoirSlot` remplace `string[]` dans `InitiativeSlot`
- Avantage auto si attaquant a "Armes améliorées" (`avantage_attaque`)
- Badge dégâts devastatrices (`degats_superieurs`)
- Régénération appliquée à chaque `startNewRound()` (`regeneration`)
- Badge ⚠ intangible dans l'assistant (`intangible`)
- Badges d'avertissement sur les cartes (`avertissement_combat`)

### Bugs corrigés
- Vitalité bloquée à 0 → clamp à −10 (coma fonctionnel)

---

## Étape restante

### Étape 5 — Récupération post-combat

Bouton "Terminer le combat" → dialog récapitulatif :

- Vitalité > 0 : récupère `⌈(vitaliteMax − vitaliteCourante) / 2⌉`
- Vitalité = 0 : même calcul (après repos 10-15 min)
- Vitalité < 0 : pas de récupération auto (soins manuels)
- Bagarre à mains nues : récupération totale (laisser au MJ)

Au clic "Confirmer" : applique la récupération et ferme le panneau combat.
