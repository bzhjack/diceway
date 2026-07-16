<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolFightSessionPnj extends Model
{
    protected $table = 'bol_fight_session_pnj';
    public $timestamps = false;

    protected $fillable = [
        'fight_session_id', 'pnj_id', 'camp', 'surnom', 'rang', 'nom',
        'vigueur', 'agilite', 'esprit', 'aura',
        'melee', 'tir', 'defense',
        'vitalite_max', 'vitalite_courante',
        'armes',
    ];

    protected $casts = [
        'vigueur'           => 'integer',
        'agilite'           => 'integer',
        'esprit'            => 'integer',
        'aura'              => 'integer',
        'melee'             => 'integer',
        'tir'               => 'integer',
        'defense'           => 'integer',
        'vitalite_max'      => 'integer',
        'vitalite_courante' => 'integer',
        'armes'             => 'array',
    ];

    public function pnj(): BelongsTo
    {
        return $this->belongsTo(BolHeros::class, 'pnj_id', 'id');
    }
}
