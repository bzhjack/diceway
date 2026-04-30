<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolDifficulte extends Model
{
    protected $table = 'bol_difficulte';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = ['label', 'modificateur', 'ordre'];
    protected $casts = [
        'id' => 'integer',
        'modificateur' => 'integer',
        'ordre' => 'integer',
    ];
}
