<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Un véhicule de Cyberpunk RED ; `rang_nomade` : le rang de Moto à partir duquel il entre dans le garage familial. */
class CprVehicule extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_vehicule';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'pds' => 'integer',
        'places' => 'integer',
        'mouv' => 'integer',
        'vitesse_kmh' => 'integer',
        'prix' => 'integer',
        'pieces_minimum' => 'integer',
        'rang_nomade' => 'integer',
        'ordre' => 'integer',
    ];
}
