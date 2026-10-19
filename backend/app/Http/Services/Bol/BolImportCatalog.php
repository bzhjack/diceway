<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolCapacite;
use App\Models\Bol\BolCarriere;
use App\Models\Bol\BolCategorie;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolPouvoir;
use App\Models\Bol\BolRegion;
use App\Models\Bol\BolTaille;

/**
 * Les noms du catalogue qu'un fichier d'import peut citer, chacun avec son id : régions, carrières, armes et
 * armures publiques, avantages, désavantages, capacités, pouvoirs, tailles, catégories de démon, et les
 * PNJ, créatures et démons publics. Les noms se comparent sans casse ni espaces superflus, apostrophes
 * typographiques confondues.
 */
final class BolImportCatalog
{
    /** @var array<string, array<string, int|string>> liste → nom normalisé → id */
    private array $maps;

    /** @param array<string, array<string, int|string>> $lists liste → nom → id */
    public function __construct(array $lists)
    {
        $this->maps = [];
        foreach ($lists as $list => $names) {
            foreach ($names as $name => $id) {
                // Le premier nom l'emporte si le catalogue a des doublons.
                $this->maps[$list][self::normalize((string) $name)] ??= $id;
            }
        }
    }

    public static function fromDatabase(): self
    {
        return new self([
            'region'       => BolRegion::pluck('id', 'region')->all(),
            'carriere'     => BolCarriere::pluck('id', 'carriere')->all(),
            'arme'         => BolArme::whereNull('user_id')->pluck('id', 'arme')->all(),
            'armure'       => BolArmure::whereNull('user_id')->pluck('id', 'armure')->all(),
            'avantage'     => BolAvantage::pluck('id', 'avantage')->all(),
            'desavantage'  => BolDesavantage::pluck('id', 'desavantage')->all(),
            'capacite'     => BolCapacite::pluck('id', 'capacite')->all(),
            'pouvoir'      => BolPouvoir::pluck('id', 'pouvoir')->all(),
            'taille'       => BolTaille::pluck('id', 'taille')->all(),
            'categorie'    => BolCategorie::pluck('id', 'categorie')->all(),
            'pnj'          => BolHeros::whereNull('user_id')->where('type', '!=', 'H')->pluck('id', 'nom')->all(),
            'creature'     => BolCreature::whereNull('user_id')->pluck('id', 'nom')->all(),
            'demon'        => BolDemon::whereNull('user_id')->pluck('id', 'nom')->all(),
        ]);
    }

    /** L'id du nom dans la liste, ou null s'il n'y est pas. */
    public function find(string $list, string $name): int|string|null
    {
        return $this->maps[$list][self::normalize($name)] ?? null;
    }

    public static function normalize(string $name): string
    {
        $name = str_replace(['’', 'ʼ'], "'", $name);

        return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', $name)));
    }
}
