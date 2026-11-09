<?php

use App\Http\Services\Bol\BolCache;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Les notes d'armes qui jouent en combat deviennent des données de l'arme (livre p. 49-50) : le fléau ignore les boucliers, le gourdin
 * peut assommer sans tuer, l'arbalète se recharge en 1 round et l'arbalète lourde en 2. Reprend ce que disent les notes, du catalogue
 * comme des armes des comptes. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_arme', function (Blueprint $table) {
            $table->boolean('ignore_bouclier')->default(false)->after('deux_mains');
            $table->boolean('non_letal')->default(false)->after('ignore_bouclier');
            $table->unsignedTinyInteger('rechargement')->nullable()->after('non_letal');
        });
        foreach (DB::table('bol_arme')->whereNotNull('notes')->get(['id', 'notes']) as $arme) {
            $notes = mb_strtolower($arme->notes);
            $rechargement = preg_match('/rechargement\s*:\s*(\d+)\s*round/u', $notes, $m) ? (int) $m[1] : null;
            DB::table('bol_arme')->where('id', $arme->id)->update([
                'ignore_bouclier' => str_contains($notes, 'ignore les boucliers'),
                'non_letal'       => str_contains($notes, 'non létaux'),
                'rechargement'    => $rechargement,
            ]);
        }
        foreach (User::query()->pluck('id') as $userId) {
            Cache::forget(BolCache::armes($userId));
        }
    }

    public function down(): void
    {
        Schema::table('bol_arme', function (Blueprint $table) {
            $table->dropColumn(['ignore_bouclier', 'non_letal', 'rechargement']);
        });
    }
};
