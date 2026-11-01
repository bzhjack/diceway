<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolPortraits;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/** Sert un portrait. Publique : une balise `<img>` n'envoie pas de jeton, et l'adresse ne se devine pas, c'est l'empreinte de l'image. */
class BolPortraitController extends Controller
{
    public function show(string $file): BinaryFileResponse
    {
        $portrait = BolPortraits::locate($file);
        abort_if($portrait === null, 404);

        // Le nom change avec le contenu : le fichier ne change jamais, le navigateur peut le garder.
        return response()->file($portrait['path'], [
            'Content-Type' => $portrait['mime'],
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
