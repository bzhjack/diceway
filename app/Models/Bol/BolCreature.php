<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolCreature extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_creature';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = ['created_at', 'updated_at'];

    public function capacites(): HasMany
    {
        return $this->HasMany(BolCreatureCapacite::class, 'creature_id', 'id');
    }
    public function  taille(): HasOne
    {
        return $this->HasOne(BolTaille::class, 'id', 'id_taille');
    }
}
