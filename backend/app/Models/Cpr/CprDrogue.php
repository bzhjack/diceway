<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Une drogue de rue : effet principal, durée, SD de l'effet secondaire (l'addiction). */
class CprDrogue extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_drogue';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'prix' => 'integer',
        'duree_heures' => 'integer',
        'sd_effet_secondaire' => 'integer',
        'effets' => 'array',
        'ordre' => 'integer',
    ];
}
