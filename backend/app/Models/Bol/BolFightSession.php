<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BolFightSession extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_fight_session';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'compagnie_id', 'titre', 'statut', 'positions_jetons', 'scene_id', 'scenario_id', 'scenes_jouees', 'chapitres_quittes', 'jouee_le', 'etat_combat'];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = ['positions_jetons' => 'array', 'scenes_jouees' => 'array', 'chapitres_quittes' => 'array', 'jouee_le' => 'datetime', 'etat_combat' => 'array'];

    /**
     * Une table qui passe d'un chapitre à un autre (« Changer de chapitre », ou une scène d'un autre chapitre chargée) a fini le premier :
     * il compte désormais comme joué. Passer en partie improvisée ne finit rien.
     */
    protected static function booted(): void
    {
        static::updating(function (BolFightSession $session) {
            $quitte = $session->getOriginal('scenario_id');
            if (!$session->isDirty('scenario_id') || $quitte === null || $session->scenario_id === null) {
                return;
            }
            $session->chapitres_quittes = array_values(array_unique([...($session->chapitres_quittes ?? []), (string) $quitte]));
        });
    }

    public function compagnie(): BelongsTo
    {
        return $this->belongsTo(BolCompagnie::class, 'compagnie_id', 'id');
    }

    /**
     * La partie peut-elle passer sur ce chapitre ? Elle reste sur son scénario ; improvisée, elle en prend un, sauf si sa compagnie le joue
     * déjà dans une autre partie.
     */
    public function peutPasserSur(?string $chapitreId): bool
    {
        if (!BolScenario::dansLeScenario($this->scenario_id, $chapitreId)) {
            return false;
        }

        return $this->scenario_id !== null || $this->compagnie?->partieSurLeScenario($chapitreId) === null;
    }

    public function heros(): HasMany
    {
        return $this->hasMany(BolFightSessionHeros::class, 'fight_session_id', 'id');
    }

    public function creatures(): HasMany
    {
        return $this->hasMany(BolFightSessionCreature::class, 'fight_session_id', 'id');
    }

    public function demons(): HasMany
    {
        return $this->hasMany(BolFightSessionDemon::class, 'fight_session_id', 'id');
    }

    public function pnjs(): HasMany
    {
        return $this->hasMany(BolFightSessionPnj::class, 'fight_session_id', 'id');
    }

    /** Scène courante de la session (dernière scène chargée ou enregistrée) — null si aucune. */
    public function scene(): BelongsTo
    {
        return $this->belongsTo(BolScene::class, 'scene_id', 'id');
    }
}
