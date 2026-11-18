<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** La connexion par mot de passe : 5 essais par minute pour un même email depuis une même adresse, puis 429. */
class LoginThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_sixth_attempt_within_a_minute_is_refused(): void
    {
        User::factory()->create(['email' => 'axel@example.com']);

        for ($essai = 0; $essai < 5; $essai++) {
            $this->postJson('/api/auth/login', ['email' => 'axel@example.com', 'password' => 'mauvais'])->assertUnauthorized();
        }

        $this->postJson('/api/auth/login', ['email' => 'axel@example.com', 'password' => 'password'])->assertTooManyRequests();
    }

    public function test_the_limit_is_per_email(): void
    {
        User::factory()->create(['email' => 'axel@example.com']);
        User::factory()->create(['email' => 'balaram@example.com']);

        for ($essai = 0; $essai < 5; $essai++) {
            $this->postJson('/api/auth/login', ['email' => 'Axel@example.com', 'password' => 'mauvais']);
        }

        $this->postJson('/api/auth/login', ['email' => 'axel@example.com', 'password' => 'password'])->assertTooManyRequests();
        $this->postJson('/api/auth/login', ['email' => 'balaram@example.com', 'password' => 'password'])->assertOk();
    }

    public function test_a_minute_later_the_account_can_log_in_again(): void
    {
        User::factory()->create(['email' => 'axel@example.com']);

        for ($essai = 0; $essai < 5; $essai++) {
            $this->postJson('/api/auth/login', ['email' => 'axel@example.com', 'password' => 'mauvais']);
        }
        $this->travel(61)->seconds();

        $this->postJson('/api/auth/login', ['email' => 'axel@example.com', 'password' => 'password'])->assertOk();
    }
}
