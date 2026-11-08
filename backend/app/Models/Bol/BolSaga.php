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

    /** Les listes des créatures et des démons, en cache, nomment le scénario de chacun : un nouveau titre les rend fausses. */
    protected static function booted(): void
    {
        static::updated(function (BolSaga $saga): void {
            if ($saga->wasChanged('titre') && $saga->user_id !== null) {
                Cache::forget(BolCache::creatures((string) $saga->user_id));
                Cache::forget(BolCache::demons((string) $saga->user_id));
            }
        });
    }
}
