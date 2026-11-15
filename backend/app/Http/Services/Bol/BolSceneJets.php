<?php

namespace App\Http\Services\Bol;

/**
 * Les jets d'une scène (fonctions pures, sans base) : ce que le MJ fait lancer pendant la scène, hors combat. Un jet porte un titre,
 * zéro, un ou deux attributs (Vigueur, Agilité, Esprit, Aura — jamais Mêlée, Tir ni Défense : les combats ont leur écran ; aucun pour un
 * effet automatique), une difficulté de l'échelle du livre, et des textes facultatifs : l'enjeu, l'échec, la réussite, la carrière qui
 * aide, le moment.
 */
final class BolSceneJets
{
    public const ATTRIBUTS = ['vigueur', 'agilite', 'esprit', 'aura'];

    /** L'échelle du livre (`doc/bol/rules/02-actions-combat.md`) : slug → modificateur. */
    public const DIFFICULTES = [
        'tres-facile'    => 2,
        'facile'         => 1,
        'moyenne'        => 0,
        'ardue'          => -1,
        'difficile'      => -2,
        'tres-difficile' => -4,
        'impossible'     => -6,
        'heroique'       => -8,
    ];

    public const DIFFICULTE_PAR_DEFAUT = 'moyenne';

    public const ATTRIBUTS_MAX = 2;

    public const JETS_MAX = 20;

    public const TITRE_MAX = 120;

    public const TEXTE_MAX = 300;

    /** Les textes facultatifs d'un jet, dans l'ordre où ils sont rendus. */
    public const TEXTES = ['enjeu', 'echec', 'reussite', 'carriere', 'quand'];

    /**
     * Les jets nettoyés : textes rognés et bornés (vides → null), jets sans titre retirés, attributs inconnus retirés et dédoublonnés,
     * deux au plus, difficulté inconnue ou absente → Moyenne, vingt jets au plus. Chaque jet a toutes ses clés.
     *
     * @param array<int, mixed>|null $jets
     * @return array<int, array{titre: string, attributs: array<int, string>, difficulte: string, enjeu: string|null, echec: string|null, reussite: string|null, carriere: string|null, quand: string|null}>|null
     *     null s'il ne reste aucun jet
     */
    public static function nettoyer(?array $jets): ?array
    {
        $result = [];
        foreach ($jets ?? [] as $jet) {
            if (!is_array($jet)) {
                continue;
            }
            $titre = self::texte($jet['titre'] ?? null, self::TITRE_MAX);
            if ($titre === null) {
                continue;
            }
            $difficulte = $jet['difficulte'] ?? null;
            $propre = [
                'titre'      => $titre,
                'attributs'  => self::attributs($jet['attributs'] ?? null),
                'difficulte' => is_string($difficulte) && array_key_exists($difficulte, self::DIFFICULTES) ? $difficulte : self::DIFFICULTE_PAR_DEFAUT,
            ];
            foreach (self::TEXTES as $cle) {
                $propre[$cle] = self::texte($jet[$cle] ?? null, self::TEXTE_MAX);
            }
            $result[] = $propre;
            if (count($result) === self::JETS_MAX) {
                break;
            }
        }

        return $result === [] ? null : $result;
    }

    /** @return array<int, string> */
    private static function attributs(mixed $attributs): array
    {
        $gardes = [];
        foreach (is_array($attributs) ? $attributs : [] as $attribut) {
            if (is_string($attribut) && in_array($attribut, self::ATTRIBUTS, true) && !in_array($attribut, $gardes, true)) {
                $gardes[] = $attribut;
            }
        }

        return array_slice($gardes, 0, self::ATTRIBUTS_MAX);
    }

    private static function texte(mixed $valeur, int $max): ?string
    {
        $texte = is_scalar($valeur) ? trim((string) $valeur) : '';

        return $texte === '' ? null : mb_substr($texte, 0, $max);
    }
}
