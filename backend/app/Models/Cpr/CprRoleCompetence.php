<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Une des 20 compétences d'un rôle, avec la précision imposée (Langue : argot) et son niveau au Rat des Rues. */
class CprRoleCompetence extends Model
{
    protected $table = 'cpr_role_competence';
    public $timestamps = false;
    protected $casts = [
        'id' => 'integer',
        'role_id' => 'integer',
        'competence_id' => 'integer',
        'de_role' => 'boolean',
        'niveau_rat_des_rues' => 'integer',
    ];

    public function competence(): BelongsTo
    {
        return $this->belongsTo(CprCompetence::class, 'competence_id');
    }
}
