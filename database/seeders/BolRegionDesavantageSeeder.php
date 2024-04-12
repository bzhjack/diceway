<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\BolRegionDesavantage;

class BolRegionDesavantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions_desavantages = [
            // Côte de Feu (kalukan)
            // Désert de Beshaar
            ["region_id" => 2, "desavantage_id" => 6], // Bouseux
            ["region_id" => 2, "desavantage_id" => 7], // Chétif
            ["region_id" => 2, "desavantage_id" => 18], // Impétueux
            ["region_id" => 2, "desavantage_id" => 20], // Inadapté au froid
            ["region_id" => 2, "desavantage_id" => 28], // Marin d’eau douce
            ["region_id" => 2, "desavantage_id" => 39], // Signe distinctif
            ["region_id" => 2, "desavantage_id" => 42], // Taciturne
            // Halakh
            ["region_id" => 3, "desavantage_id" => 1], // Addiction
            ["region_id" => 3, "desavantage_id" => 13], // Fanatique
            ["region_id" => 3, "desavantage_id" => 16], // Gars de la ville
            ["region_id" => 3, "desavantage_id" => 22], // Indigne de confiance
            ["region_id" => 3, "desavantage_id" => 28], // Marin d’eau douce
            // Îles du Crâne
            ["region_id" => 4, "desavantage_id" => 5], // Borgne/oreille coupée
            ["region_id" => 4, "desavantage_id" => 9], // Cupide
            ["region_id" => 4, "desavantage_id" => 14], // Fanfaron
            ["region_id" => 4, "desavantage_id" => 17], // Illettré
            ["region_id" => 4, "desavantage_id" => 22], // Indigne de confiance
            ["region_id" => 4, "desavantage_id" => 25], // Lubrique
            ["region_id" => 4, "desavantage_id" => 26], // Malédiction de Morgazzon
            ["region_id" => 4, "desavantage_id" => 27], // Manchot/unijambiste
            ["region_id" => 4, "desavantage_id" => 29], // Maudit
            ["region_id" => 4, "desavantage_id" => 36], // Phobie
            ["region_id" => 4, "desavantage_id" => 37], // Poltron
            ["region_id" => 4, "desavantage_id" => 39], // Signe distinctif
            ["region_id" => 4, "desavantage_id" => 40], // Soiffard
            ["region_id" => 4, "desavantage_id" => 43], // Traqué
            // Jungle de Qo et jungle
            ["region_id" => 5, "desavantage_id" => 6], // Bouseux
            ["region_id" => 5, "desavantage_id" => 17], // Illettré
            ["region_id" => 5, "desavantage_id" => 20], // Inadapté au froid
            ["region_id" => 5, "desavantage_id" => 28], // Marin d’eau douce
            ["region_id" => 5, "desavantage_id" => 31], // Méfiance envers la sorcellerie
            // Lysor
            ["region_id" => 6, "desavantage_id" => 7], // Chétif
            ["region_id" => 6, "desavantage_id" => 15], // Foie jaune
            ["region_id" => 6, "desavantage_id" => 16], // Gars de la ville
            ["region_id" => 6, "desavantage_id" => 21], // Incapable de mentir
            ["region_id" => 6, "desavantage_id" => 24], // Lent à la détente
            ["region_id" => 6, "desavantage_id" => 26], // Malédiction de Morgazzon
            ["region_id" => 6, "desavantage_id" => 33], // Non-combattant
            // Malakut
            ["region_id" => 7, "desavantage_id" => 7], // Chétif
            ["region_id" => 7, "desavantage_id" => 16], // Gars de la ville
            ["region_id" => 7, "desavantage_id" => 22], // Indigne de confiance
            ["region_id" => 7, "desavantage_id" => 28], // Marin d’eau douce
            ["region_id" => 7, "desavantage_id" => 30], // Mauvaise réputation
            ["region_id" => 7, "desavantage_id" => 43], // Traqué
            // Marais de Festrel
            ["region_id" => 8, "desavantage_id" => 6], // Bouseux
            ["region_id" => 8, "desavantage_id" => 17], // Illettré
            ["region_id" => 8, "desavantage_id" => 19], // Inadapté à la chaleur
            ["region_id" => 8, "desavantage_id" => 29], // Maudit
            ["region_id" => 8, "desavantage_id" => 42], // Taciturne
            // Marais de Kasht
            ["region_id" => 9, "desavantage_id" => 6], // Bouseux
            ["region_id" => 9, "desavantage_id" => 7], // Chétif
            ["region_id" => 9, "desavantage_id" => 8], // Crédule
            // Montagnes de l’Axos
            ["region_id" => 10, "desavantage_id" => 6], // Bouseux
            ["region_id" => 10, "desavantage_id" => 17], // Illettré
            ["region_id" => 10, "desavantage_id" => 19], // Inadapté à la chaleur
            ["region_id" => 10, "desavantage_id" => 28], // Marin d’eau douce
            ["region_id" => 10, "desavantage_id" => 31], // Méfiance envers la sorcellerie
            ["region_id" => 10, "desavantage_id" => 42], // Taciturne
            // Oomis
            ["region_id" => 11, "desavantage_id" => 9], // Cupide
            ["region_id" => 11, "desavantage_id" => 10], // Dur d’oreille
            ["region_id" => 11, "desavantage_id" => 24], // Lent à la détente
            ["region_id" => 11, "desavantage_id" => 26], // Malédiction de Morgazzon
            // Parsool
            ["region_id" => 12, "desavantage_id" => 5], // Borgne/oreille coupée
            ["region_id" => 12, "desavantage_id" => 16], // Gars de la ville
            ["region_id" => 12, "desavantage_id" => 17], // Illettré
            ["region_id" => 12, "desavantage_id" => 27], // Manchot/unijambiste
            ["region_id" => 12, "desavantage_id" => 40], // Soiffard
            // Plaines de Klaar (céruléen)
            // Satarla
            ["region_id" => 14, "desavantage_id" => 3], // Arrogant
            ["region_id" => 14, "desavantage_id" => 9], // Cupide
            ["region_id" => 14, "desavantage_id" => 16], // Gars de la ville
            // Shamballah
            ["region_id" => 15, "desavantage_id" => 6], // Bouseux
            ["region_id" => 15, "desavantage_id" => 17], // Illettré
            ["region_id" => 15, "desavantage_id" => 20], // Inadapté au froid
            ["region_id" => 15, "desavantage_id" => 28], // Marin d’eau douce
            ["region_id" => 15, "desavantage_id" => 31], // Méfiance envers la sorcellerie
            // Terres Désolées ( choisir dans la liste générale)
            // Tyrus
            ["region_id" => 17, "desavantage_id" => 14], // Fanfaron
            ["region_id" => 17, "desavantage_id" => 16], // Gars de la ville
            ["region_id" => 17, "desavantage_id" => 17], // Illettré
            ["region_id" => 17, "desavantage_id" => 31], // Méfiance envers la sorcellerie
            ["region_id" => 17, "desavantage_id" => 40], // Soiffard
            // Urceb
            ["region_id" => 18, "desavantage_id" => 16], // Gars de la ville
            ["region_id" => 18, "desavantage_id" => 17], // Illettré
            ["region_id" => 18, "desavantage_id" => 42], // Taciturne
            // Valgard
            ["region_id" => 19, "desavantage_id" => 6], // Bouseux
            ["region_id" => 19, "desavantage_id" => 17], // Illettré
            ["region_id" => 19, "desavantage_id" => 19], // Inadapté à la chaleur
            ["region_id" => 19, "desavantage_id" => 21], // Incapable de mentir
            ["region_id" => 19, "desavantage_id" => 28], // Marin d’eau douce
            ["region_id" => 19, "desavantage_id" => 31], // Méfiance envers la sorcellerie
            ["region_id" => 19, "desavantage_id" => 42], // Taciturne
            // Zalut
            ["region_id" => 20, "desavantage_id" => 1], // Addiction
            ["region_id" => 20, "desavantage_id" => 3], // Arrogant
            ["region_id" => 20, "desavantage_id" => 7], // Chétif
            ["region_id" => 20, "desavantage_id" => 15], // Foie jaune
            ["region_id" => 20, "desavantage_id" => 22], // Indigne de confiance
            ["region_id" => 20, "desavantage_id" => 23], // Inquiétant
            ["region_id" => 20, "desavantage_id" => 26], // Malédiction de Morgazzon
            ["region_id" => 20, "desavantage_id" => 29], // Maudit
            ["region_id" => 20, "desavantage_id" => 34], // Obsession
            ["region_id" => 20, "desavantage_id" => 37], // Poltron
            ["region_id" => 20, "desavantage_id" => 39], // Signe distinctif
            ["region_id" => 20, "desavantage_id" => 41] // Souffreteux
        ];

        // Insérer les données dans la table des régions
        foreach ($regions_desavantages as $region_desavantage) {
            BolRegionDesavantage::create($region_desavantage);
        }
    }
}
