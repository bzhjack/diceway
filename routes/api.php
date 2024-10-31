<?php

use App\Http\Controllers\Bol\BolCreatureController;
use App\Http\Controllers\Bol\BolHerosController;
use App\Http\Controllers\Bol\BolLangueController;
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
use App\Http\Controllers\Bol\BolPnjController;
use App\Http\Controllers\Bol\BolDemonController;
use App\Http\Controllers\Bol\BolDashboardController;
use App\Http\Controllers\Bol\BolQuestController;
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
    // Gestion du dashboard
    Route::get('/bol/dashboard/count', [BolDashboardController::class, 'getCounts']);
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

    // Gestion des langues
    Route::get('/bol/langues', [BolLangueController::class, 'getAll']);
    Route::delete('/bol/heros/langues/delete/{herosId}/{id}', [BolLangueController::class, 'delete']);
    Route::post('/bol/heros/langues/create/{herosId}', [BolLangueController::class, 'create']);

    // Gestion des armes
    Route::get('/bol/armes', [BolArmeController::class, 'getAll']);
    Route::post('/bol/heros/armes/create/{herosId}', [BolArmeController::class, 'create']);
    Route::delete('/bol/heros/armes/delete/{herosId}/{id}', [BolArmeController::class, 'delete']);

    // Gestion des armures
    Route::get('/bol/armures', [BolArmureController::class, 'getAll']);
    Route::post('/bol/heros/armures/create/{herosId}', [BolArmureController::class, 'create']);
    Route::delete('/bol/heros/armures/delete/{herosId}/{id}', [BolArmureController::class, 'delete']);

    // Gestion des créatures
    Route::get('/bol/creature', [BolCreatureController::class, 'getAll']);
    Route::post('/bol/creature/create', [BolCreatureController::class, 'create']);
    Route::post('/bol/creature/update', [BolCreatureController::class, 'update']);
    Route::delete('/bol/creature/delete/{id}', [BolCreatureController::class, 'delete']);
    Route::get('/bol/creature/tailles', [BolCreatureController::class, 'getAllTailles']);
    Route::get('/bol/creature/capacites', [BolCreatureController::class, 'getAllCapacites']);

    // Gestion des démons
    Route::get('/bol/demon', [BolDemonController::class, 'getAll']);
    Route::post('/bol/demon/create', [BolDemonController::class, 'create']);
    Route::post('/bol/demon/update', [BolDemonController::class, 'update']);
    Route::delete('/bol/demon/delete/{id}', [BolDemonController::class, 'delete']);
    Route::get('/bol/demon/categories', [BolDemonController::class, 'getAllCategories']);
    Route::get('/bol/demon/pouvoirs', [BolDemonController::class, 'getAllPouvoirs']);

    // Gestion du Héros
    Route::get('/bol/heros', [BolHerosController::class, 'getAll']);
    Route::get('/bol/heros/{id}', [BolHerosController::class, 'getOne']);
    Route::post('/bol/heros/create', [BolHerosController::class, 'create']);
    Route::post('/bol/heros/update', [BolHerosController::class, 'update']);
    Route::delete('/bol/heros/delete/{id}', [BolHerosController::class, 'delete']);

    // Gestion de Pnj
    Route::get('/bol/pnj', [BolPnjController::class, 'getAll']);
    Route::get('/bol/pnj/{id}', [BolPnjController::class, 'getOne']);
    Route::post('/bol/pnj/create', [BolPnjController::class, 'create']);
    Route::post('/bol/pnj/update', [BolPnjController::class, 'update']);
    Route::delete('/bol/pnj/delete/{id}', [BolPnjController::class, 'delete']);

    // Maj des origines
    Route::post('/bol/heros/origines/update/{herosId}', [BolHerosController::class, 'updateOrigines']);

    // Traits régionaux
    Route::delete('/bol/heros/traits/delete/{id}', [BolTraitController::class, 'delete']);
    Route::post('/bol/heros/traits/create/{herosId}', [BolTraitController::class, 'create']);
    Route::delete('/bol/heros/traits/delete/{herosId}/{id}', [BolTraitController::class, 'delete']);

    // Gestion des aventures
    Route::get('/bol/quest', [BolQuestController::class, 'getAll']);
    Route::post('/bol/quest/create', [BolQuestController::class, 'create']);
    Route::post('/bol/quest/update', [BolQuestController::class, 'update']);
    Route::get('/bol/quest/{id}', [BolQuestController::class, 'getOne']);
    Route::delete('/bol/quest/protagonist/{id}', [BolQuestController::class, 'deleteProtagonist']);
    Route::get('/bol/quest/protagonist/{id}', [BolQuestController::class, 'getOneProtagonist']);
    Route::post('/bol/quest/protagonist/create', [BolQuestController::class, 'addProtagonist']);
    Route::post('/bol/quest/protagonist/update', [BolQuestController::class, 'updateProtagonist']);
});
