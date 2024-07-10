<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class BolHeros extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_heros';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = ['user_id', 'initiative','melee','tir','defense'];
    protected $appends = ['combat'];
    protected $fillable = [
        'user_id',
        'joueur',
        'nom',
        'vigueur', 'agilite', 'esprit', 'aura',
        'initiative','melee','tir','defense',
        'avatar',
        'region_id',
        'region'
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
 // Accesseur pour l'attribut "combat"
    public function getCombatAttribute()
    {
        return [
            'initiative' => $this->initiative,
            'melee' => $this->melee,
            'tir' => $this->tir,
            'defense' => $this->defense,
        ];
    }
}
