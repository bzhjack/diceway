<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolPouvoir extends Model
{
    use HasFactory;
    protected $table = 'bol_pouvoir';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer'
    ];
}
