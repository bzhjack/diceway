<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Une ligne de la table de CARAC d'un rôle : le résultat du d10 et les dix CARAC. */
class CprRoleProfil extends Model
{
    protected $table = 'cpr_role_profil';
    public $timestamps = false;
    protected $hidden = ['id', 'role_id'];
    protected $casts = [
        'id' => 'integer',
        'role_id' => 'integer',
        'jet' => 'integer',
        'int' => 'integer',
        'ref' => 'integer',
        'dex' => 'integer',
        'tech' => 'integer',
        'pres' => 'integer',
        'vol' => 'integer',
        'cha' => 'integer',
        'mouv' => 'integer',
        'cor' => 'integer',
        'emp' => 'integer',
    ];
}
