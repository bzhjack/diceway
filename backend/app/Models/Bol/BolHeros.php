<?php

namespace App\Models\Bol;

use App\Http\Services\Bol\BolEquipmentEffectService;
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
    protected $appends = ['combat', 'attributs', 'origines', 'ressources', 'type_order', 'equipement_effectif'];
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

    public function getCombatAttribute()
    {
        return [
            'initiative' => $this->initiative,
            'initiative_effective' => $this->initiative_effective,
            'melee' => $this->melee,
            'tir' => $this->tir,
            'defense' => $this->defense,
            'defense_effective' => $this->defense_effective,
        ];
    }

    public function getAttributsAttribute()
    {
        return [
            'vigueur' => $this->vigueur,
            'agilite' => $this->agilite,
            'agilite_effective' => $this->agilite_effective,
            'esprit' => $this->esprit,
            'aura' => $this->aura,
        ];
    }

    public function getAgiliteEffectiveAttribute()
    {
        return (new BolEquipmentEffectService())->agiliteEffective($this->agilite, $this->equippedArmuresData());
    }

    public function getInitiativeEffectiveAttribute()
    {
        return (new BolEquipmentEffectService())->initiativeEffective($this->initiative, $this->equippedArmuresData());
    }

    public function getDefenseEffectiveAttribute()
    {
        return (new BolEquipmentEffectService())->defenseEffective($this->defense, $this->equippedArmuresData());
    }

    public function getEquipementEffectifAttribute()
    {
        return (new BolEquipmentEffectService())->equipementEffectif($this->equippedArmuresData());
    }

    private function equippedArmuresData(): array
    {
        return $this->armures
            ->filter(fn (BolHerosArmure $item) => $item->equipee && $item->armure !== null)
            ->map(fn (BolHerosArmure $item) => [
                'categorie' => $item->armure->categorie,
                'malus_agilite' => $item->armure->malus_agilite,
                'malus_initiative' => $item->armure->malus_initiative,
                'malus_attaque_subie' => $item->armure->malus_attaque_subie,
                'malus_attaque_subie_portee' => $item->armure->malus_attaque_subie_portee,
            ])
            ->values()
            ->all();
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
