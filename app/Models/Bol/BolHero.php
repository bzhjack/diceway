<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolHero extends Model
{
    use HasFactory, Uuids;
    protected $table = 'bol_hero';
    public $incrementing = false;
    protected $keyType = 'uuid';
    protected $hidden = ['user_id'];

    protected $fillable = [
        'user_id',
        'joueur',
        'nom',
        'vigueur',
        'agilite',
        'esprit',
        'aura',
        'initiative',
        'melee',
        'tir',
        'defense',
        'avatar',
        'region_id',
        'region'
    ];
}
