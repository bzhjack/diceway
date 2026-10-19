<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Scène préparée : une distribution de PNJ / créatures / démons (références à la bibliothèque, avec
 * quantité et positions) rechargeable sur la table, rangée ou non dans un scénario, avec son décor
 * (région, lieu, ambiance, illustration), son texte à lire, ses règles pour le MJ (`jeu`), le secret du MJ (`notes`) et ses pistes. */
class BolScene extends Model
{
    use Uuids;

    protected $table = 'bol_scene';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = [
        'user_id', 'scenario_id', 'titre', 'ordre', 'notes', 'distribution',
        'region_id', 'lieu', 'moment', 'meteo', 'danger', 'lecture', 'jeu', 'pistes', 'image',
    ];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'ordre'        => 'integer',
        'distribution' => 'array',
        'region_id'    => 'integer',
        'danger'       => 'integer',
        'pistes'       => 'array',
    ];

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(BolScenario::class, 'scenario_id', 'id');
    }
}
