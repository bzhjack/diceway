<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolSceneDistribution;
use PHPUnit\Framework\TestCase;

class BolSceneDistributionTest extends TestCase
{
    public function test_entry_camp_defaults_to_adversaires_for_scenes_saved_before_camps_existed(): void
    {
        $this->assertSame('adversaires', BolSceneDistribution::entryCamp(['kind' => 'pnj', 'source_id' => 'p', 'qty' => 1]));
        $this->assertSame('adversaires', BolSceneDistribution::entryCamp(['camp' => 'n-importe-quoi']));
        $this->assertSame('adversaires', BolSceneDistribution::entryCamp(['camp' => null]));
    }

    public function test_entry_camp_keeps_an_ally_with_the_heroes(): void
    {
        $this->assertSame('heros', BolSceneDistribution::entryCamp(['camp' => 'heros']));
    }

    public function test_entry_attitude_rejects_unknown(): void
    {
        $this->assertNull(BolSceneDistribution::entryAttitude(['attitude' => 'furieux']));
        $this->assertNull(BolSceneDistribution::entryAttitude([]));
        $this->assertSame('amical', BolSceneDistribution::entryAttitude(['attitude' => 'amical']));
    }

    public function test_regroupee_joins_copies_of_one_sheet_in_one_camp_with_one_attitude(): void
    {
        $garde = ['kind' => 'pnj', 'source_id' => 'g', 'qty' => 1, 'camp' => 'adversaires', 'attitude' => 'hostile'];
        $loup = ['kind' => 'creature', 'source_id' => 'l', 'qty' => 2, 'camp' => 'adversaires', 'attitude' => null];

        $entries = BolSceneDistribution::regroupee([
            $garde,
            $loup,
            $garde,
            array_replace($garde, ['camp' => 'heros']),
            array_replace($garde, ['attitude' => 'neutre']),
            $loup,
            array_replace($loup, ['kind' => 'demon']),
            $garde,
        ]);

        $this->assertSame([
            array_replace($garde, ['qty' => 3]),
            array_replace($loup, ['qty' => 4]),
            array_replace($garde, ['camp' => 'heros']),
            array_replace($garde, ['attitude' => 'neutre']),
            array_replace($loup, ['kind' => 'demon']),
        ], $entries);
    }

    public function test_regroupee_caps_the_copies(): void
    {
        $loup = ['kind' => 'creature', 'source_id' => 'l', 'qty' => 20, 'camp' => 'adversaires', 'attitude' => null];

        $this->assertSame(BolSceneDistribution::QTY_MAX, BolSceneDistribution::regroupee([$loup, $loup])[0]['qty']);
    }
}
