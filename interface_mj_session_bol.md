# 🧙‍♂️ Interface MJ -- Session de jeu (BoL)

## 🎯 Objectif

Créer une interface unique permettant au MJ de : - gérer une session en
temps réel - accéder rapidement à toutes les informations utiles -
fluidifier la narration sans friction - limiter la navigation entre
écrans

------------------------------------------------------------------------

## 🧭 Concept clé

L'interface repose sur une **"table de session"** :

> Un écran central qui regroupe tout ce qui est utile pendant la partie.

------------------------------------------------------------------------

## 🧱 Structure globale

L'écran est divisé en **4 zones principales** :

    +--------------------------------------------------+
    | HEADER SESSION                                   |
    +----------------+----------------+----------------+
    |                |                |                |
    | PROTAGONISTES  |   SCÈNE ACTIVE |    OUTILS      |
    | (gauche)       |   (centre)     |    (droite)    |
    |                |                |                |
    +----------------+----------------+----------------+

------------------------------------------------------------------------

## 🔝 1. Header -- Contexte de session

### Contenu

-   Nom de la campagne / session
-   Lieu actuel
-   Scène en cours
-   Temps fictionnel

### Actions rapides

-   Ajouter PNJ
-   Lancer combat
-   Faire un jet
-   Ouvrir notes
-   Créer scène

------------------------------------------------------------------------

## 👥 2. Colonne gauche -- Protagonistes

### Sections

-   PJ présents
-   PNJ impliqués

### Carte personnage (résumé)

-   Nom
-   Rôle / carrière
-   Vitalité
-   États (tags)
-   Boutons d'action

### États possibles

-   blessé
-   hostile
-   allié
-   inconscient
-   empoisonné
-   hors-combat

------------------------------------------------------------------------

## 🎬 3. Zone centrale -- Scène active

### Contenu

-   Nom de la scène
-   Description courte
-   Enjeux
-   Ambiance
-   Événements récents

### Actions

-   Ajouter événement
-   Ajouter conséquence
-   Déclencher rencontre
-   Passer en combat

### Timeline

Liste chronologique des événements importants

------------------------------------------------------------------------

## 🛠️ 4. Colonne droite -- Outils

### Modules

-   Assistant de jets
-   Assistant de combat
-   Règles rapides
-   Notes
-   Inventaire

### Comportement

-   Change selon le contexte
-   Mode combat automatique si activé

------------------------------------------------------------------------

## ⚔️ Mode combat

### Contenu

-   Liste des combattants
-   Initiative
-   Vitalité
-   États

### Actions

-   Attaquer
-   Défendre
-   Manœuvre
-   Utiliser héroïsme

### Résolution

-   Calcul automatique
-   Résultat + suggestion narrative

------------------------------------------------------------------------

## 🧠 Concept de focus

### Niveaux

-   Campagne : tout
-   Session : ce soir
-   Scène : maintenant
-   Combat : instantané

------------------------------------------------------------------------

## 🚀 Objectif UX

-   Tout accessible en un écran
-   Minimum de clics
-   Lecture rapide
-   Priorité au narratif


Oui. Dans le nouveau chat, mentionne simplement frontend-ui-ux-design et dis quel écran MJ on traite en premier.