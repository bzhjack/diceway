<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;

/** Une compétence de Cyberpunk RED : sa CARAC, sa catégorie, son coût (2 pour les compétences x2). */
class CprCompetence extends Model
{
    protected $table = 'cpr_competence';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'cout' => 'integer',
        'de_base' => 'boolean',
        'reservee_role_id' => 'integer',
        'ordre' => 'integer',
    ];
}
