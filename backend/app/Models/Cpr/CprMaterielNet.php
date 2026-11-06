<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Un matériel de cyberconsole (câblage isolé, barrière anti-KRASH…) et les emplacements qu'il y prend. */
class CprMaterielNet extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_materiel_net';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'emplacements' => 'integer',
        'prix' => 'integer',
        'ordre' => 'integer',
    ];
}
