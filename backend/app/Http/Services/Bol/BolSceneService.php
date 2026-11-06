<?php

namespace App\Http\Services\Bol;

use App\Exceptions\Bol\SceneLoadNotAllowedException;
use App\Models\Bol\BolCompagnie;
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
            $session->update([
                'scene_id'      => $scene->id,
                'scenes_jouees' => BolScenePreparation::played($session->scenes_jouees, $scene->id),
            ] + $this->scenarioDeLaScene($scene, $session));

            return $scene->load('scenario:id,titre');
        });
    }

    /**
     * Met à jour titre, notes, scénario et préparation (région, lieu, ambiance, texte à lire, règles du MJ,
     * pistes, illustration) — seules les clés présentes dans `$data` sont touchées. Changer de scénario place la
     * scène au dernier rang du scénario d'arrivée. Une piste ne garde son lien que vers une autre scène
     * de ce scénario.
     *
     * @param array<string, mixed> $data
     */
    public function update(string $userId, string $sceneId, array $data): ?BolScene
    {
        $scene = $this->ownedScene($sceneId, $userId);
        if (!$scene) {
            return null;
        }

        $changes = array_intersect_key($data, array_flip(['titre', 'notes', 'region_id', 'lieu', 'moment', 'meteo', 'danger', 'lecture', 'jeu', 'image']));
        if (array_key_exists('scenario_id', $data) && $data['scenario_id'] !== $scene->scenario_id) {
            if (!$this->scenarioAllowed($data['scenario_id'], $userId)) {
                return null;
            }
            $changes['scenario_id'] = $data['scenario_id'];
            $changes['ordre'] = $this->nextOrdre($userId, $data['scenario_id']);
        }
        if (array_key_exists('pistes', $data)) {
            $siblingIds = BolScene::where('user_id', $userId)
                ->where('scenario_id', $changes['scenario_id'] ?? $scene->scenario_id)
                ->where('id', '!=', $scene->id)
                ->pluck('id')
                ->map(fn ($id) => (string) $id)
                ->all();
            $changes['pistes'] = BolScenePreparation::pistes($data['pistes'], $siblingIds);
        }

        $scene->update($changes);

        return $scene->load('scenario:id,titre');
    }

    /**
     * Réécrit l'ordre des scènes d'un scénario (ou de « On improvise » si `$scenarioId` est null)
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
        DB::transaction(fn () => BolScene::where('id', $sceneId)->where('user_id', $userId)->first()?->delete());
    }

    /**
     * Charge une scène sur la table, en une transaction. Mode `replace` : les PNJ, créatures et
     * démons présents sont retirés d'abord. Les héros ne sont jamais touchés. L'attitude enregistrée
     * de chaque entrée est rendue aux lignes créées. Une entrée dont la
     * fiche source n'existe plus, ou un PNJ déjà présent (mode `add`), est ignorée et comptée.
     *
     * @return array{session: BolFightSession|null, ignored: int}|null null si scène ou session introuvable
     * @throws SceneLoadNotAllowedException si la session n'est pas en mode libre
     */
    public function loadIntoSession(string $userId, string $sessionId, string $sceneId, string $mode, bool $garderLesAllies = false): ?array
    {
        $session = $this->ownedSession($sessionId, $userId);
        $scene = $this->ownedScene($sceneId, $userId);
        if (!$session || !$scene) {
            return null;
        }
        if ($session->statut !== 'libre') {
            throw new SceneLoadNotAllowedException();
        }

        return DB::transaction(function () use ($session, $scene, $mode, $garderLesAllies) {
            $sessionId = $session->id;
            $positions = $session->positions_jetons ?? [];

            // `garderLesAllies` : ceux du camp des héros restent, et la scène ne les pose pas une seconde fois.
            $allies = $garderLesAllies ? $this->alliesAssis($sessionId) : [];
            if ($mode === 'replace') {
                foreach ([BolFightSessionPnj::class, BolFightSessionCreature::class, BolFightSessionDemon::class] as $lignes) {
                    $lignes::where('fight_session_id', $sessionId)->when($garderLesAllies, fn ($q) => $q->where('camp', '!=', 'heros'))->delete();
                }
                $positions = BolSceneDistribution::heroPositionsOnly($positions);
            }

            $ignored = 0;
            foreach ($scene->distribution ?? [] as $entry) {
                $kind = (string) ($entry['kind'] ?? '');
                $sourceId = (string) ($entry['source_id'] ?? '');
                $qty = max(1, (int) ($entry['qty'] ?? 1));
                $camp = BolSceneDistribution::entryCamp($entry);
                if ($camp === 'heros' && isset($allies[$kind . ':' . $sourceId])) {
                    continue;
                }

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

                $attitude = BolSceneDistribution::entryAttitude($entry);
                if ($attitude !== null) {
                    foreach ($rows as $row) {
                        $row->update(['attitude' => $attitude]);
                    }
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
                'scenes_jouees'    => BolScenePreparation::played($session->scenes_jouees, $scene->id),
            ] + $this->scenarioDeLaScene($scene, $session));

            return [
                'session' => $this->fightSessionService->getSessionWithRelations($sessionId),
                'ignored' => $ignored,
            ];
        });
    }

    /**
     * Une nouvelle partie : la compagnie sur ce chapitre, avec sa première scène chargée. Tout ou rien : si la scène ne se charge pas, la partie
     * n'existe pas. Le verrou sur la compagnie empêche deux demandes simultanées de créer deux parties sur le même scénario.
     *
     * @return array{partie: BolFightSession, existante: bool}
     */
    public function creerPartie(string $userId, BolCompagnie $compagnie, mixed $scenarioId): array
    {
        return DB::transaction(function () use ($userId, $compagnie, $scenarioId) {
            BolCompagnie::whereKey($compagnie->id)->lockForUpdate()->first();
            ['partie' => $partie, 'existante' => $existante] = $this->fightSessionService->creerPartie($userId, $compagnie, $scenarioId);

            return ['existante' => $existante, 'partie' => $existante ? $partie : $this->chargerLaPremiereScene($userId, $partie)];
        });
    }

    /**
     * Une partie qui n'a encore joué aucune scène, qu'elle commence ou qu'on arrive à sa table : la première scène de son chapitre se charge,
     * avec ses figurants, ajoutés à ce qui est posé. Une partie qui a déjà joué une scène (même supprimée depuis) n'y perd rien : ce qui est
     * sur sa table ne se double pas. En combat, sans chapitre ou sans scène, elle reste telle quelle.
     */
    public function chargerLaPremiereScene(string $userId, BolFightSession $partie): BolFightSession
    {
        if ($partie->scene_id !== null || $partie->statut !== 'libre' || !empty($partie->scenes_jouees)) {
            return $partie;
        }
        $scene = $this->premiereScene($userId, $partie->scenario_id);
        if (!$scene) {
            return $partie;
        }

        return $this->avecLesIgnores($this->loadIntoSession($userId, $partie->id, $scene->id, 'add')) ?? $partie;
    }

    /**
     * « Changer de chapitre » : la partie passe sur ce chapitre et charge sa première scène. Les adversaires de l'ancien chapitre partent ; les
     * héros et leurs alliés restent, avec leur état. Une partie improvisée qui reçoit son scénario ne perd rien de ce qui est posé. Sans scène
     * à charger, la table quitte juste l'ancienne scène. Tout ou rien : si la scène ne se charge pas, le chapitre ne change pas. `false` : ce
     * chapitre n'est pas du scénario de la partie ; `null` : la table n'est pas du compte.
     *
     * @throws SceneLoadNotAllowedException en combat : comme une scène, un chapitre attend la fin du combat
     */
    public function changerDeChapitre(string $sessionId, string $userId, mixed $scenarioId): BolFightSession|false|null
    {
        return DB::transaction(function () use ($sessionId, $userId, $scenarioId) {
            $avant = $this->ownedSession($sessionId, $userId);
            if (!$avant) {
                return null;
            }
            if ($avant->statut !== 'libre' && $scenarioId !== $avant->scenario_id) {
                throw new SceneLoadNotAllowedException();
            }
            $partie = $this->fightSessionService->poserSurChapitre($sessionId, $userId, $scenarioId);
            if (!$partie) {
                return $partie;
            }
            if ($partie->scenario_id === $avant->scenario_id) {
                return $this->fightSessionService->getSessionWithRelations($sessionId);
            }

            $scene = $this->premiereScene($userId, $partie->scenario_id);
            if (!$scene) {
                $partie->update(['scene_id' => null]);

                return $this->fightSessionService->getSessionWithRelations($sessionId);
            }

            $mode = $avant->scenario_id === null ? 'add' : 'replace';

            return $this->avecLesIgnores($this->loadIntoSession($userId, $sessionId, $scene->id, $mode, garderLesAllies: true));
        });
    }

    /**
     * La table après un chargement automatique, qui dit combien de figurants de la scène n'existent plus (`figurants_ignores`) : personne n'a
     * demandé ce chargement, il faut que l'écran puisse le signaler.
     *
     * @param array{session: ?BolFightSession, ignored: int}|null $resultat
     */
    private function avecLesIgnores(?array $resultat): ?BolFightSession
    {
        $session = $resultat['session'] ?? null;
        if ($session && $resultat['ignored'] > 0) {
            $session->setAttribute('figurants_ignores', $resultat['ignored']);
        }

        return $session;
    }

    /** @return array<string, true> les alliés à cette table, par `kind:fiche` */
    private function alliesAssis(string $sessionId): array
    {
        $cles = [];
        foreach (['pnj' => [BolFightSessionPnj::class, 'pnj_id'], 'creature' => [BolFightSessionCreature::class, 'creature_id'], 'demon' => [BolFightSessionDemon::class, 'demon_id']] as $kind => [$lignes, $colonne]) {
            foreach ($lignes::where('fight_session_id', $sessionId)->where('camp', 'heros')->pluck($colonne) as $fiche) {
                $cles[$kind . ':' . $fiche] = true;
            }
        }

        return $cles;
    }

    private function premiereScene(string $userId, ?string $chapitreId): ?BolScene
    {
        return $chapitreId === null ? null : BolScene::where('user_id', $userId)
            ->where('scenario_id', $chapitreId)
            ->orderBy('ordre')
            ->orderBy('created_at')
            ->first();
    }

    /**
     * Le chapitre qu'une scène chargée ou enregistrée donne à la partie : le sien, s'il est du scénario de la partie (ou si la partie
     * improvise encore). Une scène « On improvise » (sans chapitre) ou d'un autre scénario ne touche pas au chapitre de la partie.
     *
     * @return array{scenario_id?: string}
     */
    private function scenarioDeLaScene(BolScene $scene, BolFightSession $session): array
    {
        return $scene->scenario_id !== null && $session->peutPasserSur($scene->scenario_id)
            ? ['scenario_id' => $scene->scenario_id]
            : [];
    }

    /** @return array<int, array<string, mixed>> */
    private function distributionOf(BolFightSession $session): array
    {
        $sessionId = $session->id;

        return BolSceneDistribution::fromSession(
            BolFightSessionPnj::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'pnj_id', 'camp', 'attitude'])->toArray(),
            BolFightSessionCreature::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'creature_id', 'camp', 'attitude'])->toArray(),
            BolFightSessionDemon::where('fight_session_id', $sessionId)->orderBy('id')->get(['id', 'demon_id', 'camp', 'attitude'])->toArray(),
            $session->positions_jetons,
        );
    }

    private function nextOrdre(string $userId, ?string $scenarioId): int
    {
        $max = BolScene::where('user_id', $userId)->where('scenario_id', $scenarioId)->max('ordre');

        return $max === null ? 0 : ((int) $max) + 1;
    }

    /** Un scénario null (« On improvise ») est toujours permis ; sinon il doit appartenir à l'utilisateur. */
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
