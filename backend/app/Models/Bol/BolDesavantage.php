<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolDesavantage extends Model
{
    protected $table = 'bol_desavantage';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'de_malus' => 'boolean',
        'id' => 'integer',
        'attribut_malus' => 'integer'
    ];
}
