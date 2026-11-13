<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Scène préparée : une distribution de PNJ / créatures / démons (références à la bibliothèque, avec
 * nombre d'exemplaires, camp et attitude) rechargeable sur la table, rangée ou non dans un scénario, avec son décor
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

    /** Une scène qui part : sa référence d'import aussi, et les pistes des autres qui menaient à elle gardent leur texte, sans destination. */
    protected static function booted(): void
    {
        static::deleted(function (BolScene $scene): void {
            BolImportRef::where('entity_kind', 'scene')->where('entity_id', $scene->id)->delete();

            self::where('user_id', $scene->user_id)->whereNotNull('pistes')->get(['id', 'pistes'])->each(function (BolScene $autre) use ($scene): void {
                $pistes = array_map(fn (array $piste) => ($piste['scene_id'] ?? null) === $scene->id ? [...$piste, 'scene_id' => null] : $piste, $autre->pistes);
                if ($pistes !== $autre->pistes) {
                    $autre->update(['pistes' => $pistes]);
                }
            });
        });
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(BolScenario::class, 'scenario_id', 'id');
    }
}
