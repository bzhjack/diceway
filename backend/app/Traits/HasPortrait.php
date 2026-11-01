<?php

namespace App\Traits;

use App\Http\Services\Bol\BolPortraits;
use Illuminate\Database\Eloquent\Casts\Attribute;

/** Une fiche avec un portrait : écrire `avatar`, d'où que vienne la valeur (formulaire, import…), en fait un fichier. */
trait HasPortrait
{
    protected function avatar(): Attribute
    {
        return Attribute::make(set: fn (?string $value) => BolPortraits::normalize($value));
    }
}
