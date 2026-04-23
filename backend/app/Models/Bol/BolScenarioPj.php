<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolScenarioPj extends Model
{
    protected $table = 'bol_scenario_heros';
    public $timestamps = false;

    protected $fillable = ['scenario_id', 'heros_id'];

    public function heros(): BelongsTo
    {
        return $this->belongsTo(BolHeros::class, 'heros_id', 'id');
    }
}
