<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Un objet d'un personnage (équipement, programme, munition, vêtement, matériel NET, véhicule, amélioration de véhicule). */
class CprPersonnageObjet extends Model
{
    protected $table = 'cpr_personnage_objet';
    public $timestamps = false;
    protected $guarded = ['id', 'personnage_id'];
    protected $hidden = ['personnage_id'];
    protected $casts = [
        'id' => 'integer',
        'objet_id' => 'integer',
        'quantite' => 'integer',
    ];
}
