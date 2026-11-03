<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolSaga;

/** Les scénarios d'un compte (`BolSaga`) : celui d'un chapitre se retrouve par son nom, sans tenir compte de la casse, ou se crée. */
class BolSagaService
{
    /**
     * Les champs d'un chapitre d'après son titre d'un seul tenant (« Perle du Beshaar — 1. Sacrilège à Satarla ») : son nom, son numéro et
     * son scénario, retrouvé ou créé pour le compte. Sans tiret cadratin, un one shot.
     *
     * @return array{titre: string, numero: ?int, saga_id: ?string}
     */
    public function champsDuChapitre(string $userId, string $titreComplet): array
    {
        ['saga' => $saga, 'numero' => $numero, 'titre' => $titre] = BolTitreChapitre::decouper($titreComplet);

        return ['titre' => $titre, 'numero' => $numero, 'saga_id' => $saga === null ? null : $this->retrouverOuCreer($userId, $saga)->id];
    }

    public function retrouverOuCreer(string $userId, string $titre): BolSaga
    {
        return BolSaga::where('user_id', $userId)->whereRaw('lower(titre) = ?', [mb_strtolower($titre)])->first()
            ?? BolSaga::create(['user_id' => $userId, 'titre' => $titre]);
    }
}
