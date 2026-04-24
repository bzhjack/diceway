<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolDemon extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_demon';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = ['created_at', 'updated_at'];
    protected $appends = ['type'];
    protected $fillable = [
        'id',
        'user_id',
        'nom',
        'avatar',
        'commentaire',

        'vigueur',
        'agilite',
        'esprit',
        'aura',

        'melee',
        'tir',
        'defense',

        'vitalite',
        'degats',

        'id_categorie'
    ];
    protected $casts = [
        'vigueur' => 'integer',
        'agilite' => 'integer',
        'esprit' => 'integer',
        'aura' => 'integer',
        'melee' => 'integer',
        'tir' => 'integer',
        'defense' => 'integer',
        'vitalite' => 'integer',
        'id_categorie' => 'integer'
    ];

    public function pouvoirs(): HasMany
    {
        return $this->HasMany(BolDemonPouvoir::class, 'demon_id', 'id');
    }

    public function categorie(): HasOne
    {
        return $this->HasOne(BolCategorie::class, 'id', 'id_categorie');
    }

    public function getTypeAttribute()
    {
        return $this->categorie->type;
    }
}
