<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Un objet d'équipement général ou un service (hôtel, thérapie, Trauma Team…) de Cyberpunk RED. */
class CprEquipement extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_equipement';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'prix' => 'integer',
        'effets' => 'array',
        'ordre' => 'integer',
    ];
}
