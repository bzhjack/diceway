<?php

namespace App\Http\Services\Bol;

/** Le cache des listes : une clé par compte dès que la liste contient ses créations. */
final class BolCache
{
    /** Une heure, en secondes : l'unité de Laravel. */
    public const TTL = 3600;

    public static function creatures(string $userId): string
    {
        return "bol_creatures_{$userId}";
    }

    public static function demons(string $userId): string
    {
        return "bol_demons_{$userId}";
    }

    public static function armes(string $userId): string
    {
        return "bol_armes_all_{$userId}";
    }

    public static function armures(string $userId): string
    {
        return "bol_armures_all_{$userId}";
    }
}
