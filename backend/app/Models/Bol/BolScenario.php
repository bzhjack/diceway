<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BolScenario extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_scenario';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'titre', 'pitch'];
    protected $hidden = ['created_at', 'updated_at'];

    public function pj(): HasMany
    {
        return $this->hasMany(BolScenarioPj::class, 'scenario_id', 'id');
    }

    public function creatures(): HasMany
    {
        return $this->hasMany(BolScenarioCreature::class, 'scenario_id', 'id');
    }

    public function demons(): HasMany
    {
        return $this->hasMany(BolScenarioDemon::class, 'scenario_id', 'id');
    }

    public function pnjs(): HasMany
    {
        return $this->hasMany(BolScenarioPnj::class, 'scenario_id', 'id');
    }
}
