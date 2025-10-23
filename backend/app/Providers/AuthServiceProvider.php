<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        //
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // URL personnalisée pour le reset password
        ResetPassword::createUrlUsing(function ($notifiable, $token) {
            // URL du frontend Angular
            $frontendUrl = config('app.frontend_url', 'http://localhost:4200');
            return "{$frontendUrl}/reset/{$token}?email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
