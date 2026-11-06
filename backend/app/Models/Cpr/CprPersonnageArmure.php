<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Une armure d'un personnage : localisation, PA actuel. */
class CprPersonnageArmure extends Model
{
    protected $table = 'cpr_personnage_armure';
    public $timestamps = false;
    protected $guarded = ['id', 'personnage_id'];
    protected $hidden = ['personnage_id'];
    protected $casts = [
        'id' => 'integer',
        'armure_id' => 'integer',
        'pa' => 'integer',
        'equipee' => 'boolean',
    ];
}
