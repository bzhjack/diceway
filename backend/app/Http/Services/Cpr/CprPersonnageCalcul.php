<?php

namespace App\Http\Services\Cpr;

use App\Models\Cpr\CprArmure;
use App\Models\Cpr\CprCompetence;
use App\Models\Cpr\CprCyber;
use App\Models\Cpr\CprEquipement;
use App\Models\Cpr\CprPersonnage;
use App\Models\Cpr\CprRole;
use Illuminate\Support\Collection;

/**
 * Ce qui se calcule sur une fiche de Cyberpunk RED (étape 2.2 du plan) : CARAC effectives, PS, seuil de blessure grave, sauvegarde contre
 * la mort, Humanité et EMP, bases de compétence, PA, Initiative, emplacements des pièces mères, alertes. Règles :
 * doc/cyberpunk/rules/01-creation-personnage.md, 04-combat.md, 06-cybermateriel-et-humanite.md.
 *
 * Interprétations (le livre ne tranche pas) : plusieurs bonus pour une même compétence ne se cumulent pas, le plus élevé compte ; un bonus
 * sous condition (« pour l'ouïe ») est listé à part, sans entrer dans la base.
 */
class CprPersonnageCalcul
{
    /** La capacité Moto du Nomade s'ajoute à ces compétences (p. 161). */
    private const COMPETENCES_DU_NOMADE = [
        'conduite_de_vehicule_terrestre', 'pilotage_de_vehicule_aerien', 'pilotage_de_vehicule_maritime', 'aerotech', 'terratech', 'maritech',
    ];

    /** Expert sur le terrain (Techie) s'ajoute à ces compétences (p. 147). */
    private const COMPETENCES_DU_TECHIE = ['electronique', 'cybertech', 'securite_electronique', 'armurerie', 'terratech', 'maritech', 'aerotech'];

    /** Les catégories sans pièce mère : 7 emplacements chacune. */
    private const RESERVOIRS_SANS_PIECE_MERE = ['cyberfashion', 'interne', 'externe'];

    public function calculer(CprPersonnage $personnage): array
    {
        $personnage->loadMissing(CprPersonnage::RELATIONS);
        $implants = $this->implants($personnage);
        $armures = $this->armuresPortees($personnage);

        $caracs = $this->caracsDeBase($personnage, $implants);
        $penalite = $armures->where('catalogue.type', 'armure')->max(fn ($armure) => $armure['catalogue']->penalite) ?? 0;
        $effectives = $caracs;
        foreach (['ref', 'dex', 'mouv'] as $carac) {
            $effectives[$carac] = max(0, $caracs[$carac] - $penalite);
        }

        $psMax = 10 + 5 * (int) ceil(($caracs['cor'] + $caracs['vol']) / 2);
        $ph = (int) $implants->sum(fn ($implant) => $implant['ligne']->ph);
        $humaniteMax = $personnage->emp * 10
            - 2 * $implants->filter(fn ($implant) => $implant['catalogue']->categorie !== 'cyborgimplant' && $implant['catalogue']->ph_fixe > 0)->count()
            - 4 * $implants->where('catalogue.categorie', 'cyborgimplant')->count();
        $humanite = $personnage->humanite ?? $personnage->emp * 10 - $ph;

        return [
            'caracs' => $caracs,
            'caracs_effectives' => $effectives,
            'penalite_armure' => $penalite,
            'ps_max' => $psMax,
            'ps' => $personnage->ps ?? $psMax,
            'seuil_blessure_grave' => (int) ceil($psMax / 2),
            'sauvegarde_contre_la_mort' => $caracs['cor'],
            'humanite' => $humanite,
            'humanite_max' => $humaniteMax,
            'emp_actuelle' => max(0, intdiv(max(0, $humanite), 10)),
            'ph_totale' => $ph,
            'chance_max' => $personnage->cha,
            'chance' => $personnage->chance ?? $personnage->cha,
            'pa' => $this->pa($armures, $implants),
            'initiative' => $effectives['ref'] + $this->bonusDInitiative($personnage, $implants),
            'competences' => $this->competences($personnage, $effectives, $implants),
            'emplacements' => $this->emplacements($implants),
            'alertes' => $this->alertes($implants),
        ];
    }

    /** Les implants de la fiche avec leur ligne du catalogue. */
    private function implants(CprPersonnage $personnage): Collection
    {
        $catalogue = CprCyber::whereIn('id', $personnage->cyber->pluck('cyber_id'))->get()->keyBy('id');
        return $personnage->cyber->map(fn ($ligne) => ['ligne' => $ligne, 'catalogue' => $catalogue[$ligne->cyber_id]])->values();
    }

    private function armuresPortees(CprPersonnage $personnage): Collection
    {
        $catalogue = CprArmure::whereIn('id', $personnage->armures->pluck('armure_id'))->get()->keyBy('id');
        return $personnage->armures->where('equipee', true)
            ->map(fn ($ligne) => ['ligne' => $ligne, 'catalogue' => $catalogue[$ligne->armure_id]])->values();
    }

    /** Les CARAC de la fiche, modifiées par les implants : maillage (+2 chacun, sans dépasser 10), charpentes (valeur fixe). */
    private function caracsDeBase(CprPersonnage $personnage, Collection $implants): array
    {
        $caracs = [];
        foreach (CprPersonnage::CARACS as $carac) {
            $caracs[$carac] = (int) $personnage->$carac;
        }
        foreach ($this->effets($implants) as $effet) {
            if ($effet['type'] === 'carac' && empty($effet['condition'])) {
                $plafond = $effet['maximum'] ?? PHP_INT_MAX;
                $caracs[$effet['cible']] = max($caracs[$effet['cible']], min($plafond, $caracs[$effet['cible']] + $effet['valeur']));
            }
        }
        foreach ($this->effets($implants) as $effet) {
            if ($effet['type'] === 'carac_fixe' && empty($effet['condition'])) {
                $caracs[$effet['cible']] = max($caracs[$effet['cible']], $effet['valeur']);
            }
        }
        return $caracs;
    }

    /** Le meilleur PA de chaque localisation : armures portées (PA actuel s'il a été perforé) et armures intégrées. */
    private function pa(Collection $armures, Collection $implants): array
    {
        $pa = ['tete' => 0, 'corps' => 0];
        foreach ($armures->where('catalogue.type', 'armure') as ['ligne' => $ligne, 'catalogue' => $catalogue]) {
            $valeur = $ligne->pa ?? $catalogue->pa;
            $zones = $catalogue->tete_et_corps ? ['tete', 'corps'] : array_filter([$ligne->localisation]);
            foreach ($zones as $zone) {
                $pa[$zone] = max($pa[$zone], $valeur);
            }
        }
        foreach ($this->effets($implants) as $effet) {
            if ($effet['type'] === 'pa') {
                foreach ($effet['zones'] as $zone) {
                    $pa[$zone] = max($pa[$zone], $effet['valeur']);
                }
            }
        }
        $boucliers = $armures->where('catalogue.type', 'bouclier')->map(fn ($armure) => $armure['ligne']->pa ?? $armure['catalogue']->ps)->values()->all();
        return [...$pa, 'boucliers' => $boucliers];
    }

    /** Implants permanents (Kerenzikov) et Réaction d'Initiative du Solo ; le sandevistan, qui s'active, n'y est pas. */
    private function bonusDInitiative(CprPersonnage $personnage, Collection $implants): int
    {
        $bonus = 0;
        foreach ($this->effets($implants) as $effet) {
            if ($effet['type'] === 'initiative' && empty($effet['condition'])) {
                $bonus += $effet['valeur'];
            }
        }
        $solo = CprRole::where('code', 'solo')->value('id');
        $details = $personnage->roles->firstWhere('role_id', $solo)?->details ?? [];
        return $bonus + (int) ($details['reaction_d_initiative'] ?? 0);
    }

    /** La base de chaque compétence de la fiche : CARAC effective + niveau (au moins 3 avec une puce) + meilleur bonus. */
    private function competences(CprPersonnage $personnage, array $caracs, Collection $implants): array
    {
        $catalogue = CprCompetence::whereIn('id', $personnage->competences->pluck('competence_id'))->get()->keyBy('id');
        $sources = $this->sourcesDeBonus($personnage, $implants);
        $puces = $implants->filter(fn ($implant) => $implant['catalogue']->code === 'puce_de_competence')
            ->map(fn ($implant) => $implant['ligne']->precision)->filter()->all();

        $roles = CprRole::pluck('id', 'code');
        $rangDeMoto = (int) ($personnage->roles->firstWhere('role_id', $roles['nomade'])?->rang ?? 0);
        $expertSurLeTerrain = (int) ($personnage->roles->firstWhere('role_id', $roles['techie'])?->details['expert_terrain'] ?? 0);

        $resultat = [];
        foreach ($personnage->competences as $ligne) {
            $competence = $catalogue[$ligne->competence_id];
            $niveau = in_array($competence->code, $puces, true) ? max($ligne->niveau, 3) : $ligne->niveau;
            $bonus = collect($sources[$competence->code] ?? []);
            $permanent = (int) ($bonus->whereNull('condition')->max('valeur') ?? 0);
            $role = (in_array($competence->code, self::COMPETENCES_DU_NOMADE, true) ? $rangDeMoto : 0)
                + (in_array($competence->code, self::COMPETENCES_DU_TECHIE, true) ? $expertSurLeTerrain : 0);
            $resultat[] = [
                'competence_id' => $competence->id,
                'code' => $competence->code,
                'precision' => $ligne->precision,
                'niveau' => $niveau,
                'carac' => $competence->carac,
                'bonus' => $permanent,
                'bonus_de_role' => $role,
                'base' => $caracs[$competence->carac] + $niveau + $permanent + $role,
                'bonus_sous_condition' => $bonus->whereNotNull('condition')->values()->all(),
            ];
        }
        return [...$resultat, ...$this->competencesDeMedecine($personnage, $caracs, $catalogue)];
    }

    /** Chirurgie (2 niveaux par point, 10 au plus) et Techniques médicales (Médicaments + Cryosystèmes) viennent de la Médecine du Medtech. */
    private function competencesDeMedecine(CprPersonnage $personnage, array $caracs, $deja): array
    {
        $medtech = CprRole::where('code', 'medtech')->value('id');
        $details = $personnage->roles->firstWhere('role_id', $medtech)?->details;
        if (!$details) {
            return [];
        }
        $niveaux = [
            'chirurgie' => min(10, 2 * (int) ($details['chirurgie'] ?? 0)),
            'techniques_medicales' => min(10, (int) ($details['medicaments'] ?? 0) + (int) ($details['cryosystemes'] ?? 0)),
        ];
        $resultat = [];
        foreach (CprCompetence::whereIn('code', array_keys($niveaux))->get() as $competence) {
            $niveau = $niveaux[$competence->code];
            if ($niveau === 0 || $deja->has($competence->id)) {
                continue;
            }
            $resultat[] = [
                'competence_id' => $competence->id, 'code' => $competence->code, 'precision' => null, 'niveau' => $niveau,
                'carac' => $competence->carac, 'bonus' => 0, 'bonus_de_role' => 0, 'base' => $caracs[$competence->carac] + $niveau,
                'bonus_sous_condition' => [],
            ];
        }
        return $resultat;
    }

    /** Les bonus de compétence des implants et de l'équipement, par compétence : [valeur, condition, source]. */
    private function sourcesDeBonus(CprPersonnage $personnage, Collection $implants): array
    {
        $sources = [];
        foreach ($implants as $implant) {
            foreach ($implant['catalogue']->effets ?? [] as $effet) {
                if ($effet['type'] === 'competence') {
                    $sources[$effet['cible']][] = ['valeur' => $effet['valeur'], 'condition' => $effet['condition'] ?? null, 'source' => $implant['catalogue']->nom];
                }
            }
        }
        $equipement = CprEquipement::whereIn('id', $personnage->objets->where('objet_type', 'equipement')->pluck('objet_id'))->get();
        foreach ($equipement as $objet) {
            foreach ($objet->effets ?? [] as $effet) {
                if ($effet['type'] === 'competence') {
                    $sources[$effet['cible']][] = ['valeur' => $effet['valeur'], 'condition' => $effet['condition'] ?? null, 'source' => $objet->nom];
                }
            }
        }
        return $sources;
    }

    /** Pour chaque pièce mère posée, et pour les catégories sans pièce mère : emplacements fournis, occupés, libres. */
    private function emplacements(Collection $implants): array
    {
        $resultat = [];
        foreach ($implants->filter(fn ($implant) => $implant['catalogue']->emplacements_fournis > 0) as $piece) {
            $occupes = $implants->filter(fn ($implant) => $implant['ligne']->parent_id === $piece['ligne']->id)
                ->sum(fn ($implant) => $implant['catalogue']->emplacements_occupes);
            $resultat[] = [
                'piece' => $piece['catalogue']->code,
                'implant_id' => $piece['ligne']->id,
                'fournis' => $piece['catalogue']->emplacements_fournis,
                'occupes' => (int) $occupes,
                'libres' => $piece['catalogue']->emplacements_fournis - (int) $occupes,
            ];
        }
        foreach (self::RESERVOIRS_SANS_PIECE_MERE as $reservoir) {
            $occupes = $implants->where('catalogue.emplacement', $reservoir)->sum(fn ($implant) => $implant['catalogue']->emplacements_occupes);
            $resultat[] = [
                'piece' => $reservoir,
                'implant_id' => null,
                'fournis' => CprCyber::EMPLACEMENTS_SANS_PIECE_MERE,
                'occupes' => (int) $occupes,
                'libres' => CprCyber::EMPLACEMENTS_SANS_PIECE_MERE - (int) $occupes,
            ];
        }
        return $resultat;
    }

    /** Ce qui ne va pas sans bloquer l'enregistrement : emplacements dépassés, groupes exclusifs en double, implant sans sa pièce mère. */
    private function alertes(Collection $implants): array
    {
        $alertes = [];
        foreach ($this->emplacements($implants) as $reservoir) {
            if ($reservoir['libres'] < 0) {
                $alertes[] = "Trop d’implants dans « {$reservoir['piece']} » : {$reservoir['occupes']} emplacements pour {$reservoir['fournis']}.";
            }
        }
        foreach ($implants->pluck('catalogue')->whereNotNull('exclusif')->groupBy('exclusif') as $groupe => $doublons) {
            if ($doublons->count() > 1) {
                $alertes[] = "Un seul implant « {$groupe} » à la fois : " . $doublons->pluck('nom')->join(', ') . '.';
            }
        }
        $parCode = $implants->keyBy(fn ($implant) => $implant['ligne']->id);
        foreach ($implants as $implant) {
            $requis = $implant['catalogue']->requiert;
            if (!$requis) {
                continue;
            }
            $parent = $implant['ligne']->parent_id ? $parCode[$implant['ligne']->parent_id] ?? null : null;
            if ($parent === null && !$implant['catalogue']->bras_de_chair) {
                $alertes[] = "« {$implant['catalogue']->nom} » n’est posé dans aucune pièce mère (" . implode(' ou ', $requis) . ').';
            } elseif ($parent !== null && !in_array($parent['catalogue']->code, $requis, true)) {
                $alertes[] = "« {$implant['catalogue']->nom} » ne se pose pas dans « {$parent['catalogue']->nom} ».";
            }
        }
        return $alertes;
    }

    private function effets(Collection $implants): array
    {
        return $implants->flatMap(fn ($implant) => $implant['catalogue']->effets ?? [])->all();
    }
}
