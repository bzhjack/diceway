<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (3/8) : les armures et le bouclier balistique (livre p. 349-350, doc/cyberpunk/resources/armures.md).
 * Une armure s'achète pour la tête ou pour le corps, sauf la combinaison connectée qui couvre les deux. Lignes du livre : `user_id` null.
 */
return new class extends Migration
{
    private const CACHE = 'cpr_armures_catalogue';

    /** [code, nom, type, PA, PS, pénalité à RÉF, DEX et MOUV, prix, couvre tête et corps, emplacements de matériel NET, description]. */
    private const ARMURES = [
        ['cuir', 'Cuir', 'armure', 4, null, 0, 20, false, 0, 'Cuir fin renforcé aux épaules, aux hanches et au ventre ; prisé des Nomades et des motards.'],
        ['kevlar', 'Kevlar®', 'armure', 7, null, 0, 50, false, 0, 'Vêtements, gilets, vestes, costumes, même bikinis.'],
        ['tenue_pare_balles_legere', 'Tenue pare-balles légère', 'armure', 11, null, 0, 100, false, 0, 'Kevlar® et maillage plastique dans la trame du tissu.'],
        ['combinaison_connectee', 'Combinaison connectée', 'armure', 11, null, 0, 1000, true, 1, 'Combinaison moulante au gel absorbant ; range la cyberconsole et les câbles d’interface. Portée sur la tête et le corps (PA 11 chacun), réparée d’un coup, une seule à la fois. Ajoute à la cyberconsole reliée un emplacement réservé au matériel informatique.'],
        ['tenue_pare_balles_moyenne', 'Tenue pare-balles moyenne', 'armure', 12, null, 2, 100, false, 0, 'Plaques de plastique robuste sur maillage de Kevlar®.'],
        ['tenue_pare_balles_lourde', 'Tenue pare-balles lourde', 'armure', 13, null, 2, 500, false, 0, 'Kevlar® dense, couches de plastique et de treillage.'],
        ['flak', 'Flak', 'armure', 15, null, 4, 500, false, 0, 'Gilet et pantalon à plaques métalliques contre les explosifs et les gros calibres.'],
        ['metalgear', 'Metalgear®', 'armure', 18, null, 4, 5000, false, 0, 'Plaques de métal et de plastique sur une combinaison maillée.'],
        ['bouclier_balistique', 'Bouclier balistique', 'bouclier', null, 10, 0, 100, false, 0, 'Polycarbonate transparent, manié à une main ; une action pour l’équiper ou le lâcher. Encaisse les dégâts sur ses PS.'],
    ];

    public function up(): void
    {
        Schema::create('cpr_armure', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->string('type', 10); // armure, bouclier
            $table->unsignedTinyInteger('pa')->nullable(); // armure
            $table->unsignedTinyInteger('ps')->nullable(); // bouclier
            $table->unsignedTinyInteger('penalite')->default(0); // retirée à RÉF, DEX et MOUV
            $table->unsignedInteger('prix');
            $table->boolean('tete_et_corps')->default(false); // sinon : une pièce pour la tête ou pour le corps
            $table->unsignedTinyInteger('emplacements_materiel')->default(0); // emplacements de matériel ajoutés à la cyberconsole
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        $now = now();
        foreach (self::ARMURES as $index => [$code, $nom, $type, $pa, $ps, $penalite, $prix, $teteEtCorps, $emplacements, $description]) {
            DB::table('cpr_armure')->insert([
                'code' => $code, 'nom' => $nom, 'type' => $type, 'pa' => $pa, 'ps' => $ps, 'penalite' => $penalite, 'prix' => $prix,
                'tete_et_corps' => $teteEtCorps, 'emplacements_materiel' => $emplacements, 'description' => $description,
                'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        Cache::forget(self::CACHE);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_armure');
        Cache::forget(self::CACHE);
    }
};
