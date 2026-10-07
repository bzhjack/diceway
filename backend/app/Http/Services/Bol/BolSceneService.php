<?php

namespace App\Http\Services\Bol;

use App\Exceptions\Bol\SceneLoadNotAllowedException;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionCreature;
use App\Models\Bol\BolFightSessionDemon;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use Illuminate\Support\Facades\DB;

class BolSceneService
{
    public function __construct(private readonly BolFightSessionService $fightSessionService) {}

    public function getScenes(string $userId)
    {
        return BolScene::with('scenario:id,titre')
            ->where('user_id', $userId)
            ->orderBy('scenario_id')
            ->orderBy('ordre')
            ->get();
    }

    /** Crée une scène à partir de l'état de la table ; elle devient la scène courante de la session. */
    public function createFromSession(string $userId, string $titre, ?string $scenarioId, string $sessionId): ?BolScene
    {
        $session = $this->ownedSession($sessionId, $userId);
        if (!$session || !$this->scenarioAllowed($scenarioId, $userId)) {
            return null;
        }

        return DB::transaction(function () use ($userId, $titre, $scenarioId, $session) {
            $scene = BolScene::create([
                'user_id'      => $userId,
                'scenario_id'  => $scenarioId,
                'titre'        => $titre,
                'ordre'        => $this->nextOrdre($userId, $scenarioId),
                'notes'        => null,
                'distribution' => $this->distributionOf($session),
            ]);
            $session->update(['scene_id' => $scene->id]);

            return $scene->load('scenario:id,titre');
        });
    }

    /**
     * Met à jour titre, notes et/ou scénario — seules les clés présentes dans `$data` sont touchées.
     * Changer de scénario place la scène au dernier rang du scénario d'arrivée.
     *
     * @param array<string, mixed> $data
     */
    public function update(string $userId, string $sceneId, array $data): ?BolScene
    {
        $scene = $this->ownedScene($sceneId, $userId);
        if (!$scene) {
            return null;
        }

        $changes = [];
        if (array_key_exists('titre', $data)) {
            $changes['titre'] = $data['titre'];
        }
        if (array_key_exists('notes', $data)) {
            $changes['notes'] = $data['notes'];
        }
        if (array_key_exists('scenario_id', $data) && $data['scenario_id'] !== $scene->scenario_id) {
            if (!$this->scenarioAllowed($data['scenario_id'], $userId)) {
                return null;
            }
            $changes['scenario_id'] = $data['scenario_id'];
            $changes['ordre'] = $this->nextOrdre($userId, $data['scenario_id']);
        }

        $scene->update($changes);

        return $scene->load('scenario:id,titre');
    }

    /**
     * Réécrit l'ordre des scènes d'un scénario (ou de « Sans scénario » si `$scenarioId` est null)
     * selon la liste d'ids ; les ids étrangers à ce scénario ou à cet utilisateur sont ignorés.
     *
     * @param array<int, mixed> $sceneIds
     */
    public function reorder(string $userId, ?string $scenarioId, array $sceneIds): void
    {
        DB::transaction(function () use ($userId, $scenarioId, $sceneIds) {
            $rank = 0;
            foreach ($sceneIds as $sceneId) {
                $updated = BolScene::where('id', (string) $sceneId)
                    ->where('user_id', $userId)
                    ->where('scenario_id', $scenarioId)
                    ->update(['ordre' => $rank]);
                if ($updated > 0) {
                    $rank++;
                }
            }
        });
    }

    /** Remplace la distribution de la scène par l'état actuel de la table. */
    public function replaceDistribution(string $userId, string $sceneId, string $sessionId): ?BolScene
    {
        $scene = $this->ownedScene($sceneId, $userId);
        $session = $this->ownedSession($sessionId, $userId);
        if (!$scene || !$session) {
            return null;
        }

        $scene->update(['distribution' => $this->distributionOf($session)]);

        return $scene->load('scenario:id,titre');
    }

    public function delete(string $userId, string $sceneId): void
    {
        BolScene::where('id', $sceneId)->where('user_id', $userId)->delete();
    }

    /**
     * Charge une scène sur la table, en une transaction. Mode `replace` : les PNJ, créatures et
     * démons présents sont retirés d'abord. Les héros ne sont jamais touchés. Une entrée dont la
     * fiche source n'existe plus, ou un PNJ déjà présent (mode `add`), est ignorée et comptée.
     *
     * @return array{session: BolFightSession|null, ignored: int}|null null si scène ou session introuvable
     * @throws SceneLoadNotAllowedException si la session n'est pas en mode libre
     */
    public function loadIntoSession(string $userId, string $sessionId, string $sceneId, string $mode): ?array
    {
        $session = $this->ownedSession($sessionId, $userId);
        $scene = $this->ownedScene($sceneId, $userId);
        if (!$session || !$scene) {
            return null;
        }
        if ($session->statut !== 'libre') {
            throw new SceneLoadNotAllowedException();
        }

        return DB::transaction(function () use ($session, $scene, $mode) {
            $sessionId = $session->id;
            $positions = $session->positions_jetons ?? [];

            if ($mode === 'replace') {
                BolFightSessionPnj::where('fight_session_id', $sessionId)->delete();
                BolFightSessionCreature::where('fight_session_id', $sessionId)->delete();
                BolFightSessionDemon::where('fight_session_id', $sessionId)->delete();
                $positions = BolSceneDistribution::heroPositionsOnly($positions);
            }

            $ignored = 0;
            foreach ($scene->distribution ?? [] as $entry) {
                $kind = (string) ($entry['kind'] ?? '');
                $sourceId = (string) ($entry['source_id'] ?? '');
                $qty = max(1, (int) ($entry['qty'] ?? 1));
                $camp = BolSceneDistribution::entryCamp($entry);

                $rows = match ($kind) {
                    'pnj'      => array_filter([$this->fightSessionService->createPnjRow($sessionId, $sourceId, $camp)]),
                    'creature' => $this->fightSessionService->createCreatureRows($sessionId, $sourceId, $camp, $qty),
                    'demon'    => $this->fightSessionService->createDemonRows($sessionId, $sourceId, $camp, $qty),
                    default    => [],
                };

                if ($rows === []) {
                    $ignored++;
                    continue;
                }

                // Une scène enregistre un exemplaire par position ; chaque exemplaire est maintenant sa propre ligne.
                $stored = array_values(is_array($entry['positions'] ?? null) ? $entry['positions'] : []);
                foreach (array_values($rows) as $i => $row) {
                    $positions = array_merge($positions, BolSceneDistribution::tokenPositions($kind, (int) $row->id, [
                        'qty'       => 1,
                        'positions' => [$stored[$i] ?? null],
                    ]));
                }
            }

            $session->update([
                'positions_jetons' => $positions === [] ? null : $positions,
                'scene_id'         => $scene->id,
            ]);

            return [
                'session' => $this->fightSessionService->getSessionWithRelations($sessionId),
                'ignored' => $ignored,
            ];
        });
    }

    /** @return array<int, array<string, mixed>> */
    private function distributionOf(BolFightSession $session): array
    {
        $sessionId = $session->id;

        return BolSceneDistribution::fromSession(
            BolFightSessionPnj::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'pnj_id', 'camp'])->toArray(),
            BolFightSessionCreature::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'creature_id', 'qty', 'camp'])->toArray(),
            BolFightSessionDemon::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'demon_id', 'qty', 'camp'])->toArray(),
            $session->positions_jetons,
        );
    }

    private function nextOrdre(string $userId, ?string $scenarioId): int
    {
        $max = BolScene::where('user_id', $userId)->where('scenario_id', $scenarioId)->max('ordre');

        return $max === null ? 0 : ((int) $max) + 1;
    }

    /** Un scénario null (« Sans scénario ») est toujours permis ; sinon il doit appartenir à l'utilisateur. */
    private function scenarioAllowed(?string $scenarioId, string $userId): bool
    {
        return $scenarioId === null
            || BolScenario::where('id', $scenarioId)->where('user_id', $userId)->exists();
    }

    private function ownedSession(string $sessionId, string $userId): ?BolFightSession
    {
        return BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
    }

    private function ownedScene(string $sceneId, string $userId): ?BolScene
    {
        return BolScene::where('id', $sceneId)->where('user_id', $userId)->first();
    }
}
