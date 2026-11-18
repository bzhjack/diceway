<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolRegionNom extends Model
{
    protected $table = 'bol_region_nom';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'region_id' => 'integer'
    ];
}
