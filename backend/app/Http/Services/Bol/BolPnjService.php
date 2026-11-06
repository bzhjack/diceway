<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosLangue;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/** Les PNJ, des fiches de héros dont le `type` n'est pas `H`. */
class BolPnjService
{
    public function getPnjsWithRelations()
    {
        return BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue')
            ->where('type', '!=', 'H')
            ->where(function ($query) {
                $query->where('user_id', Auth::id())
                    ->orWhereNull('user_id');
            })
            ->orderBy('user_id', 'desc')
            ->orderBy('nom')
            ->get();
    }

    public function getPnjWithRelations(string $id): ?BolHeros
    {
        return BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue', 'region')
            ->where('type', '!=', 'H')
            ->where(function ($query) {
                $query->where('user_id', Auth::id())
                    ->orWhereNull('user_id');
            })
            ->where('id', $id)->first();
    }

    public function find(string $id): ?BolHeros
    {
        return BolHeros::find($id);
    }

    public function create(array $input): ?BolHeros
    {
        $input['user_id'] = Auth::id();
        $input['active'] = true;
        $pnj = BolHeros::create($input);
        $armes = BolAccessibleEquipment::keep(BolArme::class, $input['armes'], fn ($item) => $item['id']);
        foreach ($armes as $arme) {
            // Un PNJ porte tout ce qu'il possède : ses armes sont en main, ses armures sur le dos, quoi qu'envoie le client.
            BolHerosArme::create(['heros_id' => $pnj['id'], 'arme_id' => $arme['id'], 'equipee' => true]);
        }
        $armures = BolAccessibleEquipment::keep(BolArmure::class, $input['armures'], fn ($item) => $item['id']);
        foreach ($armures as $armure) {
            BolHerosArmure::create([
                'heros_id' => $pnj['id'],
                'armure_id' => $armure['id'],
                'equipee' => true,
            ]);
        }
        foreach ($input['carrieres'] as $carriere) {
            BolHerosCarriere::create(['heros_id' => $pnj['id'], 'carriere_id' => $carriere['id'], 'value' => $carriere['value']]);
        }

        foreach ($input['traits'] as $trait) {
            BolHerosTrait::create([
                'heros_id' => $pnj['id'],
                'traitable_id' => $trait['id'],
                'type' => $trait['type'],
                'traitable_type' => $trait['type'] == 'A' ? BolAvantage::class : BolDesavantage::class,
                'detail' => $trait['detail'] ?? null,
            ]);
        }

        $langues = $input['langues'] ?? null;
        if ($langues && is_array($langues)) {
            foreach ($langues as $item) {
                BolHerosLangue::updateOrCreate(['heros_id' => $pnj['id'], 'langue_id' => $item['id']], []);
            }
        }

        return BolHeros::with('carrieres.carriere', 'armures.armure', 'armes.arme')
            ->where('user_id', Auth::id())
            ->where('id', $pnj['id'])->first();
    }

    /** Enregistre la fiche d'un PNJ du compte ; `null` si ce n'en est pas un. */
    public function update(array $input): ?BolHeros
    {
        $pnjId = $input['id'] ?? null;
        $updatedPnj = Arr::except($input, ['armes', 'armures', 'carrieres', 'langues', 'user_id']);
        $pnj = BolHeros::with('carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue')->where('user_id', Auth::id())->where('id', $pnjId)->first();
        if ($pnj === null) {
            return null;
        }

        $carrieres = $input['carrieres'];
        $ids_carrieres = array_column($carrieres, 'id');
        BolHerosCarriere::whereNotIn('carriere_id', $ids_carrieres)->where('heros_id', $pnjId)->delete();
        foreach ($carrieres as $item) {
            BolHerosCarriere::updateOrCreate(['heros_id' => $pnjId, 'carriere_id' => $item['id']], ['value' => $item['value']]);
        }

        $armes = BolAccessibleEquipment::keep(BolArme::class, $input['armes'], fn ($item) => $item['id']);
        $ids_armes = array_column($armes, 'id');
        BolHerosArme::whereNotIn('arme_id', $ids_armes)->where('heros_id', $pnjId)->delete();
        foreach ($armes as $item) {
            // Un PNJ porte tout ce qu'il possède : ses armes sont en main, ses armures sur le dos, quoi qu'envoie le client.
            BolHerosArme::updateOrCreate(['heros_id' => $pnjId, 'arme_id' => $item['id']], ['equipee' => true]);
        }

        $langues = $input['langues'] ?? null;
        if ($langues && is_array($langues)) {
            $ids_langues = array_column($langues, 'id');
            BolHerosLangue::whereNotIn('langue_id', $ids_langues)->where('heros_id', $pnjId)->delete();
            foreach ($langues as $item) {
                BolHerosLangue::updateOrCreate(['heros_id' => $pnjId, 'langue_id' => $item['id']], []);
            }
        }

        $armures = BolAccessibleEquipment::keep(BolArmure::class, $input['armures'], fn ($item) => $item['id']);
        $ids_armures = array_column($armures, 'id');
        BolHerosArmure::whereNotIn('armure_id', $ids_armures)->where('heros_id', $pnjId)->delete();
        foreach ($armures as $item) {
            BolHerosArmure::updateOrCreate(
                ['heros_id' => $pnjId, 'armure_id' => $item['id']],
                ['equipee' => true]
            );
        }

        $traits = $input['traits'];

        $ids_avantages = array_column(array_filter($traits, fn ($trait) => $trait['type'] === 'A'), 'id');
        BolHerosTrait::whereNotIn('traitable_id', $ids_avantages)->where('type', 'A')->where('heros_id', $pnjId)->delete();

        $ids_desavantages = array_column(array_filter($traits, fn ($trait) => $trait['type'] === 'D'), 'id');
        BolHerosTrait::whereNotIn('traitable_id', $ids_desavantages)->where('type', 'D')->where('heros_id', $pnjId)->delete();

        foreach ($traits as $item) {
            BolHerosTrait::updateOrCreate(
                [
                    'heros_id' => $pnjId,
                    'traitable_id' => $item['id'],
                    'type' => $item['type'],
                    'traitable_type' => $item['type'] == 'A' ? BolAvantage::class : BolDesavantage::class
                ],
                // La précision (arme favorite…) ne change que si la requête l'envoie.
                array_key_exists('detail', $item) ? ['detail' => $item['detail']] : []);
        }
        $pnj->update($updatedPnj);
        // Les tables où ce PNJ est posé suivent sa fiche (statistiques, armes, rang, maxima de vitalité, de foi et de pouvoir).
        app(BolFightSessionService::class)->refreshPnjSnapshots((string) $pnjId);

        return BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue', 'region')->where('user_id', Auth::id())->where('id', $pnjId)->first();
    }

    public function delete(BolHeros $pnj): void
    {
        DB::transaction(fn () => $pnj->delete());
    }
}
