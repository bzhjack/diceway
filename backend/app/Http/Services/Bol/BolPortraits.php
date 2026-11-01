<?php

namespace App\Http\Services\Bol;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Les portraits des fiches sont des fichiers nommés par l'empreinte de leur contenu, qu'un navigateur garde en cache sans limite. Une fiche
 * n'en retient que l'adresse relative (`/api/bol/portraits/<empreinte>.<extension>`). Une image ne s'écrit qu'une fois, même portée par
 * plusieurs fiches. Il ne s'efface pas quand une fiche disparaît ou change de portrait, puisqu'une autre le porte peut-être :
 * `bol:prune-portraits` retire ceux que plus personne ne porte.
 */
final class BolPortraits
{
    public const ROUTE = '/api/bol/portraits/';

    /** Le nom d'un fichier, pour la route. */
    public const FILE_PATTERN = '[0-9a-f]{64}\.(?:png|jpg|webp|gif)';

    /** Les tables dont les fiches ont un portrait. */
    public const TABLES = ['bol_heros', 'bol_creature', 'bol_demon'];

    private const DIRECTORY = 'portraits/';

    /** Un fichier plus jeune n'est pas orphelin : il attend peut-être que sa fiche s'enregistre. */
    private const ORPHAN_AFTER_HOURS = 24;

    private const TYPES = [
        IMAGETYPE_PNG => ['png', 'image/png'],
        IMAGETYPE_JPEG => ['jpg', 'image/jpeg'],
        IMAGETYPE_WEBP => ['webp', 'image/webp'],
        IMAGETYPE_GIF => ['gif', 'image/gif'],
    ];

    /**
     * Ce qu'une fiche garde du portrait qu'on lui donne. Une image envoyée devient un fichier ; une de nos adresses revient du navigateur
     * avec le domaine de l'API, qu'on retire ; le reste ne change pas (`/assets/…`, adresses externes, anciens portraits en base64, et une
     * image illisible ou impossible à écrire : le portrait n'est jamais perdu).
     */
    public static function normalize(?string $avatar): ?string
    {
        if ($avatar === null) {
            return null;
        }
        if (str_starts_with($avatar, 'data:image/')) {
            return self::store($avatar) ?? $avatar;
        }
        if (preg_match('~^(?:https?://[^/]+)?(' . preg_quote(self::ROUTE, '~') . self::FILE_PATTERN . ')$~', $avatar, $match)) {
            return $match[1];
        }

        return $avatar;
    }

    /** Écrit une image reçue en `data:` et rend son adresse, ou `null` si ce n'est pas une image en base64 d'un type connu, ou si l'écriture échoue. */
    public static function store(string $dataUrl): ?string
    {
        $image = self::decode($dataUrl);
        if ($image === null) {
            return null;
        }

        $disk = Storage::disk('public');
        $path = self::DIRECTORY . $image['file'];
        if (! $disk->exists($path) && ! $disk->put($path, $image['bytes'])) {
            return null;
        }

        return self::ROUTE . $image['file'];
    }

    /** L'adresse qu'aurait cette image une fois écrite, sans rien écrire. */
    public static function urlOf(string $dataUrl): ?string
    {
        $image = self::decode($dataUrl);

        return $image === null ? null : self::ROUTE . $image['file'];
    }

    /** Le chemin du fichier et son type, ou `null` s'il n'existe pas. */
    public static function locate(string $file): ?array
    {
        $disk = Storage::disk('public');
        $path = self::DIRECTORY . $file;
        if (! $disk->exists($path)) {
            return null;
        }
        $extension = pathinfo($file, PATHINFO_EXTENSION);
        foreach (self::TYPES as [$known, $mime]) {
            if ($known === $extension) {
                return ['path' => $disk->path($path), 'mime' => $mime];
            }
        }

        return null;
    }

    /**
     * Les fichiers de portraits qu'aucune fiche ne porte plus.
     *
     * @return list<array{path: string, size: int}>
     */
    public static function orphans(): array
    {
        $used = [];
        foreach (self::TABLES as $table) {
            foreach (DB::table($table)->where('avatar', 'like', self::ROUTE . '%')->pluck('avatar') as $url) {
                $used[basename($url)] = true;
            }
        }

        $disk = Storage::disk('public');
        $before = now()->subHours(self::ORPHAN_AFTER_HOURS)->getTimestamp();
        $orphans = [];
        foreach ($disk->files(rtrim(self::DIRECTORY, '/')) as $path) {
            $file = basename($path);
            if (preg_match('/^' . self::FILE_PATTERN . '$/', $file) && ! isset($used[$file]) && $disk->lastModified($path) < $before) {
                $orphans[] = ['path' => $path, 'size' => $disk->size($path)];
            }
        }

        return $orphans;
    }

    public static function delete(string $path): void
    {
        Storage::disk('public')->delete($path);
    }

    /** @return array{bytes: string, file: string}|null */
    private static function decode(string $dataUrl): ?array
    {
        $comma = strpos($dataUrl, ',');
        if ($comma === false || ! str_ends_with(substr($dataUrl, 0, $comma), ';base64')) {
            return null;
        }
        $bytes = base64_decode(substr($dataUrl, $comma + 1), true);
        if ($bytes === false || $bytes === '') {
            return null;
        }
        // Le type vient du contenu, pas de ce qu'annonce l'envoi : un SVG, qui peut porter du script, n'est pas une image reconnue ici.
        $size = @getimagesizefromstring($bytes);
        $type = $size === false ? null : (self::TYPES[$size[2]] ?? null);
        if ($type === null) {
            return null;
        }

        return ['bytes' => $bytes, 'file' => hash('sha256', $bytes) . '.' . $type[0]];
    }
}
