<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHerosArmure extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_armure';

    protected $fillable = [
        "heros_id",
        "armure_id",
    ];

    public function armure(): HasOne
    {
        return $this->HasOne(BolArmure::class, 'id', 'armure_id');
    }
}
