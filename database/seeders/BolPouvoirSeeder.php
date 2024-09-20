<?php

namespace Database\Seeders;

use App\Models\Bol\BolPouvoir;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolPouvoirSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pouvoirs = [
            ['id' => 1, 'pouvoir' => 'Armes améliorées', 'description' => 'Démons avec des armes naturelles ou maîtrisant des armes humaines. Bonus aux attaques.'],
            ['id' => 2, 'pouvoir' => 'Armure', 'description' => 'Peau épaisse ou plaques osseuses offrant une protection physique de d6-2 (2).'],
            ['id' => 3, 'pouvoir' => 'Attaques dévastatrices', 'description' => 'Attaques plus puissantes, infligeant des dégâts d\'une catégorie supérieure.'],
            ['id' => 4, 'pouvoir' => 'Chair malléable', 'description' => 'Corps malléable, pouvant prendre des formes variées. Impossible à emprisonner sans sorcellerie.'],
            ['id' => 5, 'pouvoir' => 'Cuirassé', 'description' => 'Protection élevée d6 (4), mais coûte deux points de pouvoir.'],
            ['id' => 6, 'pouvoir' => 'Faculté de parole', 'description' => 'Le démon peut parler comme un humain.'],
            ['id' => 7, 'pouvoir' => 'Forme humaine', 'description' => 'Peut prendre une apparence humaine, mais retourne à sa forme démoniaque en cas de combat ou blessure.'],
            ['id' => 8, 'pouvoir' => 'Intangible', 'description' => 'Pas de corps physique, seulement vulnérable à la sorcellerie ou à l\'alchimie.'],
            ['id' => 9, 'pouvoir' => 'Poison', 'description' => 'Contact toxique provoquant paralysie et mort si le jet de vigueur est raté.'],
            ['id' => 10, 'pouvoir' => 'Progéniture', 'description' => 'Produit 1d6 rejetons par semaine, qui évoluent en démons de catégorie inférieure.'],
            ['id' => 11, 'pouvoir' => 'Régénération', 'description' => 'Régénère 1 point de dégâts par round et guérit des coups précis en deux rounds.'],
            ['id' => 12, 'pouvoir' => 'Savoir spécial', 'description' => 'Possède une carrière au rang 6.'],
            ['id' => 13, 'pouvoir' => 'Séducteur', 'description' => 'Charme irrésistible permettant de séduire et contrôler des individus faibles ou des héros.'],
            ['id' => 14, 'pouvoir' => 'Sorcellerie', 'description' => 'Capable de lancer des sorts avec des points de pouvoir selon sa catégorie démoniaque.'],
            ['id' => 15, 'pouvoir' => 'Télépathie', 'description' => 'Implante des messages dans l\'esprit d\'autrui et peut lire les pensées.'],
            ['id' => 16, 'pouvoir' => 'Vulnérabilité', 'description' => 'Une faiblesse double les dégâts reçus par certains éléments (feu, magie, etc.).'],
        ];


        Schema::disableForeignKeyConstraints();
        BolPouvoir::truncate();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($pouvoirs as $pouvoir) {
            BolPouvoir::create($pouvoir);
        }
    }
}
