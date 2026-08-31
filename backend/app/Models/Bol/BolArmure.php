<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolArmure extends Model
{
    use HasFactory;

    protected $table = 'bol_armure';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        'user_id',
        'armure',
        'protection',
        'malus',
        'pts_de_pouvoir',
        'categorie',
        'malus_agilite',
        'malus_initiative',
        'malus_attaque_subie',
        'malus_attaque_subie_portee',
    ];
    protected $casts = [
        'id' => 'integer',
        'malus_agilite' => 'integer',
        'malus_initiative' => 'integer',
        'malus_attaque_subie' => 'integer',
    ];
}
