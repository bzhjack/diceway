<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BolHeros extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_heros';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = [
        'user_id',
        'vitalite', 'heroisme',
        'initiative', 'melee', 'tir', 'defense',
        'vigueur', 'agilite', 'esprit', 'aura',
        'nom', 'avatar', 'region_id', 'region'
    ];
    protected $appends = ['combat', 'attributs', 'origines', 'ressources'];
    protected $fillable = [
        'user_id',
        'joueur',
        'type',
        'nom', 'avatar', 'region_id',
        'vigueur', 'agilite', 'esprit', 'aura',
        'initiative', 'melee', 'tir', 'defense','commentaire'
    ];

    public function traits(): HasMany
    {
        return $this->HasMany(BolHerosTrait::class, 'heros_id', 'id');
    }

    public function carrieres(): HasMany
    {
        return $this->HasMany(BolHerosCarriere::class, 'heros_id', 'id');
    }

    public function armures(): HasMany
    {
        return $this->HasMany(BolHerosArmure::class, 'heros_id', 'id');
    }

    public function armes(): HasMany
    {
        return $this->HasMany(BolHerosArme::class, 'heros_id', 'id');
    }

    public function langues(): HasMany
    {
        return $this->HasMany(BolHerosLangue::class, 'heros_id', 'id');
    }




    public function getCombatAttribute()
    {
        return [
            'initiative' => $this->initiative,
            'melee' => $this->melee,
            'tir' => $this->tir,
            'defense' => $this->defense,
        ];
    }

    public function getAttributsAttribute()
    {
        return [
            'vigueur' => $this->vigueur,
            'agilite' => $this->agilite,
            'esprit' => $this->esprit,
            'aura' => $this->aura,
        ];
    }

    public function getOriginesAttribute()
    {
        return [
            'nom' => $this->nom,
            'region_id' => $this->region_id,
            'avatar' => $this->avatar
        ];
    }

    public function getRessourcesAttribute()
    {
        return [
            'vitalite' => $this->vitalite,
            'heroisme' => $this->heroisme
        ];
    }
}
