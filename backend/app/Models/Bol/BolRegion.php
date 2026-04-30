<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BolRegion extends Model
{
    use HasFactory;

    protected $table = 'bol_region';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = ['region', 'description', 'langue_native_id', 'premiere_carriere_id', 'carrieres_requises', 'carrieres_interdites'];
    protected $casts = [
        'id' => 'integer',
        'langue_native_id' => 'integer',
        'premiere_carriere_id' => 'integer',
        'carrieres_requises' => 'array',
        'carrieres_interdites' => 'array',
    ];

    public function langueNative(): BelongsTo
    {
        return $this->belongsTo(BolLangue::class, 'langue_native_id');
    }

    public function premiereCarriere(): BelongsTo
    {
        return $this->belongsTo(BolCarriere::class, 'premiere_carriere_id');
    }

    // Avantages liés à la région
    public function avantages(): BelongsToMany
    {
        return $this->belongsToMany(BolAvantage::class, 'bol_region_avantage', 'region_id', 'avantage_id')->withPivot('detail');
    }

    // Désavantages liés à la région
    public function desavantages(): BelongsToMany
    {
        return $this->belongsToMany(BolDesavantage::class, 'bol_region_desavantage', 'region_id', 'desavantage_id')->withPivot('detail');
    }

    // Noms liés à la région
    public function noms(): HasMany
    {
        return $this->hasMany(BolRegionNom::class, 'region_id', 'id');
    }
}
