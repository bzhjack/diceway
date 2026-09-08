<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHerosArmure extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_armure';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        "heros_id",
        "armure_id",
        "equipee",
    ];
    protected $casts = [
        'id' => 'integer',
        'armure_id' => 'integer',
        'equipee' => 'boolean',
    ];

    public function armure(): HasOne
    {
        return $this->HasOne(BolArmure::class, 'id', 'armure_id');
    }
}
