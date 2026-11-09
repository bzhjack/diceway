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

class BolDemon extends Model
{
    use HasFactory, HasPortrait, Uuids, AccessibleToUser, CiteeDansLesScenes;

    /** Le nom sous lequel une scène ou une référence d'import cite cette fiche. */
    public const KIND_DE_SCENE = 'demon';

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

        'id_categorie',
        'id_taille',
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
        'id_categorie' => 'integer',
        'id_taille' => 'integer',
    ];

    public function pouvoirs(): HasMany
    {
        return $this->HasMany(BolDemonPouvoir::class, 'demon_id', 'id');
    }

    public function categorie(): HasOne
    {
        return $this->HasOne(BolCategorie::class, 'id', 'id_categorie');
    }

    /** Sa taille (`bol_taille`) : Moyenne par défaut ; elle compte en combat (renversement, poison). */
    public function taille(): HasOne
    {
        return $this->HasOne(BolTaille::class, 'id', 'id_taille');
    }

    public function getTypeAttribute()
    {
        return $this->categorie->type;
    }
}
