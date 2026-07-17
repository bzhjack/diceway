<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolFightSessionDemon extends Model
{
    protected $table = 'bol_fight_session_demon';
    public $timestamps = false;

    protected $fillable = [
        'fight_session_id', 'demon_id', 'camp', 'qty', 'surnom', 'rang', 'nom',
        'vigueur', 'agilite', 'esprit', 'aura',
        'melee', 'tir', 'defense',
        'vitalite_max', 'vitalite_courante',
        'degats',
        'pouvoirs',
    ];

    protected $casts = [
        'qty'               => 'integer',
        'vigueur'           => 'integer',
        'agilite'           => 'integer',
        'esprit'            => 'integer',
        'aura'              => 'integer',
        'melee'             => 'integer',
        'tir'               => 'integer',
        'defense'           => 'integer',
        'vitalite_max'      => 'integer',
        'vitalite_courante' => 'integer',
        'pouvoirs'          => 'array',
    ];

    public function demon(): BelongsTo
    {
        return $this->belongsTo(BolDemon::class, 'demon_id', 'id');
    }
}
