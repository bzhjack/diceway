<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Un implant posé sur un personnage ; `parent_id` : la pièce mère de la fiche où il est posé. */
class CprPersonnageCyber extends Model
{
    protected $table = 'cpr_personnage_cyber';
    public $timestamps = false;
    protected $guarded = ['id', 'personnage_id'];
    protected $hidden = ['personnage_id'];
    protected $casts = [
        'id' => 'integer',
        'cyber_id' => 'integer',
        'parent_id' => 'integer',
        'ph' => 'integer',
    ];
}
