<?php

use App\Http\Middleware\RequestAcceptJson;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\VerifyController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ForgotController;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

/**
 * Api publiques
 */
Route::middleware([RequestAcceptJson::class])->group(function () {
    Route::post('auth/login', [LoginController::class, 'login']); // Authentification 
    Route::post('auth/register', [RegisterController::class, 'register']); // Création de compte
    Route::post('auth/email/send', [VerifyController::class, 'send']); // Envoi de l'email de vérification
    Route::get('auth/email/verify/{id}/{hash}', [VerifyController::class, 'verify'])->name('verification.verify'); // Lien de retour de verification du mail
    Route::post('auth/password/forgotten', [ForgotController::class, 'forgot'])->middleware('guest')->name('password.email');
    Route::get('auth/password/forgot/{token}',[ForgotController::class, 'reset'])->middleware('guest')->name('password.reset');
    Route::post('auth/password/reset',[ForgotController::class, 'reset_password'])->middleware('guest')->name('password.update');
});