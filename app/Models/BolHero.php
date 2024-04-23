<?php

namespace App\Models;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolHero extends Model
{
    use HasFactory, Uuids;
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
        'aura'
    ];
}
