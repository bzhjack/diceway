<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BolDesavantage extends Model
{
    use HasFactory;
    protected $table = 'bol_desavantage';
    protected $casts = [
        'de_malus' => 'boolean'
    ];
    public function regions(): BelongsToMany
    {
        return $this->belongsToMany(BolRegion::class);
    }
}
