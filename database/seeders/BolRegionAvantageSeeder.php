<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BolRegionAvantage;

class BolRegionAvantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions_avantages = [
            // Côte de Feu (kalukan)
            ["region_id" => 1, "avantage_id" => 6, "detail" => 'Tulwar'], // Arme favorite (Tulwar)
            ["region_id" => 1, "avantage_id" => 15], // Colosse
            ["region_id" => 1, "avantage_id" => 20], // Dur à cuire
            ["region_id" => 1, "avantage_id" => 27], // Intimidant
            ["region_id" => 1, "avantage_id" => 39], // Peau dure
            ["region_id" => 1, "avantage_id" => 45], // Récupération rapide
            ["region_id" => 1, "avantage_id" => 47], // Résistant à la magie
            ["region_id" => 1, "avantage_id" => 48], // Résistant aux poisons
            ["region_id" => 1, "avantage_id" => 51], // Santé de fer
            ["region_id" => 1, "avantage_id" => 53], // Sentir la magie
            ["region_id" => 1, "avantage_id" => 56], // Vigilant
            ["region_id" => 1, "avantage_id" => 57], // Vigueur céruléenne
            ["region_id" => 1, "avantage_id" => 58], // Vision nocturne
            // Désert de Beshaar
            ["region_id" => 2, "avantage_id" => 2], // Ami des bêtes
            ["region_id" => 2, "avantage_id" => 6 ,'detail' => 'Javelot'], // Arme favorite (Javelot)
            ["region_id" => 2, "avantage_id" => 9], // Attirant
            ["region_id" => 2, "avantage_id" => 11], // Baudrier de guerre
            ["region_id" => 2, "avantage_id" => 35], // Né en selle
            ["region_id" => 2, "avantage_id" => 46], // Renard du désert
            ["region_id" => 2, "avantage_id" => 58], // Vision nocturne
            ["region_id" => 2, "avantage_id" => 59], // Vue perçante
            // Halakh
            ["region_id" => 3, "avantage_id" => 6, 'detail' => 'Kriss'], // Arme favorite (Kriss)
            ["region_id" => 3, "avantage_id" => 18], // Discret
            ["region_id" => 3, "avantage_id" => 34], // Montagnard
            ["region_id" => 3, "avantage_id" => 38], // Outillage
            ["region_id" => 3, "avantage_id" => 46], // Renard du désert
            ["region_id" => 3, "avantage_id" => 48], // Résistant aux poisons
            ["region_id" => 3, "avantage_id" => 58], // Vision nocturne,
            // Îles du Crâne
            ["region_id" => 4, "avantage_id" => 4], // Amis dans la pègre
            ["region_id" => 4, "avantage_id" => 8], // Athlète
            ["region_id" => 4, "avantage_id" => 10], // Bagarreur
            ["region_id" => 4, "avantage_id" => 18], // Discret
            ["region_id" => 4, "avantage_id" => 19], // Doigts de fée
            ["region_id" => 4, "avantage_id" => 22], // Fêtard
            ["region_id" => 4, "avantage_id" => 25], // Gamin des rues
            ["region_id" => 4, "avantage_id" => 41], // Pied marin
            ["region_id" => 4, "avantage_id" => 45], // Récupération rapide
            ["region_id" => 4, "avantage_id" => 50], // Roi de l’évasion
            ["region_id" => 4, "avantage_id" => 56], // Vigilant
            ["region_id" => 4, "avantage_id" => 59], // Vue perçante
            
            // Jungle de Qo et jungle 
            ["region_id" => 5, "avantage_id" => 2], // Ami des bêtes
            ["region_id" => 5, "avantage_id" => 8], // Athlète
            ["region_id" => 5, "avantage_id" => 36], // Odorat développé
            ["region_id" => 5, "avantage_id" => 37], // Ouïe fine
            ["region_id" => 5, "avantage_id" => 49], // Roi de la jungle
            ["region_id" => 5, "avantage_id" => 56], // Vigilant
            ["region_id" => 5, "avantage_id" => 59], // Vue perçante

            // Lysor

            ["region_id" => 6, "avantage_id" => 5], // Amis haut placés
            ["region_id" => 6, "avantage_id" => 7], // Artiste
            ["region_id" => 6, "avantage_id" => 9], // Attirant
            ["region_id" => 6, "avantage_id" => 13], // Bibliothèque savante
            ["region_id" => 6, "avantage_id" => 21], // Érudit
            ["region_id" => 6, "avantage_id" => 24], // Fortuné
            ["region_id" => 6, "avantage_id" => 31], // Mains guérisseuses
            ["region_id" => 6, "avantage_id" => 40], // Perspicace
            ["region_id" => 6, "avantage_id" => 45], // Récupération rapide
            ["region_id" => 6, "avantage_id" => 48], // Résistant aux poisons
            ["region_id" => 6, "avantage_id" => 51], // Santé de fer
            ["region_id" => 6, "avantage_id" => 52], // Savant
            
            // Malakut
            ["region_id" => 7, "avantage_id" => 4], // Amis dans la pègre
            ["region_id" => 7, "avantage_id" => 6, 'detail' => 'Khastok'], // Arme favorite (Khastok)
            ["region_id" => 7, "avantage_id" => 16], // Combat à l’aveugle
            ["region_id" => 7, "avantage_id" => 18], // Discret
            ["region_id" => 7, "avantage_id" => 19], // Doigts de fée
            ["region_id" => 7, "avantage_id" => 22], // Fêtard
            ["region_id" => 7, "avantage_id" => 23], // Fils des plaines
            ["region_id" => 7, "avantage_id" => 25], // Gamin des rues
            ["region_id" => 7, "avantage_id" => 38, 'detail' => 'Outils de voleur'], // Outillage (Outils de voleur)
            ["region_id" => 7, "avantage_id" => 56], // Vigilant

            // Marais de Festrel
            ["region_id" => 8, "avantage_id" => 8], // Athlète
            ["region_id" => 8, "avantage_id" => 10], // Bagarreur
            ["region_id" => 8, "avantage_id" => 18], // Discret
            ["region_id" => 8, "avantage_id" => 36], // Odorat développé
            ["region_id" => 8, "avantage_id" => 37], // Ouïe fine
            ["region_id" => 8, "avantage_id" => 42], // Pisteur des marais
            ["region_id" => 8, "avantage_id" => 48], // Résistant aux poisons
            ["region_id" => 8, "avantage_id" => 51], // Santé de fer
            ["region_id" => 8, "avantage_id" => 56], // Vigilant

            // Marais de Kasht
            ["region_id" => 9, "avantage_id" => 2], // Ami des bêtes
            ["region_id" => 9, "avantage_id" => 8], // Athlète
            ["region_id" => 9, "avantage_id" => 18], // Discret
            ["region_id" => 9, "avantage_id" => 36], // Odorat développé
            ["region_id" => 9, "avantage_id" => 37], // Ouïe fine
            ["region_id" => 9, "avantage_id" => 42], // Pisteur des marais
            ["region_id" => 9, "avantage_id" => 48], // Résistant aux poisons
            ["region_id" => 9, "avantage_id" => 51], // Santé de fer
            ["region_id" => 9, "avantage_id" => 56], // Vigilant

            // Montagnes de l’Axos
            ["region_id" => 10, "avantage_id" => 6, "detail" => "Fronde de l’Axos"], // Arme favorite (Fronde de l’Axos)
            ["region_id" => 10, "avantage_id" => 8], // Athlète
            ["region_id" => 10, "avantage_id" => 15], // Colosse
            ["region_id" => 10, "avantage_id" => 17], // Cri de guerre
            ["region_id" => 10, "avantage_id" => 20], // Dur à cuire
            ["region_id" => 10, "avantage_id" => 34], // Montagnard
            ["region_id" => 10, "avantage_id" => 36], // Odorat développé
            ["region_id" => 10, "avantage_id" => 37], // Ouïe fine
            ["region_id" => 10, "avantage_id" => 45], // Récupération rapide
            ["region_id" => 10, "avantage_id" => 51], // Santé de fer
            ["region_id" => 10, "avantage_id" => 56], // Vigilant
            
            // Oomis
            ["region_id" => 11, "avantage_id" => 3], // Ami des céruléens
            ["region_id" => 11, "avantage_id" => 20], // Dur à cuire
            ["region_id" => 11, "avantage_id" => 24], // Fortuné
            ["region_id" => 11, "avantage_id" => 40], // Perspicace
            // Parsool
            ["region_id" => 12, "avantage_id" => 6, "detail" => "Hache d’abordage de Parsool"], // Arme favorite (Hache d’abordage de Parsool)
            ["region_id" => 12, "avantage_id" => 17, "detail" => "Parsool"] , // Cri de guerre (Parsool)
            ["region_id" => 12, "avantage_id" => 22], // Fêtard
            ["region_id" => 12, "avantage_id" => 41], // Pied marin
            // Plaines de Klaar (céruléen)
            ["region_id" => 13, "avantage_id" => 2], // Ami des bêtes
            ["region_id" => 13, "avantage_id" => 3], // Ami des céruléens
            ["region_id" => 13, "avantage_id" => 10], // Bagarreur
            ["region_id" => 13, "avantage_id" => 15], // Colosse
            ["region_id" => 13, "avantage_id" => 20], // Dur à cuire
            ["region_id" => 13, "avantage_id" => 23], // Fils des plaines
            ["region_id" => 13, "avantage_id" => 27], // Intimidant
            ["region_id" => 13, "avantage_id" => 39], // Peau dure
            ["region_id" => 13, "avantage_id" => 45], // Récupération rapide
            ["region_id" => 13, "avantage_id" => 57], // Vigueur céruléenne
            // Satarla
            ["region_id" => 14, "avantage_id" => 5], // Amis haut placés
            ["region_id" => 14, "avantage_id" => 7], // Artiste
            ["region_id" => 14, "avantage_id" => 13], // Bibliothèque savante
            ["region_id" => 14, "avantage_id" => 14], // Bien né
            ["region_id" => 14, "avantage_id" => 21], // Érudit
            ["region_id" => 14, "avantage_id" => 24], // Fortuné
            ["region_id" => 14, "avantage_id" => 33], // Marqué par les dieux
            ["region_id" => 14, "avantage_id" => 35], // Né en selle
            ["region_id" => 14, "avantage_id" => 52], // Savant
            // Shamballah
            ["region_id" => 15, "avantage_id" => 2], // Ami des bêtes
            ["region_id" => 15, "avantage_id" => 8], // Athlète
            ["region_id" => 15, "avantage_id" => 36], // Odorat développé
            ["region_id" => 15, "avantage_id" => 37], // Ouïe fine
            ["region_id" => 15, "avantage_id" => 49], // Roi de la jungle
            ["region_id" => 15, "avantage_id" => 56], // Vigilant
            ["region_id" => 15, "avantage_id" => 59], // Vue perçante
            // Terres Désolées ( choisir dans la liste générale)
            // Tyrus
            ["region_id" => 17, "avantage_id" => 6, "detail" => 'Arc long de Tyrus'], // Arme favorite (Arc long de Tyrus)
            ["region_id" => 17, "avantage_id" => 10], // Bagarreur
            ["region_id" => 17, "avantage_id" => 17, "detail" => "Tyrus"], // Cri de guerre (Tyrus)
            ["region_id" => 17, "avantage_id" => 22], // Fêtard
            ["region_id" => 17, "avantage_id" => 47], // Résistant à la magie
            ["region_id" => 17, "avantage_id" => 49], // Roi de la jungle
            ["region_id" => 17, "avantage_id" => 53], // Sentir la magie
            ["region_id" => 17, "avantage_id" => 56], // Vigilant
            // Urceb
            ["region_id" => 18, "avantage_id" => 4], // Amis dans la pègre
            ["region_id" => 18, "avantage_id" => 5], // Amis haut placés
            ["region_id" => 18, "avantage_id" => 16], // Combat à l’aveugle
            ["region_id" => 18, "avantage_id" => 22], // Fêtard
            ["region_id" => 18, "avantage_id" => 38], // Outillage
            ["region_id" => 18, "avantage_id" => 50], // Roi de l’évasion
            ["region_id" => 18, "avantage_id" => 58], // Vision nocturne
            // Valgard
            ["region_id" => 19, "avantage_id" => 6, "detail" => "Épée valgardienne"], // Arme favorite (Épée valgardienne)
            ["region_id" => 19, "avantage_id" => 17, "detail" => "Valgard"], // Cri de guerre (Valgard)
            ["region_id" => 19, "avantage_id" => 33], // Marqué par les dieux
            ["region_id" => 19, "avantage_id" => 36], // Odorat développé
            ["region_id" => 19, "avantage_id" => 45], // Récupération rapide
            ["region_id" => 19, "avantage_id" => 54], // Tigre des neiges
            // Zalut
            ["region_id" => 20, "avantage_id" => 21], // Érudit
            ["region_id" => 20, "avantage_id" => 27], // Intimidant
            ["region_id" => 20, "avantage_id" => 30], // Magie des Rois-Sorciers
            ["region_id" => 20, "avantage_id" => 44], // Pouvoir du Néant
            ["region_id" => 20, "avantage_id" => 47], // Résistant à la magie
            ["region_id" => 20, "avantage_id" => 48], // Résistant aux poisons
            ["region_id" => 20, "avantage_id" => 52], // Savant
            ["region_id" => 20, "avantage_id" => 53], // Sentir la magie
            ["region_id" => 20, "avantage_id" => 58] // Vision nocturne

        ];

        // Insérer les données dans la table des régions
        foreach ($regions_avantages as $region_avantage) {
            BolRegionAvantage::create($region_avantage);
        }
    }
}
