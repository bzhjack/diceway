<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BolHerosLangue extends Model
{
    use HasFactory;

    protected $table = 'bol_heros_langue';
    protected $hidden = ['created_at', 'updated_at'];
    protected $fillable = [
        "heros_id",
        "langue_id"
    ];

    public function langue(): HasOne
    {
        return $this->HasOne(BolLangue::class, 'id', 'langue_id');
    }
}
