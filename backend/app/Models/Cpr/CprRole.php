<?php

namespace App\Models\Cpr;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Un des dix rôles de Cyberpunk RED (catalogue du livre, le même pour tous les comptes). */
class CprRole extends Model
{
    protected $table = 'cpr_role';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'ordre' => 'integer',
    ];

    /** Ses 20 compétences (les 13 de base et ses 7 compétences de rôle), avec leur niveau au Rat des Rues. */
    public function competences(): HasMany
    {
        return $this->hasMany(CprRoleCompetence::class, 'role_id');
    }

    /** Son équipement de départ (Rat des Rues et Edgerunner), par groupes d'alternatives. */
    public function dotations(): HasMany
    {
        return $this->hasMany(CprRoleDotation::class, 'role_id')->orderBy('ordre');
    }

    /** Sa table de CARAC, une ligne par résultat du d10. */
    public function profils(): HasMany
    {
        return $this->hasMany(CprRoleProfil::class, 'role_id')->orderBy('jet');
    }
}
