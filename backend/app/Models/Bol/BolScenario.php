<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un chapitre, au sens des écrans : son nom (`titre`), son numéro dans son scénario (0 pour l'introduction, null sans numéro) et son
 * scénario (`saga_id`, null pour un one shot). */
class BolScenario extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_scenario';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'saga_id', 'numero', 'titre', 'pitch'];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = ['numero' => 'integer'];

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
