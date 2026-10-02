<?php

namespace App\Exceptions\Bol;

use RuntimeException;

/** Levée quand on tente de charger une scène dans une session qui n'est pas en mode libre. */
class SceneLoadNotAllowedException extends RuntimeException
{
}
