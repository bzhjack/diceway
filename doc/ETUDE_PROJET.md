# Etude du projet Diceway

## Objet

Ce document est une premiere lecture du depot a partir d'une analyse statique du code. Je n'ai pas lance l'application ni execute les tests dans cette passe. L'objectif est de clarifier :

- la structure du monorepo
- les applications presentes et leur maturite
- l'architecture technique front / back
- les zones a consolider avant de poursuivre le developpement

## Vue d'ensemble

Diceway est un projet oriente jeu de role, centre ici sur **Barbarians of Lemuria (BoL)**.

Le depot contient :

- un **backend Laravel 12** dans `backend/`
- au moins **3 applications Angular** distinctes :
  - `frontend/` : front riche, recent, avec auth, BoL, dice UI et PrimeNG
  - `frontend2/` : front BoL tres fourni, semble etre la branche fonctionnelle la plus complete cote metier
  - `front/` : squelette Angular 21 quasi vierge, probablement un redemarrage ou une base de refonte
- un document produit/metier a la racine : `interface_mj_session_bol.md`

## Lecture rapide par dossier

### `backend/`

Stack principale :

- PHP 8.2+ / 8.4
- Laravel 12
- Sanctum pour les tokens
- Social login Google via verification d'ID token
- Docker Apache/PHP expose sur `:8080`

Ce backend expose surtout une API REST pour :

- authentification et profil utilisateur
- gestion des heros BoL
- PNJ
- creatures
- demons
- regions, langues, carrieres, armes, armures
- quetes / protagonistes
- dashboard BoL

Le coeur metier est structure de facon assez classique :

- `app/Http/Controllers/...` pour les endpoints
- `app/Models/Bol/...` pour les entites
- `app/Http/Services/Bol/...` pour une partie de la lecture composee
- `database/migrations/` : 48 migrations
- `database/seeders/` : 19 seeders

Observation importante : `DatabaseSeeder.php` ne branche actuellement aucun seeder BoL. En l'etat, un `php artisan db:seed` standard ne peuple pas les donnees metier.

### `frontend/`

Application Angular moderne avec :

- Angular 21
- PrimeNG 21
- OAuth Google cote front
- gestion de token Bearer en `sessionStorage`
- proxy dev vers `http://127.0.0.1:8080`
- UI autour de BoL et d'un playground
- bibliotheque de des 3D (`@3d-dice/*`)
- Konva / Three / image cropper / spinner

Indices utiles :

- routes publiques : login, register, forgotten, reset, callback, etc.
- route protegee principale : `bol`
- composant notable : `bol-playground`

Ce front parait etre une version recente, mais cote metier il semble moins profond que `frontend2/` sur la navigation BoL complete.

### `frontend2/`

Application Angular tres fournie fonctionnellement, avec :

- auth complete
- dashboard BoL
- listes et ecrans dedies pour heros, creatures, PNJ, demons, quetes
- services d'etat par domaine
- playground / dice service
- PrimeNG

Le routage montre un perimetre tres large :

- `/bol`
- `/bol/heros`
- `/bol/creature`
- `/bol/pnj`
- `/bol/demon`
- `/bol/quest`
- `/bol/quest/:id`
- `/play`

En lecture pure du code, `frontend2/` ressemble a la **base metier la plus avancee**.

### `front/`

`front/` est un projet Angular 21 quasi vide :

- 6 fichiers applicatifs
- template Angular par defaut encore present
- aucune route metier

Conclusion probable : ce dossier sert de base de refonte, de test ou de futur remplacement, mais il n'est pas aujourd'hui l'application Diceway exploitable.

## Architecture fonctionnelle observee

Le couple principal semble etre :

- **backend Laravel** pour l'API et la persistence
- **frontend2** ou **frontend** pour l'interface utilisateur

### Authentification

Le backend expose :

- login / logout / register
- verification email
- reset de mot de passe
- login Google par ID token

Le mode reel observe cote front est surtout **Bearer token en sessionStorage**, pas un flux Sanctum full cookie/session. La config CORS du backend autorise pourtant aussi les credentials. Il y a donc un melange de conventions a simplifier.

### Domaine BoL

Le domaine metier est deja bien pose :

- fiches de heros et PNJ
- bestiaire creatures / demons
- traits, carrieres, langues, equipements
- quetes et protagonistes
- compteurs dashboard
- interface de playground / table de jeu

Le document `interface_mj_session_bol.md` confirme une intention produit claire : construire une **interface MJ de session**, orientee pilotage en temps reel sur un seul ecran.

## Points forts

- separation nette front / back
- modele metier BoL deja riche
- plusieurs ecrans CRUD deja presents
- authentification classique + Google deja branchee
- dockerisation simple du backend
- presence d'un cap produit explicite pour l'interface MJ

## Points de vigilance

### 1. Trois fronts en parallele

Le depot contient trois applications Angular avec des niveaux de maturite tres differents. C'est aujourd'hui la principale source de confusion du projet.

Recommandation : choisir rapidement un front de reference.

- si l'objectif est la continuite metier BoL : partir de `frontend2/`
- si l'objectif est une refonte UX/tech plus recente : migrer progressivement de `frontend2/` vers `frontend/`
- ne pas investir dans `front/` tant que son role n'est pas tranche

### 2. Seeders non relies au seeding global

Les seeders BoL existent, mais `DatabaseSeeder` ne les appelle pas. Cela complique la remise en route du projet et le partage d'environnement.

### 3. Tests tres faibles par rapport a la taille du projet

Backend :

- seulement les tests Laravel d'exemple

Fronts :

- presence de specs unitaires, mais la couverture reelle n'est pas visible sans execution

Le niveau de verification automatique parait faible face au volume metier.

### 4. Secret Google present dans un front public

Dans `frontend/src/environments/*`, un `googleClientSecret` apparait encore meme si un commentaire indique qu'il est inutilise. Dans une SPA, ce secret ne doit pas vivre cote client.

### 5. Cohabitation de generations techniques

Le depot melange :

- Angular 19
- Angular 21
- anciens et nouveaux patterns Angular
- plusieurs variantes de design system et d'organisation

Ce n'est pas bloquant, mais cela rend la maintenance plus couteuse.

## Lecture de maturite

Mon diagnostic rapide est le suivant :

- **backend/** : base serieuse et deja exploitable
- **frontend2/** : version metier la plus complete
- **frontend/** : version plus recente techniquement, interessante pour une consolidation
- **front/** : chantier non demarre

## Recommandation concrete

Si le but est de faire avancer le produit sans repartir de zero :

1. declarer officiellement `frontend2/` comme front metier source
2. lister ce qui doit etre porte vers `frontend/`
3. supprimer l'ambiguite autour de `front/`
4. brancher les seeders BoL dans `DatabaseSeeder`
5. ajouter un vrai README racine avec procedure de demarrage

## Demarrage probable du projet

### Backend

- `cd backend`
- fournir un `.env.local`
- lancer la base MySQL
- `composer install`
- `php artisan migrate`
- `php artisan serve` ou `docker compose up`

Le `docker-compose.yml` du backend expose le service web sur `http://127.0.0.1:8080`.

### Front le plus probable aujourd'hui

Pour une reprise fonctionnelle, je regarderais d'abord :

- `cd frontend2`
- `npm install`
- `npm start`

Le proxy de dev pointe aussi vers `http://127.0.0.1:8080`.

## Conclusion

Le projet n'est pas un simple prototype : le socle metier BoL est deja important, surtout cote backend et `frontend2/`. En revanche, le depot souffre d'un probleme classique de trajectoire : plusieurs fronts coexistent, ce qui masque la version de reference.

La priorite n'est probablement pas d'ajouter une 4e base UI, mais de **choisir une application front canonique**, de fiabiliser l'initialisation du backend, puis d'aligner la feuille de route produit sur l'interface MJ de session deja formulee.
