<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolRegionNom extends Model
{
    use HasFactory;

    protected $table = 'bol_region_nom';
    protected $hidden = ['created_at', 'updated_at'];
}
