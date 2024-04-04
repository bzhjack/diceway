<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolRegion extends Model
{
    use HasFactory;
    protected $fillable = ['name']; // Spécifiez les colonnes que vous voulez rendre accessibles en écriture
}
