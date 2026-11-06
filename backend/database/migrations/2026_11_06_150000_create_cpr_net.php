<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (6/8) : programmes, GLACE et Démons, matériel de cyberconsole (livre p. 202-218,
 * doc/cyberpunk/rules/07-netrunning.md). Les défenses (drones, tourelles, pièges) viendront avec les architectures. Lignes du livre :
 * `user_id` null.
 */
return new class extends Migration
{
    private const CACHE = ['cpr_programmes_catalogue', 'cpr_materiel_net_catalogue'];

    /** Programmes : [code, nom, classe, cible, ATT, DÉF, REZ, prix, effet]. Classe : soutien, defensif, offensif ; cible : antiprogramme, antipersonnel. */
    private const PROGRAMMES = [
        ['effaceur', 'Effaceur', 'soutien', null, 0, 0, 7, 20, '+2 aux jets de Masquage tant qu’il est rezzé.'],
        ['loupe', 'Loupe', 'soutien', null, 0, 0, 7, 20, '+2 aux jets de Cartographie tant qu’il est rezzé.'],
        ['speedy_gonzalvez', 'Speedy Gonzalvez', 'soutien', null, 0, 0, 7, 100, '+2 en Vitesse tant qu’il est rezzé.'],
        ['ver', 'Ver', 'soutien', null, 0, 0, 7, 50, '+2 aux jets de Porte dérobée tant qu’il est rezzé.'],
        ['armure', 'Armure', 'defensif', null, 0, 0, 7, 50, '−4 à tous les dégâts au cerveau ; une copie active à la fois, une utilisation par Netrun.'],
        ['bouclier', 'Bouclier', 'defensif', null, 0, 0, 7, 20, 'Arrête le premier effet réussi d’un programme non-GLACE qui ferait des dégâts au cerveau, puis se dérezze ; une copie, une fois par Netrun.'],
        ['tir_de_barrage', 'Tir de barrage', 'defensif', null, 0, 0, 7, 50, 'ATT 0 pour tous les programmes offensifs non-GLACE lancés contre vous ; une copie, une fois par Netrun.'],
        ['bannissement', 'Bannissement', 'offensif', 'antiprogramme', 1, 0, 0, 50, '2d6 aux GLACE, 3d6 aux autres programmes.'],
        ['sabre', 'Sabre', 'offensif', 'antiprogramme', 1, 0, 0, 50, '3d6 aux GLACE, 2d6 aux autres programmes.'],
        ['consolekrash', 'ConsoleKRASH', 'offensif', 'antipersonnel', 0, 0, 0, 100, 'Déconnexion forcée et dangereuse de la cible.'],
        ['feubeu', 'Feubeu', 'offensif', 'antipersonnel', 2, 0, 0, 100, '2d6 au cerveau ; sans câblage isolé, console et vêtements prennent feu (2 PS à chaque fin de tour jusqu’à une action réelle pour éteindre ; non cumulable).'],
        ['helice_d_eclairs', 'Hélice d’éclairs', 'offensif', 'antipersonnel', 1, 0, 0, 50, '1d6 au cerveau, −1 action virtuelle au prochain tour (minimum 2).'],
        ['laser_corrosif', 'Laser corrosif', 'offensif', 'antipersonnel', 0, 0, 0, 100, 'Détruit un programme non-GLACE au hasard sur la console ciblée.'],
        ['superglue', 'Superglue', 'offensif', 'antipersonnel', 2, 0, 0, 100, 'Ni progresser ni se déconnecter proprement pendant 1d6 rounds ; une fois par Netrun.'],
        ['taser', 'Taser', 'offensif', 'antipersonnel', 0, 0, 0, 100, 'INT, RÉF et DEX −1d6 chacune (minimum 1) pendant 1 heure.'],
    ];

    /** GLACE : [code, nom, cible, PER, VIT, ATT, DÉF, REZ, prix, effet]. Deux emplacements de cyberconsole. */
    private const GLACE = [
        ['cerbere', 'Cerbère', 'antipersonnel', 6, 6, 6, 2, 20, 500, '2d6 au cerveau ; sans câblage isolé, console et vêtements prennent feu comme avec Feubeu.'],
        ['cobra', 'Cobra', 'antipersonnel', 4, 6, 2, 2, 15, 100, 'Détruit un programme au hasard sur la console.'],
        ['corbeau', 'Corbeau', 'antipersonnel', 6, 4, 4, 2, 15, 50, 'Dérezze un programme défensif au hasard, puis 1d6 au cerveau.'],
        ['feu_follet', 'Feu follet', 'antipersonnel', 4, 4, 4, 2, 15, 50, '1d6 au cerveau, −1 action virtuelle au prochain tour (minimum 2).'],
        ['kraken', 'Kraken', 'antipersonnel', 6, 2, 8, 4, 30, 1000, '3d6 au cerveau ; ni progresser ni se déconnecter proprement jusqu’à la fin de son prochain tour.'],
        ['liche', 'Liche', 'antipersonnel', 8, 2, 6, 2, 25, 500, 'INT, RÉF et DEX −1d6 chacune (minimum 1) pendant 1 heure.'],
        ['putois', 'Putois', 'antipersonnel', 2, 4, 4, 2, 10, 500, '−2 aux jets de Glissement tant qu’il est rezzé (un Netrunner à la fois ; plusieurs Putois se cumulent).'],
        ['scorpion', 'Scorpion', 'antipersonnel', 2, 6, 2, 2, 15, 100, 'MOUV −1d6 (minimum 1) pendant 1 heure.'],
        ['titan', 'Titan', 'antipersonnel', 2, 2, 8, 4, 25, 1000, '3d6 au cerveau et déconnexion forcée dangereuse.'],
        ['dragon', 'Dragon', 'antiprogramme', 6, 4, 6, 6, 30, 1000, '6d6 à un programme ; s’il serait dérezzé, il est détruit.'],
        ['tigre_a_dents_de_sabre', 'Tigre à dents de sabre', 'antiprogramme', 8, 6, 6, 2, 25, 1000, '6d6 à un programme ; s’il serait dérezzé, il est détruit.'],
        ['tueur', 'Tueur', 'antiprogramme', 4, 8, 6, 2, 20, 500, '4d6 à un programme ; s’il serait dérezzé, il est détruit.'],
    ];

    /** Démons : [code, nom, REZ, Interface, actions virtuelles, valeur de combat, prix]. Trop gros pour une cyberconsole. */
    private const DEMONS = [
        ['lutin', 'Lutin', 15, 3, 2, 14, 1000],
        ['ifrit', 'Ifrit', 25, 4, 3, 14, 5000],
        ['balron', 'Balron', 30, 7, 4, 14, 10000],
    ];

    /** Matériel de cyberconsole : [code, nom, emplacements, prix, effet]. */
    private const MATERIEL = [
        ['barriere_anti_krash', 'Barrière anti-KRASH', 2, 100, 'Immunise contre les effets qui forcent la déconnexion.'],
        ['cablage_isole', 'Câblage isolé', 1, 100, 'La console ne prend pas feu et n’enflamme pas les vêtements.'],
        ['circuits_renforces', 'Circuits renforcés', 1, 100, 'Insensible aux IEM et aux effets de programmes non-GLACE qui la désactivent.'],
        ['disque_dur_de_sauvegarde', 'Disque dur de sauvegarde', 2, 100, 'Sauve les programmes non-GLACE détruits ; une action réelle pour les réinstaller, dans leur état sauvegardé.'],
        ['extension_de_portee', 'Extension de portée', 1, 100, 'Connexion à 8 m d’un point d’accès.'],
        ['verrou_biometrique', 'Verrou biométrique', 2, 100, 'Console verrouillée ; Sécurité électronique SD 17 pour la forcer.'],
    ];

    public function up(): void
    {
        Schema::create('cpr_programme', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->string('classe', 12); // soutien, defensif, offensif, glace, demon
            $table->string('cible', 15)->nullable(); // antiprogramme, antipersonnel
            $table->unsignedTinyInteger('att')->nullable();
            $table->unsignedTinyInteger('def')->nullable();
            $table->unsignedTinyInteger('rez')->nullable();
            $table->unsignedTinyInteger('per')->nullable(); // GLACE : SD de Glissement
            $table->unsignedTinyInteger('vit')->nullable(); // GLACE
            $table->unsignedTinyInteger('interface')->nullable(); // Démon
            $table->unsignedTinyInteger('actions_virtuelles')->nullable(); // Démon
            $table->unsignedTinyInteger('valeur_combat')->nullable(); // Démon
            $table->unsignedTinyInteger('emplacements')->nullable(); // dans une cyberconsole ; null : ne s'y installe pas (Démon)
            $table->unsignedInteger('prix');
            $table->text('effet')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_materiel_net', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->unsignedTinyInteger('emplacements');
            $table->unsignedInteger('prix');
            $table->text('effet');
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        $now = now();
        $ordre = 0;
        $lignes = [];
        foreach (self::PROGRAMMES as [$code, $nom, $classe, $cible, $att, $def, $rez, $prix, $effet]) {
            $lignes[] = compact('code', 'nom', 'classe', 'cible', 'att', 'def', 'rez', 'prix', 'effet') + ['emplacements' => 1];
        }
        foreach (self::GLACE as [$code, $nom, $cible, $per, $vit, $att, $def, $rez, $prix, $effet]) {
            $lignes[] = compact('code', 'nom', 'cible', 'per', 'vit', 'att', 'def', 'rez', 'prix', 'effet') + ['classe' => 'glace', 'emplacements' => 2];
        }
        foreach (self::DEMONS as [$code, $nom, $rez, $interface, $actions, $valeur, $prix]) {
            $lignes[] = [
                'code' => $code, 'nom' => $nom, 'classe' => 'demon', 'rez' => $rez, 'interface' => $interface,
                'actions_virtuelles' => $actions, 'valeur_combat' => $valeur, 'prix' => $prix,
                'effet' => 'Utilise Élimination et Contrôle ; ne s’installe pas dans une cyberconsole ; un par tranche de six étages d’une architecture.',
            ];
        }
        foreach ($lignes as $ligne) {
            DB::table('cpr_programme')->insert([...$ligne, 'ordre' => ++$ordre, 'created_at' => $now, 'updated_at' => $now]);
        }

        foreach (self::MATERIEL as $index => [$code, $nom, $emplacements, $prix, $effet]) {
            DB::table('cpr_materiel_net')->insert([
                'code' => $code, 'nom' => $nom, 'emplacements' => $emplacements, 'prix' => $prix, 'effet' => $effet,
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
        Schema::dropIfExists('cpr_materiel_net');
        Schema::dropIfExists('cpr_programme');
        $this->viderLeCache();
    }
};
