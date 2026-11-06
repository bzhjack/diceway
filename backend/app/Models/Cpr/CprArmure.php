<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Une armure (PA, pénalité à RÉF, DEX et MOUV) ou un bouclier (PS) de Cyberpunk RED. */
class CprArmure extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_armure';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'pa' => 'integer',
        'ps' => 'integer',
        'penalite' => 'integer',
        'prix' => 'integer',
        'tete_et_corps' => 'boolean',
        'emplacements_materiel' => 'integer',
        'ordre' => 'integer',
    ];
}
