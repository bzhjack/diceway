<?php

namespace App\Exceptions\Bol;

use RuntimeException;

/** Levée quand on tente d'ajouter à une fight-session un héros ou un PNJ déjà présent. */
class DuplicateCombatantException extends RuntimeException
{
}
