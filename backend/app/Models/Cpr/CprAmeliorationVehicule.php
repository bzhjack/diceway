<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Une amélioration de véhicule du Nomade (capacité Moto) : rang requis, véhicules concernés, effet. */
class CprAmeliorationVehicule extends Model
{
    protected $table = 'cpr_amelioration_vehicule';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'rang_requis' => 'integer',
        'cumulable' => 'boolean',
        'effets' => 'array',
        'ordre' => 'integer',
    ];
}
