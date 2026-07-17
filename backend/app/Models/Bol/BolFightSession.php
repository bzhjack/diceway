<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BolFightSession extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_fight_session';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'titre', 'statut'];
    protected $hidden = ['created_at', 'updated_at'];

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
}
