<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolRegionAvantage extends Model
{
    use HasFactory;

    protected $table = 'bol_region_avantage';
    protected $hidden = ['created_at', 'updated_at'];
}
