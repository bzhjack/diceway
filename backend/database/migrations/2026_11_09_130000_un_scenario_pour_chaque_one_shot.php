<?php

use App\Http\Services\Bol\BolCache;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Plus de « one shot » : un chapitre a toujours un scénario. Chaque chapitre qui n'en avait pas devient le chapitre unique d'un scénario de
 * son nom (« (2) », « (3) »… si le compte a déjà un scénario de ce nom). Les listes en cache qui nomment les scénarios des fiches sont
 * oubliées. Sans retour : rien ne distingue ensuite ces scénarios des autres. */
return new class extends Migration
{
    public function up(): void
    {
        $chapitres = DB::table('bol_scenario')->whereNull('saga_id')->whereNotNull('user_id')->get(['id', 'user_id', 'titre']);
        foreach ($chapitres as $chapitre) {
            $titre = $this->titreLibre((string) $chapitre->user_id, trim((string) $chapitre->titre) ?: 'Scénario');
            $sagaId = (string) Str::uuid();
            DB::table('bol_saga')->insert(['id' => $sagaId, 'user_id' => $chapitre->user_id, 'titre' => $titre, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('bol_scenario')->where('id', $chapitre->id)->update(['saga_id' => $sagaId]);
        }
        foreach (User::query()->pluck('id') as $userId) {
            Cache::forget(BolCache::creatures((string) $userId));
            Cache::forget(BolCache::demons((string) $userId));
        }
    }

    public function down(): void
    {
    }

    private function titreLibre(string $userId, string $titre): string
    {
        $pris = fn (string $nom): bool => DB::table('bol_saga')->where('user_id', $userId)->whereRaw('lower(titre) = ?', [mb_strtolower($nom)])->exists();
        $candidat = $titre;
        for ($n = 2; $pris($candidat); $n++) {
            $candidat = "$titre ($n)";
        }

        return $candidat;
    }
};
