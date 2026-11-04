<?php

namespace Tests\Feature;

use App\Models\Bol\BolFightSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Une table se crée toujours nommée. */
class BolFightSessionCreateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_creates_a_named_table(): void
    {
        $response = $this->postJson('/api/bol/fight-session/create', ['titre' => '  Les veillées  '])->assertOk();

        $this->assertSame('Les veillées', $response->json('titre'));
    }

    public function test_refuses_a_table_without_name(): void
    {
        foreach ([[], ['titre' => null], ['titre' => '   ']] as $payload) {
            $this->postJson('/api/bol/fight-session/create', $payload)->assertUnprocessable()->assertJsonValidationErrors('titre');
        }

        $this->assertSame(0, BolFightSession::count());
    }

    public function test_refuses_a_name_longer_than_the_column(): void
    {
        $this->postJson('/api/bol/fight-session/create', ['titre' => str_repeat('a', 256)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('titre');
    }
}
