<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BolQuestProtagonist extends Model
{
    use HasFactory;

    protected $table = 'bol_quest_protagonist';
    protected $hidden = ['created_at', 'updated_at'];

    protected $fillable = [
        "quest_id",
        "type",
        "protagonist_id",
        "protagonist_type"
    ];


    public function protagonist()
    {
        return $this->morphTo();
    }

}
