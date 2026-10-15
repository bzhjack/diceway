# Simulation de combat : ce qui suit les règles, ce qui s'en écarte

Date : 2026-10-15. Deux rencontres jouées de bout en bout dans le navigateur, sur le compte de test, chaque chiffre affiché par l'assistant confronté aux règles (`doc/rules/02-actions-combat.md`, `04-pnj-creatures-demons.md`). Les héros de test ont été « équipés » le temps de la simulation (réponses de l'API réécrites dans le navigateur, rien en base) :

- **Krongar** (Testeur Avancé) : agilité 1, vigueur 2, mêlée 2, défense 1, épée d6, 5 PH ;
- **Sharangara** (Vérif Badge) : agilité 1, esprit 1, mêlée 1, dague et épée, Médecin 1, 4 PH.

## Rencontre A

Adversaires : Champion gladiateur (coriace, armure moyenne, petit bouclier, initiative 1), Jesharek Jool (rival, défense 3), Dinohyus (créature rivale, d6×2, attaque féroce), Ganuc (piétaille, 1 de dégâts fixe), Zullthegg (démon mineur, armes améliorées), Vul'mazzanlu (démon inférieur, attaques dévastatrices, poison). Réaction : Krongar 12 (légendaire), Sharangara 2 (échec critique).

| Moment | Affiché | Attendu | |
| --- | --- | --- | --- |
| Réaction de Krongar | 10+ : esprit 0, initiative 0, −1 ennemi | −1 : initiative du Champion (coriace) | ✅ |
| Ordre du round 1 | Krongar, Jesharek, Dinohyus ; coriaces, piétaille et Sharangara bloqués | légendaire bloque coriaces et piétaille ; échec critique interdit au round 1 | ✅ |
| Krongar → Champion | 7+ : +1 agi +2 mêlée −1 déf +1 légendaire −1 bouclier | idem | ✅ |
| Dégâts de Krongar | d6 +2 vigueur −2 protection (armure moyenne) | idem | ✅ |
| Jesharek → Sharangara | 7+ : +1 agi +1 mêlée | idem | ✅ |
| Dinohyus → Krongar | 2d6 +1 attaque −1 déf ; d6 ×2, sans vigueur | **3d6, deux meilleurs (attaque féroce)** ; ×2 sans vigueur | ❌ dé de bonus |
| Champion → Sharangara | +1 mêlée (agilité 1 − 1 d'armure moyenne), d6 +2 vigueur | idem | ✅ |
| Vul'mazzanlu → Krongar | +3 agi +3 mêlée ; d6B +3 vigueur | démon : d6B + vigueur | ✅ |
| Krongar tombe à −4 | « Défier la mort (−1 PH) » proposé | idem | ✅ |
| Ganuc → Sharangara | +1 attaque ; 1 dégât fixe | idem | ✅ |
| Zullthegg → Sharangara | 2d6 **+2 agi +2 tir** | **3d6 (armes améliorées)**, en mêlée | ❌ dé de bonus, ❌ tir par défaut |
| Krongar, double 6 | succès héroïque gratuit, coup dévastateur +6, légendaire −1 proposé | idem | ✅ |
| Sharangara secourt Krongar (−4) | Impossible (−6), +1 esprit +1 Médecin : seul le double 6 | 4 niveaux au-dessus de Moyenne | ✅ |
| Round 3 | Krongar perd 1 (−5), message « Stabilisé » | mourant : −1 par round | ✅ |
| Après combat | Krongar mourant : pas de repos, soins +1 ; Sharangara : repos +5, soins +1 | idem | ✅ |

## Rencontre B

Héros surpris ; Krongar 11 (réussite), Sharangara 9 (échec) ; Champion, Jesharek, Dinohyus, Zullthegg.

| Moment | Affiché | Attendu | |
| --- | --- | --- | --- |
| Réaction | −1 surpris −1 ennemi ; Sharangara après les coriaces, avant la piétaille | idem | ✅ |
| Héros surpris | trace « surpris » (pas de bouclier) jusqu'à la fin du round 1 | idem | ✅ |
| Krongar, posture défensive, double 1 | −1 posture ; raté d'office ; faveur divine et échec critique proposés | idem | ✅ |
| Faveur divine | case vidée, second jet retenu, 1 PH dépensé | idem | ✅ |
| Krongar → Dinohyus | protection d6-2 (2) | idem | ✅ |
| Jesharek → Krongar | −1 déf −1 posture défensive (9+) | +1 défense jusqu'à son prochain tour | ✅ |
| Dinohyus : défense totale | +2 en défense jusqu'à son prochain tour, pas d'attaque | idem | ✅ |
| Champion : retarder | joue en fin de round, après la piétaille | idem | ✅ |
| Sharangara → Champion | −1 déf −1 bouclier | petit bouclier : une attaque par round | ✅ |
| Champion (retardé) → Krongar | posture défensive encore là ; son bouclier noté « dépensé » | idem | ✅ |
| Round 2 | posture de Krongar tombée à son tour ; défense totale du Dinohyus encore là | idem | ✅ |
| Après combat | repos (moitié des pertes) puis soins | idem | ✅ |

## Écarts trouvés

1. **Corrigé le 2026-10-15. Dés de bonus et de malus des capacités ignorés.** « Attaque féroce » (dé de bonus), « Attaque timide » (dé de malus) des créatures et « Armes améliorées » (dé de bonus) des démons ne changent pas le jet : l'attaque reste à 2d6. C'est une partie du point 12 ; la base les connaît (`de_bonus` / `de_malus` sur la capacité, `avantage_attaque` sur le pouvoir), mais `de_bonus` vaut aussi pour « Prédateur » et « Camouflage », qui ne jouent pas à l'attaque : il faut s'en tenir aux capacités d'attaque.
2. **Corrigé le 2026-10-15. Démon sans arme au tir par défaut.** L'assistant propose Mêlée / Tir à un démon et choisit le tir quand son tir dépasse sa mêlée (Zullthegg : +2 tir). Ses attaques naturelles (griffes, crocs) sont de la mêlée ; au tir, sa vigueur ne compterait en plus que pour moitié. Proposition : mêlée par défaut pour un démon, le tir restant au choix.
3. **Corrigé le 2026-10-15. « À elle de jouer » dans la frise**, pour tout le monde (Krongar, Jesharek…). Proposition : « joue maintenant ».

Les corrections :
- `attackDiceAbilities` (`combat-play.util.ts`) relève, par leur nom, les capacités et pouvoirs qui donnent un dé à toutes les attaques ; l'assistant les compte avec le dé du MJ (un dé de bonus et un dé de malus s'annulent) et l'annonce sous le dé du MJ (« Attaque féroce : dé de bonus, à chaque attaque »). Vérifié : Dinohyus à 3d6, deux meilleurs (68 % au lieu de 42 %), retombé à 2d6 avec le dé de malus du MJ ; Ver des glaces à 3d6, deux moins bons ; Zullthegg à 3d6, deux meilleurs.
- Un démon attaque en mêlée par défaut ; le tir reste au choix.
- La frise dit « joue maintenant ».
4. **Pouvoirs à prévenir non affichés** (Poison, Intangible : `avertissement_combat`) sur la carte de l'attaquant ou de la cible. Point 12.

## Non couvert par ces deux rencontres

Carnage, coup précis, renversement, désarmement ; attaque intrépide, deux armes, défaut de l'armure ; bagarre ; double 6 « de justesse » ; attaques multiples ; portée (point 6). La plupart ont leurs tests unitaires ou ont été vérifiés à l'écran lors de leur mise en place.
