<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_armure', function (Blueprint $table) {
            $table->enum('categorie', ['armure', 'bouclier', 'casque'])->nullable()->after('malus');
            $table->unsignedInteger('malus_agilite')->default(0)->after('categorie');
            $table->unsignedInteger('malus_initiative')->default(0)->after('malus_agilite');
            $table->unsignedInteger('malus_attaque_subie')->default(0)->after('malus_initiative');
            $table->enum('malus_attaque_subie_portee', ['une', 'toutes'])->nullable()->after('malus_attaque_subie');
        });

        $donnees = [
            2 => ['categorie' => 'armure', 'malus_agilite' => 0, 'malus_initiative' => 0, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            3 => ['categorie' => 'armure', 'malus_agilite' => 1, 'malus_initiative' => 0, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            4 => ['categorie' => 'armure', 'malus_agilite' => 2, 'malus_initiative' => 0, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            5 => ['categorie' => 'casque', 'malus_agilite' => 0, 'malus_initiative' => 1, 'malus_attaque_subie' => 0, 'malus_attaque_subie_portee' => null],
            6 => ['categorie' => 'bouclier', 'malus_agilite' => 0, 'malus_initiative' => 0, 'malus_attaque_subie' => 1, 'malus_attaque_subie_portee' => 'une'],
            7 => ['categorie' => 'bouclier', 'malus_agilite' => 1, 'malus_initiative' => 0, 'malus_attaque_subie' => 1, 'malus_attaque_subie_portee' => 'toutes'],
        ];

        foreach ($donnees as $id => $valeurs) {
            DB::table('bol_armure')->where('id', $id)->update($valeurs);
        }
    }

    public function down(): void
    {
        Schema::table('bol_armure', function (Blueprint $table) {
            $table->dropColumn([
                'categorie',
                'malus_agilite',
                'malus_initiative',
                'malus_attaque_subie',
                'malus_attaque_subie_portee',
            ]);
        });
    }
};
