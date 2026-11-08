<?php

namespace App\Models\Bol;

use App\Http\Services\Bol\BolCache;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/** Un scénario, au sens des écrans (« Perle du Beshaar ») : ses chapitres sont des `BolScenario`. Il appartient à un compte. */
class BolSaga extends Model
{
    use Uuids;

    protected $table = 'bol_saga';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'titre', 'pitch', 'image'];
    protected $hidden = ['created_at', 'updated_at'];

    /** La liste des créatures, en cache, nomme le scénario de chacune : un nouveau titre la rend fausse. */
    protected static function booted(): void
    {
        static::updated(function (BolSaga $saga): void {
            if ($saga->wasChanged('titre') && $saga->user_id !== null) {
                Cache::forget(BolCache::creatures((string) $saga->user_id));
            }
        });
    }
}
