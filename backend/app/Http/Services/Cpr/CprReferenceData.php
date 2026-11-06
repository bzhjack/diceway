<?php

namespace App\Http\Services\Cpr;

use App\Models\Cpr\CprAccessoire;
use App\Models\Cpr\CprAmeliorationVehicule;
use App\Models\Cpr\CprArme;
use App\Models\Cpr\CprArmure;
use App\Models\Cpr\CprCompetence;
use App\Models\Cpr\CprCyber;
use App\Models\Cpr\CprDrogue;
use App\Models\Cpr\CprEquipement;
use App\Models\Cpr\CprMaterielNet;
use App\Models\Cpr\CprMunition;
use App\Models\Cpr\CprProgramme;
use App\Models\Cpr\CprRole;
use App\Models\Cpr\CprVehicule;
use App\Models\Cpr\CprVetement;
use Illuminate\Support\Facades\Cache;

/** Les listes de référence de Cyberpunk RED : les mêmes pour tous les comptes, gardées en cache (les migrations qui les modifient vident
 * leurs clés). */
class CprReferenceData
{
    /** Une heure, en secondes, comme les listes de BoL. */
    private const TTL = 3600;

    public function roles()
    {
        return $this->remember('cpr_roles_all', fn () => CprRole::with(['competences', 'profils', 'dotations'])->orderBy('ordre')->get());
    }

    public function competences()
    {
        return $this->remember('cpr_competences_all', fn () => CprCompetence::orderBy('ordre')->get());
    }

    /** Les catalogues ne servent ici que les lignes du livre ; les objets créés par un compte auront leur propre liste. */
    public function armes()
    {
        return $this->remember('cpr_armes_catalogue', fn () => CprArme::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function munitions()
    {
        return $this->remember('cpr_munitions_catalogue', fn () => CprMunition::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function accessoires()
    {
        return $this->remember('cpr_accessoires_catalogue', fn () => CprAccessoire::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function armures()
    {
        return $this->remember('cpr_armures_catalogue', fn () => CprArmure::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function cyber()
    {
        return $this->remember('cpr_cyber_catalogue', fn () => CprCyber::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function equipement()
    {
        return $this->remember('cpr_equipement_catalogue', fn () => CprEquipement::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function vetements()
    {
        return $this->remember('cpr_vetements_catalogue', fn () => CprVetement::orderBy('id')->get());
    }

    public function drogues()
    {
        return $this->remember('cpr_drogues_catalogue', fn () => CprDrogue::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function programmes()
    {
        return $this->remember('cpr_programmes_catalogue', fn () => CprProgramme::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function materielNet()
    {
        return $this->remember('cpr_materiel_net_catalogue', fn () => CprMaterielNet::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function vehicules()
    {
        return $this->remember('cpr_vehicules_catalogue', fn () => CprVehicule::whereNull('user_id')->orderBy('ordre')->get());
    }

    public function ameliorationsVehicule()
    {
        return $this->remember('cpr_ameliorations_vehicule_catalogue', fn () => CprAmeliorationVehicule::orderBy('ordre')->get());
    }

    /** Tout ce que la création de personnage demande, en un appel. */
    public function all(): array
    {
        return [
            'roles' => $this->roles(),
            'competences' => $this->competences(),
            'armes' => $this->armes(),
            'munitions' => $this->munitions(),
            'accessoires' => $this->accessoires(),
            'armures' => $this->armures(),
            'cyber' => $this->cyber(),
            'equipement' => $this->equipement(),
            'vetements' => $this->vetements(),
            'drogues' => $this->drogues(),
            'programmes' => $this->programmes(),
            'materiel_net' => $this->materielNet(),
            'vehicules' => $this->vehicules(),
            'ameliorations_vehicule' => $this->ameliorationsVehicule(),
        ];
    }

    private function remember(string $key, callable $callback)
    {
        return Cache::remember($key, self::TTL, $callback);
    }
}
