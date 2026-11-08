<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolImportRef;
use Illuminate\Database\Eloquent\Collection as Fiches;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Les scénarios d'une fiche (créature, PNJ, démon) pour un compte : ceux dont l'import l'a créée, ou l'a reprise du catalogue. Une
 * référence d'import ne porte que le nom de fichier de sa saga (`dieu-voile`) : le scénario se retrouve par les chapitres que ce même
 * import a créés, puis leur saga ; un chapitre hors saga (one shot) est son propre scénario.
 */
class BolScenariosDesFiches
{
    /** Pose sur chaque fiche de la liste ses scénarios pour ce compte (`scenarios`, vide sans scénario). */
    public function poser(string $kind, Fiches $fiches, ?string $userId): void
    {
        $scenarios = $this->pour($kind, $fiches->pluck('id'), $userId);
        foreach ($fiches as $fiche) {
            $fiche->setRelation('scenarios', collect($scenarios[(string) $fiche->id] ?? []));
        }
    }

    /**
     * @param iterable<string|int> $ids les fiches
     * @return array<string, list<array{id: string, titre: string, one_shot: bool}>> par id de fiche, triés par titre ; une fiche sans
     *     scénario n'y est pas
     */
    public function pour(string $kind, iterable $ids, ?string $userId): array
    {
        $ids = collect($ids)->map(fn ($id) => (string) $id)->values();
        if ($userId === null || $ids->isEmpty()) {
            return [];
        }

        $refs = BolImportRef::where('user_id', $userId)->where('entity_kind', $kind)->whereIn('entity_id', $ids)->get(['saga', 'entity_id']);
        if ($refs->isEmpty()) {
            return [];
        }

        $scenarioParImport = DB::table('bol_import_ref as r')
            ->join('bol_scenario as s', 's.id', '=', 'r.entity_id')
            ->leftJoin('bol_saga as g', 'g.id', '=', 's.saga_id')
            ->where('r.user_id', $userId)
            ->where('r.entity_kind', BolImportRef::TYPE_SCENARIO)
            ->whereIn('r.saga', $refs->pluck('saga')->unique()->values())
            ->get(['r.saga as import', 'g.id as saga_id', 'g.titre as saga_titre', 's.id as chapitre_id', 's.titre as chapitre_titre'])
            ->groupBy('import')
            ->map(function (Collection $chapitres): array {
                $chapitre = $chapitres->first();

                return $chapitre->saga_id !== null
                    ? ['id' => (string) $chapitre->saga_id, 'titre' => $chapitre->saga_titre, 'one_shot' => false]
                    : ['id' => (string) $chapitre->chapitre_id, 'titre' => $chapitre->chapitre_titre, 'one_shot' => true];
            });

        return $refs->groupBy('entity_id')
            ->map(fn (Collection $refsDeLaFiche) => $refsDeLaFiche->pluck('saga')->unique()
                ->map(fn (string $import) => $scenarioParImport->get($import))
                ->filter()
                ->unique('id')
                ->sortBy('titre', SORT_NATURAL | SORT_FLAG_CASE)
                ->values()
                ->all())
            ->filter()
            ->all();
    }
}
