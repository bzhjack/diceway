<?php

namespace App\Models\bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHerosCarriere extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_carriere';

    protected $fillable = [
        "heros_id",
        "carriere_id",
        "value"
    ];

    public function carriere(): HasOne
    {
        return $this->HasOne(BolCarriere::class, 'id', 'carriere_id');
    }
}
