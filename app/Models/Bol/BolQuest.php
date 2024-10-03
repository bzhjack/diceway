<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolQuest extends Model
{
    use HasFactory, Uuids;
    protected $table = 'bol_quest';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
    'user_id',
    'titre',
    'commentaire'
    ];
}
