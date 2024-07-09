<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHerosArme extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_arme';

    protected $fillable = [
        "heros_id",
        "arme_id",
    ];

    public function arme(): HasOne
    {
        return $this->HasOne(BolArme::class, 'id', 'arme_id');
    }
}
