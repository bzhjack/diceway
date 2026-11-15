<?php

namespace Tests\Feature;

use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** L'import d'un chapitre écrit les jets de ses scènes ; un réimport les remplace, comme le reste du texte. */
class BolSceneJetsImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_l_import_ecrit_les_jets_et_un_reimport_les_remplace(): void
    {
        $user = User::factory()->create();
        $coquillage = ['titre' => 'Coquillage', 'attributs' => ['vigueur'], 'difficulte' => 'ardue', 'echec' => 'le pied reste pris'];

        $this->importer($user, [$coquillage]);

        $this->assertSame(
            [['titre' => 'Coquillage', 'attributs' => ['vigueur'], 'difficulte' => 'ardue', 'enjeu' => null, 'echec' => 'le pied reste pris', 'reussite' => null, 'carriere' => null, 'quand' => null]],
            BolScene::where('titre', 'Les gardiens s’éveillent')->sole()->jets,
        );

        $this->importer($user, null);

        $this->assertNull(BolScene::where('titre', 'Les gardiens s’éveillent')->sole()->jets);
    }

    /** @param array<int, array<string, mixed>>|null $jets */
    private function importer(User $user, ?array $jets): void
    {
        $scene = ['cle' => 'gardiens', 'titre' => 'Les gardiens s’éveillent', 'jeu' => 'Piocher deux ou trois effets.'];
        $file = tempnam(sys_get_temp_dir(), 'import');
        file_put_contents($file, json_encode([
            'saga'        => 'essai',
            'scenario'    => ['cle' => 'ch1', 'titre' => 'Essai'],
            'personnages' => [],
            'scenes'      => [$jets === null ? $scene : [...$scene, 'jets' => $jets]],
        ]));

        try {
            $this->artisan('bol:import-scenario', ['fichier' => $file, '--user' => $user->email])->assertSuccessful();
        } finally {
            unlink($file);
        }
    }
}
