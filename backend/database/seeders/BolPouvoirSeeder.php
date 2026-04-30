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
            ['id' =>  1, 'pouvoir' => 'Armes améliorées',    'description' => 'Dé de bonus à toutes les attaques (griffes, crocs, lames, bec, queue, etc.).', 'avantage_attaque' => true],
            ['id' =>  2, 'pouvoir' => 'Armure',              'description' => 'Protection d6-2 (2).'],
            ['id' =>  3, 'pouvoir' => 'Attaques dévastatrices', 'description' => 'Les dégâts passent à la catégorie de taille supérieure.', 'degats_superieurs' => true],
            ['id' =>  4, 'pouvoir' => 'Chair malléable',     'description' => 'Corps déformable ; aucun lien ni prison ne le retient, sauf sorcellerie.'],
            ['id' =>  5, 'pouvoir' => 'Cuirassé',            'description' => 'Protection d6 (4) ; compte comme 2 pouvoirs.'],
            ['id' =>  6, 'pouvoir' => 'Faculté de parole',   'description' => 'Peut parler comme un humain.'],
            ['id' =>  7, 'pouvoir' => 'Forme humaine',       'description' => 'Prend l\'apparence humaine ; retour à la forme démoniaque dès qu\'il se bat ou est blessé.'],
            ['id' =>  8, 'pouvoir' => 'Intangible',          'description' => 'Pas de corps physique dans cette dimension ; blessé uniquement par sorcellerie ou alchimie.', 'intangible' => true, 'avertissement_combat' => true],
            ['id' =>  9, 'pouvoir' => 'Poison',              'description' => 'Contact paralysant ; jet de vigueur Difficile (−2) pour éviter la paralysie. Paralysé = mort dans l\'heure sauf nouveau jet Difficile (−2) réussi.', 'avertissement_combat' => true],
            ['id' => 10, 'pouvoir' => 'Progéniture',         'description' => 'Produit 1d6 rejetons par semaine, considérés comme piétaille la 1re semaine puis comme démons mineurs d\'une catégorie en dessous.'],
            ['id' => 11, 'pouvoir' => 'Régénération',        'description' => 'Récupère 1 PV par round ; se débarrasse des effets d\'un coup précis au bout de 2 rounds.', 'regeneration' => true],
            ['id' => 12, 'pouvoir' => 'Savoir spécial',      'description' => 'Possède une carrière au rang 6.'],
            ['id' => 13, 'pouvoir' => 'Séducteur',           'description' => 'Peut asservir 1d6+6 piétaille. Un héros résiste via un jet d\'esprit.', 'avertissement_combat' => true],
            ['id' => 14, 'pouvoir' => 'Sorcellerie',         'description' => 'Réserve de pouvoir selon la catégorie : mineur 2, inférieur 5, majeur 10.'],
            ['id' => 15, 'pouvoir' => 'Télépathie',          'description' => 'Communication mentale et lecture de pensées.'],
            ['id' => 16, 'pouvoir' => 'Vulnérabilité',       'description' => 'Ajoute un pouvoir supplémentaire mais donne une faiblesse : un élément inflige le double des dégâts (magie, feu, électricité, fer, acide...), ou un élément inoffensif pour les humains devient dommageable (lumière du jour, eau, musique, symboles...).', 'avertissement_combat' => true],
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
