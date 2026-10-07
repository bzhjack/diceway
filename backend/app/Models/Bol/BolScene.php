<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Scène préparée : une distribution de PNJ / créatures / démons (références à la bibliothèque, avec
 * quantité et positions) rechargeable sur la table, rangée ou non dans un scénario. */
class BolScene extends Model
{
    use Uuids;

    protected $table = 'bol_scene';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'scenario_id', 'titre', 'ordre', 'notes', 'distribution'];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = ['ordre' => 'integer', 'distribution' => 'array'];

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(BolScenario::class, 'scenario_id', 'id');
    }
}
