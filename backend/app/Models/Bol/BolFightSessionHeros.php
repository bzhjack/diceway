<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BolFightSessionHeros extends Model
{
    protected $table = 'bol_fight_session_heros';
    public $timestamps = false;

    protected $fillable = ['fight_session_id', 'heros_id', 'camp'];

    public function heros(): BelongsTo
    {
        return $this->belongsTo(BolHeros::class, 'heros_id', 'id');
    }
}
