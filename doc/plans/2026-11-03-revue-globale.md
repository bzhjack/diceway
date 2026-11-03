# Revue globale : mineurs restants

Date : 2026-11-03. Revue des 20 commits depuis `9f3911c5`, avant la mise en production. Ce fichier ne garde que ce qui reste ouvert : les constats corrigés (les 11 importants, la clôture des tables et 19 mineurs) en sont retirés et restent dans l'historique git. Les précautions de déploiement relevées par la revue sont dans `2026-11-02-reste-a-faire.md`, § 1.

Aucun de ces points ne bloque la mise en production.

## Backend

- La validation serveur des héros ne couvre que l'écran de création avancée, pas le formulaire principal.
- Les règles Illettré et armure lourde ne sont vérifiées que par le front (`BolHerosRequest` ne les connaît pas).
- L'ajustement de la foi ou du pouvoir d'un héros n'est pas atomique.
- La vilénie de table d'un PNJ n'est jamais recalculée quand sa fiche change, même s'il change de rang.
- L'import de scénario ne connaît pas `mort_vivant`.
- La migration des PNJ aux armes régionales cherche les armes par leur nom sans se limiter au catalogue.
- Ids 3001/3002 des capacités ajoutées : sans collision, mais à surveiller si le seeder repasse.

## Tapis de combat

- La posture compte en défense pendant un sort.
- Le massacre envoie ses mises hors de combat en parallèle.
- Le dé de foi peut être imposé après le jet de l'attaquant.
- Après un rechargement, les réglages du sort (cercle, difficulté) ne reviennent pas : le MJ les règle de nouveau, sans redébit.
- Si l'enregistrement de la trace « sort payé » échoue, un rechargement ne la retrouve pas.
- Une carte paralysée qui avait aussi « Perd sa prochaine action » perdra encore cette action une fois libérée.
- « Rendre la main » à une carte qui s'est posé « Perd sa prochaine action » pendant son tour lui fait sauter ce tour rouvert (l'action perdue est déjà armée).

## Table

- Une piétaille qui a perdu son action peut rejoindre une horde.
- Une mêlée interrompue à moitié peut se rejouer dans le même round.
- Le début de round se rejoue sur un second écran ouvert sur la même table.
- La file d'enregistrement n'a pas de délai d'expiration.

## Hors combat

- Une table rouverte ne revient au bandeau de l'accueil que si c'est la plus récemment créée (l'accueil trie par date de création).
- Après un échec de rechargement du catalogue, le seuil reste bloqué jusqu'à « Réessayer ».
- Le seuil charge tout l'accueil pour deux champs.
- Un service racine importe un util de page.
- La teinte de la table ouverte se perd si la casse du nom de saga diffère.
