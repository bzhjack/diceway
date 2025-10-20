<?php

namespace App\Models\Bol;

use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BolQuest extends Model
{
    use HasFactory, Uuids;

    protected $table = 'bol_quest';
    protected $hidden = ['created_at', 'updated_at', 'user_id'];
    protected $fillable = [
        'user_id',
        'titre',
        'commentaire'
    ];

    public function protagonists(): HasMany
    {
        return $this->HasMany(BolQuestProtagonist::class, 'quest_id', 'id');
    }
}
