<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolScenePreparation;
use PHPUnit\Framework\TestCase;

class BolScenePreparationTest extends TestCase
{
    public function test_pistes_trims_and_drops_blank(): void
    {
        $this->assertSame(
            [['texte' => 'Suivre les traces', 'scene_id' => null]],
            BolScenePreparation::pistes([['texte' => '  Suivre les traces  ', 'scene_id' => null], ['texte' => '   ']], []),
        );
    }

    public function test_pistes_unknown_scene_loses_its_link(): void
    {
        $result = BolScenePreparation::pistes([['texte' => 'A', 'scene_id' => 'zzz'], ['texte' => 'B', 'scene_id' => 's2']], ['s2', 's3']);

        $this->assertNull($result[0]['scene_id']);
        $this->assertSame('s2', $result[1]['scene_id']);
    }

    public function test_pistes_keeps_eight_and_cuts_texte_at_200(): void
    {
        $pistes = array_fill(0, 10, ['texte' => str_repeat('é', 250), 'scene_id' => null]);

        $result = BolScenePreparation::pistes($pistes, []);

        $this->assertCount(8, $result);
        $this->assertSame(200, mb_strlen($result[0]['texte']));
    }

    public function test_pistes_empty_is_null(): void
    {
        $this->assertNull(BolScenePreparation::pistes([], []));
        $this->assertNull(BolScenePreparation::pistes(null, []));
        $this->assertNull(BolScenePreparation::pistes([['texte' => ' ']], []));
    }

    public function test_played_appends_each_scene_once(): void
    {
        $this->assertSame(['a'], BolScenePreparation::played(null, 'a'));
        $this->assertSame(['a'], BolScenePreparation::played(['a'], 'a'));
        $this->assertSame(['a', 'b'], BolScenePreparation::played(['a'], 'b'));
    }

    public function test_played_keeps_the_last_hundred(): void
    {
        $played = array_map(fn ($i) => "s$i", range(1, 100));

        $result = BolScenePreparation::played($played, 'nouvelle');

        $this->assertCount(100, $result);
        $this->assertSame('s2', $result[0]);
        $this->assertSame('nouvelle', $result[99]);
    }
}
