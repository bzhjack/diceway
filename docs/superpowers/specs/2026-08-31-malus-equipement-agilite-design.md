# Malus d'équipement (armure/bouclier/casque) sur les jets d'action

Date : 2026-08-31
Statut : validé, en attente de plan d'implémentation

## Contexte

Les règles BoL (`doc/resources/armures.md`, chapitre 2, p.53) appliquent des
malus d'attribut selon l'équipement porté :

| Équipement | Malus |
|---|---|
| Armure légère | aucun |
| Armure moyenne | -1 Agilité |
| Armure lourde | -2 Agilité |
| Petit bouclier | -1 à *une* attaque subie par round (pas de malus Agilité) |
| Grand bouclier | -1 Agilité, -1 à *toutes* les attaques subies |
| Casque | -1 Initiative |
| Baudrier de guerre | protection d'armure moyenne, **sans** le malus Agilité |

Aucun de ces malus n'est appliqué aujourd'hui dans Diceway. L'audit du code
existant (mené avant cette spec) a montré :

- **Deux points d'entrée de jet réel** utilisent l'Agilité brute du héros :
  `SkillCheckDialogComponent` (jet de compétence) et `AttackRollDialogComponent`
  (jet d'attaque, `attack-roll-dialog.ts:150-156`).
- **L'initiative** (`hero.combat.initiative`, `BolHeros.php` `getCombatAttribute()`)
  est également brute — le malus de casque n'est jamais appliqué.
- **Le malus défensif du bouclier** ("-1 à une/toutes les attaques subies") est
  un mécanisme différent de la `protection` (réduction de dégâts, déjà gérée) —
  il n'existe nulle part dans le code, ni comme donnée ni comme calcul.
- **Aucune notion "équipé" vs "en inventaire"** : la table pivot héros↔armure
  n'a pas de colonne d'état ; en combat, seul le *premier* élément de la
  liste (`armures[0]`) compte, dans un ordre arbitraire
  (`combat-attack.util.ts:39-51`).
- **Aucun champ ne distingue armure / bouclier / casque** dans le modèle
  (`BolArmureModel`) — la seule information est un libellé texte libre.
- Le bonus de Vigueur sur les jets d'attaque (mêlée / tir ÷2) est, lui, déjà
  correctement appliqué — ce n'est pas un oubli généralisé, spécifiquement
  l'agilité et les malus d'équipement.
- Créatures, démons et PNJ ont des stats de combat figées à la création (pas
  de relation armure structurée comparable à `BolHeros::armures()`) — le sujet
  ne concerne que les héros dans le modèle actuel.

## Objectif

Faire en sorte que l'équipement réellement porté par un héros influence
correctement ses jets (compétence, attaque, initiative) et sa fiche
(Agilité/Initiative affichées), sans que chaque écran ait à recalculer ou
deviner cette logique.

## Décisions de conception

- **Une seule source de vérité, côté backend** : `BolHeros` calcule les
  attributs effectifs (accesseurs, sur le même principe que
  `getAttributsAttribute()`/`getCombatAttribute()` existants) et les expose
  dans l'API. Le frontend consomme des valeurs déjà calculées, il ne
  duplique jamais la logique de malus.
- **Notion d'équipement "actif"** : ajout d'un flag `equipee` sur le pivot
  héros↔armure, remplaçant le choix arbitraire du "premier élément de la
  liste". Équiper un nouvel élément d'une catégorie déséquipe automatiquement
  l'ancien de la même catégorie (validé côté backend, pas de contrainte SQL).
- **Catégorisation structurée** : le catalogue d'armures gagne un champ
  `categorie` (armure / bouclier / casque) et des champs de malus numériques
  dédiés, remplaçant la déduction par texte libre. Le champ `malus` texte
  libre existant est conservé tel quel pour l'affichage flavor (ex.
  "Encombrant") mais n'est plus la source de vérité du calcul.
- **Périmètre héros uniquement** : PNJ/créatures/démons n'ont pas de relation
  armure structurée (stats figées) — hors de portée pour cette itération ;
  ils en bénéficieront naturellement si un système d'équipement structuré
  leur est ajouté plus tard.
- **Les deux mécaniques de bouclier sont dans le périmètre** : le malus
  d'Agilité classique du grand bouclier, ET le malus défensif ("-1 à
  une/toutes les attaques subies") qui modifie le jet de l'attaquant adverse.
- **Attributs bruts conservés** : les colonnes brutes (`agilite`,
  `initiative`) restent inchangées et éditables sur la fiche — seuls des
  champs `*_effective` s'y ajoutent en lecture.

## Backend

### Catalogue d'armures (`bol_armures`)

Nouvelle migration :

- `categorie` enum(`armure`, `bouclier`, `casque`).
- `malus_agilite` int, défaut 0.
- `malus_initiative` int, défaut 0 (casque uniquement).
- `malus_attaque_subie` int, défaut 0 (bouclier uniquement).
- `malus_attaque_subie_portee` enum(`une`, `toutes`) nullable (petit bouclier
  = `une`, grand bouclier = `toutes`).

Migration de données : script one-shot peuplant ces colonnes pour les
entrées existantes du catalogue (peu d'items, valeurs connues depuis
`armures.md`).

### Pivot héros↔armure (`bol_heros_armure`)

- Ajout colonne `equipee` boolean, défaut false.
- Règle métier (service) : au plus un élément équipé par `categorie` et par
  héros — équiper un nouvel élément déséquipe automatiquement l'ancien de la
  même catégorie.
- Migration de données : pour chaque héros existant, marque `equipee=true`
  sur le premier élément lié de chaque catégorie (préserve le comportement
  actuel de "premier de la liste" comme état de départ), `false` sur le
  reste. Le MJ ajuste ensuite l'équipement de ses héros si besoin — voir
  Risques.

### `BolHeros` — champs calculés exposés par l'API

- `attributs.agilite_effective` = agilité brute − (malus Agilité de
  l'armure équipée + malus Agilité du bouclier équipé).
- `combat.initiative_effective` = initiative brute − malus Initiative du
  casque équipé.
- `combat.defense_effective` = defense brute + malus attaque-subie du
  bouclier équipé quand sa portée est `toutes` (grand bouclier) — équivalent
  mathématique d'un malus à l'attaquant, replié directement dans le seuil de
  défense pour rester automatique.
- Nouveau bloc `equipement_effectif` : `{ bouclier_malus_attaque_subie,
  bouclier_malus_attaque_subie_portee }` — utilisé côté dialog d'attaque pour
  le cas `une` (petit bouclier), qui ne peut pas être replié automatiquement
  (voir Frontend).
- Champs bruts (`agilite`, `initiative`, `defense`) inchangés.
- Logique factorisée dans un service dédié plutôt que dupliquée entre
  plusieurs accesseurs.

### Session de combat

Aucun changement structurel nécessaire : `BolFightSessionHeros` ne stocke
aucun attribut de combat en dur (seulement `camp`, `initiative_resultat`,
`vitalite_courante`) — les attributs du héros sont toujours lus en direct
depuis la relation `BolHeros` à chaque requête
(`BolFightSessionService::getSessionWithRelations()`). Les nouveaux champs
calculés remontent donc automatiquement dans l'API session sans plomberie
supplémentaire. Un changement d'équipement en cours de session se répercute
immédiatement sur les jets suivants.

## Frontend

### Fiche héros (`hero-form-page` / `armure-list`)

- Chaque ligne d'armure affiche un badge de catégorie (Armure / Bouclier /
  Casque) et un toggle "Équipé·e".
- L'Agilité (et l'Initiative, là où elle est affichée/éditée) montre la
  valeur effective, avec la valeur brute + détail du malus en secondaire
  quand elles diffèrent (ex. `7 (8 − 1 armure)`), jamais un nombre nu qui
  change sans explication.

### Statblock (`bol-statblock.builders.ts`)

Même traitement — Agilité/Initiative effectives pour les héros uniquement ;
créatures/démons gardent leurs valeurs brutes (pas de système d'équipement).

### `SkillCheckDialogComponent`

`session-play-page.ts` (`onSkillCheck()`) passe `agilite_effective` au lieu
de la valeur brute — aucun changement dans le dialog lui-même (il reste
agnostique de l'origine de la valeur).

### `AttackRollDialogComponent`

- Bonus d'attaque de l'attaquant basé sur son `agilite_effective`.
- Défense de la cible : lit `target.combat.defense_effective` au lieu de
  `target.combat.defense` — le malus du grand bouclier ("toutes") est déjà
  replié dedans côté backend, aucune logique supplémentaire ici.
- Petit bouclier ("une attaque subie par round") : l'app n'a pas de notion
  de round à suivre ; plutôt que d'introduire ce concept, le dialog affiche
  une case à cocher optionnelle "Bonus de petit bouclier disponible ce
  round" (cochée par défaut à chaque ouverture, appliquée comme un malus
  ponctuel au jet de l'attaquant si cochée). Le MJ la décoche lui-même une
  fois le bonus consommé dans le round — geste manuel, cohérent avec le
  reste du suivi de round déjà géré à la main dans l'app.

### Modèles TypeScript

- `BolArmureModel` : + `categorie`, `malus_agilite`, `malus_initiative`,
  `malus_attaque_subie`, `malus_attaque_subie_portee`.
- Type du pivot héros↔armure : + `equipee`.
- `BolHeroModel` / `bol-fight-session.model.ts` : + `agilite_effective`,
  `initiative_effective`, `defense_effective`, `equipement_effectif`.

## Hors scope (itérations futures)

- PNJ (modèle actuel sans relation armure structurée — stats figées comme
  les créatures/démons).
- Malus de portée d'arme, arme à deux mains, et autres modificateurs de
  `doc/resources/armes.md` non liés à l'agilité/défense.
- Modificateur de jet de réaction lié à l'initiative adverse
  ("rival"/"coriace", `02-actions-combat.md`) — reste saisi manuellement par
  le MJ via le modificateur libre existant.
- Suivi de "round" en tant que concept général dans l'app — le contournement
  par case à cocher pour le petit bouclier reste une solution manuelle
  ponctuelle, pas une fondation pour d'autres mécaniques par round.

## Tests

Backend (PHPUnit) :
- Migration de données : catalogue (nouvelles colonnes correctement peuplées
  pour chaque armure existante), pivot héros (`equipee=true` sur le premier
  élément de chaque catégorie liée, `false` sur le reste).
- `BolHeros` : accesseurs `agilite_effective` / `initiative_effective` /
  `defense_effective` / `equipement_effectif` — sans équipement (= valeur
  brute), avec un seul item équipé, avec plusieurs items liés dont un seul
  équipé.
- Service d'équipement : équiper une armure déséquipe automatiquement
  l'ancienne de la même catégorie ; no-op si la catégorie équipée n'a pas
  changé.

Frontend (Vitest) :
- `SkillCheckDialogComponent` / `AttackRollDialogComponent` : résultat
  correct à partir de valeurs effectives passées en donnée (pas de nouvelle
  logique de calcul côté dialog).
- Toggle "équipé" dans `armure-list` : appelle le bon endpoint, met à jour
  l'affichage Agilité effective sans reload.

Vérification manuelle (skill `run`) : équiper un grand bouclier sur un héros
→ vérifier l'Agilité effective sur la fiche, dans le statblock, dans le jet
de compétence, et dans le jet d'attaque (comme attaquant ET comme cible d'un
adversaire) → déséquiper → tout revient à la valeur brute.

## Risques

- Migration de données sur le pivot héros↔armure : le choix "premier élément
  lié" pour l'état initial `equipee` est arbitraire mais reproduit le
  comportement actuel de l'app (pas de régression fonctionnelle au
  déploiement). Le MJ devra néanmoins vérifier/ajuster l'équipement de ses
  héros existants après déploiement pour que le malus corresponde à la
  réalité de la table.
