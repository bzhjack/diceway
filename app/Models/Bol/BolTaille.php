<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolTaille extends Model
{
    use HasFactory;
    protected $table = 'bol_taille';
    protected $hidden = ['created_at', 'updated_at'];
}
