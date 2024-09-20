<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolDemonPouvoir extends Model
{
    use HasFactory;

    protected $table = 'bol_demon_pouvoir';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        "demon_id",
        "pouvoir_id",
        "detail"
    ];

    protected $casts = [
        'id' => 'integer',
        'pouvoir_id' => 'integer'
    ];

    public function pouvoir(): HasOne
    {
        return $this->HasOne(BolPouvoir::class, 'id', 'pouvoir_id');
    }
}
