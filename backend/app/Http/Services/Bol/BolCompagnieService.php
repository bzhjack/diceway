<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolCompagnie;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolHeros;
use Illuminate\Support\Facades\DB;

/** Les compagnies d'un compte. La modifier vaut pour ses prochaines parties : celles déjà commencées gardent leurs héros, et suivent son nom. */
class BolCompagnieService
{
    /** @return array<int, array{id: string, nom: string, heros: array<int, array{id: string, nom: string, avatar: ?string}>, parties: int}> */
    public function liste(string $userId): array
    {
        return BolCompagnie::where('user_id', $userId)
            ->with('heros:bol_heros.id,nom,avatar')
            ->withCount('parties')
            ->orderBy('nom')
            ->get()
            ->map(fn (BolCompagnie $compagnie) => $this->resume($compagnie))
            ->all();
    }

    public function trouver(string $id, string $userId): ?BolCompagnie
    {
        return BolCompagnie::where('id', $id)->where('user_id', $userId)->first();
    }

    /**
     * @param array<int, mixed> $herosIds
     * @return array<string, mixed>|null null si aucun de ces héros n'est du compte
     */
    public function creer(string $userId, string $nom, array $herosIds): ?array
    {
        $heros = $this->herosDuCompte($userId, $herosIds);
        if ($heros === []) {
            return null;
        }

        return DB::transaction(function () use ($userId, $nom, $heros) {
            $compagnie = BolCompagnie::create(['user_id' => $userId, 'nom' => $nom]);
            $compagnie->heros()->attach($heros);

            return $this->resume($compagnie->loadCount('parties'));
        });
    }

    /**
     * @param array<int, mixed> $herosIds
     * @return array<string, mixed>|null null si aucun de ces héros n'est du compte
     */
    public function modifier(BolCompagnie $compagnie, string $nom, array $herosIds): ?array
    {
        $heros = $this->herosDuCompte($compagnie->user_id, $herosIds);
        if ($heros === []) {
            return null;
        }

        return DB::transaction(function () use ($compagnie, $nom, $heros) {
            $compagnie->update(['nom' => $nom]);
            // Détacher puis attacher, et non `sync` : l'ordre de la liste est celui des lignes.
            $compagnie->heros()->detach();
            $compagnie->heros()->attach($heros);
            BolFightSession::where('compagnie_id', $compagnie->id)->update(['titre' => $nom]);

            return $this->resume($compagnie->fresh()->loadCount('parties'));
        });
    }

    /** Supprime la compagnie, sauf si elle a encore des parties : ses parties passent avant. */
    public function supprimer(BolCompagnie $compagnie): bool
    {
        return DB::transaction(function () use ($compagnie) {
            // Le même verrou que la création d'une partie : elle ne peut pas arriver entre ce contrôle et la suppression.
            BolCompagnie::whereKey($compagnie->id)->lockForUpdate()->first();
            if ($compagnie->parties()->exists()) {
                return false;
            }
            $compagnie->delete();

            return true;
        });
    }

    /** @return array{id: string, nom: string, heros: array<int, array{id: string, nom: string, avatar: ?string}>, parties: int} */
    private function resume(BolCompagnie $compagnie): array
    {
        return [
            'id'      => $compagnie->id,
            'nom'     => $compagnie->nom,
            'heros'   => $compagnie->heros->map(fn (BolHeros $heros) => ['id' => $heros->id, 'nom' => $heros->nom, 'avatar' => $heros->avatar])->values()->all(),
            'parties' => (int) $compagnie->parties_count,
        ];
    }

    /**
     * Les héros du compte parmi ces ids, dans l'ordre demandé et sans doublon : ni PNJ, ni héros d'un autre compte.
     *
     * @param array<int, mixed> $herosIds
     * @return array<int, string>
     */
    private function herosDuCompte(string $userId, array $herosIds): array
    {
        $ids = array_values(array_unique(array_filter($herosIds, 'is_string')));
        $valables = BolHeros::where('user_id', $userId)->where('type', 'H')->whereIn('id', $ids)->pluck('id')->all();

        return array_values(array_intersect($ids, $valables));
    }
}
