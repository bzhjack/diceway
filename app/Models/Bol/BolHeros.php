<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHeros extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_heros';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = [
        'experience', 'foi', 'vitalite', 'heroisme', 'vilenie', 'pouvoir', 'creation',
        'initiative', 'melee', 'tir', 'defense',
        'vigueur', 'agilite', 'esprit', 'aura',
        'nom', 'avatar', 'region_id', 'region', 'joueur', 'langues', 'commentaire'
    ];
    protected $appends = ['combat', 'attributs', 'origines', 'ressources', 'type_order'];
    protected $fillable = [
        'user_id',
        'type',
        'active',
        'nom', 'avatar', 'region_id', 'joueur', 'commentaire',
        'vigueur', 'agilite', 'esprit', 'aura',
        'initiative', 'melee', 'tir', 'defense',
        'experience', 'foi', 'vitalite', 'heroisme', 'vilenie', 'pouvoir', 'creation'
    ];


    protected $casts = [
        'active' => 'boolean',

        'pouvoir' => 'integer',
        'vilenie' => 'integer',
        'heroisme' => 'integer',
        'vitalite' => 'integer',
        'foi' => 'integer',
        'experience' => 'integer',
        'creation' => 'integer',

        'initiative' => 'integer',
        'melee' => 'integer',
        'tir' => 'integer',
        'defense' => 'integer',


        'vigueur' => 'integer',
        'agilite' => 'integer',
        'esprit' => 'integer',
        'aura' => 'integer',

        'type_order' => 'integer',

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

    public function region(): HasOne
    {
        return $this->HasOne(BolRegion::class, 'id', 'region_id');
    }
    public function currentQuest($idQuest): HasOne
    {
        return $this->HasOne(BolQuestProtagonist::class, 'protagonist_id', 'id')->where('type', 'H')->where('quest_id',$idQuest);
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
            'joueur' => $this->joueur,
            'nom' => $this->nom,
            'commentaire' => $this->commentaire,
            'region_id' => $this->region_id,
            'region' => $this->region,
            'avatar' => $this->avatar,
            'langues' => $this->langues
        ];
    }

    public function getRessourcesAttribute()
    {
        return [
            'vitalite' => $this->vitalite,
            'heroisme' => $this->heroisme,
            'experience' => $this->experience,
            'foi' => $this->foi,
            'vilenie' => $this->vilenie,
            'pouvoir' => $this->pouvoir,
            'creation' => $this->creation,
        ];
    }
    public function getTypeOrderAttribute()
    {
        switch ($this->type) {
            case 'H':
                return 1;
            case 'R':
                return 2;
            case 'C':
                return 3;
            case 'P':
                return 4;
            default:
                return null;
        }
    }
}
