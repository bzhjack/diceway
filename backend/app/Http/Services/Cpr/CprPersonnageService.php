<?php

namespace App\Http\Services\Cpr;

use App\Models\Cpr\CprPersonnage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Les fiches de personnage : lecture, et enregistrement de la fiche entière (ses lignes sont remplacées dans une transaction). */
class CprPersonnageService
{
    /** Le catalogue de chaque type d'objet ; seules ses lignes du livre et celles du compte sont utilisables. */
    private const CATALOGUES = [
        'equipement' => 'cpr_equipement',
        'programme' => 'cpr_programme',
        'munition' => 'cpr_munition',
        'vetement' => 'cpr_vetement',
        'materiel_net' => 'cpr_materiel_net',
        'vehicule' => 'cpr_vehicule',
        'amelioration_vehicule' => 'cpr_amelioration_vehicule',
    ];

    /** Les catalogues sans propriétaire possible : leurs lignes sont toutes celles du livre. */
    private const SANS_COMPTE = ['cpr_vetement', 'cpr_amelioration_vehicule'];

    public function list(string $userId): Collection
    {
        return CprPersonnage::where('user_id', $userId)->with('role')->orderBy('pseudo')->get();
    }

    public function find(string $id): ?CprPersonnage
    {
        return CprPersonnage::with(CprPersonnage::RELATIONS)->find($id);
    }

    /** Crée la fiche (sans `$personnage`) ou la remplace ; le compte ne vient jamais de la requête. */
    public function save(array $donnees, string $userId, ?CprPersonnage $personnage = null): CprPersonnage
    {
        $this->verifierLesReferences($donnees, $userId);

        return DB::transaction(function () use ($donnees, $userId, $personnage) {
            $personnage ??= new CprPersonnage();
            $personnage->fill($donnees);
            if (!$personnage->exists) {
                $personnage->user_id = $userId;
            }
            $personnage->save();

            foreach (['roles', 'competences', 'armes', 'armures', 'objets'] as $relation) {
                if (array_key_exists($relation, $donnees)) {
                    $personnage->$relation()->delete();
                    $personnage->$relation()->createMany($donnees[$relation]);
                }
            }
            if (array_key_exists('cyber', $donnees)) {
                $this->remplacerLesImplants($personnage, $donnees['cyber']);
            }

            return $this->find($personnage->id);
        });
    }

    public function delete(CprPersonnage $personnage): void
    {
        $personnage->delete();
    }

    /** Les implants citent leur pièce mère par la clé qu'ils ont dans le document : on les crée, puis on relie les identifiants. */
    private function remplacerLesImplants(CprPersonnage $personnage, array $implants): void
    {
        $personnage->cyber()->whereNotNull('parent_id')->delete();
        $personnage->cyber()->delete();
        $ids = [];
        foreach ($implants as $implant) {
            $ligne = $personnage->cyber()->create([
                'cyber_id' => $implant['cyber_id'],
                'cote' => $implant['cote'] ?? null,
                'precision' => $implant['precision'] ?? null,
                'ph' => $implant['ph'] ?? 0,
            ]);
            $ids[$implant['cle']] = $ligne->id;
        }
        foreach ($implants as $implant) {
            if (!empty($implant['parent'])) {
                $personnage->cyber()->whereKey($ids[$implant['cle']])->update(['parent_id' => $ids[$implant['parent']]]);
            }
        }
    }

    /** Un objet du catalogue n'est utilisable que s'il est du livre ou du compte ; un objet cité doit exister dans son catalogue. */
    private function verifierLesReferences(array $donnees, string $userId): void
    {
        $erreurs = [];
        foreach (['armes' => ['cpr_arme', 'arme_id'], 'armures' => ['cpr_armure', 'armure_id'], 'cyber' => ['cpr_cyber', 'cyber_id']] as $relation => [$table, $cle]) {
            foreach ($donnees[$relation] ?? [] as $index => $ligne) {
                if (!$this->utilisable($table, (int) $ligne[$cle], $userId)) {
                    $erreurs["{$relation}.{$index}.{$cle}"] = 'Cet objet n’est pas dans votre catalogue.';
                }
            }
        }
        foreach ($donnees['objets'] ?? [] as $index => $objet) {
            if (!$this->utilisable(self::CATALOGUES[$objet['objet_type']], (int) $objet['objet_id'], $userId)) {
                $erreurs["objets.{$index}.objet_id"] = 'Cet objet n’est pas dans votre catalogue.';
            }
        }
        if ($erreurs) {
            throw ValidationException::withMessages($erreurs);
        }
    }

    private function utilisable(string $table, int $id, string $userId): bool
    {
        $requete = DB::table($table)->where('id', $id);
        if (!in_array($table, self::SANS_COMPTE, true)) {
            $requete->where(fn ($accessible) => $accessible->whereNull('user_id')->orWhere('user_id', $userId));
        }
        return $requete->exists();
    }
}
