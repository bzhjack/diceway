<?php

namespace Database\Seeders;

use App\Models\Bol\BolCarriere;
use Illuminate\Database\Seeder;

class BolCarriereSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $carrieres = [
            ['id' => 1, 'carriere' => 'Alchimiste', 'detail' => 'artificier/inventeur', 'description' => 'Pour chaque rang d’alchimiste au-dessus du rang 2, le personnage doit prendre un désavantage'],
            ['id' => 2, 'carriere' => 'Assassin', 'detail' => 'agent/espion'],
            ['id' => 3, 'carriere' => 'Barbare', 'detail' => 'berserk/primitif'],
            ['id' => 4, 'carriere' => 'Bourreau', 'detail' => 'geôlier/esclavagiste'],
            ['id' => 5, 'carriere' => 'Chasseur', 'detail' => 'éclaireur/pisteur'],
            ['id' => 6, 'carriere' => 'Danseur', 'detail' => 'acrobate/saltimbanque'],
            ['id' => 7, 'carriere' => 'Dresseur', 'detail' => 'maître des bêtes/montreur d’ours'],
            ['id' => 8, 'carriere' => 'Esclave', 'detail' => 'serf/serviteur'],
            ['id' => 9, 'carriere' => 'Fermier', 'detail' => 'paysan/berger'],
            ['id' => 10, 'carriere' => 'Forgeron', 'detail' => 'armurier'],
            ['id' => 11, 'carriere' => 'Gladiateur', 'detail' => 'champion, belluaire'],
            ['id' => 12, 'carriere' => 'Marchand', 'detail' => 'colporteur/négociant'],
            ['id' => 13, 'carriere' => 'Marin', 'detail' => 'matelot/pirate'],
            ['id' => 14, 'carriere' => 'Médecin', 'detail' => 'guérisseur/rebouteux'],
            ['id' => 15, 'carriere' => 'Mendiant', 'detail' => 'vagabond/clochard'],
            ['id' => 16, 'carriere' => 'Ménestrel', 'detail' => 'barde/poète'],
            ['id' => 17, 'carriere' => 'Mercenaire', 'detail' => 'brigand/guerrier'],
            ['id' => 18, 'carriere' => 'Noble', 'detail' => 'aristocrate/courtisan'],
            ['id' => 19, 'carriere' => 'Ouvrier', 'detail' => 'docker/manœuvre'],
            ['id' => 20, 'carriere' => 'Pilote des airs'],
            ['id' => 21, 'carriere' => 'Prêtre', 'detail' => 'druide/chaman'],
            ['id' => 22, 'carriere' => 'Scribe', 'detail' => 'érudit/copiste'],
            ['id' => 23, 'carriere' => 'Soldat', 'detail' => 'garde/milicien'],
            ['id' => 24, 'carriere' => 'Sorcier', 'detail' => 'magicien/enchanteur', 'description' => 'Pour chaque rang de sorcier au-delà du premier, vous devez choisir un désavantage supplémentaire'],
            ['id' => 25, 'carriere' => 'Tentatrice', 'detail' => 'courtisane/serveuse'],
            ['id' => 26, 'carriere' => 'Voleur', 'detail' => 'filou/crapule'],

            // Ajoutez d'autres régions selon vos besoins
        ];
        BolCarriere::truncate();
        // Insérer les données dans la table des régions
        foreach ($carrieres as $carriere) {
            BolCarriere::create($carriere);
        }
    }
}
