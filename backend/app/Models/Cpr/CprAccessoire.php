<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Un accessoire d'arme à distance : prix, emplacements occupés (une arme en a 3), armes compatibles. */
class CprAccessoire extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_accessoire';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'prix' => 'integer',
        'emplacements' => 'integer',
        'dissimulable' => 'boolean',
        'ordre' => 'integer',
    ];
}
