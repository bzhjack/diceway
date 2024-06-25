<?php

namespace App\Models\bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolHerosCarriere extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_carriere';

    protected $fillable = [
        "heros_id",
        "carriere_id",
        "detail"
    ];
}
