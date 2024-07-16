<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolArme extends Model
{
    use HasFactory;

    protected $table = 'bol_arme';
    protected $hidden = ['created_at', 'updated_at'];
}
