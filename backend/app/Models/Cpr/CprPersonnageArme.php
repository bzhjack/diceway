<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Une arme d'un personnage : qualité, accessoires, munition chargée. */
class CprPersonnageArme extends Model
{
    protected $table = 'cpr_personnage_arme';
    public $timestamps = false;
    protected $guarded = ['id', 'personnage_id'];
    protected $hidden = ['personnage_id'];
    protected $casts = [
        'id' => 'integer',
        'arme_id' => 'integer',
        'accessoires' => 'array',
    ];
}
