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
    ];
    protected $casts = [
        'id' => 'integer',
    ];
}
