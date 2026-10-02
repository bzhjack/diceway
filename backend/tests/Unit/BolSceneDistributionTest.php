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
            [],
        );

        $this->assertSame(['pnj', 'creature', 'demon'], array_column($entries, 'kind'));
        $this->assertSame(['p-uuid', '48', 'd-uuid'], array_column($entries, 'source_id'));
        $this->assertSame([1, 2, 1], array_column($entries, 'qty'));
    }

    public function test_reads_one_position_per_instance_and_null_when_never_moved(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => 'p']],
            [['id' => 3, 'creature_id' => 'c', 'qty' => 3]],
            [],
            [
                'pnj-7'        => ['x' => 10, 'y' => 20.5],
                'creature-3-1' => ['x' => 71.5, 'y' => 30],
            ],
        );

        $this->assertSame([['x' => 10.0, 'y' => 20.5]], $entries[0]['positions']);
        $this->assertSame([null, ['x' => 71.5, 'y' => 30.0], null], $entries[1]['positions']);
    }

    public function test_skips_rows_whose_library_source_was_deleted(): void
    {
        $entries = BolSceneDistribution::fromSession(
            [['id' => 7, 'pnj_id' => null]],
            [['id' => 3, 'creature_id' => null, 'qty' => 2], ['id' => 4, 'creature_id' => 'c', 'qty' => 1]],
            [['id' => 9, 'demon_id' => '', 'qty' => 1]],
            null,
        );

        $this->assertCount(1, $entries);
        $this->assertSame('c', $entries[0]['source_id']);
    }

    public function test_never_includes_heroes_even_when_their_positions_are_stored(): void
    {
        $entries = BolSceneDistribution::fromSession([], [], [], ['hero-1' => ['x' => 5, 'y' => 5]]);

        $this->assertSame([], $entries);
    }

    public function test_treats_a_missing_or_invalid_quantity_as_one(): void
    {
        $entries = BolSceneDistribution::fromSession([], [['id' => 3, 'creature_id' => 'c', 'qty' => 0]], [], []);

        $this->assertSame(1, $entries[0]['qty']);
        $this->assertSame([null], $entries[0]['positions']);
    }

    public function test_token_positions_only_cover_instances_that_were_moved(): void
    {
        $entry = ['kind' => 'creature', 'source_id' => 'c', 'qty' => 3, 'positions' => [null, ['x' => 71.5, 'y' => 30], null]];

        $this->assertSame(
            ['creature-12-1' => ['x' => 71.5, 'y' => 30.0]],
            BolSceneDistribution::tokenPositions('creature', 12, $entry),
        );
    }

    public function test_token_positions_use_the_pnj_key_without_instance_index(): void
    {
        $entry = ['kind' => 'pnj', 'source_id' => 'p', 'qty' => 1, 'positions' => [['x' => 10, 'y' => 20]]];

        $this->assertSame(['pnj-5' => ['x' => 10.0, 'y' => 20.0]], BolSceneDistribution::tokenPositions('pnj', 5, $entry));
    }

    public function test_token_positions_ignore_extra_or_malformed_positions(): void
    {
        $entry = ['kind' => 'demon', 'source_id' => 'd', 'qty' => 1, 'positions' => [['x' => 'abc', 'y' => 2], ['x' => 1, 'y' => 2]]];

        $this->assertSame([], BolSceneDistribution::tokenPositions('demon', 4, $entry));
    }

    public function test_token_positions_are_empty_when_the_entry_has_no_positions(): void
    {
        $this->assertSame([], BolSceneDistribution::tokenPositions('creature', 4, ['kind' => 'creature', 'qty' => 2]));
    }

    public function test_hero_positions_only_drops_every_other_token(): void
    {
        $kept = BolSceneDistribution::heroPositionsOnly([
            'hero-1'       => ['x' => 1, 'y' => 1],
            'pnj-7'        => ['x' => 2, 'y' => 2],
            'creature-3-0' => ['x' => 3, 'y' => 3],
            'demon-9-0'    => ['x' => 4, 'y' => 4],
        ]);

        $this->assertSame(['hero-1' => ['x' => 1, 'y' => 1]], $kept);
    }

    public function test_hero_positions_only_accepts_null(): void
    {
        $this->assertSame([], BolSceneDistribution::heroPositionsOnly(null));
    }
}
