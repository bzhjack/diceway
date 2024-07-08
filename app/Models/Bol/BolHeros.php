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
    protected $hidden = ['user_id'];

    protected $fillable = [
        'user_id',
        'joueur',
        'nom',
        'vigueur',
        'agilite',
        'esprit',
        'aura',
        'initiative',
        'melee',
        'tir',
        'defense',
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
}
