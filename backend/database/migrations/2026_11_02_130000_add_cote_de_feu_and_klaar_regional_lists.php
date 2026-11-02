<?php

use Carbon\CarbonInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Listes régionales manquantes de la Côte de Feu et des Plaines de Klaar (les seeders portent les mêmes lignes).
 * Plaines de Klaar : les listes des céruléens, chapitre 5 du livre (p. 91). Côte de Feu : le livre (p. 18-19) renvoie à Halakh ou aux
 * marais de Kasht pour un héros humain, donc l'union de leurs deux listes, sans l'arme favorite kriss que Mythic+ réserve à Halakh ; les
 * listes des kalukans ne sont pas modélisées (l'application ne gère pas les races). Régions et traits sont retrouvés par leur nom ; une
 * région absente (base neuve, avant les seeders) est laissée aux seeders, un trait absent d'une région présente arrête la migration.
 * Seules les lignes manquantes sont ajoutées, la liste des régions en cache est vidée. */
return new class extends Migration
{
    private const REGIONS = [
        'Côte de Feu' => [
            'avantages' => [
                'Ami des bêtes', 'Athlète', 'Discret', 'Montagnard', 'Odorat développé', 'Ouïe fine', 'Outillage', 'Pisteur des marais',
                'Renard du désert', 'Résistant aux poisons', 'Santé de fer', 'Vigilant', 'Vision nocturne'
            ],
            'desavantages' => [
                'Addiction', 'Bouseux', 'Chétif', 'Crédule', 'Fanatique', 'Gars de la ville', 'Indigne de confiance', 'Marin d’eau douce'
            ],
            'noms' => [
                'M' => [
                    'Achak', 'Ahmik', 'Akando', 'Akule', 'Angada', 'Ashok', 'Balaram', 'Bhadrakil', 'Bidi', 'Chalam', 'Chedi', 'Chepi',
                    'Chetan', 'Ciqala', 'Daruk', 'Devad', 'Dogon', 'Drajit', 'Goth', 'Govardan', 'Hinto', 'Hokee', 'Iravan', 'Janak',
                    'Jiwal', 'Jolon', 'Karna', 'Keme', 'Kichaka', 'Knoton', 'Kourouk', 'Kurava', 'Maharak', 'Mapoutra', 'Molimo', 'Parada',
                    'Parasara', 'Shoumat', 'T’kala', 'T’kouna'
                ],
                'F' => [
                    'Aiyana', 'Alawa', 'Anjana', 'Ardana', 'Atiaran', 'Bly', 'Camarin', 'Cathecassa', 'Chapala', 'Charla', 'Chimalis',
                    'Damayanti', 'Dena', 'Devaki', 'Doli', 'Donoma', 'Etania', 'Gadiva', 'Hanala', 'Holi', 'Ilvala', 'Jasura', 'Kalama',
                    'Kalindi', 'Kesha', 'Landina', 'Madri', 'Mashini', 'Mitenah', 'Nakula', 'Nala', 'Neta', 'Nitika', 'Onatah', 'Orenda',
                    'Ralekha', 'Rasena', 'Vahana', 'Z’kala', 'Z’kouna'
                ],
            ],
        ],
        'Plaines de Klaar' => [
            'avantages' => [
                'Ami des bêtes', 'Ami des céruléens', 'Bagarreur', 'Colosse', 'Dur à cuire', 'Fils des plaines', 'Intimidant', 'Peau dure',
                'Récupération rapide', 'Vigueur céruléenne'
            ],
            'desavantages' => [
                'Bouseux', 'Deux mains gauches', 'Marin d’eau douce', 'Méfiance envers la sorcellerie', 'Pataud', 'Signe distinctif'
            ],
            'noms' => [
                'M' => [
                    'Bork', 'Chun', 'Dekk', 'Erkk', 'Fakk', 'Gort', 'Gozaar', 'Gurnt', 'Jaakko', 'Jank', 'Jouka', 'Jrycki', 'Kall',
                    'Kerrik', 'Kook', 'Koozo', 'Kukk', 'Lekk', 'Lozzar', 'Nukk', 'Penkk', 'Tarrk', 'Venk', 'Vilk', 'Vork'
                ],
                'F' => [
                    'Akki', 'Bekka', 'Bezis', 'Danki', 'Eeva', 'Furka', 'Inka', 'Irka', 'Joona', 'Jurva', 'Kalli', 'Karis', 'Kella',
                    'Kooki', 'Krakki', 'Lazzis', 'Likka', 'Lovi', 'Marjukka', 'Marzi', 'Nukeel', 'Nukka', 'Oki', 'Rikki', 'Tharki'
                ],
            ],
        ],
    ];

    public function up(): void
    {
        $now = now();
        foreach (self::REGIONS as $region => $listes) {
            $regionId = $this->regionId($region);
            if ($regionId === null) {
                continue;
            }
            // Tous les traits sont retrouvés avant la première écriture : un nom inconnu n'en laisse aucune à moitié faite.
            $avantages = $this->traitIds('bol_avantage', 'avantage', $listes['avantages']);
            $desavantages = $this->traitIds('bol_desavantage', 'desavantage', $listes['desavantages']);

            $this->lier('bol_region_avantage', 'avantage_id', $regionId, $avantages, $now);
            $this->lier('bol_region_desavantage', 'desavantage_id', $regionId, $desavantages, $now);
            foreach ($listes['noms'] as $genre => $noms) {
                $deja = DB::table('bol_region_nom')->where('region_id', $regionId)->where('gender', $genre)->pluck('nom')->all();
                foreach (array_diff($noms, $deja) as $nom) {
                    DB::table('bol_region_nom')->insert(['nom' => $nom, 'gender' => $genre, 'region_id' => $regionId, 'created_at' => $now, 'updated_at' => $now]);
                }
            }
        }
        $this->viderLesCaches();
    }

    public function down(): void
    {
        foreach (self::REGIONS as $region => $listes) {
            $regionId = $this->regionId($region);
            if ($regionId === null) {
                continue;
            }
            DB::table('bol_region_avantage')->where('region_id', $regionId)
                ->whereIn('avantage_id', DB::table('bol_avantage')->whereIn('avantage', $listes['avantages'])->select('id'))->delete();
            DB::table('bol_region_desavantage')->where('region_id', $regionId)
                ->whereIn('desavantage_id', DB::table('bol_desavantage')->whereIn('desavantage', $listes['desavantages'])->select('id'))->delete();
            foreach ($listes['noms'] as $genre => $noms) {
                DB::table('bol_region_nom')->where('region_id', $regionId)->where('gender', $genre)->whereIn('nom', $noms)->delete();
            }
        }
        $this->viderLesCaches();
    }

    private function regionId(string $region): ?int
    {
        $id = DB::table('bol_region')->where('region', $region)->value('id');

        return $id === null ? null : (int) $id;
    }

    /** @param list<string> $noms @return list<int> */
    private function traitIds(string $table, string $colonne, array $noms): array
    {
        $ids = DB::table($table)->whereIn($colonne, $noms)->pluck('id', $colonne);
        $manquants = array_diff($noms, $ids->keys()->all());
        if ($manquants !== []) {
            throw new RuntimeException($table . ' : trait absent (' . implode(', ', $manquants) . '), les seeders de référence ne sont pas passés.');
        }

        return $ids->map(fn ($id) => (int) $id)->values()->all();
    }

    /** @param list<int> $ids */
    private function lier(string $table, string $colonne, int $regionId, array $ids, CarbonInterface $now): void
    {
        $deja = DB::table($table)->where('region_id', $regionId)->pluck($colonne)->map(fn ($id) => (int) $id)->all();
        foreach (array_diff($ids, $deja) as $id) {
            DB::table($table)->insert(['region_id' => $regionId, $colonne => $id, 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    /** La liste des régions et de leurs listes (BolReferenceData::regions). */
    private function viderLesCaches(): void
    {
        Cache::forget('bol_regions_all');
    }
};
