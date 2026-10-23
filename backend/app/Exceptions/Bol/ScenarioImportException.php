<?php

namespace App\Exceptions\Bol;

use RuntimeException;

/** Levée quand un fichier d'import de scénario est refusé : toutes les erreurs relevées, chacune avec son chemin. */
class ScenarioImportException extends RuntimeException
{
    /** @param list<string> $errors */
    public function __construct(public readonly array $errors)
    {
        parent::__construct(count($errors) . " erreur(s) dans le fichier d'import.");
    }
}
