<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolHerosTrait extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_trait';

    protected $fillable = [
        "heros_id",
        "type",
        "traitable_id",
        "traitable_type"
    ];

    public function traitable()
    {
        return $this->morphTo();
    }

}
