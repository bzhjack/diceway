<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Le prix d'une pièce de vêtement dans un style (générique, cadre sup, âme nomade…). */
class CprVetement extends Model
{
    protected $table = 'cpr_vetement';
    public $timestamps = false;
    protected $casts = [
        'id' => 'integer',
        'prix' => 'integer',
    ];
}
