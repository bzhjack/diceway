<?php

use App\Http\Services\Bol\BolCache;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/** Un démon a une taille, comme une créature (`bol_taille` ; « n'importe quelle taille », livre p. 129) : elle compte en combat pour le
 * renversement et le poison. Moyenne (4) par défaut, ce que valait jusqu'ici un démon sans taille. La copie posée à la table la garde ;
 * vide sur les lignes déjà posées, qui restent moyennes. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_demon', function (Blueprint $table) {
            $table->integer('id_taille')->default(4)->after('id_categorie');
        });
        Schema::table('bol_fight_session_demon', function (Blueprint $table) {
            $table->integer('id_taille')->nullable()->after('degats');
        });
        foreach (User::query()->pluck('id') as $userId) {
            Cache::forget(BolCache::demons((string) $userId));
        }
    }

    public function down(): void
    {
        Schema::table('bol_fight_session_demon', function (Blueprint $table) {
            $table->dropColumn('id_taille');
        });
        Schema::table('bol_demon', function (Blueprint $table) {
            $table->dropColumn('id_taille');
        });
    }
};
