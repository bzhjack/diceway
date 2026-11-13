<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolSceneDistribution;
use PHPUnit\Framework\TestCase;

class BolSceneDistributionTest extends TestCase
{
    public function test_builds_entries_in_pnj_creature_demon_order(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => 'p-uuid']],
            [['id' => 3, 'creature_id' => '48', 'qty' => 2]],
            [['id' => 9, 'demon_id' => 'd-uuid', 'qty' => 1]],
        );

        $this->assertSame(['pnj', 'creature', 'demon'], array_column($entries, 'kind'));
        $this->assertSame(['p-uuid', '48', 'd-uuid'], array_column($entries, 'source_id'));
        $this->assertSame([1, 2, 1], array_column($entries, 'qty'));
    }

    public function test_skips_rows_whose_library_source_was_deleted(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => null]],
            [['id' => 3, 'creature_id' => null, 'qty' => 2], ['id' => 4, 'creature_id' => 'c', 'qty' => 1]],
            [['id' => 9, 'demon_id' => '', 'qty' => 1]],
        );

        $this->assertCount(1, $entries);
        $this->assertSame('c', $entries[0]['source_id']);
    }

    public function test_treats_a_missing_or_invalid_quantity_as_one(): void
    {
        $entries = BolSceneDistribution::fromSession([], [['id' => 3, 'creature_id' => 'c', 'qty' => 0]], []);

        $this->assertSame(1, $entries[0]['qty']);
    }

    public function test_records_the_camp_of_each_row(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => 'p', 'camp' => 'heros']],
            [['id' => 3, 'creature_id' => 'c', 'qty' => 1, 'camp' => 'adversaires']],
            [['id' => 9, 'demon_id' => 'd', 'qty' => 1]],
        );

        $this->assertSame(['heros', 'adversaires', 'adversaires'], array_column($entries, 'camp'));
    }

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

    public function test_from_session_keeps_attitude(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => 'p', 'attitude' => 'mefiant'], ['id' => 8, 'pnj_id' => 'q']],
            [['id' => 3, 'creature_id' => 'c', 'qty' => 1, 'attitude' => 'hostile']],
            [],
        );

        $this->assertSame(['mefiant', null, 'hostile'], array_column($entries, 'attitude'));
    }

    public function test_entry_attitude_rejects_unknown(): void
    {
        $this->assertNull(BolSceneDistribution::entryAttitude(['attitude' => 'furieux']));
        $this->assertNull(BolSceneDistribution::entryAttitude([]));
        $this->assertSame('amical', BolSceneDistribution::entryAttitude(['attitude' => 'amical']));
    }
}
