<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolCombatOption extends Model
{
    protected $table = 'bol_combat_option';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = ['label', 'slug', 'modificateur', 'modificateur_armor', 'note', 'ordre'];
    protected $casts = [
        'id' => 'integer',
        'modificateur' => 'integer',
        'modificateur_armor' => 'boolean',
        'ordre' => 'integer',
    ];
}
