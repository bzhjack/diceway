<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Une arme de Cyberpunk RED : une classe du livre (pistolet lourd, arme de mêlée légère…) ou une arme exotique, variante d'une classe. */
class CprArme extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_arme';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'base_id' => 'integer',
        'competence_id' => 'integer',
        'chargeur' => 'integer',
        'chargeur_extension' => 'integer',
        'chargeur_cylindre' => 'integer',
        'att_round' => 'integer',
        'mains' => 'integer',
        'dissimulable' => 'boolean',
        'prix' => 'integer',
        'cor_minimum' => 'integer',
        'ignore_armure_sous' => 'integer',
        'traits' => 'array',
        'ordre' => 'integer',
    ];

    public function base(): BelongsTo
    {
        return $this->belongsTo(self::class, 'base_id');
    }

    public function competence(): BelongsTo
    {
        return $this->belongsTo(CprCompetence::class, 'competence_id');
    }
}
