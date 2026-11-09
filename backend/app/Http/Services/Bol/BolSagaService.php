<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolSaga;

/** Les scénarios d'un compte (`BolSaga`) : celui d'un chapitre se retrouve par son nom, sans tenir compte de la casse, ou se crée. */
class BolSagaService
{
    /**
     * Les champs d'un chapitre d'après son titre d'un seul tenant (« Perle du Beshaar — 1. Sacrilège à Satarla ») : son nom, son numéro et
     * son scénario, retrouvé ou créé pour le compte. Sans tiret cadratin, le chapitre est seul dans un scénario de son nom.
     *
     * @return array{titre: string, numero: ?int, saga_id: ?string}
     */
    public function champsDuChapitre(string $userId, string $titreComplet): array
    {
        ['saga' => $saga, 'numero' => $numero, 'titre' => $titre] = BolTitreChapitre::decouper($titreComplet);

        return ['titre' => $titre, 'numero' => $numero, 'saga_id' => $this->retrouverOuCreer($userId, $saga ?? $titre)->id];
    }

    /** Les scénarios du compte, par nom : ceux qui n'ont pas encore de chapitre compris. */
    public function duCompte(string $userId)
    {
        return BolSaga::where('user_id', $userId)->orderBy('titre')->get(['id', 'titre']);
    }

    /** Un nouveau scénario du compte, sans chapitre ; `false` : le compte a déjà un scénario de ce nom. */
    public function creer(string $userId, string $titre): BolSaga|false
    {
        if ($this->homonyme($userId, $titre)) {
            return false;
        }

        return BolSaga::create(['user_id' => $userId, 'titre' => $titre]);
    }

    /**
     * Renomme un scénario du compte. `null` : ce n'en est pas un ; `false` : le compte a déjà un scénario de ce nom (les chapitres le
     * retrouvent par son nom, deux homonymes se confondraient).
     */
    public function renommer(string $id, string $userId, string $titre): BolSaga|false|null
    {
        $saga = BolSaga::where('id', $id)->where('user_id', $userId)->first();
        if (!$saga) {
            return null;
        }
        if ($this->homonyme($userId, $titre, $id)) {
            return false;
        }
        $saga->update(['titre' => $titre]);

        return $saga;
    }

    /** Le compte a déjà un scénario de ce nom (sans tenir compte de la casse), autre que `$saufId`. */
    private function homonyme(string $userId, string $titre, ?string $saufId = null): bool
    {
        return BolSaga::where('user_id', $userId)
            ->when($saufId !== null, fn ($query) => $query->where('id', '!=', $saufId))
            ->whereRaw('lower(titre) = ?', [mb_strtolower($titre)])
            ->exists();
    }

    public function retrouverOuCreer(string $userId, string $titre): BolSaga
    {
        return BolSaga::where('user_id', $userId)->whereRaw('lower(titre) = ?', [mb_strtolower($titre)])->first()
            ?? BolSaga::create(['user_id' => $userId, 'titre' => $titre]);
    }
}
