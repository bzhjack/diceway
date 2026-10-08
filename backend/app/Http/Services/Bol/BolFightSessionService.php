<?php

namespace App\Http\Services\Bol;

use App\Exceptions\Bol\DuplicateCombatantException;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionCreature;
use App\Models\Bol\BolFightSessionDemon;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;

class BolFightSessionService
{
    public function createSession(string $userId, array $data): ?BolFightSession
    {
        $session = BolFightSession::create([
            'user_id' => $userId,
            'titre'   => $data['titre'] ?? null,
            'statut'  => $this->determineInitialStatut($data),
        ]);

        $this->syncHeros($session->id, $data['heros'] ?? []);
        $this->syncCreatures($session->id, $data['creatures'] ?? []);
        $this->syncDemons($session->id, $data['demons'] ?? []);
        $this->syncPnjs($session->id, $data['pnjs'] ?? []);

        return $this->getSessionWithRelations($session->id);
    }

    /** Une session créée sans adversaire démarre "libre" (héros seuls, hors combat) ; sinon "combat". */
    public function determineInitialStatut(array $data): string
    {
        $hasAdversaries = !empty($data['creatures']) || !empty($data['demons']) || !empty($data['pnjs']);

        return $hasAdversaries ? 'combat' : 'libre';
    }

    public function getSessionWithRelations(string $id): ?BolFightSession
    {
        return BolFightSession::with($this->relations())->where('id', $id)->first();
    }

    public function getSessionsWithRelations(string $userId)
    {
        return BolFightSession::with($this->relations())
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    /** Résultat du jet de réaction d'un héros pour cette session (null pour effacer). */
    public function updateHeroInitiative(string $sessionId, int $herosPivotId, string $userId, ?string $resultat): ?BolFightSessionHeros
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        $pivot = BolFightSessionHeros::where('id', $herosPivotId)->where('fight_session_id', $sessionId)->first();
        if (!$pivot) {
            return null;
        }

        $pivot->update(['initiative_resultat' => $resultat]);

        return $pivot->fresh('heros');
    }

    public function deleteSession(string $id, string $userId): bool
    {
        return (bool) BolFightSession::where('id', $id)->where('user_id', $userId)->delete();
    }

    /** Persiste l'ordre d'initiative réordonné manuellement (glisser-déposer du ruban). */
    public function updateOrder(string $sessionId, string $userId, array $ordre): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        $session->update(['ordre_manuel' => array_values($ordre)]);

        return $this->getSessionWithRelations($sessionId);
    }

    /** Persiste les positions des jetons sur la battlemap (glisser-déposer libre) — clé `PlayToken.key` => {x, y} en pourcentage. */
    public function updatePositions(string $sessionId, string $userId, array $positions): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        $session->update(['positions_jetons' => $positions]);

        return $this->getSessionWithRelations($sessionId);
    }

    /**
     * Bascule une session `libre` en `combat` (ou, déjà en combat, enregistre un nouveau jet de réaction) — les adversaires sont déjà en place via addCombatant().
     *
     * @param array<int, string> $exclus clés de carte (`{kind}-{pivotId}`) laissées sur la table mais hors de ce combat
     */
    public function startCombat(string $sessionId, string $userId, array $exclus = []): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || !in_array($session->statut, ['libre', 'combat'], true)) {
            return null;
        }

        // Nouveau jet de réaction en plein combat : le round en cours est gardé, personne n'a encore joué.
        $round = $session->statut === 'combat' ? BolCombatState::normalize($session->etat_combat)['round'] : 1;

        $session->update(['statut' => 'combat', 'etat_combat' => BolCombatState::normalize(['round' => $round, 'exclus' => $exclus])]);

        return $this->getSessionWithRelations($sessionId);
    }

    /** Termine le combat : la session redevient `libre`. Les PNJ, créatures et démons restent sur la
     * table (ils ont pu y être posés en mode libre) — le MJ retire les vaincus à la main. */
    public function endCombat(string $sessionId, string $userId): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || $session->statut !== 'combat') {
            return null;
        }

        BolFightSessionHeros::where('fight_session_id', $sessionId)->update(['initiative_resultat' => null]);

        $session->update(['statut' => 'libre', 'ordre_manuel' => null, 'etat_combat' => null]);

        return $this->getSessionWithRelations($sessionId);
    }

    /**
     * Enregistre l'état du combat (round, cartes qui ont joué, cartes en défense totale). Renvoie
     * null si la session est introuvable ou n'est pas en combat.
     *
     * @param array<string, mixed> $etat
     */
    public function updateCombatState(string $sessionId, string $userId, array $etat): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session || $session->statut !== 'combat') {
            return null;
        }

        // Les cartes exclues sont fixées au démarrage : un état envoyé sans `exclus` ne les efface pas.
        $etat['exclus'] ??= BolCombatState::normalize($session->etat_combat)['exclus'];

        $session->update(['etat_combat' => BolCombatState::normalize($etat)]);

        return $this->getSessionWithRelations($sessionId);
    }

    /**
     * Ajoute un seul combattant à une session déjà lancée, sans toucher aux combattants déjà en
     * place. Un héros ou un PNJ donné (identité unique) ne peut pas être ajouté deux fois à la
     * même session — contrairement aux créatures/démons, qui sont des gabarits ré-instanciables.
     *
     * @throws DuplicateCombatantException si ce héros participe déjà à ce combat (PNJ, créatures et démons sont
     *                                     des archétypes : on peut en poser autant qu'on veut).
     */
    public function addCombatant(
        string $sessionId,
        string $userId,
        string $kind,
        string $sourceId,
        string $camp,
        int $qty = 1,
    ): ?BolFightSession {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        if ($kind === 'hero' && $this->hasHero($sessionId, $sourceId)) {
            throw new DuplicateCombatantException();
        }

        match ($kind) {
            'hero'     => $this->createHeroRow($sessionId, $sourceId, $camp),
            'pnj'      => $this->createPnjRows($sessionId, $sourceId, $camp, $this->normalizeQty($qty)),
            'creature' => $this->createCreatureRows($sessionId, $sourceId, $camp, $this->normalizeQty($qty)),
            'demon'    => $this->createDemonRows($sessionId, $sourceId, $camp, $this->normalizeQty($qty)),
            default    => null,
        };

        return $this->getSessionWithRelations($sessionId);
    }

    /**
     * Retire un combattant d'une session déjà lancée : chaque créature ou démon est sa propre ligne,
     * donc on supprime simplement celle-ci.
     */
    public function removeCombatant(string $sessionId, string $userId, string $kind, int $pivotId): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        match ($kind) {
            'hero'     => BolFightSessionHeros::where('id', $pivotId)->where('fight_session_id', $sessionId)->delete(),
            'pnj'      => BolFightSessionPnj::where('id', $pivotId)->where('fight_session_id', $sessionId)->delete(),
            'creature' => BolFightSessionCreature::where('id', $pivotId)->where('fight_session_id', $sessionId)->delete(),
            'demon'    => BolFightSessionDemon::where('id', $pivotId)->where('fight_session_id', $sessionId)->delete(),
            default    => null,
        };

        return $this->getSessionWithRelations($sessionId);
    }

    /**
     * Change le camp d'un PNJ, d'une créature ou d'un démon : `heros` pour un allié qui accompagne
     * les héros, `adversaires` sinon. Renvoie null si la session ou la ligne est introuvable, ou si
     * `$kind` n'est pas l'un des trois types (un héros ne change pas de camp).
     */
    public function setCamp(string $sessionId, string $userId, string $kind, int $pivotId, string $camp): ?BolFightSession
    {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        $model = match ($kind) {
            'pnj'      => BolFightSessionPnj::class,
            'creature' => BolFightSessionCreature::class,
            'demon'    => BolFightSessionDemon::class,
            default    => null,
        };
        $row = $model ? $model::where('id', $pivotId)->where('fight_session_id', $sessionId)->first() : null;
        if (!$row) {
            return null;
        }

        $row->update(['camp' => $this->normalizeCamp($camp)]);

        return $this->getSessionWithRelations($sessionId);
    }

    /**
     * Applique une variation de vitalité (négative pour des dégâts, positive pour un soin) à un
     * combattant, bornée entre 0 et son maximum. `$instanceIndex` est ignoré : il subsiste dans l'API
     * pour les clients qui l'envoient encore, mais chaque créature ou démon est sa propre ligne.
     */
    public function applyDamage(
        string $sessionId,
        string $userId,
        string $kind,
        int $pivotId,
        int $delta,
        ?int $instanceIndex = null,
    ): ?BolFightSession {
        $session = BolFightSession::where('id', $sessionId)->where('user_id', $userId)->first();
        if (!$session) {
            return null;
        }

        match ($kind) {
            'hero'     => $this->applyHeroDamage($sessionId, $pivotId, $delta),
            'pnj'      => $this->applyMaxClampedDamage(BolFightSessionPnj::where('id', $pivotId)->where('fight_session_id', $sessionId)->first(), $delta),
            'creature' => $this->applyInstanceDamage(BolFightSessionCreature::where('id', $pivotId)->where('fight_session_id', $sessionId)->first(), $delta),
            'demon'    => $this->applyInstanceDamage(BolFightSessionDemon::where('id', $pivotId)->where('fight_session_id', $sessionId)->first(), $delta),
            default    => null,
        };

        return $this->getSessionWithRelations($sessionId);
    }

    private function applyHeroDamage(string $sessionId, int $pivotId, int $delta): void
    {
        $pivot = BolFightSessionHeros::with('heros')->where('id', $pivotId)->where('fight_session_id', $sessionId)->first();
        if (!$pivot || !$pivot->heros) {
            return;
        }

        $max = $pivot->heros->vitalite;
        $current = $pivot->vitalite_courante ?? $max;
        // Un héros peut tomber sous 0 (vitalité négative = "Défier la mort", 02-actions-combat.md) —
        // seuls pnj/créature/démon restent plafonnés à 0, faute de mécanique de mort différée pour eux.
        $pivot->update(['vitalite_courante' => max(-20, min($max, $current + $delta))]);
    }

    private function applyMaxClampedDamage(BolFightSessionPnj|null $row, int $delta): void
    {
        if (!$row) {
            return;
        }

        $current = $row->vitalite_courante ?? $row->vitalite_max;
        $row->update(['vitalite_courante' => max(0, min($row->vitalite_max, $current + $delta))]);
    }

    /** Vitalité d'une créature ou d'un démon : un seul compteur, sur sa ligne (`vitalite_instances` en garde un reflet). */
    private function applyInstanceDamage(BolFightSessionCreature|BolFightSessionDemon|null $row, int $delta): void
    {
        if (!$row) {
            return;
        }

        $current = $row->vitalite_courante ?? $row->vitalite_max;
        $next = max(0, min($row->vitalite_max, $current + $delta));

        $row->update([
            'vitalite_courante'  => $next,
            'vitalite_instances' => [$next],
        ]);
    }

    private function hasHero(string $sessionId, string $heroId): bool
    {
        return BolFightSessionHeros::where('fight_session_id', $sessionId)->where('heros_id', $heroId)->exists();
    }

    private function syncHeros(string $sessionId, array $list): void
    {
        BolFightSessionHeros::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $this->createHeroRow(
                $sessionId,
                (string) ($item['heroId'] ?? ''),
                $item['camp'] ?? null,
                $this->normalizeInitiativeResultat($item['resultat'] ?? null),
            );
        }
    }

    private function createHeroRow(string $sessionId, string $heroId, ?string $camp, ?string $resultat = null): void
    {
        $hero = BolHeros::find($heroId);
        if (!$hero) {
            return;
        }

        BolFightSessionHeros::create([
            'fight_session_id'    => $sessionId,
            'heros_id'            => $hero->id,
            'camp'                => $this->normalizeCamp($camp),
            'initiative_resultat' => $resultat,
            'vitalite_courante'   => $hero->vitalite,
        ]);
    }

    private function normalizeInitiativeResultat(?string $resultat): ?string
    {
        $valid = ['echec_critique', 'echec', 'reussite', 'heroique', 'legendaire'];

        return in_array($resultat, $valid, true) ? $resultat : null;
    }

    private function syncCreatures(string $sessionId, array $list): void
    {
        BolFightSessionCreature::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $this->createCreatureRows(
                $sessionId,
                (string) ($item['creatureId'] ?? ''),
                $item['camp'] ?? null,
                $this->normalizeQty($item['qty'] ?? 1),
                $item['surnom'] ?? null,
            );
        }
    }

    /**
     * Pose `$count` exemplaires d'une créature : une ligne, donc une carte, par exemplaire.
     *
     * @return array<int, BolFightSessionCreature>
     */
    public function createCreatureRows(string $sessionId, string $creatureId, ?string $camp, int $count, ?string $surnom = null): array
    {
        $rows = [];
        for ($i = 0; $i < max(1, $count); $i++) {
            $row = $this->createCreatureRow($sessionId, $creatureId, $camp, $surnom);
            if (!$row) {
                break;
            }
            $rows[] = $row;
        }

        return $rows;
    }

    public function createCreatureRow(string $sessionId, string $creatureId, ?string $camp, ?string $surnom = null): ?BolFightSessionCreature
    {
        $creature = BolCreature::with('capacites.capacite')->find($creatureId);
        if (!$creature) {
            return null;
        }

        $capacites = collect($creature->capacites ?? [])->map(fn($c) => [
            'capacite_id' => $c->capacite_id,
            'capacite'    => $c->capacite?->capacite,
            'de_bonus'    => $c->capacite?->de_bonus,
            'de_malus'    => $c->capacite?->de_malus,
            'detail'      => $c->detail,
        ])->values()->toArray();

        return BolFightSessionCreature::create([
            'fight_session_id'  => $sessionId,
            'creature_id'       => $creature->id,
            'camp'              => $this->normalizeCamp($camp),
            'qty'               => 1,
            'surnom'            => $surnom,
            'rang'              => $creature->rang ?? 'coriace',
            'nom'               => $creature->nom,
            'vigueur'           => $creature->vigueur,
            'agilite'           => $creature->agilite,
            'esprit'            => $creature->esprit,
            'vitalite_max'       => $creature->vitalite,
            'vitalite_courante'  => $creature->vitalite,
            'vitalite_instances' => [$creature->vitalite],
            'attaque'           => $creature->attaque,
            'defense'           => $creature->defense,
            'degats'            => $creature->degats,
            'protection'        => $creature->protection,
            'id_taille'         => $creature->id_taille,
            'capacites'         => $capacites,
        ]);
    }

    private function syncDemons(string $sessionId, array $list): void
    {
        BolFightSessionDemon::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $this->createDemonRows(
                $sessionId,
                (string) ($item['demonId'] ?? ''),
                $item['camp'] ?? null,
                $this->normalizeQty($item['qty'] ?? 1),
                $item['surnom'] ?? null,
            );
        }
    }

    /**
     * Pose `$count` exemplaires d'un démon : une ligne, donc une carte, par exemplaire.
     *
     * @return array<int, BolFightSessionDemon>
     */
    public function createDemonRows(string $sessionId, string $demonId, ?string $camp, int $count, ?string $surnom = null): array
    {
        $rows = [];
        for ($i = 0; $i < max(1, $count); $i++) {
            $row = $this->createDemonRow($sessionId, $demonId, $camp, $surnom);
            if (!$row) {
                break;
            }
            $rows[] = $row;
        }

        return $rows;
    }

    public function createDemonRow(string $sessionId, string $demonId, ?string $camp, ?string $surnom = null): ?BolFightSessionDemon
    {
        $demon = BolDemon::with('pouvoirs.pouvoir')->find($demonId);
        if (!$demon) {
            return null;
        }

        $pouvoirs = collect($demon->pouvoirs ?? [])->map(fn($p) => [
            'pouvoir_id' => $p->pouvoir_id,
            'pouvoir'    => $p->pouvoir?->pouvoir,
            'detail'     => $p->detail,
        ])->values()->toArray();

        return BolFightSessionDemon::create([
            'fight_session_id'  => $sessionId,
            'demon_id'          => $demon->id,
            'camp'              => $this->normalizeCamp($camp),
            'qty'               => 1,
            'surnom'            => $surnom,
            'rang'              => $this->rangFromType($demon->type),
            'nom'               => $demon->nom,
            'vigueur'           => $demon->vigueur,
            'agilite'           => $demon->agilite,
            'esprit'            => $demon->esprit,
            'aura'              => $demon->aura,
            'melee'             => $demon->melee,
            'tir'               => $demon->tir,
            'defense'           => $demon->defense,
            'vitalite_max'       => $demon->vitalite,
            'vitalite_courante'  => $demon->vitalite,
            'vitalite_instances' => [$demon->vitalite],
            'degats'            => $demon->degats,
            'pouvoirs'          => $pouvoirs,
        ]);
    }

    /**
     * Pose `$count` exemplaires d'un PNJ : une ligne, donc une carte, par exemplaire.
     *
     * @return array<int, BolFightSessionPnj>
     */
    public function createPnjRows(string $sessionId, string $pnjId, ?string $camp, int $count, ?string $surnom = null): array
    {
        $rows = [];
        for ($i = 0; $i < max(1, $count); $i++) {
            $row = $this->createPnjRow($sessionId, $pnjId, $camp, $surnom);
            if (!$row) {
                break;
            }
            $rows[] = $row;
        }

        return $rows;
    }

    private function syncPnjs(string $sessionId, array $list): void
    {
        BolFightSessionPnj::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $this->createPnjRow(
                $sessionId,
                (string) ($item['pnjId'] ?? ''),
                $item['camp'] ?? null,
                $item['surnom'] ?? null,
            );
        }
    }

    public function createPnjRow(string $sessionId, string $pnjId, ?string $camp, ?string $surnom = null): ?BolFightSessionPnj
    {
        $pnj = BolHeros::with('armes.arme')->find($pnjId);
        if (!$pnj) {
            return null;
        }

        $armes = collect($pnj->armes ?? [])->map(fn($ha) => [
            'nom'    => $ha->arme?->arme,
            'degats' => $ha->arme?->degats,
            'type'   => $ha->arme?->type,
        ])->values()->toArray();

        return BolFightSessionPnj::create([
            'fight_session_id'  => $sessionId,
            'pnj_id'            => $pnj->id,
            'camp'              => $this->normalizeCamp($camp),
            'surnom'            => $surnom,
            'rang'              => $this->rangFromType($pnj->type),
            'nom'               => $pnj->nom,
            'vigueur'           => $pnj->vigueur,
            'agilite'           => $pnj->agilite,
            'esprit'            => $pnj->esprit,
            'aura'              => $pnj->aura,
            'melee'             => $pnj->melee,
            'tir'               => $pnj->tir,
            'defense'           => $pnj->defense,
            'vitalite_max'      => $pnj->vitalite,
            'vitalite_courante' => $pnj->vitalite,
            'armes'             => $armes,
        ]);
    }

    private function normalizeCamp(?string $camp): string
    {
        return $camp === 'heros' ? 'heros' : 'adversaires';
    }

    /** Mapping rang BoL : taille.type / categorie.type ('P'/'C'/'R') -> libellé complet. */
    private function rangFromType(?string $type): string
    {
        return match ($type) {
            'P' => 'pietaille',
            'R' => 'rival',
            default => 'coriace',
        };
    }

    private function normalizeQty(mixed $qty): int
    {
        return max(1, (int) $qty);
    }

    private function relations(): array
    {
        return [
            'heros.heros.armures.armure',
            'heros.heros.armes.arme',
            'creatures.creature',
            'demons.demon',
            'pnjs.pnj.armures.armure',
            'scene.scenario',
        ];
    }
}
