<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolQuest extends Model
{
    use HasFactory;
    protected $table = 'bol_quest';
    protected $hidden = ['created_at', 'updated_at'];
    protected $filable = [
    'user_id',
    'titre',
    'commentaire'
    ];
}
