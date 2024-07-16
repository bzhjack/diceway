<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolHerosTrait extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_trait';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        "heros_id",
        "type",
        "traitable_id",
        "traitable_type",
        "detail",
        "region_id"
    ];

    public function traitable()
    {
        return $this->morphTo();
    }

}
