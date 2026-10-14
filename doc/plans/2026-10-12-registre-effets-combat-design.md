# Registre d'effets de combat : design

Date : 2026-10-12. Mis à jour le 2026-10-13 : héroïsme sur le jet d'attaque (§ 9) et création automatique des effets du coup précis et du renversement.

## 1. Contexte et objectif

### Ce que le code fait aujourd'hui

- L'état d'un combat est gardé dans `bol_fight_session.etat_combat` (JSON) : `round`, `joues`, `defense_totale`, `attaquees`, `exclus`. Chaque règle à durée y a son propre tableau, ajouté à la main (`attaquees` l'a été pour le petit bouclier).
- Le total du jet d'attaque est calculé par `computeAttackTotal` (`combat-resolution.util.ts`), qui additionne sept paramètres positionnels.
- Les effets des postures sur la défense ne sont qu'un texte affiché (`POSTURE_DEFENSE` dans `turn-assistant.ts`). Un défenseur en posture défensive ou intrépide n'a donc aucun bonus ni malus quand on l'attaque.
- La page ignore toute action de tour tant qu'un enregistrement d'état est en cours (`savingEtat` dans `session-play-page.ts`).

### Besoin

Plusieurs règles de `doc/rules/02-actions-combat.md` demandent de la mémoire d'un tour à l'autre :

| Règle | Ce qu'il faut retenir |
| --- | --- |
| Petit bouclier | −1 à une attaque subie par round |
| Posture défensive, offensive, intrépide | Bonus ou malus de défense quand on est attaqué ensuite |
| Combat à deux armes, mode parade | +1 en défense contre une attaque subie |
| Défense totale | +2 en défense jusqu'à son prochain tour |
| Échec critique, round 1 | Pas de bonus de bouclier en défense |
| Renversement | Dé de malus à la prochaine action de la cible |
| Coup précis | Dé de malus imposé à la cible, durable |
| « Juste une égratignure » | La cible perd sa prochaine action |
| Feinte | Ne marche pas deux fois contre le même adversaire |

Objectif : ajouter une règle de ce genre ne doit plus demander de toucher à la base, à la page et à l'assistant à la fois. Les exemples du livre (`doc/rules/exemples-de-jets.md`) servent de tests.

### Décisions du dialogue

- Les effets durables s'appliquent **automatiquement** aux jets suivants, et le MJ peut les **retirer ou en ajouter à la main**.
- L'application assiste le MJ, elle ne le remplace pas.
- Approche retenue : un **registre d'effets** (approche 2). Un journal complet d'événements (approche 3) reste possible plus tard.

## 2. Le registre d'effets

Un effet est une ligne gardée dans `etat_combat.effets`.

| Champ | Rôle | Exemple |
| --- | --- | --- |
| `id` | Identifiant stable, pour le retirer | `e-12` |
| `origine` | D'où il vient, pour l'affichage et le retrait | `posture-defensive`, `defense-totale`, `bouclier-depense` |
| `porteur` | La carte qui l'a (clé `{kind}-{pivotId}`) | `hero-3` |
| `stat` | Ce qu'il modifie | `attaque`, `defense`, `degats`, `protection`, `action` |
| `valeur` | Le bonus ou le malus | `1`, `-1` |
| `quand` | Contre quoi il joue | `attaque` (le porteur attaque) ou `subie` (le porteur est attaqué) |
| `duree` | Quand il s'éteint | voir ci-dessous |
| `manuel` | Ajouté ou retiré à la main par le MJ | `true` / `false` |
| `cible` | Facultatif : limite l'effet à une carte (feinte) | `pnj-7` |

Durées possibles :

- `{type: 'usages', restants: N, expireAuTour?: true}` : N utilisations ; avec `expireAuTour`, l'effet s'éteint aussi au début du prochain tour du porteur (la parade : une attaque subie, ou jusqu'à son tour).
- `{type: 'fin-round'}` : jusqu'à la fin du round en cours.
- `{type: 'debut-tour-porteur'}` : jusqu'au début du prochain tour du porteur.
- `{type: 'action-porteur'}` : jusqu'à la fin de la prochaine action du porteur.
- `{type: 'combat'}` : jusqu'à la fin du combat.

Un effet peut être un bonus ou un malus (posture) ou une **trace d'usage** (« bouclier dépensé ce round »).

### Ce qui reste lu sur la fiche

Ce que l'équipement donne en permanence (petit bouclier, armure, arme) reste lu sur la fiche comme aujourd'hui (`resolveAttackStats`). Le registre ne garde que l'état temporaire, y compris la trace d'un usage. Il n'a pas à connaître l'inventaire de chaque carte.

### Où ça vit

- `front/src/app/bol/session/models/combat-effect.model.ts` : les types.
- `front/src/app/bol/session/play/tapis/combat-effects.util.ts` : fonctions pures, sans Angular ni base.
  - `modificateursPour(effets, contexte)` rend les puces d'un jet : libellé, valeur, ton, `id` de l'effet. L'assistant affiche ces puces et en fait le total, d'où un seul calcul.
  - `appliquerEvenement(effets, evenement, round)` rend la nouvelle liste d'effets.
- Backend : `BolCombatState` valide et nettoie `effets`. Il ne connaît pas les règles.

## 3. Les événements

| Événement | Effet sur le registre |
| --- | --- |
| `debut-tour(carte)` | Les effets `debut-tour-porteur` de cette carte s'éteignent. |
| `fin-tour(carte)` | Les effets durables du tour naissent : bonus ou malus de défense de la posture choisie, parade à deux armes (+1 en défense, une attaque subie), défense totale (+2). Ce que la carte portait de son tour précédent et ses effets `action-porteur` s'éteignent ; un effet recréé remplace le précédent. |
| `jet-attaque(attaquant, cible)` | Les effets à usage limité de la cible sont consommés, et une trace « bouclier dépensé » est posée une seule fois pour le round. |
| `ajout-manuel(effet)` émis par l'assistant | Quand un coup héroïque est conclu (dégâts appliqués, ou désarmement validé), ses options posent leurs effets sur la cible : coup précis (dé de malus, `combat`), renversement (dé de malus, `action-porteur`). Voir § 9. L'égratignure (action perdue) reste ajoutée à la main. |
| `nouveau-round` | Les effets `fin-round` s'éteignent. Le bouclier redevient disponible. |
| `retrait-manuel(id)` et `ajout-manuel(effet)` | Le MJ retire ou ajoute un effet. |
| `carte-retiree(carte)` | Les effets portés par cette carte disparaissent. |

Règles de comportement :

- **Lecture avant consommation** : un jet d'attaque lit les effets avant de les consommer. Un jet fige la liste des effets qu'il a utilisés : « Relancer » garde le même bouclier. Cela remplace le verrou ajouté dans l'assistant lors de la correction du bouclier.
- **Rejouer un même événement** ne crée pas de doublon.
- **File d'enregistrement** (`EtatSaver`) : les mises à jour automatiques (jet fait) sont mises en file et appliquées dans l'ordre, chacune sur l'état rechargé, pour qu'aucune ne se perde. Les actions de l'utilisateur (fin de tour, défense totale, rendre la main) restent ignorées pendant un enregistrement, pour qu'un double clic ne termine pas deux tours.
- **Échec critique au round 1** : règle dérivée du palier de réaction et du round (aucun événement n'existe au démarrage du combat), sans effet stocké.
- **Intrépide** : l'attaque intrépide pose une trace « sans bouclier » jusqu'au prochain tour du porteur.

## 4. Affichage

1. **Puces des jets** : chaque puce issue d'un effet porte son origine (« − 1 bouclier », « + 1 posture défensive de Dogon »).
   - L'infobulle donne la durée (« jusqu'à son prochain tour »).
   - Une croix permet de retirer l'effet : le total se recalcule aussitôt.
2. **Sous chaque duelliste** : une rangée de badges montre ce qui pèse sur lui (« déf +1 · jusqu'à son tour », « dé de malus à sa prochaine action »).
3. **Colonne d'options à gauche** : un bloc « Effets en cours » remplace « Effet sur ce tour ».
   - Il liste les effets de l'attaquant et de la cible, avec leur durée et leur croix.
   - Un bouton « + Effet » ouvre un menu (`MatMenu`, comme `bol/shared/add-menu`) de modèles prêts, par carte : « +1 en défense jusqu'à la fin du round », « dé de malus à sa prochaine action », « −1 à ses jets d'attaque », « perd sa prochaine action ». L'effet libre (valeur et durée au choix) est reporté.
   - Les postures choisies pour le jet en cours restent affichées comme aujourd'hui : elles décrivent le jet ; le bloc décrit ce qui dure.
4. **Frise** : un point sur le médaillon d'une carte qui porte des effets, avec leur liste en infobulle. L'annonce vocale d'un nouveau round mentionne les effets expirés.

Technique : un composant `bol-effects-list` dans `play/tapis/`, avec son propre fichier de style, car `turn-assistant.scss` est au budget de 16 kB. Les croix sont de vrais boutons, avec une étiquette accessible (« Retirer l'effet … »), utilisables au clavier.

## 5. Migration

- Pas de migration de base : `etat_combat` est une colonne JSON.
- Conversion à la lecture, au même endroit côté backend et côté front, si `effets` est absent :
  - chaque clé de `defense_totale` devient un effet « défense totale +2, jusqu'au prochain tour » ;
  - chaque clé de `attaquees` devient un effet « bouclier dépensé, fin de round ».
- À l'écriture, on n'envoie que `effets`. Un combat en cours au moment du déploiement continue sans casse.

## 6. Tests

- **Fonctions pures** (Vitest), un cas par événement : le petit bouclier ne pèse que sur le premier jet du round ; une posture défensive naît à la fin du tour et expire au début du prochain ; la défense totale et la parade se cumulent ; l'échec critique du round 1 retire le bouclier ; un renversement expire après la prochaine action ; une feinte ne marche pas deux fois contre la même cible ; changement de round ; ajout et retrait à la main ; retrait d'une carte.
- **Propriétés** : l'entrée n'est jamais modifiée ; rejouer un événement ne crée pas de doublon.
- **Non-régression** : sans effet, `modificateursPour` donne exactement le total de `computeAttackTotal` d'aujourd'hui.
- **Backend** : `BolCombatState` valide `effets` (types, bornes, au plus 200 lignes) et convertit l'ancien format.
- **Navigateur** : le scénario Playwright du petit bouclier (PNJ avec `bouclier_malus_attaque_subie_portee: 'une'`, jet, relance, deuxième attaque) devient un script rejouable dans `front/scripts/`.

## 7. Livraison en cinq étapes

Chaque étape laisse le build, les tests et knip au vert.

1. **Noyau** : le modèle et les fonctions pures, avec leurs tests. Aucun changement d'écran.
2. **État** : validation backend, conversion de l'ancien format, file d'événements. La défense totale et le bouclier se comportent comme aujourd'hui.
3. **Postures et parade en défense** : premier changement de règle visible.
4. **Affichage** : croix, badges, bloc « Effets en cours », « + Effet ».
5. **Effets à action** : renversement, égratignure, feinte, échec critique du round 1.

## 8. Hypothèses et points ouverts

- **Durée d'une posture** : le livre ne la précise pas. Hypothèse : « jusqu'au début du prochain tour du porteur ». Elle se change à la main.
- **Feinte** : l'application n'a pas d'option « feinte » ; aucune création automatique, seule la trace manuelle est possible.
- **`carte-retiree`** : l'événement existe dans le noyau, mais retirer une carte ne se fait qu'hors combat aujourd'hui, donc la page ne l'émet pas encore.
- **Annonce vocale des effets expirés** : reportée.
- **Qui crée les effets d'action** : le renversement et le coup précis sont créés par l'assistant quand l'option héroïque correspondante est prise (§ 9). L'égratignure (« perd sa prochaine action ») naît d'une dépense d'héroïsme du défenseur que l'application ne suit pas : le MJ l'ajoute avec le menu « + Effet ».
- **Durée du dé de malus du coup précis** : le livre le veut durable (un œil crevé) sans la borner. Hypothèse : jusqu'à la fin du combat, retirable à la main ; il pèse sur tous les jets d'attaque de la cible, même si le MJ ne visait qu'un autre type de jet.
- **Hors périmètre** : le journal complet d'événements, l'annulation d'un coup, la sorcellerie et la guerre.

## 9. Héroïsme sur le jet d'attaque (ajout du 2026-10-13)

Un jet d'attaque est un jet d'action : les usages de l'héroïsme du chapitre 3 (livre p. 56 à 61, `doc/rules/02-actions-combat.md`) s'y appliquent, comme sur le panneau de jet d'action du héros.

### Qui y a droit

- **Dépenser ou gagner des points d'héroïsme** : les héros seulement (`ResolvedCombatStats.heroisme` non nul). Leur compteur s'affiche à côté du nom de l'attaquant.
- **Succès héroïque sur un double 6** : les héros et leurs alliés (`camp === 'heros'`), comme avant. Pour leurs adversaires, le double 6 touche, sans plus.

### Ce que propose l'assistant, sous le verdict de l'attaque

| Résultat des dés | Bouton | Effet |
| --- | --- | --- |
| Raté | Faveur divine −1 | La case du total se vide : le second jet se tape (dés de table) ou se lance à l'écran. Les modificateurs figés du premier jet sont gardés. |
| Double 1 | Échec critique +1 | Le verdict devient « Échec critique ». La faveur divine n'est plus proposée. L'issue défavorable reste au MJ (« + Effet »). |
| Touché | Succès héroïque −1 | Ouvre une option de succès héroïque. |
| Double 6 | Succès légendaire −1 | Ouvre une seconde option. Impossible depuis un succès héroïque acheté. |

- **Double 6 de justesse** : si seul le double 6 pouvait toucher (total ≤ seuil), le coup touche normalement : pas d'option gratuite, pas de légendaire (`suggestedAttackResult`). Il reste convertible en succès héroïque pour 1 point, comme toute réussite.
- **Remboursement** : refaire le jet (retaper le total, relancer) rend ce que les cases cochées avaient coûté ou rapporté. Changer de cible ou d'arme en cours de jet ne rend rien.
- **Enregistrement** : l'assistant ne parle à aucun service ; il émet `heroismeAdjusted(delta)`, la page met à jour le compteur tout de suite, appelle `adjustHeroisme`, et revient en arrière si l'appel échoue.

### Les options de succès héroïque

Une option pour un succès héroïque, deux pour un succès légendaire, la même deux fois si on veut (`heroicPicksAllowed`, `toggleHeroicPick`).

| Option | Ce que fait l'application |
| --- | --- |
| Coup dévastateur | +6 aux dégâts par exemplaire (+12 pris deux fois). |
| Désarmement | Pas de jet de dégâts ; un bouton conclut le coup. |
| Coup précis | À la conclusion du coup, dé de malus sur la cible jusqu'à la fin du combat (`effetCoupPrecis`). |
| Renversement | À la conclusion du coup, dé de malus à la prochaine action de la cible (`effetRenversement`). |
| Carnage | Après la conclusion du coup, l'assistant annonce une nouvelle attaque immédiate. Plus aucune dépense d'héroïsme n'est proposée jusqu'à la fin du tour. |
| Massacrer la piétaille | Rappel en infobulle : le MJ retire les cartes. |

Les deux dés de malus portent l'origine `de-malus` : l'assistant de la cible part donc à 3d6 en gardant les deux moins bons (`doitUnDeDeMalus`), et le MJ peut retirer le dé.

### Limites connues

- Finir le tour par le bouton de l'en-tête ou la touche F sans avoir appliqué le coup ne pose ni ses dégâts ni les effets de ses options.
- Un Carnage pris deux fois doit deux attaques ; si la première rate, l'assistant ne rappelle pas la seconde.
- La taille de l'adversaire (limite du renversement) et l'arme tenue (désarmement) ne sont pas vérifiées : c'est au MJ d'en juger.
- Côté défenseur, « Parade in extremis » et « Juste une égratignure » ne sont pas proposées ; seul « Défier la mort » l'est, quand la vitalité franchit un seuil.

### Tests

- `combat-resolution.util.spec.ts` : double 6 de justesse, nombre d'options par résultat, choix des options, coups dévastateurs cumulés.
- `combat-effects.util.spec.ts` : durée des dés de malus du coup précis et du renversement.
- Pas de script navigateur rejouable pour l'héroïsme (vérifié une fois à la main le 2026-10-13) : à ajouter dans `front/scripts/` si le sujet bouge encore.
