<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolCategorie extends Model
{
    use HasFactory;

    protected $table = 'bol_categorie';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'pouvoir' => 'integer',
        'vitalite' => 'integer',
        'degats' => 'string'
    ];
}
