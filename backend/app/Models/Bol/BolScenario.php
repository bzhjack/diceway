<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un chapitre, au sens des écrans : son nom (`titre`), son numéro dans son scénario (0 pour l'introduction, null sans numéro) et son
 * scénario (`saga_id`, null pour un one shot). */
class BolScenario extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_scenario';
    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = ['user_id', 'saga_id', 'numero', 'titre', 'pitch'];
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = ['numero' => 'integer'];

    public function saga(): BelongsTo
    {
        return $this->belongsTo(BolSaga::class, 'saga_id', 'id');
    }
}
