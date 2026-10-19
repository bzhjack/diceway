<?php

namespace App\Models\Bol;

use Illuminate\Database\Eloquent\Model;

/** Une entité créée par un import de scénario, retrouvée par sa saga, son type et sa clé dans le fichier. */
class BolImportRef extends Model
{
    public const TYPE_SCENARIO = 'scenario';
    public const TYPE_SCENE = 'scene';
    public const TYPE_PERSONNAGE = 'personnage';

    protected $table = 'bol_import_ref';

    protected $fillable = ['user_id', 'saga', 'type', 'cle', 'entity_kind', 'entity_id'];

    protected $hidden = ['created_at', 'updated_at'];
}
