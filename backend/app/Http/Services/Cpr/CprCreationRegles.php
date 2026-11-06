<?php

namespace App\Http\Services\Cpr;

use App\Models\Cpr\CprAccessoire;
use App\Models\Cpr\CprAmeliorationVehicule;
use App\Models\Cpr\CprArme;
use App\Models\Cpr\CprArmure;
use App\Models\Cpr\CprCompetence;
use App\Models\Cpr\CprCyber;
use App\Models\Cpr\CprPersonnage;
use App\Models\Cpr\CprRole;
use App\Models\Cpr\CprVehicule;
use Illuminate\Support\Facades\DB;

/**
 * Les règles de création de Cyberpunk RED (étape 2.3 du plan ; doc/cyberpunk/rules/01-creation-personnage.md), appliquées à un PJ qui a une
 * méthode de création :
 *
 * - en **brouillon** : rien ne dépasse (bornes, points de CARAC et de compétences, budgets), mais la fiche peut être incomplète ;
 * - à l'**activation** (le passage de brouillon à actif) : tout est dépensé et conforme (points au complet, une alternative par groupe de
 *   dotation, capacité de rôle répartie, Humanité de départ).
 *
 * Une fiche active n'y est plus soumise. Les erreurs sont rendues par champ, comme une validation.
 *
 * Formats de `details` (ligne de rôle, rang R) :
 * - Techie : expert_terrain, expert_amelioration, expert_fabrication, expert_invention ; total 2 × R, chacun au plus R ;
 * - Medtech : chirurgie, medicaments, cryosystemes ; total R, médicaments et cryosystèmes au plus 5 ; medicaments_choisis : un code par point ;
 * - Solo : deflexion (0, 2, 4, 6, 8, 10), correction (0 ou 4), reaction_d_initiative, attaque_de_precision (0, 3, 6, 9),
 *   reperage_des_faiblesses, detection_des_menaces ; total au plus R ;
 * - Nomade : garage, liste de [type (vehicule, amelioration), code] ; autant de choix que le rang (décision du 2026-11-06), de rang R au plus.
 */
class CprCreationRegles
{
    public const POINTS_DE_CARAC = 62;
    public const POINTS_DE_COMPETENCES = 86;
    public const BUDGET_FORMULE_COMPLETE = 2550;
    public const BUDGET_VETEMENTS = 800;
    public const ARGENT_DE_POCHE = 500;
    public const RANG_DE_DEPART = 4;
    public const LANGUE_D_ORIGINE = 4;

    public const MEDICAMENTS = ['antibiotique', 'rapidoc', 'rapidetox', 'stim', 'supercafeine'];
    private const SPECIALITES_DU_TECHIE = ['expert_terrain', 'expert_amelioration', 'expert_fabrication', 'expert_invention'];
    private const CAPACITES_DU_SOLO = [
        'deflexion' => [0, 2, 4, 6, 8, 10], 'correction' => [0, 4], 'attaque_de_precision' => [0, 3, 6, 9],
        'reaction_d_initiative' => null, 'reperage_des_faiblesses' => null, 'detection_des_menaces' => null,
    ];

    /** Prix d'une arme selon sa qualité, à partir de son prix en qualité ordinaire (p. 342). */
    private const QUALITE = [50 => [20, 100], 100 => [50, 500], 500 => [100, 1000]];

    private array $erreurs = [];

    /** @return array<string, string> les erreurs, par champ ; vide si la fiche respecte les règles. */
    public function verifier(array $fiche, bool $activation): array
    {
        $this->erreurs = [];
        $role = CprRole::with(['competences', 'profils', 'dotations'])->find($fiche['role_id'] ?? null);
        if (!$role) {
            return ['role_id' => 'Un personnage en création a un rôle.'];
        }

        $this->verifierLeRole($fiche, $role, $activation);
        match ($fiche['methode']) {
            'rat_des_rues' => $this->ratDesRues($fiche, $role, $activation),
            'edgerunner' => $this->edgerunner($fiche, $role, $activation),
            'formule_complete' => $this->formuleComplete($fiche, $activation),
        };
        $this->verifierLesImplants($fiche, $activation);

        return $this->erreurs;
    }

    // ----- Rôle et capacité de rôle -----

    private function verifierLeRole(array $fiche, CprRole $role, bool $activation): void
    {
        $lignes = collect($fiche['roles'] ?? []);
        $ligne = $lignes->firstWhere('role_id', $role->id);
        if ($lignes->count() > 1 || ($lignes->isNotEmpty() && !$ligne)) {
            $this->erreur('roles', 'Un personnage commence avec un seul rôle : celui de la fiche.');
            return;
        }
        if (!$ligne) {
            if ($activation) {
                $this->erreur('roles', "La capacité de rôle ({$role->capacite}) commence au rang " . self::RANG_DE_DEPART . '.');
            }
            return;
        }
        if ((int) $ligne['rang'] !== self::RANG_DE_DEPART) {
            $this->erreur('roles.0.rang', "La capacité de rôle commence au rang " . self::RANG_DE_DEPART . '.');
        }
        $this->verifierLesDetails($role->code, (int) $ligne['rang'], $ligne['details'] ?? [], $activation);
    }

    private function verifierLesDetails(string $role, int $rang, array $details, bool $activation): void
    {
        $champ = 'roles.0.details';
        if ($role === 'techie') {
            $points = array_map(fn ($cle) => (int) ($details[$cle] ?? 0), self::SPECIALITES_DU_TECHIE);
            if (max($points) > $rang) {
                $this->erreur($champ, "Une spécialité de Bricoleur ne dépasse pas le rang ({$rang}).");
            }
            $this->comparer($champ, array_sum($points), 2 * $rang, $activation, 'rangs de spécialité de Bricoleur');
        } elseif ($role === 'medtech') {
            $medicaments = (int) ($details['medicaments'] ?? 0);
            $cryo = (int) ($details['cryosystemes'] ?? 0);
            if ($medicaments > 5 || $cryo > 5) {
                $this->erreur($champ, 'Médicaments et Maintenance des cryosystèmes vont jusqu’à 5 points chacun.');
            }
            $this->comparer($champ, $medicaments + $cryo + (int) ($details['chirurgie'] ?? 0), $rang, $activation, 'points de spécialité de Médecine');
            $choisis = $details['medicaments_choisis'] ?? [];
            if (array_diff($choisis, self::MEDICAMENTS) || count($choisis) !== count(array_unique($choisis)) || count($choisis) > $medicaments
                || ($activation && count($choisis) !== $medicaments)) {
                $this->erreur($champ, 'Un médicament différent (antibiotique, rapidoc, rapidétox, stim, supercaféine) par point de Médicaments.');
            }
        } elseif ($role === 'solo') {
            $total = 0;
            foreach (self::CAPACITES_DU_SOLO as $capacite => $valeurs) {
                $points = (int) ($details[$capacite] ?? 0);
                if ($points < 0 || ($valeurs !== null && !in_array($points, $valeurs, true))) {
                    $this->erreur($champ, "Conscience tactique : « {$capacite} » ne peut pas valoir {$points}.");
                }
                $total += $points;
            }
            if ($total > $rang) {
                $this->erreur($champ, "Conscience tactique : {$total} points répartis pour un rang de {$rang}.");
            }
        } elseif ($role === 'nomade') {
            $garage = $details['garage'] ?? [];
            $this->comparer($champ, count($garage), $rang, $activation, 'choix de garage familial');
            foreach ($garage as [$type, $code]) {
                $rangRequis = $type === 'vehicule'
                    ? CprVehicule::whereNull('user_id')->where('code', $code)->value('rang_nomade')
                    : CprAmeliorationVehicule::where('code', $code)->value('rang_requis');
                if ($rangRequis === null || $rangRequis > $rang) {
                    $this->erreur($champ, "Garage familial : « {$code} » n’est pas accessible au rang {$rang} de Moto.");
                }
            }
        }
    }

    // ----- Méthodes -----

    private function ratDesRues(array $fiche, CprRole $role, bool $activation): void
    {
        $profil = $role->profils->firstWhere('jet', (int) ($fiche['profil_jet'] ?? 0));
        if (!$profil) {
            $this->erreur('profil_jet', 'Le Rat des Rues recopie une ligne de la table de CARAC de son rôle (1 à 10).');
        } else {
            foreach (CprPersonnage::CARACS as $carac) {
                if ((int) ($fiche[$carac] ?? 0) !== $profil->$carac) {
                    $this->erreur($carac, "Le Rat des Rues garde la ligne {$profil->jet} telle quelle ({$carac} : {$profil->$carac}).");
                }
            }
        }

        $attendu = $role->competences->mapWithKeys(fn ($ligne) => [$ligne->competence_id => $ligne->niveau_rat_des_rues]);
        $niveaux = $this->niveauxHorsLangueDOrigine($fiche, $activation);
        foreach ($niveaux as $cle => $niveau) {
            $id = $this->idDe((string) $cle);
            if ($id === null || ($attendu[$id] ?? null) !== $niveau) {
                $this->erreur('competences', 'Le Rat des Rues a exactement les compétences de son rôle, à leur niveau.');
                break;
            }
        }
        if ($activation && collect(array_keys($niveaux))->map(fn ($cle) => $this->idDe((string) $cle))->filter()->unique()->count() !== $attendu->count()) {
            $this->erreur('competences', 'Le Rat des Rues a les 20 compétences de son rôle.');
        }
        $this->verifierLaDotation($fiche, $role, $activation);
    }

    private function edgerunner(array $fiche, CprRole $role, bool $activation): void
    {
        foreach (CprPersonnage::CARACS as $carac) {
            $valeurs = $role->profils->pluck($carac)->unique()->all();
            if (!in_array((int) ($fiche[$carac] ?? 0), $valeurs, true)) {
                $this->erreur($carac, "L’Edgerunner tire chaque CARAC dans la colonne de son rôle ({$carac} : " . implode(', ', $valeurs) . ').');
            }
        }

        $duRole = $role->competences->pluck('competence_id')->all();
        $niveaux = $this->niveauxHorsLangueDOrigine($fiche, $activation);
        foreach ($niveaux as $cle => $niveau) {
            if (!in_array($this->idDe((string) $cle), $duRole, true)) {
                $this->erreur('competences', 'L’Edgerunner ne prend que les 20 compétences de son rôle (et sa langue d’origine).');
            } elseif ($niveau < 2 || $niveau > 6) {
                $this->erreur('competences', 'Chaque compétence de l’Edgerunner est entre 2 et 6.');
            }
        }
        $presentes = collect(array_keys($niveaux))->map(fn ($cle) => $this->idDe((string) $cle))->filter()->unique()->all();
        if ($activation && count(array_intersect($presentes, $duRole)) !== count($duRole)) {
            $this->erreur('competences', 'L’Edgerunner a les 20 compétences de son rôle, au niveau 2 au moins.');
        }
        $this->comparer('competences', $this->cout($niveaux), self::POINTS_DE_COMPETENCES, $activation, 'points de compétences');
        $this->verifierLaDotation($fiche, $role, $activation);
    }

    private function formuleComplete(array $fiche, bool $activation): void
    {
        $total = 0;
        foreach (CprPersonnage::CARACS as $carac) {
            $valeur = (int) ($fiche[$carac] ?? 0);
            $total += $valeur;
            if ($valeur < 2 || $valeur > 8) {
                $this->erreur($carac, 'Avec la Formule complète, chaque CARAC est entre 2 et 8.');
            }
        }
        $this->comparer('caracs', $total, self::POINTS_DE_CARAC, $activation, 'points de CARAC');

        $niveaux = $this->niveauxHorsLangueDOrigine($fiche, $activation);
        foreach ($niveaux as $niveau) {
            if ($niveau > 6) {
                $this->erreur('competences', 'Aucune compétence au-dessus de 6 à la création.');
                break;
            }
        }
        $this->comparer('competences', $this->cout($niveaux), self::POINTS_DE_COMPETENCES, $activation, 'points de compétences');

        [$achats, $vetements] = $this->achats($this->inventaire($fiche));
        $depense = $achats + max(0, $vetements - self::BUDGET_VETEMENTS);
        if ($depense > self::BUDGET_FORMULE_COMPLETE) {
            $this->erreur('eddies', "Achats : {$depense} ED pour " . self::BUDGET_FORMULE_COMPLETE . ' (plus ' . self::BUDGET_VETEMENTS . ' ED de vêtements et de cyberfashion).');
        }
    }

    /**
     * Les compétences de la fiche (niveau par compétence), sans la langue d'origine, gratuite au niveau 4. Vérifie aussi ce qui vaut pour
     * toutes les méthodes : compétences de base à 2 au moins, pas de compétence réservée à un rôle, une seule ligne par compétence et précision.
     */
    private function niveauxHorsLangueDOrigine(array $fiche, bool $activation): array
    {
        $catalogue = CprCompetence::all()->keyBy('id');
        $langue = $catalogue->firstWhere('code', 'langue');
        $niveaux = [];
        $origineVue = false;
        $vues = [];
        foreach ($fiche['competences'] ?? [] as $ligne) {
            $competence = $catalogue[$ligne['competence_id']];
            $precision = $ligne['precision'] ?? null;
            $cle = $competence->id . '|' . $precision;
            if (isset($vues[$cle])) {
                $this->erreur('competences', "« {$competence->nom} » apparaît deux fois.");
            }
            $vues[$cle] = true;
            if ($competence->reservee_role_id) {
                $this->erreur('competences', "« {$competence->nom} » vient de la capacité de rôle, elle ne s’achète pas.");
                continue;
            }
            $niveau = (int) $ligne['niveau'];
            if ($competence->id === $langue->id && $precision !== $langue->precision_de_base) {
                if (!$origineVue && $niveau >= self::LANGUE_D_ORIGINE) {
                    $origineVue = true;
                    $niveau -= self::LANGUE_D_ORIGINE;
                    if ($niveau === 0) {
                        continue;
                    }
                }
            }
            $cle = $this->cleDeCompetence($competence, $precision);
            $niveaux[$cle] = ($niveaux[$cle] ?? 0) + $niveau;
        }
        foreach ($catalogue->where('de_base', true) as $base) {
            if (($niveaux[$base->id] ?? 0) < 2 && ($activation || isset($niveaux[$base->id]))) {
                $precision = $base->precision_de_base ? " ({$base->precision_de_base})" : '';
                $this->erreur('competences', "« {$base->nom}{$precision} » est une compétence de base : niveau 2 au moins.");
            }
        }
        if ($activation && !$origineVue) {
            $this->erreur('competences', 'La langue d’origine (une Langue autre que l’argot) est au niveau ' . self::LANGUE_D_ORIGINE . '.');
        }
        return $niveaux;
    }

    /**
     * La clé d'une compétence dans le décompte : son id ; « id:précision » pour une compétence à spécialité (chaque science, chaque forme
     * d'art martial compte à part) ; « autre:id:précision » pour une Langue ou un Guide local autres que ceux de la compétence de base,
     * qui ne comptent jamais comme elle.
     */
    private function cleDeCompetence(CprCompetence $competence, ?string $precision): string
    {
        if ($competence->de_base && $competence->precision_de_base !== null) {
            return $precision === $competence->precision_de_base ? (string) $competence->id : "autre:{$competence->id}:{$precision}";
        }
        return $competence->specialite ? "{$competence->id}:{$precision}" : (string) $competence->id;
    }

    /** La compétence du rôle que désigne une clé du décompte ; null pour une Langue ou un Guide local « autre ». */
    private function idDe(string $cle): ?int
    {
        return str_starts_with($cle, 'autre:') ? null : (int) explode(':', $cle)[0];
    }

    /** Coût en points : un par niveau, deux pour les compétences (x2). */
    private function cout(array $niveaux): int
    {
        $couts = CprCompetence::pluck('cout', 'id');
        $total = 0;
        foreach ($niveaux as $cle => $niveau) {
            $id = $this->idDe((string) $cle) ?? (int) explode(':', (string) $cle)[1];
            $total += $niveau * (int) $couts[$id];
        }
        return $total;
    }

    // ----- Équipement -----

    /**
     * Rat des Rues et Edgerunner : une alternative de chaque groupe de dotation (à l'activation) ; ce qui dépasse la dotation est un achat,
     * dans les 500 ED de départ.
     */
    private function verifierLaDotation(array $fiche, CprRole $role, bool $activation): void
    {
        $inventaire = $this->inventaire($fiche);
        foreach ($role->dotations->where('objet_type', '!=', 'garage_familial')->groupBy('groupe') as $alternatives) {
            $choisie = $alternatives->first(function ($dotation) use ($inventaire) {
                return ($inventaire[$this->cle($dotation->objet_type, $dotation->objet_id, $this->precisionDeDotation($dotation))]['quantite'] ?? 0) >= $dotation->quantite;
            });
            if ($choisie) {
                $cle = $this->cle($choisie->objet_type, $choisie->objet_id, $this->precisionDeDotation($choisie));
                $inventaire[$cle]['quantite'] -= $choisie->quantite;
            } elseif ($activation) {
                $this->erreur('dotation', 'Il manque un objet de la dotation du rôle (groupe ' . $alternatives->first()->groupe . ').');
            }
        }
        [$achats, $vetements] = $this->achats($inventaire);
        if ($achats + $vetements > self::ARGENT_DE_POCHE) {
            $this->erreur('eddies', 'Au-delà de la dotation du rôle : ' . ($achats + $vetements) . ' ED d’achats pour ' . self::ARGENT_DE_POCHE . ' ED de départ.');
        }
    }

    /** Une armure se donne pour une localisation, une munition pour un type ; le reste sans précision. */
    private function precisionDeDotation($dotation): ?string
    {
        return in_array($dotation->objet_type, ['armure', 'munition'], true) ? $dotation->precision : null;
    }

    /**
     * Ce que porte la fiche, par objet : [type, id, précision, quantité, prix unitaire du supplément]. Une arme d'une autre qualité que
     * l'ordinaire ou munie d'accessoires compte en plus la différence de prix.
     */
    private function inventaire(array $fiche): array
    {
        $inventaire = [];
        $ajouter = function (string $type, int $id, ?string $precision, int $quantite, int $supplement = 0) use (&$inventaire) {
            $cle = $this->cle($type, $id, $precision);
            $inventaire[$cle] ??= ['type' => $type, 'id' => $id, 'precision' => $precision, 'quantite' => 0, 'supplement' => 0];
            $inventaire[$cle]['quantite'] += $quantite;
            $inventaire[$cle]['supplement'] += $supplement;
        };
        $accessoires = CprAccessoire::pluck('prix', 'code');
        foreach ($fiche['armes'] ?? [] as $arme) {
            $prix = (int) CprArme::whereKey($arme['arme_id'])->value('prix');
            $qualite = $arme['qualite'] ?? 'ordinaire';
            $supplement = $qualite === 'ordinaire' ? 0 : ($this->prixSelonLaQualite($prix, $qualite) - $prix);
            foreach ($arme['accessoires'] ?? [] as $code) {
                $supplement += (int) ($accessoires[$code] ?? 0);
            }
            $ajouter('arme', (int) $arme['arme_id'], null, 1, $supplement);
        }
        foreach ($fiche['armures'] ?? [] as $armure) {
            $ajouter('armure', (int) $armure['armure_id'], $armure['localisation'] ?? null, 1);
        }
        foreach ($fiche['cyber'] ?? [] as $implant) {
            $ajouter('cyber', (int) $implant['cyber_id'], null, 1);
        }
        foreach ($fiche['objets'] ?? [] as $objet) {
            $precision = $objet['objet_type'] === 'munition' ? ($objet['precision'] ?? null) : null;
            $ajouter($objet['objet_type'], (int) $objet['objet_id'], $precision, (int) ($objet['quantite'] ?? 1));
        }
        return $inventaire;
    }

    /** @return array{0: int, 1: int} le prix des objets restants : achats ordinaires, puis vêtements et cyberfashion. */
    private function achats(array $inventaire): array
    {
        $achats = 0;
        $vetements = 0;
        foreach ($inventaire as $objet) {
            $achats += $objet['supplement'];
            if ($objet['quantite'] <= 0) {
                continue;
            }
            $prix = $this->prix($objet['type'], $objet['id'], $objet['precision'], $objet['quantite']);
            $habillement = $objet['type'] === 'vetement'
                || ($objet['type'] === 'cyber' && CprCyber::whereKey($objet['id'])->value('categorie') === 'cyberfashion');
            $habillement ? $vetements += $prix : $achats += $prix;
        }
        return [$achats, $vetements];
    }

    private function prix(string $type, int $id, ?string $precision, int $quantite): int
    {
        $table = [
            'arme' => 'cpr_arme', 'armure' => 'cpr_armure', 'cyber' => 'cpr_cyber', 'munition' => 'cpr_munition', 'equipement' => 'cpr_equipement',
            'vetement' => 'cpr_vetement', 'programme' => 'cpr_programme', 'materiel_net' => 'cpr_materiel_net', 'vehicule' => 'cpr_vehicule',
        ][$type] ?? null;
        if ($table === null) {
            return 0; // amélioration de véhicule : seulement par le garage du Nomade
        }
        $unitaire = (int) DB::table($table)->where('id', $id)->value('prix');
        if ($type === 'munition' && !in_array($precision, ['grenade', 'roquette'], true)) {
            return $unitaire * (int) ceil($quantite / 10); // par paquet de 10
        }
        return $unitaire * $quantite;
    }

    private function prixSelonLaQualite(int $prix, string $qualite): int
    {
        if (!isset(self::QUALITE[$prix])) {
            return $prix;
        }
        return $qualite === 'mauvaise' ? self::QUALITE[$prix][0] : self::QUALITE[$prix][1];
    }

    private function cle(string $type, int $id, ?string $precision): string
    {
        return "{$type}|{$id}|{$precision}";
    }

    // ----- Implants -----

    /** À la création, chaque implant coûte sa PH fixe ; l'Humanité de départ est EMP × 10 moins ces PH. */
    private function verifierLesImplants(array $fiche, bool $activation): void
    {
        $phFixes = CprCyber::pluck('ph_fixe', 'id');
        $total = 0;
        foreach ($fiche['cyber'] ?? [] as $index => $implant) {
            $fixe = (int) $phFixes[$implant['cyber_id']];
            $total += $fixe;
            if ((int) ($implant['ph'] ?? 0) !== $fixe) {
                $this->erreur("cyber.{$index}.ph", "À la création, un implant coûte sa perte d’Humanité fixe ({$fixe}).");
            }
        }
        $depart = (int) ($fiche['emp'] ?? 0) * 10 - $total;
        if (isset($fiche['humanite']) && (int) $fiche['humanite'] !== $depart) {
            $this->erreur('humanite', "L’Humanité de départ est EMP × 10 moins la perte des implants : {$depart}.");
        }
    }

    // ----- Outils -----

    /** En brouillon, `$valeur` ne dépasse pas `$attendu` ; à l'activation, elle l'atteint exactement. */
    private function comparer(string $champ, int $valeur, int $attendu, bool $activation, string $quoi): void
    {
        if ($valeur > $attendu) {
            $this->erreur($champ, "{$valeur} {$quoi} pour {$attendu}.");
        } elseif ($activation && $valeur < $attendu) {
            $this->erreur($champ, "{$valeur} {$quoi} sur {$attendu} : tout doit être réparti.");
        }
    }

    private function erreur(string $champ, string $message): void
    {
        $this->erreurs[$champ] ??= $message;
    }
}
