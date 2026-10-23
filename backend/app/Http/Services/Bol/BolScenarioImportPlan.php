<?php

namespace App\Http\Services\Bol;

use App\Exceptions\Bol\ScenarioImportException;

/**
 * Le contenu d'un fichier d'import de scénario, contrôlé et résolu sans toucher à la base : chaque nom du
 * catalogue (région, carrière, arme…) devient un id, chaque valeur est bornée comme à la saisie. Toutes les
 * erreurs sont relevées d'un coup, avec leur chemin dans le fichier. Format : `doc/scenarios/format-import.md`.
 */
final class BolScenarioImportPlan
{
    public const QTY_MAX = 30;

    private const CLE = '/^[a-z0-9][a-z0-9_-]{0,59}$/';

    private const RANGS_PNJ = ['rival' => 'R', 'coriace' => 'C', 'pietaille' => 'P', 'piétaille' => 'P'];

    /** @var list<string> */
    private array $errors = [];

    public string $saga = '';

    /** @var array{cle: string, titre: string, pitch: string|null} */
    public array $scenario = ['cle' => '', 'titre' => '', 'pitch' => null];

    /**
     * Personnages définis par le fichier, par clé. Une référence au catalogue n'a que `kind` et
     * `catalogue_id` ; une fiche a ses champs (`fields`) et ses listes liées.
     *
     * @var array<string, array<string, mixed>>
     */
    public array $personnages = [];

    /** @var list<string> clés citées par une distribution sans être définies ici : un autre fichier de la saga les a créées */
    public array $externes = [];

    /**
     * Scènes dans l'ordre du fichier : `cle`, `fields` (colonnes de `bol_scene`), `pistes` (`texte`, `vers`) et
     * `distribution` (`perso`, `qty`, `camp`, `attitude`).
     *
     * @var list<array<string, mixed>>
     */
    public array $scenes = [];

    private function __construct(private readonly BolImportCatalog $catalog) {}

    /**
     * @param array<string, mixed> $data le fichier décodé
     * @throws ScenarioImportException avec toutes les erreurs relevées
     */
    public static function fromArray(array $data, BolImportCatalog $catalog): self
    {
        $plan = new self($catalog);
        $plan->read($data);
        if ($plan->errors !== []) {
            throw new ScenarioImportException($plan->errors);
        }

        return $plan;
    }

    /** @param array<string, mixed> $data */
    private function read(array $data): void
    {
        $saga = $data['saga'] ?? null;
        if (!is_string($saga) || !preg_match(self::CLE, $saga)) {
            $this->error('saga', 'obligatoire, en minuscules, chiffres et tirets (60 caractères au plus)');
        } else {
            $this->saga = $saga;
        }

        $scenario = $this->object($data, 'scenario', 'scenario');
        $this->scenario = [
            'cle'   => $this->cle($scenario, 'cle', 'scenario.cle') ?? '',
            'titre' => $this->text($scenario, 'titre', 'scenario.titre', 255, true) ?? '',
            'pitch' => $this->text($scenario, 'pitch', 'scenario.pitch', 10000),
        ];

        $personnages = $data['personnages'] ?? [];
        if (!is_array($personnages) || ($personnages !== [] && array_is_list($personnages))) {
            $this->error('personnages', 'doit être un objet { clé: personnage }');
            $personnages = [];
        }
        foreach ($personnages as $cle => $perso) {
            $path = "personnages.$cle";
            if (!preg_match(self::CLE, (string) $cle)) {
                $this->error($path, 'clé invalide (minuscules, chiffres, tirets, soulignés)');
                continue;
            }
            if (!is_array($perso)) {
                $this->error($path, 'doit être un objet');
                continue;
            }
            $this->personnages[(string) $cle] = $this->personnage($perso, $path);
        }

        $scenes = $data['scenes'] ?? [];
        if (!is_array($scenes) || !array_is_list($scenes)) {
            $this->error('scenes', 'doit être une liste');
            $scenes = [];
        }
        $cles = [];
        foreach ($scenes as $i => $scene) {
            $path = "scenes[$i]";
            if (!is_array($scene)) {
                $this->error($path, 'doit être un objet');
                continue;
            }
            $cle = $this->cle($scene, 'cle', "$path.cle");
            if ($cle !== null && in_array($cle, $cles, true)) {
                $this->error("$path.cle", "« $cle » est déjà la clé d'une autre scène");
            }
            $cles[] = $cle;
            $this->scenes[] = $this->scene($scene, $path, $cle ?? '');
        }

        // Les pistes ne mènent qu'à une scène du fichier : elles se vérifient une fois toutes les clés connues.
        foreach ($this->scenes as $i => $scene) {
            foreach ($scene['pistes'] as $j => $piste) {
                if ($piste['vers'] !== null && !in_array($piste['vers'], $cles, true)) {
                    $this->error("scenes[$i].pistes[$j].vers", "aucune scène de clé « {$piste['vers']} » dans ce fichier");
                }
            }
        }
    }

    /**
     * @param array<string, mixed> $perso
     * @return array<string, mixed>
     */
    private function personnage(array $perso, string $path): array
    {
        $kind = $perso['kind'] ?? null;
        if (!in_array($kind, ['pnj', 'creature', 'demon'], true)) {
            $this->error("$path.kind", 'pnj, creature ou demon');

            return ['kind' => 'pnj', 'catalogue_id' => null];
        }

        if (array_key_exists('catalogue', $perso)) {
            $nom = $this->text($perso, 'catalogue', "$path.catalogue", 255, true);

            return ['kind' => $kind, 'catalogue_id' => $nom === null ? null : $this->resolve($kind, $nom, "$path.catalogue")];
        }

        return match ($kind) {
            'pnj'      => $this->pnj($perso, $path),
            'creature' => $this->creature($perso, $path),
            'demon'    => $this->demon($perso, $path),
        };
    }

    /**
     * @param array<string, mixed> $perso
     * @return array<string, mixed>
     */
    private function pnj(array $perso, string $path): array
    {
        $rang = $perso['rang'] ?? null;
        $type = is_string($rang) ? (self::RANGS_PNJ[mb_strtolower($rang)] ?? null) : null;
        if ($type === null) {
            $this->error("$path.rang", 'rival, coriace ou pietaille');
        }
        $region = $this->text($perso, 'region', "$path.region", 255);

        $fields = [
            'type'        => $type ?? 'C',
            'nom'         => $this->text($perso, 'nom', "$path.nom", 255, true) ?? '',
            'joueur'      => 'master',
            'region_id'   => $region === null ? null : $this->resolve('region', $region, "$path.region"),
            'commentaire' => $this->text($perso, 'commentaire', "$path.commentaire", 5000),
            'vitalite'    => $this->int($perso, 'vitalite', $path, 0, 127, null),
        ];
        foreach (['vigueur', 'agilite', 'esprit', 'aura', 'initiative', 'melee', 'tir', 'defense'] as $key) {
            $fields[$key] = $this->int($perso, $key, $path, -5, 10, 0);
        }
        foreach (['heroisme', 'vilenie', 'foi', 'pouvoir'] as $key) {
            $fields[$key] = $this->int($perso, $key, $path, 0, 99, 0);
        }

        $carrieres = [];
        foreach ($this->list($perso, 'carrieres', $path) as $i => $carriere) {
            $at = "$path.carrieres[$i]";
            if (!is_array($carriere)) {
                $this->error($at, 'doit être un objet { nom, rang }');
                continue;
            }
            $nom = $this->text($carriere, 'nom', "$at.nom", 255, true);
            $id = $nom === null ? null : $this->resolve('carriere', $nom, "$at.nom");
            if ($id !== null && isset($carrieres[$id])) {
                $this->error($at, "la carrière « $nom » est déjà citée");
            }
            if ($id !== null) {
                $carrieres[$id] = ['carriere_id' => $id, 'value' => $this->int($carriere, 'rang', $at, 0, 5, null)];
            }
        }

        $armes = [];
        foreach ($this->list($perso, 'armes', $path) as $i => $arme) {
            $armes[] = $this->arme($arme, "$path.armes[$i]");
        }

        $armures = [];
        foreach ($this->list($perso, 'armures', $path) as $i => $armure) {
            $at = "$path.armures[$i]";
            $id = is_string($armure) ? $this->resolve('armure', $armure, $at) : null;
            if (!is_string($armure)) {
                $this->error($at, "le nom d'une armure du catalogue");
            }
            if ($id !== null) {
                $armures[$id] = $id;
            }
        }

        $traits = [];
        foreach (['avantages' => ['avantage', 'A'], 'desavantages' => ['desavantage', 'D']] as $key => [$list, $type]) {
            foreach ($this->list($perso, $key, $path) as $i => $trait) {
                [$id, $detail] = $this->named($trait, $list, "$path.$key[$i]");
                if ($id !== null) {
                    $traits["$type$id"] = ['id' => $id, 'type' => $type, 'detail' => $detail];
                }
            }
        }

        return [
            'kind'         => 'pnj',
            'catalogue_id' => null,
            'fields'       => $fields,
            'carrieres'    => array_values($carrieres),
            'armes'        => $armes,
            'armures'      => array_values($armures),
            'traits'       => array_values($traits),
        ];
    }

    /**
     * @param array<string, mixed> $perso
     * @return array<string, mixed>
     */
    private function creature(array $perso, string $path): array
    {
        $taille = $this->text($perso, 'taille', "$path.taille", 255, true);
        $fields = [
            'nom'         => $this->text($perso, 'nom', "$path.nom", 255, true) ?? '',
            'id_taille'   => $taille === null ? null : $this->resolve('taille', $taille, "$path.taille"),
            'vitalite'    => $this->int($perso, 'vitalite', $path, 0, 127, null),
            'degats'      => $this->text($perso, 'degats', "$path.degats", 255, true),
            'protection'  => $this->text($perso, 'protection', "$path.protection", 255),
            'commentaire' => $this->text($perso, 'commentaire', "$path.commentaire", 5000),
        ];
        foreach (['vigueur', 'agilite', 'esprit', 'attaque', 'defense'] as $key) {
            $fields[$key] = $this->int($perso, $key, $path, -5, 20, 0);
        }

        return ['kind' => 'creature', 'catalogue_id' => null, 'fields' => $fields, 'capacites' => $this->details($perso, 'capacites', 'capacite', $path)];
    }

    /**
     * @param array<string, mixed> $perso
     * @return array<string, mixed>
     */
    private function demon(array $perso, string $path): array
    {
        $categorie = $this->text($perso, 'categorie', "$path.categorie", 255, true);
        $fields = [
            'nom'          => $this->text($perso, 'nom', "$path.nom", 255, true) ?? '',
            'id_categorie' => $categorie === null ? null : $this->resolve('categorie', $categorie, "$path.categorie"),
            'vitalite'     => $this->int($perso, 'vitalite', $path, 0, 127, null),
            'degats'       => $this->text($perso, 'degats', "$path.degats", 255, true),
            'commentaire'  => $this->text($perso, 'commentaire', "$path.commentaire", 5000),
        ];
        foreach (['vigueur', 'agilite', 'esprit', 'aura', 'melee', 'tir', 'defense'] as $key) {
            $fields[$key] = $this->int($perso, $key, $path, -5, 20, 0);
        }

        return ['kind' => 'demon', 'catalogue_id' => null, 'fields' => $fields, 'pouvoirs' => $this->details($perso, 'pouvoirs', 'pouvoir', $path)];
    }

    /**
     * Une arme : le nom d'une arme du catalogue, ou une arme propre au scénario `{nom, degats, type, portee,
     * notes}`, créée dans la bibliothèque de l'utilisateur.
     *
     * @return array{id: int|string|null, custom: array<string, string|null>|null}
     */
    private function arme(mixed $arme, string $path): array
    {
        if (is_string($arme) || (is_array($arme) && !array_key_exists('degats', $arme))) {
            $nom = is_string($arme) ? $arme : $this->text($arme, 'nom', "$path.nom", 255, true);

            return ['id' => $nom === null ? null : $this->resolve('arme', $nom, $path), 'custom' => null];
        }
        if (!is_array($arme)) {
            $this->error($path, "le nom d'une arme du catalogue, ou { nom, degats, type }");

            return ['id' => null, 'custom' => null];
        }
        $type = $arme['type'] ?? 'M';
        if (!in_array($type, ['M', 'T'], true)) {
            $this->error("$path.type", 'M (mêlée) ou T (tir)');
        }

        return ['id' => null, 'custom' => [
            'arme'   => $this->text($arme, 'nom', "$path.nom", 255, true),
            'degats' => $this->text($arme, 'degats', "$path.degats", 255, true),
            'type'   => is_string($type) ? $type : 'M',
            'portee' => $this->text($arme, 'portee', "$path.portee", 255),
            'notes'  => $this->text($arme, 'notes', "$path.notes", 1000),
        ]];
    }

    /**
     * Capacités d'une créature ou pouvoirs d'un démon : chacun une seule fois, avec sa précision.
     *
     * @param array<string, mixed> $perso
     * @return list<array{id: int|string, detail: string|null}>
     */
    private function details(array $perso, string $key, string $list, string $path): array
    {
        $result = [];
        foreach ($this->list($perso, $key, $path) as $i => $item) {
            [$id, $detail] = $this->named($item, $list, "$path.$key[$i]");
            if ($id !== null && isset($result[$id])) {
                $this->error("$path.$key[$i]", 'déjà citée : une seule fois par fiche (mettre le reste dans le commentaire)');
            }
            if ($id !== null) {
                $result[$id] = ['id' => $id, 'detail' => $detail];
            }
        }

        return array_values($result);
    }

    /**
     * Un élément du catalogue cité par son nom, seul (`"Dur à cuire"`) ou avec une précision
     * (`{"nom": "Attaque spéciale", "detail": "…"}`).
     *
     * @return array{0: int|string|null, 1: string|null}
     */
    private function named(mixed $item, string $list, string $path): array
    {
        if (is_string($item)) {
            return [$this->resolve($list, $item, $path), null];
        }
        if (!is_array($item)) {
            $this->error($path, 'un nom, ou { nom, detail }');

            return [null, null];
        }
        $nom = $this->text($item, 'nom', "$path.nom", 255, true);

        return [$nom === null ? null : $this->resolve($list, $nom, "$path.nom"), $this->text($item, 'detail', "$path.detail", 255)];
    }

    /**
     * @param array<string, mixed> $scene
     * @return array<string, mixed>
     */
    private function scene(array $scene, string $path, string $cle): array
    {
        $region = $this->text($scene, 'region', "$path.region", 255);
        $moment = $scene['moment'] ?? null;
        if ($moment !== null && !in_array($moment, BolScenePreparation::MOMENTS, true)) {
            $this->error("$path.moment", implode(', ', BolScenePreparation::MOMENTS));
        }
        $meteo = $scene['meteo'] ?? null;
        if ($meteo !== null && !in_array($meteo, BolScenePreparation::METEOS, true)) {
            $this->error("$path.meteo", implode(', ', BolScenePreparation::METEOS));
        }
        $image = $this->text($scene, 'image', "$path.image", 500);
        if ($image !== null && !preg_match('#^(https://|/assets/)#', $image)) {
            $this->error("$path.image", 'commence par https:// ou /assets/');
        }

        $pistes = [];
        $listePistes = $this->list($scene, 'pistes', $path);
        if (count($listePistes) > BolScenePreparation::PISTES_MAX) {
            $this->error("$path.pistes", BolScenePreparation::PISTES_MAX . ' pistes au plus');
        }
        foreach ($listePistes as $i => $piste) {
            $at = "$path.pistes[$i]";
            if (!is_array($piste)) {
                $this->error($at, 'doit être un objet { texte, vers }');
                continue;
            }
            $vers = $piste['vers'] ?? null;
            if ($vers !== null && !is_string($vers)) {
                $this->error("$at.vers", "la clé d'une scène de ce fichier");
                $vers = null;
            }
            $pistes[] = [
                'texte' => $this->text($piste, 'texte', "$at.texte", BolScenePreparation::PISTE_TEXTE_MAX, true) ?? '',
                'vers'  => $vers,
            ];
        }

        $distribution = [];
        foreach ($this->list($scene, 'distribution', $path) as $i => $entry) {
            $at = "$path.distribution[$i]";
            if (!is_array($entry)) {
                $this->error($at, 'doit être un objet { perso, qty, camp, attitude }');
                continue;
            }
            $perso = $this->cle($entry, 'perso', "$at.perso");
            $camp = $entry['camp'] ?? 'adversaires';
            if (!in_array($camp, ['heros', 'adversaires'], true)) {
                $this->error("$at.camp", 'heros ou adversaires');
            }
            $attitude = $entry['attitude'] ?? null;
            if ($attitude !== null && !in_array($attitude, BolSceneDistribution::ATTITUDES, true)) {
                $this->error("$at.attitude", implode(', ', BolSceneDistribution::ATTITUDES));
            }
            if ($perso === null) {
                continue;
            }
            if (!array_key_exists($perso, $this->personnages) && !in_array($perso, $this->externes, true)) {
                $this->externes[] = $perso;
            }
            $distribution[] = [
                'perso'    => $perso,
                'qty'      => $this->int($entry, 'qty', $at, 1, self::QTY_MAX, 1),
                'camp'     => $camp,
                'attitude' => $attitude,
            ];
        }

        return [
            'cle'    => $cle,
            'fields' => [
                'titre'     => $this->text($scene, 'titre', "$path.titre", 120, true) ?? '',
                'region_id' => $region === null ? null : $this->resolve('region', $region, "$path.region"),
                'lieu'      => $this->text($scene, 'lieu', "$path.lieu", 120),
                'moment'    => $moment,
                'meteo'     => $meteo,
                'danger'    => $this->int($scene, 'danger', $path, 1, 4, 0) ?: null,
                'lecture'   => $this->text($scene, 'lecture', "$path.lecture", 5000),
                'jeu'       => $this->text($scene, 'jeu', "$path.jeu", 10000),
                'notes'     => $this->text($scene, 'notes', "$path.notes", 10000),
                'image'     => $image,
            ],
            'pistes'       => $pistes,
            'distribution' => $distribution,
        ];
    }

    private function resolve(string $list, string $name, string $path): int|string|null
    {
        $id = $this->catalog->find($list, $name);
        if ($id === null) {
            $this->error($path, "« $name » est inconnu du catalogue ($list)");
        }

        return $id;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function object(array $data, string $key, string $path): array
    {
        $value = $data[$key] ?? null;
        if (!is_array($value) || ($value !== [] && array_is_list($value))) {
            $this->error($path, 'obligatoire, doit être un objet');

            return [];
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $data
     * @return list<mixed>
     */
    private function list(array $data, string $key, string $path): array
    {
        $value = $data[$key] ?? [];
        if (!is_array($value) || !array_is_list($value)) {
            $this->error("$path.$key", 'doit être une liste');

            return [];
        }

        return $value;
    }

    /** @param array<string, mixed> $data */
    private function cle(array $data, string $key, string $path): ?string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value) || !preg_match(self::CLE, $value)) {
            $this->error($path, 'clé obligatoire : minuscules, chiffres, tirets, soulignés (60 caractères au plus)');

            return null;
        }

        return $value;
    }

    /**
     * Un texte rogné, null s'il est absent ou vide.
     *
     * @param array<string, mixed> $data
     */
    private function text(array $data, string $key, string $path, int $max, bool $required = false): ?string
    {
        $value = $data[$key] ?? null;
        if ($value !== null && !is_string($value)) {
            $this->error($path, 'doit être un texte');

            return null;
        }
        $value = $value === null ? '' : trim($value);
        if ($value === '') {
            if ($required) {
                $this->error($path, 'obligatoire');
            }

            return null;
        }
        if (mb_strlen($value) > $max) {
            $this->error($path, "$max caractères au plus (" . mb_strlen($value) . ')');
        }

        return $value;
    }

    /**
     * Un entier borné ; absent, il vaut `$default` (obligatoire si `$default` est null).
     *
     * @param array<string, mixed> $data
     */
    private function int(array $data, string $key, string $path, int $min, int $max, ?int $default): int
    {
        $value = $data[$key] ?? null;
        if ($value === null) {
            if ($default === null) {
                $this->error("$path.$key", 'obligatoire');
            }

            return $default ?? 0;
        }
        if (!is_int($value) || $value < $min || $value > $max) {
            $this->error("$path.$key", "entier de $min à $max");

            return $default ?? 0;
        }

        return $value;
    }

    private function error(string $path, string $message): void
    {
        $this->errors[] = "$path : $message";
    }
}
