<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolScenarioPnj extends Model
{
    public $timestamps = false;
    protected $table = 'bol_scenario_pnj';

    protected $fillable = [
        'scenario_id', 'pnj_id', 'surnom', 'nom',
        'vigueur', 'agilite', 'esprit', 'aura',
        'melee', 'tir', 'defense',
        'vitalite_max', 'vitalite_courante',
        'armes',
    ];

    protected $casts = [
        'armes' => 'array',
    ];

    public function pnj(): BelongsTo
    {
        return $this->belongsTo(BolHeros::class, 'pnj_id', 'id');
    }
}
