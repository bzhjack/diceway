<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolHeroicOption extends Model
{
    protected $table = 'bol_heroic_option';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = ['label', 'slug', 'description', 'ordre'];
    protected $casts = [
        'id' => 'integer',
        'ordre' => 'integer',
    ];
}
