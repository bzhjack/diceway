<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolRegionDesavantage extends Model
{
    use HasFactory;

    protected $table = 'bol_region_desavantage';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'region_id' => 'integer',
        'desavantage_id' => 'integer'
    ];
}
