<?php

namespace App\Http\Services\Bol;

/**
 * Le titre d'un chapitre écrit d'un seul tenant, comme dans les fichiers d'import et à la création d'un chapitre à la table : « Perle du
 * Beshaar — 1. Sacrilège à Satarla ». Il se découpe en son scénario (« Perle du Beshaar »), son numéro (0 pour l'introduction, null sans
 * numéro) et son nom ; sans tiret cadratin, pas de scénario (le chapitre ira dans un scénario de son nom). `recomposer` fait l'inverse.
 */
final class BolTitreChapitre
{
    private const SEPARATEUR = ' — ';

    /** @return array{saga: ?string, numero: ?int, titre: string} */
    public static function decouper(string $titre): array
    {
        $titre = trim($titre);
        $coupe = mb_strpos($titre, self::SEPARATEUR);
        if ($coupe === false) {
            return ['saga' => null, 'numero' => null, 'titre' => $titre];
        }
        $saga = trim(mb_substr($titre, 0, $coupe));
        $libelle = trim(mb_substr($titre, $coupe + mb_strlen(self::SEPARATEUR)));
        if ($saga === '' || $libelle === '') {
            return ['saga' => null, 'numero' => null, 'titre' => $titre];
        }

        if (preg_match('/^introduction\s*(?::\s*(.*))?$/iu', $libelle, $intro) === 1) {
            $nom = trim($intro[1] ?? '');
            return ['saga' => $saga, 'numero' => 0, 'titre' => $nom !== '' ? $nom : $libelle];
        }
        if (preg_match('/^(\d+)\.\s*(.+)$/u', $libelle, $numero) === 1) {
            return ['saga' => $saga, 'numero' => (int) $numero[1], 'titre' => trim($numero[2])];
        }

        return ['saga' => $saga, 'numero' => null, 'titre' => $libelle];
    }

    /** Le chapitre tel que les écrans le nomment : « 1. Sacrilège à Satarla », « Introduction : La colère de Nemmereth », ou son nom seul. */
    public static function libelle(?int $numero, string $titre): string
    {
        return match (true) {
            $numero === null => $titre,
            $numero === 0    => mb_strtolower($titre) === 'introduction' ? $titre : "Introduction : $titre",
            default          => "$numero. $titre",
        };
    }

    /** Le titre d'un seul tenant : « Perle du Beshaar — 1. Sacrilège à Satarla », ou le nom seul sans scénario. */
    public static function recomposer(?string $saga, ?int $numero, string $titre): string
    {
        return $saga === null ? $titre : $saga . self::SEPARATEUR . self::libelle($numero, $titre);
    }
}
