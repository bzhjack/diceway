<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolScenarioDemon extends Model
{
    public $timestamps = false;
    protected $table = 'bol_scenario_demon';

    protected $fillable = [
        'scenario_id', 'demon_id', 'surnom', 'rang', 'nom',
        'vigueur', 'agilite', 'esprit', 'aura',
        'melee', 'tir', 'defense',
        'vitalite_max', 'vitalite_courante',
        'degats', 'id_taille',
    ];

    public function demon(): BelongsTo
    {
        return $this->belongsTo(BolDemon::class, 'demon_id', 'id');
    }
}
