<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
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

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            return (new MailMessage)
                ->subject('Modification du mot de passe')
                ->greeting('Bonjour!')
                ->line('Vous recevez cet e-mail car nous avons reçu une demande de réinitialisation du mot de passe pour votre compte.')
                ->action('Réinitialiser le mot de passe', config('app.frontend_url', 'http://localhost:4200') . "/reset/{$token}?email=" . $notifiable->getEmailForPasswordReset())
                ->line('Ce lien de réinitialisation de mot de passe expirera dans 60 minutes.')
                ->line('Si vous n\'avez pas demandé de réinitialisation du mot de passe, aucune autre action n\'est requise.');
        });
    }
}
