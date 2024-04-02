<?php

namespace Database\Seeders;

use App\Models\BolCarriere;
use Illuminate\Database\Seeder;

class BolCarriereSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $carrieres = [
            ['id' => 1, 'name' => 'Alchimiste', 'description' => 'artificier/inventeur'],
            ['id' => 2, 'name' => 'Assassin', 'description' => 'agent/espion'],
            ['id' => 3, 'name' => 'Barbare', 'description' => 'berserk/primitif'],
            ['id' => 4, 'name' => 'Bourreau', 'description' => 'geôlier/esclavagiste'],
            ['id' => 5, 'name' => 'Chasseur', 'description' => 'éclaireur/pisteur'],
            ['id' => 6, 'name' => 'Danseur', 'description' => 'acrobate/saltimbanque'],
            ['id' => 7, 'name' => 'Dresseur', 'description' => 'maître des bêtes/montreur d’ours'],
            ['id' => 8, 'name' => 'Esclave', 'description' => 'serf/serviteur'],
            ['id' => 9, 'name' => 'Fermier', 'description' => 'paysan/berger'],
            ['id' => 10, 'name' => 'Forgeron', 'description' => 'armurier'],
            ['id' => 11, 'name' => 'Gladiateur', 'description' => 'champion, belluaire'],
            ['id' => 12, 'name' => 'Marchand', 'description' => 'colporteur/négociant'],
            ['id' => 13, 'name' => 'Marin', 'description' => 'matelot/pirate'],
            ['id' => 14, 'name' => 'Médecin', 'description' => 'guérisseur/rebouteux'],
            ['id' => 15, 'name' => 'Mendiant', 'description' => 'vagabond/clochard'],
            ['id' => 16, 'name' => 'Ménestrel', 'description' => 'barde/poète'],
            ['id' => 17, 'name' => 'Mercenaire', 'description' => 'brigand/guerrier'],
            ['id' => 18, 'name' => 'Noble', 'description' => 'aristocrate/courtisan'],
            ['id' => 19, 'name' => 'Ouvrier', 'description' => 'docker/manœuvre'],
            ['id' => 20, 'name' => 'Pilote des airs', 'description' => ''],
            ['id' => 21, 'name' => 'Prêtre', 'description' => 'druide/chaman'],
            ['id' => 22, 'name' => 'Scribe', 'description' => 'érudit/copiste'],
            ['id' => 23, 'name' => 'Soldat', 'description' => 'garde/milicien'],
            ['id' => 24, 'name' => 'Sorcier', 'description' => 'magicien/enchanteur'],
            ['id' => 25, 'name' => 'Tentatrice', 'description' => 'courtisane/serveuse'],
            ['id' => 26, 'name' => 'Voleur', 'description' => 'filou/crapule'],

            // Ajoutez d'autres régions selon vos besoins
        ];

        // Insérer les données dans la table des régions
        foreach ($carrieres as $carriere) {
            BolCarriere::create($carriere);
        }
    }
}
