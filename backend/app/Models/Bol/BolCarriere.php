<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolCarriere extends Model
{
    use HasFactory;

    protected $table = 'bol_carriere';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = ['carriere', 'detail', 'description', 'donne_langue'];
    protected $casts = [
        'id' => 'integer',
        'donne_langue' => 'boolean',
    ];
}
