<?php

namespace App\Http\Services\Bol;

use App\Exceptions\Bol\ScenarioImportException;
use App\Models\Bol\BolArme;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolCreatureCapacite;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolDemonPouvoir;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosTrait;
use App\Models\Bol\BolImportRef;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Écrit un import de scénario contrôlé (`BolScenarioImportPlan`) dans la bibliothèque d'un utilisateur : le
 * scénario, ses personnages (PNJ, créatures, démons, armes propres au scénario) et ses scènes.
 *
 * Tout appartient à l'utilisateur : rien n'est jamais écrit au catalogue (`user_id` nul), qui est visible de
 * tous les comptes. Un réimport retrouve par `bol_import_ref` ce que l'import précédent a créé et le met à
 * jour (les ids ne changent pas, les sessions qui ont chargé une scène la gardent) ; une scène retirée du
 * fichier est supprimée. Une fiche modifiée dans l'app entre-temps est écrasée par le fichier.
 */
final class BolScenarioImporter
{
    /** Libellés du compte rendu par sorte de personnage : création, mise à jour. */
    private const LIBELLES = [
        'pnj'      => ['PNJ créé', 'PNJ mis à jour'],
        'creature' => ['créature créée', 'créature mise à jour'],
        'demon'    => ['démon créé', 'démon mis à jour'],
    ];

    /** @var array<string, int> */
    private array $report = [];

    /**
     * @return array<string, int> compte rendu : libellé (« scène créée », « PNJ mis à jour »…) → nombre
     * @throws ScenarioImportException si un personnage cité n'est défini ni ici ni par un import précédent de la saga
     */
    public function import(BolScenarioImportPlan $plan, string $userId): array
    {
        if ($userId === '') {
            throw new ScenarioImportException(['utilisateur : obligatoire, rien ne s’importe au catalogue']);
        }
        $this->report = [];

        return DB::transaction(function () use ($plan, $userId) {
            $scenario = $this->scenario($plan, $userId);

            /** @var array<string, array{0: string, 1: string}> $ids clé du personnage → [kind, id] */
            $ids = [];
            foreach ($plan->personnages as $cle => $perso) {
                $ids[$cle] = $this->personnage($plan->saga, $userId, $cle, $perso);
            }
            $errors = [];
            foreach ($plan->externes as $cle) {
                $found = $this->externe($plan->saga, $userId, $cle);
                if ($found === null) {
                    $errors[] = "personnage « $cle » : défini ni dans ce fichier, ni par un import précédent de la saga « {$plan->saga} »";
                } else {
                    $ids[$cle] = $found;
                }
            }
            if ($errors !== []) {
                throw new ScenarioImportException($errors);
            }

            $this->scenes($plan, $userId, (string) $scenario->id, $ids);

            Cache::forget('bol_creatures');
            Cache::forget('bol_demons');

            return $this->report;
        });
    }

    private function scenario(BolScenarioImportPlan $plan, string $userId): BolScenario
    {
        $ref = $this->ref($userId, $plan->saga, BolImportRef::TYPE_SCENARIO, $plan->scenario['cle']);
        $scenario = $ref ? BolScenario::where('user_id', $userId)->find($ref->entity_id) : null;
        $fields = ['titre' => $plan->scenario['titre'], 'pitch' => $plan->scenario['pitch']];

        if ($scenario) {
            $scenario->update($fields);
            $this->count('scénario mis à jour');
        } else {
            $scenario = BolScenario::create($fields + ['user_id' => $userId]);
            $this->count('scénario créé');
        }
        $this->saveRef($userId, $plan->saga, BolImportRef::TYPE_SCENARIO, $plan->scenario['cle'], 'scenario', (string) $scenario->id);

        return $scenario;
    }

    /**
     * @param array<string, mixed> $perso
     * @return array{0: string, 1: string} [kind, id]
     */
    private function personnage(string $saga, string $userId, string $cle, array $perso): array
    {
        $kind = $perso['kind'];
        if ($perso['catalogue_id'] !== null) {
            $this->saveRef($userId, $saga, BolImportRef::TYPE_PERSONNAGE, $cle, $kind, (string) $perso['catalogue_id']);

            return [$kind, (string) $perso['catalogue_id']];
        }

        $ref = $this->ref($userId, $saga, BolImportRef::TYPE_PERSONNAGE, $cle);
        $model = $ref && $ref->entity_kind === $kind ? $this->owned($kind, $userId, $ref->entity_id) : null;
        $fields = $perso['fields'];

        if ($model) {
            $model->update($fields);
            $this->count(self::LIBELLES[$kind][1]);
        } else {
            $model = match ($kind) {
                'pnj'      => BolHeros::create($fields + ['user_id' => $userId, 'active' => true]),
                'creature' => BolCreature::create($fields + ['user_id' => $userId]),
                'demon'    => BolDemon::create($fields + ['user_id' => $userId]),
            };
            $this->count(self::LIBELLES[$kind][0]);
        }
        $id = (string) $model->id;

        match ($kind) {
            'pnj'      => $this->pnjLinks($id, $userId, $perso),
            'creature' => $this->creatureCapacites($id, $perso['capacites']),
            'demon'    => $this->demonPouvoirs($id, $perso['pouvoirs']),
        };
        $this->saveRef($userId, $saga, BolImportRef::TYPE_PERSONNAGE, $cle, $kind, $id);

        return [$kind, $id];
    }

    /** Carrières, armes, armures et traits d'un PNJ, remplacés par ceux du fichier ; un PNJ porte tout ce qu'il possède. */
    private function pnjLinks(string $herosId, string $userId, array $perso): void
    {
        BolHerosCarriere::where('heros_id', $herosId)->delete();
        BolHerosArme::where('heros_id', $herosId)->delete();
        BolHerosArmure::where('heros_id', $herosId)->delete();
        BolHerosTrait::where('heros_id', $herosId)->delete();

        foreach ($perso['carrieres'] as $carriere) {
            BolHerosCarriere::create(['heros_id' => $herosId] + $carriere);
        }

        $armeIds = [];
        foreach ($perso['armes'] as $arme) {
            $armeIds[] = $arme['custom'] === null ? $arme['id'] : $this->customArme($userId, $arme['custom']);
        }
        foreach (array_unique($armeIds) as $armeId) {
            BolHerosArme::create(['heros_id' => $herosId, 'arme_id' => $armeId, 'equipee' => true]);
        }

        foreach ($perso['armures'] as $armureId) {
            BolHerosArmure::create(['heros_id' => $herosId, 'armure_id' => $armureId, 'equipee' => true]);
        }

        foreach ($perso['traits'] as $trait) {
            BolHerosTrait::create([
                'heros_id'       => $herosId,
                'traitable_id'   => $trait['id'],
                'type'           => $trait['type'],
                'traitable_type' => $trait['type'] === 'A' ? BolAvantage::class : BolDesavantage::class,
                'detail'         => $trait['detail'],
            ]);
        }
    }

    /**
     * Une arme propre au scénario, dans la bibliothèque de l'utilisateur : retrouvée par son nom et mise à jour,
     * ou créée.
     *
     * @param array<string, string|null> $custom
     */
    private function customArme(string $userId, array $custom): int|string
    {
        $arme = BolArme::where('user_id', $userId)->where('arme', $custom['arme'])->first();
        if ($arme) {
            $arme->update($custom);
        } else {
            $arme = BolArme::create($custom + ['user_id' => $userId]);
            $this->count('arme créée');
        }

        return $arme->id;
    }

    /** @param list<array{id: int|string, detail: string|null}> $capacites */
    private function creatureCapacites(string $creatureId, array $capacites): void
    {
        BolCreatureCapacite::where('creature_id', $creatureId)->delete();
        foreach ($capacites as $capacite) {
            BolCreatureCapacite::create(['creature_id' => $creatureId, 'capacite_id' => $capacite['id'], 'detail' => $capacite['detail']]);
        }
    }

    /** @param list<array{id: int|string, detail: string|null}> $pouvoirs */
    private function demonPouvoirs(string $demonId, array $pouvoirs): void
    {
        BolDemonPouvoir::where('demon_id', $demonId)->delete();
        foreach ($pouvoirs as $pouvoir) {
            BolDemonPouvoir::create(['demon_id' => $demonId, 'pouvoir_id' => $pouvoir['id'], 'detail' => $pouvoir['detail']]);
        }
    }

    /**
     * Un personnage qu'un autre fichier de la saga a défini, s'il existe encore (à l'utilisateur, ou au
     * catalogue pour une référence au catalogue).
     *
     * @return array{0: string, 1: string}|null
     */
    private function externe(string $saga, string $userId, string $cle): ?array
    {
        $ref = $this->ref($userId, $saga, BolImportRef::TYPE_PERSONNAGE, $cle);
        if (!$ref) {
            return null;
        }
        $class = $this->modelClass($ref->entity_kind);
        $exists = $class::where('id', $ref->entity_id)
            ->where(fn ($query) => $query->where('user_id', $userId)->orWhereNull('user_id'))
            ->exists();

        return $exists ? [$ref->entity_kind, $ref->entity_id] : null;
    }

    /**
     * Les scènes du fichier, dans son ordre ; puis leurs pistes, une fois toutes les scènes connues ; enfin, les
     * scènes qu'un import précédent de ce scénario avait créées et que le fichier n'a plus sont supprimées.
     *
     * @param array<string, array{0: string, 1: string}> $ids
     */
    private function scenes(BolScenarioImportPlan $plan, string $userId, string $scenarioId, array $ids): void
    {
        $prefix = $plan->scenario['cle'] . '/';
        $refs = BolImportRef::where('user_id', $userId)
            ->where('saga', $plan->saga)
            ->where('type', BolImportRef::TYPE_SCENE)
            ->get()
            ->filter(fn (BolImportRef $ref) => str_starts_with($ref->cle, $prefix))
            ->keyBy('cle');

        /** @var array<string, BolScene> $scenes clé → scène */
        $scenes = [];
        foreach ($plan->scenes as $ordre => $scene) {
            $ref = $refs[$prefix . $scene['cle']] ?? null;
            $model = $ref ? BolScene::where('user_id', $userId)->find($ref->entity_id) : null;
            $fields = $scene['fields'] + [
                'scenario_id'  => $scenarioId,
                'ordre'        => $ordre,
                'distribution' => $this->distribution($scene['distribution'], $ids),
            ];

            if ($model) {
                $model->update($fields);
                $this->count('scène mise à jour');
            } else {
                $model = BolScene::create($fields + ['user_id' => $userId]);
                $this->count('scène créée');
            }
            $this->saveRef($userId, $plan->saga, BolImportRef::TYPE_SCENE, $prefix . $scene['cle'], 'scene', (string) $model->id);
            $scenes[$scene['cle']] = $model;
        }

        $sceneIds = array_map(fn (BolScene $scene) => (string) $scene->id, $scenes);
        foreach ($plan->scenes as $scene) {
            $model = $scenes[$scene['cle']];
            $pistes = array_map(fn (array $piste) => [
                'texte'    => $piste['texte'],
                'scene_id' => $piste['vers'] === null ? null : $sceneIds[$piste['vers']],
            ], $scene['pistes']);
            $siblings = array_values(array_diff($sceneIds, [(string) $model->id]));
            $model->update(['pistes' => BolScenePreparation::pistes($pistes, $siblings)]);
        }

        foreach ($refs as $cle => $ref) {
            if (array_key_exists(substr($cle, strlen($prefix)), $scenes)) {
                continue;
            }
            BolScene::where('user_id', $userId)->where('id', $ref->entity_id)->delete();
            $ref->delete();
            $this->count('scène supprimée');
        }
    }

    /**
     * La distribution d'une scène, positions vides (placement par défaut au chargement). Un PNJ n'a qu'un
     * exemplaire par entrée : « deux prêtres » donnent deux entrées.
     *
     * @param list<array{perso: string, qty: int, camp: string, attitude: string|null}> $entries
     * @param array<string, array{0: string, 1: string}> $ids
     * @return list<array<string, mixed>>
     */
    public static function distribution(array $entries, array $ids): array
    {
        $result = [];
        foreach ($entries as $entry) {
            [$kind, $sourceId] = $ids[$entry['perso']];
            $copies = $kind === 'pnj' ? $entry['qty'] : 1;
            $qty = $kind === 'pnj' ? 1 : $entry['qty'];
            for ($i = 0; $i < $copies; $i++) {
                $result[] = [
                    'kind'      => $kind,
                    'source_id' => $sourceId,
                    'qty'       => $qty,
                    'camp'      => $entry['camp'],
                    'attitude'  => $entry['attitude'],
                    'positions' => array_fill(0, $qty, null),
                ];
            }
        }

        return $result;
    }

    private function owned(string $kind, string $userId, string $id): ?Model
    {
        return $this->modelClass($kind)::where('user_id', $userId)->where('id', $id)->first();
    }

    /** @return class-string<Model> */
    private function modelClass(string $kind): string
    {
        return match ($kind) {
            'pnj'      => BolHeros::class,
            'creature' => BolCreature::class,
            'demon'    => BolDemon::class,
        };
    }

    private function ref(string $userId, string $saga, string $type, string $cle): ?BolImportRef
    {
        return BolImportRef::where(['user_id' => $userId, 'saga' => $saga, 'type' => $type, 'cle' => $cle])->first();
    }

    private function saveRef(string $userId, string $saga, string $type, string $cle, string $kind, string $id): void
    {
        BolImportRef::updateOrCreate(
            ['user_id' => $userId, 'saga' => $saga, 'type' => $type, 'cle' => $cle],
            ['entity_kind' => $kind, 'entity_id' => $id],
        );
    }

    private function count(string $what): void
    {
        $this->report[$what] = ($this->report[$what] ?? 0) + 1;
    }
}
