# Le combat en session : état des lieux

Date : 2026-10-13. Ce document décrit le combat tel qu'il fonctionne dans l'application à cette date. Il remplace, pour la lecture, le spec et le plan du registre d'effets (`2026-10-12-registre-effets-combat-design.md` et `-plan.md`), qui gardent l'historique des décisions et le détail des tâches.

Règles de référence : `doc/rules/02-actions-combat.md` (livre p. 56 à 66) et `doc/rules/exemples-de-jets.md`.

Principe : l'application assiste le MJ, elle ne le remplace pas. Elle calcule et retient ce qui se calcule, et laisse le MJ corriger à la main.

## 1. Déroulement d'un combat

1. **Démarrer le combat** : le dialogue recueille le jet de réaction de chaque héros et montre l'ordre d'action qui en découle.
2. **Écran de combat** : la frise donne le round et l'ordre ; dessous, l'assistant de tour conduit le coup de la carte active en trois temps (qui, l'attaque, les dégâts). La carte « Qui attaque » porte les actions du tour : Fiche, Retarder, Défense totale, Secourir (s'il y a un mourant), Fin du tour.
3. **Fin du tour** : la carte suivante devient active ; quand tout le monde a joué, un nouveau round commence. Si le coup qui a touché n'est pas appliqué, l'application demande d'abord : l'appliquer et finir, finir sans l'appliquer, ou rester sur le tour.
4. **Hors de combat** : tout personnage à 0 de vitalité ou moins ne joue plus ; la frise l'éteint et dit pourquoi (inconscient, mourant, stabilisé, mort, hors de combat). Au début de chaque round :
   - un héros resté à 0 choisit entre reprendre ses esprits pour 1 PH (il remonte à la moitié de sa vitalité) et sombrer jusqu'à la fin du combat ;
   - un héros mourant perd 1 de vitalité, sauf s'il est stabilisé. Le message qui l'annonce porte un bouton « Stabilisé » pour le héros secouru à la table ; celui qui passe sous −5 se voit proposer « Défier la mort ».
5. **Secourir** : à son tour, un héros peut tenter de stabiliser un allié mourant au lieu d'attaquer (bouton « Secourir » de la carte « Qui attaque ») : jet d'esprit + carrière de soins, difficulté Moyenne aggravée d'un niveau par point de vitalité négatif. Le tour se termine ensuite.
6. **Terminer le combat** : chaque héros à 0 ou plus récupère la moitié des points perdus ; puis, si un héros a une carrière de soins (médecin, guérisseur, rebouteux), « Soins médicaux » rend son rang en vitalité aux blessés choisis.

## 2. Le jet de réaction

Formule : `2d6 + esprit + initiative`, réussite à 9 ou plus.

- Une carte par héros, triées par agilité brute décroissante. On tape le total des dés, ou « Lancer pour tous ».
- Double 1 : case « échec critique » ; double 6 : case « légendaire » (−1 point d'héroïsme).
- L'ordre d'action suit le livre : héros légendaires, héroïques, en réussite, rivaux, coriaces, héros en échec, piétaille, héros en échec critique. À égalité entre héros, l'agilité brute départage.

Ce que le résultat change ensuite :

| Résultat | Effet dans l'application |
| --- | --- |
| Succès héroïque ou légendaire | Coriaces et piétaille sont bloqués au round 1. |
| Succès légendaire | +1 aux jets d'attaque de ce héros, et de lui seul, pour toute la rencontre. |
| Échec critique | Le héros agit en dernier, et perd le bénéfice de son bouclier au round 1. |

## 3. Le jet d'attaque

Formule : `2d6 + bonus d'attaque − défense de la cible + posture + effets en cours`, réussite à 9 ou plus.

- **Bonus d'attaque** : agilité + mêlée (ou tir) ; pour une créature, son attaque combinée.
- **Avant le jet** : l'assistant annonce ce qu'il faut aux dés et les chances de toucher, pour la cible choisie et sur le jeton de chaque adversaire.
- **Saisie** : on tape le total des dés lancés à table, ou on les lance à l'écran.
- **Dé du MJ** : un dé de bonus ou de malus (3d6, on garde les deux meilleurs ou les deux moins bons).
- **Double 1** : raté, quel que soit le total. **Double 6** : touché, quel que soit le total.
- **Postures** : défensive, offensive, intrépide, combat à deux armes, attaque au défaut de l'armure. Créatures et démons n'en ont pas.
- **PNJ** : considérés comme équipés de toutes leurs armes et armures.

## 4. Le jet de dégâts

Formule : `dé de l'arme + vigueur − protection de la cible + effets en cours`, jamais négatif.

- Dés : d3, d6, d6M (le moins bon de deux), d6B (le meilleur de deux).
- À distance et à mains nues, la vigueur compte pour moitié (arrondie à l'inférieur).
- Avec moins de 0 en vigueur, les armes lourdes (d6B) sont grisées : elles ne se manient pas.
- La protection est la valeur fixe de l'armure ; le MJ peut lancer le dé de protection à la place, ou saisir une valeur.
- « Appliquer » retire les dégâts à la cible. Un héros qui passe sous 0, ou sous −5, se voit proposer « Défier la mort » ; sous −5, il se stabilise et ne perd plus de vitalité.

## 5. Le registre d'effets

Ce qui dure d'un tour à l'autre est gardé dans `etat_combat.effets` (JSON de la session). Un effet a un porteur, une statistique (`attaque`, `defense`, `degats`, `protection`, `action`), une valeur, un sens (`attaque` : le porteur attaque ; `subie` : il est attaqué) et une durée.

Durées : un nombre d'usages, la fin du round, le début du prochain tour du porteur, la prochaine action du porteur, la fin du combat.

### Effets posés par l'application

| Règle | Effet | Durée |
| --- | --- | --- |
| Petit bouclier | −1 à une attaque subie | Une fois par round |
| Posture défensive | +1 en défense | Jusqu'à son prochain tour |
| Posture offensive | −1 en défense | Jusqu'à son prochain tour |
| Attaque intrépide | −2 en défense, bouclier perdu | Jusqu'à son prochain tour |
| Parade à deux armes | +1 en défense | Une attaque subie, ou jusqu'à son prochain tour |
| Défense totale | +2 en défense | Jusqu'à son prochain tour |
| Coup précis | Dé de malus | Jusqu'à la fin du combat |
| Renversement | Dé de malus | Jusqu'à sa prochaine action |

### Effets posés par le MJ

Le menu « + Effet » propose, pour l'attaquant ou la cible : +1 en défense jusqu'à la fin du round, dé de malus à sa prochaine action, −1 à ses jets d'attaque jusqu'à la fin du round, perd sa prochaine action.

### Comportement

- Les effets entrent tout seuls dans l'addition des jets, un terme par effet, avec une croix pour le retirer.
- Un jet fige les effets qu'il a lus : retaper ou relancer garde le même bouclier.
- Une carte qui porte un dé de malus part à 3d6 en gardant les deux moins bons.
- La frise marque les cartes qui portent des effets et les liste en infobulle.
- Les enregistrements se font en file, dans l'ordre. Les actions de tour (fin du tour, défense totale) sont ignorées pendant un enregistrement, pour qu'un double clic ne termine pas deux tours.

## 6. L'héroïsme sur le jet d'attaque

Les usages de l'héroïsme du jet d'action valent pour le jet d'attaque.

- **Dépenser ou gagner des points** : les héros seulement. Leur compteur s'affiche à côté du nom de l'attaquant.
- **Succès héroïque sur double 6** : les héros et leurs alliés. Pour leurs adversaires, le double 6 touche, sans plus.

| Résultat des dés | Bouton | Effet |
| --- | --- | --- |
| Raté | Faveur divine −1 | La case du total se vide : on tape ou on lance le second jet, qui est gardé. |
| Double 1 | Échec critique +1 | Le héros gagne un point ; la faveur divine n'est plus proposée. |
| Touché | Succès héroïque −1 | Une option de succès héroïque. |
| Double 6 | Succès légendaire −1 | Deux options au lieu d'une. |

- **Double 6 de justesse** : si seul le double 6 pouvait toucher, le coup touche normalement, sans option gratuite ni légendaire. Il reste convertible en succès héroïque pour 1 point.
- **Pas de légendaire depuis un succès héroïque acheté**, comme le veut le livre.
- **Remboursement** : refaire le jet rend ce que les cases cochées avaient coûté ou rapporté. Changer de cible ou d'arme en cours de jet ne rend rien.

### Options de succès héroïque

Une pour un succès héroïque, deux pour un succès légendaire, la même deux fois si on veut.

| Option | Ce que fait l'application |
| --- | --- |
| Coup dévastateur | +6 aux dégâts par exemplaire. |
| Désarmement | Pas de jet de dégâts ; un bouton conclut le coup. |
| Coup précis | Dé de malus sur la cible jusqu'à la fin du combat, posé quand le coup est appliqué. |
| Renversement | Dé de malus à la prochaine action de la cible, posé quand le coup est appliqué. |
| Carnage | Nouvelle attaque immédiate annoncée ; plus aucune dépense d'héroïsme jusqu'à la fin du tour. |
| Massacrer la piétaille | Rappel en infobulle : le MJ retire les cartes. |

## 7. Hypothèses prises

Le livre ne tranche pas ces points ; l'application a choisi, et le MJ peut corriger à la main.

- **Durée d'une posture** : jusqu'au début du prochain tour de celui qui l'a prise.
- **Dé de malus du coup précis** : jusqu'à la fin du combat, et sur tous les jets d'attaque de la cible.
- **Échec critique sur une attaque** : seul le point d'héroïsme est accordé ; l'issue défavorable est à poser par le MJ.
- **Égalité entre héros dans l'ordre d'action** : agilité brute, sans le malus d'armure.

## 8. Limites connues

- Un Carnage pris deux fois doit deux attaques ; si la première rate, l'assistant ne rappelle pas la seconde.
- La taille de l'adversaire (renversement) et l'arme tenue (désarmement) ne sont pas vérifiées.
- La feinte n'existe pas comme option ; le MJ en garde la trace à la main.
- Retirer une carte ne se fait que hors combat.
- Pas d'effet libre (valeur et durée au choix) dans le menu « + Effet ».
- Pas d'annonce vocale des effets expirés.

## 9. Pistes pour la suite

- Côté défenseur : « Parade in extremis » (annuler les dégâts, bouclier ou arme brisé) et « Juste une égratignure » (1d6 de vitalité récupérée, prochaine action perdue).
- « Interrompre une action » après avoir retardé la sienne.
- Massacrer la piétaille : retirer les cartes depuis l'assistant.
- Un script navigateur rejouable pour l'héroïsme en combat, à côté de `front/scripts/e2e-petit-bouclier.mjs`.
- Hors périmètre à ce jour : journal complet des événements, annulation d'un coup, sorcellerie, guerre.

## 10. Où c'est dans le code

Tout est sous `front/src/app/bol/session/`, sauf mention contraire.

| Sujet | Fichiers |
| --- | --- |
| Jet de réaction, ordre d'action | `reaction-roll.util.ts`, `initiative.util.ts`, `play/start-combat-dialog/` |
| Calcul de l'attaque et des dégâts, options héroïques | `combat-resolution.util.ts` |
| Statistiques de combat d'une carte | `combat-attack.util.ts` |
| Registre d'effets | `play/tapis/combat-effects.util.ts`, `models/combat-effect.model.ts` |
| Tours et rounds | `play/tapis/combat-turn.util.ts`, `play/etat-saver.ts` |
| Écran de combat | `play/combat-board/`, `play/tapis/turn-order.*`, `play/tapis/turn-assistant.*`, `play/tapis/effects-list.ts`, `play/end-turn-dialog/`, `play/defier-la-mort-dialog/` |
| Page, enregistrements | `play/session-play-page.ts` |
| Jet d'action du héros | `action-roll.util.ts`, `play/action-roll-panel/` |
| Secours et soins | `rescue.util.ts`, `play/rescue-dialog/`, `play/medical-care-dialog/` |
| Validation de l'état côté serveur | `backend/app/Http/Services/Bol/BolCombatState.php` |

Chaque fichier `*.util.ts` a son `*.spec.ts` à côté.
