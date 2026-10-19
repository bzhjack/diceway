<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Zullthegg (démon du catalogue) : ses « Armes améliorées » sont des fléchettes démoniaques, comme l'écrit son statbloc (livre
 * p. 131). La précision manquait ; une précision déjà saisie n'est pas écrasée. */
return new class extends Migration
{
    public function up(): void
    {
        $this->precision(null, 'fléchettes démoniaques');
    }

    public function down(): void
    {
        $this->precision('fléchettes démoniaques', null);
    }

    private function precision(?string $avant, ?string $apres): void
    {
        $demonIds = DB::table('bol_demon')->whereNull('user_id')->where('nom', 'Zullthegg')->pluck('id');
        $pouvoirId = DB::table('bol_pouvoir')->where('pouvoir', 'Armes améliorées')->value('id');
        if ($demonIds->isEmpty() || $pouvoirId === null) {
            return;
        }
        DB::table('bol_demon_pouvoir')
            ->whereIn('demon_id', $demonIds)
            ->where('pouvoir_id', $pouvoirId)
            ->where('detail', $avant)
            ->update(['detail' => $apres, 'updated_at' => now()]);
        // La liste des démons est en cache (BolDemonController).
        Cache::forget('bol_demons');
    }
};
