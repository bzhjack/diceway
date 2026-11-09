<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Une compagnie : un nom et des héros du compte. Une partie (`BolFightSession`) l'associe à un scénario ; elle peut en jouer plusieurs. */
class BolCompagnie extends Model
{
    use Uuids;

    protected $table = 'bol_compagnie';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'nom'];
    protected $hidden = ['created_at', 'updated_at'];

    /** Ses héros, dans l'ordre où ils y ont été mis : c'est celui où ils s'assoient à ses prochaines parties. */
    public function heros(): BelongsToMany
    {
        return $this->belongsToMany(BolHeros::class, 'bol_compagnie_heros', 'compagnie_id', 'heros_id')->orderBy('bol_compagnie_heros.id');
    }

    public function parties(): HasMany
    {
        return $this->hasMany(BolFightSession::class, 'compagnie_id', 'id');
    }

    /**
     * Sa partie sur le scénario de ce chapitre, s'il y en a une : une compagnie ne joue qu'une fois un scénario (un autre chapitre de la même
     * saga, c'est le même scénario). Sans chapitre, aucune : elle peut improviser autant qu'elle veut.
     */
    public function partieSurLeScenario(?string $chapitreId): ?BolFightSession
    {
        if ($chapitreId === null) {
            return null;
        }
        $sagaId = BolScenario::where('id', $chapitreId)->value('saga_id');
        $chapitres = $sagaId === null ? [$chapitreId] : BolScenario::where('saga_id', $sagaId)->pluck('id')->all();

        return $this->parties()->whereIn('scenario_id', $chapitres)->first();
    }
}
