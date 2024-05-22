<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BolAvantage extends Model
{
    use HasFactory;
    protected $table = 'bol_avantage';
    protected $casts = [
        'de_bonus' => 'boolean'
    ];
    public function regions(): BelongsToMany
    {
        return $this->belongsToMany(BolRegion::class);
    }
}
