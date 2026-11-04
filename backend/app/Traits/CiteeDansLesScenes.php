<?php

namespace App\Traits;

use App\Models\Bol\BolImportRef;
use App\Models\Bol\BolScene;

/**
 * Une fiche qu'une scène peut citer dans sa distribution, et qu'un import peut avoir créée : ces références sont des identifiants sans clé
 * étrangère (JSON pour l'une, table polymorphe pour l'autre), la fiche les retire en partant. Une table où elle est posée garde sa copie.
 * Le modèle dit sous quel nom ces références la citent (`KIND_DE_SCENE`).
 */
trait CiteeDansLesScenes
{
    protected static function bootCiteeDansLesScenes(): void
    {
        static::deleted(function (self $fiche): void {
            BolImportRef::where('entity_kind', self::KIND_DE_SCENE)->where('entity_id', $fiche->id)->delete();

            BolScene::where('user_id', $fiche->user_id)->get(['id', 'distribution'])->each(function (BolScene $scene) use ($fiche): void {
                $restants = array_values(array_filter(
                    $scene->distribution ?? [],
                    fn (array $entree) => ($entree['kind'] ?? null) !== self::KIND_DE_SCENE || ($entree['source_id'] ?? null) !== $fiche->id,
                ));
                if (count($restants) !== count($scene->distribution ?? [])) {
                    $scene->update(['distribution' => $restants]);
                }
            });
        });
    }
}
