<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Cyberpunk RED, données de référence (1/8) : les rôles, les compétences, les 20 compétences de chaque rôle avec leur niveau au Rat des
 * Rues, et les tables de CARAC des rôles. Les tables sont créées et remplies ici, d'après le livre de base (doc/cyberpunk/resources/roles.md,
 * doc/cyberpunk/rules/02-competences-et-resolution.md) : un `migrate` suffit sur chaque poste.
 */
return new class extends Migration
{
    /** Les clés de cache de CprReferenceData que ces listes alimentent. */
    private const CACHE = ['cpr_roles_all', 'cpr_competences_all'];

    private const CARACS = ['int', 'ref', 'dex', 'tech', 'pres', 'vol', 'cha', 'mouv', 'cor', 'emp'];

    private const ROLES = [
        ['rockeur', 'Rockeur', 'Charisme irrésistible', 'Musicien, artiste, agitateur : influence ses fans.'],
        ['solo', 'Solo', 'Conscience tactique', 'Combattant professionnel, garde du corps, assassin.'],
        ['netrunner', 'Netrunner', 'Interface', 'Pirate informatique du NET.'],
        ['techie', 'Techie', 'Bricoleur', 'Répare, modifie, fabrique, invente.'],
        ['medtech', 'Medtech', 'Médecine', 'Médecin de rue et charcudoc.'],
        ['media', 'Média', 'Crédibilité', 'Journaliste qui expose la vérité.'],
        ['justicier', 'Justicier', 'Renforts', 'Agent des forces de l\'ordre.'],
        ['corporatiste', 'Corporatiste', 'Travail d\'équipe', 'Cadre d\'une corporation.'],
        ['fixer', 'Fixer', 'Intermédiaire', 'Négociant, receleur, entremetteur.'],
        ['nomade', 'Nomade', 'Moto', 'Membre d\'une famille nomade, pilote et mécanicien.'],
    ];

    /** [nom, CARAC, catégorie, coût, spécialité, précision de la compétence de base (null : pas de base), rôle réservé, note]. */
    private const COMPETENCES = [
        ['Concentration', 'vol', 'vigilance', 1, null, '', null, null],
        ['Dissimulation/Révélation d\'objet', 'int', 'vigilance', 1, null, null, null, 'Cacher ou trouver un objet dissimulé.'],
        ['Lecture sur les lèvres', 'int', 'vigilance', 1, null, null, null, null],
        ['Perception', 'int', 'vigilance', 1, null, '', null, 'Indices, pièges, personnes en Discrétion ; pas les objets dissimulés.'],
        ['Pistage', 'int', 'vigilance', 1, null, null, null, null],
        ['Athlétisme', 'dex', 'corps', 1, null, '', null, 'Sauter, escalader, lancer, nager, soulever.'],
        ['Contorsion', 'dex', 'corps', 1, null, null, null, null],
        ['Danse', 'dex', 'corps', 1, null, null, null, null],
        ['Discrétion', 'dex', 'corps', 1, null, '', null, null],
        ['Endurance', 'vol', 'corps', 1, null, null, null, 'Rester actif sans nourriture, sommeil ni eau ; efforts prolongés.'],
        ['Résistance à la torture/aux drogues', 'vol', 'corps', 1, null, null, null, 'Poisons, drogues, interrogatoires.'],
        ['Conduite de véhicule terrestre', 'ref', 'controle', 1, null, null, null, null],
        ['Équitation', 'ref', 'controle', 1, null, null, null, null],
        ['Pilotage de véhicule aérien', 'ref', 'controle', 2, null, null, null, null],
        ['Pilotage de véhicule maritime', 'ref', 'controle', 1, null, null, null, null],
        ['Bibliothèque', 'int', 'education', 1, null, null, null, 'Bases de données, puits de données, archives.'],
        ['Bureaucratie', 'int', 'education', 1, null, null, null, null],
        ['Composition', 'int', 'education', 1, null, null, null, null],
        ['Comptabilité', 'int', 'education', 1, null, null, null, null],
        ['Connaissance', 'int', 'education', 1, null, '', null, 'Éducation générale : lire, écrire, compter, histoire.'],
        ['Criminologie', 'int', 'education', 1, null, null, null, null],
        ['Cryptographie', 'int', 'education', 1, null, null, null, null],
        ['Déduction', 'int', 'education', 1, null, null, null, null],
        ['Dressage', 'int', 'education', 1, null, null, null, null],
        ['Gestion d\'affaires', 'int', 'education', 1, null, null, null, null],
        ['Guide local', 'int', 'education', 1, 'lieu', 'quartier d\'origine', null, 'Un lieu à chaque augmentation (au plus un quartier ou une communauté).'],
        ['Jeux de hasard', 'int', 'education', 1, null, null, null, null],
        ['Langue', 'int', 'education', 1, 'langue', 'argot', null, 'Une langue à chaque augmentation.'],
        ['Science', 'int', 'education', 1, 'domaine', null, null, 'Un domaine à chaque augmentation.'],
        ['Survie en milieu hostile', 'int', 'education', 1, null, null, null, null],
        ['Tactique', 'int', 'education', 1, null, null, null, null],
        ['Arme de mêlée', 'dex', 'combat', 1, null, null, null, null],
        ['Art martial', 'dex', 'combat', 2, 'forme', null, null, 'Une forme à chaque augmentation (aïkido, judo, karaté, taekwondo).'],
        ['Bagarre', 'dex', 'combat', 1, null, '', null, 'Frapper, agripper.'],
        ['Esquive', 'dex', 'combat', 1, null, '', null, 'Mêlée ; aussi tirs et explosions avec RÉF 8 ou plus.'],
        ['Armes d\'épaule', 'ref', 'tir', 1, null, null, null, 'Fusils, fusils à pompe.'],
        ['Armes lourdes', 'ref', 'tir', 2, null, null, null, 'Lance-grenades, lance-roquettes.'],
        ['Pistolet', 'ref', 'tir', 1, null, null, null, 'Pistolets et pistolets-mitrailleurs.'],
        ['Tir à l\'arc', 'ref', 'tir', 1, null, null, null, null],
        ['Tir automatique', 'ref', 'tir', 2, null, null, null, 'Tir automatique, tir de suppression.'],
        ['Instrument', 'tech', 'representation', 1, 'instrument', null, null, null],
        ['Jeu d\'acteur', 'pres', 'representation', 1, null, null, null, null],
        ['Connaissance de la rue', 'pres', 'sociabilite', 1, null, null, null, null],
        ['Conversation', 'emp', 'sociabilite', 1, null, '', null, null],
        ['Corruption', 'pres', 'sociabilite', 1, null, null, null, null],
        ['Habillement et style', 'pres', 'sociabilite', 1, null, null, null, null],
        ['Interrogatoire', 'pres', 'sociabilite', 1, null, null, null, null],
        ['Look', 'pres', 'sociabilite', 1, null, null, null, null],
        ['Négoce', 'pres', 'sociabilite', 1, null, null, null, null],
        ['Persuasion', 'pres', 'sociabilite', 1, null, '', null, null],
        ['Psychologie', 'emp', 'sociabilite', 1, null, '', null, null],
        ['Aérotech', 'tech', 'technique', 1, null, null, null, 'Réparer les véhicules aériens.'],
        ['Armurerie', 'tech', 'technique', 1, null, null, null, 'Réparer les armes.'],
        ['Arts plastiques', 'tech', 'technique', 1, null, null, null, null],
        ['Assistance médicale', 'tech', 'technique', 2, null, null, null, null],
        ['Contrefaçon', 'tech', 'technique', 1, null, null, null, null],
        ['Crochetage', 'tech', 'technique', 1, null, null, null, null],
        ['Cybertech', 'tech', 'technique', 1, null, null, null, 'Réparer la cybernétique.'],
        ['Électronique', 'tech', 'technique', 1, null, null, null, 'Appareils simples et tout ce qu\'aucune autre compétence de Technique ne couvre.'],
        ['Explosifs', 'tech', 'technique', 2, null, null, null, null],
        ['Maritech', 'tech', 'technique', 1, null, null, null, 'Réparer les véhicules maritimes.'],
        ['Photos et films', 'tech', 'technique', 1, null, null, null, null],
        ['Pickpocket', 'tech', 'technique', 1, null, null, null, null],
        ['Premiers secours', 'tech', 'technique', 1, null, '', null, null],
        ['Sécurité électronique', 'tech', 'technique', 2, null, null, null, null],
        ['Terratech', 'tech', 'technique', 1, null, null, null, 'Réparer les véhicules terrestres.'],
        ['Chirurgie', 'tech', 'technique', 1, null, null, 'medtech', 'Réservée au Medtech : vient de la spécialité Chirurgie de Médecine (2 niveaux par point).'],
        ['Techniques médicales', 'tech', 'technique', 1, null, null, 'medtech', 'Réservée au Medtech : vient des spécialités Médicaments et Maintenance des cryosystèmes de Médecine.'],
    ];

    /** Niveau au Rat des Rues des 13 compétences de base, dans l'ordre de ROLES. */
    private const NIVEAUX_DE_BASE = [
        'Athlétisme' => [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        'Bagarre' => [6, 2, 2, 2, 2, 2, 6, 2, 2, 6],
        'Concentration' => [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        'Connaissance' => [2, 2, 6, 6, 6, 2, 2, 6, 2, 2],
        'Conversation' => [2, 2, 2, 2, 6, 6, 6, 6, 6, 2],
        'Discrétion' => [2, 2, 6, 2, 2, 2, 2, 2, 2, 6],
        'Esquive' => [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        'Guide local' => [4, 2, 2, 2, 2, 6, 2, 2, 6, 2],
        'Langue' => [2, 2, 2, 2, 2, 2, 2, 2, 4, 2],
        'Perception' => [2, 6, 2, 2, 2, 6, 2, 2, 2, 4],
        'Persuasion' => [6, 2, 2, 2, 2, 6, 2, 6, 4, 2],
        'Premiers secours' => [6, 6, 2, 6, 2, 2, 2, 2, 2, 6],
        'Psychologie' => [6, 2, 2, 2, 6, 6, 2, 6, 6, 2],
    ];

    /** Les 7 compétences de rôle et leur niveau au Rat des Rues. */
    private const COMPETENCES_DE_ROLE = [
        'rockeur' => ['Arme de mêlée' => 6, 'Composition' => 6, 'Connaissance de la rue' => 6, 'Habillement et style' => 4, 'Instrument' => 6, 'Look' => 4, 'Pistolet' => 6],
        'solo' => ['Arme de mêlée' => 6, 'Armes d\'épaule' => 6, 'Interrogatoire' => 6, 'Pistolet' => 6, 'Résistance à la torture/aux drogues' => 6, 'Tactique' => 6, 'Tir automatique' => 6],
        'netrunner' => ['Bibliothèque' => 6, 'Cryptographie' => 6, 'Cybertech' => 6, 'Dissimulation/Révélation d\'objet' => 6, 'Électronique' => 6, 'Pistolet' => 6, 'Sécurité électronique' => 6],
        'techie' => ['Armes d\'épaule' => 6, 'Armurerie' => 6, 'Cybertech' => 6, 'Électronique' => 6, 'Science' => 6, 'Sécurité électronique' => 6, 'Terratech' => 6],
        'medtech' => ['Armes d\'épaule' => 6, 'Assistance médicale' => 6, 'Cybertech' => 4, 'Déduction' => 6, 'Électronique' => 6, 'Résistance à la torture/aux drogues' => 4, 'Science' => 6],
        'media' => ['Bibliothèque' => 4, 'Composition' => 6, 'Corruption' => 6, 'Déduction' => 6, 'Lecture sur les lèvres' => 4, 'Photos et films' => 4, 'Pistolet' => 6],
        'justicier' => ['Armes d\'épaule' => 6, 'Criminologie' => 6, 'Déduction' => 6, 'Interrogatoire' => 6, 'Pistage' => 6, 'Pistolet' => 6, 'Tir automatique' => 6],
        'corporatiste' => ['Bureaucratie' => 6, 'Comptabilité' => 6, 'Déduction' => 6, 'Gestion d\'affaires' => 6, 'Lecture sur les lèvres' => 6, 'Look' => 4, 'Pistolet' => 6],
        'fixer' => ['Connaissance de la rue' => 6, 'Contrefaçon' => 6, 'Corruption' => 6, 'Crochetage' => 4, 'Gestion d\'affaires' => 6, 'Négoce' => 6, 'Pistolet' => 6],
        'nomade' => ['Arme de mêlée' => 6, 'Conduite de véhicule terrestre' => 6, 'Dressage' => 6, 'Négoce' => 6, 'Pistage' => 6, 'Pistolet' => 6, 'Survie en milieu hostile' => 6],
    ];

    /** Tables de CARAC (1d10) : INT, RÉF, DEX, TECH, PRES, VOL, CHA, MOUV, COR, EMP. */
    private const PROFILS = [
        'rockeur' => [
            [7, 6, 6, 5, 6, 8, 7, 7, 3, 8],
            [3, 7, 7, 7, 7, 6, 7, 7, 5, 8],
            [4, 5, 7, 7, 6, 6, 7, 7, 5, 8],
            [4, 5, 7, 7, 6, 8, 7, 6, 3, 8],
            [3, 7, 7, 7, 6, 8, 6, 5, 4, 7],
            [5, 6, 7, 5, 7, 8, 5, 7, 3, 7],
            [5, 6, 6, 7, 7, 8, 7, 6, 3, 6],
            [5, 7, 7, 5, 6, 6, 6, 6, 4, 8],
            [3, 5, 5, 6, 7, 8, 7, 5, 5, 7],
            [4, 5, 6, 5, 8, 8, 7, 6, 4, 7],
        ],
        'solo' => [
            [6, 7, 7, 3, 8, 6, 5, 5, 6, 5],
            [7, 8, 6, 3, 6, 6, 7, 5, 6, 6],
            [5, 8, 7, 4, 7, 7, 6, 7, 8, 5],
            [5, 8, 6, 4, 6, 7, 6, 5, 7, 6],
            [6, 6, 7, 5, 7, 6, 7, 6, 8, 4],
            [7, 7, 6, 5, 7, 6, 6, 7, 7, 5],
            [7, 7, 6, 5, 6, 7, 7, 6, 6, 6],
            [7, 8, 7, 5, 6, 6, 5, 6, 8, 4],
            [7, 7, 6, 4, 6, 6, 6, 5, 6, 5],
            [6, 6, 8, 5, 6, 6, 5, 6, 6, 5],
        ],
        'netrunner' => [
            [5, 8, 7, 7, 7, 4, 8, 7, 7, 4],
            [5, 6, 7, 5, 8, 3, 8, 7, 5, 5],
            [5, 6, 8, 6, 6, 4, 7, 6, 7, 4],
            [5, 7, 7, 7, 7, 5, 8, 6, 5, 5],
            [5, 8, 8, 5, 7, 3, 7, 5, 5, 6],
            [6, 6, 6, 7, 8, 4, 7, 7, 6, 6],
            [6, 6, 6, 7, 6, 5, 7, 7, 7, 6],
            [5, 7, 8, 6, 8, 4, 8, 5, 7, 4],
            [7, 6, 7, 7, 6, 3, 6, 5, 6, 5],
            [7, 8, 6, 6, 6, 4, 7, 7, 5, 6],
        ],
        'techie' => [
            [6, 7, 7, 8, 4, 4, 5, 5, 7, 6],
            [7, 6, 6, 7, 5, 3, 7, 7, 5, 5],
            [8, 6, 5, 7, 5, 4, 7, 7, 5, 7],
            [7, 8, 7, 8, 4, 4, 6, 5, 6, 7],
            [6, 6, 7, 6, 4, 3, 7, 7, 6, 6],
            [8, 7, 5, 6, 3, 3, 7, 6, 6, 7],
            [8, 6, 7, 8, 4, 4, 7, 6, 7, 6],
            [8, 8, 7, 8, 5, 4, 6, 5, 6, 6],
            [6, 6, 7, 8, 3, 3, 5, 7, 7, 7],
            [8, 8, 5, 6, 4, 4, 6, 5, 6, 6],
        ],
        'medtech' => [
            [7, 5, 6, 7, 5, 3, 8, 5, 5, 7],
            [6, 7, 7, 7, 4, 4, 6, 7, 7, 7],
            [6, 5, 5, 8, 5, 3, 8, 5, 7, 8],
            [8, 7, 6, 8, 3, 5, 6, 6, 5, 7],
            [6, 7, 5, 7, 5, 5, 8, 7, 6, 8],
            [8, 5, 5, 8, 5, 5, 6, 6, 5, 6],
            [8, 6, 5, 8, 5, 4, 8, 5, 7, 7],
            [6, 5, 7, 7, 3, 5, 8, 5, 5, 8],
            [6, 6, 7, 7, 5, 4, 6, 6, 5, 6],
            [8, 7, 6, 6, 3, 4, 8, 7, 6, 7],
        ],
        'media' => [
            [6, 6, 5, 5, 8, 7, 5, 7, 5, 7],
            [8, 7, 7, 3, 6, 6, 6, 5, 6, 8],
            [6, 7, 7, 5, 6, 8, 5, 5, 5, 7],
            [6, 5, 7, 5, 6, 7, 5, 5, 6, 6],
            [6, 6, 7, 4, 8, 7, 6, 7, 5, 8],
            [7, 5, 5, 4, 8, 7, 6, 7, 5, 8],
            [8, 5, 6, 3, 7, 6, 6, 5, 6, 7],
            [6, 5, 6, 5, 6, 8, 6, 6, 7, 8],
            [7, 7, 5, 4, 6, 7, 6, 5, 6, 7],
            [7, 6, 6, 3, 7, 6, 7, 6, 7, 6],
        ],
        'justicier' => [
            [5, 6, 7, 5, 7, 8, 5, 6, 5, 6],
            [6, 6, 6, 5, 6, 8, 5, 7, 5, 5],
            [5, 7, 7, 7, 6, 7, 5, 5, 7, 6],
            [6, 6, 7, 6, 6, 8, 5, 7, 7, 6],
            [6, 6, 7, 6, 7, 7, 6, 5, 5, 6],
            [7, 6, 5, 5, 7, 8, 5, 6, 7, 4],
            [7, 8, 7, 5, 6, 8, 7, 6, 5, 4],
            [5, 6, 6, 5, 6, 8, 5, 7, 6, 4],
            [7, 7, 5, 5, 7, 7, 6, 5, 5, 6],
            [6, 6, 5, 6, 8, 7, 5, 7, 6, 6],
        ],
        'corporatiste' => [
            [8, 5, 5, 3, 8, 6, 6, 5, 5, 7],
            [8, 6, 6, 4, 7, 6, 7, 7, 5, 7],
            [8, 7, 6, 3, 8, 6, 7, 6, 4, 5],
            [8, 5, 7, 5, 6, 5, 6, 5, 5, 7],
            [7, 7, 6, 5, 8, 5, 7, 7, 5, 6],
            [5, 7, 7, 3, 6, 7, 6, 5, 5, 7],
            [6, 6, 7, 5, 8, 7, 6, 7, 4, 6],
            [6, 7, 7, 3, 7, 5, 7, 5, 5, 7],
            [7, 6, 7, 5, 7, 5, 7, 6, 5, 5],
            [7, 7, 5, 5, 8, 6, 6, 7, 4, 7],
        ],
        'fixer' => [
            [8, 5, 7, 4, 6, 5, 8, 5, 5, 8],
            [8, 5, 5, 5, 6, 7, 8, 7, 5, 7],
            [6, 6, 6, 4, 5, 6, 8, 6, 3, 8],
            [7, 7, 5, 5, 7, 6, 7, 7, 5, 8],
            [8, 6, 6, 3, 6, 5, 8, 7, 5, 6],
            [8, 7, 5, 5, 6, 7, 7, 5, 3, 6],
            [8, 6, 6, 5, 6, 5, 6, 7, 5, 8],
            [6, 6, 7, 4, 7, 6, 7, 7, 4, 7],
            [8, 7, 7, 5, 5, 5, 7, 6, 5, 7],
            [6, 5, 6, 5, 5, 6, 8, 6, 4, 7],
        ],
        'nomade' => [
            [6, 6, 8, 3, 6, 7, 6, 6, 6, 4],
            [5, 7, 6, 5, 8, 8, 8, 7, 5, 4],
            [5, 8, 6, 3, 8, 7, 6, 5, 6, 5],
            [5, 8, 7, 4, 8, 6, 7, 7, 7, 5],
            [6, 6, 6, 3, 6, 7, 6, 7, 7, 4],
            [7, 6, 8, 4, 6, 7, 6, 5, 6, 5],
            [6, 7, 8, 4, 6, 6, 7, 5, 7, 5],
            [5, 7, 8, 3, 8, 6, 7, 5, 5, 5],
            [6, 7, 6, 4, 8, 6, 6, 6, 6, 6],
            [5, 6, 7, 4, 7, 8, 7, 7, 7, 4],
        ],
    ];

    public function up(): void
    {
        Schema::create('cpr_role', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('nom', 50);
            $table->string('capacite', 50); // la capacité de rôle
            $table->string('resume')->nullable();
            $table->unsignedTinyInteger('ordre');
            $table->timestamps();
        });

        Schema::create('cpr_competence', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('nom', 60);
            $table->string('carac', 4); // int, ref, dex, tech, pres, vol, cha, mouv, cor, emp
            $table->string('categorie', 20); // vigilance, corps, controle, education, combat, tir, representation, sociabilite, technique
            $table->unsignedTinyInteger('cout')->default(1); // 2 : compétence (x2), deux fois plus chère
            $table->boolean('de_base')->default(false); // niveau 2 minimum à la création
            $table->string('precision_de_base', 40)->nullable(); // Langue (argot), Guide local (quartier d'origine)
            $table->string('specialite', 20)->nullable(); // langue, lieu, domaine, forme, instrument : à préciser à chaque achat
            $table->foreignId('reservee_role_id')->nullable()->constrained('cpr_role'); // Chirurgie, Techniques médicales : Medtech
            $table->string('note')->nullable();
            $table->unsignedTinyInteger('ordre');
            $table->timestamps();
        });

        Schema::create('cpr_role_competence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('cpr_role')->cascadeOnDelete();
            $table->foreignId('competence_id')->constrained('cpr_competence')->cascadeOnDelete();
            $table->string('precision', 40)->nullable(); // argot, quartier d'origine ; null : au choix (Instrument, Science)
            $table->boolean('de_role')->default(false); // l'une des 7 compétences du rôle (sinon : compétence de base)
            $table->unsignedTinyInteger('niveau_rat_des_rues');
            $table->unique(['role_id', 'competence_id']);
        });

        Schema::create('cpr_role_profil', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('cpr_role')->cascadeOnDelete();
            $table->unsignedTinyInteger('jet'); // 1 à 10
            foreach (self::CARACS as $carac) {
                $table->unsignedTinyInteger($carac);
            }
            $table->unique(['role_id', 'jet']);
        });

        $this->remplir();
        $this->viderLeCache();
    }

    private function remplir(): void
    {
        $now = now();
        $roles = [];
        foreach (self::ROLES as $ordre => [$code, $nom, $capacite, $resume]) {
            $roles[$code] = DB::table('cpr_role')->insertGetId([
                'code' => $code, 'nom' => $nom, 'capacite' => $capacite, 'resume' => $resume, 'ordre' => $ordre + 1,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $competences = [];
        foreach (self::COMPETENCES as $ordre => [$nom, $carac, $categorie, $cout, $specialite, $precisionDeBase, $reservee, $note]) {
            $competences[$nom] = DB::table('cpr_competence')->insertGetId([
                'code' => $this->code($nom), 'nom' => $nom, 'carac' => $carac, 'categorie' => $categorie, 'cout' => $cout,
                'de_base' => $precisionDeBase !== null, 'precision_de_base' => $precisionDeBase ?: null,
                'specialite' => $specialite, 'reservee_role_id' => $reservee ? $roles[$reservee] : null, 'note' => $note,
                'ordre' => $ordre + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        $precisions = [];
        foreach (self::COMPETENCES as [$nom, , , , , $precisionDeBase]) {
            $precisions[$nom] = $precisionDeBase ?: null;
        }

        foreach (self::ROLES as $index => [$code]) {
            $lignes = [];
            foreach (self::NIVEAUX_DE_BASE as $nom => $niveaux) {
                $lignes[] = [
                    'role_id' => $roles[$code], 'competence_id' => $competences[$nom], 'precision' => $precisions[$nom],
                    'de_role' => false, 'niveau_rat_des_rues' => $niveaux[$index],
                ];
            }
            foreach (self::COMPETENCES_DE_ROLE[$code] as $nom => $niveau) {
                $lignes[] = [
                    'role_id' => $roles[$code], 'competence_id' => $competences[$nom], 'precision' => null,
                    'de_role' => true, 'niveau_rat_des_rues' => $niveau,
                ];
            }
            DB::table('cpr_role_competence')->insert($lignes);

            $profils = [];
            foreach (self::PROFILS[$code] as $jet => $valeurs) {
                $profils[] = ['role_id' => $roles[$code], 'jet' => $jet + 1, ...array_combine(self::CARACS, $valeurs)];
            }
            DB::table('cpr_role_profil')->insert($profils);
        }
    }

    /** « Dissimulation/Révélation d'objet » → « dissimulation_revelation_d_objet ». */
    private function code(string $nom): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', '_', strtolower(Str::ascii($nom))), '_');
    }

    private function viderLeCache(): void
    {
        foreach (self::CACHE as $cle) {
            Cache::forget($cle);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_role_profil');
        Schema::dropIfExists('cpr_role_competence');
        Schema::dropIfExists('cpr_competence');
        Schema::dropIfExists('cpr_role');
        $this->viderLeCache();
    }
};
