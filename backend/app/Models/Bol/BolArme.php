<?php

namespace App\Models\Bol;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolArme extends Model
{
    use HasFactory, AccessibleToUser;

    protected $table = 'bol_arme';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        'user_id',
        'arme',
        'type',
        'degats',
        'portee',
        'notes',
        'deux_mains',
        'ignore_bouclier',
        'non_letal',
        'rechargement',
    ];
    protected $casts = [
        'id' => 'integer',
        'deux_mains' => 'boolean',
        'ignore_bouclier' => 'boolean',
        'non_letal' => 'boolean',
        'rechargement' => 'integer',
    ];
}
