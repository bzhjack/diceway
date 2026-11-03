<?php

namespace App\Exceptions\Bol;

use RuntimeException;

/** Levée quand un PNJ ne peut pas prendre la « Fuite opportune » : la table n'est pas en combat, ce n'est pas un rival adverse, il n'a plus
 * de vilénie ou il a déjà quitté ce combat. Le message est montré au MJ. */
class FuiteImpossibleException extends RuntimeException
{
}
