<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (5/8) : l'équipement général et les services, les vêtements (prix par style et par pièce), les
 * drogues de rue (livre p. 227-229, 351-357, 376 ; doc/cyberpunk/resources/equipement.md, doc/cyberpunk/rules/05-blessures-et-soins.md).
 * Lignes du livre : `user_id` null.
 */
return new class extends Migration
{
    private const CACHE = ['cpr_equipement_catalogue', 'cpr_vetements_catalogue', 'cpr_drogues_catalogue'];

    /** Équipement général et services : code, nom, type (objet ou service), prix, description, effets. */
    private const EQUIPEMENT = [
        ['code' => 'agent', 'nom' => 'Agent', 'type' => 'objet', 'prix' => 100, 'description' => 'Smartphone à IA autoadaptative : appels, puits de données, agenda, achats, puce mémoire ; se relie au cybermatériel et aux appareils domestiques. Plusieurs Agents ne se cumulent pas.', 'effets' => [['type' => 'competence', 'cible' => 'bibliotheque', 'valeur' => 2], ['type' => 'competence', 'cible' => 'habillement_et_style', 'valeur' => 2, 'condition' => 'tenues suggérées']]],
        ['code' => 'amplificateur_portable', 'nom' => 'Amplificateur portable', 'type' => 'objet', 'prix' => 50, 'description' => 'Son sur 100 m pendant 6 heures ; deux instruments.', 'effets' => null],
        ['code' => 'analyseur_chimique', 'nom' => 'Analyseur chimique', 'type' => 'objet', 'prix' => 1000, 'description' => 'Une action pour identifier la composition d’une substance.', 'effets' => null],
        ['code' => 'barre_nutritive', 'nom' => 'Barre nutritive', 'type' => 'objet', 'prix' => 10, 'description' => 'Remplace un repas.', 'effets' => null],
        ['code' => 'baton_lumineux', 'nom' => 'Bâton lumineux', 'type' => 'objet', 'prix' => 10, 'description' => 'Éclaire 4 m pendant 10 heures, usage unique.', 'effets' => null],
        ['code' => 'brouilleur_decrypteur', 'nom' => 'Brouilleur/décrypteur', 'type' => 'objet', 'prix' => 500, 'description' => 'Brouille ses communications ; décrypteur inclus.', 'effets' => null],
        ['code' => 'camera', 'nom' => 'Caméra', 'type' => 'objet', 'prix' => 100, 'description' => '12 heures de vidéo et de son sur une puce mémoire.', 'effets' => null],
        ['code' => 'charpente_lineaire_sigma_portee', 'nom' => 'Charpente linéaire Σ (sigma)', 'type' => 'objet', 'prix' => 1000, 'description' => 'Exosquelette : COR passe à 12 tant qu’on y est relié ; ni PS ni sauvegarde modifiés. Demande 1 port d’interface neuronale.', 'effets' => [['type' => 'carac_fixe', 'cible' => 'cor', 'valeur' => 12, 'condition' => 'relié, sans effet sur PS et sauvegarde']]],
        ['code' => 'charpente_lineaire_beta_portee', 'nom' => 'Charpente linéaire β (bêta)', 'type' => 'objet', 'prix' => 5000, 'description' => 'Exosquelette : COR passe à 14 tant qu’on y est relié ; ni PS ni sauvegarde modifiés. Demande 2 ports d’interface neuronale.', 'effets' => [['type' => 'carac_fixe', 'cible' => 'cor', 'valeur' => 14, 'condition' => 'relié, sans effet sur PS et sauvegarde']]],
        ['code' => 'combinaison_antiradiation', 'nom' => 'Combinaison antiradiation', 'type' => 'objet', 'prix' => 1000, 'description' => 'Protège des radiations.', 'effets' => null],
        ['code' => 'communicateur_radio', 'nom' => 'Communicateur radio', 'type' => 'objet', 'prix' => 100, 'description' => 'Oreillette radio, rayon 1,6 km.', 'effets' => null],
        ['code' => 'corde', 'nom' => 'Corde (60 m)', 'type' => 'objet', 'prix' => 20, 'description' => 'Nylon, supporte 360 kg.', 'effets' => null],
        ['code' => 'cryocuve', 'nom' => 'Cryocuve', 'type' => 'objet', 'prix' => 5000, 'description' => 'Medtech seulement : Techniques médicales SD 13 pour maintenir 1 personne en stase indéfiniment ; inconsciente, elle guérit deux fois plus vite ; couvert de 30 PS.', 'effets' => null],
        ['code' => 'cryopompe', 'nom' => 'Cryopompe', 'type' => 'objet', 'prix' => 5000, 'description' => 'Medtech seulement : une action pour mettre un sujet en stase ; plus de jets de sauvegarde contre la mort pendant une semaine au plus ; couvert de 15 PS ; 1 charge (recharge 50 ED).', 'effets' => null],
        ['code' => 'cyberconsole_mauvaise', 'nom' => 'Cyberconsole (mauvaise qualité)', 'type' => 'objet', 'prix' => 100, 'description' => 'Plateforme de netrunning ; ports d’interface neuronale et câblage neural requis.', 'effets' => [['type' => 'cyberconsole', 'emplacements' => 5]]],
        ['code' => 'cyberconsole_standard', 'nom' => 'Cyberconsole (standard)', 'type' => 'objet', 'prix' => 500, 'description' => 'Plateforme de netrunning ; ports d’interface neuronale et câblage neural requis.', 'effets' => [['type' => 'cyberconsole', 'emplacements' => 7]]],
        ['code' => 'cyberconsole_excellente', 'nom' => 'Cyberconsole (excellente qualité)', 'type' => 'objet', 'prix' => 1000, 'description' => 'Plateforme de netrunning ; ports d’interface neuronale et câblage neural requis.', 'effets' => [['type' => 'cyberconsole', 'emplacements' => 9]]],
        ['code' => 'detecteur_de_micros', 'nom' => 'Détecteur de micros', 'type' => 'objet', 'prix' => 500, 'description' => 'Bipe à 2 m d’un micro ou d’un mouchard.', 'effets' => null],
        ['code' => 'detecteur_de_radar', 'nom' => 'Détecteur de radar', 'type' => 'objet', 'prix' => 500, 'description' => 'Signale un faisceau radar à 100 m.', 'effets' => null],
        ['code' => 'enregistreur_audio', 'nom' => 'Enregistreur audio', 'type' => 'objet', 'prix' => 100, 'description' => '24 heures de son sur une puce mémoire.', 'effets' => null],
        ['code' => 'fiole_de_biotoxines', 'nom' => 'Fiole de biotoxines', 'type' => 'objet', 'prix' => 500, 'description' => 'Une action pour enduire une arme de mêlée légère : 30 minutes durant, au lieu des dégâts, Résistance à la torture/aux drogues SD 15 ou 3d6 directs aux PS.', 'effets' => null],
        ['code' => 'fiole_de_poison', 'nom' => 'Fiole de poison', 'type' => 'objet', 'prix' => 100, 'description' => 'Une action pour enduire une arme de mêlée légère : 30 minutes durant, au lieu des dégâts, Résistance à la torture/aux drogues SD 13 ou 2d6 directs aux PS.', 'effets' => null],
        ['code' => 'fourre_tout', 'nom' => 'Fourre-tout', 'type' => 'objet', 'prix' => 20, 'description' => 'Sac en nylon, de la sacoche au grand sac.', 'effets' => null],
        ['code' => 'fusee_de_detresse', 'nom' => 'Fusée de détresse', 'type' => 'objet', 'prix' => 10, 'description' => 'Éclaire 100 m pendant 1 heure, usage unique.', 'effets' => null],
        ['code' => 'instrument', 'nom' => 'Guitare électrique ou autre instrument', 'type' => 'objet', 'prix' => 500, 'description' => 'Un instrument électronique demande un ampli.', 'effets' => null],
        ['code' => 'hypodair', 'nom' => 'Hypodair', 'type' => 'objet', 'prix' => 50, 'description' => 'Une action pour injecter une dose à une cible consentante, ou attaque de mêlée sur une cible récalcitrante ; recharger n’est pas une action.', 'effets' => null],
        ['code' => 'jumelles', 'nom' => 'Jumelles', 'type' => 'objet', 'prix' => 50, 'description' => 'Grossissement × 2 ou × 3.', 'effets' => null],
        ['code' => 'lampe_torche', 'nom' => 'Lampe-torche', 'type' => 'objet', 'prix' => 20, 'description' => 'Rayon 100 m, 10 heures par charge.', 'effets' => null],
        ['code' => 'lance_grappin', 'nom' => 'Lance-grappin', 'type' => 'objet', 'prix' => 100, 'description' => 'Une action : grappin à 30 m sur un couvert épais ; câble de 10 PS ; annule les malus d’escalade ; ni arme ni agripper.', 'effets' => null],
        ['code' => 'lecteur_de_danse_sensorielle', 'nom' => 'Lecteur de danse sensorielle', 'type' => 'objet', 'prix' => 1000, 'description' => 'Vivre l’enregistrement sensoriel d’un autre.', 'effets' => null],
        ['code' => 'lunettes_connectees', 'nom' => 'Lunettes connectées', 'type' => 'objet', 'prix' => 500, 'description' => 'Deux emplacements d’options de cyberœil (comptées comme couplées, prix d’une seule pose) ; une paire à la fois.', 'effets' => [['type' => 'emplacements_cyberoeil', 'valeur' => 2]]],
        ['code' => 'lunettes_de_realite_virtuelle', 'nom' => 'Lunettes de réalité virtuelle', 'type' => 'objet', 'prix' => 100, 'description' => 'Superposent le cyberespace au réel (netrunning).', 'effets' => null],
        ['code' => 'matelas_et_sac_de_couchage', 'nom' => 'Matelas autogonflant et sac de couchage', 'type' => 'objet', 'prix' => 20, 'description' => 'Tient dans 15 × 15 cm.', 'effets' => null],
        ['code' => 'mediscanner', 'nom' => 'Médiscanner', 'type' => 'objet', 'prix' => 1000, 'description' => 'Assiste les soins d’urgence ; bonus non cumulable.', 'effets' => [['type' => 'competence', 'cible' => 'premiers_secours', 'valeur' => 2], ['type' => 'competence', 'cible' => 'assistance_medicale', 'valeur' => 2]]],
        ['code' => 'menottes', 'nom' => 'Menottes', 'type' => 'objet', 'prix' => 50, 'description' => 'Se brisent avec COR supérieur à 10.', 'effets' => null],
        ['code' => 'ordinateur', 'nom' => 'Ordinateur', 'type' => 'objet', 'prix' => 50, 'description' => 'Portable ou de bureau.', 'effets' => null],
        ['code' => 'outils_de_crochetage', 'nom' => 'Outils de crochetage', 'type' => 'objet', 'prix' => 20, 'description' => 'Serrures mécaniques.', 'effets' => null],
        ['code' => 'pack_hygiene', 'nom' => 'Pack hygiène', 'type' => 'objet', 'prix' => 20, 'description' => 'Brosse à dents, lingettes, peigne…', 'effets' => null],
        ['code' => 'pad_de_percussion', 'nom' => 'Pad de percussion électronique', 'type' => 'objet', 'prix' => 500, 'description' => 'Batterie simulée ; demande un ampli.', 'effets' => null],
        ['code' => 'paquet_de_croquettes', 'nom' => 'Paquet de croquettes', 'type' => 'objet', 'prix' => 10, 'description' => 'Un repas.', 'effets' => null],
        ['code' => 'peinture_phosphorescente', 'nom' => 'Peinture phosphorescente', 'type' => 'objet', 'prix' => 20, 'description' => 'Bombe aérosol qui brille dans le noir.', 'effets' => null],
        ['code' => 'protection_auditive_active', 'nom' => 'Protection auditive active', 'type' => 'objet', 'prix' => 1000, 'description' => 'Immunise contre la surdité et les sons dangereux (munitions étourdissantes…).', 'effets' => null],
        ['code' => 'puces_memoire', 'nom' => 'Puces mémoire', 'type' => 'objet', 'prix' => 10, 'description' => 'Stockage.', 'effets' => null],
        ['code' => 'ration_alimentaire', 'nom' => 'Ration alimentaire', 'type' => 'objet', 'prix' => 10, 'description' => 'Repas autochauffant.', 'effets' => null],
        ['code' => 'recepteur_radio', 'nom' => 'Récepteur radio/lecteur de musique', 'type' => 'objet', 'prix' => 50, 'description' => 'Musique du puits de données ou d’une puce ; écoute les bandes radio à 1,6 km.', 'effets' => null],
        ['code' => 'respirateur_antipollution', 'nom' => 'Respirateur antipollution', 'type' => 'objet', 'prix' => 20, 'description' => 'Immunise contre les gaz, fumées et substances inhalées.', 'effets' => null],
        ['code' => 'ruban_adhesif', 'nom' => 'Ruban adhésif', 'type' => 'objet', 'prix' => 20, 'description' => 'Existe phosphorescent.', 'effets' => null],
        ['code' => 'sacoche_de_medtech', 'nom' => 'Sacoche de Medtech', 'type' => 'objet', 'prix' => 100, 'description' => 'Trousse médicale complète.', 'effets' => null],
        ['code' => 'technioutil', 'nom' => 'Technioutil', 'type' => 'objet', 'prix' => 100, 'description' => 'Outil multifonction.', 'effets' => null],
        ['code' => 'technoscanner', 'nom' => 'Technoscanner', 'type' => 'objet', 'prix' => 1000, 'description' => 'Assiste les réparations ; bonus non cumulable.', 'effets' => [['type' => 'competence', 'cible' => 'electronique', 'valeur' => 2], ['type' => 'competence', 'cible' => 'cybertech', 'valeur' => 2], ['type' => 'competence', 'cible' => 'terratech', 'valeur' => 2], ['type' => 'competence', 'cible' => 'maritech', 'valeur' => 2], ['type' => 'competence', 'cible' => 'aerotech', 'valeur' => 2], ['type' => 'competence', 'cible' => 'securite_electronique', 'valeur' => 2], ['type' => 'competence', 'cible' => 'armurerie', 'valeur' => 2]]],
        ['code' => 'telephone_jetable', 'nom' => 'Téléphone portable jetable', 'type' => 'objet', 'prix' => 50, 'description' => 'Intraçable.', 'effets' => null],
        ['code' => 'tente_et_bivouac', 'nom' => 'Tente et matériel de bivouac', 'type' => 'objet', 'prix' => 50, 'description' => 'Tente une place, casserole autochauffante.', 'effets' => null],
        ['code' => 'traceur', 'nom' => 'Traceur', 'type' => 'objet', 'prix' => 500, 'description' => 'Suit un marqueur à 1,6 km ; marqueur supplémentaire 50 ED.', 'effets' => null],
        ['code' => 'trousse_de_techie', 'nom' => 'Trousse de Techie', 'type' => 'objet', 'prix' => 500, 'description' => 'Outils, pièces, chalumeau, technioutil inclus.', 'effets' => null],
        ['code' => 'pelle_ou_hache', 'nom' => 'Pelle ou hache', 'type' => 'objet', 'prix' => 50, 'description' => 'Seulement dans le générateur de Marché de nuit (p. 339).', 'effets' => null],
        ['code' => 'boisson_bar_miteux', 'nom' => 'Boisson, bar miteux', 'type' => 'service', 'prix' => 10, 'description' => null, 'effets' => null],
        ['code' => 'boisson_bar_correct', 'nom' => 'Boisson, bar correct', 'type' => 'service', 'prix' => 10, 'description' => null, 'effets' => null],
        ['code' => 'boisson_bar_repute', 'nom' => 'Boisson, bar réputé', 'type' => 'service', 'prix' => 20, 'description' => null, 'effets' => null],
        ['code' => 'boisson_bar_haut_de_gamme', 'nom' => 'Boisson, bar haut de gamme', 'type' => 'service', 'prix' => 50, 'description' => null, 'effets' => null],
        ['code' => 'concert', 'nom' => 'Concert, événement sportif en direct', 'type' => 'service', 'prix' => 100, 'description' => null, 'effets' => null],
        ['code' => 'danse_sensorielle', 'nom' => 'Danse sensorielle', 'type' => 'service', 'prix' => 20, 'description' => null, 'effets' => null],
        ['code' => 'danse_sensorielle_interactive', 'nom' => 'Danse sensorielle interactive', 'type' => 'service', 'prix' => 50, 'description' => null, 'effets' => null],
        ['code' => 'film', 'nom' => 'Film', 'type' => 'service', 'prix' => 20, 'description' => null, 'effets' => null],
        ['code' => 'hotel', 'nom' => 'Hôtel, par nuit', 'type' => 'service', 'prix' => 100, 'description' => null, 'effets' => null],
        ['code' => 'hotel_de_luxe', 'nom' => 'Hôtel de luxe, par nuit', 'type' => 'service', 'prix' => 500, 'description' => null, 'effets' => null],
        ['code' => 'installation_boutique', 'nom' => 'Installation de pièce mère (boutique)', 'type' => 'service', 'prix' => 100, 'description' => null, 'effets' => null],
        ['code' => 'installation_centre_medical', 'nom' => 'Installation de pièce mère (centre médical)', 'type' => 'service', 'prix' => 500, 'description' => null, 'effets' => null],
        ['code' => 'installation_hopital', 'nom' => 'Installation de pièce mère (hôpital)', 'type' => 'service', 'prix' => 1000, 'description' => null, 'effets' => null],
        ['code' => 'jeu_video', 'nom' => 'Jeu vidéo', 'type' => 'service', 'prix' => 50, 'description' => null, 'effets' => null],
        ['code' => 'repas_fast_food', 'nom' => 'Repas, fast-food', 'type' => 'service', 'prix' => 10, 'description' => null, 'effets' => null],
        ['code' => 'repas_correct', 'nom' => 'Repas, restaurant correct', 'type' => 'service', 'prix' => 20, 'description' => null, 'effets' => null],
        ['code' => 'repas_qualite_superieure', 'nom' => 'Repas, qualité supérieure', 'type' => 'service', 'prix' => 50, 'description' => null, 'effets' => null],
        ['code' => 'repas_haut_de_gamme', 'nom' => 'Repas, haut de gamme', 'type' => 'service', 'prix' => 500, 'description' => null, 'effets' => null],
        ['code' => 'sculpture_corporelle_standard', 'nom' => 'Sculpture corporelle (standard)', 'type' => 'service', 'prix' => 500, 'description' => null, 'effets' => null],
        ['code' => 'sculpture_corporelle_exotique', 'nom' => 'Sculpture corporelle (exotique)', 'type' => 'service', 'prix' => 1000, 'description' => 'Perte d’Humanité 4d6.', 'effets' => null],
        ['code' => 'service_pro_correct', 'nom' => 'Service professionnel correct, par heure', 'type' => 'service', 'prix' => 100, 'description' => null, 'effets' => null],
        ['code' => 'service_pro_superieur', 'nom' => 'Service professionnel de qualité supérieure, par heure', 'type' => 'service', 'prix' => 500, 'description' => null, 'effets' => null],
        ['code' => 'service_pro_haut_de_gamme', 'nom' => 'Service professionnel haut de gamme, par heure', 'type' => 'service', 'prix' => 5000, 'description' => null, 'effets' => null],
        ['code' => 'taxi', 'nom' => 'Taxi', 'type' => 'service', 'prix' => 20, 'description' => null, 'effets' => null],
        ['code' => 'therapie_humanite', 'nom' => 'Thérapie (perte d’Humanité normale)', 'type' => 'service', 'prix' => 500, 'description' => 'Regagne 2d6 points d’Humanité ; Techniques médicales SD 15, une semaine.', 'effets' => null],
        ['code' => 'therapie_humanite_grave', 'nom' => 'Thérapie (perte d’Humanité grave)', 'type' => 'service', 'prix' => 1000, 'description' => 'Regagne 4d6 points d’Humanité ; Techniques médicales SD 17, une semaine.', 'effets' => null],
        ['code' => 'therapie_addiction', 'nom' => 'Thérapie (addiction)', 'type' => 'service', 'prix' => 1000, 'description' => 'Libère d’une addiction ; Techniques médicales SD 15, une semaine.', 'effets' => null],
        ['code' => 'traitement_sd_10', 'nom' => 'Traitement médical (SD 10)', 'type' => 'service', 'prix' => 50, 'description' => null, 'effets' => null],
        ['code' => 'traitement_sd_13', 'nom' => 'Traitement médical (SD 13)', 'type' => 'service', 'prix' => 100, 'description' => null, 'effets' => null],
        ['code' => 'traitement_sd_15', 'nom' => 'Traitement médical (SD 15)', 'type' => 'service', 'prix' => 500, 'description' => null, 'effets' => null],
        ['code' => 'traitement_sd_17', 'nom' => 'Traitement médical (SD 17+)', 'type' => 'service', 'prix' => 1000, 'description' => null, 'effets' => null],
        ['code' => 'trauma_team_silver', 'nom' => 'Trauma Team (couverture Silver), par mois', 'type' => 'service', 'prix' => 500, 'description' => 'Chirurgie payée au prix de l’hôpital.', 'effets' => null],
        ['code' => 'trauma_team_gold', 'nom' => 'Trauma Team (couverture Gold), par mois', 'type' => 'service', 'prix' => 1000, 'description' => 'Chirurgie comprise.', 'effets' => null],
    ];

    /** Pièces de vêtement, dans l'ordre des colonnes de PRIX_DES_STYLES. */
    private const PIECES = ['bas' => 'Bas', 'haut' => 'Haut', 'veste' => 'Veste', 'chaussures' => 'Chaussures', 'bijoux' => 'Bijoux', 'verres_miroirs' => 'Verres miroirs', 'lunettes' => 'Lunettes', 'lentilles_de_contact' => 'Lentilles de contact', 'couvre_chef' => 'Couvre-chef'];

    /** [code, nom, exemples, prix par pièce]. */
    private const STYLES = [
        ['vagabond', 'Vagabond', 'sans-abri, guenilles, clochard', [20, 10, 20, 20, 20, 20, 10, 10, 10]],
        ['couleurs_du_gang', 'Couleurs du gang', 'dangereux, violent, rebelle', [50, 20, 50, 20, 50, 20, 20, 10, 10]],
        ['generique', 'Générique', 'standard, coloré, modulable', [50, 20, 50, 20, 50, 20, 20, 10, 10]],
        ['boheme', 'Bohème', 'pastoral, rétro, liberté', [50, 20, 50, 50, 100, 50, 50, 10, 10]],
        ['decontracte', 'Décontracté', 'confort, souplesse, pratique sportive', [100, 20, 100, 50, 100, 50, 50, 20, 50]],
        ['ame_nomade', 'Âme nomade', 'western, élimé, tribal', [100, 20, 100, 100, 100, 50, 50, 20, 100]],
        ['pop_asiatique', 'Pop asiatique', 'coloré, cosplay, kawaii', [100, 20, 100, 100, 100, 100, 100, 100, 100]],
        ['urbain_flash', 'Urbain flash', 'tape-à-l’œil, technologique, streetwear', [100, 20, 100, 100, 100, 100, 100, 100, 100]],
        ['cadre_sup', 'Cadre sup', 'leadership, présence, autorité', [500, 50, 500, 500, 5000, 500, 500, 100, 500]],
        ['haute_couture', 'Haute couture', 'inédit, grand couturier, sur-mesure', [1000, 500, 1000, 5000, 50000, 1000, 1000, 1000, 5000]],
    ];

    /** [code, nom, prix par dose, durée de l'effet principal (heures), SD de l'effet secondaire, effet principal, effet secondaire, effets]. */
    private const DROGUES = [
        ['boost', 'Boost', 50, 24, 17, 'INT +2 (peut dépasser 8).', 'Accro : INT −2 tant que l’addiction dure.',
            [['type' => 'carac', 'cible' => 'int', 'valeur' => 2, 'condition' => 'effet principal']]],
        ['dentelle_noire', 'Dentelle noire', 50, 24, 17,
            'Perte d’Humanité de 2d6 à la prise, rendue si l’effet secondaire est évité ; ignore les effets des blessures graves.',
            'La perte d’Humanité est définitive ; accro : RÉF −2 hors effet principal.',
            [['type' => 'ignore_blessure_grave', 'condition' => 'effet principal'], ['type' => 'perte_humanite', 'des' => '2d6']]],
        ['smash', 'Smash', 10, 4, 15, '+2 en Danse, Contorsion, Conversation, Psychologie, Persuasion, Jeu d’acteur.',
            'Accro : −2 dans ces mêmes compétences ; envies de dose à jouer.',
            [['type' => 'competence', 'cible' => 'danse', 'valeur' => 2], ['type' => 'competence', 'cible' => 'contorsion', 'valeur' => 2],
                ['type' => 'competence', 'cible' => 'conversation', 'valeur' => 2], ['type' => 'competence', 'cible' => 'psychologie', 'valeur' => 2],
                ['type' => 'competence', 'cible' => 'persuasion', 'valeur' => 2], ['type' => 'competence', 'cible' => 'jeu_d_acteur', 'valeur' => 2]]],
        ['synthecoke', 'Synthécoke', 20, 4, 15, 'RÉF +1 (peut dépasser 8) ; bouffées de paranoïa à jouer.',
            'Accro : RÉF −2 hors effet principal ; envies à jouer.',
            [['type' => 'carac', 'cible' => 'ref', 'valeur' => 1, 'condition' => 'effet principal']]],
        ['verre_bleu', 'Verre bleu', 20, 4, 15, '« Flashs » annoncés par le MJ : pas d’action pendant ce tour.',
            'Accro : l’effet principal ne provoque plus de flash, mais l’accro a des flashs hors effet (environ un par heure).', null],
    ];

    public function up(): void
    {
        Schema::create('cpr_equipement', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 50)->nullable()->unique();
            $table->string('nom', 80);
            $table->string('type', 10); // objet, service
            $table->unsignedInteger('prix');
            $table->text('description')->nullable();
            $table->json('effets')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_vetement', function (Blueprint $table) {
            $table->id();
            $table->string('style', 30); // code du style
            $table->string('style_nom', 40);
            $table->string('exemples', 80);
            $table->string('piece', 30); // code de la pièce
            $table->string('piece_nom', 40);
            $table->unsignedInteger('prix');
            $table->unique(['style', 'piece']);
        });

        Schema::create('cpr_drogue', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 30)->nullable()->unique();
            $table->string('nom', 40);
            $table->unsignedInteger('prix'); // par dose
            $table->unsignedTinyInteger('duree_heures');
            $table->unsignedTinyInteger('sd_effet_secondaire');
            $table->text('effet_principal');
            $table->text('effet_secondaire');
            $table->json('effets')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        $now = now();
        foreach (self::EQUIPEMENT as $index => $objet) {
            DB::table('cpr_equipement')->insert([
                ...$objet,
                'effets' => $objet['effets'] === null ? null : json_encode($objet['effets'], JSON_UNESCAPED_UNICODE),
                'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $vetements = [];
        foreach (self::STYLES as [$style, $styleNom, $exemples, $prix]) {
            foreach (array_keys(self::PIECES) as $colonne => $piece) {
                $vetements[] = [
                    'style' => $style, 'style_nom' => $styleNom, 'exemples' => $exemples,
                    'piece' => $piece, 'piece_nom' => self::PIECES[$piece], 'prix' => $prix[$colonne],
                ];
            }
        }
        DB::table('cpr_vetement')->insert($vetements);

        foreach (self::DROGUES as $index => [$code, $nom, $prix, $duree, $sd, $principal, $secondaire, $effets]) {
            DB::table('cpr_drogue')->insert([
                'code' => $code, 'nom' => $nom, 'prix' => $prix, 'duree_heures' => $duree, 'sd_effet_secondaire' => $sd,
                'effet_principal' => $principal, 'effet_secondaire' => $secondaire,
                'effets' => $effets === null ? null : json_encode($effets, JSON_UNESCAPED_UNICODE),
                'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        $this->viderLeCache();
    }

    private function viderLeCache(): void
    {
        foreach (self::CACHE as $cle) {
            Cache::forget($cle);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_drogue');
        Schema::dropIfExists('cpr_vetement');
        Schema::dropIfExists('cpr_equipement');
        $this->viderLeCache();
    }
};
