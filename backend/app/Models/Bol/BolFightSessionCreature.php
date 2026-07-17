<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolFightSessionCreature extends Model
{
    protected $table = 'bol_fight_session_creature';
    public $timestamps = false;

    protected $fillable = [
        'fight_session_id', 'creature_id', 'camp', 'qty', 'surnom', 'rang', 'nom',
        'vigueur', 'agilite', 'esprit',
        'vitalite_max', 'vitalite_courante',
        'attaque', 'defense', 'degats', 'protection', 'id_taille',
        'capacites',
    ];

    protected $casts = [
        'qty'               => 'integer',
        'vigueur'           => 'integer',
        'agilite'           => 'integer',
        'esprit'            => 'integer',
        'vitalite_max'      => 'integer',
        'vitalite_courante' => 'integer',
        'attaque'           => 'integer',
        'defense'           => 'integer',
        'id_taille'         => 'integer',
        'capacites'         => 'array',
    ];

    public function creature(): BelongsTo
    {
        return $this->belongsTo(BolCreature::class, 'creature_id', 'id');
    }
}
