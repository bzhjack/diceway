<?php

namespace App\Http\Services\Bol;

/**
 * Fonctions pures (sans base) autour de la préparation d'une scène : les valeurs permises de son
 * ambiance, ses pistes nettoyées, et la liste des scènes déjà jouées d'une session.
 */
final class BolScenePreparation
{
    public const MOMENTS = ['aube', 'jour', 'crepuscule', 'nuit'];

    public const METEOS = ['clair', 'couvert', 'pluie', 'brume', 'vent', 'orage', 'cendres'];

    public const PISTES_MAX = 8;

    public const PISTE_TEXTE_MAX = 200;

    public const JOUEES_MAX = 100;

    /**
     * Pistes d'une scène, nettoyées : texte rogné et borné, pistes vides retirées, huit au plus. Une
     * piste ne garde son lien que vers une scène de `$sceneIds` (les autres scènes de son scénario).
     *
     * @param array<int, mixed>|null $pistes
     * @param array<int, string>     $sceneIds
     * @return array<int, array{texte: string, scene_id: string|null}>|null null s'il ne reste aucune piste
     */
    public static function pistes(?array $pistes, array $sceneIds): ?array
    {
        $result = [];
        foreach ($pistes ?? [] as $piste) {
            $texte = trim((string) (is_array($piste) ? ($piste['texte'] ?? '') : ''));
            if ($texte === '') {
                continue;
            }
            $sceneId = is_array($piste) && isset($piste['scene_id']) ? (string) $piste['scene_id'] : null;
            $result[] = [
                'texte'    => mb_substr($texte, 0, self::PISTE_TEXTE_MAX),
                'scene_id' => $sceneId !== null && in_array($sceneId, $sceneIds, true) ? $sceneId : null,
            ];
            if (count($result) === self::PISTES_MAX) {
                break;
            }
        }

        return $result === [] ? null : $result;
    }

    /**
     * Scènes jouées d'une session après qu'une scène est devenue courante : ajoutée une seule fois,
     * dans l'ordre d'arrivée ; seules les cent dernières sont gardées.
     *
     * @param array<int, string>|null $played
     * @return array<int, string>
     */
    public static function played(?array $played, string $sceneId): array
    {
        $result = array_values($played ?? []);
        if (!in_array($sceneId, $result, true)) {
            $result[] = $sceneId;
        }

        return array_slice($result, -self::JOUEES_MAX);
    }
}
