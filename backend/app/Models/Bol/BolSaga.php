<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;

/** Un scénario, au sens des écrans (« Perle du Beshaar ») : ses chapitres sont des `BolScenario`. Il appartient à un compte. */
class BolSaga extends Model
{
    use Uuids;

    protected $table = 'bol_saga';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'titre', 'pitch', 'image'];
    protected $hidden = ['created_at', 'updated_at'];
}
