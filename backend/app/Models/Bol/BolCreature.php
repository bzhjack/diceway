<?php

namespace App\Models\Bol;

use App\Traits\AccessibleToUser;
use App\Traits\CiteeDansLesScenes;
use App\Traits\HasPortrait;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolCreature extends Model
{
    use HasFactory, HasPortrait, Uuids, AccessibleToUser, CiteeDansLesScenes;

    /** Le nom sous lequel une scène ou une référence d'import cite cette fiche. */
    public const KIND_DE_SCENE = 'creature';

    protected $table = 'bol_creature';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = ['created_at', 'updated_at'];
    protected $appends = ['type', 'rang'];
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
        'id_taille',
        'mort_vivant',
    ];
    protected $casts = [
        'vigueur' => 'integer',
        'agilite' => 'integer',
        'esprit' => 'integer',
        'vitalite' => 'integer',
        'attaque' => 'integer',
        'defense' => 'integer',
        'id_taille' => 'integer',
        'mort_vivant' => 'boolean',
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

    public function getTypeAttribute(): string
    {
        return $this->taille->type;
    }

    public function getRangAttribute(): string
    {
        return match($this->taille?->type) {
            'P' => 'pietaille',
            'R' => 'rival',
            default => 'coriace',
        };
    }

}
