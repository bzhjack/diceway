<?php

namespace App\Http\Services\Bol;

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

    public function deleteSession(string $id, string $userId): bool
    {
        return (bool) BolFightSession::where('id', $id)->where('user_id', $userId)->delete();
    }

    private function syncHeros(string $sessionId, array $list): void
    {
        BolFightSessionHeros::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $hero = BolHeros::find($item['heroId'] ?? null);
            if (!$hero) {
                continue;
            }

            BolFightSessionHeros::create([
                'fight_session_id' => $sessionId,
                'heros_id'         => $hero->id,
                'camp'             => $this->normalizeCamp($item['camp'] ?? null),
            ]);
        }
    }

    private function syncCreatures(string $sessionId, array $list): void
    {
        BolFightSessionCreature::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $creature = BolCreature::with('capacites.capacite')->find($item['creatureId'] ?? null);
            if (!$creature) {
                continue;
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
                'camp'              => $this->normalizeCamp($item['camp'] ?? null),
                'qty'               => $this->normalizeQty($item['qty'] ?? 1),
                'surnom'            => $item['surnom'] ?? null,
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
    }

    private function syncDemons(string $sessionId, array $list): void
    {
        BolFightSessionDemon::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $demon = BolDemon::with('pouvoirs.pouvoir')->find($item['demonId'] ?? null);
            if (!$demon) {
                continue;
            }

            $pouvoirs = collect($demon->pouvoirs ?? [])->map(fn($p) => [
                'pouvoir_id' => $p->pouvoir_id,
                'pouvoir'    => $p->pouvoir?->pouvoir,
                'detail'     => $p->detail,
            ])->values()->toArray();

            BolFightSessionDemon::create([
                'fight_session_id'  => $sessionId,
                'demon_id'          => $demon->id,
                'camp'              => $this->normalizeCamp($item['camp'] ?? null),
                'qty'               => $this->normalizeQty($item['qty'] ?? 1),
                'surnom'            => $item['surnom'] ?? null,
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
    }

    private function syncPnjs(string $sessionId, array $list): void
    {
        BolFightSessionPnj::where('fight_session_id', $sessionId)->delete();
        foreach ($list as $item) {
            $pnj = BolHeros::with('armes.arme')->find($item['pnjId'] ?? null);
            if (!$pnj) {
                continue;
            }

            $armes = collect($pnj->armes ?? [])->map(fn($ha) => [
                'nom'    => $ha->arme?->arme,
                'degats' => $ha->arme?->degats,
                'type'   => $ha->arme?->type,
            ])->values()->toArray();

            BolFightSessionPnj::create([
                'fight_session_id'  => $sessionId,
                'pnj_id'            => $pnj->id,
                'camp'              => $this->normalizeCamp($item['camp'] ?? null),
                'surnom'            => $item['surnom'] ?? null,
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
