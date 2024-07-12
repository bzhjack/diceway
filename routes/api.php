<?php

use App\Http\Controllers\Bol\BolHerosController;
use App\Http\Middleware\RequestAcceptJson;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\VerifyController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Auth\ForgotController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Bol\BolRegionController;
use App\Http\Controllers\Bol\BolTraitController;
use App\Http\Controllers\Bol\BolCarriereController;
use App\Http\Controllers\Bol\BolArmureController;
use App\Http\Controllers\Bol\BolArmeController;

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
    Route::post('auth/logout', [LoginController::class, 'logout']); // déconnection
    Route::post('auth/register', [RegisterController::class, 'register']); // Création de compte
    Route::post('auth/email/send', [VerifyController::class, 'send']); // Envoi de l'email de vérification
    Route::get('auth/email/verify/{id}/{hash}', [VerifyController::class, 'verify'])->name('verification.verify'); // Lien de retour de verification du mail
    // Gestion du mot de passe
    Route::post('auth/password/forgotten', [ForgotController::class, 'forgot'])->middleware('guest')->name('password.email'); // Envoi d'un mail de reset du mdp
    Route::get('auth/password/forgotten/{token}', [ForgotController::class, 'reset'])->middleware('guest')->name('password.reset'); // Lien dans le mail de reset
    Route::post('auth/password/reset', [ForgotController::class, 'reset_password'])->middleware('guest')->name('password.update'); // Validation du changement
    // Réseaux sociaux
    Route::get('/auth/google', [SocialController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [SocialController::class, 'callbackFromGoogle']);

});

/**
 * Api protégée
 */
Route::middleware(['auth:sanctum', RequestAcceptJson::class])->group(function () {
    Route::get('auth/profile', [ProfileController::class, 'profile']);
    /**
     * BARBARIAN OF LEMURIA
     **/

    // Gestion de la région
    Route::get('/bol/region', [BolRegionController::class, 'getAll']);
    Route::get('/bol/region/{id}', [BolRegionController::class, 'getOne']);
    // Gestion des traits régionaux
    Route::get('/bol/trait/avantages', [BolTraitController::class, 'getAllAvantages']);
    Route::get('/bol/trait/desavantages', [BolTraitController::class, 'getAllDesavantages']);

    // Gestion des carrieres
    Route::get('/bol/carrieres', [BolCarriereController::class, 'getAll']);
    Route::delete('/bol/heros/carrieres/delete/{herosId}/{id}', [BolCarriereController::class, 'delete']);
    Route::post('/bol/heros/carrieres/create/{herosId}', [BolCarriereController::class, 'create']);

    // Gestion des armes
    Route::get('/bol/armes', [BolArmeController::class, 'getAll']);
    Route::post('/bol/heros/armes/create/{herosId}', [BolArmeController::class, 'create']);
    Route::delete('/bol/heros/armes/delete/{herosId}/{id}', [BolArmeController::class, 'delete']);

    // Gestion des armures
    Route::get('/bol/armures', [BolArmureController::class, 'getAll']);
    Route::post('/bol/heros/armures/create/{herosId}', [BolArmureController::class, 'create']);
    Route::delete('/bol/heros/armures/delete/{herosId}/{id}', [BolArmureController::class, 'delete']);

    // Gestion du Héros
    Route::get('/bol/heros', [BolHerosController::class, 'getAll']);
    Route::get('/bol/heros/{id}', [BolHerosController::class, 'getOne']);
    Route::post('/bol/heros/create', [BolHerosController::class, 'create']);
    Route::post('/bol/heros/update', [BolHerosController::class, 'update']);
    Route::delete('/bol/heros/delete/{id}', [BolHerosController::class, 'delete']);

    // Maj des origines
    Route::post('/bol/heros/origines/update/{herosId}', [BolHerosController::class, 'updateOrigines']);
    // Traits régionaux
    Route::post('/bol/heros/traits/update', [BolTraitController::class, 'update']);
    Route::delete('/bol/heros/traits/delete/{id}', [BolTraitController::class, 'delete']);
    Route::post('/bol/heros/traits/create/{herosId}', [BolTraitController::class, 'create']);

});
