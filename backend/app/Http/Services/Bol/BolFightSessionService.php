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
        ]);

        $this->syncHeros($session->id, $data['heros'] ?? []);
        $this->syncCreatures($session->id, $data['creatures'] ?? []);
        $this->syncDemons($session->id, $data['demons'] ?? []);
        $this->syncPnjs($session->id, $data['pnjs'] ?? []);

        return $this->getSessionWithRelations($session->id);
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

    /**
     * Ajoute un seul combattant à une session déjà lancée, sans toucher aux combattants déjà en
     * place. Un héros ou un PNJ donné (identité unique) ne peut pas être ajouté deux fois à la
     * même session — contrairement aux créatures/démons, qui sont des gabarits ré-instanciables.
     *
     * @throws DuplicateCombatantException si ce héros/PNJ participe déjà à ce combat.
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

        if (in_array($kind, ['hero', 'pnj'], true) && $this->hasCombatant($sessionId, $kind, $sourceId)) {
            throw new DuplicateCombatantException();
        }

        match ($kind) {
            'hero'     => $this->createHeroRow($sessionId, $sourceId, $camp),
            'pnj'      => $this->createPnjRow($sessionId, $sourceId, $camp),
            'creature' => $this->createCreatureRow($sessionId, $sourceId, $camp, $this->normalizeQty($qty)),
            'demon'    => $this->createDemonRow($sessionId, $sourceId, $camp, $this->normalizeQty($qty)),
            default    => null,
        };

        return $this->getSessionWithRelations($sessionId);
    }

    private function hasCombatant(string $sessionId, string $kind, string $sourceId): bool
    {
        return match ($kind) {
            'hero'  => BolFightSessionHeros::where('fight_session_id', $sessionId)->where('heros_id', $sourceId)->exists(),
            'pnj'   => BolFightSessionPnj::where('fight_session_id', $sessionId)->where('pnj_id', $sourceId)->exists(),
            default => false,
        };
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
            $this->createCreatureRow(
                $sessionId,
                (string) ($item['creatureId'] ?? ''),
                $item['camp'] ?? null,
                $this->normalizeQty($item['qty'] ?? 1),
                $item['surnom'] ?? null,
            );
        }
    }

    private function createCreatureRow(string $sessionId, string $creatureId, ?string $camp, int $qty, ?string $surnom = null): void
    {
        $creature = BolCreature::with('capacites.capacite')->find($creatureId);
        if (!$creature) {
            return;
        }

        $capacites = collect($creature->capacites ?? [])->map(fn($c) => [
            'capacite_id' => $c->capacite_id,
            'capacite'    => $c->capacite?->capacite,
            'de_bonus'    => $c->capacite?->de_bonus,
            'de_malus'    => $c->capacite?->de_malus,
            'detail'      => $c->detail,
        ])->values()->toArray();

        BolFightSessionCreature::create([
            'fight_session_id'  => $sessionId,
            'creature_id'       => $creature->id,
            'camp'              => $this->normalizeCamp($camp),
            'qty'               => $qty,
            'surnom'            => $surnom,
            'rang'              => $creature->rang ?? 'coriace',
            'nom'               => $creature->nom,
            'vigueur'           => $creature->vigueur,
            'agilite'           => $creature->agilite,
            'esprit'            => $creature->esprit,
            'vitalite_max'      => $creature->vitalite,
            'vitalite_courante' => $creature->vitalite,
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
            $this->createDemonRow(
                $sessionId,
                (string) ($item['demonId'] ?? ''),
                $item['camp'] ?? null,
                $this->normalizeQty($item['qty'] ?? 1),
                $item['surnom'] ?? null,
            );
        }
    }

    private function createDemonRow(string $sessionId, string $demonId, ?string $camp, int $qty, ?string $surnom = null): void
    {
        $demon = BolDemon::with('pouvoirs.pouvoir')->find($demonId);
        if (!$demon) {
            return;
        }

        $pouvoirs = collect($demon->pouvoirs ?? [])->map(fn($p) => [
            'pouvoir_id' => $p->pouvoir_id,
            'pouvoir'    => $p->pouvoir?->pouvoir,
            'detail'     => $p->detail,
        ])->values()->toArray();

        BolFightSessionDemon::create([
            'fight_session_id'  => $sessionId,
            'demon_id'          => $demon->id,
            'camp'              => $this->normalizeCamp($camp),
            'qty'               => $qty,
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
            'vitalite_max'      => $demon->vitalite,
            'vitalite_courante' => $demon->vitalite,
            'degats'            => $demon->degats,
            'pouvoirs'          => $pouvoirs,
        ]);
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

    private function createPnjRow(string $sessionId, string $pnjId, ?string $camp, ?string $surnom = null): void
    {
        $pnj = BolHeros::with('armes.arme')->find($pnjId);
        if (!$pnj) {
            return;
        }

        $armes = collect($pnj->armes ?? [])->map(fn($ha) => [
            'nom'    => $ha->arme?->arme,
            'degats' => $ha->arme?->degats,
            'type'   => $ha->arme?->type,
        ])->values()->toArray();

        BolFightSessionPnj::create([
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
            'heros.heros',
            'creatures.creature',
            'demons.demon',
            'pnjs.pnj',
        ];
    }
}
