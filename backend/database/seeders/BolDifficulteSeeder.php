<?php

namespace Database\Seeders;

use App\Models\Bol\BolDifficulte;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolDifficulteSeeder extends Seeder
{
    public function run(): void
    {
        $difficultes = [
            ["id" => 1, "label" => "Très facile",    "modificateur" =>  2, "ordre" => 1],
            ["id" => 2, "label" => "Facile",         "modificateur" =>  1, "ordre" => 2],
            ["id" => 3, "label" => "Moyenne",        "modificateur" =>  0, "ordre" => 3],
            ["id" => 4, "label" => "Ardue",          "modificateur" => -1, "ordre" => 4],
            ["id" => 5, "label" => "Difficile",      "modificateur" => -2, "ordre" => 5],
            ["id" => 6, "label" => "Très difficile", "modificateur" => -4, "ordre" => 6],
            ["id" => 7, "label" => "Impossible",     "modificateur" => -6, "ordre" => 7],
            ["id" => 8, "label" => "Héroïque",       "modificateur" => -8, "ordre" => 8],
        ];

        Schema::disableForeignKeyConstraints();
        BolDifficulte::truncate();
        Schema::enableForeignKeyConstraints();
        foreach ($difficultes as $d) {
            BolDifficulte::create($d);
        }
    }
}
