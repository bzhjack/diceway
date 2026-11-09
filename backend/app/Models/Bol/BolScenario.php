<?php

namespace App\Models\Bol;

use App\Http\Services\Bol\BolCache;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

/** Un chapitre, au sens des écrans : son nom (`titre`), son numéro dans son scénario (0 pour l'introduction, null sans numéro) et son
 * scénario (`saga_id`). */
class BolScenario extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_scenario';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'saga_id', 'numero', 'titre', 'pitch'];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = ['numero' => 'integer'];

    /** Un chapitre supprimé quitte les références d'import. Son scénario reste, vide s'il n'en a plus : il ne part que supprimé lui-même. */
    protected static function booted(): void
    {
        static::deleted(function (BolScenario $chapitre): void {
            BolImportRef::where('entity_kind', 'scenario')->where('entity_id', $chapitre->id)->delete();
            // Les listes des créatures et des démons, en cache, nomment les scénarios de chacun.
            if ($chapitre->user_id !== null) {
                Cache::forget(BolCache::creatures((string) $chapitre->user_id));
                Cache::forget(BolCache::demons((string) $chapitre->user_id));
            }
        });
    }

    public function saga(): BelongsTo
    {
        return $this->belongsTo(BolSaga::class, 'saga_id', 'id');
    }

    /**
     * Une partie peut-elle passer du chapitre `$depuis` au chapitre `$vers` ? Oui si elle n'a pas encore de scénario (improvisée), ou si
     * les deux chapitres sont du même scénario : le même chapitre, ou la même saga. Une partie liée ne redevient pas improvisée.
     */
    public static function dansLeScenario(?string $depuis, ?string $vers): bool
    {
        if ($depuis === null) {
            return true;
        }
        if ($vers === null) {
            return false;
        }
        if ($depuis === $vers) {
            return true;
        }
        $sagas = self::whereIn('id', [$depuis, $vers])->pluck('saga_id', 'id');

        return $sagas[$depuis] !== null && $sagas[$depuis] === ($sagas[$vers] ?? null);
    }
}
