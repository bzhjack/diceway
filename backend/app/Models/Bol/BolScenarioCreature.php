<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

class BolScenarioCreature extends Model
{
    protected $table = 'bol_scenario_creature';
    public $timestamps = false;

    protected $fillable = [
        'scenario_id', 'creature_id', 'surnom', 'nom',
        'vigueur', 'agilite', 'esprit',
        'vitalite_max', 'vitalite_courante',
        'attaque', 'defense', 'degats', 'protection', 'id_taille',
    ];

    protected $casts = [
        'vigueur'          => 'integer',
        'agilite'          => 'integer',
        'esprit'           => 'integer',
        'vitalite_max'     => 'integer',
        'vitalite_courante'=> 'integer',
        'attaque'          => 'integer',
        'defense'          => 'integer',
        'id_taille'        => 'integer',
    ];
}
