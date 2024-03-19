<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Verification de l\'adresse mail')
                ->greeting('Bienvenue !!!')
                ->line('Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail.')
                ->action('Verifier l\'adresse mail', $url);
        });
    }
}
