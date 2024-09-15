<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolCreatureCapacite extends Model
{
    use HasFactory;

    protected $table = 'bol_creature_capacite';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        "creature_id",
        "capacite_id",
        "detail"
    ];

    protected $casts = [
        'capacite_id' => 'integer'
    ];

    public function capacite(): HasOne
    {
        return $this->HasOne(BolCapacite::class, 'id', 'capacite_id');
    }
}
