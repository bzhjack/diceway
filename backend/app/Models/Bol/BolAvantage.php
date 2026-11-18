<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolAvantage extends Model
{
    protected $table = 'bol_avantage';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'de_bonus' => 'boolean',
        'id' => 'integer',
        'attribut_bonus' => 'integer'
    ];
}
