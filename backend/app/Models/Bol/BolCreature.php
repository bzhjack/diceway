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
    protected $appends = ['type'];
    protected $fillable = [
        'id',
        'user_id',
        'nom',
        'vigueur',
        'agilite',
        'esprit',
        'vitalite',
        'attaque',
        'defense',
        'degats',
        'protection',
        'avatar',
        'commentaire',
        'id_taille'
    ];
    protected $casts = [
        'vigueur' => 'integer',
        'agilite' => 'integer',
        'esprit' => 'integer',
        'vitalite' => 'integer',
        'attaque' => 'integer',
        'defense' => 'integer',
        'id_taille' => 'integer',
        'type_order' => 'string'
    ];

    public function capacites(): HasMany
    {
        return $this->HasMany(BolCreatureCapacite::class, 'creature_id', 'id');
    }

    public function taille(): HasOne
    {
        return $this->HasOne(BolTaille::class, 'id', 'id_taille');
    }

    public function getTypeAttribute()
    {
        return $this->taille->type;
    }

}
