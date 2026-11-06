<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Un cyberimplant de Cyberpunk RED : où il se pose, ce qu'il requiert, sa perte d'Humanité et ses effets (voir la migration cpr_cyber). */
class CprCyber extends Model
{
    use AccessibleToUser;

    /** Les emplacements des catégories sans pièce mère : cyberfashion, implants internes, implants externes. */
    public const EMPLACEMENTS_SANS_PIECE_MERE = 7;

    protected $table = 'cpr_cyber';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'requiert' => 'array',
        'emplacements_occupes' => 'integer',
        'emplacements_fournis' => 'integer',
        'couple' => 'boolean',
        'bras_de_chair' => 'boolean',
        'ph_fixe' => 'integer',
        'prix' => 'integer',
        'effets' => 'array',
        'prerequis' => 'array',
        'ordre' => 'integer',
    ];
}
