<?php

use App\Http\Services\Bol\BolCache;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** « Se tient à deux mains » devient une donnée de l'arme : le combat à deux armes lisait jusqu'ici le début de ses notes. Reprend ce que
 * disaient ces notes ; « Arme à une main / arme à deux mains » (la fronde) n'en est pas une. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_arme', function (Blueprint $table) {
            $table->boolean('deux_mains')->default(false)->after('notes');
        });
        DB::table('bol_arme')
            ->where('notes', 'like', 'Arme à deux mains%')
            ->orWhere('notes', 'like', 'Armes à deux mains%')
            ->update(['deux_mains' => true]);
        foreach (User::query()->pluck('id') as $userId) {
            Cache::forget(BolCache::armes($userId));
        }
    }

    public function down(): void
    {
        Schema::table('bol_arme', function (Blueprint $table) {
            $table->dropColumn('deux_mains');
        });
    }
};
