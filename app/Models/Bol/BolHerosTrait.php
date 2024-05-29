<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolHerosTrait extends Model
{
    use HasFactory;
    protected $table = 'bol_heros_trait';

    protected $fillable = [
    "heros_id",
    "trait_id",
    "type"
    ];
    public function detail(): HasOne
    {
        if ($this->type === "A") {
            return $this->hasOne(BolAvantage::class, 'id', 'trait_id');
        } else {
            return $this->hasOne(BolDesavantage::class,'id', 'trait_id');
        }
    }
}
