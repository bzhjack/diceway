<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolPouvoir extends Model
{
    use HasFactory;

    protected $table = 'bol_pouvoir';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = ['pouvoir', 'description', 'avantage_attaque', 'degats_superieurs', 'regeneration', 'intangible', 'avertissement_combat'];
    protected $casts = [
        'id' => 'integer',
        'avantage_attaque' => 'boolean',
        'degats_superieurs' => 'boolean',
        'regeneration' => 'boolean',
        'intangible' => 'boolean',
        'avertissement_combat' => 'boolean',
    ];
}
