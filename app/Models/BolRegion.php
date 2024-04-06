<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BolRegion extends Model
{
    use HasFactory;
    protected $fillable = ['name']; // Spécifiez les colonnes que vous voulez rendre accessibles en écriture

    // Avantages liés à la région
    public function avantages(): BelongsToMany
    {
        return $this->belongsToMany(BolAvantage::class, 'bol_region_avantages', 'region_id', 'avantage_id');
    }
    
    // Désavantages liés à la région
    public function desavantages(): BelongsToMany
    {
        return $this->belongsToMany(BolDesavantage::class, 'bol_region_desavantages', 'region_id', 'desavantage_id');
    }
}
