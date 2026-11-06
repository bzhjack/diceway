<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Un rôle d'un personnage et son rang (plusieurs lignes : multiclassage). */
class CprPersonnageRole extends Model
{
    protected $table = 'cpr_personnage_role';
    public $timestamps = false;
    protected $guarded = ['id', 'personnage_id'];
    protected $hidden = ['personnage_id'];
    protected $casts = [
        'id' => 'integer',
        'role_id' => 'integer',
        'rang' => 'integer',
        'details' => 'array',
    ];
}
