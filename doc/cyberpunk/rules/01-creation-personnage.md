# Création de personnage

Pages source : p. 27-120 (« L'âme et la nouvelle machine », « Histoires de la Rue », « Paré pour le futur », fin de « Fusionner le cyber et le punk »). Texte : `doc/cyberpunk/pdf-text/03-roles-p27-42.txt`, `04-histoires-de-la-rue-p43-70.txt`, `05-caracteristiques-competences-equipement-p71-106.txt`, `06-cybermateriel-p107-120.txt`.

Les tables à recopier (profils de CARAC par rôle, niveaux de compétences du Rat des Rues, équipement et attirail de départ par rôle, tables du parcours) relèvent de `resources/` (à faire).

## Trois méthodes

| Étape | Rat des Rues (profil générique) | Edgerunner (rapide et sans filet) | Formule complète (par points) |
| --- | --- | --- | --- |
| 1. Rôle | au choix, capacité de rôle au **rang 4** | idem | idem |
| 2. Parcours | parcours personnel + parcours du rôle ; Langue d'origine au niveau 4 | idem | idem |
| 3. CARAC | `1d10` → une ligne entière du tableau du rôle, sans modification | `1d10` **par CARAC** dans les colonnes du tableau du rôle | **62 points** à répartir, chaque CARAC entre 2 et 8 |
| 4. CARAC dérivées | calcul | calcul | calcul |
| 5. Compétences | niveaux imposés par le rôle | **86 points** sur les 20 compétences du rôle, chacune entre 2 et 6 | **86 points** libres, aucune au-dessus de 6, compétences de base à 2 minimum |
| 6. Armes et armure | imposées par le rôle | imposées par le rôle | achetées sur **2 550 ED** (avec équipement et cyberimplants) |
| 7. Attirail et vêtements | imposés par le rôle, **+ 500 ED** à dépenser ou garder | idem | dans les 2 550 ED, **+ 800 ED** réservés aux vêtements et à la cyberfashion (perdus s'ils ne sont pas dépensés) |
| 8. Cyberimplants | imposés par le rôle (`06-cybermateriel-et-humanite.md`) | idem | dans les 2 550 ED ; option « vendre son âme » |

Formule complète : pas de pot commun entre joueurs pour les budgets de départ ; l'argent non dépensé (hors vêtements) est conservé.

## Les rôles

| Rôle | Capacité de rôle | En bref |
| --- | --- | --- |
| Rockeur | Charisme irrésistible | Musicien, artiste, agitateur : influence ses fans. |
| Solo | Conscience tactique | Combattant professionnel, garde du corps, assassin. |
| Netrunner | Interface | Pirate informatique du NET. |
| Techie | Bricoleur | Répare, modifie, fabrique, invente. |
| Medtech | Médecine | Médecin de rue et charcudoc. |
| Média | Crédibilité | Journaliste qui expose la vérité. |
| Justicier | Renforts | Agent des forces de l'ordre (vigile, flic, shérif…). |
| Corporatiste | Travail d'équipe | Cadre d'une corporation. |
| Fixer | Intermédiaire | Négociant, receleur, entremetteur. |
| Nomade | Moto | Membre d'une famille nomade, pilote et mécanicien. |

Capacités détaillées : `03-capacites-de-role.md`.

## Caractéristiques (CARAC)

Dix CARAC, généralement de 1 à 8 (elles peuvent dépasser 8). À la création : **entre 2 et 8**.

| Groupe | CARAC | Rôle en jeu |
| --- | --- | --- |
| Mentales | Intelligence (INT) | intellect, ruse, perception, apprentissage |
| Mentales | Volonté (VOL) | détermination, sang-froid, courage ; entre dans les PS |
| Mentales | Prestance (PRES) | impressionner, influencer, aisance sociale |
| Mentales | Empathie (EMP) | lien aux autres ; donne l'Humanité, retarde la cyberpsychose |
| Combat | Technique (TECH) | outils et instruments, bricolage |
| Combat | Réflexes (RÉF) | temps de réaction, visée ; armes à distance, Initiative, esquive des balles à 8+ |
| Fortune | Chance (CHA) | réserve de points à dépenser en bonus, restaurée à chaque session |
| Physiques | Corps (COR) | carrure, résistance ; PS, sauvegarde contre la mort, dégâts à mains nues |
| Physiques | Dextérité (DEX) | équilibre, acrobatie ; mêlée et esquive |
| Physiques | Mouvement (MOUV) | vitesse de déplacement |

Ordre du tableau de CARAC du livre : INT, RÉF, DEX, TECH, PRES, VOL, CHA, MOUV, COR, EMP.

**Formule complète — points de CARAC selon le rang du personnage** (le livre recommande de s'en tenir au personnage de départ) :

| Rang du personnage | Points |
| --- | --- |
| Personnage de soutien mineur | 50 |
| **Personnage de départ** | **62** |
| Personnage de soutien majeur | 70 |
| Héros mineur | 75 |
| Héros majeur | 80 |

## Caractéristiques dérivées

| Dérivée | Formule |
| --- | --- |
| Points de santé (PS) | `10 + 5 × ⌈(COR + VOL) / 2⌉` |
| Seuil de blessure grave | `⌈PS / 2⌉` |
| Sauvegarde contre la mort | `COR` |
| Humanité (HUM) | `EMP × 10` |

Exemple : COR 7, VOL 6 → ⌈13/2⌉ = 7 → PS = 45, blessure grave sous 23, sauvegarde 7. EMP 5 → Humanité 50. Perte d'Humanité et EMP : `06-cybermateriel-et-humanite.md`.

## Compétences

- Coût : **1 point par niveau**, **2 points** pour les compétences `× 2`. Liste complète : `02-competences-et-resolution.md`.
- **Compétences de base**, au moins au niveau 2 (Edgerunner et Formule complète) : Athlétisme, Bagarre, Concentration, Connaissance, Conversation, Discrétion, Esquive, Guide local (quartier d'origine), Langue (argot), Perception, Persuasion, Premiers secours, Psychologie.
- **Langue d'origine** : niveau 4 gratuit, choisie selon l'origine culturelle du parcours (en plus de l'argot, que tout le monde parle).
- Chaque rôle a **20 compétences** : les 13 de base et 7 compétences de rôle. L'Edgerunner répartit ses 86 points uniquement sur elles (conseil du livre : 4 par compétence, puis 6 points à placer).

| Rôle | 7 compétences de rôle |
| --- | --- |
| Rockeur | Arme de mêlée, Composition, Connaissance de la rue, Habillement et style, Instrument (1 au choix), Look, Pistolet |
| Solo | Arme de mêlée, Armes d'épaule, Interrogatoire, Pistolet, Résistance à la torture/aux drogues, Tactique, Tir automatique (× 2) |
| Netrunner | Bibliothèque, Cryptographie, Cybertech, Dissimulation/Révélation d'objet, Électronique, Pistolet, Sécurité électronique (× 2) |
| Techie | Armes d'épaule, Armurerie, Cybertech, Électronique, Science (1 au choix), Sécurité électronique (× 2), Terratech |
| Medtech | Armes d'épaule, Assistance médicale (× 2), Cybertech, Déduction, Électronique, Résistance à la torture/aux drogues, Science (1 au choix) |
| Média | Bibliothèque, Composition, Corruption, Déduction, Lecture sur les lèvres, Photos et films, Pistolet |
| Justicier | Armes d'épaule, Criminologie, Déduction, Interrogatoire, Pistage, Pistolet, Tir automatique (× 2) |
| Corporatiste | Bureaucratie, Comptabilité, Déduction, Gestion d'affaires, Lecture sur les lèvres, Look, Pistolet |
| Fixer | Connaissance de la rue, Contrefaçon, Corruption, Crochetage, Gestion d'affaires, Négoce, Pistolet |
| Nomade | Arme de mêlée, Conduite de véhicule terrestre, Dressage, Négoce, Pistage, Pistolet, Survie en milieu hostile |

Les niveaux imposés du **Rat des Rues** (p. 86-87) prennent ces mêmes 20 compétences, à 2, 4 ou 6.

## Équipement

- **Catégories d'armes** : mêlée (DEX), à distance (RÉF), exotiques (variantes spécialisées, de qualité ordinaire, sans accessoires ni munitions spéciales sauf mention). Classes, dégâts et prix : `04-combat.md`.
- Chaque arme à distance non exotique a **3 emplacements d'accessoires** (le même accessoire en double n'a pas d'effet). Munitions standard : **10 ED les 10** (Bon marché) ; grenades et roquettes au Marché de nuit.
- **Armure** : une pièce pour la tête ou pour le corps ; règles dans `04-combat.md`.
- **Attirail** typique : matelas autogonflant et sac de couchage, Agent (ordinateur de poche communicant), puces mémoires, cyberconsole (Netrunner), technioutil, nourriture, effets personnels.
- Les listes complètes (armes de qualité, accessoires, munitions, équipement, vêtements, cyberimplants) sont au Marché de nuit, p. 340 et suivantes.

## Niveau de vie et logement de départ

- **Tous sauf le Corporatiste** : un conteneur dans une banlieue bondée ou une zone de combat, Niveau de vie « croquettes ». Le premier mois est gratuit ; ensuite **1 100 ED** le premier du mois (loyer et croquettes), sinon expulsion le lendemain.
- **Corporatiste** : conapt corporatiste gratuit en zone corporatiste, Niveau de vie « prépacks de qualité » à **600 ED** le premier de chaque mois.
- Nomade : options de logement supplémentaires par sa capacité Moto. Détail des niveaux de vie et logements : `09-economie.md` (livre p. 377).

## Parcours (lifepath)

Un organigramme d'événements à tirer (`1d10` ou `1d6` par table) ou à choisir librement ; il nourrit l'interprétation et les accroches de scénario. Seule l'origine culturelle a un effet mécanique (la langue).

**Parcours personnel** (p. 44-55) : origines culturelles → personnalité → tenue et style (vêtements, coiffure, accessoire favori) → valeur fondamentale, ce que vous pensez des gens, la personne et la chose qui vous tiennent le plus à cœur → origines familiales → environnement d'enfance → crise familiale → amis (`1d10 − 7`, min. 0, puis une table par ami) → ennemis (`1d10 − 7` ; qui, pourquoi, ce qu'il peut faire, vengeance) → tragédies amoureuses (`1d10 − 7`) → but dans la vie.

| 1d10 | Origine culturelle | Langues proposées (une au choix, niveau 4) |
| --- | --- | --- |
| 1 | Amérique du Nord | chinois, cree, créole, anglais, français, navajo, espagnol |
| 2 | Amérique du Sud et centrale | créole, anglais, allemand, guarani, maya, portugais, quechua, espagnol |
| 3 | Europe de l'Ouest | néerlandais, anglais, français, allemand, italien, norvégien, portugais, espagnol |
| 4 | Europe de l'Est | anglais, finlandais, polonais, roumain, russe, ukrainien |
| 5 | Moyen-Orient et Afrique du Nord | arabe, berbère, anglais, farsi, français, hébreu, turc |
| 6 | Afrique subsaharienne | arabe, anglais, français, haoussa, lingala, oromo, portugais, swahili, twi, yoruba |
| 7 | Asie du Sud | bengali, dari, anglais, hindi, népalais, singhalais, tamoul, urdu |
| 8 | Asie du Sud-Est | arabe, birman, anglais, philippin, hindi, indonésien, khmer, malaisien, vietnamien |
| 9 | Asie de l'Est | cantonais, anglais, japonais, coréen, mandarin, mongol |
| 10 | Océanie et îles du Pacifique | anglais, français, hawaïen, maori, pama-nyungan, tahitien |

Une langue absente de la liste peut être choisie à la place.

**Parcours du rôle** (p. 56-70) : quelques tables propres à chaque rôle (quel genre de Rockeur / Solo / Runner…, partenaire, espace de travail, clients, fournisseurs, qui vous cherche des noises, principes, etc.).

## Fiche de personnage

Fiche de trois pages (p. 450-452) : portrait, pseudo, rôle et capacité ; CARAC (valeur maximum / actuelle) ; Humanité, PS, seuil de blessure grave, sauvegarde contre la mort, blessures critiques, addictions ; compétences par catégorie (niveau, CARAC, base) ; armes et armure (PA, pénalité) ; points d'amélioration et réputation ; parcours ; attirail, munitions, eurodollars, vêtements, Niveau de vie, logement ; une page de cybermatériel par pièce mère.
