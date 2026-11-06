<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Une compétence d'un personnage, avec sa précision (quelle langue, quelle science…). */
class CprPersonnageCompetence extends Model
{
    protected $table = 'cpr_personnage_competence';
    public $timestamps = false;
    protected $guarded = ['id', 'personnage_id'];
    protected $hidden = ['personnage_id'];
    protected $casts = [
        'id' => 'integer',
        'competence_id' => 'integer',
        'niveau' => 'integer',
    ];
}
