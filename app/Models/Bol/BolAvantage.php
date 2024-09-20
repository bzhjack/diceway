<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BolAvantage extends Model
{
    use HasFactory;

    protected $table = 'bol_avantage';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'de_bonus' => 'boolean',
        'id' => 'integer',
        'attribut_bonus' => 'integer'
    ];

    public function regions(): BelongsToMany
    {
        return $this->belongsToMany(BolRegion::class);
    }

    public function bolHerosTrait()
    {
        return $this->morphMany(BolHerosTrait::class, 'traitable');
    }
}
