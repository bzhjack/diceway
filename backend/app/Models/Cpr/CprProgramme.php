<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Un programme du NET : soutien, défensif, offensif, GLACE ou Démon. */
class CprProgramme extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_programme';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'att' => 'integer',
        'def' => 'integer',
        'rez' => 'integer',
        'per' => 'integer',
        'vit' => 'integer',
        'interface' => 'integer',
        'actions_virtuelles' => 'integer',
        'valeur_combat' => 'integer',
        'emplacements' => 'integer',
        'prix' => 'integer',
        'ordre' => 'integer',
    ];
}
