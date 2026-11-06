<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Un objet de l'équipement de départ d'un rôle ; les lignes d'un même groupe sont des alternatives. `objet_type` nomme le catalogue
 * (arme, armure, munition, equipement, vetement, cyber, programme) où trouver `objet_id` ; garage_familial : les choix du Nomade. */
class CprRoleDotation extends Model
{
    protected $table = 'cpr_role_dotation';
    public $timestamps = false;
    protected $hidden = ['role_id'];
    protected $casts = [
        'id' => 'integer',
        'role_id' => 'integer',
        'groupe' => 'integer',
        'objet_id' => 'integer',
        'quantite' => 'integer',
        'ordre' => 'integer',
    ];
}
