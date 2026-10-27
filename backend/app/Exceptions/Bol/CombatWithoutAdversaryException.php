<?php

namespace App\Exceptions\Bol;

use RuntimeException;

/** Levée quand on tente de démarrer un combat sans aucun adversaire : la table n'a que des héros et leurs alliés, ou tous les adversaires
 * sont exclus de ce combat. */
class CombatWithoutAdversaryException extends RuntimeException
{
}
