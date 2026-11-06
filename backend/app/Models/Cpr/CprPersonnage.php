<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use App\Traits\HasPortrait;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Une fiche de personnage de Cyberpunk RED (PJ ou PNJ), avec ses lignes. Voir la migration cpr_personnage. */
class CprPersonnage extends Model
{
    use Uuids, HasPortrait, AccessibleToUser;

    public const CARACS = ['int', 'ref', 'dex', 'tech', 'pres', 'vol', 'cha', 'mouv', 'cor', 'emp'];

    /** Les lignes de la fiche, dans l'ordre où elles s'enregistrent. */
    public const RELATIONS = ['roles', 'competences', 'armes', 'armures', 'cyber', 'objets'];

    protected $table = 'cpr_personnage';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'type', 'statut', 'methode', 'pseudo', 'joueur', 'avatar', 'role_id', ...self::CARACS,
        'profil_jet', 'humanite', 'ps', 'chance', 'reputation', 'eddies', 'pam', 'parcours', 'niveau_de_vie', 'logement', 'notes',
    ];
    protected $casts = [
        'role_id' => 'integer',
        'int' => 'integer', 'ref' => 'integer', 'dex' => 'integer', 'tech' => 'integer', 'pres' => 'integer',
        'vol' => 'integer', 'cha' => 'integer', 'mouv' => 'integer', 'cor' => 'integer', 'emp' => 'integer',
        'profil_jet' => 'integer',
        'humanite' => 'integer',
        'ps' => 'integer',
        'chance' => 'integer',
        'reputation' => 'integer',
        'eddies' => 'integer',
        'pam' => 'integer',
        'parcours' => 'array',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(CprRole::class, 'role_id');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(CprPersonnageRole::class, 'personnage_id');
    }

    public function competences(): HasMany
    {
        return $this->hasMany(CprPersonnageCompetence::class, 'personnage_id');
    }

    public function armes(): HasMany
    {
        return $this->hasMany(CprPersonnageArme::class, 'personnage_id');
    }

    public function armures(): HasMany
    {
        return $this->hasMany(CprPersonnageArmure::class, 'personnage_id');
    }

    public function cyber(): HasMany
    {
        return $this->hasMany(CprPersonnageCyber::class, 'personnage_id');
    }

    public function objets(): HasMany
    {
        return $this->hasMany(CprPersonnageObjet::class, 'personnage_id');
    }
}
